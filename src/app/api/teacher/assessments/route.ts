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

    // Verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      console.error('❌ GET /assessments - Profile check failed:', { profileError, profile })
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    console.log('✅ GET /assessments - Teacher verified:', { role: profile.role, school_id: profile.school_id })

    // Get teacher's assessments
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select(`
        id,
        title,
        type,
        max_score,
        pass_mark,
        created_at,
        class_id,
        due_date,
        assessment_date,
        rubric_criteria
      `)
      .eq('teacher_id', user.id)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })

    if (assessmentsError) {
      console.error('Error fetching assessments:', assessmentsError)
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 })
    }

    return NextResponse.json({ assessments: assessments || [] })

  } catch (error) {
    console.error('Error in assessments API:', error)
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
      console.error('❌ POST /assessments - Profile check failed:', { profileError, profile })
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    console.log('✅ POST /assessments - Teacher verified:', { role: profile.role, school_id: profile.school_id })

    const body = await request.json()
    const { title, type, max_score, pass_mark, class_id, due_date, assessment_date, rubric_criteria } = body

    console.log('📝 Creating assessment with data:', {
      title,
      type,
      max_score,
      pass_mark,
      class_id,
      teacher_id: user.id,
      school_id: profile.school_id
    })

    // Validate required fields
    if (!class_id) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    // Create new assessment
    const { data: assessment, error: createError } = await supabase
      .from('assessments')
      .insert({
        title,
        type,
        max_score,
        pass_mark: pass_mark || 50,
        class_id,
        due_date: due_date || null,
        assessment_date: assessment_date || null,
        teacher_id: user.id,
        school_id: profile.school_id,
        rubric_criteria: rubric_criteria || null
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating assessment:', createError)
      return NextResponse.json({ error: 'Failed to create assessment', details: createError.message }, { status: 500 })
    }

    console.log('✅ Assessment created successfully:', {
      id: assessment.id,
      title: assessment.title,
      teacher_id: assessment.teacher_id
    })

    return NextResponse.json({ assessment })

  } catch (error) {
    console.error('Error in create assessment API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
      console.error('❌ DELETE /assessments - Profile check failed:', { profileError, profile })
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    // Get assessment ID from query params
    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('id')

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 })
    }

    console.log('🗑️ DELETE /assessments - Deleting assessment:', { assessmentId, teacher_id: user.id })

    // Verify the assessment belongs to this teacher
    const { data: assessment, error: fetchError } = await supabase
      .from('assessments')
      .select('id, teacher_id, title')
      .eq('id', assessmentId)
      .eq('teacher_id', user.id)
      .eq('school_id', profile.school_id)
      .single()

    if (fetchError || !assessment) {
      console.error('❌ Assessment not found or unauthorized:', { fetchError, assessment })
      return NextResponse.json({ error: 'Assessment not found or unauthorized' }, { status: 404 })
    }

    // Delete the assessment (this will cascade delete related grades due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('assessments')
      .delete()
      .eq('id', assessmentId)

    if (deleteError) {
      console.error('❌ Error deleting assessment:', deleteError)
      return NextResponse.json({ error: 'Failed to delete assessment', details: deleteError.message }, { status: 500 })
    }

    console.log('✅ Assessment deleted successfully:', {
      id: assessmentId,
      title: assessment.title
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Assessment deleted successfully' 
    })

  } catch (error) {
    console.error('Error in delete assessment API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
