import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

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

    // Generate intelligent insights from analytics data
    console.log('💡 Generating data-driven insights from analytics...')
    const insights = generateIntelligentInsights(analytics)
    
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

// Generate personalized, data-driven insights
function generateIntelligentInsights(analytics: any) {
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
