import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

const isMissingCredentials = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

if (isMissingCredentials) {
    console.warn('⚠️ Supabase credentials not configured.')
    console.warn('Create a .env.local file in the tutor directory with:')
    console.warn('  VITE_SUPABASE_URL=<your-supabase-url>')
    console.warn('  VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>')
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
)

// Types for our database tables
export interface StudentProfile {
    id: string
    user_id: string
    first_name: string
    last_name: string
    role: 'student' | 'parent' | 'teacher' | 'admin'
    school_id: string
    class_id?: string
    grade_level?: string
    class_name?: string
    avatar_url?: string
    xp: number
    gems: number
    level: number
}

export interface DailyTopic {
    id: string
    teacher_id: string
    class_id: string
    school_id: string
    topic: string
    topic_date: string
    created_at: string
    updated_at: string
    // Joined fields
    class_name?: string
    subject?: string
    teacher_name?: string
}

export interface ClassInfo {
    id: string
    class_name: string
    subject?: string
    grade_level_id?: string
    school_id: string
}

export interface Assessment {
    id: string
    title: string
    description?: string
    type: 'quiz' | 'test' | 'assignment' | 'project' | 'exam'
    max_score: number
    class_id: string
    teacher_id: string
    school_id: string
    due_date?: string
    is_published: boolean
}
