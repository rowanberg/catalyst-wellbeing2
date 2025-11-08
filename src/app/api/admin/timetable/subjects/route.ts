import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/timetable/subjects - Get all subjects for school
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with school_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Get all subjects for the school
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .eq('school_id', profile.school_id)
      .eq('is_active', true)
      .order('name')

    if (subjectsError) {
      console.error('Error fetching subjects:', subjectsError)
      return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
    }

    return NextResponse.json({ subjects: subjects || [] })
  } catch (error) {
    console.error('Error in subjects GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/timetable/subjects - Create new subject
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { name, code, description, color } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    // Create subject
    const { data: subject, error: createError } = await supabase
      .from('subjects')
      .insert({
        school_id: profile.school_id,
        name,
        code: code.toUpperCase(),
        description,
        color: color || '#3B82F6',
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating subject:', createError)
      return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 })
    }

    return NextResponse.json({ subject })
  } catch (error) {
    console.error('Error in subjects POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
