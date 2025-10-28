import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, grade_level')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }

    // Get all classes the student is enrolled in using student_class_assignments
    const { data: classAssignments, error: classError } = await supabase
      .from('student_class_assignments')
      .select('class_id')
      .eq('student_id', profile.id)

    if (classError) {
      console.error('❌ Error fetching student class assignments:', classError)
      return NextResponse.json({ error: 'Failed to fetch class assignments' }, { status: 500 })
    }

    // If student has no class assignments, return empty
    if (!classAssignments || classAssignments.length === 0) {
      return NextResponse.json({ 
        assessments: [],
        count: 0
      })
    }

    // Extract class IDs
    const classIds = classAssignments.map(ca => ca.class_id)

    console.log('📚 Student enrolled in classes:', classIds)

    // Get current date/time
    const now = new Date().toISOString()

    // Fetch upcoming assessments for all student's classes
    // Get assessments that have an assessment_date in the future
    // Limit to 5 to reduce database load
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select(`
        id,
        title,
        type,
        max_score,
        assessment_date,
        due_date,
        class_id,
        classes!fk_assessments_class_id!inner (
          class_name,
          subject
        )
      `)
      .in('class_id', classIds)
      .eq('school_id', profile.school_id)
      .gte('assessment_date', now)
      .order('assessment_date', { ascending: true })
      .limit(5)

    if (assessmentsError) {
      console.error('❌ Error fetching upcoming assessments:', assessmentsError)
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 })
    }

    console.log('📚 Raw assessments from DB:', {
      count: assessments?.length || 0,
      studentClassIds: classIds,
      profileSchoolId: profile.school_id,
      currentTime: now,
      assessments: assessments?.map(a => ({
        id: a.id,
        title: a.title,
        assessment_date: a.assessment_date,
        class_id: a.class_id
      }))
    })

    // Format the response
    const formattedAssessments = (assessments || []).map((assessment: any) => {
      const daysUntil = Math.ceil((new Date(assessment.assessment_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return {
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        subject: assessment.classes?.subject || 'Unknown',
        className: assessment.classes?.class_name || 'Unknown',
        assessmentDate: assessment.assessment_date,
        dueDate: assessment.due_date,
        maxScore: assessment.max_score,
        daysUntil
      }
    })

    console.log('✅ Formatted assessments to return:', {
      count: formattedAssessments.length,
      assessments: formattedAssessments
    })

    return NextResponse.json({ 
      assessments: formattedAssessments,
      count: formattedAssessments.length
    })

  } catch (error) {
    console.error('Error in upcoming assessments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
