import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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

    // Get current user using cookie-based auth (same as working admin APIs)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Auth error in admin polls API:', authError)
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 })
    }

    // Get admin profile using supabaseAdmin (same as working admin APIs)
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, id')
      .eq('user_id', user.id)

    const adminProfile = profiles?.[0]

    console.log('Profile lookup:', { 
      userId: user.id, 
      userEmail: user.email,
      profileFound: !!adminProfile,
      profileError,
      profile: adminProfile
    })

    if (!adminProfile) {
      console.error('Profile lookup failed:', { 
        userId: user.id, 
        userEmail: user.email,
        profileError,
        availableUserData: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        }
      })
      return NextResponse.json({ 
        error: 'User profile not found', 
        details: `User ${user.email} does not have a profile record. Please ensure your account is properly set up.`,
        userId: user.id,
        userEmail: user.email
      }, { status: 404 })
    }

    if (adminProfile.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        details: `User role is '${adminProfile.role}', but 'admin' role is required`
      }, { status: 403 })
    }

    // Get polls for the admin's school with question counts and response counts
    console.log('Fetching polls for school_id:', adminProfile.school_id)
    
    // First, let's check all polls using supabaseAdmin to bypass RLS
    const { data: allPolls, error: allPollsError } = await supabaseAdmin
      .from('polls')
      .select('id, title, school_id, status')
    
    console.log('All polls in database (via admin):', allPolls)
    console.log('Admin school_id:', adminProfile.school_id)
    
    // Use supabaseAdmin to get polls for the admin's school (bypasses RLS)
    const { data: polls, error: pollsError } = await supabaseAdmin
      .from('polls')
      .select(`
        *,
        poll_questions(count),
        poll_responses(count)
      `)
      .eq('school_id', adminProfile.school_id)
      .order('created_at', { ascending: false })
      
    console.log('Filtered polls for admin school:', polls)

    if (pollsError) {
      console.error('Error fetching polls:', pollsError)
      console.error('Poll error details:', JSON.stringify(pollsError, null, 2))
      return NextResponse.json({ 
        error: 'Failed to fetch polls', 
        details: pollsError.message || 'Unknown error',
        code: pollsError.code
      }, { status: 500 })
    }

    // Calculate target audience counts
    const { data: schoolProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('role')
      .eq('school_id', adminProfile.school_id)

    if (profilesError) {
      console.error('Error fetching school profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch target counts' }, { status: 500 })
    }

    const targetCounts = {
      all: schoolProfiles.length,
      students: schoolProfiles.filter(p => p.role === 'student').length,
      teachers: schoolProfiles.filter(p => p.role === 'teacher').length,
      parents: schoolProfiles.filter(p => p.role === 'parent').length
    }

    // Transform polls data
    const transformedPolls = polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      type: poll.type,
      status: poll.status,
      targetAudience: poll.target_audience,
      createdDate: poll.created_at.split('T')[0],
      endDate: poll.end_date ? poll.end_date.split('T')[0] : null,
      responses: poll.poll_responses?.[0]?.count || 0,
      totalTargets: targetCounts[poll.target_audience as keyof typeof targetCounts] || 0,
      questions: poll.poll_questions?.[0]?.count || 0
    }))

    return NextResponse.json({ polls: transformedPolls })
  } catch (error) {
    console.error('Error in polls API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Get current user using cookie-based auth (same as working admin APIs)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication failed:', { authError, user })
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: authError?.message || 'No user found'
      }, { status: 401 })
    }

    // Get admin profile using supabaseAdmin (same as working admin APIs)
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, id')
      .eq('user_id', user.id)

    const adminProfile = profiles?.[0]

    console.log('Profile lookup:', { 
      userId: user.id, 
      userEmail: user.email,
      profileFound: !!adminProfile,
      profileError,
      profile: adminProfile
    })

    if (!adminProfile) {
      console.error('Profile lookup failed:', { 
        userId: user.id, 
        userEmail: user.email,
        profileError,
        availableUserData: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        }
      })
      return NextResponse.json({ 
        error: 'User profile not found', 
        details: `User ${user.email} does not have a profile record. Please ensure your account is properly set up.`,
        userId: user.id,
        userEmail: user.email
      }, { status: 404 })
    }

    if (adminProfile.role !== 'admin') {
      console.error('User is not admin:', { userRole: adminProfile.role })
      return NextResponse.json({ 
        error: 'Admin access required',
        details: `User role is '${adminProfile.role}', but 'admin' role is required`
      }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, type, targetAudience, questions = [], endDate } = body

    if (!title || !type || !targetAudience) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create poll using supabaseAdmin to bypass RLS
    const { data: poll, error: pollError } = await supabaseAdmin
      .from('polls')
      .insert({
        title,
        description,
        type,
        target_audience: targetAudience,
        school_id: adminProfile.school_id,
        created_by: adminProfile.id,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        status: 'draft'
      })
      .select()
      .single()

    if (pollError) {
      console.error('Error creating poll:', pollError)
      console.error('Poll error details:', JSON.stringify(pollError, null, 2))
      return NextResponse.json({ 
        error: 'Failed to create poll', 
        details: pollError.message || 'Unknown error',
        code: pollError.code
      }, { status: 500 })
    }

    // Create questions if provided using supabaseAdmin
    if (questions.length > 0) {
      const questionsToInsert = questions.map((q: any, index: number) => ({
        poll_id: poll.id,
        question_text: q.text,
        question_type: q.type,
        options: q.options || [],
        is_required: q.required !== false,
        order_index: index
      }))

      const { error: questionsError } = await supabaseAdmin
        .from('poll_questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.error('Error creating questions:', questionsError)
        // Rollback poll creation using supabaseAdmin
        await supabaseAdmin.from('polls').delete().eq('id', poll.id)
        return NextResponse.json({ error: 'Failed to create questions' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      message: 'Poll created successfully',
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        type: poll.type,
        status: poll.status,
        targetAudience: poll.target_audience,
        createdDate: poll.created_at.split('T')[0],
        endDate: poll.end_date ? poll.end_date.split('T')[0] : null,
        responses: 0,
        totalTargets: 0,
        questions: questions.length
      }
    })
  } catch (error) {
    console.error('Error in create poll API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    // Get current user using cookie-based auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication failed:', { authError, user })
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: authError?.message || 'No user found'
      }, { status: 401 })
    }

    // Get admin profile using supabaseAdmin
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, id')
      .eq('user_id', user.id)

    const adminProfile = profiles?.[0]

    if (!adminProfile) {
      console.error('Profile lookup failed:', { 
        userId: user.id, 
        userEmail: user.email,
        profileError
      })
      return NextResponse.json({ 
        error: 'User profile not found', 
        details: `User ${user.email} does not have a profile record.`,
        userId: user.id,
        userEmail: user.email
      }, { status: 404 })
    }

    if (adminProfile.role !== 'admin') {
      console.error('User is not admin:', { userRole: adminProfile.role })
      return NextResponse.json({ 
        error: 'Admin access required',
        details: `User role is '${adminProfile.role}', but 'admin' role is required`
      }, { status: 403 })
    }

    const body = await request.json()
    const { pollId, status } = body

    if (!pollId || !status) {
      return NextResponse.json({ error: 'Missing required fields: pollId and status' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['draft', 'active', 'closed', 'archived']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status', 
        details: `Status must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // Update poll status using supabaseAdmin to bypass RLS
    const { data: updatedPoll, error: updateError } = await supabaseAdmin
      .from('polls')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', pollId)
      .eq('school_id', adminProfile.school_id) // Ensure admin can only update polls from their school
      .select()
      .single()

    if (updateError) {
      console.error('Error updating poll status:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update poll status', 
        details: updateError.message || 'Unknown error'
      }, { status: 500 })
    }

    if (!updatedPoll) {
      return NextResponse.json({ 
        error: 'Poll not found or access denied',
        details: 'Poll may not exist or you may not have permission to update it'
      }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Poll status updated successfully',
      poll: {
        id: updatedPoll.id,
        title: updatedPoll.title,
        status: updatedPoll.status,
        updated_at: updatedPoll.updated_at
      }
    })
  } catch (error) {
    console.error('Error in update poll status API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
