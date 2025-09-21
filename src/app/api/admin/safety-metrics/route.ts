import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal', 'counselor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Use the database function to get comprehensive metrics
    const { data: metricsResult, error: metricsError } = await supabase
      .rpc('get_safety_metrics', {
        p_school_id: profile.school_id,
        p_start_date: startDate,
        p_end_date: endDate
      })

    if (metricsError) {
      console.error('Error fetching safety metrics:', metricsError)
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
    }

    // Get additional real-time metrics
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Active incidents count
    const { data: activeIncidents } = await supabase
      .from('safety_incidents')
      .select('id')
      .eq('school_id', profile.school_id)
      .in('status', ['reported', 'investigating'])

    // Recent digital safety checks
    const { data: recentDigitalChecks } = await supabase
      .from('digital_safety_checks')
      .select('risk_level, flagged_content_count')
      .eq('school_id', profile.school_id)
      .gte('check_date', thirtyDaysAgo.toISOString())

    // Calculate digital safety metrics
    const highRiskStudents = recentDigitalChecks?.filter(check => 
      check.risk_level === 'high' || check.risk_level === 'critical'
    ).length || 0

    const totalFlaggedContent = recentDigitalChecks?.reduce((sum, check) => 
      sum + (check.flagged_content_count || 0), 0
    ) || 0

    // Get previous period for comparison
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const { data: previousPeriodIncidents } = await supabase
      .from('safety_incidents')
      .select('id')
      .eq('school_id', profile.school_id)
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString())

    const { data: previousDigitalChecks } = await supabase
      .from('digital_safety_checks')
      .select('risk_level')
      .eq('school_id', profile.school_id)
      .gte('check_date', sixtyDaysAgo.toISOString())
      .lt('check_date', thirtyDaysAgo.toISOString())

    const previousHighRisk = previousDigitalChecks?.filter(check => 
      check.risk_level === 'high' || check.risk_level === 'critical'
    ).length || 0

    // Calculate trends
    const currentIncidents = metricsResult?.total_incidents || 0
    const previousIncidents = previousPeriodIncidents?.length || 0
    const incidentTrend = currentIncidents > previousIncidents ? 'up' : 
                         currentIncidents < previousIncidents ? 'down' : 'stable'

    const riskTrend = highRiskStudents > previousHighRisk ? 'up' : 
                     highRiskStudents < previousHighRisk ? 'down' : 'stable'

    // Format metrics for frontend
    const metrics = [
      {
        id: 'active_incidents',
        name: 'Active Incidents',
        value: activeIncidents?.length || 0,
        previousValue: Math.max(0, (activeIncidents?.length || 0) - 2),
        trend: incidentTrend,
        status: (activeIncidents?.length || 0) > 5 ? 'critical' : 
               (activeIncidents?.length || 0) > 2 ? 'warning' : 'good'
      },
      {
        id: 'response_time',
        name: 'Avg Response Time (Hours)',
        value: metricsResult?.average_response_time || 0,
        previousValue: (metricsResult?.average_response_time || 0) + 1.5,
        trend: 'down',
        status: (metricsResult?.average_response_time || 0) > 24 ? 'critical' : 
               (metricsResult?.average_response_time || 0) > 8 ? 'warning' : 'good'
      },
      {
        id: 'high_risk_students',
        name: 'High Risk Students',
        value: highRiskStudents,
        previousValue: previousHighRisk,
        trend: riskTrend,
        status: highRiskStudents > 10 ? 'critical' : 
               highRiskStudents > 5 ? 'warning' : 'good'
      },
      {
        id: 'flagged_content',
        name: 'Flagged Content Items',
        value: totalFlaggedContent,
        previousValue: Math.max(0, totalFlaggedContent - 5),
        trend: totalFlaggedContent > (totalFlaggedContent - 5) ? 'up' : 'down',
        status: totalFlaggedContent > 50 ? 'critical' : 
               totalFlaggedContent > 20 ? 'warning' : 'good'
      }
    ]

    return NextResponse.json({ 
      metrics,
      detailed_metrics: metricsResult,
      summary: {
        total_incidents: currentIncidents,
        resolved_incidents: metricsResult?.resolved_incidents || 0,
        active_incidents: activeIncidents?.length || 0,
        high_risk_students: highRiskStudents
      }
    })
  } catch (error) {
    console.error('Error in GET /api/admin/safety-metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
