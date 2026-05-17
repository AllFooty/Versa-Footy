-- Marketing schema: segments, templates, suppressions, automations, automation steps,
-- and preference-token table. All tables are admin-only via RLS.
-- Templates schema matches what TemplatesPanel.tsx selects (id, name, subject, mode,
-- blocks_json, html, is_builtin, updated_at). Segments include filter (jsonb) and
-- is_builtin / is_active flags as read by SegmentsView / MarketingEmailView.
-- Automations + steps shape inferred from useAutomations.ts (TriggerType union,
-- step_order, delay_days, per-locale subject/html, category).

-- Make sure citext is available for case-insensitive email matching.
CREATE EXTENSION IF NOT EXISTS citext;

-- ============================================
-- marketing_segments
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_builtin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_marketing_segments_active
  ON public.marketing_segments(is_active) WHERE is_active;

DROP TRIGGER IF EXISTS marketing_segments_updated_at ON public.marketing_segments;
CREATE TRIGGER marketing_segments_updated_at
  BEFORE UPDATE ON public.marketing_segments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.marketing_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read marketing_segments" ON public.marketing_segments;
DROP POLICY IF EXISTS "Admins write marketing_segments" ON public.marketing_segments;

CREATE POLICY "Admins read marketing_segments"
  ON public.marketing_segments FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins write marketing_segments"
  ON public.marketing_segments FOR ALL
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_segments TO authenticated;

-- ============================================
-- marketing_templates
-- Columns (id,name,subject,mode,blocks_json,html,is_builtin,updated_at) per
-- TemplatesPanel.tsx:62. `blocks` (per task spec) is stored as `blocks_json`.
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text,
  mode text NOT NULL DEFAULT 'blocks' CHECK (mode IN ('blocks','html')),
  blocks_json jsonb,
  html text,
  locale text NOT NULL DEFAULT 'en',
  is_builtin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS marketing_templates_updated_at ON public.marketing_templates;
CREATE TRIGGER marketing_templates_updated_at
  BEFORE UPDATE ON public.marketing_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read marketing_templates" ON public.marketing_templates;
DROP POLICY IF EXISTS "Admins write marketing_templates" ON public.marketing_templates;

CREATE POLICY "Admins read marketing_templates"
  ON public.marketing_templates FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins write marketing_templates"
  ON public.marketing_templates FOR ALL
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_templates TO authenticated;

-- ============================================
-- marketing_suppressions
-- Cols (email, reason, notes, created_at) per SuppressionsPanel.tsx:32.
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_marketing_suppressions_email
  ON public.marketing_suppressions(email);

ALTER TABLE public.marketing_suppressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read marketing_suppressions" ON public.marketing_suppressions;
DROP POLICY IF EXISTS "Admins write marketing_suppressions" ON public.marketing_suppressions;

CREATE POLICY "Admins read marketing_suppressions"
  ON public.marketing_suppressions FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins write marketing_suppressions"
  ON public.marketing_suppressions FOR ALL
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_suppressions TO authenticated;

-- ============================================
-- marketing_automations
-- TriggerType values: signup_welcome | inactivity | level_reached.
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('signup_welcome','inactivity','level_reached')),
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS marketing_automations_updated_at ON public.marketing_automations;
CREATE TRIGGER marketing_automations_updated_at
  BEFORE UPDATE ON public.marketing_automations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.marketing_automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read marketing_automations" ON public.marketing_automations;
DROP POLICY IF EXISTS "Admins write marketing_automations" ON public.marketing_automations;

CREATE POLICY "Admins read marketing_automations"
  ON public.marketing_automations FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins write marketing_automations"
  ON public.marketing_automations FOR ALL
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_automations TO authenticated;

-- ============================================
-- marketing_automation_steps
-- StepRow shape from useAutomations.ts:29.
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_automation_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.marketing_automations(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  delay_days int NOT NULL DEFAULT 0,
  subject text NOT NULL DEFAULT '',
  html text NOT NULL DEFAULT '',
  subject_ar text,
  html_ar text,
  category text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (automation_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_marketing_automation_steps_automation
  ON public.marketing_automation_steps(automation_id);

ALTER TABLE public.marketing_automation_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read marketing_automation_steps" ON public.marketing_automation_steps;
DROP POLICY IF EXISTS "Admins write marketing_automation_steps" ON public.marketing_automation_steps;

CREATE POLICY "Admins read marketing_automation_steps"
  ON public.marketing_automation_steps FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins write marketing_automation_steps"
  ON public.marketing_automation_steps FOR ALL
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_automation_steps TO authenticated;

-- ============================================
-- marketing_preference_tokens
-- One-way opaque tokens emailed in unsubscribe / preference links.
-- `kind` mirrors PreferencesView.tsx: "user" | "waitlist".
-- ============================================
CREATE TABLE IF NOT EXISTS public.marketing_preference_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  email citext NOT NULL,
  kind text NOT NULL DEFAULT 'user' CHECK (kind IN ('user','waitlist')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT jsonb_build_object(
    'product_updates', true,
    'training_tips',   true,
    'promotions',      true
  ),
  unsubscribed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_marketing_preference_tokens_email
  ON public.marketing_preference_tokens(email);

ALTER TABLE public.marketing_preference_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read marketing_preference_tokens" ON public.marketing_preference_tokens;
DROP POLICY IF EXISTS "Admins write marketing_preference_tokens" ON public.marketing_preference_tokens;

-- No public SELECT — access only via SECURITY DEFINER RPCs in 024.
CREATE POLICY "Admins read marketing_preference_tokens"
  ON public.marketing_preference_tokens FOR SELECT USING (public.is_admin() = true);
CREATE POLICY "Admins write marketing_preference_tokens"
  ON public.marketing_preference_tokens FOR ALL
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_preference_tokens TO authenticated;
