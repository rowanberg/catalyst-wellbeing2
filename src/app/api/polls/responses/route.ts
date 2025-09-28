import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

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
    
    // Get current user using cookie-based auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Auth error in poll responses API:', authError)
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 })
    }

    // Get user profile using supabaseAdmin to bypass RLS
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, id')
      .eq('user_id', user.id)

    const userProfile = profiles?.[0]

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { pollId, answers } = body

    // Validate required fields
    if (!pollId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify poll exists and user can respond using supabaseAdmin
    const { data: poll, error: pollError } = await supabaseAdmin
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .eq('school_id', userProfile.school_id)
      .eq('status', 'active')
      .single()

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found or not accessible' }, { status: 404 })
    }

    // Build target audience filter - handle both singular and plural forms
    const targetAudienceFilters = ['all', userProfile.role]
    if (userProfile.role === 'student') {
      targetAudienceFilters.push('students')
    } else if (userProfile.role === 'teacher') {
      targetAudienceFilters.push('teachers')
    } else if (userProfile.role === 'parent') {
      targetAudienceFilters.push('parents')
    }

    // Check if user can respond to this poll
    const canRespond = targetAudienceFilters.includes(poll.target_audience)

    if (!canRespond) {
      return NextResponse.json({ error: 'Not authorized to respond to this poll' }, { status: 403 })
    }

    // Check if user has already responded (from analytics table workaround)
    if (!poll.allow_multiple_responses) {
      const { data: existingResponses } = await supabaseAdmin
        .from('poll_analytics')
        .select('metric_value')
        .eq('poll_id', pollId)
        .eq('metric_name', 'response_data')

      const hasAlreadyResponded = existingResponses?.some((item: any) => {
        const responseData = item.metric_value
        return responseData.respondent_id === userProfile.id
      })

      if (hasAlreadyResponded) {
        return NextResponse.json({ error: 'You have already responded to this poll' }, { status: 400 })
      }
    }

    // Get poll questions for validation
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('poll_questions')
      .select('*')
      .eq('poll_id', pollId)
      .order('order_index')

    if (questionsError || !questions) {
      return NextResponse.json({ error: 'Failed to load poll questions' }, { status: 500 })
    }

    // Validate answers
    const questionMap = new Map(questions.map(q => [q.id, q]))
    for (const answer of answers) {
      const question = questionMap.get(answer.questionId)
      if (!question) {
        return NextResponse.json({ error: `Invalid question ID: ${answer.questionId}` }, { status: 400 })
      }

      // Check required questions
      if (question.is_required && (!answer.value || (Array.isArray(answer.value) && answer.value.length === 0))) {
        return NextResponse.json({ error: `Question "${question.question_text}" is required` }, { status: 400 })
      }
    }

    // Since the database trigger is broken, we'll store responses in a different way
    // Create a simple response record in poll_analytics table as a workaround
    const responseId = crypto.randomUUID()
    const responseData = {
      poll_id: pollId,
      respondent_id: poll.is_anonymous ? null : userProfile.id,
      respondent_role: userProfile.role,
      school_id: userProfile.school_id,
      answers: answers,
      submitted_at: new Date().toISOString()
    }

    // Store the response data in poll_analytics table temporarily
    const { error: analyticsError } = await supabaseAdmin
      .from('poll_analytics')
      .insert({
        poll_id: pollId,
        metric_name: 'response_data',
        metric_value: responseData
      })

    if (analyticsError) {
      console.error('Error storing response data:', analyticsError)
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      responseId: responseId,
      message: 'Response submitted successfully'
    })

  } catch (error) {
    console.error('Error in poll responses API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile using supabaseAdmin
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, id')
      .eq('user_id', user.id)

    const userProfile = profiles?.[0]

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Only admins and teachers can view responses
    if (!['admin', 'teacher'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const pollId = searchParams.get('pollId')

    if (!pollId) {
      return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 })
    }

    // Verify poll belongs to user's school
    const { data: poll, error: pollError } = await supabaseAdmin
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .eq('school_id', userProfile.school_id)
      .single()

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Get responses with answers
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('poll_responses')
      .select(`
        *,
        poll_answers(
          *,
          poll_questions(question_text, question_type, options)
        )
      `)
      .eq('poll_id', pollId)
      .eq('is_complete', true)
      .order('submitted_at', { ascending: false })

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    // Transform response data
    const transformedResponses = responses?.map((response: any) => ({
      id: response.id,
      submittedAt: response.submitted_at,
      respondentRole: response.respondent_role,
      isAnonymous: !response.respondent_id,
      answers: response.poll_answers.map((answer: any) => ({
        questionId: answer.question_id,
        questionText: answer.poll_questions.question_text,
        questionType: answer.poll_questions.question_type,
        answerText: answer.answer_text,
        answerOptions: answer.answer_options,
        answerNumber: answer.answer_number
      }))
    })) || []

    return NextResponse.json({ responses: transformedResponses })

  } catch (error) {
    console.error('Error in poll responses GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
