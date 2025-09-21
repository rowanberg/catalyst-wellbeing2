import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Verify poll exists and user has access
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .eq('school_id', userProfile.school_id)
      .single()

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Check if poll is active
    if (poll.status !== 'active') {
      return NextResponse.json({ error: 'Poll is not active' }, { status: 400 })
    }

    const { answers, isAnonymous } = await request.json()

    // Validate answers array
    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 })
    }

    // Check if user already responded (for non-anonymous polls)
    if (!isAnonymous) {
      const { data: existingResponse } = await supabase
        .from('poll_responses')
        .select('id')
        .eq('poll_id', id)
        .eq('respondent_id', user.id)
        .single()

      if (existingResponse) {
        return NextResponse.json({ error: 'You have already responded to this poll' }, { status: 400 })
      }
    }

    // Create poll response
    const { data: response, error: responseError } = await supabase
      .from('poll_responses')
      .insert({
        poll_id: id,
        respondent_id: isAnonymous ? null : user.id,
        respondent_role: userProfile.role,
        school_id: userProfile.school_id,
        is_anonymous: isAnonymous,
        is_complete: true,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (responseError) {
      console.error('Error creating response:', responseError)
      return NextResponse.json({ error: 'Failed to create response' }, { status: 500 })
    }

    // Create answer records
    const answersToInsert = answers.map((answer: any) => ({
      response_id: response.id,
      question_id: answer.questionId,
      answer_text: answer.text || null,
      answer_number: answer.number || null,
      answer_options: answer.options || null
    }))

    const { error: answersError } = await supabase
      .from('poll_answers')
      .insert(answersToInsert)

    if (answersError) {
      console.error('Error creating answers:', answersError)
      // Rollback response creation
      await supabase.from('poll_responses').delete().eq('id', response.id)
      return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Response submitted successfully',
      responseId: response.id
    })
  } catch (error) {
    console.error('Error submitting poll response:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Only admins and teachers can view responses
    if (!['admin', 'teacher'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get poll responses
    const { data: responses, error: responsesError } = await supabase
      .from('poll_responses')
      .select(`
        *,
        poll_answers(*)
      `)
      .eq('poll_id', id)
      .eq('school_id', userProfile.school_id)
      .eq('is_complete', true)
      .order('submitted_at', { ascending: false })

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    return NextResponse.json({ responses })
  } catch (error) {
    console.error('Error fetching poll responses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
