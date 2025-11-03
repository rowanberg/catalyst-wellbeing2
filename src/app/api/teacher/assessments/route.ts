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
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

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
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 })
    }

    return NextResponse.json({ assessments: assessments || [] })

  } catch (error) {
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
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const { title, type, max_score, pass_mark, class_id, due_date, assessment_date, rubric_criteria } = body

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
      return NextResponse.json({ error: 'Failed to create assessment', details: createError.message }, { status: 500 })
    }

    return NextResponse.json({ assessment })

  } catch (error) {
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
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    // Get assessment ID from query params
    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('id')

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 })
    }

    // Verify the assessment belongs to this teacher
    const { data: assessment, error: fetchError } = await supabase
      .from('assessments')
      .select('id, teacher_id, title')
      .eq('id', assessmentId)
      .eq('teacher_id', user.id)
      .eq('school_id', profile.school_id)
      .single()

    if (fetchError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found or unauthorized' }, { status: 404 })
    }

    // Delete the assessment (this will cascade delete related grades due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('assessments')
      .delete()
      .eq('id', assessmentId)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete assessment', details: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Assessment deleted successfully' 
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
