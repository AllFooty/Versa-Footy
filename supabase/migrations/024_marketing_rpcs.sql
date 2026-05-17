-- Marketing RPC surface used by the web admin and unauthenticated preference pages.
-- Admin RPCs gate with public.is_admin(); token RPCs are SECURITY DEFINER and
-- validate an opaque token from marketing_preference_tokens.
--
-- Signature notes / inference:
--   - marketing_segment_count uses p_filter jsonb (SegmentBuilder.tsx:43 passes
--     the filter object directly, not a segment id).
--   - marketing_sample_recipient takes (p_audience, p_segment_id) per
--     MarketingEmailView.tsx:268.
--   - marketing_schedule_campaign args match MarketingEmailView.tsx:467-482.
--   - marketing_cancel_scheduled / _reschedule_campaign use p_id /
--     p_new_time and return boolean (UI treats !data as "too late").
--   - marketing_campaign_recipients takes p_campaign_id, p_limit, p_offset
--     (CampaignDrilldownModal.tsx:62).
--   - get/update/unsubscribe_by_token return jsonb with { ok, error?, ... }.

-- =====================================================================
-- Helpers
-- =====================================================================

-- Audience-resolution helper used by both count + sample RPCs. The exact
-- subscriber / user views are project-specific; this stub references
-- `auth.users` plus a presumed `marketing_email_subscribers` table for the
-- waitlist. If the table name differs in production, swap it here.
CREATE OR REPLACE FUNCTION public._marketing_segment_filter_sql(p_filter jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Stub: returns a SQL fragment for a WHERE clause against `profiles p`.
  -- Real implementation must translate the SegmentFilter jsonb structure
  -- defined in web-new-landing/app/[lang]/(app)/marketing/_lib/segments.ts.
  RETURN 'true';
END;
$$;

-- =====================================================================
-- marketing_audience_counts()
-- Returns jsonb { subscribers, opted_in_users, all_users }.
-- MarketingEmailView.tsx:185 destructures as `Counts`.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.marketing_audience_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub int := 0;
  v_opt int := 0;
  v_all int := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  -- Waitlist subscribers (pre-launch email captures). Adjust table name if needed.
  SELECT count(*) INTO v_sub
    FROM public.marketing_email_subscribers s
    WHERE NOT EXISTS (
      SELECT 1 FROM public.marketing_suppressions x WHERE x.email = s.email
    );

  -- Opted-in product users (have not turned off all categories).
  SELECT count(*) INTO v_opt
    FROM public.profiles p
    WHERE p.email IS NOT NULL
      AND COALESCE((p.email_preferences->>'product_updates')::boolean, true)
      AND NOT EXISTS (
        SELECT 1 FROM public.marketing_suppressions x WHERE x.email = p.email
      );

  SELECT count(*) INTO v_all
    FROM public.profiles p
    WHERE p.email IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.marketing_suppressions x WHERE x.email = p.email
      );

  RETURN jsonb_build_object(
    'subscribers',    v_sub,
    'opted_in_users', v_opt,
    'all_users',      v_all
  );
