-- Phase 1 hardening for marketing email feature.
-- Restricts marketing_audience_counts() to admins only (was leaking counts to any authenticated user).

CREATE OR REPLACE FUNCTION public.marketing_audience_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'subscribers', (SELECT count(*) FROM public.marketing_subscribers WHERE unsubscribed_at IS NULL),
    'opted_in_users', (SELECT count(*) FROM public.profiles
                       WHERE marketing_opt_in = true
                         AND marketing_unsubscribed_at IS NULL
                         AND email IS NOT NULL),
    'all_users', (SELECT count(*) FROM public.profiles
                  WHERE marketing_unsubscribed_at IS NULL
                    AND email IS NOT NULL)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_audience_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_audience_counts() TO authenticated;

NOTIFY pgrst, 'reload schema';
