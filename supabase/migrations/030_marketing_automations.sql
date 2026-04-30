-- Phase 2/G: drip automations.
-- Three trigger types:
--   signup_welcome  — anchor = profile.created_at
--   inactivity      — anchor = profile.last_practice_date  (config: { days_inactive })
--   level_reached   — anchor = now() at first observation  (config: { level })
--
-- A run = (automation, step, user). UNIQUE on that triple → send-at-most-once
-- enforced at the DB layer. scheduled_for = anchor + step.delay_days.
-- Each step has a lazily-created marketing_campaigns row that all sends append to,
-- so RecentCampaignsPanel/analytics aggregate per step over time.

CREATE TABLE IF NOT EXISTS public.marketing_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('signup_welcome','inactivity','level_reached')),
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_automation_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.marketing_automations(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  delay_days int NOT NULL DEFAULT 0 CHECK (delay_days >= 0),
  subject text NOT NULL,
  html text NOT NULL,
  subject_ar text,
  html_ar text,
  category text,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (automation_id, step_order)
);

CREATE TABLE IF NOT EXISTS public.marketing_automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.marketing_automations(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES public.marketing_automation_steps(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  anchor_at timestamptz NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed','skipped')),
  sent_at timestamptz,
  error_message text,
  resend_email_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (automation_id, step_id, user_id)
);

CREATE INDEX IF NOT EXISTS marketing_automation_runs_due_idx
  ON public.marketing_automation_runs (scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS marketing_automation_steps_aid_idx
  ON public.marketing_automation_steps (automation_id, step_order);

-- updated_at trigger (reuse the templates one if it exists, but make our own for clarity).
CREATE OR REPLACE FUNCTION public._marketing_automations_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS marketing_automations_touch_updated_at ON public.marketing_automations;
CREATE TRIGGER marketing_automations_touch_updated_at
BEFORE UPDATE ON public.marketing_automations
FOR EACH ROW EXECUTE FUNCTION public._marketing_automations_touch_updated_at();

DROP TRIGGER IF EXISTS marketing_automation_steps_touch_updated_at ON public.marketing_automation_steps;
CREATE TRIGGER marketing_automation_steps_touch_updated_at
BEFORE UPDATE ON public.marketing_automation_steps
FOR EACH ROW EXECUTE FUNCTION public._marketing_automations_touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: admins only.
-- ---------------------------------------------------------------------------
ALTER TABLE public.marketing_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_automation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_automation_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- automations
  EXECUTE 'DROP POLICY IF EXISTS "admins all automations" ON public.marketing_automations';
  EXECUTE $p$CREATE POLICY "admins all automations" ON public.marketing_automations
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin))$p$;

  EXECUTE 'DROP POLICY IF EXISTS "admins all steps" ON public.marketing_automation_steps';
  EXECUTE $p$CREATE POLICY "admins all steps" ON public.marketing_automation_steps
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin))$p$;

  EXECUTE 'DROP POLICY IF EXISTS "admins read runs" ON public.marketing_automation_runs';
  EXECUTE $p$CREATE POLICY "admins read runs" ON public.marketing_automation_runs
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin))$p$;
END$$;

-- ---------------------------------------------------------------------------
-- Service-role: enroll eligible users.
-- For each active automation, for each step, insert run rows for any user that
-- matches the trigger and isn't already enrolled. UNIQUE constraint makes this
-- idempotent — re-running never double-sends.
-- ---------------------------------------------------------------------------
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
BEGIN
  FOR v_a IN SELECT * FROM public.marketing_automations WHERE is_active LOOP
    FOR v_s IN SELECT * FROM public.marketing_automation_steps WHERE automation_id = v_a.id ORDER BY step_order LOOP

      IF v_a.trigger_type = 'signup_welcome' THEN
        WITH inserted AS (
          INSERT INTO public.marketing_automation_runs
            (automation_id, step_id, user_id, anchor_at, scheduled_for)
          SELECT v_a.id, v_s.id, p.id, p.created_at,
                 p.created_at + make_interval(days => v_s.delay_days)
          FROM public.profiles p
          WHERE p.email IS NOT NULL
            AND p.marketing_unsubscribe_token IS NOT NULL
            AND p.marketing_unsubscribed_at IS NULL
          ON CONFLICT (automation_id, step_id, user_id) DO NOTHING
          RETURNING 1
        )
        SELECT v_inserted + COALESCE(count(*), 0) INTO v_inserted FROM inserted;

      ELSIF v_a.trigger_type = 'inactivity' THEN
        v_inactive := COALESCE((v_a.trigger_config->>'days_inactive')::int, 14);
        WITH inserted AS (
          INSERT INTO public.marketing_automation_runs
            (automation_id, step_id, user_id, anchor_at, scheduled_for)
          SELECT v_a.id, v_s.id, p.id,
                 COALESCE(pp.last_practice_date::timestamptz, p.created_at),
                 COALESCE(pp.last_practice_date::timestamptz, p.created_at)
                   + make_interval(days => v_inactive + v_s.delay_days)
          FROM public.profiles p
          LEFT JOIN public.player_profiles pp ON pp.id = p.id
          WHERE p.email IS NOT NULL
            AND p.marketing_unsubscribe_token IS NOT NULL
            AND p.marketing_unsubscribed_at IS NULL
            AND (
              pp.last_practice_date IS NULL OR
              pp.last_practice_date <= (current_date - v_inactive)
            )
          ON CONFLICT (automation_id, step_id, user_id) DO NOTHING
          RETURNING 1
        )
        SELECT v_inserted + COALESCE(count(*), 0) INTO v_inserted FROM inserted;

      ELSIF v_a.trigger_type = 'level_reached' THEN
        v_level := COALESCE((v_a.trigger_config->>'level')::int, 5);
        -- Anchor = now() since we don't track when level was hit.
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

