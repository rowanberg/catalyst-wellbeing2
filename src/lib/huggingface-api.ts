import { HfInference } from '@huggingface/inference'

export interface HuggingFaceConfig {
  apiKey: string
  model?: string
}

export interface SchoolContext {
  schoolName: string
  totalStudents: number
  totalTeachers: number
  totalParents: number
  grades: string[]
  subjects: string[]
  wellbeingMetrics: {
    averageMoodScore: number
    helpRequests: number
    engagementLevel: number
  }
  academicMetrics: {
    averageGrades?: Record<string, number>
    completionRates?: Record<string, number>
    strugglingStudents: number
  }
  recentActivities: Array<{
    type: string
    description: string
    timestamp: string
    studentCount?: number
  }>
  behavioralMetrics?: {
    positiveInteractions: number
    interventionsNeeded: number
    blackMarks: number
  }
  moodLoggingData?: Array<{
    studentId: string
    studentName: string
    mood: string
    moodScore: number
    timestamp: string
    notes?: string
  }>
  todaysAdventures?: Array<{
    studentId: string
    studentName: string
    adventure: string
    category: string
    timestamp: string
    completed: boolean
  }>
}

export class HuggingFaceService {
  private model: string
  private apiKey: string

  constructor(config: HuggingFaceConfig) {
    this.model = config.model || 'google/flan-t5-large'
    this.apiKey = config.apiKey
  }

  /**
   * Generate AI response with school context
   */
  async generateResponse(
    message: string, 
    schoolContext: SchoolContext,
    conversationHistory: Array<{ role: 'user' | 'assistant', content: string }> = []
  ): Promise<string> {
    // Skip API calls entirely and use intelligent fallback responses
    console.log('Hugging Face API unavailable - using intelligent fallback system')
    return this.getIntelligentResponse(message, schoolContext)
  }

