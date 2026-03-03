-- ============================================
-- Migration 006: Organizations, Teams, Invitations
-- Academy/institutional features for Versa Footy
-- ============================================

-- ============================================
-- 0. PRE-REQUISITE: Add display_name to player_profiles
--    (Used by the iOS sync service and the roster RPC)
-- ============================================
ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- ============================================
-- 1. ORGANIZATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('academy', 'school', 'club', 'federation', 'ministry')),
  region TEXT,
  city TEXT,
  country TEXT DEFAULT 'Saudi Arabia',
  logo_url TEXT,
  description TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. ORGANIZATION MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'coach', 'player', 'parent')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, user_id)
);

-- ============================================
-- 3. TEAMS
-- ============================================
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group TEXT,
  coach_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. TEAM MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, player_id)
);

-- ============================================
-- 5. INVITATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  email TEXT,
  invite_code TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('coach', 'player', 'parent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by UUID REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. PARENT-PLAYER LINKS
-- ============================================
CREATE TABLE IF NOT EXISTS public.parent_player_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, player_id, organization_id)
);

-- ============================================
-- 7. ENABLE RLS ON ALL NEW TABLES
-- ============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_player_links ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS POLICIES — ORGANIZATIONS
-- ============================================

-- Members can view their own organization
CREATE POLICY "Members can view their organization"
  ON public.organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Owners and admins can update their organization
CREATE POLICY "Owners and admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- 9. RLS POLICIES — ORGANIZATION MEMBERS
-- ============================================

-- Members can view fellow members
CREATE POLICY "Members can view org members"
  ON public.organization_members FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Owners and admins can add members (e.g., from web dashboard)
CREATE POLICY "Owners and admins can manage members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Users can join via invitation (iOS/web invite code flow)
-- Requires: user is adding themselves AND a valid pending invitation exists for that org
CREATE POLICY "Users can join via invitation"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM invitations
      WHERE invitations.organization_id = organization_members.organization_id
        AND invitations.status = 'pending'
        AND (invitations.expires_at IS NULL OR invitations.expires_at > now())
    )
  );

-- Owners and admins can remove members
CREATE POLICY "Owners and admins can remove members"
  ON public.organization_members FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Owners and admins can update member roles
CREATE POLICY "Owners and admins can update members"
  ON public.organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Members can leave organizations (remove their own row)
CREATE POLICY "Members can leave organizations"
  ON public.organization_members FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 10. RLS POLICIES — TEAMS
-- ============================================

-- Org members can view teams
CREATE POLICY "Org members can view teams"
  ON public.teams FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Coaches and admins can manage teams
CREATE POLICY "Coaches and admins can manage teams"
  ON public.teams FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coach')
    )
  );

-- ============================================
-- 11. RLS POLICIES — TEAM MEMBERS
-- ============================================

-- Org members can view team members
CREATE POLICY "Org members can view team members"
  ON public.team_members FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN organization_members om ON om.organization_id = t.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Players can join teams (when they're a member of the org that owns the team)
CREATE POLICY "Players can join teams"
  ON public.team_members FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM organization_members om
      JOIN teams t ON t.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND t.id = team_members.team_id
    )
  );

-- Players can leave teams (remove their own row)
CREATE POLICY "Players can leave teams"
  ON public.team_members FOR DELETE
  USING (player_id = auth.uid());

-- Coaches and admins can manage team members
CREATE POLICY "Coaches and admins can manage team members"
  ON public.team_members FOR ALL
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN organization_members om ON om.organization_id = t.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'coach')
    )
  );

-- ============================================
-- 12. RLS POLICIES — INVITATIONS
-- ============================================

-- Admins/coaches can manage invitations for their org
CREATE POLICY "Admins can manage invitations"
  ON public.invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coach')
    )
  );

-- Users can view invitations sent to their email
CREATE POLICY "Users can view their own invitations"
  ON public.invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Anyone authenticated can look up a pending invite code (for the join flow)
CREATE POLICY "Users can lookup invite codes"
  ON public.invitations FOR SELECT
  USING (
    status = 'pending'
    AND invite_code IS NOT NULL
  );

