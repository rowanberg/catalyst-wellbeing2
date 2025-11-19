import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

// export const dynamic = 'force-dynamic' // Removed for Capacitor

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      if (auth.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      if (auth.status === 403) {
        // This route is for students only
        return NextResponse.json({ error: 'Student access required' }, { status: 403 })
      }
      
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status })
    }
    
    const { supabase, userId } = auth
    
    // Get student's examinations (RLS ensures the student only sees their exams)
    const { data: exams, error: examsError } = await supabase
      .from('examinations')
      .select('*')
      .eq('is_published', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (examsError) {
      console.error('Error fetching exams:', examsError)
      return NextResponse.json({ error: 'Failed to fetch examinations' }, { status: 500 })
    }

    // Get teacher info separately if needed
    const teacherIds = Array.from(new Set(exams?.map(e => e.teacher_id).filter(Boolean) || []))
    let teacherLookup: Record<string, any> = {}
    
    if (teacherIds.length > 0) {
      const { data: teachers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', teacherIds)
      
      teachers?.forEach(teacher => {
        teacherLookup[teacher.id] = teacher
      })
    }

    // Get student's exam statuses
    const { data: statuses, error: statusError } = await supabase
      .from('student_exam_sessions')
      .select('exam_id, status, score, attempts_used, completed_at')
      .eq('student_id', userId)

    if (statusError) {
      console.error('Error fetching exam statuses:', statusError)
    }

    // Format statuses as a lookup object
    const statusLookup: Record<string, any> = {}
    statuses?.forEach(status => {
      statusLookup[status.exam_id] = {
        status: status.status,
        score: status.score,
        attempts: status.attempts_used,
        last_attempt: status.completed_at
      }
    })

    // Add teacher names to exams
    const formattedExams = exams?.map(exam => {
      const teacher = exam.teacher_id ? teacherLookup[exam.teacher_id] : null
      return {
        ...exam,
        teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher'
      }
    }) || []

    return NextResponse.json({
      exams: formattedExams,
      statuses: statusLookup
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
