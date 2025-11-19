import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      if (auth.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      if (auth.status === 403) {
        return NextResponse.json({ error: 'Access denied. Student role required.' }, { status: 403 })
      }
      
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status })
    }
    
    const { supabase, userId } = auth

    // Get student's black marks using the database function
    const { data: blackMarks, error: blackMarksError } = await supabase
      .rpc('get_student_black_marks', { 
        student_uuid: userId
      })

    if (blackMarksError) {
      return NextResponse.json({ error: 'Failed to fetch black marks' }, { status: 500 })
    }

    // Get submissions for each black mark
    const blackMarkIds = blackMarks?.map((bm: any) => bm.id) || []
    let submissions: any[] = []
    
    if (blackMarkIds.length > 0) {
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('black_mark_submissions')
        .select('*')
        .in('black_mark_id', blackMarkIds)
        .eq('student_id', userId)

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