-- Users can accept invitations (update status to 'accepted')
CREATE POLICY "Users can accept invitations"
  ON public.invitations FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (
    accepted_by = auth.uid()
    AND status = 'accepted'
  );

-- ============================================
-- 13. RLS POLICIES — PARENT-PLAYER LINKS
-- ============================================

CREATE POLICY "Parents can view their links"
  ON public.parent_player_links FOR SELECT
  USING (parent_id = auth.uid() OR player_id = auth.uid());

-- ============================================
-- 14. COACH VISIBILITY ON EXISTING TABLES
-- Coaches/admins can read their org players' data
-- ============================================

CREATE POLICY "Coaches can view their org players profiles"
  ON public.player_profiles FOR SELECT
  USING (
    id IN (
      SELECT om2.user_id FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.role IN ('owner', 'admin', 'coach')
        AND om2.role = 'player'
    )
  );

CREATE POLICY "Coaches can view their org players skill progress"
  ON public.skill_progress FOR SELECT
  USING (
    user_id IN (
      SELECT om2.user_id FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.role IN ('owner', 'admin', 'coach')
        AND om2.role = 'player'
    )
  );

CREATE POLICY "Coaches can view their org players daily activity"
  ON public.daily_activity FOR SELECT
  USING (
    user_id IN (
      SELECT om2.user_id FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.role IN ('owner', 'admin', 'coach')
        AND om2.role = 'player'
    )
  );

CREATE POLICY "Coaches can view their org players exercise completions"
  ON public.exercise_completions FOR SELECT
  USING (
    user_id IN (
      SELECT om2.user_id FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.role IN ('owner', 'admin', 'coach')
        AND om2.role = 'player'
    )
  );

