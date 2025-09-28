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
    const { data: badge, error } = await supabase
      .from('quest_badges')
      .select(`
        *,
        badge_awards(
          id,
          student_id,
          awarded_at,
          stack_count,
          reason
        )
      `)
      .eq('id', resolvedParams.id)
      .eq('school_id', profile.school_id)
      .single()

    if (error || !badge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
    }

    return NextResponse.json({ badge })
  } catch (error) {
    console.error('Error in GET /api/teacher/badges/[id]:', error)
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

    if (!body.name || !body.description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 })
    }

    const updateData = {
      name: body.name,
      description: body.description,
      icon: body.icon || '🏆',
      color: body.color || '#3B82F6',
      criteria: body.criteria || [],
      rarity: body.rarity || 'common',
      category: body.category || 'achievement',
      points: Math.max(1, parseInt(body.points) || 10),
      prerequisites: body.prerequisites || [],
      is_stackable: body.isStackable || false,
      max_stack: body.maxStack || 1,
      valid_until: body.validUntil ? new Date(body.validUntil).toISOString() : null,
      auto_award: body.autoAward || false,
      trigger_conditions: body.triggerConditions || {},
      is_active: body.isActive !== false,
      updated_at: new Date().toISOString()
    }

    const { data: badge, error } = await supabase
      .from('quest_badges')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .eq('school_id', profile.school_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating badge:', error)
      return NextResponse.json({ error: 'Failed to update badge' }, { status: 500 })
    }

    if (!badge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
    }

    return NextResponse.json({ badge })
  } catch (error) {
    console.error('Error in PUT /api/teacher/badges/[id]:', error)
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const { data: existingBadge } = await supabase
      .from('quest_badges')
      .select('id')
      .eq('id', resolvedParams.id)
      .eq('school_id', profile.school_id)
      .single()

    if (!existingBadge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('quest_badges')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('school_id', profile.school_id)

    if (error) {
      console.error('Error deleting badge:', error)
      return NextResponse.json({ error: 'Failed to delete badge' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Badge deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/teacher/badges/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
