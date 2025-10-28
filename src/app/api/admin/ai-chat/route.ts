import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ============================================================================
// Intelligent AI Router Integration
// ============================================================================
// Uses intelligent-ai-router Edge Function to manage 100+ API keys
// with automatic fallback, rate limiting, and usage tracking
// ============================================================================

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now()
  
  try {
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

    const { message, context, stream } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    console.log('📝 Processing AI chat request for user:', user.id, 'School:', profile.school_id)
    console.log('🎯 Analysis context:', context)

    // ========================================================================
    // Context-Aware Data Fetching for Efficiency
    // ========================================================================
    const emptyResult = { data: [], error: null }
    
    const [
      schoolResult,
      studentCountResult,
      gradesResult,
      assessmentsResult,
      studentsDetailResult,
      attendanceResult,
      teachersResult,
      parentsResult,
      wellbeingResult,
      achievementsResult,
      announcementsResult
    ] = await Promise.all([
      // Always fetch
      supabase.from('schools').select('*').eq('id', profile.school_id).single(),
      supabase.from('profiles').select('id, first_name, last_name').eq('school_id', profile.school_id).eq('role', 'student'),
      
      // Performance context
      (context === 'performance' || context === 'general')
        ? supabase.from('assessment_grades').select('score, percentage, letter_grade, student_id, created_at').eq('school_id', profile.school_id).order('created_at', { ascending: false })
        : Promise.resolve(emptyResult),
      (context === 'performance' || context === 'general')
        ? supabase.from('assessments').select('id, title, type, max_score, created_at, due_date').eq('school_id', profile.school_id).order('created_at', { ascending: false })
        : Promise.resolve(emptyResult),
      (context === 'performance' || context === 'general')
        ? supabase.from('profiles').select('id, first_name, last_name, grade_level, class_name').eq('school_id', profile.school_id).eq('role', 'student')
        : Promise.resolve(emptyResult),
      
      // Operations context
      (context === 'operations' || context === 'general')
        ? supabase.from('attendance').select('date, status, student_id, created_at').eq('school_id', profile.school_id).gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()).order('date', { ascending: false })
        : Promise.resolve(emptyResult),
      (context === 'operations' || context === 'general')
        ? supabase.from('profiles').select('id, first_name, last_name, email').eq('school_id', profile.school_id).eq('role', 'teacher')
        : Promise.resolve(emptyResult),
      (context === 'operations' || context === 'general')
        ? supabase.from('profiles').select('id, first_name, last_name').eq('school_id', profile.school_id).eq('role', 'parent')
        : Promise.resolve(emptyResult),
      
      // Wellbeing context
      (context === 'wellbeing' || context === 'general')
        ? supabase.from('mood_tracking').select('mood, user_id, created_at').gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: false })
        : Promise.resolve(emptyResult),
      (context === 'wellbeing' || context === 'general')
        ? supabase.from('student_achievements').select('student_id, current_progress, completed_at, xp_earned, gems_earned').eq('is_completed', true).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve(emptyResult),
      
      // Always fetch recent announcements
      supabase.from('event_announcements').select('title, content, announcement_type, created_at').order('created_at', { ascending: false }).limit(10)
    ])
    
    // Use the count result for basic student info if not fetching details
    const studentsResult = (context === 'performance' || context === 'general') 
      ? studentsDetailResult 
      : studentCountResult

    // ========================================================================
    // Process Data & Debug Errors
    // ========================================================================
    
    // Log any query errors
    if (schoolResult?.error) console.error('❌ School query error:', schoolResult.error)
    if (studentsResult?.error) console.error('❌ Students query error:', studentsResult.error)
    if (teachersResult?.error) console.error('❌ Teachers query error:', teachersResult.error)
    if (parentsResult?.error) console.error('❌ Parents query error:', parentsResult.error)
    if (gradesResult?.error) console.error('❌ Grades query error:', gradesResult.error)
    if (attendanceResult?.error) console.error('❌ Attendance query error:', attendanceResult.error)
    if (wellbeingResult?.error) console.error('❌ Wellbeing query error:', wellbeingResult.error)
    if (assessmentsResult?.error) console.error('❌ Assessments query error:', assessmentsResult.error)
    if (announcementsResult?.error) console.error('❌ Announcements query error:', announcementsResult.error)
    if (achievementsResult?.error) console.error('❌ Achievements query error:', achievementsResult.error)
    
    const school = schoolResult?.data || null
    const students = studentsResult?.data || []
    const teachers = teachersResult?.data || []
    const parents = parentsResult?.data || []
    const grades = gradesResult?.data || []
    const attendance = attendanceResult?.data || []
    const wellbeing = wellbeingResult?.data || []
    const assessments = assessmentsResult?.data || []
    const announcements = announcementsResult?.data || []
    const achievements = achievementsResult?.data || []
    
    // Debug: Log data counts
    console.log('📊 Data fetched for context "' + context + '":', {
      school: school?.name || 'Not found',
      students: students.length,
      teachers: teachers.length,
      parents: parents.length,
      grades: grades.length,
      attendance: attendance.length,
      wellbeing: wellbeing.length,
      assessments: assessments.length,
      announcements: announcements.length,
      achievements: achievements.length
    })

    // ========================================================================
    // Calculate Comprehensive Metrics
    // ========================================================================
    
    // Basic counts
    const totalStudents = students.length
    const totalTeachers = teachers.length
    const totalParents = parents.length
    
    // Class/Section breakdown
    const classSections = new Map<string, Set<string>>()
    students.forEach((s: any) => {
      if (s.grade_level) {
        if (!classSections.has(s.grade_level)) {
          classSections.set(s.grade_level, new Set())
        }
        if (s.class_name) {
          classSections.get(s.grade_level)!.add(s.class_name)
        }
      }
    })
    
    const classBreakdown = Array.from(classSections.entries()).map(([grade, sections]) => ({
      grade,
      sections: Array.from(sections).sort(),
      studentCount: students.filter((s: any) => s.grade_level === grade).length
    })).sort((a, b) => {
      const gradeA = parseInt(a.grade) || 0
      const gradeB = parseInt(b.grade) || 0
      return gradeA - gradeB
    })
    
    // Gender distribution - not available in profiles schema
    const genderStats = {
      male: 0,
      female: 0,
      other: 0,
      unspecified: totalStudents
    }
    
    // Grade analytics (simplified - without subject breakdown for now)
    const allGradePercentages = grades
      .filter((g: any) => g.percentage !== null && g.percentage !== undefined)
      .map((g: any) => parseFloat(g.percentage))
    
    const gradesBySubject: Record<string, number[]> = {
      'All Subjects': allGradePercentages
    }
    
    const subjectAverages = Object.entries(gradesBySubject).map(([subject, grades]) => {
      const avg = grades.reduce((a, b) => a + b, 0) / grades.length
      const sorted = [...grades].sort((a, b) => a - b)
      return {
        subject,
        average: avg,
        highest: Math.max(...grades),
        lowest: Math.min(...grades),
        median: sorted[Math.floor(sorted.length / 2)],
        count: grades.length,
        passingRate: (grades.filter(g => g >= 50).length / grades.length * 100).toFixed(1)
      }
    }).sort((a, b) => b.average - a.average)

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

    // Wellbeing analytics with trends
    const moodCounts: Record<string, number> = {}
    const moodTrends: Record<string, { thisWeek: number; lastWeek: number }> = {}
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    
    wellbeing.forEach(w => {
      if (w.mood) {
        moodCounts[w.mood] = (moodCounts[w.mood] || 0) + 1
        
        if (!moodTrends[w.mood]) {
          moodTrends[w.mood] = { thisWeek: 0, lastWeek: 0 }
        }
        
        const moodDate = new Date(w.created_at)
        if (moodDate >= oneWeekAgo) {
          moodTrends[w.mood].thisWeek++
        } else if (moodDate >= twoWeeksAgo) {
          moodTrends[w.mood].lastWeek++
        }
      }
    })
    
    const wellbeingScore = wellbeing.length > 0
      ? ((moodCounts['happy'] || 0) * 1 + (moodCounts['neutral'] || 0) * 0.5 + (moodCounts['sad'] || 0) * 0) / wellbeing.length * 100
      : 0

    // Assessment analytics with upcoming
    const now = new Date()
    const upcomingAssessments = assessments.filter((a: any) => a.due_date && new Date(a.due_date) > now)
    const completedAssessments = grades.length // Use actual grades count
    
    const assessmentStats = {
      total: assessments.length,
      completed: completedAssessments,
      upcoming: upcomingAssessments.length,
      averageScore: allGradePercentages.length > 0 
        ? allGradePercentages.reduce((sum: number, p: number) => sum + p, 0) / allGradePercentages.length
        : 0,
      byType: assessments.reduce((acc: Record<string, number>, a: any) => {
        acc[a.type || 'unknown'] = (acc[a.type || 'unknown'] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    // Achievement analytics
    const achievementStats = {
      total: achievements.length,
      totalXP: achievements.reduce((sum: number, a: any) => sum + (a.xp_earned || 0), 0),
      totalGems: achievements.reduce((sum: number, a: any) => sum + (a.gems_earned || 0), 0),
      topEarners: Array.from(
        achievements.reduce((map: Map<string, number>, a: any) => {
          map.set(a.student_id, (map.get(a.student_id) || 0) + (a.xp_earned || 0))
          return map
        }, new Map<string, number>())
      ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5)
    }
    
    // Recent announcements summary
    const recentAnnouncements = announcements.slice(0, 5).map((a: any) => ({
      title: a.title,
      type: a.announcement_type || 'general',
      date: new Date(a.created_at).toLocaleDateString()
    }))

    // Build context for Gemini
    const systemContext = `You are a professional school data analyst assistant. Analyze the provided school data and respond to queries with clear, actionable insights.

**IMPORTANT GUIDELINES:**
- Be concise and direct - avoid unnecessary verbosity
- If specific data is unavailable, briefly acknowledge it and focus on available insights
- Don't create elaborate tables or sections for missing data
- Prioritize actionable recommendations over data descriptions
- Keep responses focused and practical

**SCHOOL INFORMATION:**
School Name: ${school?.name || 'N/A'}
School ID: ${profile.school_id}
Timezone: ${school?.timezone || 'N/A'}

**POPULATION OVERVIEW:**
- Total Students: ${totalStudents}
- Total Teachers: ${totalTeachers}
- Total Parents: ${totalParents}
- Staff-to-Student Ratio: 1:${totalTeachers > 0 ? Math.round(totalStudents / totalTeachers) : 'N/A'}

**CLASS STRUCTURE:**
${classBreakdown.length > 0 ? classBreakdown.map(c => `- Grade ${c.grade}: ${c.studentCount} students across ${c.sections.length} section(s) (${c.sections.join(', ')})`).join('\n') : '- Class/grade information not available in current schema'}

**STUDENT DEMOGRAPHICS:**
- Male: ${genderStats.male} (${totalStudents > 0 ? ((genderStats.male/totalStudents)*100).toFixed(1) : 0}%)
- Female: ${genderStats.female} (${totalStudents > 0 ? ((genderStats.female/totalStudents)*100).toFixed(1) : 0}%)
- Other/Unspecified: ${genderStats.other + genderStats.unspecified}

**ATTENDANCE METRICS (Last 90 days):**
- Overall Rate: ${attendanceStats.rate}%
- Total Records: ${attendanceStats.total}
- Present: ${attendanceStats.present} | Absent: ${attendanceStats.absent} | Late: ${attendanceStats.late}

**ACADEMIC PERFORMANCE (All Subjects):**
${subjectAverages.slice(0, 15).map(s => `- ${s.subject}: Avg ${s.average.toFixed(1)}% | High ${s.highest}% | Low ${s.lowest}% | Pass Rate ${s.passingRate}% | (${s.count} grades)`).join('\n')}

**GRADE DISTRIBUTION:**
- Total Grades Recorded: ${grades.length}
- Average Across All Subjects: ${subjectAverages.length > 0 ? (subjectAverages.reduce((sum, s) => sum + s.average, 0) / subjectAverages.length).toFixed(1) : 0}%

**WELLBEING & MOOD TRACKING:**
- Total Check-ins: ${wellbeing.length}
- Overall Wellbeing Score: ${wellbeingScore.toFixed(1)}%
- Mood Distribution:
${Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => `  - ${mood}: ${count} (${wellbeing.length > 0 ? ((count/wellbeing.length)*100).toFixed(1) : 0}%)`).join('\n')}
- Recent Trends:
${Object.entries(moodTrends).filter(([_, t]) => t.thisWeek > 0 || t.lastWeek > 0).map(([mood, trend]) => {
  const change = trend.lastWeek > 0 ? ((trend.thisWeek - trend.lastWeek) / trend.lastWeek * 100).toFixed(0) : 'N/A'
  return `  - ${mood}: This week ${trend.thisWeek} | Last week ${trend.lastWeek} | Change: ${change}%`
}).join('\n') || '  - Not enough data for trends'}

**ASSESSMENT STATUS:**
- Total Assessments: ${assessmentStats.total}
- Completed: ${assessmentStats.completed}
- Upcoming: ${assessmentStats.upcoming}
- Overall Average Score: ${assessmentStats.averageScore.toFixed(1)}%
- By Type: ${Object.entries(assessmentStats.byType).map(([type, count]) => `${type} (${count})`).join(', ')}

**ACHIEVEMENTS & ENGAGEMENT (Last 30 days):**
- Total Achievements Earned: ${achievementStats.total}
- Total XP Earned: ${achievementStats.totalXP}
- Total Gems Earned: ${achievementStats.totalGems}
- Top Performers: ${achievementStats.topEarners.length} students tracked

**RECENT ANNOUNCEMENTS:**
${recentAnnouncements.map((a: any) => `- [${a.type}] ${a.title} (${a.date})`).join('\n') || '- No recent announcements'}

**DATA FRESHNESS:**
- Grades: ${grades.length} total records
- Attendance: ${attendance.length} records (last 90 days)
- Wellbeing: ${wellbeing.length} check-ins (last 6 months)
- Achievements: ${achievements.length} recent entries

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

    const prompt = `${systemContext}\n\nUser Question: ${message}\n\nProvide a detailed, data-driven response with actionable insights.`
    
    // ========================================================================
    // Get API Key from Intelligent Router
    // ========================================================================
    console.log('🔑 Requesting API key from intelligent router...')
    
    // Estimate tokens (rough: 4 chars per token)
    const estimatedTokens = Math.ceil((prompt.length + 2048) / 4)
    
    const routerResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/intelligent-ai-router`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          tokens: estimatedTokens,
          prompt: message.substring(0, 100),
          userId: user.id,
          endpoint: '/api/admin/ai-chat'
        })
      }
    )

    if (!routerResponse.ok) {
      const errorData = await routerResponse.json()
      console.error('❌ Router error:', errorData)
      
      if (routerResponse.status === 429) {
        return NextResponse.json(
          { 
            error: 'All API keys are currently rate-limited. Please try again in a moment.',
            retryAfter: errorData.retryAfter || 60
          },
          { status: 429 }
        )
      }
      
      throw new Error(`Router error: ${errorData.error || 'Unknown error'}`)
    }

    const routerData = await routerResponse.json()
    const { 
      api_key, 
      model_used, 
      fallback_count, 
      key_id, 
      usage 
    } = routerData

    console.log('✅ API key obtained:', {
      model_requested: 'gemini-2.5-flash',
      model_used,
      fallback_count,
      key_id: key_id?.substring(0, 8) + '...',
      rpm_usage: `${usage.current_rpm}/${usage.rpm_limit}`,
      rpd_usage: `${usage.current_rpd}/${usage.rpd_limit}`
    })

    // ========================================================================
    // Generate AI Response with Obtained Key
    // ========================================================================
    console.log('🤖 Initializing Gemini with managed API key...')
    
    const genAI = new GoogleGenerativeAI(api_key)
    const model = genAI.getGenerativeModel({ 
      model: model_used,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    })

    console.log('📝 Generating AI response...')
    
    // ========================================================================
    // Streaming Response Support
    // ========================================================================
    if (stream) {
      try {
        const result = await model.generateContentStream(prompt)
        
        // Create a readable stream
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                const text = chunk.text()
                const data = JSON.stringify({ content: text })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              
              console.log('✅ Streaming response completed')
            } catch (error) {
              console.error('❌ Streaming error:', error)
              controller.error(error)
            }
          }
        })
        
        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        })
      } catch (geminiError) {
        console.error('❌ Gemini Streaming Error:', geminiError)
        return NextResponse.json(
          { error: 'Failed to generate streaming response: ' + (geminiError instanceof Error ? geminiError.message : 'Unknown error') },
          { status: 500 }
        )
      }
    }
    
    // ========================================================================
    // Non-Streaming Response (Original)
    // ========================================================================
    let response: string
    let actualTokensUsed = 0
    
    try {
      const result = await model.generateContent(prompt)
      response = result.response.text()
      
      // Estimate actual tokens used
      actualTokensUsed = Math.ceil((prompt.length + response.length) / 4)
      
      console.log('✅ AI response generated:', {
        length: response.length,
        estimated_tokens: actualTokensUsed,
        duration_ms: Date.now() - requestStartTime
      })
    } catch (geminiError) {
      console.error('❌ Gemini API Error:', geminiError)
      
      // Log the failed attempt
      await supabase.from('api_usage_logs').insert({
        model_requested: 'gemini-2.5-flash',
        model_used,
        key_id,
        table_name: 'gemini_25_flash_keys',
        tokens_used: 0,
        status: 'error',
        error_message: geminiError instanceof Error ? geminiError.message : 'Unknown error',
        user_id: user.id,
        endpoint: '/api/admin/ai-chat',
        request_duration_ms: Date.now() - requestStartTime
      })
      
      throw new Error(
        geminiError instanceof Error 
          ? `Gemini API Error: ${geminiError.message}` 
          : 'Failed to generate AI response'
      )
    }

    // ========================================================================
    // Update Usage Logs with Actual Token Count
    // ========================================================================
    await supabase.from('api_usage_logs')
      .update({ 
        tokens_used: actualTokensUsed,
        request_duration_ms: Date.now() - requestStartTime
      })
      .eq('key_id', key_id)
      .order('created_at', { ascending: false })
      .limit(1)

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
        },
        aiRouting: {
          model_requested: 'gemini-2.5-flash',
          model_used,
          fallback_count,
          tokens_used: actualTokensUsed,
          key_usage: {
            rpm: `${usage.current_rpm}/${usage.rpm_limit}`,
            rpd: `${usage.current_rpd}/${usage.rpd_limit}`
          },
          request_duration_ms: Date.now() - requestStartTime
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
