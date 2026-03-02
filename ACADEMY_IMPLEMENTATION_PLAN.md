# Versa Footy Web App — Academy & Institutional Features Implementation Plan

## Context & Business Rationale

Versa Footy is a gamified football training app for kids ages 7-14, built on Arsene Wenger's principle that technical skills must be mastered by age 14. The **iOS app** is the player-facing training tool where kids do exercises, earn XP, master skills, and compete on leaderboards. The **web app** (this project at `/Users/mubdu/Projects/Versa-Footy`) currently has a landing page, login, user settings, and an admin library (CRUD for categories/skills/exercises).

**The problem**: The app is designed for players, but the *buyer* is the academy director, coach, school, or ministry. They won't buy something that gives them zero visibility or control.

**The solution**: Build institutional features into the web app — coach dashboards, academy management, player analytics, and KPI reporting. The iOS app remains the player's training tool. The web app becomes the institutional control center.

**Unique value proposition**: Academy platforms (360Player, Classcard) manage coached sessions (scheduling, attendance, payments). Versa tracks what happens in the other 165 hours per week — structured, gamified, measurable individual practice at home. No competitor does this.

**Target market**: Saudi Arabia — hosting World Cup 2034, 300,000+ youth in school leagues, Ministry actively digitizing sports services. Ultimate goal: Ministry of Sports buys the program for all schools nationwide.

---

## Current Web App Tech Stack (Reference)

| Aspect | Technology |
|--------|-----------|
| Frontend | React 19 + Vite 7 |
| Language | JavaScript/JSX (TypeScript support available) |
| Styling | Tailwind CSS 4 + Radix UI components |
| Routing | Wouter (lightweight client-side router) |
| Auth | Supabase Email OTP (via `AuthContext.jsx`) |
| Database | Supabase (PostgreSQL) — direct client calls |
| Charts | Recharts (installed but unused) |
| Forms | React Hook Form + Zod validation |
| Animations | Framer Motion |
| Backend | Express.js (minimal — serves static files) |
| State | React Context (auth) + custom `useData` hook |

### Key Existing Files
- `client/src/lib/supabase.js` — Supabase client singleton
- `client/src/lib/AuthContext.jsx` — Auth state (user, session, profile, isAdmin)
- `client/src/components/ProtectedRoute.jsx` — Auth-gated routes
- `client/src/components/AdminProtectedRoute.jsx` — Admin-gated routes
- `client/src/AppRouter.jsx` — All route definitions (Wouter)
- `client/src/hooks/useData.js` — Fetches categories, skills, exercises from Supabase
- `client/src/features/library/LibraryApp.jsx` — Admin content management
- `client/src/constants/index.js` — AGE_GROUPS and other constants
- `supabase/migrations/` — Existing migration SQL files (001-005)

### Existing Supabase Tables (already created)
- `profiles` (id, email, full_name, is_admin)
- `player_profiles` (id, age_group, total_xp, current_level, current_streak, longest_streak, streak_shields, daily_xp_goal, last_practice_date, etc.)
- `categories` (id, name, icon, color)
- `skills` (id, category_id, name, age_group, description)
- `exercises` (id, skill_id, name, video_url, difficulty, description)
- `exercise_skills` (exercise_id, skill_id) — junction table
- `skill_progress` (id, user_id, skill_id, times_practiced, high_rated_completions, nailed_completions, total_rating_sum, status, mastered_at)
- `daily_activity` (id, user_id, activity_date, xp_earned, exercises_completed, practice_minutes, goal_met)
- `exercise_completions` (id, user_id, exercise_id, session_id, rating, xp_earned, is_first_time, duration_seconds)
- `training_sessions` (id, user_id, session_type, status, total_xp_earned, average_rating, started_at, completed_at)
- `user_achievements` (id, user_id, achievement_id, unlocked_at)
- `achievements` (id, name, description, criteria_json, xp_reward, rarity, category)

---

## Phase 1: Supabase Schema — Organizations, Teams, Roles, Invitations

### Migration File: `supabase/migrations/006_organizations_and_teams.sql`

Create these new tables:

#### `organizations` table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('academy', 'school', 'club', 'federation', 'ministry')),
  region TEXT,                    -- e.g., 'Riyadh', 'Jeddah', 'Eastern Province'
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
```

#### `organization_members` table
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'coach', 'player', 'parent')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, user_id)
);
```

