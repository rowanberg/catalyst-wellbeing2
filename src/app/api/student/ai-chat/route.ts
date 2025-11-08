import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

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
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, imageData, conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get student profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, school_id, class_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can use this feature' }, { status: 403 })
    }

    // Fetch today's topics for context
    const today = new Date().toISOString().split('T')[0]
    const { data: todayTopics } = await supabase
      .from('daily_topics')
      .select(`
        topic,
        topic_date,
        classes (
          class_name,
          subject
        ),
        profiles!daily_topics_teacher_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('class_id', profile.class_id)
      .eq('topic_date', today)

    // Fetch recent topics (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: recentTopics } = await supabase
      .from('daily_topics')
      .select('topic, topic_date, classes(subject)')
      .eq('class_id', profile.class_id)
      .gte('topic_date', sevenDaysAgo)
      .lt('topic_date', today)
      .order('topic_date', { ascending: false })
      .limit(5)

    // Build context-aware system prompt
    const todayTopicsContext = todayTopics && todayTopics.length > 0
      ? `\n\n📚 **Today's Class Topics:**\n${todayTopics.map((t: any) => {
          const teacherName = t.profiles ? `${t.profiles.first_name} ${t.profiles.last_name}` : 'Teacher'
          const className = t.classes?.class_name || 'Class'
          const subject = t.classes?.subject || ''
          return `- ${subject ? `${subject} (${className})` : className}: "${t.topic}" - taught by ${teacherName}`
        }).join('\n')}`
      : ''

    const recentTopicsContext = recentTopics && recentTopics.length > 0
      ? `\n\n📖 **Recent Topics (Last 7 Days):**\n${recentTopics.map((t: any) => 
          `- ${t.topic_date}: "${t.topic}" ${t.classes?.subject ? `(${t.classes.subject})` : ''}`
        ).join('\n')}`
      : ''

    const systemPrompt = `You are Luminex AI, a friendly and intelligent homework assistant for ${profile.first_name || 'the student'}. 

**Your Capabilities:**
- Help with homework questions across all subjects
- Explain concepts step-by-step
- Generate flashcards for study
- Create visual graphs and charts
- Provide personalized learning support

**Important Guidelines:**
1. **Today's Focus**: The student's teacher has assigned specific topics today. Prioritize helping with these topics when relevant.
2. **Educational Approach**: Don't just give answers - guide the student to understand the concepts.
3. **Engagement**: Be encouraging, supportive, and make learning fun.
4. **Accuracy**: Provide accurate, age-appropriate information.
5. **Safety**: Never provide harmful information or encourage cheating.

${todayTopicsContext}${recentTopicsContext}

**Student Info:**
- Name: ${profile.first_name} ${profile.last_name}
- Role: Student

**Special Features:**
- To create flashcards, wrap them in: <<<FLASHCARD>>> Q: [question] A: [answer] <<<END_FLASHCARD>>>
- To create graphs, use: <<<GRAPH:type>>> {"title": "...", "data": [...], "xKey": "...", "yKeys": [...]} <<<END_GRAPH>>>
  where type can be: line, bar, area, or scatter

When the student asks about homework or needs help, check if it relates to today's topics and provide extra context and examples from what they learned in class today!`

    // Get API key from environment or edge function
    let apiKey = process.env.GEMINI_API_KEY
    
    // If no direct API key, try the intelligent router
    if (!apiKey) {
      try {
        const routerResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/intelligent-ai-router`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              model: 'gemini-2.0-flash-exp',
              tokens: 2000,
              userId: user.id,
              endpoint: '/api/student/ai-chat'
            })
          }
        )

        if (routerResponse.ok) {
          const routerData = await routerResponse.json()
          apiKey = routerData.api_key
        }
      } catch (error) {
        console.error('Router unavailable, using fallback')
      }
    }

    if (!apiKey) {
      throw new Error('AI service unavailable')
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2000,
      }
    })

    // Build full prompt with history
    let fullPrompt = systemPrompt + '\n\n'
    
    conversationHistory.forEach((msg: any) => {
      const role = msg.type === 'user' ? 'Student' : 'Luminex AI'
      fullPrompt += `${role}: ${msg.content}\n\n`
    })
    
    fullPrompt += `Student: ${message}\n\nLuminex AI:`

    // Generate response
    const result = await model.generateContent(fullPrompt)
    const response = result.response
    const aiContent = response.text()

    return NextResponse.json({
      success: true,
      response: aiContent,
      todayTopicsUsed: todayTopics && todayTopics.length > 0,
      metadata: {
        provider: 'gemini',
        model: 'gemini-2.0-flash-exp',
        hasTodayTopics: (todayTopics?.length || 0) > 0
      }
    })

  } catch (error: any) {
    console.error('Error in AI chat:', error)
    return NextResponse.json({ 
      error: error.message || 'AI Chat encountered an error. Please try again.',
      details: error.toString()
    }, { status: 500 })
  }
}
