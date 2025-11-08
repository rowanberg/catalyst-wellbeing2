import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/timetable/workload?teacherId=xxx - Get teacher workload
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

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get teacherId from query params
    const searchParams = request.nextUrl.searchParams
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json({ error: 'teacherId is required' }, { status: 400 })
    }

    // Use the database function to get workload
    const { data: workload, error: workloadError } = await supabase
      .rpc('get_teacher_workload', {
        p_teacher_id: teacherId,
        p_school_id: profile.school_id
      })
      .single()

    if (workloadError) {
      console.error('Error fetching teacher workload:', workloadError)
      return NextResponse.json({ error: 'Failed to fetch workload' }, { status: 500 })
    }

    return NextResponse.json({ workload })
  } catch (error) {
    console.error('Error in workload GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
