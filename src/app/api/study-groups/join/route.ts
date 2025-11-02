import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { apiCache } from '@/lib/utils/apiCache'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { group_id } = body

    if (!group_id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Check if group exists and user can join
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .select('id, name, max_members, is_private, school_id, member_count:study_group_members(count)')
      .eq('id', group_id)
      .eq('status', 'active')
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Study group not found' }, { status: 404 })
    }

    // Check if user is in the same school
    if (group.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'You can only join groups in your school' }, { status: 403 })
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('study_group_members')
      .select('id')
      .eq('group_id', group_id)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 })
    }

    // Check member limit
    const memberCount = Array.isArray(group.member_count) ? group.member_count.length : 0
    if (memberCount >= group.max_members) {
      return NextResponse.json({ error: 'This group is full' }, { status: 400 })
    }

    // For private groups, create a join request instead
    if (group.is_private) {
      // Check if join request already exists
      const { data: existingRequest } = await supabase
        .from('study_group_join_requests')
        .select('id, status')
        .eq('group_id', group_id)
        .eq('user_id', profile.id)
        .maybeSingle()

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return NextResponse.json({ error: 'You already have a pending join request for this group' }, { status: 400 })
        } else if (existingRequest.status === 'approved') {
          return NextResponse.json({ error: 'Your join request was already approved' }, { status: 400 })
        } else if (existingRequest.status === 'rejected') {
          return NextResponse.json({ error: 'Your previous join request was rejected. Please contact the group moderator.' }, { status: 400 })
        }
      }

      const { error: requestError } = await supabase
        .from('study_group_join_requests')
        .insert({
          group_id,
          user_id: profile.id,
          message: body.message || ''
        })

      if (requestError) {
        console.error('Error creating join request:', requestError)
        // Handle duplicate key error
        if (requestError.code === '23505') {
          return NextResponse.json({ error: 'You already have a join request for this group' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create join request' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Join request sent successfully. Wait for approval from group moderators.' 
      })
    }

    // Join the group directly (for public groups)
    const { error: joinError } = await supabase
      .from('study_group_members')
      .insert({
        group_id,
        user_id: profile.id,
        role: 'member'
      })

    if (joinError) {
      console.error('Error joining group:', joinError)
      // Handle duplicate key error gracefully
      if (joinError.code === '23505') {
        return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
    }

    // Clear cache
    apiCache.clear()

    return NextResponse.json({ 
      message: `Successfully joined ${group.name}!` 
    })
  } catch (error) {
    console.error('Join group error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id')

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
    }

    // Check if user is a member
    const { data: membership } = await supabase
      .from('study_group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', profile.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 400 })
    }

    // Creators cannot leave their own groups
    if (membership.role === 'creator') {
      return NextResponse.json({ error: 'Group creators cannot leave their groups' }, { status: 400 })
    }

    // Remove membership
    const { error: leaveError } = await supabase
      .from('study_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', profile.id)

    if (leaveError) {
      console.error('Error leaving group:', leaveError)
      return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 })
    }

    // Clear cache
    apiCache.clear()

    return NextResponse.json({ 
      message: 'Successfully left the group' 
    })
  } catch (error) {
    console.error('Leave group error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
