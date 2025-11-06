/**
 * Parent Dashboard API - Home Tab (30-Second Check-in)
 * GET /api/v1/parents/dashboard?student_id={student_id}
 */
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/api/response'
import { validateQueryParams, ParentDashboardQuerySchema } from '@/lib/validations/api-schemas'
import { handleSecureError, AuthorizationError } from '@/lib/security/error-handler'
import { rateLimiters } from '@/lib/security/enhanced-rate-limiter'
import { 
  getCachedStudentDashboard, 
  setCachedStudentDashboard 
} from '@/lib/redis/parent-cache'

export async function GET(request: NextRequest) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  try {
    // Validate query parameters
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const { student_id } = validateQueryParams(ParentDashboardQuerySchema, params)
    
    // Use user-context client, not admin client
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return ApiResponse.unauthorized('Authentication required')
    }
    
    // Get parent's profile ID
    const { data: parentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('user_id', user.id)
      .single()
    
    if (profileError || !parentProfile) {
      return ApiResponse.unauthorized('Parent profile not found')
    }
    
    // Verify user is a parent
    if (parentProfile.role !== 'parent') {
      throw new AuthorizationError('Only parents can access this endpoint')
    }
    
    // Get student's user_id from their profile_id
    const { data: studentUserData, error: studentProfileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', student_id)
      .single()
    
    if (studentProfileError || !studentUserData) {
      console.warn(`[${requestId}] Student profile not found: ${student_id}`)
      throw new AuthorizationError('Student not found')
    }

    // CRITICAL: Verify parent-child relationship exists (using user_ids, not profile_ids)
    const { data: relationship, error: relationshipError } = await supabase
      .from('parent_child_relationships')
      .select('id')
      .eq('parent_id', user.id)  // parent's user_id
      .eq('child_id', studentUserData.user_id)  // child's user_id
      .single()
    
    if (relationshipError || !relationship) {
      console.warn(`[${requestId}] Unauthorized access attempt by user ${user.id} to student ${student_id}`)
      throw new AuthorizationError('You do not have permission to view this student\'s data')
    }

    // Check Redis cache first
    const cachedData = await getCachedStudentDashboard(student_id)
    if (cachedData) {
      console.log(`[${requestId}] CACHE HIT - Returning cached dashboard for student: ${student_id}`)
      return ApiResponse.success(cachedData)
    }

    console.log(`[${requestId}] CACHE MISS - Fetching fresh data from database`)

    // Authorization verified - proceed with data fetching
    // CRITICAL: student_class_assignments.student_id references auth.users.id (user_id), NOT profile_id!
    // So we must use studentUserData.user_id, not student_id (which is profile_id)
    const { data: studentClassAssignments, error: classAssignError } = await supabase
      .from('student_class_assignments')
      .select('class_id')
      .eq('student_id', studentUserData.user_id)  // Use user_id, not profile_id!
      .eq('is_active', true)

    console.log(`[${requestId}] Step 1 - Student class assignments:`, {
      profileId: student_id,
      userId: studentUserData.user_id,
      assignmentCount: studentClassAssignments?.length || 0,
      assignments: studentClassAssignments,
      error: classAssignError,
      errorDetails: classAssignError ? JSON.stringify(classAssignError) : null
    })
    
    // DEBUG: Check if RLS is blocking - try with admin client to see if data exists
    if (!studentClassAssignments || studentClassAssignments.length === 0) {
      console.warn(`[${requestId}] No class assignments found! Checking if RLS is blocking...`)
      
      // Import admin client
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
      
      const { data: adminCheck, error: adminError } = await supabaseAdmin
        .from('student_class_assignments')
        .select('*')
        .eq('student_id', studentUserData.user_id)
        .eq('is_active', true)
      
      console.log(`[${requestId}] Admin query result (bypasses RLS):`, {
        foundWithAdmin: adminCheck?.length || 0,
        data: adminCheck,
        error: adminError,
        verdict: adminCheck && adminCheck.length > 0 ? 'RLS IS BLOCKING!' : 'No data exists in table'
      })
    }

    const classIds = studentClassAssignments?.map(sc => sc.class_id) || []
    
    // Fetch class details separately to ensure we get the data
    let classDetails: { id: string; class_name: string; class_code: string } | null = null
    if (classIds.length > 0) {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, class_name, class_code')
        .eq('id', classIds[0])
        .single()
      
      console.log(`[${requestId}] Step 2 - Class details lookup:`, {
        classId: classIds[0],
        classData,
        error: classError
      })
      
      classDetails = classData
    }
    
    console.log(`[${requestId}] Step 3 - Final class info:`, {
      hasClassDetails: !!classDetails,
      classId: classDetails?.id,
      className: classDetails?.class_name,
      classCode: classDetails?.class_code
    })

    // Parallel fetch all required data
    const [
      studentProfile,
      recentGrades,
      upcomingAssignments,
      attendanceData,
      wellbeingData
    ] = await Promise.all([
      // Student basic profile
      supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, school_id, xp, level, streak_days')
        .eq('id', student_id)
        .single(),

      // Recent grades (last 30 days)
      supabase
        .from('assessment_grades')
        .select(`
          id,
          score,
          percentage,
          letter_grade,
          created_at,
          assessments (
            title,
            subject,
            assessment_type,
            due_date
          )
        `)
        .eq('student_id', student_id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10),

      // Upcoming assignments (next 7 days) - only if student has classes
      classIds.length > 0 ? supabase
        .from('assessments')
        .select(`
          id,
          title,
          subject,
          due_date,
          assessment_type,
          class_id
        `)
        .in('class_id', classIds)
        .gte('due_date', new Date().toISOString())
        .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('due_date', { ascending: true })
        .limit(5) : Promise.resolve({ data: [] }),

      // Attendance (last 7 days)
      supabase
        .from('attendance')
        .select('id, date, status')
        .eq('student_id', student_id)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false }),

      // Wellbeing data (latest)
      supabase
        .from('mood_tracking')
        .select('mood, energy, stress, date')
        .eq('user_id', student_id)
        .order('date', { ascending: false })
        .limit(1)
    ])

    // Verify student exists
    if (!studentProfile.data) {
      return ApiResponse.notFound('Student not found')
    }

    // Process data for the dashboard
    const actionItems = generateActionItems({
      grades: recentGrades.data || [],
      attendance: attendanceData.data || [],
      wellbeing: wellbeingData.data?.[0],
      upcoming: upcomingAssignments.data || []
    })

    const growthMetrics = calculateGrowthMetrics({
      student: studentProfile.data,
      grades: recentGrades.data || []
    })

    const upcomingWeek = formatUpcomingWeek(upcomingAssignments.data || [])

    const dashboardData = {
      actionCenter: actionItems.length > 0 ? actionItems : [{
        type: 'info',
        priority: 'low',
        title: 'Getting Started',
        message: 'No class assignments yet. Dashboard will populate once classes are assigned.',
        action: null
      }],
      growthTracker: growthMetrics,
      upcomingWeek,
      student: {
        id: studentProfile.data?.id,
        name: `${studentProfile.data?.first_name} ${studentProfile.data?.last_name}`,
        level: studentProfile.data?.level || 1
      },
      studentInfo: {
        classId: classDetails?.id || null,
        className: classDetails?.class_name || classDetails?.class_code || null
      }
    }

    // Cache the result for future requests (15 days TTL with auto-invalidation)
    await setCachedStudentDashboard(student_id, dashboardData)
    console.log(`[${requestId}] Cached dashboard data for student: ${student_id}`)

    return ApiResponse.success(dashboardData)

  } catch (error: any) {
    return handleSecureError(error, 'ParentDashboard', requestId)
  }
}

