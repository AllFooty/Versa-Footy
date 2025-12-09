/**
 * Diagnostic Script: Check Supabase RLS Policies
 * 
 * Run with: npx tsx script/check-rls-policies.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL');
  process.exit(1);
}

// Use service role key if available (bypasses RLS), otherwise use anon key
const keyToUse = supabaseServiceKey || supabaseAnonKey;
if (!keyToUse) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, keyToUse, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkRLSPolicies() {
  console.log('🔍 Checking Supabase RLS Configuration...\n');
  console.log('Using key type:', supabaseServiceKey ? 'SERVICE_ROLE (bypasses RLS)' : 'ANON');
  console.log('');

  // Check if tables have RLS enabled
  console.log('=== TABLE RLS STATUS ===');
  const { data: rlsStatus, error: rlsError } = await supabase.rpc('check_rls_status');
  
  if (rlsError) {
    // RPC doesn't exist, let's query pg_tables directly via a raw query approach
    console.log('(Cannot query RLS status directly, checking policies instead)\n');
  } else {
    console.log(rlsStatus);
  }

  // Check existing policies
  console.log('=== EXISTING RLS POLICIES ===');
  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies')
    .select('*');
  
  if (policiesError) {
    console.log('Cannot query pg_policies directly.\n');
    console.log('Let me try a different approach...\n');
  } else {
    console.log('Policies:', policies);
  }

  // Check if is_admin function exists by trying to call it
  console.log('=== CHECKING is_admin() FUNCTION ===');
  const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');
  
  if (adminError) {
    console.log('❌ is_admin() function error:', adminError.message);
    console.log('   This function may not exist or there is no authenticated user.\n');
  } else {
    console.log('✅ is_admin() returned:', adminCheck);
  }

  // Check profiles table for admin users
  console.log('\n=== ADMIN USERS IN PROFILES ===');
  const { data: adminUsers, error: adminUsersError } = await supabase
    .from('profiles')
    .select('id, email, is_admin')
    .eq('is_admin', true);

  if (adminUsersError) {
    console.log('❌ Error fetching admin users:', adminUsersError.message);
  } else if (!adminUsers || adminUsers.length === 0) {
    console.log('⚠️ No admin users found in profiles table!');
    console.log('   You need to set is_admin = true for your user in the profiles table.');
  } else {
    console.log('Admin users found:');
    adminUsers.forEach(u => console.log(`   - ${u.email} (id: ${u.id})`));
  }

  // Check all profiles
  console.log('\n=== ALL PROFILES ===');
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profiles')
    .select('id, email, is_admin');

  if (allProfilesError) {
    console.log('❌ Error fetching profiles:', allProfilesError.message);
  } else {
    console.log('All profiles:');
    allProfiles?.forEach(u => console.log(`   - ${u.email} | is_admin: ${u.is_admin}`));
  }

  // Test insert on exercises table
  console.log('\n=== TESTING EXERCISE INSERT ===');
  const testExercise = {
    skill_id: 1,
    name: 'TEST_DELETE_ME_' + Date.now(),
    difficulty: 1,
    description: 'Test exercise - safe to delete'
  };

  const { data: insertData, error: insertError } = await supabase
    .from('exercises')
    .insert(testExercise)
    .select()
    .single();

  if (insertError) {
    console.log('❌ INSERT failed:', insertError.message);
    console.log('   Error code:', insertError.code);
    console.log('   Details:', insertError.details);
    console.log('   Hint:', insertError.hint);
  } else {
    console.log('✅ INSERT succeeded! Exercise ID:', insertData.id);
    
    // Clean up test data
    const { error: deleteError } = await supabase
      .from('exercises')
      .delete()
      .eq('id', insertData.id);
    
    if (!deleteError) {
      console.log('   (Test exercise cleaned up)');
    }
  }

  // Check storage bucket
  console.log('\n=== STORAGE BUCKET CHECK ===');
  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets();

  if (bucketsError) {
    console.log('❌ Cannot list buckets:', bucketsError.message);
  } else {
    console.log('Available buckets:');
    buckets?.forEach(b => console.log(`   - ${b.name} (public: ${b.public})`));
    
    const exerciseVideoBucket = buckets?.find(b => b.name === 'exercise-videos');
    if (!exerciseVideoBucket) {
      console.log('\n⚠️ exercise-videos bucket NOT FOUND!');
      console.log('   You need to create this bucket in Supabase Storage.');
    } else {
      console.log('\n✅ exercise-videos bucket exists');
      console.log('   Public:', exerciseVideoBucket.public);
    }
  }

  console.log('\n=== DIAGNOSIS COMPLETE ===\n');
}

checkRLSPolicies().catch(console.error);

