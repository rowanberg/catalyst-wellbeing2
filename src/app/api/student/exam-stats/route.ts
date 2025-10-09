import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student's exam performance stats
    const { data: performance, error: performanceError } = await supabase
      .from('student_exam_performance')
      .select('*')
      .eq('student_id', user.id)
      .single()

    if (performanceError && performanceError.code !== 'PGRST116') {
      console.error('Error fetching performance:', performanceError)
    }

    // Get total exams available to student
    const { data: totalExams, error: totalError } = await supabase
      .from('examinations')
      .select('id', { count: 'exact' })
      .eq('is_published', true)
      .eq('is_active', true)

    if (totalError) {
      console.error('Error fetching total exams:', totalError)
    }

    // Get completed exams count
    const { data: completedExams, error: completedError } = await supabase
      .from('student_exam_sessions')
      .select('id', { count: 'exact' })
      .eq('student_id', user.id)
      .eq('status', 'completed')

    if (completedError) {
      console.error('Error fetching completed exams:', completedError)
    }

    // Get badges earned
    const { data: badges, error: badgesError } = await supabase
      .from('student_exam_badges')
      .select('id', { count: 'exact' })
      .eq('student_id', user.id)

    if (badgesError) {
      console.error('Error fetching badges:', badgesError)
    }

    const stats = {
      total_exams: totalExams?.length || 0,
      completed_exams: completedExams?.length || 0,
      average_score: performance?.average_score || 0,
      total_xp_earned: performance?.total_xp_earned || 0,
      badges_earned: badges?.length || 0,
      current_streak: performance?.current_streak || 0
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
