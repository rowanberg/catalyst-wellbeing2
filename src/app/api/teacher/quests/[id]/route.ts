import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const resolvedParams = await params
    const { data: quest, error } = await supabase
      .from('quests')
      .select(`
        *,
        quest_attempts(
          id,
          student_id,
          status,
          completed_at,
          time_spent,
          progress
        )
      `)
      .eq('id', resolvedParams.id)
      .eq('school_id', profile.school_id)
      .single()

    if (error || !quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    }

    return NextResponse.json({ quest })
  } catch (error) {
    console.error('Error in GET /api/teacher/quests/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const resolvedParams = await params

    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const updateData = {
      title: body.title,
      description: body.description,
      category: body.category || 'academic',
      difficulty: body.difficulty || 'easy',
      xp_reward: Math.max(1, parseInt(body.xpReward, 10) || 10),
      gem_reward: Math.max(1, parseInt(body.gemReward, 10) || 5),
      requirements: body.requirements || [],
      time_limit: body.timeLimit ? parseInt(body.timeLimit, 10) : null,
      is_active: body.isActive !== false,
      tags: body.tags || [],
      prerequisites: body.prerequisites || [],
      auto_assign: body.autoAssign || false,
      target_students: body.targetStudents || [],
      due_date: body.dueDate ? new Date(body.dueDate).toISOString() : null,
      repeat_type: body.repeatType || 'none',
      points: body.points || {
        creativity: 0,
        collaboration: 0,
        critical_thinking: 0,
        communication: 0
      },
      updated_at: new Date().toISOString()
    }

    const { data: quest, error } = await supabase
      .from('quests')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .eq('school_id', profile.school_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating quest:', error)
      return NextResponse.json({ error: 'Failed to update quest' }, { status: 500 })
    }

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    }

    return NextResponse.json({ quest })
  } catch (error) {
    console.error('Error in PUT /api/teacher/quests/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const { data: quest, error } = await supabase
      .from('quests')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .eq('school_id', profile.school_id)
      .select()
      .single()

    if (error) {
      console.error('Error patching quest:', error)
      return NextResponse.json({ error: 'Failed to update quest' }, { status: 500 })
    }

    if (!quest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    }

    return NextResponse.json({ quest })
  } catch (error) {
    console.error('Error in PATCH /api/teacher/quests/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if quest exists and belongs to the school
    const { data: existingQuest } = await supabase
      .from('quests')
      .select('id')
      .eq('id', resolvedParams.id)
      .eq('school_id', profile.school_id)
      .single()

    if (!existingQuest) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 })
    }

    // Delete the quest (cascade will handle quest_attempts)
    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('school_id', profile.school_id)

    if (error) {
      console.error('Error deleting quest:', error)
      return NextResponse.json({ error: 'Failed to delete quest' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Quest deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/teacher/quests/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
