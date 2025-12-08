/**
 * Restore Ball Mastery Category Script
 * 
 * Run with: npx tsx script/restore-ball-mastery.ts
 * 
 * This script restores the Ball Mastery category and all its skills
 * that were accidentally deleted.
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Ball Mastery category data
const ballMasteryCategory = {
  id: 1,
  name: 'Ball Mastery',
  icon: '⚽',
  color: '#E63946',
};

// All Ball Mastery skills (categoryId: 1)
const ballMasterySkills = [
  { category_id: 1, name: 'Toe Taps', age_group: 'U-7', description: 'Basic ball control with alternating feet' },
  { category_id: 1, name: 'Sole Rolls', age_group: 'U-7', description: 'Rolling the ball with the sole of the foot' },
  { category_id: 1, name: 'Inside-Outside Touch', age_group: 'U-8', description: 'Alternating between inside and outside of foot' },
  { category_id: 1, name: 'Sprint Dribble', age_group: 'U-8', description: 'Technical skill' },
  { category_id: 1, name: 'Outside Dribble', age_group: 'U-8', description: 'Technical skill' },
  { category_id: 1, name: 'Sole Dribble', age_group: 'U-8', description: 'Technical skill' },
  { category_id: 1, name: 'Inside Zig-Zag', age_group: 'U-9', description: 'Technical skill' },
  { category_id: 1, name: 'Outside Zig-Zag', age_group: 'U-9', description: 'Technical skill' },
  { category_id: 1, name: 'Foot Feint', age_group: 'U-9', description: 'Technical skill' },
  { category_id: 1, name: 'Directional Cut', age_group: 'U-9', description: 'Technical skill' },
  { category_id: 1, name: 'Combo Zig-Zag', age_group: 'U-10', description: 'Technical skill' },
  { category_id: 1, name: 'Stepover Turn', age_group: 'U-10', description: 'Technical skill' },
  { category_id: 1, name: 'Skill Move Combo', age_group: 'U-11', description: 'Technical skill' },
  { category_id: 1, name: 'La Croqueta', age_group: 'U-11', description: 'Technical skill' },
  { category_id: 1, name: 'Scoop Turn', age_group: 'U-11', description: 'Technical skill' },
  { category_id: 1, name: 'Bridge Skill', age_group: 'U-12', description: 'Technical skill' },
];

// Sample exercises for the basic skills
const ballMasteryExercises = [
  { name: 'Basic Toe Tap Drill', video_url: '', difficulty: 1, description: 'Stand over the ball and alternate touching the top with each foot' },
  { name: 'Speed Toe Taps', video_url: '', difficulty: 2, description: 'Increase speed while maintaining control' },
];

async function restoreBallMastery() {
  console.log('🔄 Starting Ball Mastery restoration...\n');

  try {
    // Step 1: Check if category already exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('*')
      .eq('name', 'Ball Mastery')
      .single();

    let categoryId: number;

    if (existingCategory) {
      console.log('✅ Ball Mastery category already exists (id:', existingCategory.id, ')');
      categoryId = existingCategory.id;
    } else {
      // Insert the category
      const { data: newCategory, error: categoryError } = await supabase
        .from('categories')
        .insert({
          name: ballMasteryCategory.name,
          icon: ballMasteryCategory.icon,
          color: ballMasteryCategory.color,
        })
        .select()
        .single();

      if (categoryError) {
        throw new Error(`Failed to insert category: ${categoryError.message}`);
      }

      console.log('✅ Ball Mastery category created (id:', newCategory.id, ')');
      categoryId = newCategory.id;
    }

    // Step 2: Check existing skills
    const { data: existingSkills } = await supabase
      .from('skills')
      .select('name')
      .eq('category_id', categoryId);

    const existingSkillNames = new Set(existingSkills?.map(s => s.name) || []);
    
    // Filter out skills that already exist
    const skillsToInsert = ballMasterySkills
      .filter(skill => !existingSkillNames.has(skill.name))
      .map(skill => ({
        ...skill,
        category_id: categoryId,
      }));

    if (skillsToInsert.length === 0) {
      console.log('✅ All Ball Mastery skills already exist');
    } else {
      // Insert skills
      const { data: insertedSkills, error: skillsError } = await supabase
        .from('skills')
        .insert(skillsToInsert)
        .select();

      if (skillsError) {
        throw new Error(`Failed to insert skills: ${skillsError.message}`);
      }

      console.log(`✅ Inserted ${insertedSkills?.length || 0} Ball Mastery skills`);
      
      // List inserted skills
      insertedSkills?.forEach(skill => {
        console.log(`   - ${skill.name} (${skill.age_group})`);
      });
    }

    // Step 3: Add sample exercises for Toe Taps skill if they don't exist
    const { data: toeTapsSkill } = await supabase
      .from('skills')
      .select('id')
      .eq('category_id', categoryId)
      .eq('name', 'Toe Taps')
      .single();

    if (toeTapsSkill) {
      const { data: existingExercises } = await supabase
        .from('exercises')
        .select('name')
        .eq('skill_id', toeTapsSkill.id);

      const existingExerciseNames = new Set(existingExercises?.map(e => e.name) || []);
      
      const exercisesToInsert = ballMasteryExercises
        .filter(ex => !existingExerciseNames.has(ex.name))
        .map(ex => ({
          ...ex,
          skill_id: toeTapsSkill.id,
        }));

      if (exercisesToInsert.length > 0) {
        const { error: exercisesError } = await supabase
          .from('exercises')
          .insert(exercisesToInsert);

        if (exercisesError) {
          console.warn(`⚠️ Warning: Could not insert exercises: ${exercisesError.message}`);
        } else {
          console.log(`✅ Inserted ${exercisesToInsert.length} sample exercises for Toe Taps`);
        }
      }
    }

    console.log('\n🎉 Ball Mastery restoration complete!');
    console.log('   Refresh your app to see the restored data.');

  } catch (error) {
    console.error('❌ Error during restoration:', error);
    process.exit(1);
  }
}

// Run the restoration
restoreBallMastery();
