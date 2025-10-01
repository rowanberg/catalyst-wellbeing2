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
        created_at,
        class_id,
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
    const { title, type, max_score, class_id, rubric_criteria } = body

    // Create new assessment
    const { data: assessment, error: createError } = await supabase
      .from('assessments')
      .insert({
        title,
        type,
        max_score,
        class_id,
        teacher_id: user.id,
        school_id: profile.school_id,
        rubric_criteria: rubric_criteria || null
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating assessment:', createError)
      return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 })
    }

    return NextResponse.json({ assessment })

  } catch (error) {
    console.error('Error in create assessment API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
