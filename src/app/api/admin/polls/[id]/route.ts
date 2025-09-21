import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    
    // Get current user using cookie-based auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile using supabaseAdmin
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, id')
      .eq('user_id', user.id)

    const adminProfile = profiles?.[0]

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get poll with questions using supabaseAdmin
    const { data: poll, error: pollError } = await supabaseAdmin
      .from('polls')
      .select(`
        *,
        poll_questions (*)
      `)
      .eq('id', id)
      .eq('school_id', adminProfile.school_id)
      .single()

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Get response count using supabaseAdmin
    const { count: responseCount } = await supabaseAdmin
      .from('poll_responses')
      .select('*', { count: 'exact', head: true })
      .eq('poll_id', id)
      .eq('is_complete', true)

    // Transform poll data
    const transformedPoll = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      type: poll.type,
      status: poll.status,
      targetAudience: poll.target_audience,
      createdDate: poll.created_at.split('T')[0],
      endDate: poll.end_date ? poll.end_date.split('T')[0] : null,
      responses: responseCount || 0,
      questions: poll.poll_questions.map((q: any) => ({
        id: q.id,
        text: q.question_text,
        type: q.question_type,
        options: q.options,
        required: q.is_required
      }))
    }

    return NextResponse.json({ poll: transformedPoll })
  } catch (error) {
    console.error('Error fetching poll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    
    // Get current user using cookie-based auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile using supabaseAdmin
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, id')
      .eq('user_id', user.id)

    const adminProfile = profiles?.[0]

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Verify poll belongs to admin's school
    const { data: existingPoll, error: verifyError } = await supabase
      .from('polls')
      .select('school_id')
      .eq('id', id)
      .single()

    if (verifyError || !existingPoll || existingPoll.school_id !== adminProfile.school_id) {
      return NextResponse.json({ error: 'Poll not found or access denied' }, { status: 404 })
    }

    const { title, description, type, targetAudience, status, questions } = await request.json()

    // Validate required fields
    if (!title || !type || !targetAudience) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update poll
    const updateData: any = {
      title,
      description,
      type,
      target_audience: targetAudience,
      status,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabaseAdmin
      .from('polls')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating poll:', updateError)
      return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 })
    }

    // Update questions if provided
    if (questions && Array.isArray(questions)) {
      // Delete existing questions using supabaseAdmin
      await supabaseAdmin
        .from('poll_questions')
        .delete()
        .eq('poll_id', id)

      // Insert new questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map((q: any, index: number) => ({
          poll_id: id,
          question_text: q.text,
          question_type: q.type,
          options: q.options || [],
          order_index: index,
          is_required: q.required || false
        }))

        const { error: questionsError } = await supabaseAdmin
          .from('poll_questions')
          .insert(questionsToInsert)

        if (questionsError) {
          console.error('Error inserting questions:', questionsError)
          return NextResponse.json({ error: 'Failed to update questions' }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ message: 'Poll updated successfully' })
  } catch (error) {
    console.error('Error updating poll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    
    // Get current user using cookie-based auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile using supabaseAdmin
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, id')
      .eq('user_id', user.id)

    const adminProfile = profiles?.[0]

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Verify poll belongs to admin's school using supabaseAdmin
    const { data: existingPoll, error: verifyError } = await supabaseAdmin
      .from('polls')
      .select('school_id')
      .eq('id', id)
      .single()

    if (verifyError || !existingPoll || existingPoll.school_id !== adminProfile.school_id) {
      return NextResponse.json({ error: 'Poll not found or access denied' }, { status: 404 })
    }

    // Delete poll (cascade will handle questions and responses) using supabaseAdmin
    const { error: deleteError } = await supabaseAdmin
      .from('polls')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting poll:', deleteError)
      return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 })
    }
    return NextResponse.json({ message: 'Poll deleted successfully' })
  } catch (error) {
    console.error('Error deleting poll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    
    // Get current user using cookie-based auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile using supabaseAdmin
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, id')
      .eq('user_id', user.id)

    const adminProfile = profiles?.[0]

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Missing required field: status' }, { status: 400 })
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
      .eq('id', id)
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
