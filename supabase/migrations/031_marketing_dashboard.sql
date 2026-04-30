-- Phase 2/J: dashboard polish.
-- Adds the admin RPCs the per-campaign drilldown + suppressions tab need, and
-- locks down marketing_suppressions RLS (it was service-role-only writes from
-- the resend-webhook, but admin reads weren't formalized).

-- ---------------------------------------------------------------------------
-- RLS for marketing_suppressions: admins read + delete (manual escape hatch
-- for re-enabling a previously-bounced address). Inserts/updates stay
-- service-role only via the resend-webhook function.
-- ---------------------------------------------------------------------------
ALTER TABLE public.marketing_suppressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read suppressions" ON public.marketing_suppressions;
CREATE POLICY "admins read suppressions" ON public.marketing_suppressions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "admins delete suppressions" ON public.marketing_suppressions;
CREATE POLICY "admins delete suppressions" ON public.marketing_suppressions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- ---------------------------------------------------------------------------
-- Admin: per-campaign recipient drilldown. Pages through marketing_sends rows.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.marketing_campaign_recipients(
  p_campaign_id uuid,
  p_limit int DEFAULT 200,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  email text,
  recipient_type text,
  status text,
  resend_email_id text,
  delivery_status text,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  error_message text,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT s.email, s.recipient_type, s.status, s.resend_email_id,
         s.delivery_status, s.opened_at, s.clicked_at, s.bounced_at,
         s.complained_at, s.error_message, s.created_at
  FROM public.marketing_sends s
  WHERE s.campaign_id = p_campaign_id
  ORDER BY s.created_at DESC
  LIMIT GREATEST(p_limit, 1) OFFSET GREATEST(p_offset, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_campaign_recipients(uuid, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_campaign_recipients(uuid, int, int) TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin: list addresses to retry for a campaign (status = 'failed' only).
-- Used by the "Resend to failures" button. The actual sending happens in the
-- resend-campaign-failures edge function — this RPC just enumerates the targets.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.marketing_campaign_failed_emails(p_campaign_id uuid)
RETURNS TABLE (email text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
DECLARE v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT DISTINCT s.email
  FROM public.marketing_sends s
  WHERE s.campaign_id = p_campaign_id AND s.status = 'failed';
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_campaign_failed_emails(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_campaign_failed_emails(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
