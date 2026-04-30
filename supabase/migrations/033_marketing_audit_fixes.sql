-- Phase 2/L: audit fixes (P0-1, P0-3, P1-2, P1-4, P1-5, P1-6, P1-7, P1-8, P2-1, P2-2, P2-6).
--
-- See marketing audit report 2026-04-30 for context.
-- This migration is idempotent and safe to re-run.

-- ===========================================================================
-- P0-1: Backfill suppression on automation activation.
-- Adds activated_at to marketing_automations. Set automatically when is_active
-- flips false → true. Enrollment gates on this so flipping a "Welcome day-3"
-- automation on doesn't retroactively enroll every user older than 3 days.
-- ===========================================================================
ALTER TABLE public.marketing_automations
  ADD COLUMN IF NOT EXISTS activated_at timestamptz;

-- Backfill: any currently-active automation gets activated_at = updated_at
-- (best approximation of when activation last happened).
UPDATE public.marketing_automations
SET activated_at = COALESCE(updated_at, created_at)
WHERE is_active AND activated_at IS NULL;

CREATE OR REPLACE FUNCTION public._marketing_automations_set_activated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_active AND (OLD.is_active IS DISTINCT FROM TRUE) THEN
    NEW.activated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marketing_automations_set_activated_at ON public.marketing_automations;
CREATE TRIGGER marketing_automations_set_activated_at
BEFORE UPDATE OF is_active ON public.marketing_automations
FOR EACH ROW EXECUTE FUNCTION public._marketing_automations_set_activated_at();

-- For new INSERTs that come in already-active.
CREATE OR REPLACE FUNCTION public._marketing_automations_set_activated_at_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_active AND NEW.activated_at IS NULL THEN
    NEW.activated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marketing_automations_set_activated_at_insert ON public.marketing_automations;
CREATE TRIGGER marketing_automations_set_activated_at_insert
BEFORE INSERT ON public.marketing_automations
FOR EACH ROW EXECUTE FUNCTION public._marketing_automations_set_activated_at_insert();

-- Re-create enrollment with backfill gate.
CREATE OR REPLACE FUNCTION public.marketing_automation_enroll()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted int := 0;
  v_a record;
  v_s record;
  v_inactive int;
  v_level int;
  v_anchor_floor timestamptz;
BEGIN
  FOR v_a IN SELECT * FROM public.marketing_automations WHERE is_active LOOP
    -- Anchor floor: never enroll a user whose anchor is before activation.
    -- Belt-and-braces: COALESCE to created_at so legacy rows still work.
    v_anchor_floor := COALESCE(v_a.activated_at, v_a.created_at);

    FOR v_s IN SELECT * FROM public.marketing_automation_steps WHERE automation_id = v_a.id ORDER BY step_order LOOP

      IF v_a.trigger_type = 'signup_welcome' THEN
        -- Only NEW signups (created_at >= activated_at). Existing users are skipped.
        WITH inserted AS (
          INSERT INTO public.marketing_automation_runs
            (automation_id, step_id, user_id, anchor_at, scheduled_for)
          SELECT v_a.id, v_s.id, p.id, p.created_at,
                 p.created_at + make_interval(days => v_s.delay_days)
          FROM public.profiles p
          WHERE p.email IS NOT NULL
            AND p.marketing_unsubscribe_token IS NOT NULL
            AND p.marketing_unsubscribed_at IS NULL
            AND p.created_at >= v_anchor_floor
          ON CONFLICT (automation_id, step_id, user_id) DO NOTHING
          RETURNING 1
        )
        SELECT v_inserted + COALESCE(count(*), 0) INTO v_inserted FROM inserted;

      ELSIF v_a.trigger_type = 'inactivity' THEN
        v_inactive := COALESCE((v_a.trigger_config->>'days_inactive')::int, 14);
        -- Only fire for users whose last_practice_date is on/after activation.
        -- This means: a user who was already inactive when we activated does
        -- NOT get the email. They need to come back, then go inactive again.
        -- Prevents blasting years-old inactive accounts.
        WITH inserted AS (
          INSERT INTO public.marketing_automation_runs
            (automation_id, step_id, user_id, anchor_at, scheduled_for)
          SELECT v_a.id, v_s.id, p.id,
                 pp.last_practice_date::timestamptz,
                 pp.last_practice_date::timestamptz
                   + make_interval(days => v_inactive + v_s.delay_days)
          FROM public.profiles p
          JOIN public.player_profiles pp ON pp.id = p.id
          WHERE p.email IS NOT NULL
            AND p.marketing_unsubscribe_token IS NOT NULL
            AND p.marketing_unsubscribed_at IS NULL
            AND pp.last_practice_date IS NOT NULL
            AND pp.last_practice_date::timestamptz >= v_anchor_floor
            AND pp.last_practice_date <= (current_date - v_inactive)
          ON CONFLICT (automation_id, step_id, user_id) DO NOTHING
          RETURNING 1
        )
        SELECT v_inserted + COALESCE(count(*), 0) INTO v_inserted FROM inserted;

      ELSIF v_a.trigger_type = 'level_reached' THEN
        v_level := COALESCE((v_a.trigger_config->>'level')::int, 5);
        -- Anchor = now() (no historical level data). Already non-retroactive.
        WITH inserted AS (
          INSERT INTO public.marketing_automation_runs
            (automation_id, step_id, user_id, anchor_at, scheduled_for)
          SELECT v_a.id, v_s.id, p.id, now(),
                 now() + make_interval(days => v_s.delay_days)
          FROM public.profiles p
          JOIN public.player_profiles pp ON pp.id = p.id
          WHERE p.email IS NOT NULL
            AND p.marketing_unsubscribe_token IS NOT NULL
            AND p.marketing_unsubscribed_at IS NULL
            AND COALESCE(pp.current_level, 0) >= v_level
          ON CONFLICT (automation_id, step_id, user_id) DO NOTHING
          RETURNING 1
        )
        SELECT v_inserted + COALESCE(count(*), 0) INTO v_inserted FROM inserted;
      END IF;

    END LOOP;
  END LOOP;

  RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_automation_enroll() FROM PUBLIC, anon, authenticated;

