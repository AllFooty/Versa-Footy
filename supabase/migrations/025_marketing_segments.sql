-- Phase 2/C: structured segment definitions with safe field/op whitelist.
-- Filter shape:
--   { match: 'all'|'any', rules: [ { field, op, value } ] }
-- Allowed fields: email, marketing_opt_in, marketing_unsubscribed_at, locale,
--                 profile_created_at, current_level, current_streak,
--                 last_practice_date, days_since_last_practice
-- Allowed ops vary by field type — enforced inside marketing_segment_match.
-- Field names and operators are validated against hardcoded whitelists; values
-- are matched in pure SQL (no dynamic SQL) so no injection surface.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en';

CREATE TABLE IF NOT EXISTS public.marketing_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  filter jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_builtin boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketing_segments_admin_all ON public.marketing_segments;
CREATE POLICY marketing_segments_admin_all ON public.marketing_segments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- marketing_segment_match: row-level filter evaluator.
-- Pure SQL. Accepts the resolved values for every supported field, then walks
-- the filter rules and returns true if the row matches.
-- ============================================================
CREATE OR REPLACE FUNCTION public.marketing_segment_match(
  p_email text,
  p_marketing_opt_in boolean,
  p_marketing_unsubscribed_at timestamptz,
  p_locale text,
  p_profile_created_at timestamptz,
  p_current_level integer,
  p_current_streak integer,
  p_last_practice_date date,
  p_filter jsonb
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_match text;
  v_rule jsonb;
  v_field text;
  v_op text;
  v_val jsonb;
  v_pass boolean;
  v_any_pass boolean := false;
  v_all_pass boolean := true;
  v_count integer := 0;
  v_days integer;
BEGIN
  v_match := lower(COALESCE(p_filter->>'match','all'));
  IF v_match NOT IN ('all','any') THEN v_match := 'all'; END IF;

  FOR v_rule IN SELECT * FROM jsonb_array_elements(COALESCE(p_filter->'rules','[]'::jsonb))
  LOOP
    v_count := v_count + 1;
    v_field := v_rule->>'field';
    v_op := v_rule->>'op';
    v_val := v_rule->'value';
    v_pass := false;

    -- Per-field, per-op evaluation. Whitelisted; anything unknown stays false.
    CASE v_field

    WHEN 'email' THEN
      CASE v_op
        WHEN 'is_null' THEN v_pass := (p_email IS NULL);
        WHEN 'is_not_null' THEN v_pass := (p_email IS NOT NULL);
        WHEN 'eq' THEN v_pass := (lower(p_email) = lower(v_val#>>'{}'));
        WHEN 'neq' THEN v_pass := (lower(p_email) <> lower(v_val#>>'{}'));
        WHEN 'like' THEN v_pass := (p_email ILIKE '%' || (v_val#>>'{}') || '%');
        ELSE v_pass := false;
      END CASE;

    WHEN 'marketing_opt_in' THEN
      CASE v_op
        WHEN 'eq' THEN v_pass := (p_marketing_opt_in = (v_val::text)::boolean);
        WHEN 'is_null' THEN v_pass := (p_marketing_opt_in IS NULL);
        ELSE v_pass := false;
      END CASE;

    WHEN 'marketing_unsubscribed_at' THEN
      CASE v_op
        WHEN 'is_null' THEN v_pass := (p_marketing_unsubscribed_at IS NULL);
        WHEN 'is_not_null' THEN v_pass := (p_marketing_unsubscribed_at IS NOT NULL);
        ELSE v_pass := false;
      END CASE;

    WHEN 'locale' THEN
      CASE v_op
        WHEN 'eq' THEN v_pass := (p_locale = (v_val#>>'{}'));
        WHEN 'neq' THEN v_pass := (p_locale <> (v_val#>>'{}'));
        WHEN 'in' THEN v_pass := (jsonb_typeof(v_val) = 'array' AND p_locale IN (
          SELECT jsonb_array_elements_text(v_val)
        ));
        ELSE v_pass := false;
      END CASE;

    WHEN 'profile_created_at' THEN
      CASE v_op
        WHEN 'within_last_days' THEN
          v_days := (v_val::text)::integer;
          v_pass := (p_profile_created_at >= now() - (v_days || ' days')::interval);
        WHEN 'older_than_days' THEN
          v_days := (v_val::text)::integer;
          v_pass := (p_profile_created_at <= now() - (v_days || ' days')::interval);
        WHEN 'before' THEN v_pass := (p_profile_created_at < (v_val#>>'{}')::timestamptz);
        WHEN 'after' THEN v_pass := (p_profile_created_at > (v_val#>>'{}')::timestamptz);
        ELSE v_pass := false;
      END CASE;

    WHEN 'current_level' THEN
      CASE v_op
        WHEN 'eq' THEN v_pass := (p_current_level = (v_val::text)::integer);
        WHEN 'neq' THEN v_pass := (p_current_level <> (v_val::text)::integer);
        WHEN 'gt' THEN v_pass := (p_current_level > (v_val::text)::integer);
        WHEN 'gte' THEN v_pass := (p_current_level >= (v_val::text)::integer);
        WHEN 'lt' THEN v_pass := (p_current_level < (v_val::text)::integer);
        WHEN 'lte' THEN v_pass := (p_current_level <= (v_val::text)::integer);
        WHEN 'is_null' THEN v_pass := (p_current_level IS NULL);
        ELSE v_pass := false;
      END CASE;

    WHEN 'current_streak' THEN
      CASE v_op
        WHEN 'eq' THEN v_pass := (p_current_streak = (v_val::text)::integer);
        WHEN 'gt' THEN v_pass := (p_current_streak > (v_val::text)::integer);
        WHEN 'gte' THEN v_pass := (p_current_streak >= (v_val::text)::integer);
        WHEN 'lt' THEN v_pass := (p_current_streak < (v_val::text)::integer);
        WHEN 'lte' THEN v_pass := (p_current_streak <= (v_val::text)::integer);
        ELSE v_pass := false;
      END CASE;

    WHEN 'last_practice_date' THEN
      CASE v_op
        WHEN 'is_null' THEN v_pass := (p_last_practice_date IS NULL);
        WHEN 'is_not_null' THEN v_pass := (p_last_practice_date IS NOT NULL);
        WHEN 'before' THEN v_pass := (p_last_practice_date < (v_val#>>'{}')::date);
        WHEN 'after' THEN v_pass := (p_last_practice_date > (v_val#>>'{}')::date);
        ELSE v_pass := false;
      END CASE;

    WHEN 'days_since_last_practice' THEN
      -- Treat NULL last_practice as "infinitely long ago" (matches "haven't trained in N days").
      v_days := (v_val::text)::integer;
      CASE v_op
        WHEN 'gte' THEN
          v_pass := (p_last_practice_date IS NULL OR p_last_practice_date <= (current_date - v_days));
        WHEN 'lte' THEN
          v_pass := (p_last_practice_date IS NOT NULL AND p_last_practice_date >= (current_date - v_days));
        ELSE v_pass := false;
      END CASE;

    ELSE
      v_pass := false; -- unknown field
    END CASE;

    IF v_pass THEN v_any_pass := true; ELSE v_all_pass := false; END IF;
  END LOOP;

  IF v_count = 0 THEN RETURN true; END IF; -- empty filter = all rows
  IF v_match = 'any' THEN RETURN v_any_pass; END IF;
  RETURN v_all_pass;
END;
$$;

-- ============================================================
-- marketing_segment_count: live count for the admin UI
-- ============================================================
CREATE OR REPLACE FUNCTION public.marketing_segment_count(p_filter jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_is_admin boolean;
  v_count integer;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.profiles p
  LEFT JOIN public.player_profiles pp ON pp.id = p.id
  WHERE p.marketing_unsubscribed_at IS NULL
    AND p.email IS NOT NULL
    AND public.marketing_segment_match(
      p.email, p.marketing_opt_in, p.marketing_unsubscribed_at,
      p.locale, p.created_at,
      pp.current_level, pp.current_streak, pp.last_practice_date,
      p_filter
    );

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_segment_count(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_segment_count(jsonb) TO authenticated;

-- ============================================================
-- marketing_segment_recipients: returns full recipient list for sending
-- (called by the edge function via service role).
-- ============================================================
CREATE OR REPLACE FUNCTION public.marketing_segment_recipients(p_filter jsonb)
RETURNS TABLE (
  id uuid, email text, marketing_unsubscribe_token text,
  marketing_preferences jsonb, locale text, full_name text,
  current_level integer, current_streak integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.id, p.email, p.marketing_unsubscribe_token, p.marketing_preferences,
         p.locale, p.full_name, pp.current_level, pp.current_streak
  FROM public.profiles p
  LEFT JOIN public.player_profiles pp ON pp.id = p.id
  WHERE p.marketing_unsubscribed_at IS NULL
    AND p.email IS NOT NULL
    AND p.marketing_unsubscribe_token IS NOT NULL
    AND public.marketing_segment_match(
      p.email, p.marketing_opt_in, p.marketing_unsubscribed_at,
      p.locale, p.created_at,
      pp.current_level, pp.current_streak, pp.last_practice_date,
      p_filter
    );
$$;

REVOKE ALL ON FUNCTION public.marketing_segment_recipients(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marketing_segment_recipients(jsonb) TO service_role;

-- ============================================================
-- Pre-built segments
-- ============================================================
INSERT INTO public.marketing_segments (name, description, filter, is_builtin) VALUES
('Engaged opted-in users',
 'Has email and explicitly opted in to marketing.',
 '{"match":"all","rules":[
    {"field":"email","op":"is_not_null"},
    {"field":"marketing_opt_in","op":"eq","value":true}
  ]}'::jsonb,
 true),
('New signups (last 30 days)',
 'Profiles created in the last 30 days.',
 '{"match":"all","rules":[
    {"field":"profile_created_at","op":"within_last_days","value":30}
  ]}'::jsonb,
 true),
('Inactive 14+ days',
 'Has not practiced in at least 14 days (or never practiced).',
 '{"match":"all","rules":[
    {"field":"days_since_last_practice","op":"gte","value":14}
  ]}'::jsonb,
 true),
('Power users (level >= 5)',
 'Reached level 5 or higher.',
 '{"match":"all","rules":[
    {"field":"current_level","op":"gte","value":5}
  ]}'::jsonb,
 true),
('Arabic-speaking users',
 'Locale set to Arabic.',
 '{"match":"all","rules":[
    {"field":"locale","op":"eq","value":"ar"}
  ]}'::jsonb,
 true),
('English-speaking users',
 'Locale set to English.',
 '{"match":"all","rules":[
    {"field":"locale","op":"eq","value":"en"}
  ]}'::jsonb,
 true)
ON CONFLICT (name) DO NOTHING;

NOTIFY pgrst, 'reload schema';
