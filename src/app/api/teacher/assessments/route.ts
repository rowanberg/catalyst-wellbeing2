import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import {
  assessmentRedis,
  getCachedAssessments,
  getTeacherAssessmentsKey,
  invalidateTeacherAssessments,
  invalidateAssessment,
  CACHE_TTL
} from '@/lib/cache/redis-assessments'

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

    // Generate cache key for this teacher's assessments
    const cacheKey = getTeacherAssessmentsKey(user.id, profile.school_id)

    // Fetch assessments with Redis caching
    const assessments = await getCachedAssessments(
      cacheKey,
      async () => {
        // This fetcher only runs on cache miss
        const { data, error } = await supabase
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

        if (error) {
          throw new Error(`Failed to fetch assessments: ${error.message}`)
        }

        return data || []
      },
      CACHE_TTL.ASSESSMENTS_LIST // 15 minutes
    )

    return NextResponse.json({ assessments })

  } catch (error) {
    console.error('[Assessments GET] Error:', error)
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

    // Invalidate teacher's assessment cache after creating new assessment
    await invalidateTeacherAssessments(user.id, profile.school_id)

    return NextResponse.json({ assessment })

  } catch (error) {
    console.error('[Assessments POST] Error:', error)
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

    // Invalidate caches after successful deletion
    await Promise.all([
      invalidateAssessment(assessmentId),
      invalidateTeacherAssessments(user.id, profile.school_id)
    ])

    return NextResponse.json({
      success: true,
      message: 'Assessment deleted successfully'
    })

  } catch (error) {
    console.error('[Assessments DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
