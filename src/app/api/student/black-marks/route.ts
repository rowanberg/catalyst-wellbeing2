import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to verify they are a student
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Access denied. Student role required.' }, { status: 403 })
    }

    // Get student's black marks using the database function
    const { data: blackMarks, error: blackMarksError } = await supabase
      .rpc('get_student_black_marks', { 
        student_uuid: user.id
      })

    if (blackMarksError) {
      console.error('Error fetching student black marks:', blackMarksError)
      return NextResponse.json({ error: 'Failed to fetch black marks' }, { status: 500 })
    }

    // Get submissions for each black mark
    const blackMarkIds = blackMarks?.map((bm: any) => bm.id) || []
    let submissions = []
    
    if (blackMarkIds.length > 0) {
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('black_mark_submissions')
        .select('*')
        .in('black_mark_id', blackMarkIds)
        .eq('student_id', user.id)

      if (!submissionsError) {
        submissions = submissionsData || []
      }
    }

    // Combine black marks with their submissions
    const blackMarksWithSubmissions = blackMarks?.map((blackMark: any) => ({
      ...blackMark,
      submissions: submissions.filter((sub: any) => sub.black_mark_id === blackMark.id)
    })) || []

    return NextResponse.json({
      blackMarks: blackMarksWithSubmissions,
      total: blackMarksWithSubmissions.length,
      activeCount: blackMarksWithSubmissions.filter((bm: any) => bm.status === 'active').length,
      resolvedCount: blackMarksWithSubmissions.filter((bm: any) => bm.status === 'resolved').length
    })

  } catch (error) {
    console.error('Error in student black marks API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
