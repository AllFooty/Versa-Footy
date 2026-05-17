-- Marketing campaigns + per-recipient tracking.
-- Column set inferred from RecentCampaignsPanel.tsx (CampaignRow), ScheduledCampaignsPanel.tsx
-- (ScheduledRow), MarketingEmailView.tsx (schedule RPC args), and CampaignDrilldownModal.tsx
-- (RecipientRow). Tables are admin-only via RLS; Edge Functions write via service role.

-- ============================================
-- marketing_campaigns
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  html text,
  -- bilingual variants (MarketingEmailView passes p_subject_ar / p_html_ar)
  subject_ar text,
  html_ar text,
  -- blocks snapshot for re-rendering / audit (optional; the rendered html is stored above)
  blocks jsonb,
  blocks_ar jsonb,
  -- audience targeting
  audience text NOT NULL DEFAULT 'subscribers'
    CHECK (audience IN ('test','subscribers','opted_in_users','all_users','segment')),
  segment_id uuid REFERENCES public.marketing_segments(id) ON DELETE SET NULL,
  category text CHECK (category IS NULL OR category IN ('product_updates','training_tips','promotions')),
  locale text NOT NULL DEFAULT 'en',
  template_id uuid REFERENCES public.marketing_templates(id) ON DELETE SET NULL,
  -- lifecycle
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','sending','sent','cancelled','failed')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  completed_at timestamptz,
  -- aggregate counters (kept in sync by the send Edge Function)
  total_recipients int NOT NULL DEFAULT 0,
  successful_sends int NOT NULL DEFAULT 0,
  total_failures int NOT NULL DEFAULT 0,
  delivered int NOT NULL DEFAULT 0,
  opened int NOT NULL DEFAULT 0,
  clicked int NOT NULL DEFAULT 0,
  bounced int NOT NULL DEFAULT 0,
  complained int NOT NULL DEFAULT 0,
  -- attribution
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_by_email text
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status
  ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_scheduled_for
  ON public.marketing_campaigns(scheduled_for)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_at
  ON public.marketing_campaigns(created_at DESC);

DROP TRIGGER IF EXISTS marketing_campaigns_updated_at ON public.marketing_campaigns;
CREATE TRIGGER marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read marketing_campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Admins write marketing_campaigns" ON public.marketing_campaigns;

CREATE POLICY "Admins read marketing_campaigns"
  ON public.marketing_campaigns FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins write marketing_campaigns"
  ON public.marketing_campaigns FOR ALL
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;

-- ============================================
-- marketing_campaign_recipients
-- RecipientRow per CampaignDrilldownModal.tsx:22-30.
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  email citext NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','skipped')),
  error_message text,
  provider_message_id text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaign_recipients_campaign
  ON public.marketing_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_recipients_status
  ON public.marketing_campaign_recipients(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaign_recipients_email
  ON public.marketing_campaign_recipients(email);

ALTER TABLE public.marketing_campaign_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read marketing_campaign_recipients" ON public.marketing_campaign_recipients;
DROP POLICY IF EXISTS "Admins write marketing_campaign_recipients" ON public.marketing_campaign_recipients;

CREATE POLICY "Admins read marketing_campaign_recipients"
  ON public.marketing_campaign_recipients FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins write marketing_campaign_recipients"
  ON public.marketing_campaign_recipients FOR ALL
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaign_recipients TO authenticated;
