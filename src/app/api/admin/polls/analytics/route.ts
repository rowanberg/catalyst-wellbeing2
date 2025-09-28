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
    
    // Get current user using cookie-based auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile and verify admin role
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, id')
      .eq('user_id', user.id)

    const userProfile = profiles?.[0]

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const pollId = searchParams.get('pollId')

    if (!pollId) {
      return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 })
    }

    // Verify poll belongs to admin's school
    const { data: poll, error: pollError } = await supabaseAdmin
      .from('polls')
      .select('id, title, description, school_id, target_audience, created_at, end_date, status')
      .eq('id', pollId)
      .eq('school_id', userProfile.school_id)
      .single()

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Get poll questions
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('poll_questions')
      .select('id, question_text, question_type, options, is_required, order_index')
      .eq('poll_id', pollId)
      .order('order_index')

    if (questionsError) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    // Get responses from poll_analytics table (workaround for broken trigger)
    const { data: analyticsResponses, error: responsesError } = await supabaseAdmin
      .from('poll_analytics')
      .select('metric_value')
      .eq('poll_id', pollId)
      .eq('metric_name', 'response_data')

    // Transform analytics data back to response format
    const responses = analyticsResponses?.map((item: any, index: number) => {
      const responseData = item.metric_value
      return {
        id: `response_${index}_${Date.now()}`,
        respondent_id: responseData.respondent_id,
        submitted_at: responseData.submitted_at,
        profiles: responseData.respondent_role ? {
          role: responseData.respondent_role,
          grade: null // Grade not stored in workaround
        } : null
      }
    }) || []

    if (responsesError) {
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    // Get answers from the response data stored in analytics
    const answers: any[] = []
    const responseIdMap = new Map()
    
    analyticsResponses?.forEach((item: any, index: number) => {
      const responseData = item.metric_value
      const responseId = `response_${index}_${Date.now()}`
      responseIdMap.set(index, responseId)
      
      responseData.answers?.forEach((answer: any) => {
        // Determine the correct question type and value
        let answerText = null
        let answerOptions = null
        let answerNumber = null
        
        if (Array.isArray(answer.value)) {
          answerOptions = answer.value
        } else if (typeof answer.value === 'number') {
          answerNumber = answer.value
        } else {
          answerText = String(answer.value)
        }
        
        answers.push({
          response_id: responseId,
          question_id: answer.questionId,
          answer_text: answerText,
          answer_options: answerOptions,
          answer_number: answerNumber
        })
      })
    })

    console.log('Analytics API - Found responses:', analyticsResponses?.length || 0)
    console.log('Analytics API - Processed answers:', answers.length)

    const answersError = null // No error since we're processing in-memory data

    if (answersError) {
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 })
    }

    // Calculate analytics for each question
    const questionAnalytics = questions.map(question => {
      const questionAnswers = answers.filter(a => a.question_id === question.id)
      
      let analytics: any = {
        questionId: question.id,
        questionText: question.question_text,
        questionType: question.question_type,
        totalResponses: questionAnswers.length,
        isRequired: question.is_required
      }

      if (question.question_type === 'multiple_choice' || question.question_type === 'single_choice') {
        // Calculate option distribution
        const optionCounts: { [key: string]: number } = {}
        
        questionAnswers.forEach(answer => {
          if (question.question_type === 'multiple_choice' && answer.answer_options) {
            // Handle multiple selections
            const selectedOptions = Array.isArray(answer.answer_options) 
              ? answer.answer_options 
              : JSON.parse(answer.answer_options || '[]')
            
            selectedOptions.forEach((option: string) => {
              optionCounts[option] = (optionCounts[option] || 0) + 1
            })
          } else if (answer.answer_text) {
            // Handle single selection
            optionCounts[answer.answer_text] = (optionCounts[answer.answer_text] || 0) + 1
          }
        })

        // Create simple key-value object for frontend compatibility
        const optionDistribution: { [key: string]: number } = {}
        question.options.forEach((option: string) => {
          optionDistribution[option] = optionCounts[option] || 0
        })
        analytics.optionDistribution = optionDistribution

      } else if (question.question_type === 'rating') {
        const ratings = questionAnswers
          .map(a => a.answer_number)
          .filter(r => r !== null && r !== undefined)
        
        if (ratings.length > 0) {
          analytics.ratingStats = {
            average: (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1),
            min: Math.min(...ratings),
            max: Math.max(...ratings),
            distribution: [1, 2, 3, 4, 5].map(rating => ({
              rating,
              count: ratings.filter(r => r === rating).length,
              percentage: (ratings.filter(r => r === rating).length / ratings.length) * 100
            }))
          }
        }

      } else if (question.question_type === 'yes_no') {
        const yesCount = questionAnswers.filter(a => a.answer_text === 'Yes').length
        const noCount = questionAnswers.filter(a => a.answer_text === 'No').length
        
        analytics.yesNoDistribution = {
          yes: {
            count: yesCount,
            percentage: questionAnswers.length > 0 ? (yesCount / questionAnswers.length) * 100 : 0
          },
          no: {
            count: noCount,
            percentage: questionAnswers.length > 0 ? (noCount / questionAnswers.length) * 100 : 0
          }
        }

      } else if (question.question_type === 'text') {
        analytics.textResponses = questionAnswers
          .map(a => ({
            response: a.answer_text,
            submittedAt: responses.find(r => r.id === a.response_id)?.submitted_at
          }))
          .filter(r => r.response && r.response.trim())
          .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      }

      return analytics
    })

    // Calculate overall poll statistics
    const totalTargetAudience = await calculateTargetAudienceSize(poll.target_audience, userProfile.school_id)
    const responseRate = totalTargetAudience > 0 ? (responses.length / totalTargetAudience) * 100 : 0

    // Get respondent demographics
    const demographics = {
      byGrade: {} as { [key: string]: number },
      byRole: {} as { [key: string]: number }
    }

    responses.forEach(response => {
      if (response.profiles && !Array.isArray(response.profiles)) {
        const profile = response.profiles as any
        const grade = profile.grade_level || 'Unknown'
        const role = profile.role || 'Unknown'
        
        demographics.byGrade[grade] = (demographics.byGrade[grade] || 0) + 1
        demographics.byRole[role] = (demographics.byRole[role] || 0) + 1
      }
    })

    const analytics = {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        status: poll.status,
        targetAudience: poll.target_audience,
        createdAt: poll.created_at,
        endDate: poll.end_date
      },
      totalResponses: responses.length,
      totalTargets: totalTargetAudience,
      responseRate: Math.round(responseRate * 100) / 100,
      demographics,
      questionAnalytics,
      recentResponses: responses
        .sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          submittedAt: r.submitted_at,
          respondent: r.profiles && !Array.isArray(r.profiles) ? {
            name: `${(r.profiles as any).first_name} ${(r.profiles as any).last_name}`,
            grade: (r.profiles as any).grade_level,
            role: (r.profiles as any).role
          } : { name: 'Anonymous', grade: 'Unknown', role: 'Unknown' }
        }))
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Error in poll analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function calculateTargetAudienceSize(targetAudience: string, schoolId: string): Promise<number> {
  try {
    let query = supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('school_id', schoolId)

    if (targetAudience !== 'all') {
      query = query.eq('role', targetAudience === 'students' ? 'student' : targetAudience)
    }

    const { count } = await query
    return count || 0
  } catch (error) {
    console.error('Error calculating target audience size:', error)
    return 0
  }
}
