-- Phase 2/H: Resend webhook ingestion + analytics + auto-suppression.

-- ============================================================
-- marketing_sends: per-recipient delivery / engagement columns
-- ============================================================
ALTER TABLE public.marketing_sends
  ADD COLUMN IF NOT EXISTS delivery_status text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS open_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bounced_at timestamptz,
  ADD COLUMN IF NOT EXISTS complained_at timestamptz,
  ADD COLUMN IF NOT EXISTS delayed_at timestamptz;

-- Webhook handler looks up rows by Resend's email id; needs an index.
CREATE INDEX IF NOT EXISTS idx_marketing_sends_resend_id
  ON public.marketing_sends (resend_email_id)
  WHERE resend_email_id IS NOT NULL;

-- ============================================================
-- marketing_suppressions: addresses we must never email again
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketing_suppressions (
  email text PRIMARY KEY,
  reason text NOT NULL CHECK (reason IN ('bounced','complained','manual')),
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_suppressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketing_suppressions_admin_all ON public.marketing_suppressions;
CREATE POLICY marketing_suppressions_admin_all ON public.marketing_suppressions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ============================================================
-- marketing_campaign_stats: per-campaign aggregate rates
-- Admin-only (raises if non-admin calls).
-- ============================================================
CREATE OR REPLACE FUNCTION public.marketing_campaign_stats(p_campaign_id uuid)
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

  RETURN (
    SELECT jsonb_build_object(
      'total', count(*),
      'sent', count(*) FILTER (WHERE status = 'sent'),
      'failed', count(*) FILTER (WHERE status = 'failed'),
      'delivered', count(*) FILTER (WHERE delivery_status = 'delivered'),
      'opened', count(*) FILTER (WHERE open_count > 0),
      'clicked', count(*) FILTER (WHERE click_count > 0),
      'bounced', count(*) FILTER (WHERE delivery_status = 'bounced'),
      'complained', count(*) FILTER (WHERE delivery_status = 'complained'),
      'delayed', count(*) FILTER (WHERE delivery_status = 'delayed'),
      'total_opens', COALESCE(sum(open_count), 0),
      'total_clicks', COALESCE(sum(click_count), 0)
    )
    FROM public.marketing_sends
    WHERE campaign_id = p_campaign_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_campaign_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_campaign_stats(uuid) TO authenticated;

-- ============================================================
-- marketing_recent_campaigns: list with inline stats for the dashboard
-- ============================================================
CREATE OR REPLACE FUNCTION public.marketing_recent_campaigns(p_limit integer DEFAULT 20)
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
        'total_recipients', c.total_recipients,
        'successful_sends', c.successful_sends,
        'failed_sends', c.failed_sends,
        'delivered', (SELECT count(*) FROM public.marketing_sends s WHERE s.campaign_id = c.id AND s.delivery_status = 'delivered'),
        'opened', (SELECT count(*) FROM public.marketing_sends s WHERE s.campaign_id = c.id AND s.open_count > 0),
        'clicked', (SELECT count(*) FROM public.marketing_sends s WHERE s.campaign_id = c.id AND s.click_count > 0),
        'bounced', (SELECT count(*) FROM public.marketing_sends s WHERE s.campaign_id = c.id AND s.delivery_status = 'bounced'),
        'complained', (SELECT count(*) FROM public.marketing_sends s WHERE s.campaign_id = c.id AND s.delivery_status = 'complained')
      ) AS row
      FROM public.marketing_campaigns c
      ORDER BY c.created_at DESC
      LIMIT p_limit
    ) t
  );
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_recent_campaigns(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_recent_campaigns(integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
