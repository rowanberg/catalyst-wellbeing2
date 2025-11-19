/**
 * Parent Wellbeing API - Access child's wellbeing data
 * GET /api/v1/parents/wellbeing?student_id={student_id}
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedStudentWellbeing, setCachedStudentWellbeing } from '@/lib/redis/parent-cache'

export async function GET(request: NextRequest) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  console.log(`[${requestId}] Parent wellbeing API called`)
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const student_id = searchParams.get('student_id')
    
    if (!student_id) {
      return NextResponse.json({ error: 'student_id parameter is required' }, { status: 400 })
    }
    
    // Use user-context client
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // Get parent's profile
    const { data: parentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('user_id', user.id)
      .single()
    
    if (profileError || !parentProfile) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 401 })
    }
    
    // Verify user is a parent
    if (parentProfile.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can access this endpoint' }, { status: 403 })
    }
    
    // Get student's user_id from their profile_id
    const { data: studentUserData, error: studentProfileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, school_id')
      .eq('id', student_id)
      .single()
    
    if (studentProfileError || !studentUserData) {
      console.warn(`[${requestId}] Student profile not found: ${student_id}`)
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // CRITICAL: Verify parent-child relationship exists
    const { data: relationship, error: relationshipError } = await supabase
      .from('parent_child_relationships')
      .select('id')
      .eq('parent_id', user.id)  // parent's user_id
      .eq('child_id', studentUserData.user_id)  // child's user_id
      .single()
    
    if (relationshipError || !relationship) {
      console.warn(`[${requestId}] Unauthorized access attempt by user ${user.id} to student ${student_id}`)
      return NextResponse.json({ error: 'You do not have permission to view this student\'s wellbeing data' }, { status: 403 })
    }

    // Verify both parent and student are in the same school
    if (parentProfile.school_id !== studentUserData.school_id) {
      return NextResponse.json({ error: 'Student not found in your school' }, { status: 403 })
    }

    // Check cache first using student profile_id (to align with dashboard caching keys)
    const cachedData = await getCachedStudentWellbeing(student_id)
    if (cachedData) {
      console.log(`[${requestId}] CACHE HIT - Returning cached wellbeing for student: ${student_id}`)
      return NextResponse.json({
        success: true,
        data: cachedData
      })
    }

    console.log(`[${requestId}] CACHE MISS - Fetching wellbeing data for:`, {
      school_id: parentProfile.school_id,
      student_user_id: studentUserData.user_id,
      student_profile_id: student_id
    })

    // Try both user_id and profile_id to see which one works
    const { data: wellbeingAnalytics, error: analyticsError } = await supabase
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
      .eq('school_id', parentProfile.school_id)
      .in('student_id', [studentUserData.user_id, student_id])  // Try both IDs
      .eq('period_type', 'weekly')
      .order('analysis_date', { ascending: false })
      .limit(1)

    console.log(`[${requestId}] Wellbeing query result:`, {
      data: wellbeingAnalytics,
      error: analyticsError,
      count: wellbeingAnalytics?.length || 0
    })

    if (analyticsError) {
      console.error(`[${requestId}] Error fetching wellbeing analytics:`, analyticsError)
      return NextResponse.json({ error: 'Failed to fetch wellbeing data' }, { status: 500 })
    }

    // If no analytics data found, it might be an RLS issue - try with admin client to verify
    if (!wellbeingAnalytics || wellbeingAnalytics.length === 0) {
      console.log(`[${requestId}] No data found with user client, checking with admin client for RLS issues...`)
      
      // Import admin client to check if data exists
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
      
      // Check if data exists with admin privileges
      const { data: adminCheck, error: adminError } = await supabaseAdmin
        .from('student_wellbeing_analytics_enhanced')
        .select('id, student_id, overall_wellbeing_score')
        .eq('school_id', parentProfile.school_id)
        .in('student_id', [studentUserData.user_id, student_id])
        .eq('period_type', 'weekly')
        .limit(1)
      
      console.log(`[${requestId}] Admin check result:`, {
        foundWithAdmin: adminCheck?.length || 0,
        adminError,
        verdict: adminCheck && adminCheck.length > 0 ? 'RLS IS BLOCKING ACCESS!' : 'No data exists in table'
      })
      
      // If admin found data but user client didn't, it's definitely an RLS issue
      if (adminCheck && adminCheck.length > 0) {
        console.error(`[${requestId}] RLS POLICY MISSING: Wellbeing data exists but parent cannot access it`)
        console.error(`[${requestId}] Please run the following SQL in Supabase SQL Editor:`)
        console.error(`
          DROP POLICY IF EXISTS "Parents view children wellbeing analytics" ON student_wellbeing_analytics_enhanced;
          
          CREATE POLICY "Parents view children wellbeing analytics" 
            ON student_wellbeing_analytics_enhanced
            FOR SELECT 
            USING (
              student_id IN (
                SELECT pcr.child_id 
                FROM parent_child_relationships pcr
                WHERE pcr.parent_id = auth.uid()
              )
            );
        `)
        
        return NextResponse.json({ 
          error: 'Database access policy missing. Please contact your administrator to enable parent access to wellbeing data.' 
        }, { status: 403 })
      }
    }

    // If still no analytics data found, return empty response
    if (!wellbeingAnalytics || wellbeingAnalytics.length === 0) {
      const emptyData = {
        analytics: [],
        summary: {
          total: 0,
          message: 'No wellbeing data available yet'
        }
      }

      await setCachedStudentWellbeing(student_id, emptyData)

      return NextResponse.json({
        success: true,
        data: emptyData
      })
    }

    // Get student class information for display
    const { data: classAssignment } = await supabase
      .from('student_class_assignments')
      .select(`
        classes (
          class_name,
          grade_level
        )
      `)
      .eq('student_id', studentUserData.user_id)
      .eq('is_active', true)
      .limit(1)

    // Enrich the analytics data with student information
    const classInfo = classAssignment?.[0]?.classes as any
    const enrichedAnalytics = wellbeingAnalytics.map(analytic => ({
      ...analytic,
      student_name: `${studentUserData.first_name} ${studentUserData.last_name}`,
      student_grade: classInfo?.grade_level 
        ? `Grade ${classInfo.grade_level}` 
        : 'N/A',
      student_class: classInfo?.class_name || 'N/A'
    }))

    // Create summary data
    const summary = {
      total: enrichedAnalytics.length,
      risk_level: enrichedAnalytics[0]?.risk_level || 'unknown',
      overall_score: enrichedAnalytics[0]?.overall_wellbeing_score || 0,
      trend: enrichedAnalytics[0]?.overall_score_trend || 'stable',
      intervention_recommended: enrichedAnalytics[0]?.intervention_recommended || false,
      last_updated: enrichedAnalytics[0]?.analysis_date || new Date().toISOString()
    }

    const responseData = {
      analytics: enrichedAnalytics,
      summary
    }

    await setCachedStudentWellbeing(student_id, responseData)

    console.log(`[${requestId}] Successfully fetched wellbeing data for student ${student_id}`)

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error: any) {
    console.error(`[${requestId}] Error in parent wellbeing API:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
