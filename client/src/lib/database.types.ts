export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AgeGroup = 'U-7' | 'U-8' | 'U-9' | 'U-10' | 'U-11' | 'U-12' | 'U-13' | 'U-14' | 'U-15+'
export type SessionType = 'quick' | 'standard' | 'deep' | 'review'
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'
export type SkillStatus = 'locked' | 'available' | 'in_progress' | 'mastered'
export type AchievementCategory = 'milestone' | 'streak' | 'skill_mastery' | 'category_master' | 'practice' | 'explorer'
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          is_admin: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          is_admin?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          is_admin?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: number | null
          id: number
          name: string
          skill_id: number
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: number | null
          id?: number
          name: string
          skill_id: number
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: number | null
          id?: number
          name?: string
          skill_id?: number
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          age_group: string | null
          category_id: number
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          category_id: number
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          category_id?: number
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      // ============================================
      // GAMIFICATION TABLES
      // ============================================
      player_profiles: {
        Row: {
          id: string
          birth_date: string | null
          age_group: string | null
          total_xp: number
          current_level: number
          current_streak: number
          longest_streak: number
          last_practice_date: string | null
          streak_shields: number
          daily_xp_goal: number
          onboarding_completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          birth_date?: string | null
          age_group?: string | null
          total_xp?: number
          current_level?: number
          current_streak?: number
          longest_streak?: number
          last_practice_date?: string | null
          streak_shields?: number
          daily_xp_goal?: number
          onboarding_completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          birth_date?: string | null
          age_group?: string | null
          total_xp?: number
          current_level?: number
          current_streak?: number
          longest_streak?: number
          last_practice_date?: string | null
          streak_shields?: number
          daily_xp_goal?: number
          onboarding_completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      skill_progress: {
        Row: {
          id: number
          user_id: string
          skill_id: number
          category_id: number
          skill_xp: number
          skill_level: number
          times_practiced: number
          high_rated_completions: number
          nailed_completions: number
          total_rating_sum: number
          status: string
          unlocked_at: string | null
          mastered_at: string | null
          last_practiced_at: string | null
          review_due_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          skill_id: number
          category_id: number
          skill_xp?: number
          skill_level?: number
          times_practiced?: number
          high_rated_completions?: number
          nailed_completions?: number
          total_rating_sum?: number
          status?: string
          unlocked_at?: string | null
          mastered_at?: string | null
          last_practiced_at?: string | null
          review_due_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          skill_id?: number
          category_id?: number
          skill_xp?: number
          skill_level?: number
          times_practiced?: number
          high_rated_completions?: number
          nailed_completions?: number
          total_rating_sum?: number
          status?: string
          unlocked_at?: string | null
          mastered_at?: string | null
          last_practiced_at?: string | null
          review_due_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_progress_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      training_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: string
          status: string
          started_at: string
          completed_at: string | null
          exercises_completed: number
          total_xp_earned: number
          average_rating: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_type?: string
          status?: string
          started_at?: string
          completed_at?: string | null
          exercises_completed?: number
          total_xp_earned?: number
          average_rating?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: string
          status?: string
          started_at?: string
          completed_at?: string | null
          exercises_completed?: number
          total_xp_earned?: number
          average_rating?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      exercise_completions: {
        Row: {
          id: number
          session_id: string | null
          user_id: string
          exercise_id: number
          skill_id: number
          completed_at: string
          self_rating: number | null
          xp_earned: number
          is_first_time: boolean
          duration_seconds: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          session_id?: string | null
          user_id: string
          exercise_id: number
          skill_id: number
          completed_at?: string
          self_rating?: number | null
          xp_earned?: number
          is_first_time?: boolean
          duration_seconds?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          session_id?: string | null
          user_id?: string
          exercise_id?: number
          skill_id?: number
          completed_at?: string
          self_rating?: number | null
          xp_earned?: number
          is_first_time?: boolean
          duration_seconds?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_completions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_completions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_completions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_activity: {
        Row: {
          id: number
          user_id: string
          activity_date: string
          xp_earned: number
          exercises_completed: number
          practice_minutes: number
          goal_met: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          activity_date: string
          xp_earned?: number
          exercises_completed?: number
          practice_minutes?: number
          goal_met?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          activity_date?: string
          xp_earned?: number
          exercises_completed?: number
          practice_minutes?: number
          goal_met?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      achievements: {
        Row: {
          id: number
          name: string
          description: string
          icon: string
          color: string
          category: string
          criteria: Json
          xp_reward: number
          rarity: string
          sort_order: number
          is_secret: boolean
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: number
          name: string
          description: string
          icon: string
          color?: string
          category: string
          criteria: Json
          xp_reward?: number
          rarity?: string
          sort_order?: number
          is_secret?: boolean
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string
          icon?: string
          color?: string
          category?: string
          criteria?: Json
          xp_reward?: number
          rarity?: string
          sort_order?: number
          is_secret?: boolean
          is_active?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          id: number
          user_id: string
          achievement_id: number
          unlocked_at: string
          is_featured: boolean
          is_new: boolean
        }
        Insert: {
          id?: number
          user_id: string
          achievement_id: number
          unlocked_at?: string
          is_featured?: boolean
          is_new?: boolean
        }
        Update: {
          id?: number
          user_id?: string
          achievement_id?: number
          unlocked_at?: string
          is_featured?: boolean
          is_new?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          }
        ]
      }
      exercise_skills: {
        Row: {
          id: number
          exercise_id: number
          skill_id: number
          created_at: string | null
        }
        Insert: {
          id?: number
          exercise_id: number
          skill_id: number
          created_at?: string | null
        }
        Update: {
          id?: number
          exercise_id?: number
          skill_id?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_skills_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type Skill = Database['public']['Tables']['skills']['Row']
export type SkillInsert = Database['public']['Tables']['skills']['Insert']
export type SkillUpdate = Database['public']['Tables']['skills']['Update']

export type Exercise = Database['public']['Tables']['exercises']['Row']
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert']
export type ExerciseUpdate = Database['public']['Tables']['exercises']['Update']

// Gamification types
export type PlayerProfile = Database['public']['Tables']['player_profiles']['Row']
export type PlayerProfileInsert = Database['public']['Tables']['player_profiles']['Insert']
export type PlayerProfileUpdate = Database['public']['Tables']['player_profiles']['Update']

export type SkillProgress = Database['public']['Tables']['skill_progress']['Row']
export type SkillProgressInsert = Database['public']['Tables']['skill_progress']['Insert']
export type SkillProgressUpdate = Database['public']['Tables']['skill_progress']['Update']

export type TrainingSession = Database['public']['Tables']['training_sessions']['Row']
export type TrainingSessionInsert = Database['public']['Tables']['training_sessions']['Insert']
export type TrainingSessionUpdate = Database['public']['Tables']['training_sessions']['Update']

export type ExerciseCompletion = Database['public']['Tables']['exercise_completions']['Row']
export type ExerciseCompletionInsert = Database['public']['Tables']['exercise_completions']['Insert']

export type DailyActivity = Database['public']['Tables']['daily_activity']['Row']
export type DailyActivityInsert = Database['public']['Tables']['daily_activity']['Insert']
export type DailyActivityUpdate = Database['public']['Tables']['daily_activity']['Update']

export type ExerciseCompletionUpdate = Database['public']['Tables']['exercise_completions']['Update']

export type DailyActivityRow = Database['public']['Tables']['daily_activity']['Row']

export type ExerciseSkill = Database['public']['Tables']['exercise_skills']['Row']
export type ExerciseSkillInsert = Database['public']['Tables']['exercise_skills']['Insert']

export type Achievement = Database['public']['Tables']['achievements']['Row']
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row']
export type UserAchievementInsert = Database['public']['Tables']['user_achievements']['Insert']