-- ===========================================================================
-- P0-3: Atomic claim for resend-campaign-failures.
-- Transitions failed rows to 'resending' so concurrent invocations can't
-- double-send to the same address. Returned emails are owned by the caller.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.marketing_campaign_claim_failures(p_campaign_id uuid)
RETURNS TABLE (email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH claimed AS (
    UPDATE public.marketing_sends s
    SET status = 'resending'
    WHERE s.campaign_id = p_campaign_id AND s.status = 'failed'
    RETURNING s.email
  )
  SELECT DISTINCT email FROM claimed WHERE email IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.marketing_campaign_claim_failures(uuid) FROM PUBLIC, anon, authenticated;
-- service_role only; called by resend-campaign-failures edge function.

-- ===========================================================================
-- P1-2 / P1-4: Reaper for stuck 'sending' campaigns + 'sending' automation runs.
-- An edge function that times out can leave a row in flight forever. This
-- function flips anything stuck for >30 minutes back to a recoverable state.
-- Run via pg_cron every 10 min (manual step, see bottom of file).
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.marketing_reap_stuck_sends(p_age_minutes int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_camp int;
  v_runs int;
  v_threshold timestamptz := now() - make_interval(mins => GREATEST(p_age_minutes, 5));
BEGIN
  -- Stale campaigns stuck in 'sending'. Mark failed so the dashboard shows
  -- the issue; admin can use "Resend to failures" to recover.
  WITH reaped AS (
    UPDATE public.marketing_campaigns
    SET status = 'failed', completed_at = now()
    WHERE status = 'sending' AND created_at < v_threshold
    RETURNING 1
  )
  SELECT count(*)::int INTO v_camp FROM reaped;

  -- Stale automation runs stuck in 'sending'. Reset to pending so they retry.
  WITH reaped AS (
    UPDATE public.marketing_automation_runs
    SET status = 'pending'
    WHERE status = 'sending' AND created_at < v_threshold
    RETURNING 1
  )
  SELECT count(*)::int INTO v_runs FROM reaped;

  RETURN jsonb_build_object(
    'reaped_campaigns', v_camp,
    'reaped_automation_runs', v_runs,
    'threshold', v_threshold
  );
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_reap_stuck_sends(int) FROM PUBLIC, anon, authenticated;
-- service_role + admins (so admin can manually trigger via SQL editor).
GRANT EXECUTE ON FUNCTION public.marketing_reap_stuck_sends(int) TO authenticated;

-- ===========================================================================
-- P1-5: Lock the steps row in marketing_automation_ensure_step_campaign so
-- two dispatcher invocations can't both insert orphan campaigns.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.marketing_automation_ensure_step_campaign(p_step_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing uuid;
  v_step record;
  v_aut record;
  v_new_id uuid;
BEGIN
  -- Lock the steps row for the duration of the transaction. Blocks any
  -- concurrent ensure() call until this one commits, eliminating the race.
  SELECT * INTO v_step FROM public.marketing_automation_steps WHERE id = p_step_id FOR UPDATE;
  IF v_step IS NULL THEN RAISE EXCEPTION 'step not found: %', p_step_id; END IF;
  IF v_step.campaign_id IS NOT NULL THEN RETURN v_step.campaign_id; END IF;

  SELECT * INTO v_aut FROM public.marketing_automations WHERE id = v_step.automation_id;

  INSERT INTO public.marketing_campaigns
    (subject, html, subject_ar, html_ar, audience, category,
     sent_by, total_recipients, status)
  VALUES
    (v_step.subject, v_step.html, v_step.subject_ar, v_step.html_ar,
     'automation:' || v_aut.id || ':step:' || v_step.step_order,
     v_step.category, NULL, 0, 'sending')
  RETURNING id INTO v_new_id;

  UPDATE public.marketing_automation_steps SET campaign_id = v_new_id WHERE id = p_step_id;
  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_automation_ensure_step_campaign(uuid) FROM PUBLIC, anon, authenticated;

-- ===========================================================================
-- P1-6: case-insensitive email lookup for suppress() in resend-webhook.
-- profiles.email is not enforced lowercase at the DB level; webhook events
-- arrive lowercased. Use this RPC to update both tables case-insensitively.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.marketing_suppress_user_by_email(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email IS NULL OR p_email = '' THEN RETURN; END IF;
  UPDATE public.profiles
  SET marketing_opt_in = false,
      marketing_unsubscribed_at = COALESCE(marketing_unsubscribed_at, now())
  WHERE LOWER(email) = LOWER(p_email);

  UPDATE public.marketing_subscribers
  SET unsubscribed_at = COALESCE(unsubscribed_at, now())
  WHERE LOWER(email) = LOWER(p_email);
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_suppress_user_by_email(text) FROM PUBLIC, anon, authenticated;
-- service_role only (called by resend-webhook).

-- ===========================================================================
-- P1-7: Apply daily rate limit to scheduled campaigns too.
-- Re-creates marketing_schedule_campaign with the rate-limit check inside.
-- The dispatcher does not re-check; the limit is on what the admin can queue.
-- ===========================================================================
DROP FUNCTION IF EXISTS public.marketing_schedule_campaign(text, text, text, timestamptz, uuid, text, text, text, text);

CREATE OR REPLACE FUNCTION public.marketing_schedule_campaign(
  p_subject text,
  p_html text,
  p_audience text,
  p_scheduled_for timestamptz,
  p_segment_id uuid DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_test_recipient text DEFAULT NULL,
  p_subject_ar text DEFAULT NULL,
  p_html_ar text DEFAULT NULL
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
  v_count int;
  v_limit int := COALESCE(NULLIF(current_setting('app.marketing_daily_limit', true), '')::int, 10);
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
    RAISE EXCEPTION 'invalid audience for scheduling: %', p_audience;
  END IF;
  IF p_audience = 'segment' AND p_segment_id IS NULL THEN
    RAISE EXCEPTION 'segment_id required when audience=segment';
  END IF;
  IF (p_subject_ar IS NULL) <> (p_html_ar IS NULL) THEN
    RAISE EXCEPTION 'subject_ar and html_ar must both be set or both be null';
  END IF;

  -- Rate limit. Counts non-test campaigns this admin already created today,
  -- regardless of status (scheduled, sending, completed). Cancellations don't
  -- count. Mirrors marketing_admin_daily_count semantics.
  SELECT count(*)::int INTO v_count
  FROM public.marketing_campaigns
  WHERE sent_by = auth.uid()
    AND created_at >= date_trunc('day', now())
    AND audience <> 'test'
    AND status NOT IN ('canceled');
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'daily campaign limit reached (%). cancel a queued one or wait until tomorrow.', v_limit USING ERRCODE = '42P10';
  END IF;

  v_params := jsonb_build_object(
    'subject', p_subject,
    'html', p_html,
    'audience', p_audience,
    'segmentId', p_segment_id,
    'category', p_category,
    'testRecipient', p_test_recipient,
    'subject_ar', p_subject_ar,
    'html_ar', p_html_ar
  );

  INSERT INTO public.marketing_campaigns (
    subject, html, subject_ar, html_ar, audience, category, test_recipient,
    sent_by, total_recipients, status, scheduled_for, scheduled_params
  ) VALUES (
    p_subject, p_html, p_subject_ar, p_html_ar, p_audience, p_category, p_test_recipient,
    auth.uid(), 0, 'scheduled', p_scheduled_for, v_params
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_schedule_campaign(text, text, text, timestamptz, uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_schedule_campaign(text, text, text, timestamptz, uuid, text, text, text, text) TO authenticated;

-- ===========================================================================
-- P1-8: Tighten token-length checks. Tokens are encode(gen_random_bytes(16), 'hex')
-- which is exactly 32 lowercase hex chars. Reject anything else.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.unsubscribe_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_found boolean := false;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[a-f0-9]{32}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  UPDATE public.marketing_subscribers
  SET unsubscribed_at = now()
  WHERE unsubscribe_token = p_token AND unsubscribed_at IS NULL
  RETURNING email INTO v_email;
  IF v_email IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'email', v_email);
  END IF;

  UPDATE public.profiles
  SET marketing_opt_in = false,
      marketing_unsubscribed_at = now()
  WHERE marketing_unsubscribe_token = p_token AND marketing_unsubscribed_at IS NULL
  RETURNING email INTO v_email;
  IF v_email IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'email', v_email);
  END IF;

  SELECT true INTO v_found FROM public.marketing_subscribers WHERE unsubscribe_token = p_token;
  IF v_found THEN
    RETURN jsonb_build_object('ok', true, 'already_unsubscribed', true);
  END IF;
  SELECT true INTO v_found FROM public.profiles WHERE marketing_unsubscribe_token = p_token;
  IF v_found THEN
    RETURN jsonb_build_object('ok', true, 'already_unsubscribed', true);
  END IF;

  RETURN jsonb_build_object('ok', false, 'error', 'token_not_found');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_preferences_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_email text;
  v_prefs jsonb;
  v_unsubbed timestamptz;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[a-f0-9]{32}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  SELECT email, marketing_preferences, marketing_unsubscribed_at
    INTO v_email, v_prefs, v_unsubbed
  FROM public.profiles
  WHERE marketing_unsubscribe_token = p_token;

  IF v_email IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'kind', 'user',
      'email', v_email,
      'unsubscribed', v_unsubbed IS NOT NULL,
      'preferences', COALESCE(v_prefs, jsonb_build_object(
        'product_updates', true,
        'training_tips', true,
        'promotions', true
      ))
    );
  END IF;

  SELECT email, unsubscribed_at INTO v_email, v_unsubbed
  FROM public.marketing_subscribers
  WHERE unsubscribe_token = p_token;
  IF v_email IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'kind', 'subscriber',
      'email', v_email,
      'unsubscribed', v_unsubbed IS NOT NULL
    );
  END IF;

  RETURN jsonb_build_object('ok', false, 'error', 'token_not_found');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_preferences_by_token(p_token text, p_prefs jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_prod boolean;
  v_tips boolean;
  v_promo boolean;
  v_all_off boolean;
  v_clean_prefs jsonb;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[a-f0-9]{32}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  v_prod  := COALESCE((p_prefs->>'product_updates')::boolean, true);
  v_tips  := COALESCE((p_prefs->>'training_tips')::boolean, true);
  v_promo := COALESCE((p_prefs->>'promotions')::boolean, true);
  v_clean_prefs := jsonb_build_object(
    'product_updates', v_prod,
    'training_tips', v_tips,
    'promotions', v_promo
  );
  v_all_off := NOT (v_prod OR v_tips OR v_promo);

  UPDATE public.profiles
  SET marketing_preferences = v_clean_prefs,
      marketing_unsubscribed_at = CASE WHEN v_all_off THEN now() ELSE NULL END,
      marketing_opt_in = CASE WHEN v_all_off THEN false ELSE marketing_opt_in END
  WHERE marketing_unsubscribe_token = p_token
  RETURNING email INTO v_email;

  IF v_email IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'kind', 'user', 'email', v_email, 'preferences', v_clean_prefs);
  END IF;

  UPDATE public.marketing_subscribers
  SET unsubscribed_at = CASE WHEN v_all_off THEN now() ELSE NULL END
  WHERE unsubscribe_token = p_token
  RETURNING email INTO v_email;

  IF v_email IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'kind', 'subscriber', 'email', v_email);
  END IF;

  RETURN jsonb_build_object('ok', false, 'error', 'token_not_found');
END;
$$;

-- ===========================================================================
-- P2-1: Drop the redundant FOR ALL RLS policy on marketing_suppressions left
-- behind by 023. 031 added split SELECT/DELETE policies; the FOR ALL still
-- allows admins to INSERT/UPDATE directly, contradicting the documented
-- "service-role only writes from webhook" design.
-- ===========================================================================
DROP POLICY IF EXISTS marketing_suppressions_admin_all ON public.marketing_suppressions;

-- ===========================================================================
-- P2-2: Make marketing_subscribers email UNIQUE case-insensitive.
-- The constraint name says "lower" but it's UNIQUE(email) only. Direct admin
-- INSERTs via the dashboard could create case-variant duplicates.
-- ===========================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'marketing_subscribers_email_lower_unique'
      AND conrelid = 'public.marketing_subscribers'::regclass
  ) THEN
    ALTER TABLE public.marketing_subscribers
      DROP CONSTRAINT marketing_subscribers_email_lower_unique;
  END IF;
