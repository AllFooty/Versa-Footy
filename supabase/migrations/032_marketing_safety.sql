-- Phase 2/K: safety rails.
-- Adds:
--   - marketing_admin_daily_count(uuid, timestamptz) — used by send-marketing-email
--     to enforce per-admin daily campaign limit (excludes test sends).
--   - marketing_recent_campaigns recreated to include sent_by_email + scheduled_for
--     so the audit log shows "who sent what when" without an extra round-trip.

-- ---------------------------------------------------------------------------
-- Daily campaign count for the rate limit. Counts non-test campaigns the user
-- has initiated since the start of the given day in UTC.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.marketing_admin_daily_count(
  p_user_id uuid,
  p_since timestamptz
)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT count(*)::int
  FROM public.marketing_campaigns
  WHERE sent_by = p_user_id
    AND created_at >= p_since
    AND audience <> 'test'
    AND status NOT IN ('canceled');
$$;

REVOKE ALL ON FUNCTION public.marketing_admin_daily_count(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
-- service_role only (called by the edge function with service-role client).

-- ---------------------------------------------------------------------------
-- Recreate marketing_recent_campaigns with sent_by_email + scheduled_for so the
-- dashboard surfaces "audit log" data without an extra query per row.
-- ---------------------------------------------------------------------------
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
      ORDER BY c.created_at DESC
      LIMIT p_limit
    ) t
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