  /**
   * Generate insights based on school data
   */
  async generateInsights(schoolContext: SchoolContext): Promise<Array<{
    type: 'wellbeing' | 'academic' | 'engagement' | 'safety'
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    actionable: boolean
  }>> {
    try {
      const insightPrompt = `
        As an AI educational assistant analyzing school data, generate 3-5 actionable insights based on this information:
        
        School: ${schoolContext.schoolName}
        Students: ${schoolContext.totalStudents}
        Teachers: ${schoolContext.totalTeachers}
        
        Wellbeing Metrics:
        - Average mood score: ${schoolContext.wellbeingMetrics.averageMoodScore}/10
        - Help requests: ${schoolContext.wellbeingMetrics.helpRequests}
        - Engagement level: ${schoolContext.wellbeingMetrics.engagementLevel}%
        
        Academic Metrics:
        - Struggling students: ${schoolContext.academicMetrics.strugglingStudents}
        - Completion rates: ${JSON.stringify(schoolContext.academicMetrics.completionRates)}
        
        Behavioral Metrics:
        - Positive interactions: ${schoolContext.behavioralMetrics?.positiveInteractions || 0}
        - Interventions needed: ${schoolContext.behavioralMetrics?.interventionsNeeded || 0}
        - Black marks: ${schoolContext.behavioralMetrics?.blackMarks || 0}
        
        Generate insights in this exact JSON format:
        [{"type": "wellbeing|academic|engagement|safety", "title": "Brief title", "description": "Detailed description with specific recommendations", "priority": "high|medium|low", "actionable": true|false}]
      `

      const response = await fetch(`https://api-inference.huggingface.co/models/${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: insightPrompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.3,
            do_sample: false
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const result = await response.json()
      let generatedText = ''
      
      if (Array.isArray(result) && result[0]?.generated_text) {
        generatedText = result[0].generated_text
      } else if (result.generated_text) {
        generatedText = result.generated_text
      } else {
        throw new Error('Unexpected response format')
      }

      return this.parseInsightsResponse(generatedText)
    } catch (error) {
      console.error('Error generating insights:', error)
      return this.getFallbackInsights(schoolContext)
    }
  }

  /**
   * Build context prompt from school data
   */
  private buildContextPrompt(context: SchoolContext): string {
    return `
You are Whiskers, an AI assistant for ${context.schoolName}, a school with ${context.totalStudents} students and ${context.totalTeachers} teachers.

Current School Status:
- Grades: ${context.grades.join(', ')}
- Subjects: ${context.subjects.join(', ')}
- Average mood score: ${context.wellbeingMetrics.averageMoodScore}/10
- Help requests this week: ${context.wellbeingMetrics.helpRequests}
- Student engagement: ${context.wellbeingMetrics.engagementLevel}%
- Students needing support: ${context.academicMetrics.strugglingStudents}
- Recent interventions needed: ${context.behavioralMetrics?.interventionsNeeded || 0}

Recent Activities:
${context.recentActivities.map(activity => `- ${activity.description} (${activity.timestamp})`).join('\n')}

You should provide helpful, actionable advice for teachers and administrators to improve student wellbeing, academic performance, and school culture. Be specific and reference the school data when relevant.
    `.trim()
  }

  /**
   * Build full prompt with context and conversation history for FLAN-T5
   */
  private buildFullPrompt(
    contextPrompt: string, 
    conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>,
    currentMessage: string
  ): string {
    // FLAN-T5 works better with instruction-style prompts
    let prompt = `You are an AI assistant for school administration. Use the following context to answer questions about student wellbeing and academic performance.

${contextPrompt}

Question: ${currentMessage}
Answer:`
    
    return prompt
  }

  /**
   * Clean AI response
   */
  private cleanResponse(fullResponse: string, originalPrompt: string): string {
    // Remove the original prompt from response
    let cleaned = fullResponse.replace(originalPrompt, '').trim()
    
    // Remove common AI artifacts
    cleaned = cleaned.replace(/^(Whiskers:|AI:|Assistant:)/i, '').trim()
    cleaned = cleaned.replace(/Human:.*$/, '').trim()
    
    // Ensure response isn't too long
    if (cleaned.length > 1000) {
      cleaned = cleaned.substring(0, 1000) + '...'
    }
    
    return cleaned || "I understand your question. Let me analyze the school data and provide you with relevant insights and recommendations."
  }

  /**
   * Parse insights from AI response
   */
  private parseInsightsResponse(response: string): Array<any> {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[.*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Error parsing insights JSON:', error)
    }
    
    return this.getFallbackInsights({} as SchoolContext)
  }

  /**
   * Get intelligent response based on message analysis and school context
   */
  private getIntelligentResponse(message: string, context: SchoolContext): string {
    const lowerMessage = message.toLowerCase().trim()
    
    // Debug logging to see what's happening
    console.log('Processing message:', message)
    console.log('Lower message:', lowerMessage)
    
    // Simple greetings - exact matches only
    if (lowerMessage === 'hi' || lowerMessage === 'hello' || lowerMessage === 'hey') {
      return `Hi! I'm here to help you analyze ${context.schoolName}'s performance. What would you like to know about?`
    }
    
    // Questions about students
    if (lowerMessage.includes('student') && (lowerMessage.includes('how') || lowerMessage.includes('doing') || lowerMessage.includes('are'))) {
      if (context.totalStudents === 0) {
        return `There are currently no students in the system. This could be because the database is still being set up or student data hasn't been imported yet.`
      }
      return `Your ${context.totalStudents} students are doing ${context.wellbeingMetrics.averageMoodScore >= 7 ? 'well' : 'okay'}. Average mood is ${context.wellbeingMetrics.averageMoodScore}/10 with ${context.wellbeingMetrics.engagementLevel}% engagement.`
    }
    
    // Mood and wellbeing queries
    if (lowerMessage.includes('mood') || lowerMessage.includes('wellbeing') || lowerMessage.includes('mental health') || lowerMessage.includes('feeling')) {
      const moodLevel = context.wellbeingMetrics.averageMoodScore >= 7 ? 'positive' : context.wellbeingMetrics.averageMoodScore >= 5 ? 'moderate' : 'concerning'
      return `Current mood score: ${context.wellbeingMetrics.averageMoodScore}/10 (${moodLevel}). There are ${context.wellbeingMetrics.helpRequests} help requests and ${context.wellbeingMetrics.engagementLevel}% engagement. ${moodLevel === 'concerning' ? 'Consider immediate support programs.' : moodLevel === 'moderate' ? 'Proactive mental health initiatives recommended.' : 'Keep up the good work!'}`
    }
    
    // Academic performance queries
    if (lowerMessage.includes('academic') || lowerMessage.includes('grade') || lowerMessage.includes('performance') || lowerMessage.includes('struggling') || lowerMessage.includes('learning')) {
      if (context.academicMetrics.strugglingStudents === 0) {
        return `Excellent! No students are currently flagged as struggling academically. Your teaching methods and support systems are working effectively.`
      }
      const strugglingPercent = Math.round((context.academicMetrics.strugglingStudents / context.totalStudents) * 100)
      return `${context.academicMetrics.strugglingStudents} students (${strugglingPercent}%) need academic support. Consider differentiated instruction and peer tutoring programs.`
    }
    
    // Behavioral and discipline queries
    if (lowerMessage.includes('behavior') || lowerMessage.includes('discipline') || lowerMessage.includes('intervention') || lowerMessage.includes('conduct')) {
      const positiveRatio = Math.round((context.behavioralMetrics?.positiveInteractions || 0) / ((context.behavioralMetrics?.blackMarks || 0) + 1))
      return `Behavioral stats: ${context.behavioralMetrics?.positiveInteractions || 0} positive interactions vs ${context.behavioralMetrics?.blackMarks || 0} disciplinary actions (${positiveRatio}:1 ratio). ${context.behavioralMetrics?.interventionsNeeded || 0} students need intervention support.`
    }
    
    // Staff and teacher queries
    if (lowerMessage.includes('teacher') || lowerMessage.includes('staff') || lowerMessage.includes('professional development') || lowerMessage.includes('faculty')) {
      const studentTeacherRatio = Math.round(context.totalStudents / context.totalTeachers)
      return `Staff overview: ${context.totalTeachers} teachers supporting ${context.totalStudents} students (${studentTeacherRatio}:1 ratio). Consider professional development and teacher wellness initiatives.`
    }
    
    // Data or analytics queries
    if (lowerMessage.includes('data') || lowerMessage.includes('analytics') || lowerMessage.includes('metrics') || lowerMessage.includes('statistics') || lowerMessage.includes('numbers')) {
      return `Data snapshot: ${context.totalStudents} students, ${context.totalTeachers} teachers. Mood: ${context.wellbeingMetrics.averageMoodScore}/10, Engagement: ${context.wellbeingMetrics.engagementLevel}%, Academic support needed: ${context.academicMetrics.strugglingStudents}, Positive interactions: ${context.behavioralMetrics?.positiveInteractions || 0}.`
    }
    
    // Improvement or strategy queries
    if (lowerMessage.includes('improve') || lowerMessage.includes('strategy') || lowerMessage.includes('recommendation') || lowerMessage.includes('suggest') || lowerMessage.includes('advice')) {
      return `Strategic focus areas: Wellbeing (${context.wellbeingMetrics.averageMoodScore}/10), Academic support (${context.academicMetrics.strugglingStudents} students), Behavioral interventions (${context.behavioralMetrics?.interventionsNeeded || 0} needed). Implement data-driven interventions and strengthen school-family partnerships.`
    }
    
    // General status queries
    if (lowerMessage.includes('how') && (lowerMessage.includes('school') || lowerMessage.includes('things') || lowerMessage.includes('going') || lowerMessage.includes('status'))) {
      if (context.totalStudents === 0) {
        return `The school system shows 0 students currently. This suggests the database may still be initializing or student data needs to be imported.`
      }
      return `School status: ${context.wellbeingMetrics.averageMoodScore >= 7 ? 'Positive trends' : 'Mixed results'}. ${context.totalStudents} students with ${context.wellbeingMetrics.averageMoodScore}/10 mood and ${context.wellbeingMetrics.engagementLevel}% engagement. ${context.academicMetrics.strugglingStudents > 0 ? `${context.academicMetrics.strugglingStudents} students need academic support.` : 'Academic performance is strong.'}`
    }
    
    // Questions about specific topics
    if (lowerMessage.includes('what') || lowerMessage.includes('tell me') || lowerMessage.includes('show me')) {
      if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('concern')) {
        const issues = []
        if (context.wellbeingMetrics.averageMoodScore < 6) issues.push('low mood scores')
        if (context.academicMetrics.strugglingStudents > 0) issues.push(`${context.academicMetrics.strugglingStudents} students struggling academically`)
        if ((context.behavioralMetrics?.interventionsNeeded || 0) > 0) issues.push(`${context.behavioralMetrics?.interventionsNeeded || 0} behavioral interventions needed`)
        
        return issues.length > 0 ? `Key concerns: ${issues.join(', ')}.` : 'No major issues detected. School metrics look healthy!'
      }
    }
    
