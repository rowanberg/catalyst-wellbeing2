import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Fetch wellbeing severity analytics for admin's school
export async function GET(request: Request) {
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get admin profile and verify role
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view wellbeing severity data' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period_type = searchParams.get('period_type') || 'weekly'
    const risk_level = searchParams.get('risk_level') || 'all'
    const sort_by = searchParams.get('sort_by') || 'risk_score'
    const sort_order = searchParams.get('sort_order') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build the query - get all records for the school and period, then filter client-side for latest per student
    const { data: allAnalytics, error: analyticsError } = await supabase
      .from('student_wellbeing_analytics_enhanced')
      .select(`
        id,
        student_id,
        analysis_date,
        period_type,
        overall_wellbeing_score,
        emotional_wellbeing_score,
        academic_wellbeing_score,
        engagement_wellbeing_score,
        social_wellbeing_score,
        behavioral_wellbeing_score,
        risk_level,
        risk_score,
        risk_trend,
        risk_factors,
        protective_factors,
        risk_factor_count,
        protective_factor_count,
        intervention_recommended,
        intervention_type,
        intervention_priority,
        recommended_actions,
        early_warning_flags,
        warning_flag_count,
        predicted_next_score,
        predicted_risk_level,
        confidence_level,
        overall_score_trend,
        score_change_from_previous,
        school_percentile,
        grade_percentile,
        mood_score_avg,
        gpa,
        attendance_rate,
        quest_completion_rate,
        xp_earned,
        incident_count,
        help_requests_count,
        urgent_help_requests_count,
        data_quality_score,
        data_completeness_percentage,
        created_at,
        updated_at
      `)
      .eq('school_id', profile.school_id)
      .eq('period_type', period_type)
      .order('analysis_date', { ascending: false })

    if (analyticsError) {
      console.error('Analytics query error:', analyticsError)
      return NextResponse.json(
        { error: 'Failed to fetch wellbeing severity data' },
        { status: 500 }
      )
    }

    console.log('Raw analytics data count:', allAnalytics?.length || 0)
    if (allAnalytics && allAnalytics.length > 0) {
      console.log('Sample analytics record:', {
        student_id: allAnalytics[0].student_id,
        analysis_date: allAnalytics[0].analysis_date,
        period_type: allAnalytics[0].period_type,
        risk_level: allAnalytics[0].risk_level
      })
    }

    // Filter to get only the latest record for each student
    const latestAnalytics = new Map()
    allAnalytics?.forEach(record => {
      const existing = latestAnalytics.get(record.student_id)
      if (!existing || record.analysis_date > existing.analysis_date) {
        latestAnalytics.set(record.student_id, record)
      }
    })

    let analytics = Array.from(latestAnalytics.values())
    console.log('After latest filtering:', analytics.length)

    // Apply additional filters
    if (risk_level !== 'all') {
      analytics = analytics.filter(a => a.risk_level === risk_level)
    }

    // Apply sorting client-side
    analytics.sort((a, b) => {
      let aValue = a[sort_by as keyof typeof a]
      let bValue = b[sort_by as keyof typeof b]

      // Handle string sorting (like student names)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sort_order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sort_order === 'asc' ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    // Apply limit client-side
    analytics = analytics.slice(0, limit)

    // Get student information with proper grade levels
    const studentIds = analytics?.map(a => a.student_id) || []
    let studentProfiles: Record<string, any> = {}

    if (studentIds.length > 0) {
      // Get basic student profiles - check BOTH user_id AND id fields
      // because student_id in analytics could map to either
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, avatar_url, role')
        .eq('school_id', profile.school_id)
        .eq('role', 'student')
        .or(`user_id.in.(${studentIds.join(',')}),id.in.(${studentIds.join(',')})`)

      // Get class assignments with grade information - also check both fields
      const { data: classAssignments } = await supabase
        .from('student_class_assignments')
        .select(`
          student_id,
          is_primary,
          classes (
            class_name,
            grade_level
          )
        `)
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .or(`student_id.in.(${studentIds.join(',')})`)

      console.log('Found profiles:', profiles?.length || 0)
      console.log('Found class assignments:', classAssignments?.length || 0)

      if (profiles && profiles.length > 0) {
        // Create a mapping of student_id to class info
        const classMap: Record<string, any> = {}
        classAssignments?.forEach(assignment => {
          if (!classMap[assignment.student_id] || assignment.is_primary) {
            classMap[assignment.student_id] = assignment.classes
          }
        })

        // Enrich profiles with class information
        profiles.forEach(student => {
          const classInfo = classMap[student.user_id] || classMap[student.id]

          const enrichedProfile = {
            ...student,
            class_name: classInfo?.class_name,
            grade_level: classInfo?.grade_level,
          }

          if (student.user_id) studentProfiles[student.user_id] = enrichedProfile
          if (student.id) studentProfiles[student.id] = enrichedProfile
        })

        console.log('Profile keys created:', Object.keys(studentProfiles).slice(0, 5))
        console.log('Sample enriched profile:', Object.values(studentProfiles)[0])

        // Check matching profiles
        const matchingProfiles = studentIds.filter(id => studentProfiles[id])
        console.log('Matching profiles found:', matchingProfiles.length)
      } else {
        console.log('No student profiles found for student IDs:', studentIds.slice(0, 3))
      }
    }

    // Transform analytics with student information
    const transformedAnalytics = analytics?.map(analytic => {
      const studentProfile = studentProfiles[analytic.student_id]

      let studentName = 'Unknown Student'
      if (studentProfile) {
        if (studentProfile.first_name && studentProfile.last_name) {
          studentName = `${studentProfile.first_name} ${studentProfile.last_name}`
        } else if (studentProfile.first_name) {
          studentName = studentProfile.first_name
        } else if (studentProfile.last_name) {
          studentName = studentProfile.last_name
        }
      }

      return {
        ...analytic,
        student_name: studentName,
        student_grade: studentProfile?.grade_level ? `Grade ${studentProfile.grade_level}` : 'N/A',
        student_class: studentProfile?.class_name || 'N/A',
        student_avatar: studentProfile?.avatar_url,
        risk_factors_count: Array.isArray(analytic.risk_factors) ? analytic.risk_factors.length : 0,
        protective_factors_count: Array.isArray(analytic.protective_factors) ? analytic.protective_factors.length : 0
      }
    }) || []

    // Calculate summary statistics
    const summary = {
      total: transformedAnalytics.length,
      by_risk_level: transformedAnalytics.reduce((acc: Record<string, number>, curr) => {
        acc[curr.risk_level] = (acc[curr.risk_level] || 0) + 1
        return acc
      }, {}),
      by_intervention_priority: transformedAnalytics
        .filter(a => a.intervention_recommended)
        .reduce((acc: Record<string, number>, curr) => {
          if (curr.intervention_priority) {
            acc[curr.intervention_priority] = (acc[curr.intervention_priority] || 0) + 1
          }
          return acc
        }, {}),
      average_scores: {
        overall: transformedAnalytics.reduce((sum, curr) => sum + (curr.overall_wellbeing_score || 0), 0) / transformedAnalytics.length,
        emotional: transformedAnalytics.reduce((sum, curr) => sum + (curr.emotional_wellbeing_score || 0), 0) / transformedAnalytics.length,
        academic: transformedAnalytics.reduce((sum, curr) => sum + (curr.academic_wellbeing_score || 0), 0) / transformedAnalytics.length,
        engagement: transformedAnalytics.reduce((sum, curr) => sum + (curr.engagement_wellbeing_score || 0), 0) / transformedAnalytics.length,
        social: transformedAnalytics.reduce((sum, curr) => sum + (curr.social_wellbeing_score || 0), 0) / transformedAnalytics.length,
        behavioral: transformedAnalytics.reduce((sum, curr) => sum + (curr.behavioral_wellbeing_score || 0), 0) / transformedAnalytics.length
      },
      interventions_needed: transformedAnalytics.filter(a => a.intervention_recommended).length,
      high_risk_count: transformedAnalytics.filter(a => ['high', 'critical'].includes(a.risk_level)).length,
      improving_trend: transformedAnalytics.filter(a => a.overall_score_trend === 'improving').length,
      declining_trend: transformedAnalytics.filter(a => a.overall_score_trend === 'declining').length
    }

    const response = NextResponse.json({
      success: true,
      analytics: transformedAnalytics,
      summary,
      debug: {
        raw_analytics_count: allAnalytics?.length || 0,
        after_filtering: analytics.length,
        student_ids_sample: studentIds.slice(0, 3),
        profiles_found: Object.keys(studentProfiles).length,
        matching_profiles: studentIds.filter(id => studentProfiles[id]).length,
        sample_profile: Object.keys(studentProfiles).length > 0 ? Object.values(studentProfiles)[0] : null
      },
      metadata: {
        period_type,
        risk_level_filter: risk_level,
        sort_by,
        sort_order,
        limit,
        last_updated: analytics?.[0]?.updated_at
      }
    })

    // Add caching headers
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')

    return response

  } catch (error) {
    console.error('Wellbeing severity API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
