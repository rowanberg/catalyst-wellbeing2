import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// export const dynamic = 'force-dynamic' // Removed for Capacitor

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cache for batch queries (30 seconds TTL)
const batchCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30 * 1000

/**
 * Batch endpoint to fetch classes for multiple grade levels in a single request
 * Reduces 4 sequential queries (3.7s) to 1 parallel query (~500ms)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')
    const gradeLevelIds = searchParams.get('grade_level_ids')?.split(',') || []
    const teacherId = searchParams.get('teacher_id')

    if (!schoolId || gradeLevelIds.length === 0) {
      return NextResponse.json(
        { message: 'School ID and Grade Level IDs are required' },
        { status: 400 }
      )
    }

    // Check cache
    const cacheKey = `batch-${schoolId}-${gradeLevelIds.join('-')}-${teacherId || 'all'}`
    const cached = batchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✅ [ClassesBatch] Cache HIT for ${gradeLevelIds.length} grades`)
      const response = NextResponse.json(cached.data)
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('Cache-Control', 'private, max-age=30')
      return response
    }

    console.log(`🔄 [ClassesBatch] Fetching classes for ${gradeLevelIds.length} grade levels`)
    const startTime = Date.now()

    // Build the query - fetch all classes for all grade levels in one query
    let query = supabaseAdmin
      .from('classes')
      .select(`
        id,
        class_name,
        subject,
        room_number,
        current_students,
        grade_level_id,
        school_id
      `)
      .eq('school_id', schoolId)
      .in('grade_level_id', gradeLevelIds)

    const { data: classes, error } = await query

    if (error) {
      console.error('Error fetching batch classes:', error)
      return NextResponse.json(
        { message: 'Failed to fetch classes', error: error.message },
        { status: 500 }
      )
    }

    // Get teacher assignments if teacherId provided
    let assignedClassIds = new Set<string>()
    if (teacherId) {
      const { data: assignments } = await supabaseAdmin
        .from('teacher_class_assignments')
        .select('class_id')
        .eq('teacher_id', teacherId)
        .eq('is_active', true)

      if (assignments) {
        assignedClassIds = new Set(assignments.map(a => a.class_id))
      }
    }

    // Group classes by grade level and add assignment info
    const classesByGrade: Record<string, any[]> = {}
    
    gradeLevelIds.forEach(gradeId => {
      classesByGrade[gradeId] = []
    })

    if (classes) {
      classes.forEach(cls => {
        const cleanClass = {
          id: cls.id,
          class_name: cls.class_name && cls.class_name.length > 0 && !cls.class_name.includes('-')
            ? cls.class_name
            : `Class ${cls.id?.substring(0, 8) || 'Unknown'}`,
          subject: cls.subject && cls.subject.length > 0 ? cls.subject : 'General Education',
          room_number: cls.room_number && cls.room_number.length > 0
            ? cls.room_number
            : null,
          current_students: cls.current_students || 0,
          grade_level_id: cls.grade_level_id,
          school_id: cls.school_id,
          is_assigned: assignedClassIds.has(cls.id)
        }

        if (classesByGrade[cls.grade_level_id]) {
          classesByGrade[cls.grade_level_id].push(cleanClass)
        }
      })
    }

    const duration = Date.now() - startTime
    console.log(`✅ [ClassesBatch] Fetched ${classes?.length || 0} classes in ${duration}ms`)

    const result = {
      classesByGrade,
      totalClasses: classes?.length || 0,
      gradeLevels: gradeLevelIds.length,
      fetchTime: duration
    }

    // Cache the result
    batchCache.set(cacheKey, { data: result, timestamp: Date.now() })

    // Clean old cache entries (keep last 50)
    if (batchCache.size > 50) {
      const entries = Array.from(batchCache.entries())
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      batchCache.clear()
      entries.slice(0, 50).forEach(([k, v]) => batchCache.set(k, v))
    }

    const response = NextResponse.json(result)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'private, max-age=30')
    return response

  } catch (error) {
    console.error('Batch classes API error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
