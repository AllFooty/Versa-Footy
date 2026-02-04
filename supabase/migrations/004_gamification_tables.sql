-- ============================================
-- Versa Footy Gamification System
-- "Duolingo for Kids Football" Tables
-- ============================================

-- ============================================
-- 1. PLAYER PROFILES (extends existing profiles)
-- Stores gamification data for each player
-- ============================================
CREATE TABLE IF NOT EXISTS public.player_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- Age-based personalization
  birth_date DATE,
  age_group VARCHAR(10), -- 'U-7' through 'U-15+'

  -- Overall progress
  total_xp INTEGER DEFAULT 0 NOT NULL,
  current_level INTEGER DEFAULT 1 NOT NULL,

  -- Streak tracking (kid-friendly)
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_practice_date DATE,
  streak_shields INTEGER DEFAULT 3 NOT NULL, -- Protect streaks when missing days

  -- Daily goals
  daily_xp_goal INTEGER DEFAULT 50 NOT NULL,

  -- Onboarding
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own player profile
CREATE POLICY "Users can view own player profile"
  ON public.player_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own player profile
CREATE POLICY "Users can update own player profile"
  ON public.player_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own player profile
CREATE POLICY "Users can insert own player profile"
  ON public.player_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all player profiles
CREATE POLICY "Admins can view all player profiles"
  ON public.player_profiles
  FOR SELECT
  USING (public.is_admin() = true);

-- Updated at trigger
DROP TRIGGER IF EXISTS player_profiles_updated_at ON public.player_profiles;
CREATE TRIGGER player_profiles_updated_at
  BEFORE UPDATE ON public.player_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.player_profiles TO authenticated;

-- ============================================
-- 2. SKILL PROGRESS
-- Tracks per-skill leveling for each player
-- ============================================
CREATE TABLE IF NOT EXISTS public.skill_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id INTEGER REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,

  -- Progress metrics
  skill_xp INTEGER DEFAULT 0 NOT NULL,
  skill_level INTEGER DEFAULT 0 NOT NULL, -- 0=locked, 1-5=progress levels

  -- Completion tracking
  times_practiced INTEGER DEFAULT 0 NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'mastered')),
  unlocked_at TIMESTAMP WITH TIME ZONE,
  mastered_at TIMESTAMP WITH TIME ZONE,
  last_practiced_at TIMESTAMP WITH TIME ZONE,

  -- Spaced repetition (for review scheduling)
  review_due_at DATE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, skill_id)
);

-- Enable RLS
ALTER TABLE public.skill_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own skill progress
CREATE POLICY "Users can view own skill progress"
  ON public.skill_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own skill progress
CREATE POLICY "Users can insert own skill progress"
  ON public.skill_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own skill progress
CREATE POLICY "Users can update own skill progress"
  ON public.skill_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated at trigger
DROP TRIGGER IF EXISTS skill_progress_updated_at ON public.skill_progress;
CREATE TRIGGER skill_progress_updated_at
  BEFORE UPDATE ON public.skill_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skill_progress_user ON public.skill_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_status ON public.skill_progress(status);
CREATE INDEX IF NOT EXISTS idx_skill_progress_review ON public.skill_progress(review_due_at);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.skill_progress TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.skill_progress_id_seq TO authenticated;

-- ============================================
-- 3. TRAINING SESSIONS
-- Groups exercise completions into sessions
-- ============================================
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Session type
  session_type VARCHAR(20) DEFAULT 'standard' CHECK (session_type IN (
    'quick',        -- 10-15 min, 3-4 exercises
    'standard',     -- 20-25 min, 5-7 exercises
    'deep',         -- 30-40 min, 8-10 exercises
    'review'        -- Spaced repetition review
  )),

  -- Status
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Session metrics
  exercises_completed INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own training sessions"
  ON public.training_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own training sessions"
  ON public.training_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own training sessions"
  ON public.training_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_sessions_user ON public.training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON public.training_sessions(started_at);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.training_sessions TO authenticated;

