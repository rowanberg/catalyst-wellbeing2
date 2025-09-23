import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // Get admin profile
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Verify poll belongs to admin's school
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .eq('school_id', adminProfile.school_id)
      .single()

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Get poll questions
    const { data: questions, error: questionsError } = await supabase
      .from('poll_questions')
      .select('*')
      .eq('poll_id', id)
      .order('order_index')

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    // Get response analytics
    const { data: responses, error: responsesError } = await supabase
      .from('poll_responses')
      .select(`
        *,
        poll_answers(*)
      `)
      .eq('poll_id', id)
      .eq('is_complete', true)

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    // Calculate analytics
    const totalResponses = responses.length
    
    // Calculate target audience count
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

    const totalTargets = targetCounts[poll.target_audience as keyof typeof targetCounts] || 0
    const responseRate = totalTargets > 0 ? (totalResponses / totalTargets) * 100 : 0

    // Calculate question-specific analytics
    const questionAnalytics = questions.map(question => {
      const questionAnswers = responses.flatMap(r => 
        r.poll_answers.filter((a: any) => a.question_id === question.id)
      )

      let analytics: any = {
        questionId: question.id,
        questionText: question.question_text,
        questionType: question.question_type,
        totalResponses: questionAnswers.length
      }

      if (question.question_type === 'multiple_choice' || question.question_type === 'single_choice') {
        // Calculate option distribution
        const optionCounts: { [key: string]: number } = {}
        
        questionAnswers.forEach((answer: any) => {
          if (answer.answer_options && Array.isArray(answer.answer_options)) {
            answer.answer_options.forEach((option: string) => {
              optionCounts[option] = (optionCounts[option] || 0) + 1
            })
          } else if (answer.answer_text) {
            optionCounts[answer.answer_text] = (optionCounts[answer.answer_text] || 0) + 1
          }
        })

        analytics.optionDistribution = Object.entries(optionCounts).map(([option, count]: [string, any]) => ({
          option,
          count,
          percentage: questionAnswers.length > 0 ? (count / questionAnswers.length) * 100 : 0
        }))
      } else if (question.question_type === 'rating' || question.question_type === 'scale') {
        // Calculate rating statistics
        const ratings = questionAnswers
          .map((a: any) => a.answer_number)
          .filter((r: number) => r !== null && r !== undefined)

        if (ratings.length > 0) {
          const sum = ratings.reduce((a: number, b: number) => a + b, 0)
          const average = sum / ratings.length
          const min = Math.min(...ratings)
          const max = Math.max(...ratings)

          analytics.ratingStats = {
            average: Math.round(average * 100) / 100,
            min,
            max,
            distribution: {}
          }

          // Count distribution
          ratings.forEach((rating: number) => {
            analytics.ratingStats.distribution[rating] = (analytics.ratingStats.distribution[rating] || 0) + 1
          })
        }
      } else if (question.question_type === 'yes_no') {
        // Calculate yes/no distribution
        const yesCount = questionAnswers.filter((a: any) => 
          a.answer_text?.toLowerCase() === 'yes' || a.answer_number === 1
        ).length
        const noCount = questionAnswers.filter((a: any) => 
          a.answer_text?.toLowerCase() === 'no' || a.answer_number === 0
        ).length

        analytics.yesNoDistribution = {
          yes: { count: yesCount, percentage: questionAnswers.length > 0 ? (yesCount / questionAnswers.length) * 100 : 0 },
          no: { count: noCount, percentage: questionAnswers.length > 0 ? (noCount / questionAnswers.length) * 100 : 0 }
        }
      } else if (question.question_type === 'text') {
        // For text responses, just provide the responses
        analytics.textResponses = questionAnswers.map((a: any) => ({
          response: a.answer_text,
          submittedAt: responses.find(r => r.poll_answers.some((pa: any) => pa.id === a.id))?.submitted_at
        }))
      }

      return analytics
    })

    // Calculate response timeline
    const responseTimeline = responses.reduce((timeline: any, response) => {
      const date = response.submitted_at.split('T')[0]
      timeline[date] = (timeline[date] || 0) + 1
      return timeline
    }, {})

    const analytics = {
      pollId: poll.id,
      pollTitle: poll.title,
      pollType: poll.type,
      status: poll.status,
      totalResponses,
      totalTargets,
      responseRate: Math.round(responseRate * 100) / 100,
      completionRate: responseRate,
      questionAnalytics,
      responseTimeline: Object.entries(responseTimeline).map(([date, count]: [string, any]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date)),
      demographics: {
        targetAudience: poll.target_audience,
        audienceSize: totalTargets
      }
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Error fetching poll analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
