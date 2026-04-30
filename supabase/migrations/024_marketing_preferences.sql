-- Phase 2/I: per-category subscription preferences.
-- Categories: product_updates, training_tips, promotions.
-- Waitlist subscribers are NOT categorized (they only ever get launch/product announcements).

-- ============================================================
-- profiles.marketing_preferences (JSONB) + campaign category
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_preferences jsonb;

ALTER TABLE public.marketing_campaigns
  ADD COLUMN IF NOT EXISTS category text;

-- For category-aware RPCs we want SQL-level "is this prefs[category] = true (or NULL)?".
-- NULL prefs OR NULL key = treated as opted-in (back-compat with users who pre-date this column).

-- ============================================================
-- get_preferences_by_token: anon RPC for the /preferences page
-- ============================================================
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
  IF p_token IS NULL OR length(p_token) < 16 THEN
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

  -- Waitlist subscriber: no per-category prefs, single on/off.
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

REVOKE ALL ON FUNCTION public.get_preferences_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_preferences_by_token(text) TO anon, authenticated;

-- ============================================================
-- update_preferences_by_token: anon RPC, idempotent.
-- p_prefs is { product_updates, training_tips, promotions } — booleans only.
-- If ALL three are false, also set marketing_unsubscribed_at (treats as full opt-out).
-- ============================================================
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
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_token');
  END IF;

  -- Coerce inputs to strict booleans (defaults: keep on if not provided).
  v_prod  := COALESCE((p_prefs->>'product_updates')::boolean, true);
  v_tips  := COALESCE((p_prefs->>'training_tips')::boolean, true);
  v_promo := COALESCE((p_prefs->>'promotions')::boolean, true);
  v_clean_prefs := jsonb_build_object(
    'product_updates', v_prod,
    'training_tips', v_tips,
    'promotions', v_promo
  );
  v_all_off := NOT (v_prod OR v_tips OR v_promo);

  -- Try profiles first.
  UPDATE public.profiles
  SET marketing_preferences = v_clean_prefs,
      marketing_unsubscribed_at = CASE WHEN v_all_off THEN now() ELSE NULL END,
      marketing_opt_in = CASE WHEN v_all_off THEN false ELSE marketing_opt_in END
  WHERE marketing_unsubscribe_token = p_token
  RETURNING email INTO v_email;

  IF v_email IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'kind', 'user', 'email', v_email, 'preferences', v_clean_prefs);
  END IF;

  -- Subscriber: no categories. If any preference is true, resubscribe; if all off, unsubscribe.
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

REVOKE ALL ON FUNCTION public.update_preferences_by_token(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_preferences_by_token(text, jsonb) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
