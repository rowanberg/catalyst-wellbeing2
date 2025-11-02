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

    // Check authentication - Using getUser() for secure server-side validation
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Get API key from intelligent router
    const routerResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/intelligent-ai-router`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash-lite',
        tokens: Math.ceil((title.length + content.length) / 4) + 500, // Estimate tokens
        userId: user.id,
        endpoint: '/api/admin/announcements/enhance-ai'
      })
    })

    if (!routerResponse.ok) {
      const errorData = await routerResponse.json()
      if (routerResponse.status === 429) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded', 
          message: 'All AI models are currently busy. Please try again in a moment.' 
        }, { status: 429 })
      }
      throw new Error(errorData.error || 'Failed to get API key')
    }

    const { api_key, model_used } = await routerResponse.json()

    // Initialize Gemini with the obtained key
    // The router already returns the correct Google API model name
    const genAI = new GoogleGenerativeAI(api_key)
    const model = genAI.getGenerativeModel({ model: model_used })

    // Create professional enhancement prompt
    const prompt = `You are a professional communication expert for educational institutions. Enhance the following school announcement to make it more professional, clear, and engaging while maintaining the original intent and key information.

Original Title: ${title}
Original Content: ${content}

Guidelines:
- Keep the message concise and easy to understand
- Use professional yet warm and friendly tone
- Maintain all important details and dates
- Improve grammar, punctuation, and formatting
- Add appropriate structure (paragraphs, bullet points if needed)
- Make it suitable for school-wide communication
- Keep it under 500 words

Respond with ONLY the enhanced announcement in the following JSON format:
{
  "title": "enhanced title here",
  "content": "enhanced content here"
}

Do not include any other text, explanations, or markdown formatting.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    let enhanced
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      enhanced = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', text)
      return NextResponse.json({ 
        error: 'Failed to parse AI response', 
        message: 'The AI returned an invalid response. Please try again.' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      enhanced: {
        title: enhanced.title || title,
        content: enhanced.content || content
      },
      model_used
    })

  } catch (error: any) {
    console.error('Error enhancing announcement:', error)
    return NextResponse.json(
      { 
        error: 'Failed to enhance announcement', 
        message: error.message || 'An unexpected error occurred' 
      },
      { status: 500 }
    )
  }
}
