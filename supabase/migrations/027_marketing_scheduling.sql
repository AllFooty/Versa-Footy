-- Phase 2/F: scheduled campaigns.
-- Adds scheduled_for + scheduled_params to marketing_campaigns and the RPCs the
-- admin UI / dispatcher need. The dispatcher (edge function) is invoked by pg_cron
-- every minute and atomically claims due rows before sending.

ALTER TABLE public.marketing_campaigns
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_params jsonb;

-- Partial index so the dispatcher's "due now" query is cheap.
CREATE INDEX IF NOT EXISTS marketing_campaigns_due_idx
  ON public.marketing_campaigns (scheduled_for)
  WHERE status = 'scheduled';

-- ---------------------------------------------------------------------------
-- Admin: create a scheduled campaign.
-- Returns the new campaign id. Stores send params in scheduled_params jsonb so
-- the dispatcher has everything it needs to fire the send when due.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.marketing_schedule_campaign(
  p_subject text,
  p_html text,
  p_audience text,
  p_scheduled_for timestamptz,
  p_segment_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_test_recipient text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_id uuid;
  v_params jsonb;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
  END IF;

  IF p_subject IS NULL OR p_html IS NULL OR p_audience IS NULL THEN
    RAISE EXCEPTION 'subject, html, audience are required';
  END IF;
  IF p_scheduled_for IS NULL OR p_scheduled_for <= now() THEN
    RAISE EXCEPTION 'scheduled_for must be in the future';
  END IF;
  IF p_audience NOT IN ('subscribers','opted_in_users','all_users','segment') THEN
    -- 'test' deliberately excluded — no point scheduling a self-test.
    RAISE EXCEPTION 'invalid audience for scheduling: %', p_audience;
  END IF;
  IF p_audience = 'segment' AND p_segment_id IS NULL THEN
    RAISE EXCEPTION 'segment_id required when audience=segment';
  END IF;

  v_params := jsonb_build_object(
    'subject', p_subject,
    'html', p_html,
    'audience', p_audience,
    'segmentId', p_segment_id,
    'category', p_category,
    'testRecipient', p_test_recipient
  );

  INSERT INTO public.marketing_campaigns (
    subject, html, audience, category, test_recipient,
    sent_by, total_recipients, status, scheduled_for, scheduled_params
  ) VALUES (
    p_subject, p_html, p_audience, p_category, p_test_recipient,
    auth.uid(), 0, 'scheduled', p_scheduled_for, v_params
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_schedule_campaign(text, text, text, timestamptz, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_schedule_campaign(text, text, text, timestamptz, uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin: list scheduled (and recently-canceled) campaigns.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.marketing_list_scheduled()
RETURNS TABLE (
  id uuid,
  subject text,
  audience text,
  category text,
  scheduled_for timestamptz,
  status text,
  created_at timestamptz,
  segment_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    c.id, c.subject, c.audience, c.category, c.scheduled_for, c.status, c.created_at,
    NULLIF(c.scheduled_params->>'segmentId','')::uuid AS segment_id
  FROM public.marketing_campaigns c
  WHERE c.scheduled_for IS NOT NULL
    AND (c.status IN ('scheduled','sending')
         OR (c.status = 'canceled' AND c.scheduled_for > now() - interval '7 days'))
  ORDER BY c.scheduled_for ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_list_scheduled() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_list_scheduled() TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin: cancel a scheduled campaign. Atomic — only succeeds while still
-- 'scheduled', so it can't race the dispatcher.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.marketing_cancel_scheduled(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_updated int;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.marketing_campaigns
  SET status = 'canceled'
  WHERE id = p_id AND status = 'scheduled';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_cancel_scheduled(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_cancel_scheduled(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin: change a scheduled campaign's send time.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.marketing_reschedule_campaign(p_id uuid, p_new_time timestamptz)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_updated int;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
  END IF;
  IF p_new_time IS NULL OR p_new_time <= now() THEN
    RAISE EXCEPTION 'new time must be in the future';
  END IF;

  UPDATE public.marketing_campaigns
  SET scheduled_for = p_new_time
  WHERE id = p_id AND status = 'scheduled';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_reschedule_campaign(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_reschedule_campaign(uuid, timestamptz) TO authenticated;

-- ---------------------------------------------------------------------------
-- Service-role only: atomically claim due rows. Flips scheduled→sending so the
-- cancel UI can't race; rows that come back are owned by this dispatcher run.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.marketing_claim_due_scheduled(p_limit int DEFAULT 20)
RETURNS TABLE (id uuid, scheduled_params jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH due AS (
    SELECT c.id
    FROM public.marketing_campaigns c
    WHERE c.status = 'scheduled' AND c.scheduled_for <= now()
    ORDER BY c.scheduled_for ASC
    LIMIT GREATEST(p_limit, 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.marketing_campaigns c
  SET status = 'sending'
  FROM due
  WHERE c.id = due.id
  RETURNING c.id, c.scheduled_params;
$$;

REVOKE ALL ON FUNCTION public.marketing_claim_due_scheduled(int) FROM PUBLIC, anon, authenticated;
-- service_role bypasses GRANT; no explicit grant needed.

NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Manual step (run AFTER deploying the dispatch-scheduled-emails edge function):
-- Requires pg_cron + pg_net extensions and the project URL + service role key.
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- SELECT cron.schedule(
--   'marketing-dispatch-scheduled',
--   '* * * * *',
--   $$ SELECT net.http_post(
--        url := 'https://knbksbvzzliuxwvyjzoj.supabase.co/functions/v1/dispatch-scheduled-emails',
--        headers := jsonb_build_object(
--          'Content-Type', 'application/json',
--          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--        ),
--        body := '{}'::jsonb
--      ); $$
-- );
--
-- (Set app.settings.service_role_key at the project level OR inline the key.
--  Inline key is fine for a private DB; just don't paste it into shared docs.)
-- ---------------------------------------------------------------------------