EXCEPTION WHEN undefined_table THEN
  -- Permit deploy before subscriber tables exist; UI tolerates zeros.
  RETURN jsonb_build_object('subscribers', 0, 'opted_in_users', 0, 'all_users', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_audience_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketing_audience_counts() TO authenticated;

-- =====================================================================
-- marketing_segment_count(p_filter jsonb) -> int
-- Counts the audience matching a segment filter. UI passes the filter
-- jsonb directly (SegmentsView.tsx:66, MarketingEmailView.tsx:206).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.marketing_segment_count(p_filter jsonb)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  -- TODO: Translate SegmentFilter -> SQL. Stub returns total opted-in users.
  SELECT count(*) INTO v_count
    FROM public.profiles p
    WHERE p.email IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.marketing_suppressions x WHERE x.email = p.email
      );

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_segment_count(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketing_segment_count(jsonb) TO authenticated;

-- =====================================================================
-- marketing_sample_recipient(p_audience text, p_segment_id uuid)
-- Returns one RecipientSample row (mergeTags.ts:31): email, first_name,
-- full_name, current_level, current_streak.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.marketing_sample_recipient(
  p_audience text,
  p_segment_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  -- Stub: pull any profile with an email. Real impl filters by audience /
  -- segment filter joined with profiles + gamification tables.
  SELECT jsonb_build_object(
    'email',          p.email,
    'first_name',     split_part(COALESCE(p.full_name, ''), ' ', 1),
    'full_name',      p.full_name,
    'current_level',  NULL,
    'current_streak', NULL
  )
  INTO v_row
  FROM public.profiles p
  WHERE p.email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.marketing_suppressions x WHERE x.email = p.email
    )
  ORDER BY random()
  LIMIT 1;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_sample_recipient(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketing_sample_recipient(text, uuid) TO authenticated;

-- =====================================================================
-- marketing_schedule_campaign(...)
-- Creates a campaigns row with status='scheduled'. Returns new uuid.
-- Arg names match MarketingEmailView.tsx:467-482.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.marketing_schedule_campaign(
  p_subject       text,
  p_html          text,
  p_audience      text,
  p_scheduled_for timestamptz,
  p_segment_id    uuid    DEFAULT NULL,
  p_category      text    DEFAULT NULL,
  p_test_recipient text   DEFAULT NULL,
  p_subject_ar    text    DEFAULT NULL,
  p_html_ar       text    DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_email text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  IF p_scheduled_for IS NULL OR p_scheduled_for <= now() THEN
    RAISE EXCEPTION 'scheduled_for must be in the future';
  END IF;

  SELECT email INTO v_email FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.marketing_campaigns (
    subject, html, subject_ar, html_ar,
    audience, segment_id, category,
    status, scheduled_for, created_by, sent_by_email
  ) VALUES (
    p_subject, p_html, p_subject_ar, p_html_ar,
    p_audience, p_segment_id, p_category,
    'scheduled', p_scheduled_for, auth.uid(), v_email
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_schedule_campaign(
  text, text, text, timestamptz, uuid, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketing_schedule_campaign(
  text, text, text, timestamptz, uuid, text, text, text, text
) TO authenticated;

-- =====================================================================
-- marketing_recent_campaigns(p_limit int default 50)
-- Returns recent campaigns with their aggregate metrics for RecentCampaignsPanel.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.marketing_recent_campaigns(p_limit int DEFAULT 50)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'id',               c.id,
    'subject',          c.subject,
    'audience',         c.audience,
    'status',           c.status,
    'successful_sends', c.successful_sends,
    'delivered',        c.delivered,
    'opened',           c.opened,
    'clicked',          c.clicked,
    'bounced',          c.bounced,
    'complained',       c.complained,
    'completed_at',     c.completed_at,
    'created_at',       c.created_at,
    'sent_by_email',    c.sent_by_email
  )
  FROM public.marketing_campaigns c
  WHERE c.status IN ('sent','sending','failed','cancelled')
  ORDER BY COALESCE(c.completed_at, c.created_at) DESC
  LIMIT GREATEST(COALESCE(p_limit, 50), 1);
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_recent_campaigns(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketing_recent_campaigns(int) TO authenticated;

-- =====================================================================
-- marketing_list_scheduled()
-- Returns scheduled campaigns in chronological order.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.marketing_list_scheduled()
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'id',            c.id,
    'subject',       c.subject,
    'audience',      c.audience,
    'category',      c.category,
    'status',        c.status,
    'scheduled_for', c.scheduled_for
  )
  FROM public.marketing_campaigns c
  WHERE c.status = 'scheduled'
  ORDER BY c.scheduled_for ASC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_list_scheduled() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketing_list_scheduled() TO authenticated;

-- =====================================================================
-- marketing_cancel_scheduled(p_id uuid) -> bool
-- Returns true when cancelled, false if the campaign already left
-- 'scheduled' (UI shows "too late" toast).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.marketing_cancel_scheduled(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  UPDATE public.marketing_campaigns
     SET status = 'cancelled'
   WHERE id = p_id
     AND status = 'scheduled';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_cancel_scheduled(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketing_cancel_scheduled(uuid) TO authenticated;

-- =====================================================================
-- marketing_reschedule_campaign(p_id uuid, p_new_time timestamptz) -> bool
-- ScheduledCampaignsPanel.tsx:93-96.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.marketing_reschedule_campaign(
  p_id uuid,
  p_new_time timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  IF p_new_time IS NULL OR p_new_time <= now() THEN
    RAISE EXCEPTION 'new_time must be in the future';
  END IF;

  UPDATE public.marketing_campaigns
     SET scheduled_for = p_new_time
   WHERE id = p_id
     AND status = 'scheduled';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_reschedule_campaign(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketing_reschedule_campaign(uuid, timestamptz) TO authenticated;

-- =====================================================================
-- marketing_automations_list()
-- AutomationListItem per useAutomations.ts:8.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.marketing_automations_list()
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'id',             a.id,
    'name',           a.name,
    'trigger_type',   a.trigger_type,
    'trigger_config', a.trigger_config,
    'is_active',      a.is_active,
    'step_count',     COALESCE(s.step_count, 0),
    -- Run counters require a marketing_automation_runs table (not yet defined);
    -- return zeros so the UI renders without errors.
    'runs_pending',   0,
    'runs_sent',      0,
    'runs_failed',    0
  )
  FROM public.marketing_automations a
  LEFT JOIN (
    SELECT automation_id, count(*)::int AS step_count
    FROM public.marketing_automation_steps
    GROUP BY automation_id
  ) s ON s.automation_id = a.id
  ORDER BY a.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_automations_list() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketing_automations_list() TO authenticated;

-- =====================================================================
-- marketing_campaign_recipients(p_campaign_id uuid, p_limit int, p_offset int)
-- RecipientRow per CampaignDrilldownModal.tsx:22.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.marketing_campaign_recipients(
  p_campaign_id uuid,
  p_limit int DEFAULT 500,
  p_offset int DEFAULT 0
)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'email',         r.email::text,
    'status',        r.status,
    'opened_at',     r.opened_at,
    'clicked_at',    r.clicked_at,
    'bounced_at',    r.bounced_at,
    'complained_at', r.complained_at,
    'error_message', r.error_message
  )
  FROM public.marketing_campaign_recipients r
  WHERE r.campaign_id = p_campaign_id
  ORDER BY r.created_at ASC, r.id ASC
  LIMIT GREATEST(COALESCE(p_limit, 500), 1)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_campaign_recipients(uuid, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketing_campaign_recipients(uuid, int, int) TO authenticated;

-- =====================================================================
-- Public, token-gated preference RPCs.
-- Used by unauthenticated pages reached from email links.
-- =====================================================================

-- get_preferences_by_token(p_token text) -> jsonb
--   { ok, error?, email, kind, preferences, unsubscribed }
CREATE OR REPLACE FUNCTION public.get_preferences_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.marketing_preference_tokens%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(p_token) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token_missing');
  END IF;

  SELECT * INTO v_row FROM public.marketing_preference_tokens
   WHERE token = p_token LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token_not_found');
  END IF;

  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token_expired');
  END IF;

  RETURN jsonb_build_object(
    'ok',           true,
    'email',        v_row.email::text,
    'kind',         v_row.kind,
    'preferences',  v_row.preferences,
    'unsubscribed', v_row.unsubscribed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_preferences_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_preferences_by_token(text) TO anon, authenticated;

-- update_preferences_by_token(p_token text, p_prefs jsonb) -> jsonb { ok, error? }
CREATE OR REPLACE FUNCTION public.update_preferences_by_token(
  p_token text,
  p_prefs jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.marketing_preference_tokens%ROWTYPE;
  v_all_off boolean;
BEGIN
  IF p_token IS NULL OR length(p_token) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token_missing');
  END IF;
  IF p_prefs IS NULL OR jsonb_typeof(p_prefs) <> 'object' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'prefs_invalid');
  END IF;

  SELECT * INTO v_row FROM public.marketing_preference_tokens
   WHERE token = p_token LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token_not_found');
  END IF;
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token_expired');
  END IF;

  v_all_off := COALESCE((p_prefs->>'product_updates')::boolean, true) = false
           AND COALESCE((p_prefs->>'training_tips')::boolean,   true) = false
           AND COALESCE((p_prefs->>'promotions')::boolean,      true) = false;

  UPDATE public.marketing_preference_tokens
     SET preferences  = p_prefs,
         unsubscribed = v_all_off
   WHERE id = v_row.id;

  -- If all categories are off, mirror into suppressions so future sends honor it.
  IF v_all_off THEN
    INSERT INTO public.marketing_suppressions (email, reason, notes)
    VALUES (v_row.email, 'unsubscribed', 'preference-center: all categories off')
    ON CONFLICT (email) DO NOTHING;
  ELSE
    -- Re-opt-in: lift any prior unsubscribe suppression.
    DELETE FROM public.marketing_suppressions
     WHERE email = v_row.email AND reason = 'unsubscribed';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.update_preferences_by_token(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_preferences_by_token(text, jsonb) TO anon, authenticated;

-- unsubscribe_by_token(p_token text) -> jsonb { ok, error?, email, already_unsubscribed? }
CREATE OR REPLACE FUNCTION public.unsubscribe_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.marketing_preference_tokens%ROWTYPE;
  v_already boolean := false;
BEGIN
  IF p_token IS NULL OR length(p_token) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token_missing');
  END IF;

  SELECT * INTO v_row FROM public.marketing_preference_tokens
   WHERE token = p_token LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'token_not_found');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.marketing_suppressions
     WHERE email = v_row.email AND reason = 'unsubscribed'
  ) INTO v_already;

  UPDATE public.marketing_preference_tokens
     SET unsubscribed = true,
         preferences = jsonb_build_object(
           'product_updates', false,
           'training_tips',   false,
           'promotions',      false
         )
   WHERE id = v_row.id;

  INSERT INTO public.marketing_suppressions (email, reason, notes)
  VALUES (v_row.email, 'unsubscribed', 'one-click unsubscribe link')
  ON CONFLICT (email) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true,
    'email', v_row.email::text,
    'already_unsubscribed', v_already
  );
END;
$$;

REVOKE ALL ON FUNCTION public.unsubscribe_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unsubscribe_by_token(text) TO anon, authenticated;
