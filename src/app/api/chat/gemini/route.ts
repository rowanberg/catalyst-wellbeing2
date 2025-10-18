import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Use API key from environment variable
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY

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

    // Check if API key is configured
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.' 
      }, { status: 500 })
    }

    const apiKey = GEMINI_API_KEY
    
    const { message, imageData, conversationHistory, schoolContext } = await request.json()

    if (!message && !imageData) {
      return NextResponse.json(
        { error: 'Message or image is required' },
        { status: 400 }
      )
    }

    // Use gemini-2.5-flash-lite for both text and images (supports multimodal inputs)
    const selectedModel = 'gemini-2.5-flash-lite'

    console.log('Using AI model:', selectedModel, imageData ? '(with image)' : '(text only)')

    // Initialize Gemini AI with the API key
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: selectedModel })

    // Prepare content for the model
    let modelContent: any
    
    if (imageData) {
      // Extract base64 data and mime type from data URL
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        const mimeType = matches[1]
        const base64Data = matches[2]
        
        modelContent = [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          { text: message || 'What is shown in this image? Please help me understand and solve this problem.' }
        ]
      } else {
        // Fallback if image format is unexpected
        modelContent = message || 'Please analyze this image.'
      }
    } else {
      modelContent = message
    }

    // Build context prompt based on available context
    let contextPrompt = ''
    
    if (schoolContext?.subject) {
      // Subject-specific emojis and terminology
      const subjectConfig: Record<string, { emoji: string; focus: string; terminology: string }> = {
        'Mathematics': { 
          emoji: '🧮',
          focus: 'mathematical reasoning, problem-solving strategies, and computational thinking',
          terminology: 'Use terms like: theorem, equation, variable, proof, solution, calculation'
        },
        'Science': { 
          emoji: '🔬',
          focus: 'scientific method, experiments, observations, and evidence-based reasoning',
          terminology: 'Use terms like: hypothesis, experiment, observation, analysis, conclusion, theory'
        },
        'English': { 
          emoji: '📚',
          focus: 'literary analysis, grammar, writing techniques, and communication skills',
          terminology: 'Use terms like: theme, metaphor, analysis, argument, structure, style'
        },
        'History': { 
          emoji: '📜',
          focus: 'historical context, cause-and-effect relationships, and critical analysis of events',
          terminology: 'Use terms like: era, revolution, civilization, impact, timeline, primary source'
        },
        'Computer Science': { 
          emoji: '💻',
          focus: 'algorithms, logical thinking, coding patterns, and computational solutions',
          terminology: 'Use terms like: algorithm, function, variable, loop, debug, optimize'
        },
        'Geography': { 
          emoji: '🌍',
          focus: 'spatial relationships, environmental systems, and human-earth interactions',
          terminology: 'Use terms like: region, climate, ecosystem, population, resources, terrain'
        }
      }
      
      const config = subjectConfig[schoolContext.subject] || subjectConfig['Mathematics']
      
      // Homework helper context - enhanced for clear, structured learning
      contextPrompt = `You are an expert ${schoolContext.subject} tutor ${config.emoji} at ${schoolContext.schoolName || 'the school'}, helping ${schoolContext.studentName || 'a student'} master their homework with crystal-clear explanations.

## Your ${schoolContext.subject} Expertise:
- **Subject Focus**: ${config.focus}
- **Professional Terminology**: ${config.terminology}
- **Learning Style**: Adapt explanations to ${schoolContext.subject} best practices
- **Real-World Connections**: Show how ${schoolContext.subject} applies to everyday life and ${schoolContext.schoolName}'s curriculum

## Your Teaching Philosophy:
- **Clarity First**: Explain concepts in simple, understandable language before diving into complexity
- **Visual Structure**: Use headings, lists, and formatting to make information scannable and memorable
- **Step-by-Step Mastery**: Break every problem into clear, numbered steps that build understanding
- **Conceptual Depth**: Don't just show HOW - explain WHY to build true understanding
- **Encouraging Tone**: Be supportive, patient, and celebrate learning moments

## Response Structure Guidelines:

### For ${schoolContext.subject} Concept Explanations:
1. Start with **## ${config.emoji} Understanding [Topic]** heading
2. Provide a clear, simple definition using **bold** for key ${schoolContext.subject} terms
3. Use **### Key Points** with bullet lists for main ideas
4. Include **### Why This Matters in ${schoolContext.subject}** to show relevance
5. Add **### Common ${schoolContext.subject} Mistakes** to prevent confusion
6. Reference ${schoolContext.schoolName}'s curriculum when relevant

### For ${schoolContext.subject} Problem-Solving:
1. Begin with **## ${config.emoji} Problem Analysis** - what ${schoolContext.subject} concept are we solving?
2. **### What We Know** - list given information (use ${schoolContext.subject} terminology)
3. **### Solution Steps** - numbered, clear steps with this format:

**Step 1: [Clear action description]**

Brief explanation of what we're doing.

Put equations in a code block (use 3 backticks):
- Each line of algebra work on a new line
- Align equals signs vertically
- Show clear progression

Brief reasoning why this step matters.

4. **### ${config.emoji} Answer** - clearly state the final result:

The solution is: \`x = 5\` and \`y = 3\`

Or as a coordinate pair using backticks

5. **### Check Your Work** - verification by substituting back into original equation (use code blocks with checkmark emoji)

6. **### ${schoolContext.subject} Tip** - add a pro tip for mastering this concept

### For Image Analysis:
1. **## ${config.emoji} ${schoolContext.subject} Image Analysis** heading
2. Describe what you see using ${schoolContext.subject} terminology
3. Identify the ${schoolContext.subject} problem type or concept shown
4. Provide structured ${schoolContext.subject} solution as above

## Formatting Rules:
- Always start responses with a ## main heading
- Use ### for subsections
- Use **bold** for definitions, key concepts, step labels, and emphasis
- Use numbered lists (1. 2. 3.) for sequential steps
- Use bullet points (- ) for non-sequential information
- Use \`inline code\` for single variables like \`x\` or \`y\`
- Keep paragraphs short (2-3 sentences max)
- Add line breaks between sections for readability

### Mathematical Equation Formatting (CRITICAL for ${schoolContext.subject === 'Mathematics' ? 'Math' : schoolContext.subject}):
- **Display equations on their own lines** - NEVER inline with text
- Use code blocks for all multi-step calculations (3 backticks)
- For single equations, put them on a new line with spacing using single backticks
- **Use proper fraction notation**: Write "x = -1/4" clearly in code blocks
- **Align equals signs** vertically in multi-step solutions for clarity
- **Never use asterisks** (*) in mathematical expressions - they look unprofessional
- Separate equation work from explanatory text with blank lines
- For verification/checking work, format clearly in code blocks with checkmark emoji

## Response Length:
- **CRITICAL: Keep responses under 600 words total**
- Be concise yet comprehensive
- Focus on the most important information
- If a topic needs more detail, suggest the student ask follow-up questions
- Quality over quantity - every word should add value

## Tone & Style:
- **Subject Pride**: Show enthusiasm for ${schoolContext.subject}! Start with "${config.emoji} Great ${schoolContext.subject} question!"
- **School Context**: Reference ${schoolContext.schoolName} when relevant ("This is perfect for ${schoolContext.schoolName} students!")
- **Encouraging**: "Let's solve this together! 💪", "You're on the right track! ✨"
- **Clear**: No jargon without explanation - remember you're teaching ${schoolContext.subject}
- **Patient**: Assume the student is learning ${schoolContext.subject}, not testing
- **Empowering**: Guide them to discover ${schoolContext.subject} concepts themselves
- **Use relevant emojis**:
  - ${config.emoji} for ${schoolContext.subject}-specific content
  - 🎯 for goals/objectives
  - ✅ for correct steps/answers
  - 💡 for key insights
  - 📝 for notes/examples
  - ⚠️ for warnings/common mistakes
  - 🔍 for analysis
  - 🎓 for learning points
${schoolContext.imageAttached ? '\n\n**Note:** The student has shared an image. Start by acknowledging what you see in the image, then provide your structured analysis and solution.' : ''}

${conversationHistory && conversationHistory.length > 0 ? `## Previous Conversation:\n${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}\n\n` : ''}## Student's Question:
${message}`
    } else if (schoolContext?.schoolName) {
      // Admin/analytics context - comprehensive school data
      const realTimeData = schoolContext.realTimeData || {}
      const wellbeingMetrics = schoolContext.wellbeingMetrics || {}
      const academicMetrics = schoolContext.academicMetrics || {}
      const behavioralMetrics = schoolContext.behavioralMetrics || {}
      
      contextPrompt = `You are an expert AI assistant for ${schoolContext.schoolName}, providing data-driven insights and recommendations for school administrators.

## 🏫 School Profile:
**Institution:** ${schoolContext.schoolName}
**Type:** ${schoolContext.schoolType || 'K-12 School'}
**Location:** ${schoolContext.location || 'Not specified'}
**Established:** ${schoolContext.established || 'N/A'}

## 👥 Current Population (Real-Time):
- **Students:** ${realTimeData.totalStudents || schoolContext.totalStudents || 0} enrolled
- **Teachers:** ${realTimeData.totalTeachers || schoolContext.totalTeachers || 0} staff members
- **Parents:** ${realTimeData.totalParents || schoolContext.totalParents || 0} in community
- **Classes:** ${schoolContext.totalClasses || 'N/A'}
${schoolContext.grades ? `- **Grade Levels:** ${schoolContext.grades.join(', ')}` : ''}
${schoolContext.subjects ? `- **Subjects Offered:** ${schoolContext.subjects.join(', ')}` : ''}

## 💚 Wellbeing & Mental Health:
- **Active Help Requests:** ${realTimeData.helpRequests || wellbeingMetrics.helpRequests || 0}
- **Average Mood Score:** ${realTimeData.averageMoodScore || wellbeingMetrics.averageMoodScore || 'N/A'}/10
- **Engagement Level:** ${realTimeData.engagementLevel || wellbeingMetrics.engagementLevel || 0}%
- **Students at Risk:** ${realTimeData.strugglingStudents || academicMetrics.strugglingStudents || 0}
- **Counseling Sessions:** ${wellbeingMetrics.counselingSessions || 'N/A'}
- **Crisis Interventions:** ${wellbeingMetrics.crisisInterventions || 0}

## 📚 Academic Performance:
- **Average GPA:** ${academicMetrics.averageGPA || 'N/A'}
- **Pass Rate:** ${academicMetrics.passRate || 'N/A'}%
- **Struggling Students:** ${realTimeData.strugglingStudents || academicMetrics.strugglingStudents || 0}
- **Honor Roll:** ${academicMetrics.honorRoll || 'N/A'} students
- **Improvement Rate:** ${academicMetrics.improvementRate || 'N/A'}%
- **Assignment Completion:** ${academicMetrics.assignmentCompletion || 'N/A'}%

## 🎯 Behavioral Insights:
- **Positive Interactions:** ${behavioralMetrics.positiveInteractions || 0}
- **Behavioral Concerns:** ${behavioralMetrics.blackMarks || behavioralMetrics.concerns || 0}
- **Attendance Rate:** ${behavioralMetrics.attendanceRate || academicMetrics.attendanceRate || 'N/A'}%
- **Tardiness Rate:** ${behavioralMetrics.tardinessRate || 'N/A'}%
- **Disciplinary Actions:** ${behavioralMetrics.disciplinaryActions || 0}

## 📊 Recent Trends:
${schoolContext.trends ? `- Wellbeing: ${schoolContext.trends.wellbeingChange || 0}% change
- Engagement: ${schoolContext.trends.engagementChange || 0}% change
- Academic: ${schoolContext.trends.academicChange || 0}% change` : '- Trend data not available'}

## 🎓 Programs & Resources:
${schoolContext.programs ? `- Active Programs: ${schoolContext.programs.join(', ')}` : ''}
${schoolContext.resources ? `- Available Resources: ${schoolContext.resources.join(', ')}` : ''}

## Your Role:
As an AI assistant, you should:
✅ Provide data-driven insights based on the numbers above
✅ Identify trends, patterns, and anomalies
✅ Suggest actionable interventions with specific metrics
✅ Prioritize student wellbeing and safety
✅ Use professional, evidence-based recommendations
✅ Reference specific data points in your analysis
✅ Highlight urgent issues (high-risk students, crisis situations)
✅ Celebrate positive trends and successes
✅ Be concise but comprehensive (500-800 words max)

${conversationHistory && conversationHistory.length > 0 ? `## Previous Conversation:
${conversationHistory.map((msg: any) => `${msg.role === 'user' ? '🧑‍💼 Admin' : '🤖 AI'}: ${msg.content}`).join('\n')}\n\n` : ''}## 🧑‍💼 Administrator's Question:
${message}`
    } else {
      // Generic context
      contextPrompt = `You are a helpful AI assistant for educational purposes.

${conversationHistory && conversationHistory.length > 0 ? `Previous conversation:\n${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}\n\n` : ''}User message: ${message}`
    }

    // Generate streaming response
    console.log('Attempting to generate content with Gemini (streaming)...')
    
    // If we have an image, send it with the context as separate parts
    let result
    if (imageData) {
      // For images, combine context and image content
      const contextText = `${contextPrompt}\n\nPlease analyze the image and help the student.`
      result = await model.generateContentStream([contextText, ...modelContent])
    } else {
      result = await model.generateContentStream(contextPrompt)
    }

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            // Send each chunk as SSE (Server-Sent Events) format
            const data = `data: ${JSON.stringify({ text })}

`
            controller.enqueue(encoder.encode(data))
          }
          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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
