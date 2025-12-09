/**
 * Admin Setup Fix Script
 * 
 * Run with: npx tsx script/fix-admin-setup.ts
 * 
 * This script will help diagnose and provide SQL to fix admin setup issues.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseAndFix() {
  console.log('🔍 Admin Setup Diagnostic\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('');

  // Check profiles with admin status
  console.log('=== PROFILES TABLE ===');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.log('❌ Error accessing profiles:', profilesError.message);
    
    if (profilesError.code === '42501' || profilesError.message.includes('permission')) {
      console.log('\n⚠️ RLS is blocking access to profiles table.');
      console.log('This is expected for anonymous users.\n');
    }
  } else {
    console.log('Profiles found:', profiles?.length || 0);
    profiles?.forEach(p => {
      console.log(`   - ${p.email} | is_admin: ${p.is_admin} | id: ${p.id}`);
    });
  }

  // Check if tables exist and their RLS status
  console.log('\n=== CHECKING TABLE ACCESS ===');
  
  const tables = ['categories', 'skills', 'exercises'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: accessible (${data?.length || 0} rows returned)`);
    }
  }

  // Check storage buckets
  console.log('\n=== STORAGE BUCKETS ===');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.log('❌ Cannot list buckets:', bucketsError.message);
  } else if (!buckets || buckets.length === 0) {
    console.log('No buckets found.');
  } else {
    buckets.forEach(b => {
      console.log(`   - ${b.name} (public: ${b.public})`);
    });
  }

  // Generate fix SQL
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    🛠️  FIX INSTRUCTIONS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Run the following SQL in your Supabase Dashboard SQL Editor:');
  console.log('(Go to: Project → SQL Editor → New Query)');
  console.log('');
  console.log('────────────────────────────────────────────────────────────────');
  console.log('STEP 1: Create storage bucket for exercise videos');
  console.log('────────────────────────────────────────────────────────────────');
  console.log(`
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-videos', 
  'exercise-videos', 
  true,
  104857600,  -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO UPDATE SET public = true;
`);

  console.log('────────────────────────────────────────────────────────────────');
  console.log('STEP 2: Find your user ID and set as admin');
  console.log('────────────────────────────────────────────────────────────────');
  console.log(`
-- First, see all users:
SELECT id, email FROM auth.users;

-- Then update the profile to be admin (replace YOUR_USER_ID):
UPDATE public.profiles 
SET is_admin = true 
WHERE id = 'YOUR_USER_ID';

-- Or update by email (replace your@email.com):
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'your@email.com';
`);

  console.log('────────────────────────────────────────────────────────────────');
  console.log('STEP 3: Verify is_admin() function exists');
  console.log('────────────────────────────────────────────────────────────────');
  console.log(`
-- Create or replace the is_admin function:
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
`);

  console.log('────────────────────────────────────────────────────────────────');
  console.log('STEP 4: Add RLS policies for admin operations');
  console.log('────────────────────────────────────────────────────────────────');
  console.log(`
-- Enable RLS on tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

DROP POLICY IF EXISTS "Anyone can view skills" ON public.skills;
DROP POLICY IF EXISTS "Admins can insert skills" ON public.skills;
DROP POLICY IF EXISTS "Admins can update skills" ON public.skills;
DROP POLICY IF EXISTS "Admins can delete skills" ON public.skills;

DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Admins can insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Admins can update exercises" ON public.exercises;
DROP POLICY IF EXISTS "Admins can delete exercises" ON public.exercises;

-- Categories policies
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_admin() = true);
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (public.is_admin() = true);
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (public.is_admin() = true);

-- Skills policies
CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Admins can insert skills" ON public.skills FOR INSERT WITH CHECK (public.is_admin() = true);
CREATE POLICY "Admins can update skills" ON public.skills FOR UPDATE USING (public.is_admin() = true);
CREATE POLICY "Admins can delete skills" ON public.skills FOR DELETE USING (public.is_admin() = true);

-- Exercises policies
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Admins can insert exercises" ON public.exercises FOR INSERT WITH CHECK (public.is_admin() = true);
CREATE POLICY "Admins can update exercises" ON public.exercises FOR UPDATE USING (public.is_admin() = true);
CREATE POLICY "Admins can delete exercises" ON public.exercises FOR DELETE USING (public.is_admin() = true);
`);

  console.log('────────────────────────────────────────────────────────────────');
  console.log('STEP 5: Add Storage policies for video uploads');
  console.log('────────────────────────────────────────────────────────────────');
  console.log(`
-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Anyone can view exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete exercise videos" ON storage.objects;

-- Create storage policies
CREATE POLICY "Anyone can view exercise videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exercise-videos');

CREATE POLICY "Admins can upload exercise videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exercise-videos' AND public.is_admin() = true);

CREATE POLICY "Admins can update exercise videos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'exercise-videos' AND public.is_admin() = true);

CREATE POLICY "Admins can delete exercise videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'exercise-videos' AND public.is_admin() = true);
`);

  console.log('────────────────────────────────────────────────────────────────');
  console.log('STEP 6: Grant permissions');
  console.log('────────────────────────────────────────────────────────────────');
  console.log(`
-- Grant table permissions
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.skills TO anon, authenticated;
GRANT SELECT ON public.exercises TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exercises TO authenticated;

-- Grant sequence permissions for auto-increment IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
`);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('After running all the SQL above:');
  console.log('1. Make sure your user has is_admin = true in profiles');
  console.log('2. Log out and log back in to refresh your session');
  console.log('3. Try adding an exercise again');
  console.log('');
}

diagnoseAndFix().catch(console.error);

