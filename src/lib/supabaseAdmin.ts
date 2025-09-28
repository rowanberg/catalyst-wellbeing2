import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    serviceKey: supabaseServiceKey ? 'Present' : 'Missing'
  })
  throw new Error('Missing Supabase admin environment variables')
}

if (supabaseUrl.includes('your-project-ref') || supabaseServiceKey.includes('your_supabase')) {
  console.error('Supabase credentials appear to be placeholder values')
  throw new Error('Please configure your Supabase credentials in .env.local')
}

// Admin client bypasses RLS policies
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
