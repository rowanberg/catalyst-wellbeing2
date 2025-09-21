import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to verify they are a teacher
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.school_id) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Get all grade levels for the school
    const { data: gradeLevels, error: gradeLevelsError } = await supabase
      .from('grade_levels')
      .select(`
        id,
        grade_level,
        grade_name,
        is_active
      `)
      .eq('school_id', profile.school_id)
      .eq('is_active', true)
      .order('grade_level')

    if (gradeLevelsError) {
      console.error('Error fetching grade levels:', gradeLevelsError)
      return NextResponse.json({ error: 'Failed to fetch grade levels' }, { status: 500 })
    }

    return NextResponse.json({ 
      gradeLevels: gradeLevels || [],
      success: true 
    })

  } catch (error) {
    console.error('Error in grade-levels API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