END$$;

-- Pre-clean any duplicate-by-lower pairs before adding the index, so the
-- migration doesn't fail on existing data. Keeps the oldest row per email.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY lower(email) ORDER BY subscribed_at, id) AS rn
  FROM public.marketing_subscribers
)
DELETE FROM public.marketing_subscribers
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS marketing_subscribers_email_lower_unique
  ON public.marketing_subscribers (lower(email));

-- ===========================================================================
-- P2-6: Filter test sends out of marketing_recent_campaigns.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.marketing_recent_campaigns(p_limit integer DEFAULT 20)
RETURNS jsonb
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

  RETURN (
    SELECT COALESCE(jsonb_agg(row), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object(
        'id', c.id,
        'subject', c.subject,
        'audience', c.audience,
        'status', c.status,
        'created_at', c.created_at,
        'completed_at', c.completed_at,
        'scheduled_for', c.scheduled_for,
        'total_recipients', c.total_recipients,
        'successful_sends', c.successful_sends,
        'failed_sends', c.failed_sends,
        'sent_by_email', sb.email,
        'delivered', (SELECT count(*) FROM public.marketing_sends s WHERE s.campaign_id = c.id AND s.delivery_status = 'delivered'),
        'opened', (SELECT count(*) FROM public.marketing_sends s WHERE s.campaign_id = c.id AND s.open_count > 0),
        'clicked', (SELECT count(*) FROM public.marketing_sends s WHERE s.campaign_id = c.id AND s.click_count > 0),
        'bounced', (SELECT count(*) FROM public.marketing_sends s WHERE s.campaign_id = c.id AND s.delivery_status = 'bounced'),
        'complained', (SELECT count(*) FROM public.marketing_sends s WHERE s.campaign_id = c.id AND s.delivery_status = 'complained')
      ) AS row
      FROM public.marketing_campaigns c
      LEFT JOIN public.profiles sb ON sb.id = c.sent_by
      WHERE c.audience <> 'test'
      ORDER BY c.created_at DESC
      LIMIT p_limit
    ) t
  );
END;
$$;

NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Manual step: schedule the reaper. Run AFTER applying this migration.
--
-- SELECT cron.schedule(
--   'marketing-reap-stuck',
--   '*/10 * * * *',
--   $$ SELECT public.marketing_reap_stuck_sends(30); $$
-- );
-- ---------------------------------------------------------------------------
