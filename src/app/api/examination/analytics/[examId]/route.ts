import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const timeFilter = searchParams.get('timeFilter') || 'all'
    const { examId } = await params

    const adminClient = createAdminClient()

    // Get exam details
    const { data: exam, error: examError } = await adminClient
      .from('examinations')
      .select('*')
      .eq('id', examId)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Get student sessions for this exam
    const { data: sessions, error: sessionsError } = await adminClient
      .from('student_exam_sessions')
      .select(`
        *,
        profiles:student_id (
          first_name,
          last_name
        )
      `)
      .eq('exam_id', examId)

    const completedSessions = sessions?.filter(s => s.status === 'completed') || []
    const totalStudents = sessions?.length || 0
    const averageScore = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length
      : 0
    
    const passRate = completedSessions.length > 0
      ? (completedSessions.filter(s => s.score >= exam.passing_marks).length / completedSessions.length) * 100
      : 0

    // Calculate average time
    const avgTime = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.time_taken || 0), 0) / completedSessions.length
      : 0

    // Grade distribution
    const gradeDistribution = [
      { grade: 'A', count: completedSessions.filter(s => s.score >= 90).length, percentage: 0 },
      { grade: 'B', count: completedSessions.filter(s => s.score >= 75 && s.score < 90).length, percentage: 0 },
      { grade: 'C', count: completedSessions.filter(s => s.score >= 60 && s.score < 75).length, percentage: 0 },
      { grade: 'D', count: completedSessions.filter(s => s.score >= 40 && s.score < 60).length, percentage: 0 },
      { grade: 'F', count: completedSessions.filter(s => s.score < 40).length, percentage: 0 }
    ]

    gradeDistribution.forEach(grade => {
      grade.percentage = completedSessions.length > 0 
        ? (grade.count / completedSessions.length) * 100 
        : 0
    })

    // Student performance
    const studentPerformance = completedSessions.map(session => ({
      student_id: session.student_id,
      student_name: session.profiles 
        ? `${session.profiles.first_name} ${session.profiles.last_name}`
        : 'Unknown Student',
      score: session.score || 0,
      percentage: exam.total_marks > 0 ? (session.score / exam.total_marks) * 100 : 0,
      time_taken: session.time_taken || 0,
      attempt_number: session.attempts_used || 1,
      flagged_activities: 0 // TODO: Get from security events
    }))

    // Time analytics
    const completionTimes = completedSessions.map(s => s.time_taken || 0).filter(t => t > 0)
    const timeAnalytics = {
      fastest_completion: completionTimes.length > 0 ? Math.min(...completionTimes) : 0,
      slowest_completion: completionTimes.length > 0 ? Math.max(...completionTimes) : 0,
      average_per_question: exam.total_questions > 0 && avgTime > 0 
        ? avgTime / exam.total_questions 
        : 0
    }

    const analytics = {
      overview: {
        total_students: totalStudents,
        completed_attempts: completedSessions.length,
        average_score: Math.round(averageScore * 10) / 10,
        pass_rate: Math.round(passRate * 10) / 10,
        average_time: Math.round(avgTime)
      },
      performance_distribution: gradeDistribution,
      question_analytics: [], // TODO: Implement question-level analytics
      time_analytics: timeAnalytics,
      student_performance: studentPerformance
    }

    return NextResponse.json(analytics)

  } catch (error: any) {
    console.error('Analytics API Error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch analytics', 
      details: error.message 
    }, { status: 500 })
  }
}