**Role definitions:**
- `owner` — Created the organization. Full control including deletion and billing.
- `admin` — Manages coaches, players, teams. Can invite users. Sees all analytics.
- `coach` — Manages their assigned teams. Sees player progress for their players. Can assign training.
- `player` — A player linked to this organization. Their training data becomes visible to coaches/admins.
- `parent` — Linked to one or more player accounts. Read-only progress view.

#### `teams` table
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,              -- e.g., "U-12 Boys", "Advanced Group"
  age_group TEXT,                  -- optional: 'U-7', 'U-8', ..., 'U-15+'
  coach_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `team_members` table
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, player_id)
);
```

#### `invitations` table
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  email TEXT,                       -- null if using invite code
  invite_code TEXT UNIQUE,          -- 8-char alphanumeric code for bulk invites
  role TEXT NOT NULL CHECK (role IN ('coach', 'player', 'parent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by UUID REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `parent_player_links` table
```sql
CREATE TABLE parent_player_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, player_id, organization_id)
);
```

#### RLS Policies

```sql
-- Enable RLS on all new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_player_links ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS: Members can view their org. Owners/admins can update.
CREATE POLICY "Members can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners and admins can update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ORGANIZATION_MEMBERS: Members see fellow members. Owners/admins manage.
CREATE POLICY "Members can view org members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Owners and admins can manage members"
  ON organization_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can remove members"
  ON organization_members FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- TEAMS: Org members can view. Coaches/admins manage their teams.
CREATE POLICY "Org members can view teams"
  ON teams FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Coaches and admins can manage teams"
  ON teams FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coach')
    )
  );

-- TEAM_MEMBERS: Coaches of the team and admins can manage.
CREATE POLICY "Org members can view team members"
  ON team_members FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN organization_members om ON om.organization_id = t.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- INVITATIONS: Admins/owners can create and view invitations.
CREATE POLICY "Admins can manage invitations"
  ON invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coach')
    )
  );

-- Allow invited users to see their own invitation (by email match)
CREATE POLICY "Users can view their own invitations"
  ON invitations FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- PLAYER DATA ACCESS: Coaches/admins can read player data for their org's players
-- This is critical: it allows the dashboard to show player_profiles, skill_progress, etc.

