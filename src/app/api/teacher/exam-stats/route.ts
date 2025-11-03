import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // Return default stats instead of error for development
      return NextResponse.json({ 
        stats: {
          total_exams: 0,
          active_exams: 0,
          total_students: 0,
          average_completion_rate: 0,
          total_questions_created: 0,
          ai_questions_generated: 0
        }
      })
    }

    // Get total exams created by teacher
    const { data: totalExams, error: totalError } = await supabase
      .from('examinations')
      .select('id', { count: 'exact' })
      .eq('teacher_id', user.id)

    // Get active exams
    const { data: activeExams, error: activeError } = await supabase
      .from('examinations')
      .select('id', { count: 'exact' })
      .eq('teacher_id', user.id)
      .eq('is_published', true)
      .eq('is_active', true)

    // Get total questions created
    const { data: questions, error: questionsError } = await supabase
      .from('exam_questions')
      .select('id', { count: 'exact' })
      .in('exam_id', 
        await supabase
          .from('examinations')
          .select('id')
          .eq('teacher_id', user.id)
          .then(res => res.data?.map(e => e.id) || [])
      )

    // Get AI generated questions
    const { data: aiQuestions, error: aiError } = await supabase
      .from('ai_question_generation')
      .select('id', { count: 'exact' })
      .eq('teacher_id', user.id)

    // Get unique students who have taken exams
    const { data: studentSessions, error: sessionsError } = await supabase
      .from('student_exam_sessions')
      .select('student_id, exam_id, status')
      .in('exam_id',
        await supabase
          .from('examinations')
          .select('id')
          .eq('teacher_id', user.id)
          .then(res => res.data?.map(e => e.id) || [])
      )

    const uniqueStudents = new Set(studentSessions?.map(s => s.student_id) || []).size
    const completedSessions = studentSessions?.filter(s => s.status === 'completed') || []
    const averageCompletionRate = studentSessions && studentSessions.length > 0 
      ? (completedSessions.length / studentSessions.length) * 100 
      : 0

    const stats = {
      total_exams: totalExams?.length || 0,
      active_exams: activeExams?.length || 0,
      total_students: uniqueStudents,
      average_completion_rate: Math.round(averageCompletionRate),
      total_questions_created: questions?.length || 0,
      ai_questions_generated: aiQuestions?.length || 0
    }

    return NextResponse.json({ stats })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
