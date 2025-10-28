import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('assessment_id')
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      console.error('❌ GET /assessment-grades - Profile check failed:', { profileError, profile, userId: user.id })
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }
    
    console.log('✅ GET /assessment-grades - Teacher verified:', { role: profile.role, userId: user.id })

    if (assessmentId) {
      // Get grades for specific assessment
      const { data: grades, error: gradesError } = await supabase
        .from('assessment_grades')
        .select(`
          id,
          student_id,
          assessment_id,
          score,
          percentage,
          letter_grade,
          feedback,
          rubric_scores,
          created_at,
          updated_at
        `)
        .eq('assessment_id', assessmentId)
      
      // Fetch student profiles separately
      if (!gradesError && grades) {
        const studentIds = grades.map(g => g.student_id)
        const { data: students } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, grade_level, class_name')
          .in('id', studentIds)
        
        // Merge student data
        const gradesWithStudents = grades.map(grade => ({
          ...grade,
          student: students?.find(s => s.id === grade.student_id)
        }))
        
        return NextResponse.json({ grades: gradesWithStudents })
      }

      if (gradesError) {
        console.error('Error fetching grades:', gradesError)
        return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
      }

      return NextResponse.json({ grades: grades || [] })
    }
    
    // Get all grades for teacher (without filtering by assessment)
    const { data: allGrades, error: allGradesError } = await supabase
      .from('assessment_grades')
      .select('*')
      .eq('teacher_id', user.id)
    
    if (allGradesError) {
      console.error('Error fetching all grades:', allGradesError)
      return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 })
    }
    
    return NextResponse.json({ grades: allGrades || [] })
    
    /* Old code with broken joins
    else {
    */

  } catch (error) {
    console.error('Error in assessment grades API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      console.error('❌ POST /assessment-grades - Profile check failed:', { profileError, profile, userId: user.id })
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }
    
    console.log('✅ POST /assessment-grades - Teacher verified:', { role: profile.role, userId: user.id })

    const body = await request.json()
    const { 
      student_id, 
      assessment_id, 
      score, 
      percentage, 
      letter_grade, 
      feedback, 
      rubric_scores 
    } = body

    // Skip assessment verification - rely on RLS policies instead
    // const { data: assessment, error: assessmentError } = await supabase
    //   .from('assessments')
    //   .select('id, teacher_id')
    //   .eq('id', assessment_id)
    //   .eq('teacher_id', user.id)
    //   .single()
    //
    // if (assessmentError || !assessment) {
    //   return NextResponse.json({ error: 'Assessment not found or unauthorized' }, { status: 403 })
    // }

    // Check if grade already exists (update vs insert)
    const { data: existingGrade, error: checkError } = await supabase
      .from('assessment_grades')
      .select('id')
      .eq('student_id', student_id)
      .eq('assessment_id', assessment_id)
      .single()

    let grade
    if (existingGrade) {
      // Update existing grade
      const { data: updatedGrade, error: updateError } = await supabase
        .from('assessment_grades')
        .update({
          score,
          percentage,
          letter_grade,
          feedback,
          rubric_scores,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGrade.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating grade:', updateError)
        return NextResponse.json({ error: 'Failed to update grade' }, { status: 500 })
      }

      grade = updatedGrade
    } else {
      // Insert new grade
      const { data: newGrade, error: insertError } = await supabase
        .from('assessment_grades')
        .insert({
          student_id,
          assessment_id,
          score,
          percentage,
          letter_grade,
          feedback,
          rubric_scores,
          teacher_id: user.id,
          school_id: profile.school_id
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating grade:', insertError)
        return NextResponse.json({ error: 'Failed to create grade' }, { status: 500 })
      }

      grade = newGrade
    }

    return NextResponse.json({ grade })

  } catch (error) {
    console.error('Error in create/update grade API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, score, percentage, letter_grade, feedback, rubric_scores } = body

    // Update grade
    const { data: grade, error: updateError } = await supabase
      .from('assessment_grades')
      .update({
        score,
        percentage,
        letter_grade,
        feedback,
        rubric_scores,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('teacher_id', user.id) // Ensure teacher owns this grade
      .select()
      .single()

    if (updateError) {
      console.error('Error updating grade:', updateError)
      return NextResponse.json({ error: 'Failed to update grade' }, { status: 500 })
    }

    return NextResponse.json({ grade })

  } catch (error) {
    console.error('Error in update grade API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