CREATE POLICY "Coaches can view their org players' profiles"
  ON player_profiles FOR SELECT
  USING (
    id IN (
      SELECT om2.user_id FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.role IN ('owner', 'admin', 'coach')
        AND om2.role = 'player'
    )
    OR id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Coaches can view their org players' skill progress"
  ON skill_progress FOR SELECT
  USING (
    user_id IN (
      SELECT om2.user_id FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.role IN ('owner', 'admin', 'coach')
        AND om2.role = 'player'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Coaches can view their org players' daily activity"
  ON daily_activity FOR SELECT
  USING (
    user_id IN (
      SELECT om2.user_id FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.role IN ('owner', 'admin', 'coach')
        AND om2.role = 'player'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Coaches can view their org players' exercise completions"
  ON exercise_completions FOR SELECT
  USING (
    user_id IN (
      SELECT om2.user_id FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.role IN ('owner', 'admin', 'coach')
        AND om2.role = 'player'
    )
    OR user_id = auth.uid()
  );
```

#### Helper RPC Functions

```sql
-- Get the current user's role in an organization
CREATE OR REPLACE FUNCTION get_user_org_role(p_org_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM organization_members
  WHERE organization_id = p_org_id AND user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Get all organizations the current user belongs to
CREATE OR REPLACE FUNCTION get_my_organizations()
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
CREATE OR REPLACE FUNCTION get_academy_dashboard_stats(p_org_id UUID)
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
CREATE OR REPLACE FUNCTION get_academy_player_roster(p_org_id UUID)
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
  avg_rating NUMERIC
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
      SELECT ROUND(AVG(ec.rating), 1) FROM exercise_completions ec
      WHERE ec.user_id = pp.id AND ec.completed_at >= CURRENT_DATE - INTERVAL '30 days'
    ), 0) AS avg_rating
  FROM player_profiles pp
  JOIN organization_members om ON om.user_id = pp.id
  LEFT JOIN profiles p ON p.id = pp.id
  WHERE om.organization_id = p_org_id AND om.role = 'player';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Phase 2: Auth & Role System Updates

### Modify `AuthContext.jsx`

The existing `AuthContext` loads `profiles` to check `is_admin`. Extend it to also load the user's organization memberships.

**What to add to the auth context state:**
```javascript
// New state fields
const [organizations, setOrganizations] = useState([]); // [{id, name, type, role, player_count, coach_count}]
const [activeOrg, setActiveOrg] = useState(null);        // Currently selected organization

// New computed values
const isCoach = organizations.some(o => ['owner', 'admin', 'coach'].includes(o.role));
const isOrgAdmin = organizations.some(o => ['owner', 'admin'].includes(o.role));
```

**After successful auth, fetch organizations:**
```javascript
const { data: orgs } = await supabase.rpc('get_my_organizations');
setOrganizations(orgs || []);
if (orgs?.length > 0) setActiveOrg(orgs[0]); // Default to first org
```

### New Route Guard: `OrgProtectedRoute.jsx`

Create a new route guard component that checks if the user is a coach/admin of any organization:
- If user has no organizations → redirect to a "Create or Join Organization" page
- If user has organizations → render the child route
- Pass `activeOrg` and `organizations` to children via context

---

## Phase 3: New Pages & Routes

Add these routes to `AppRouter.jsx`:

### Academy/Coach Routes (require org membership with coach/admin/owner role)

| Route | Component | Description |
|-------|-----------|-------------|
| `/academy` | `AcademyDashboard.jsx` | Main KPI dashboard with summary stats |
| `/academy/players` | `PlayerRoster.jsx` | Full player list with sortable columns |
| `/academy/players/:id` | `PlayerDetail.jsx` | Deep-dive into one player |
| `/academy/teams` | `TeamManagement.jsx` | Create/edit teams, assign players |
| `/academy/invitations` | `InvitationManager.jsx` | Generate invite codes, send email invites, track status |
| `/academy/settings` | `AcademySettings.jsx` | Edit org name, logo, region, manage admins/coaches |

### Organization Setup Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/org/create` | `CreateOrganization.jsx` | Form to create a new academy/school/club |
| `/join/:code` | `JoinOrganization.jsx` | Accept an invitation via invite code |

### File Structure

```
client/src/features/academy/
├── AcademyDashboard.jsx       — Main dashboard with KPI cards + charts
├── PlayerRoster.jsx           — Sortable/filterable player table
├── PlayerDetail.jsx           — Individual player deep-dive
├── TeamManagement.jsx         — Team CRUD, drag players into teams
├── InvitationManager.jsx      — Generate codes, send invites, track status
├── AcademySettings.jsx        — Org settings, member management
├── CreateOrganization.jsx     — Create new org form
├── JoinOrganization.jsx       — Accept invite flow
├── components/
│   ├── KPICard.jsx            — Stat card (icon, value, label, trend)
│   ├── PlayerTable.jsx        — Reusable player data table
│   ├── PlayerRow.jsx          — Single player row with key stats
│   ├── EngagementChart.jsx    — Weekly/monthly activity line chart (Recharts)
│   ├── SkillRadarChart.jsx    — Skill category radar chart (Recharts)
│   ├── ActivityHeatmap.jsx    — GitHub-style practice calendar
│   ├── MasteryProgressBar.jsx — Skill mastery progress indicator
│   ├── InviteCodeCard.jsx     — Display/copy invite code
│   ├── OrgSwitcher.jsx        — Dropdown to switch between organizations
│   └── AtRiskBadge.jsx        — Warning badge for inactive players
├── hooks/
│   ├── useAcademyDashboard.js — Fetches dashboard stats via RPC
│   ├── usePlayerRoster.js     — Fetches player roster via RPC
│   ├── usePlayerDetail.js     — Fetches individual player data
│   ├── useTeams.js            — Team CRUD operations
│   └── useInvitations.js      — Invitation CRUD operations
└── styles/
    └── academy.css            — Academy-specific styles (optional)
```

---

## Phase 4: Academy Dashboard Implementation Details

### `AcademyDashboard.jsx` — The Main Screen

This is the most important screen — it's what you show academy directors when pitching.

**Layout:** Header with org name + switcher → KPI cards row → Charts row → At-risk players → Quick actions

**KPI Cards (top row, 4-6 cards):**

| Card | Data Source | Display |
|------|------------|---------|
| Total Players | `get_academy_dashboard_stats` → `total_players` | Number + "players enrolled" |
| Active This Week | `get_academy_dashboard_stats` → `active_this_week` | Number + percentage of total |
| Skills Mastered | `get_academy_dashboard_stats` → `total_skills_mastered` | Total across all players |
| Avg Player Level | `get_academy_dashboard_stats` → `avg_player_level` | Average level |
| Weekly XP | `get_academy_dashboard_stats` → `total_xp_this_week` | XP earned this week |
| Avg Streak | `get_academy_dashboard_stats` → `avg_streak` | Average consecutive days |

**Charts (middle section, Recharts):**

1. **Weekly Engagement Trend** (Line Chart)
   - X-axis: Last 12 weeks
   - Y-axis: Active players per week
   - Data: Query `daily_activity` grouped by week for org's players

2. **Skill Category Distribution** (Bar Chart)
   - X-axis: 10 skill categories
   - Y-axis: Average mastery % across all players
   - Data: Query `skill_progress` joined with `skills` for category grouping

3. **Age Group Breakdown** (Pie Chart)
   - Segments: Each age group
   - Values: Number of players per age group

**At-Risk Players Section:**
- Players who haven't trained in 7+ days
- Sorted by days since last practice (most inactive first)
- Show: Name, age group, last practice date, streak (if broken)
- Quick action: tap to view player detail

**Quick Actions:**
- "Invite Players" → `/academy/invitations`
- "View All Players" → `/academy/players`
- "Manage Teams" → `/academy/teams`

### `PlayerRoster.jsx` — Player Table

Full table of all players in the organization with these columns:

| Column | Sortable | Data |
|--------|----------|------|
| Player Name | Yes | display_name from player_profiles |
| Age Group | Yes | age_group |
| Level | Yes | current_level |
| XP (Total) | Yes | total_xp |
| XP (This Week) | Yes | Computed from daily_activity |
| Sessions (This Week) | Yes | Count from training_sessions |
| Skills Mastered | Yes | Count from skill_progress |
| Current Streak | Yes | current_streak |
| Avg Rating | Yes | Average from exercise_completions (last 30 days) |
| Last Active | Yes | last_practice_date |
| Status | No | Badge: "Active" (within 3 days), "Idle" (3-7 days), "Inactive" (7+ days) |

**Features:**
- Search by player name
- Filter by age group, team, status (active/idle/inactive)
- Click any row → navigate to `/academy/players/:id`
- Export to CSV button (future)

### `PlayerDetail.jsx` — Player Deep-Dive

When a coach clicks on a player, they see:

**Header:** Player name, age group, level, total XP, member since

**Tab 1: Overview**
- KPI cards: Level, Total XP, Current Streak, Skills Mastered
- Skill category radar chart (10 categories, mastery % per category)
- Activity heatmap (GitHub-style, last 6 months of daily practice)

**Tab 2: Skills**
- List of all 170 skills grouped by category
- Each skill shows: times practiced, average rating, mastery progress bar, mastered badge if applicable
- Filter: All / Mastered / In Progress / Not Started
- Color-code by age appropriateness (green = on track, yellow = behind, red = significantly behind)

**Tab 3: Training History**
- Table of recent training sessions
- Columns: Date, Session Type, Exercises Done, XP Earned, Avg Rating, Duration
- Click to expand → see individual exercise completions within that session

**Tab 4: Trends**
- XP earned per week (line chart, last 12 weeks)
- Average rating per week (line chart, shows quality improvement)
- Skills mastered cumulative (line chart, shows mastery acceleration)
- Practice minutes per week (bar chart)

### `TeamManagement.jsx`

- List of teams within the organization
- Create new team: name + age group + assign coach
- Click team → see roster of players in that team
- Add/remove players from team
- Each team shows: player count, avg level, active this week count

### `InvitationManager.jsx`

**Two invitation methods:**

1. **Invite by Email** — Enter email + role (player/coach/parent) → Supabase sends invite
2. **Invite by Code** — Generate an 8-character code → Share with players to self-register

**UI:**
- Tab 1: "Invite by Email" — Form with email input, role selector, optional team assignment, send button
- Tab 2: "Invite by Code" — Generate code button, display code with copy button, show QR code, set expiry
- Tab 3: "Pending Invitations" — Table of all invitations with status, actions (resend/revoke)

**Invite acceptance flow (for `/join/:code`):**
1. User opens link with invite code
2. If not logged in → redirect to login first, then back to join page
3. Show organization name, role being assigned, optional team
4. "Accept Invitation" button → creates `organization_members` entry, updates invitation status
5. Redirect to `/academy` if coach/admin, or back to home if player

### `CreateOrganization.jsx`

Simple form:
- Organization name (required)
- Type: Academy / School / Club (dropdown)
- Region (dropdown of Saudi provinces, or free text for international)
- City (free text)
- Description (optional textarea)
- Logo upload (optional, to Supabase storage)
- "Create" button → inserts into `organizations` + creates `organization_members` entry with role='owner'

---

## Phase 5: Navigation & Layout

### Add Academy Navigation

**Option A (recommended):** Add an "Academy" link to the existing header/nav for users who have organization memberships.

In `Header.jsx` or wherever the main nav is:
```jsx
{isCoach && (
  <Link href="/academy">Academy Dashboard</Link>
)}
```

### Org Switcher Component

If a user belongs to multiple organizations (e.g., a coach at two academies), show a dropdown in the academy section header to switch between them. The selected org determines which data is displayed.

### Sidebar Navigation (within `/academy/*` routes)

When inside the academy section, show a left sidebar with:
- Dashboard (overview)
- Players (roster)
- Teams
- Invitations
- Settings

Use existing Tailwind + Radix UI patterns. Match the dark theme used in the rest of the app.

---

## Phase 6: Data Hooks Implementation

### `useAcademyDashboard.js`
```javascript
// Calls supabase.rpc('get_academy_dashboard_stats', { p_org_id: activeOrg.id })
// Returns: { totalPlayers, activeThisWeek, activeThisMonth, totalSkillsMastered, avgPlayerLevel, avgStreak, totalXpThisWeek }
// Also fetches weekly engagement trend data from daily_activity
```

### `usePlayerRoster.js`
```javascript
// Calls supabase.rpc('get_academy_player_roster', { p_org_id: activeOrg.id })
// Returns array of player objects with all roster columns
// Supports client-side sorting and filtering
```

### `usePlayerDetail.js`
```javascript
// Fetches for a single player:
// 1. player_profiles row
// 2. All skill_progress rows (joined with skills for names/categories)
// 3. daily_activity for last 180 days (for heatmap)
// 4. exercise_completions for last 30 days (for recent activity)
// 5. training_sessions for last 30 days (for history tab)
// Computes: skill radar data, trend data, weekly aggregates
```

### `useTeams.js`
```javascript
// CRUD for teams table
// Also manages team_members (add/remove players)
// Fetches team list with player counts
```

### `useInvitations.js`
```javascript
// CRUD for invitations table
// Generate invite code: random 8-char alphanumeric
// Send email invite: insert with email, Supabase handles OTP on their first login
// List pending/accepted/expired invitations
```

---

## Implementation Order (Suggested)

1. **Supabase migration** — Create all tables, RLS policies, and RPC functions
2. **Auth context update** — Load organizations, add role-based flags
3. **Create Organization page** — So you can create a test academy
4. **Join Organization page** — Invite acceptance flow
5. **Invitation Manager** — Generate codes and email invites
6. **Player Roster** — Table of all players (the first thing a coach wants to see)
7. **Academy Dashboard** — KPI cards + charts (the selling screen)
8. **Player Detail** — Deep-dive view
9. **Team Management** — Create teams, assign players
10. **Academy Settings** — Org settings, member management

---

## After Web App: iOS App Changes Needed

Once the web app is done, come back to the iOS app to:

1. **Join Organization flow** — Let players accept invite codes from within the iOS app
2. **Coach Assignment indicator** — Show "Your coach assigned: Dribbling" in training flow
3. **Organization badge** — Show academy name/logo on player profile
4. **Sync organization membership** — Query `organization_members` on app launch

These iOS changes are minimal since the player training experience doesn't change — we're just adding organizational awareness.

---

## Verification & Testing Plan

1. **Create a test organization** via the Create Organization page
2. **Generate an invite code** via the Invitation Manager
3. **Accept the invite** from a second test account (use a different email)
4. **Verify the player shows up** in the Player Roster
5. **Train on the iOS app** with the player account (complete some exercises)
6. **Refresh the web dashboard** — verify XP, streaks, skills update
7. **Check Player Detail** — verify skill radar, activity heatmap, training history populate
8. **Test RLS** — verify a coach from org A cannot see players from org B
9. **Test team management** — create a team, add players, verify team filtering works