-- ============================================
-- 15. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role);
CREATE INDEX IF NOT EXISTS idx_teams_org ON public.teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_coach ON public.teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_player ON public.team_members(player_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- ============================================
-- 16. GRANTS
-- ============================================
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invitations TO authenticated;
GRANT SELECT, INSERT ON public.parent_player_links TO authenticated;

-- ============================================
-- 17. UPDATED_AT TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS teams_updated_at ON public.teams;
CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 18. RPC FUNCTIONS
-- ============================================

-- Get the current user's role in an organization
CREATE OR REPLACE FUNCTION public.get_user_org_role(p_org_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM organization_members
  WHERE organization_id = p_org_id AND user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Get all organizations the current user belongs to
CREATE OR REPLACE FUNCTION public.get_my_organizations()
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  role TEXT,
  player_count BIGINT,
  coach_count BIGINT
) AS $$
  SELECT
    o.id, o.name, o.type, om.role,
    (SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id AND role = 'player'),
    (SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id AND role = 'coach')
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Get academy dashboard summary stats
CREATE OR REPLACE FUNCTION public.get_academy_dashboard_stats(p_org_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify caller is admin/owner/coach in this org
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
    AND role IN ('owner', 'admin', 'coach')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_players', (SELECT COUNT(*) FROM organization_members WHERE organization_id = p_org_id AND role = 'player'),
    'active_this_week', (
      SELECT COUNT(DISTINCT da.user_id)
      FROM daily_activity da
      JOIN organization_members om ON om.user_id = da.user_id
      WHERE om.organization_id = p_org_id AND om.role = 'player'
      AND da.activity_date >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'active_this_month', (
      SELECT COUNT(DISTINCT da.user_id)
      FROM daily_activity da
      JOIN organization_members om ON om.user_id = da.user_id
      WHERE om.organization_id = p_org_id AND om.role = 'player'
      AND da.activity_date >= CURRENT_DATE - INTERVAL '30 days'
    ),
    'total_skills_mastered', (
      SELECT COUNT(*)
      FROM skill_progress sp
      JOIN organization_members om ON om.user_id = sp.user_id
      WHERE om.organization_id = p_org_id AND om.role = 'player'
      AND sp.status = 'mastered'
    ),
    'avg_player_level', (
      SELECT ROUND(AVG(pp.current_level), 1)
      FROM player_profiles pp
      JOIN organization_members om ON om.user_id = pp.id
      WHERE om.organization_id = p_org_id AND om.role = 'player'
    ),
    'avg_streak', (
      SELECT ROUND(AVG(pp.current_streak), 1)
      FROM player_profiles pp
      JOIN organization_members om ON om.user_id = pp.id
      WHERE om.organization_id = p_org_id AND om.role = 'player'
    ),
    'total_xp_this_week', (
      SELECT COALESCE(SUM(da.xp_earned), 0)
      FROM daily_activity da
      JOIN organization_members om ON om.user_id = da.user_id
      WHERE om.organization_id = p_org_id AND om.role = 'player'
      AND da.activity_date >= CURRENT_DATE - INTERVAL '7 days'
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get player roster with progress summary for an organization
-- NOTE: Uses self_rating (not "rating") to match the exercise_completions schema
CREATE OR REPLACE FUNCTION public.get_academy_player_roster(p_org_id UUID)
RETURNS TABLE (
  player_id UUID,
  display_name TEXT,
  age_group TEXT,
  current_level INT,
  total_xp INT,
  current_streak INT,
  longest_streak INT,
  last_practice_date DATE,
  skills_mastered BIGINT,
  total_skills_practiced BIGINT,
  xp_this_week BIGINT,
  sessions_this_week BIGINT,
  avg_self_rating NUMERIC
) AS $$
BEGIN
  -- Verify caller is admin/owner/coach in this org
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
    AND role IN ('owner', 'admin', 'coach')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    pp.id AS player_id,
    COALESCE(pp.display_name, p.full_name, 'Unknown') AS display_name,
    pp.age_group,
    pp.current_level,
    pp.total_xp,
    pp.current_streak,
    pp.longest_streak,
    pp.last_practice_date,
    (SELECT COUNT(*) FROM skill_progress sp WHERE sp.user_id = pp.id AND sp.status = 'mastered') AS skills_mastered,
    (SELECT COUNT(*) FROM skill_progress sp WHERE sp.user_id = pp.id AND sp.times_practiced > 0) AS total_skills_practiced,
    COALESCE((
      SELECT SUM(da.xp_earned) FROM daily_activity da
      WHERE da.user_id = pp.id AND da.activity_date >= CURRENT_DATE - INTERVAL '7 days'
    ), 0) AS xp_this_week,
    COALESCE((
      SELECT COUNT(*) FROM training_sessions ts
      WHERE ts.user_id = pp.id AND ts.completed_at >= CURRENT_DATE - INTERVAL '7 days' AND ts.status = 'completed'
    ), 0) AS sessions_this_week,
    COALESCE((
      SELECT ROUND(AVG(ec.self_rating), 1) FROM exercise_completions ec
      WHERE ec.user_id = pp.id AND ec.completed_at >= CURRENT_DATE - INTERVAL '30 days'
    ), 0) AS avg_self_rating
  FROM player_profiles pp
  JOIN organization_members om ON om.user_id = pp.id
  LEFT JOIN profiles p ON p.id = pp.id
  WHERE om.organization_id = p_org_id AND om.role = 'player';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create organization atomically (inserts org + adds creator as owner)
-- Called by web app's CreateOrganization.jsx
CREATE OR REPLACE FUNCTION public.create_organization(
  p_name TEXT,
  p_type TEXT,
  p_region TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
)
RETURNS public.organizations AS $$
DECLARE
  new_org public.organizations;
BEGIN
  -- Insert the organization
  INSERT INTO public.organizations (name, type, region, city, created_by)
  VALUES (p_name, p_type, p_region, p_city, auth.uid())
  RETURNING * INTO new_org;

  -- Add the creator as owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org.id, auth.uid(), 'owner');

  RETURN new_org;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_organizations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_academy_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_academy_player_roster(UUID) TO authenticated;

-- ============================================
-- 19. VERIFY
-- ============================================
SELECT 'organizations' AS table_name, count(*) AS columns
FROM information_schema.columns
WHERE table_name = 'organizations' AND table_schema = 'public';

SELECT 'organization_members' AS table_name, count(*) AS columns
FROM information_schema.columns
WHERE table_name = 'organization_members' AND table_schema = 'public';

SELECT 'teams' AS table_name, count(*) AS columns
FROM information_schema.columns
WHERE table_name = 'teams' AND table_schema = 'public';

SELECT 'invitations' AS table_name, count(*) AS columns
FROM information_schema.columns
WHERE table_name = 'invitations' AND table_schema = 'public';
