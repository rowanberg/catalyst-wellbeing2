import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    console.log('Gemini API Key exists:', !!process.env.GEMINI_API_KEY)
    console.log('Gemini API Key length:', process.env.GEMINI_API_KEY?.length || 0)
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('Gemini API key not configured')
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const { message, conversationHistory, schoolContext } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
