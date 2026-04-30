-- Phase 2/D: admin-only sample fetcher for the merge-tag preview UI.
-- Returns ONE recipient with the fields that drive merge tags
-- ({{first_name}}, {{full_name}}, {{streak_days}}, {{current_level}}).
-- Returns null if the audience is empty.

CREATE OR REPLACE FUNCTION public.marketing_sample_recipient(
  p_audience text,
  p_segment_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_is_admin boolean;
  v_filter jsonb;
  v_row record;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
  END IF;

  IF p_audience = 'subscribers' THEN
    SELECT email, locale INTO v_row FROM public.marketing_subscribers
    WHERE unsubscribed_at IS NULL ORDER BY subscribed_at DESC LIMIT 1;
    IF v_row.email IS NULL THEN RETURN NULL; END IF;
    RETURN jsonb_build_object('email', v_row.email, 'full_name', NULL, 'first_name', NULL,
      'current_level', NULL, 'current_streak', NULL, 'locale', v_row.locale);
  END IF;

  IF p_audience = 'segment' THEN
    SELECT filter INTO v_filter FROM public.marketing_segments WHERE id = p_segment_id AND is_active;
    IF v_filter IS NULL THEN RETURN NULL; END IF;
  ELSIF p_audience = 'opted_in_users' THEN
    v_filter := '{"match":"all","rules":[{"field":"marketing_opt_in","op":"eq","value":true}]}'::jsonb;
  ELSIF p_audience = 'all_users' THEN
    v_filter := '{"match":"all","rules":[]}'::jsonb;
  ELSE
    RETURN NULL;
  END IF;

  SELECT p.email, p.full_name, pp.current_level, pp.current_streak, p.locale
  INTO v_row
  FROM public.profiles p
  LEFT JOIN public.player_profiles pp ON pp.id = p.id
  WHERE p.marketing_unsubscribed_at IS NULL
    AND p.email IS NOT NULL
    AND p.marketing_unsubscribe_token IS NOT NULL
    AND public.marketing_segment_match(
      p.email, p.marketing_opt_in, p.marketing_unsubscribed_at,
      p.locale, p.created_at, pp.current_level, pp.current_streak,
      pp.last_practice_date, v_filter)
  ORDER BY p.created_at DESC
  LIMIT 1;

  IF v_row.email IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'email', v_row.email,
    'full_name', v_row.full_name,
    'first_name', CASE WHEN v_row.full_name IS NULL THEN NULL ELSE split_part(v_row.full_name, ' ', 1) END,
    'current_level', v_row.current_level,
    'current_streak', v_row.current_streak,
    'locale', v_row.locale
  );
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_sample_recipient(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_sample_recipient(text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
