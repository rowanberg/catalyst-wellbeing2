import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    // Validate Gemini API key early
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Authentication error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Get user profile and verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if (profile?.role !== 'admin') {
      console.error('❌ Access denied - User role:', profile?.role)
      return NextResponse.json(
        { error: 'Admin access required - Your role: ' + (profile?.role || 'unknown') },
        { status: 403 }
      )
    }

    console.log('✅ User authenticated:', user.id, 'Role:', profile.role, 'School:', profile.school_id)

    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Fetch school data for context
    const [
      studentsResult,
      teachersResult,
      gradesResult,
      attendanceResult,
      wellbeingResult,
      assessmentsResult
    ] = await Promise.all([
      // Get students count and recent moods
      supabase
        .from('profiles')
        .select('id, full_name, student_grade, student_section, created_at')
        .eq('school_id', profile.school_id)
        .eq('role', 'student')
        .limit(100),
      
      // Get teachers
      supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('school_id', profile.school_id)
        .eq('role', 'teacher')
        .limit(50),
      
      // Get recent grades
      supabase
        .from('grades')
        .select('grade, subject, student_id, created_at')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false })
        .limit(200),
      
      // Get attendance data
      supabase
        .from('attendance')
        .select('date, status, student_id')
        .eq('school_id', profile.school_id)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false })
        .limit(500),
      
      // Get wellbeing/mood data
      supabase
        .from('mood_tracking')
        .select('mood, notes, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(200),
      
      // Get assessments
      supabase
        .from('assessments')
        .select('title, type, subject, total_marks, average_score, created_at')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false })
        .limit(50)
    ])

    // Calculate analytics
    const students = studentsResult.data || []
    const teachers = teachersResult.data || []
    const grades = gradesResult.data || []
    const attendance = attendanceResult.data || []
    const wellbeing = wellbeingResult.data || []
    const assessments = assessmentsResult.data || []

    // Calculate key metrics
    const totalStudents = students.length
    const totalTeachers = teachers.length
    
    // Grade analytics
    const gradesBySubject: Record<string, number[]> = {}
    grades.forEach(g => {
      if (g.subject && g.grade) {
        if (!gradesBySubject[g.subject]) {
          gradesBySubject[g.subject] = []
        }
        gradesBySubject[g.subject].push(parseFloat(g.grade))
      }
    })
    
    const subjectAverages = Object.entries(gradesBySubject).map(([subject, grades]) => ({
      subject,
      average: grades.reduce((a, b) => a + b, 0) / grades.length,
      count: grades.length
    }))

    // Attendance analytics
    const attendanceStats = {
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      total: attendance.length,
      rate: attendance.length > 0 
        ? ((attendance.filter(a => a.status === 'present').length / attendance.length) * 100).toFixed(1)
        : 0
    }

    // Wellbeing analytics
    const moodCounts: Record<string, number> = {}
    wellbeing.forEach(w => {
      if (w.mood) {
        moodCounts[w.mood] = (moodCounts[w.mood] || 0) + 1
      }
    })

    // Assessment analytics
    const assessmentStats = {
      total: assessments.length,
      averageScore: assessments.reduce((sum, a) => sum + (a.average_score || 0), 0) / (assessments.length || 1),
      byType: assessments.reduce((acc, a) => {
        acc[a.type || 'unknown'] = (acc[a.type || 'unknown'] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Build context for Gemini
    const systemContext = `You are a professional school data analyst assistant. Analyze the provided school data and respond to queries with clear, actionable insights.

**IMPORTANT GUIDELINES:**
- Be concise and direct - avoid unnecessary verbosity
- If specific data is unavailable, briefly acknowledge it and focus on available insights
- Don't create elaborate tables or sections for missing data
- Prioritize actionable recommendations over data descriptions
- Keep responses focused and practical

Current School Data Overview:
- Total Students: ${totalStudents}
- Total Teachers: ${totalTeachers}
- Attendance Rate (Last 30 days): ${attendanceStats.rate}%
- Total Assessments: ${assessmentStats.total}

Subject Performance:
${subjectAverages.slice(0, 10).map(s => `- ${s.subject}: Average ${s.average.toFixed(1)}% (${s.count} grades)`).join('\n')}

Recent Attendance (Last 30 days):
- Present: ${attendanceStats.present} records
- Absent: ${attendanceStats.absent} records
- Late: ${attendanceStats.late} records

Student Wellbeing (Recent Moods):
${Object.entries(moodCounts).slice(0, 5).map(([mood, count]) => `- ${mood}: ${count} check-ins`).join('\n')}

Assessment Overview:
- Average Score: ${assessmentStats.averageScore.toFixed(1)}%
- Types: ${Object.entries(assessmentStats.byType).map(([type, count]) => `${type} (${count})`).join(', ')}

RESPONSE FORMATTING GUIDELINES:

1. **Structure**: Start with a clear H1 heading that directly addresses the query
2. **Conciseness**: Keep responses focused - avoid unnecessary elaboration on missing data
3. **Data Presentation - ALWAYS USE TABLES**:
   - **MANDATORY**: Use markdown tables for ALL numeric data, comparisons, and metrics
   - Tables for ANY data with 2+ rows of information
   - Format: | Column 1 | Column 2 | Column 3 |
            |----------|----------|----------|
            | Data     | Data     | Data     |
   - Include percentages, counts, and status indicators in tables
   - Use bullet points ONLY for action items and recommendations
   - Skip sections if data is unavailable - mention briefly in summary
4. **Visual Emphasis**:
   - **Bold** critical numbers and key findings within tables
   - Use emojis sparingly in headers: 📊 📈 📉 ✅ ⚠️ 🎯 💡
5. **Handling Missing Data**:
   - Briefly note what's unavailable (1-2 sentences max)
   - Focus on what IS available
   - Provide 2-3 specific next steps if data is missing
   - Don't create elaborate frameworks for unavailable data
6. **Action Items**: Provide 3-5 specific, prioritized recommendations
7. **Tone**: Professional, direct, solution-focused
8. **Length**: Target 200-400 words unless extensive data requires more

EXAMPLE FORMAT:
# Student Performance Analysis

Overall academic performance shows **positive trends** with a school average of **78.5%**. However, certain subjects require immediate attention.

## Performance Overview 📊

| Subject | Average Score | Students | Trend | Status |
|---------|--------------|----------|-------|--------|
| Math | 82% | 45 | 📈 +5% | ✅ Strong |
| Science | 75% | 45 | 📉 -3% | ⚠️ At Risk |
| English | 79% | 45 | — 0% | ✅ Stable |

## Attendance Breakdown

| Status | Count | Percentage |
|--------|-------|------------|
| Present | 850 | 85.0% |
| Absent | 100 | 10.0% |
| Late | 50 | 5.0% |

## Actionable Recommendations 🎯
1. **Immediate**: Schedule intervention sessions for Science students scoring below 70%
2. **Short-term**: Implement peer tutoring program in underperforming subjects
3. **Long-term**: Review Science curriculum and teaching methodologies

REMEMBER: Always present data in table format. Do not use plain text or bullet points for numeric data.`

    // Initialize Gemini model
    console.log('🤖 Initializing Gemini model...')
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    })

    // Generate response
    console.log('📝 Generating AI response for query:', message.substring(0, 100))
    const prompt = `${systemContext}\n\nUser Question: ${message}\n\nProvide a detailed, data-driven response with actionable insights.`
    
    let response: string
    try {
      const result = await model.generateContent(prompt)
      response = result.response.text()
      console.log('✅ AI response generated successfully, length:', response.length)
    } catch (geminiError) {
      console.error('❌ Gemini API Error:', geminiError)
      throw new Error(
        geminiError instanceof Error 
          ? `Gemini API Error: ${geminiError.message}` 
          : 'Failed to generate AI response'
      )
    }

    // Determine data types referenced
    const dataTypes: string[] = []
    if (response.toLowerCase().includes('attendance')) dataTypes.push('attendance')
    if (response.toLowerCase().includes('grade') || response.toLowerCase().includes('performance')) dataTypes.push('grades')
    if (response.toLowerCase().includes('mood') || response.toLowerCase().includes('wellbeing')) dataTypes.push('wellbeing')
    if (response.toLowerCase().includes('teacher')) dataTypes.push('teachers')
    if (response.toLowerCase().includes('assessment')) dataTypes.push('assessments')
    if (response.toLowerCase().includes('student')) dataTypes.push('students')

    return NextResponse.json({
      response,
      metadata: {
        dataType: dataTypes,
        metrics: {
          totalStudents,
          totalTeachers,
          attendanceRate: attendanceStats.rate,
          assessmentAverage: assessmentStats.averageScore.toFixed(1)
        }
      }
    })

  } catch (error) {
    console.error('❌ AI Chat Error:', error)
    
    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const statusCode = errorMessage.includes('Unauthorized') ? 401 
      : errorMessage.includes('Admin access') ? 403 
      : errorMessage.includes('Gemini API') ? 502 
      : 500
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
}
