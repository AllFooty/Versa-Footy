-- Marketing emails infrastructure
-- Tables: marketing_subscribers (Android waitlist), marketing_campaigns, marketing_sends
-- Adds opt-in columns to profiles
-- Public RPCs: subscribe_to_waitlist, unsubscribe_by_token, marketing_audience_counts
--
-- Apply via Supabase SQL Editor:
--   https://supabase.com/dashboard/project/<PROJECT_REF>/sql/new

-- ============================================================
-- marketing_subscribers (Android notify-me list from landing)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketing_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text,
  locale text,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  unsubscribe_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  CONSTRAINT marketing_subscribers_email_lower_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_marketing_subscribers_active
  ON public.marketing_subscribers (subscribed_at)
  WHERE unsubscribed_at IS NULL;

ALTER TABLE public.marketing_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketing_subscribers_admin_all ON public.marketing_subscribers;
CREATE POLICY marketing_subscribers_admin_all ON public.marketing_subscribers
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- profiles: marketing opt-in columns
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_unsubscribe_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

UPDATE public.profiles
SET marketing_unsubscribe_token = encode(gen_random_bytes(16), 'hex')
WHERE marketing_unsubscribe_token IS NULL;

-- ============================================================
-- marketing_campaigns (audit trail of every send batch)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  html text NOT NULL,
  audience text NOT NULL,
  test_recipient text,
  sent_by uuid REFERENCES auth.users(id),
  total_recipients integer NOT NULL DEFAULT 0,
  successful_sends integer NOT NULL DEFAULT 0,
  failed_sends integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sending','completed','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketing_campaigns_admin_all ON public.marketing_campaigns;
CREATE POLICY marketing_campaigns_admin_all ON public.marketing_campaigns
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- marketing_sends (per-recipient send log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketing_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  email text NOT NULL,
  recipient_type text NOT NULL,
  status text NOT NULL,
  resend_email_id text,
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_sends_campaign
  ON public.marketing_sends (campaign_id);

ALTER TABLE public.marketing_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketing_sends_admin_all ON public.marketing_sends;
CREATE POLICY marketing_sends_admin_all ON public.marketing_sends
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- subscribe_to_waitlist: public RPC, called by landing page
-- ============================================================
CREATE OR REPLACE FUNCTION public.subscribe_to_waitlist(
  p_email text,
  p_source text DEFAULT NULL,
  p_locale text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_existing record;
BEGIN
  v_email := lower(trim(p_email));
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  SELECT id, unsubscribed_at INTO v_existing
  FROM public.marketing_subscribers
  WHERE email = v_email;

  IF v_existing.id IS NOT NULL THEN
    IF v_existing.unsubscribed_at IS NOT NULL THEN
      UPDATE public.marketing_subscribers
      SET unsubscribed_at = NULL, subscribed_at = now()
      WHERE id = v_existing.id;
      RETURN jsonb_build_object('ok', true, 'resubscribed', true);
    END IF;
    RETURN jsonb_build_object('ok', true, 'already_subscribed', true);
  END IF;

  INSERT INTO public.marketing_subscribers (email, source, locale)
  VALUES (v_email, p_source, p_locale);

  RETURN jsonb_build_object('ok', true, 'subscribed', true);
END;
$$;

REVOKE ALL ON FUNCTION public.subscribe_to_waitlist(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_to_waitlist(text, text, text) TO anon, authenticated;

-- ============================================================
-- unsubscribe_by_token: public RPC, called by /unsubscribe page
-- ============================================================
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
  IF p_token IS NULL OR length(p_token) < 16 THEN
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

REVOKE ALL ON FUNCTION public.unsubscribe_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unsubscribe_by_token(text) TO anon, authenticated;

-- ============================================================
-- marketing_audience_counts: helper for admin UI
-- ============================================================
CREATE OR REPLACE FUNCTION public.marketing_audience_counts()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT jsonb_build_object(
    'subscribers', (SELECT count(*) FROM public.marketing_subscribers WHERE unsubscribed_at IS NULL),
    'opted_in_users', (SELECT count(*) FROM public.profiles
                       WHERE marketing_opt_in = true
                         AND marketing_unsubscribed_at IS NULL
                         AND email IS NOT NULL),
    'all_users', (SELECT count(*) FROM public.profiles
                  WHERE marketing_unsubscribed_at IS NULL
                    AND email IS NOT NULL)
  )
$$;

REVOKE ALL ON FUNCTION public.marketing_audience_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.marketing_audience_counts() TO authenticated;

-- Reload PostgREST schema cache so the new RPCs are immediately callable
NOTIFY pgrst, 'reload schema';
