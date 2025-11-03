import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET - Fetch pending join requests for user's groups
export async function GET(request: NextRequest) {
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
      .select('id, school_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get all groups created by this user
    const { data: userGroups } = await supabase
      .from('study_groups')
      .select('id')
      .eq('created_by', profile.id)

    if (!userGroups || userGroups.length === 0) {
      return NextResponse.json({ requests: [] })
    }

    const groupIds = userGroups.map(g => g.id)

    // Fetch pending join requests for these groups with user info
    const { data: requests, error: requestsError } = await supabase
      .from('study_group_join_requests')
      .select(`
        id,
        group_id,
        user_id,
        message,
        status,
        created_at,
        study_groups!inner (
          id,
          name,
          subject,
          is_private
        ),
        profiles!study_group_join_requests_user_id_fkey (
          id,
          first_name,
          last_name,
          avatar_url,
          grade_level
        )
      `)
      .in('group_id', groupIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching join requests:', requestsError)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json({ requests: requests || [] })
  } catch (error) {
    console.error('Get join requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Approve or reject a join request
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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { request_id, action } = body // action: 'approve' or 'reject'

    if (!request_id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Get the join request
    const { data: joinRequest, error: fetchError } = await supabase
      .from('study_group_join_requests')
      .select(`
        id,
        group_id,
        user_id,
        status,
        study_groups!inner (
          id,
          created_by,
          name,
          max_members
        )
      `)
      .eq('id', request_id)
      .single()

    if (fetchError || !joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    // Verify user is the group creator
    const studyGroup = Array.isArray(joinRequest.study_groups) ? joinRequest.study_groups[0] : joinRequest.study_groups
    if (studyGroup.created_by !== profile.id) {
      return NextResponse.json({ error: 'Only group creators can approve requests' }, { status: 403 })
    }

    // Check if request is already processed
    if (joinRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
    }

    if (action === 'approve') {
      // Check member limit
      const { data: members } = await supabase
        .from('study_group_members')
        .select('id')
        .eq('group_id', joinRequest.group_id)

      const memberCount = members?.length || 0
      if (memberCount >= studyGroup.max_members) {
        return NextResponse.json({ error: 'Group is full' }, { status: 400 })
      }

      // Add user to group
      const { error: addError } = await supabase
        .from('study_group_members')
        .insert({
          group_id: joinRequest.group_id,
          user_id: joinRequest.user_id,
          role: 'member'
        })

      if (addError) {
        console.error('Error adding member:', addError)
        return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('study_group_join_requests')
        .update({ status: 'approved' })
        .eq('id', request_id)

      if (updateError) {
        console.error('Error updating request:', updateError)
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: `Approved request to join ${studyGroup.name}` 
      })
    } else {
      // Reject request
      const { error: updateError } = await supabase
        .from('study_group_join_requests')
        .update({ status: 'rejected' })
        .eq('id', request_id)

      if (updateError) {
        console.error('Error updating request:', updateError)
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Request rejected' 
      })
    }
  } catch (error) {
    console.error('Process join request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