function generateActionItems(data: any) {
  const items: any[] = []

  // Check for low grades
  const lowGrades = data.grades.filter((g: any) => g.percentage < 70)
  if (lowGrades.length > 0) {
    items.push({
      type: 'alert',
      priority: 'high',
      title: 'Low Grade Alert',
      message: `${lowGrades[0].assessments?.title} - ${lowGrades[0].letter_grade}`,
      action: 'View Details'
    })
  }

  // Check for missing assignments
  const todayAssignments = data.upcoming.filter((a: any) => {
    const dueDate = new Date(a.due_date)
    const today = new Date()
    return dueDate.toDateString() === today.toDateString()
  })
  
  if (todayAssignments.length > 0) {
    items.push({
      type: 'warning',
      priority: 'medium',
      title: 'Assignment Due Today',
      message: todayAssignments[0].title,
      action: 'Remind Student'
    })
  }

  // Check wellbeing
  if (data.wellbeing?.stress > 70 || data.wellbeing?.mood === 'anxious') {
    items.push({
      type: 'info',
      priority: 'medium',
      title: 'Wellbeing Check',
      message: 'Your child may be feeling stressed',
      action: 'View Wellbeing'
    })
  }

  // If no issues, show positive message
  if (items.length === 0) {
    items.push({
      type: 'success',
      priority: 'low',
      title: 'All Clear!',
      message: 'Everything is on track',
      action: null
    })
  }

  return items
}

function calculateGrowthMetrics(data: any) {
  const grades = data.grades || []
  
  // Calculate GPA
  const validGrades = grades.filter((g: any) => g.percentage !== null)
  const avgPercentage = validGrades.length > 0
    ? validGrades.reduce((sum: number, g: any) => sum + g.percentage, 0) / validGrades.length
    : 75 // Default to 75% if no grades
  
  const gpa = (avgPercentage / 100) * 4.0
  
  // Calculate trend (simple: compare first half vs second half)
  const trend = validGrades.length > 1 ? (() => {
    const mid = Math.floor(validGrades.length / 2)
    const recentAvg = validGrades.slice(0, mid).reduce((sum, g) => sum + g.percentage, 0) / Math.max(mid, 1)
    const olderAvg = validGrades.slice(mid).reduce((sum, g) => sum + g.percentage, 0) / Math.max(validGrades.length - mid, 1)
    return recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'stable'
  })() : 'stable'

  // Create 30-day sparkline data
  const sparklineData = validGrades.length > 0 ? 
    Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      value: avgPercentage + (Math.random() - 0.5) * 10
    })) : 
    Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 75 }))

  return {
    gpa: validGrades.length > 0 ? gpa.toFixed(2) : '0.00',
    trend,
    trendValue: '0.0',
    dayStreak: data.student?.streak_days || 0,
    weeklyXP: data.student?.xp || 0,
    level: data.student?.level || 1,
    totalAssignments: grades.length,
    avgPercentage: avgPercentage.toFixed(1)
  }
}

function formatUpcomingWeek(assignments: any[]) {
  return assignments.map((assignment: any) => ({
    id: assignment.id,
    title: assignment.title,
    subject: assignment.subject || 'General',
    dueDate: assignment.due_date,
    type: assignment.assessment_type || 'assignment',
    daysUntil: Math.ceil((new Date(assignment.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }))
}

function convertPercentageToGPA(percentage: number): number {
  if (percentage >= 93) return 4.0
  if (percentage >= 90) return 3.7
  if (percentage >= 87) return 3.3
  if (percentage >= 83) return 3.0
  if (percentage >= 80) return 2.7
  if (percentage >= 77) return 2.3
  if (percentage >= 73) return 2.0
  if (percentage >= 70) return 1.7
  if (percentage >= 67) return 1.3
  if (percentage >= 65) return 1.0
  return 0.0
}
