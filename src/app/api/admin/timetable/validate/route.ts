import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/timetable/validate?classId=xxx&schemeId=xxx - Validate timetable completeness
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Get params from query
    const searchParams = request.nextUrl.searchParams
    const classId = searchParams.get('classId')
    const schemeId = searchParams.get('schemeId')

    if (!classId || !schemeId) {
      return NextResponse.json({ error: 'classId and schemeId are required' }, { status: 400 })
    }

    // Use the database function to validate
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_timetable_completeness', {
        p_class_id: classId,
        p_scheme_id: schemeId
      })
      .single()

    if (validationError) {
      console.error('Error validating timetable:', validationError)
      return NextResponse.json({ error: 'Failed to validate timetable' }, { status: 500 })
    }

    return NextResponse.json({ validation })
  } catch (error) {
    console.error('Error in validate GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