-- ---------------------------------------------------------------------------
-- Service-role: claim due runs (pending + scheduled_for <= now()) atomically.
-- Returns the rows the dispatcher should send. Race-safe via SKIP LOCKED.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.marketing_automation_claim_due(p_limit int DEFAULT 50)
RETURNS TABLE (
  run_id uuid,
  automation_id uuid,
  step_id uuid,
  user_id uuid,
  step_order int,
  subject text,
  html text,
  subject_ar text,
  html_ar text,
  category text,
  step_campaign_id uuid,
  email text,
  full_name text,
  current_level int,
  current_streak int,
  locale text,
  marketing_unsubscribe_token text,
  marketing_preferences jsonb,
  marketing_unsubscribed_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH due AS (
    SELECT r.id
    FROM public.marketing_automation_runs r
    WHERE r.status = 'pending' AND r.scheduled_for <= now()
    ORDER BY r.scheduled_for ASC
    LIMIT GREATEST(p_limit, 1)
    FOR UPDATE SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.marketing_automation_runs r
    SET status = 'sending'
    FROM due
    WHERE r.id = due.id
    RETURNING r.*
  )
  SELECT
    c.id AS run_id, c.automation_id, c.step_id, c.user_id,
    s.step_order, s.subject, s.html, s.subject_ar, s.html_ar, s.category, s.campaign_id AS step_campaign_id,
    p.email, p.full_name, pp.current_level, pp.current_streak, p.locale,
    p.marketing_unsubscribe_token, p.marketing_preferences, p.marketing_unsubscribed_at
  FROM claimed c
  JOIN public.marketing_automation_steps s ON s.id = c.step_id
  JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN public.player_profiles pp ON pp.id = p.id;
$$;

REVOKE ALL ON FUNCTION public.marketing_automation_claim_due(int) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Service-role: lazily create or fetch the campaign row tied to a step. The
-- dispatcher uses this so all sends for a step append to the same campaign,
-- giving RecentCampaignsPanel one row per (automation, step) over time.
-- ---------------------------------------------------------------------------
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
  SELECT campaign_id INTO v_existing FROM public.marketing_automation_steps WHERE id = p_step_id;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  SELECT * INTO v_step FROM public.marketing_automation_steps WHERE id = p_step_id;
  IF v_step IS NULL THEN RAISE EXCEPTION 'step not found: %', p_step_id; END IF;
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

-- ---------------------------------------------------------------------------
-- Admin: list automations with step + run counts.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.marketing_automations_list()
RETURNS TABLE (
  id uuid, name text, trigger_type text, trigger_config jsonb, is_active boolean,
  step_count bigint, runs_pending bigint, runs_sent bigint, runs_failed bigint,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501'; END IF;

  RETURN QUERY
  SELECT a.id, a.name, a.trigger_type, a.trigger_config, a.is_active,
    (SELECT count(*) FROM public.marketing_automation_steps s WHERE s.automation_id = a.id) AS step_count,
    (SELECT count(*) FROM public.marketing_automation_runs r WHERE r.automation_id = a.id AND r.status = 'pending') AS runs_pending,
    (SELECT count(*) FROM public.marketing_automation_runs r WHERE r.automation_id = a.id AND r.status = 'sent') AS runs_sent,
    (SELECT count(*) FROM public.marketing_automation_runs r WHERE r.automation_id = a.id AND r.status = 'failed') AS runs_failed,
    a.created_at, a.updated_at
  FROM public.marketing_automations a
  ORDER BY a.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_automations_list() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_automations_list() TO authenticated;

NOTIFY pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Manual step (run AFTER deploying the dispatch-automation-runs function):
-- SELECT cron.schedule(
--   'marketing-dispatch-automations',
--   '*/15 * * * *',
--   $$ SELECT net.http_post(
--        url := 'https://knbksbvzzliuxwvyjzoj.supabase.co/functions/v1/dispatch-automation-runs',
--        headers := jsonb_build_object(
--          'Content-Type', 'application/json',
--          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--        ),
--        body := '{}'::jsonb
--      ); $$
-- );
-- ---------------------------------------------------------------------------
