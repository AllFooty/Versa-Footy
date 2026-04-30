-- Phase 2/B: templates library.
-- A template captures everything an admin needs to seed a new campaign:
-- subject, composer mode, block JSON (for blocks mode) and/or raw html (for html mode).

CREATE TABLE IF NOT EXISTS public.marketing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT 'blocks' CHECK (mode IN ('blocks','html')),
  blocks_json jsonb,
  html text,
  is_builtin boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketing_templates_name_idx ON public.marketing_templates (lower(name));

CREATE OR REPLACE FUNCTION public._marketing_templates_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marketing_templates_touch_updated_at ON public.marketing_templates;
CREATE TRIGGER marketing_templates_touch_updated_at
BEFORE UPDATE ON public.marketing_templates
FOR EACH ROW EXECUTE FUNCTION public._marketing_templates_touch_updated_at();

ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read templates" ON public.marketing_templates;
CREATE POLICY "admins read templates" ON public.marketing_templates
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "admins insert templates" ON public.marketing_templates;
CREATE POLICY "admins insert templates" ON public.marketing_templates
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- Built-ins are not user-modifiable; non-built-ins are admin-editable.
DROP POLICY IF EXISTS "admins update non-builtin templates" ON public.marketing_templates;
CREATE POLICY "admins update non-builtin templates" ON public.marketing_templates
  FOR UPDATE TO authenticated
  USING (NOT is_builtin AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin))
  WITH CHECK (NOT is_builtin AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

DROP POLICY IF EXISTS "admins delete non-builtin templates" ON public.marketing_templates;
CREATE POLICY "admins delete non-builtin templates" ON public.marketing_templates
  FOR DELETE TO authenticated
  USING (NOT is_builtin AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin));

-- ---------------------------------------------------------------------------
-- Seed 3 built-ins. Idempotent on (name, is_builtin=true).
-- ---------------------------------------------------------------------------
INSERT INTO public.marketing_templates (name, subject, mode, blocks_json, is_builtin)
SELECT 'Launch Announcement',
       'Versa Footy is launching today',
       'blocks',
       $json$[
         {"id":"b_seed_1","type":"heading","level":1,"align":"left","text":"We're launching!"},
         {"id":"b_seed_2","type":"paragraph","text":"Hey {{first_name|\"there\"}}, the wait is over. Versa Footy is officially live — your kid's personalized football training app."},
         {"id":"b_seed_3","type":"button","text":"Open Versa Footy","href":"https://versafooty.com","color":"#E63946"},
         {"id":"b_seed_4","type":"spacer","height":24},
         {"id":"b_seed_5","type":"footer","text":"You're receiving this because you signed up at versafooty.com."}
       ]$json$::jsonb,
       true
WHERE NOT EXISTS (SELECT 1 FROM public.marketing_templates WHERE name = 'Launch Announcement' AND is_builtin);

INSERT INTO public.marketing_templates (name, subject, mode, blocks_json, is_builtin)
SELECT 'Product Update',
       'What''s new in Versa Footy',
       'blocks',
       $json$[
         {"id":"b_seed_1","type":"heading","level":1,"align":"left","text":"What's new this month"},
         {"id":"b_seed_2","type":"paragraph","text":"Hi {{first_name|\"there\"}}, we shipped some upgrades you'll want to try."},
         {"id":"b_seed_3","type":"paragraph","text":"**New drills.** Fresh sessions tuned to your level.\n\n**Smarter streaks.** We now reward consistency, not just volume.\n\n**Faster app.** Sessions load up to 40% quicker."},
         {"id":"b_seed_4","type":"button","text":"See what's new","href":"https://versafooty.com","color":"#E63946"},
         {"id":"b_seed_5","type":"spacer","height":24},
         {"id":"b_seed_6","type":"footer","text":"You're receiving this because you opted in to product updates."}
       ]$json$::jsonb,
       true
WHERE NOT EXISTS (SELECT 1 FROM public.marketing_templates WHERE name = 'Product Update' AND is_builtin);

INSERT INTO public.marketing_templates (name, subject, mode, blocks_json, is_builtin)
SELECT 'Re-engagement',
       'We miss you, {{first_name|"champ"}}',
       'blocks',
       $json$[
         {"id":"b_seed_1","type":"heading","level":1,"align":"left","text":"Ready to get back on the ball?"},
         {"id":"b_seed_2","type":"paragraph","text":"Hey {{first_name|\"there\"}}, it's been a while. Your last streak was {{streak_days|\"a few\"}} days — let's pick it back up."},
         {"id":"b_seed_3","type":"paragraph","text":"Even 10 minutes a day rebuilds momentum. Here's a quick session to get you started."},
         {"id":"b_seed_4","type":"button","text":"Start a session","href":"https://versafooty.com","color":"#E63946"},
         {"id":"b_seed_5","type":"spacer","height":24},
         {"id":"b_seed_6","type":"footer","text":"Don't want these nudges? Manage your preferences below."}
       ]$json$::jsonb,
       true
WHERE NOT EXISTS (SELECT 1 FROM public.marketing_templates WHERE name = 'Re-engagement' AND is_builtin);

NOTIFY pgrst, 'reload schema';
