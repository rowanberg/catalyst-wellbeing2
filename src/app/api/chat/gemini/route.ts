import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Encryption key for API keys (should be in environment variables)
const ENCRYPTION_KEY = process.env.GEMINI_ENCRYPTION_KEY || 'your-32-character-secret-key-here'

function decrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift()!, 'hex')
  const encryptedText = textParts.join(':')
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
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
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to determine role and school
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    let apiKey: string
    let selectedModel: string

    if (profile.role === 'admin') {
      // For admins, use school-level configuration
      if (!profile.school_id) {
        return NextResponse.json({ error: 'Admin not associated with a school' }, { status: 400 })
      }

      const { data: schoolConfig, error: schoolConfigError } = await supabase
        .from('school_gemini_config')
        .select('api_key, selected_model')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .single()

      if (schoolConfigError || !schoolConfig || !schoolConfig.api_key) {
        return NextResponse.json({ 
          error: 'School Gemini API not configured. Please configure your school\'s Gemini API key in Admin Settings.' 
        }, { status: 400 })
      }

      apiKey = schoolConfig.api_key // Already stored in plain text
      selectedModel = schoolConfig.selected_model || 'gemini-1.5-flash'
    } else {
      // For students, use individual user configuration (encrypted)
      const { data: config, error: configError } = await supabase
        .from('student_gemini_config')
        .select('encrypted_api_key, selected_model')
        .eq('user_id', user.id)
        .single()

      if (configError || !config || !config.encrypted_api_key) {
        return NextResponse.json({ 
          error: 'Gemini API not configured. Please configure your Gemini API key in Settings.' 
        }, { status: 400 })
      }

      // Decrypt API key for students
      try {
        apiKey = decrypt(config.encrypted_api_key)
        selectedModel = config.selected_model || 'gemini-1.5-flash'
      } catch (error) {
        console.error('Error decrypting API key:', error)
        return NextResponse.json({ 
          error: 'Invalid API key configuration. Please reconfigure in Settings.' 
        }, { status: 400 })
      }
    }

    const { message, conversationHistory, schoolContext } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Try different model name formats to find what works
    let actualModel = 'gemini-1.5-flash-latest' // Try the latest format first
    
    if (selectedModel === 'gemini-1.5-flash') {
      actualModel = 'gemini-1.5-flash-latest'
    } else if (selectedModel === 'gemini-1.5-pro') {
      actualModel = 'gemini-1.5-pro-latest'
    } else if (selectedModel === 'gemini-pro') {
      actualModel = 'gemini-1.5-flash-latest' // Default to flash-latest
    }

    console.log('Using AI model:', actualModel)

    // Initialize Gemini AI with the user's API key
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: actualModel })

    // Build context prompt for school-specific responses
    const contextPrompt = schoolContext ? `You are an AI assistant for ${schoolContext.schoolName}, a school management platform with advanced data visualization capabilities.

Current School Context:
- School: ${schoolContext.schoolName}
- Total Students: ${schoolContext.totalStudents}
- Total Teachers: ${schoolContext.totalTeachers}
- Total Parents: ${schoolContext.totalParents}
- Grades: ${schoolContext.grades.join(', ')}
- Subjects: ${schoolContext.subjects.join(', ')}

Wellbeing Metrics:
- Average Mood Score: ${schoolContext.wellbeingMetrics.averageMoodScore}/10
- Help Requests: ${schoolContext.wellbeingMetrics.helpRequests}
- Engagement Level: ${schoolContext.wellbeingMetrics.engagementLevel}%

Academic Performance:
- Average Grades: ${JSON.stringify(schoolContext.academicMetrics.averageGrades)}
- Completion Rates: ${JSON.stringify(schoolContext.academicMetrics.completionRates)}
- Students Needing Support: ${schoolContext.academicMetrics.strugglingStudents}

Behavioral Data:
- Positive Interactions: ${schoolContext.behavioralMetrics.positiveInteractions}
- Black Marks: ${schoolContext.behavioralMetrics.blackMarks}
- Interventions Needed: ${schoolContext.behavioralMetrics.interventionsNeeded}

Recent Activities: ${schoolContext.recentActivities.length > 0 ? schoolContext.recentActivities.map((a: any) => `${a.type}: ${a.description}`).join(', ') : 'No recent activities'}

Mood Logging Data: ${schoolContext.moodLoggingData?.length || 0} entries today
Today's Adventures: ${schoolContext.todaysAdventures?.length || 0} adventures logged

RESPONSE FORMAT INSTRUCTIONS:
You can provide rich, interactive responses using markdown and structured data. Use these formats when appropriate:

1. **Tables**: Use markdown table format for data comparisons:
   | Column 1 | Column 2 | Column 3 |
   |----------|----------|----------|
   | Data 1   | Data 2   | Data 3   |

2. **Lists**: Use markdown lists for organized information:
   - Bullet point lists for unordered items
   1. Numbered lists for sequential steps

3. **Charts and Graphs**: When showing data trends, suggest chart visualizations:
   - For grade distributions: "This data would be best shown as a bar chart"
   - For progress over time: "This trend is ideal for a line chart"
   - For category breakdowns: "A pie chart would illustrate these proportions well"

4. **Structured Data**: Use headers, subheaders, and formatting:
   ## Main Topic
   ### Subtopic
   **Bold text** for emphasis
   *Italic text* for notes

5. **Code blocks**: For technical information:
   \`\`\`
   Technical details or formulas
   \`\`\`

6. **Blockquotes**: For important insights:
   > Key insight or recommendation

Always structure your responses with clear headings, use appropriate formatting, and suggest data visualizations when discussing metrics or trends.

Current conversation context: ${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

User message: ${message}` : `You are Whiskers, a helpful AI assistant for schools. Please provide educational insights and recommendations.

User message: ${message}`

    // Generate response
    console.log('Attempting to generate content with Gemini...')
    const result = await model.generateContent(contextPrompt)
    const response = await result.response
    const text = response.text()

    console.log('Gemini response received successfully')
    return NextResponse.json({
      message: text,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Gemini API error details:', error)
    
    // Check if it's an API key issue
    if (error instanceof Error && error.message.includes('API_KEY')) {
      return NextResponse.json({
        error: 'Invalid Gemini API key. Please check your API key configuration.',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }
    
    // Check if it's a quota/billing issue
    if (error instanceof Error && (error.message.includes('quota') || error.message.includes('billing'))) {
      return NextResponse.json({
        error: 'Gemini API quota exceeded or billing issue. Please check your Google Cloud console.',
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }
    
    // Generic error response
    return NextResponse.json({
      error: `Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
