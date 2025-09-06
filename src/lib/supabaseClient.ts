import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    supabaseUrl.includes('your_supabase_url_here') || supabaseAnonKey.includes('your_supabase_anon_key_here') ||
    supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️ Using placeholder Supabase configuration for development')
  console.warn('Please update your .env.local file with valid Supabase credentials:')
  console.warn('NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co')
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
})