-- ============================================
-- 4. EXERCISE COMPLETIONS
-- Tracks individual exercise completions within sessions
-- ============================================
CREATE TABLE IF NOT EXISTS public.exercise_completions (
  id SERIAL PRIMARY KEY,
  session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id INTEGER REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  skill_id INTEGER REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,

  -- Completion details
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Self-assessment (kid-friendly ratings 1-5)
  -- 1=Tough!, 2=Tricky, 3=OK, 4=Good!, 5=Nailed it!
  self_rating INTEGER CHECK (self_rating BETWEEN 1 AND 5),

  -- XP earned
  xp_earned INTEGER DEFAULT 0,

  -- First time bonus
  is_first_time BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own completions
CREATE POLICY "Users can view own exercise completions"
  ON public.exercise_completions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can insert own exercise completions"
  ON public.exercise_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_completions_user ON public.exercise_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_session ON public.exercise_completions(session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_date ON public.exercise_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_exercise ON public.exercise_completions(exercise_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.exercise_completions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.exercise_completions_id_seq TO authenticated;

-- ============================================
-- 5. DAILY ACTIVITY
-- Tracks daily progress for streaks and goals
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_date DATE NOT NULL,

  -- Daily metrics
  xp_earned INTEGER DEFAULT 0 NOT NULL,
  exercises_completed INTEGER DEFAULT 0 NOT NULL,

  -- Goal tracking
  goal_met BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, activity_date)
);

-- Enable RLS
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

-- Users can view their own daily activity
CREATE POLICY "Users can view own daily activity"
  ON public.daily_activity
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own daily activity
CREATE POLICY "Users can insert own daily activity"
  ON public.daily_activity
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own daily activity
CREATE POLICY "Users can update own daily activity"
  ON public.daily_activity
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated at trigger
DROP TRIGGER IF EXISTS daily_activity_updated_at ON public.daily_activity;
CREATE TRIGGER daily_activity_updated_at
  BEFORE UPDATE ON public.daily_activity
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity(user_id, activity_date);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.daily_activity TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.daily_activity_id_seq TO authenticated;

-- ============================================
-- 6. ACHIEVEMENTS (Definitions)
-- Defines available achievements/badges
-- ============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id SERIAL PRIMARY KEY,

  -- Basic info
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,

  -- Visual
  icon VARCHAR(50) NOT NULL, -- Emoji or icon name
  color VARCHAR(7) DEFAULT '#FFD700', -- Gold default

  -- Categorization
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'milestone',      -- XP milestones, levels
    'streak',         -- Streak achievements
    'skill_mastery',  -- Mastering skills
    'category_master',-- Mastering categories
    'practice',       -- Practice time achievements
    'explorer'        -- Trying new things
  )),

  -- Unlock criteria (JSON for flexibility)
  -- e.g., {"type": "xp_total", "value": 100}
  -- e.g., {"type": "streak_days", "value": 7}
  criteria JSONB NOT NULL,

  -- Rewards
  xp_reward INTEGER DEFAULT 0,

  -- Rarity for display
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN (
    'common', 'uncommon', 'rare', 'epic', 'legendary'
  )),

  -- Ordering & visibility
  sort_order INTEGER DEFAULT 0,
  is_secret BOOLEAN DEFAULT FALSE, -- Hidden until unlocked
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (public read for achievement definitions)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view achievements
CREATE POLICY "Authenticated users can view achievements"
  ON public.achievements
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can modify achievements
CREATE POLICY "Admins can manage achievements"
  ON public.achievements
  FOR ALL
  USING (public.is_admin() = true);

-- Grant permissions
GRANT SELECT ON public.achievements TO authenticated;

-- ============================================
-- 7. USER ACHIEVEMENTS (Earned Badges)
-- Tracks which achievements each user has earned
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id INTEGER REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,

  -- Unlock details
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Display preference
  is_featured BOOLEAN DEFAULT FALSE, -- Show on profile
  is_new BOOLEAN DEFAULT TRUE, -- Unviewed notification

  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own achievements (earned through app logic)
CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own achievements (mark as viewed, etc.)
CREATE POLICY "Users can update own achievements"
  ON public.user_achievements
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_new ON public.user_achievements(is_new) WHERE is_new = TRUE;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_achievements TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.user_achievements_id_seq TO authenticated;

-- ============================================
-- 8. SEED INITIAL ACHIEVEMENTS
-- ============================================
INSERT INTO public.achievements (name, description, icon, category, criteria, xp_reward, rarity, sort_order) VALUES
-- Milestone achievements
('First Steps', 'Complete your first exercise', '👟', 'milestone', '{"type": "exercises_completed", "value": 1}', 25, 'common', 1),
('Getting Started', 'Earn 100 XP', '⭐', 'milestone', '{"type": "xp_total", "value": 100}', 50, 'common', 2),
('Triple Threat', 'Complete 10 exercises', '🎯', 'milestone', '{"type": "exercises_completed", "value": 10}', 75, 'common', 3),
('Century Club', 'Complete 100 exercises', '💯', 'milestone', '{"type": "exercises_completed", "value": 100}', 200, 'rare', 4),
('XP Hunter', 'Earn 1,000 total XP', '🏅', 'milestone', '{"type": "xp_total", "value": 1000}', 100, 'uncommon', 5),
('XP Master', 'Earn 10,000 total XP', '🏆', 'milestone', '{"type": "xp_total", "value": 10000}', 500, 'epic', 6),
('Double Digits', 'Reach Level 10', '🔟', 'milestone', '{"type": "player_level", "value": 10}', 150, 'uncommon', 7),

-- Streak achievements
('Three-peat', 'Maintain a 3-day streak', '3️⃣', 'streak', '{"type": "streak_days", "value": 3}', 30, 'common', 10),
('Week Warrior', 'Maintain a 7-day streak', '📅', 'streak', '{"type": "streak_days", "value": 7}', 75, 'uncommon', 11),
('Fortnight Focus', 'Maintain a 14-day streak', '🔥', 'streak', '{"type": "streak_days", "value": 14}', 150, 'rare', 12),
('Monthly Master', 'Maintain a 30-day streak', '🌟', 'streak', '{"type": "streak_days", "value": 30}', 300, 'epic', 13),

-- Skill mastery achievements
('Skill Starter', 'Master your first skill', '🎯', 'skill_mastery', '{"type": "skills_mastered", "value": 1}', 100, 'uncommon', 20),
('Versatile', 'Master 5 skills', '🖐️', 'skill_mastery', '{"type": "skills_mastered", "value": 5}', 250, 'rare', 21),
('Skill Collector', 'Master 10 skills', '🎪', 'skill_mastery', '{"type": "skills_mastered", "value": 10}', 500, 'epic', 22),

-- Explorer achievements
('Explorer', 'Try exercises from 3 different categories', '🗺️', 'explorer', '{"type": "categories_tried", "value": 3}', 50, 'common', 30),
('All-Rounder', 'Try exercises from all categories', '🌍', 'explorer', '{"type": "categories_tried", "value": 10}', 150, 'uncommon', 31),
('Challenge Seeker', 'Complete a 5-star difficulty exercise', '⭐', 'explorer', '{"type": "difficulty_completed", "value": 5}', 100, 'rare', 32)

ON CONFLICT DO NOTHING;