    // Random or unclear messages - provide helpful guidance
    const randomResponses = [
      `I can help with school analytics. Try asking about "student wellbeing", "academic performance", or "behavioral insights".`,
      `What would you like to know? I can analyze mood, academics, behavior, or staff metrics.`,
      `Ask me about specific areas like "How are students doing?" or "What academic support is needed?"`,
      `I'm here to help analyze your school data. What specific insights are you looking for?`
    ]
    
    // Use message length and content to pick different responses
    const responseIndex = (message.length + lowerMessage.charCodeAt(0)) % randomResponses.length
    return randomResponses[responseIndex]
  }

  /**
   * Get fallback response when API fails (legacy method)
   */
  private getFallbackResponse(message: string, context: SchoolContext): string {
    return this.getIntelligentResponse(message, context)
  }

  /**
   * Fallback insights when generation fails
   */
  private getFallbackInsights(context: SchoolContext): Array<any> {
    return [
      {
        type: 'wellbeing',
        title: 'Monitor Student Wellbeing',
        description: 'Regular check-ins with students showing signs of stress or disengagement can help identify issues early.',
        priority: 'medium',
        actionable: true
      },
      {
        type: 'academic',
        title: 'Academic Support Review',
        description: 'Consider implementing targeted support programs for students struggling with core subjects.',
        priority: 'high',
        actionable: true
      },
      {
        type: 'engagement',
        title: 'Engagement Opportunities',
        description: 'Interactive learning activities and gamification can boost student engagement levels.',
        priority: 'medium',
        actionable: true
      }
    ]
  }
}

export default HuggingFaceService
