import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get current user and verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Get analytics data from request body
    const { analytics } = await request.json()

    if (!analytics) {
      return NextResponse.json({ error: 'Analytics data required' }, { status: 400 })
    }

    // Get school name for context
    const { data: schoolData } = await supabase
      .from('schools')
      .select('name')
      .eq('id', adminProfile.school_id)
      .single()

    const schoolName = schoolData?.name || 'your school'

    // Generate AI-powered insights using Gemini
    console.log('🤖 Generating AI-powered insights with Gemini...')
    const insights = await generateAIInsights(analytics, schoolName)
    
    return NextResponse.json({ 
      success: true, 
      insights,
      generatedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Wellbeing insights error:', error)
    
    return NextResponse.json({ 
      success: true,
      insights: {
        summary: 'Unable to generate insights at this time.',
        keyStrengths: ['Data collection is active'],
        areasOfConcern: ['Analysis temporarily unavailable'],
        recommendations: ['Please try refreshing the page'],
        positiveHighlight: 'System is operational and collecting data'
      },
      generatedAt: new Date().toISOString()
    })
  }
}

// Generate AI-powered insights using Gemini
async function generateAIInsights(analytics: any, schoolName: string) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not configured')
    return generateFallbackInsights(analytics)
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    // Prepare analytics summary for AI
    const analyticsSummary = {
      schoolName,
      totalStudents: analytics?.totalStudents || 0,
      wellbeingScore: analytics?.averageWellbeingScore || 0,
      engagement: analytics?.engagementRate || 0,
      distribution: analytics?.wellbeingDistribution || {},
      trends: analytics?.trends || {},
      highRiskCount: analytics?.studentInsights?.filter((s: any) => s.riskLevel === 'high').length || 0,
      mediumRiskCount: analytics?.studentInsights?.filter((s: any) => s.riskLevel === 'medium').length || 0,
      classes: analytics?.classAnalytics?.length || 0,
      topActivity: analytics?.activityBreakdown?.[0]?.subject || 'N/A',
      timeRange: analytics?.timeRange || '7 days'
    }

    const prompt = `You are an expert school wellbeing analyst providing insights for ${schoolName}'s administrative team.

## Analytics Data Summary:
- Total Students: ${analyticsSummary.totalStudents}
- Average Wellbeing Score: ${analyticsSummary.wellbeingScore}/10
- Engagement Rate: ${analyticsSummary.engagement}%
- Distribution: ${analyticsSummary.distribution.thriving || 0}% thriving, ${analyticsSummary.distribution.moderate || 0}% moderate, ${analyticsSummary.distribution.atRisk || 0}% at-risk
- Trends: Wellbeing ${analyticsSummary.trends.wellbeingChange || 0}%, Engagement ${analyticsSummary.trends.engagementChange || 0}%
- Risk Levels: ${analyticsSummary.highRiskCount} high-risk, ${analyticsSummary.mediumRiskCount} medium-risk
- Classes: ${analyticsSummary.classes}
- Time Range: ${analyticsSummary.timeRange}

## Your Task:
Analyze this wellbeing data and provide actionable insights for school administrators.

## Response Format (JSON):
Provide EXACTLY in this JSON structure:
{
  "summary": "2-3 sentence executive summary with key numbers and trends",
  "keyStrengths": ["3 specific data-backed strengths with numbers"],
  "areasOfConcern": ["3 specific concerns with numbers and urgency levels"],
  "recommendations": ["3 concrete, actionable steps with timelines"],
  "positiveHighlight": "1 sentence celebrating a positive metric or achievement"
}

## Guidelines:
- Be specific with numbers from the data
- Use professional, supportive tone
- Focus on actionable insights
- Prioritize student safety and wellbeing
- Keep under 500 words total
- If high-risk students exist, mark as URGENT
- Include realistic timelines (24-48 hours, 1 week, etc.)
- Celebrate wins while addressing concerns

Provide ONLY the JSON response, no other text.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse JSON response
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0])
        console.log('✅ AI insights generated successfully')
        return insights
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError)
    }

    // If parsing fails, fall back
    return generateFallbackInsights(analytics)

  } catch (error) {
    console.error('❌ Gemini API error:', error)
    return generateFallbackInsights(analytics)
  }
}

// Fallback insights using rule-based analysis
function generateFallbackInsights(analytics: any) {
  const totalStudents = analytics?.totalStudents || 0
  const wellbeingScore = analytics?.averageWellbeingScore || 0
  const engagement = analytics?.engagementRate || 0
  const thriving = analytics?.wellbeingDistribution?.thriving || 0
  const moderate = analytics?.wellbeingDistribution?.moderate || 0
  const atRisk = analytics?.wellbeingDistribution?.atRisk || 0
  const trends = analytics?.trends || {}
  const activities = analytics?.activityBreakdown || []
  const classes = analytics?.classAnalytics || []
  const students = analytics?.studentInsights || []
  
  // Analyze risk levels
  const highRisk = students.filter((s: any) => s.riskLevel === 'high').length
  const mediumRisk = students.filter((s: any) => s.riskLevel === 'medium').length
  
  // Analyze activity participation
  const activityRates = activities.reduce((acc: any, a: any) => {
    acc[a.subject.toLowerCase()] = a.A
    return acc
  }, {})
  
  // Find best and worst performing activities
  const sortedActivities = activities.sort((a: any, b: any) => b.A - a.A)
  const bestActivity = sortedActivities[0]
  const worstActivity = sortedActivities[sortedActivities.length - 1]
  
  // Analyze class performance
  const highRiskClasses = classes.filter((c: any) => c.riskLevel === 'high')
  const bestClass = classes.sort((a: any, b: any) => b.wellbeingScore - a.wellbeingScore)[0]
  const worstClass = classes.sort((a: any, b: any) => a.wellbeingScore - b.wellbeingScore)[0]
  
  // Build personalized summary
  const trendIndicator = trends.wellbeingChange > 0 ? 'improving' : trends.wellbeingChange < -5 ? 'declining significantly' : 'stable'
  const summary = `Your school has ${totalStudents} students with an average wellbeing score of ${wellbeingScore.toFixed(1)}/10 (${trendIndicator} ${trends.wellbeingChange ? Math.abs(trends.wellbeingChange).toFixed(1) + '%' : ''}). Critical concern: ${thriving}% thriving, ${atRisk}% at-risk, with ${highRisk} students requiring immediate intervention and ${mediumRisk} needing monitoring. Engagement at ${engagement}% has ${trends.engagementChange < 0 ? 'dropped ' + Math.abs(trends.engagementChange).toFixed(0) + '%' : 'changed ' + trends.engagementChange + '%'}.`

  // Build data-driven strengths
  const keyStrengths: string[] = []
  
  if (bestActivity && bestActivity.A > 20) {
    keyStrengths.push(`${bestActivity.subject} activities showing ${bestActivity.A}% completion - strongest program area`)
  }
  
  if (bestClass && bestClass.wellbeingScore > 6) {
    keyStrengths.push(`${bestClass.className} (Grade ${bestClass.grade}) maintaining ${bestClass.wellbeingScore.toFixed(1)}/10 wellbeing with ${bestClass.totalStudents} students`)
  }
  
  const activeStudents = analytics.metrics?.find((m: any) => m.name === 'Active Students')?.value || 0
  if (activeStudents > 0) {
    keyStrengths.push(`${activeStudents} students actively participating in wellbeing activities over ${analytics.timeRange || 7} days`)
  }
  
  if (keyStrengths.length === 0) {
    keyStrengths.push('Wellbeing tracking system operational', 'Data collection active across all classes', 'Foundation established for improvement')
  }

  // Build specific concerns with data
  const areasOfConcern: string[] = []
  
  if (thriving === 0) {
    areasOfConcern.push(`CRITICAL: Zero students in thriving category (8-10/10) - immediate whole-school intervention needed`)
  }
  
  if (highRisk > 0) {
    areasOfConcern.push(`${highRisk} high-risk students identified requiring urgent support and individual intervention plans`)
  }
  
  if (engagement < 40) {
    areasOfConcern.push(`Engagement critically low at ${engagement}% (down ${Math.abs(trends.engagementChange || 0).toFixed(0)}%) - only ${activeStudents}/${totalStudents} students active`)
  } else if (engagement < 60) {
    areasOfConcern.push(`Below-target engagement at ${engagement}% - ${totalStudents - activeStudents} students disengaged from wellbeing programs`)
  }
  
  if (worstActivity && worstActivity.A < 10) {
    areasOfConcern.push(`${worstActivity.subject} severely underutilized (${worstActivity.A}% completion) - program redesign needed`)
  }
  
  if (highRiskClasses.length > 0) {
    const classNames = highRiskClasses.slice(0, 2).map((c: any) => c.className).join(', ')
    areasOfConcern.push(`${highRiskClasses.length} classes at high risk (${classNames}${highRiskClasses.length > 2 ? ', +' + (highRiskClasses.length - 2) + ' more' : ''}) need targeted support`)
  }
  
  if (trends.wellbeingChange < -10) {
    areasOfConcern.push(`Wellbeing declining ${Math.abs(trends.wellbeingChange).toFixed(1)}% - urgent review of school climate and support systems required`)
  }

  // Build personalized, actionable recommendations
  const recommendations: string[] = []
  
  if (highRisk > 0) {
    recommendations.push(`IMMEDIATE: Schedule 1-on-1 meetings with ${highRisk} high-risk students within 48 hours for crisis assessment and support planning`)
  }
  
  if (thriving === 0 && engagement < 40) {
    recommendations.push(`Launch engagement initiative: increase activity variety, gamification, peer recognition to boost participation from ${engagement}% to 60%+`)
  }
  
  if (worstActivity && worstActivity.A < 10) {
    recommendations.push(`Redesign ${worstActivity.subject} program: survey students for barriers, add interactive elements, consider replacing with higher-impact activities`)
  }
  
  if (highRiskClasses.length > 0) {
    recommendations.push(`Deploy teacher support team to ${highRiskClasses[0].className}: conduct classroom climate assessment, implement daily check-ins, increase counselor presence`)
  }
  
  if (mediumRisk > 5) {
    recommendations.push(`Establish monitoring system for ${mediumRisk} medium-risk students: weekly wellbeing check-ins, early warning alerts, preventive support resources`)
  }
  
  if (bestActivity && bestActivity.A > 25 && worstActivity && worstActivity.A < 10) {
    recommendations.push(`Replicate success: apply ${bestActivity.subject}'s implementation strategies (${bestActivity.A}% completion) to boost ${worstActivity.subject} participation`)
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Maintain current wellbeing programs', 'Continue monitoring student engagement patterns', 'Review and adjust support systems monthly')
  }

  // Generate positive highlight
  let positiveHighlight = ''
  
  if (bestActivity && bestActivity.A > 30) {
    positiveHighlight = `${bestActivity.subject} program achieving ${bestActivity.A}% student completion - this strong participation demonstrates effective program design and student buy-in!`
  } else if (activeStudents > totalStudents * 0.25) {
    positiveHighlight = `${activeStudents} students (${Math.round((activeStudents/totalStudents)*100)}%) actively engaged in wellbeing activities, showing commitment to personal growth and self-awareness.`
  } else if (mediumRisk === 0 && highRisk === 0) {
    positiveHighlight = `No students currently at high risk - preventive programs are maintaining baseline wellbeing across the school community.`
  } else {
    positiveHighlight = `Wellbeing data collection active across ${classes.length} classes with ${totalStudents} students - strong foundation for data-driven support and improvement.`
  }

  return {
    summary,
    keyStrengths: keyStrengths.slice(0, 3),
    areasOfConcern: areasOfConcern.slice(0, 3),
    recommendations: recommendations.slice(0, 3),
    positiveHighlight
  }
}

