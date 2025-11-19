import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

// 1-hour cache for upcoming assessments
const assessmentsCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const MAX_CACHE_SIZE = 200

// Cleanup old cache entries
function cleanupCache() {
  if (assessmentsCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(assessmentsCache.entries())
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
    assessmentsCache.clear()
    entries.slice(0, MAX_CACHE_SIZE).forEach(([key, value]) => assessmentsCache.set(key, value))
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      if (auth.status === 401) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      if (auth.status === 403) {
        return NextResponse.json({ error: 'Student access required' }, { status: 403 })
      }
      
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status })
    }
    
    const { supabase, profile, schoolId } = auth

    // Check cache first
    const cacheKey = `assessments-${profile.id}`
    const cached = assessmentsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const response = NextResponse.json(cached.data)
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('X-Cache-Age', Math.floor((Date.now() - cached.timestamp) / 1000).toString())
      response.headers.set('Cache-Control', 'private, max-age=3600')
      return response
    }

    // Get all classes the student is enrolled in using student_class_assignments
    const { data: classAssignments, error: classError } = await supabase
      .from('student_class_assignments')
      .select('class_id')
      .eq('student_id', profile.id)

    if (classError) {
      console.error('❌ Error fetching student class assignments:', classError)
      return NextResponse.json({ error: 'Failed to fetch class assignments' }, { status: 500 })
    }

    // If student has no class assignments, return empty
    if (!classAssignments || classAssignments.length === 0) {
      return NextResponse.json({ 
        assessments: [],
        count: 0
      })
    }

    // Extract class IDs
    const classIds = classAssignments.map(ca => ca.class_id)

    console.log('📚 Student enrolled in classes:', classIds)

    // Get current date/time
    const now = new Date().toISOString()

    // Fetch upcoming assessments for all student's classes
    // Get assessments that have an assessment_date in the future
    // Limit to 5 to reduce database load
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select(`
        id,
        title,
        type,
        max_score,
        assessment_date,
        due_date,
        class_id,
        classes!fk_assessments_class_id!inner (
          class_name,
          subject
        )
      `)
      .in('class_id', classIds)
      .eq('school_id', schoolId)
      .gte('assessment_date', now)
      .order('assessment_date', { ascending: true })
      .limit(5)

    if (assessmentsError) {
      console.error('❌ Error fetching upcoming assessments:', assessmentsError)
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 })
    }

    console.log('📚 Raw assessments from DB:', {
      count: assessments?.length || 0,
      studentClassIds: classIds,
      profileSchoolId: profile.school_id,
      currentTime: now,
      assessments: assessments?.map(a => ({
        id: a.id,
        title: a.title,
        assessment_date: a.assessment_date,
        class_id: a.class_id
      }))
    })

    // Format the response
    const formattedAssessments = (assessments || []).map((assessment: any) => {
      const daysUntil = Math.ceil((new Date(assessment.assessment_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return {
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        subject: assessment.classes?.subject || 'Unknown',
        className: assessment.classes?.class_name || 'Unknown',
        assessmentDate: assessment.assessment_date,
        dueDate: assessment.due_date,
        maxScore: assessment.max_score,
        daysUntil
      }
    })

    console.log('✅ Formatted assessments to return:', {
      count: formattedAssessments.length,
      assessments: formattedAssessments
    })

    const responseData = { 
      assessments: formattedAssessments,
      count: formattedAssessments.length
    }

    // Store in cache
    assessmentsCache.set(cacheKey, { data: responseData, timestamp: Date.now() })
    cleanupCache()

    const response = NextResponse.json(responseData)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'private, max-age=3600')
    return response

  } catch (error) {
    console.error('Error in upcoming assessments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
