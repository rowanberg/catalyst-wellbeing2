import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { dedupedRequest } from '@/lib/cache/requestDedup'

// Singleton Supabase admin client
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseAdminInstance
}

// Cache for class data (2 minute TTL)
const classCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 2 * 60 * 1000

interface ClassData {
  id: string
  class_name: string
  subject: string
  room_number: string | null
  current_students: number
  grade_level_id: string
  school_id: string
  is_assigned: boolean
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')
    const gradeLevelId = searchParams.get('grade_level_id')
    const teacherId = searchParams.get('teacher_id')

    if (!schoolId || !gradeLevelId) {
      return NextResponse.json(
        { message: 'School ID and Grade Level ID are required' },
        { status: 400 }
      )
    }

    // Create cache key
    const cacheKey = `classes:${schoolId}:${gradeLevelId}:${teacherId || 'all'}`
    
    // Check cache first
    const cached = classCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const response = NextResponse.json(cached.data)
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=30')
      return response
    }

    // Use request deduplication for concurrent calls (saves 3.7s on 4 parallel calls)
    const result = await dedupedRequest(cacheKey, async () => {
      return await fetchClassesData(schoolId, gradeLevelId, teacherId)
    })

    // Store in cache
    classCache.set(cacheKey, { data: result, timestamp: Date.now() })
    
    // Clean up old cache entries (keep last 50)
    if (classCache.size > 50) {
      const entries = Array.from(classCache.entries())
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      classCache.clear()
      entries.slice(0, 50).forEach(([k, v]) => classCache.set(k, v))
    }

    const response = NextResponse.json(result)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=30')
    return response
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function fetchClassesData(schoolId: string, gradeLevelId: string, teacherId: string | null) {
  const supabaseAdmin = getSupabaseAdmin()
  let classes: ClassData[] = []
  try {
    // Strategy 1: If teacherId provided, get assigned classes directly
    if (teacherId) {
      const { data: teacherClasses, error: classError } = await supabaseAdmin
        .from('teacher_class_assignments')
        .select(`
          classes!inner(
            id,
            class_name,
            subject,
            room_number,
            current_students,
            grade_level_id,
            school_id
          )
        `)
        .eq('teacher_id', teacherId)
        .eq('classes.school_id', schoolId)
        .eq('classes.grade_level_id', gradeLevelId)
      
      if (!classError && teacherClasses) {
        classes = teacherClasses.map((assignment: any) => normalizeClass(assignment.classes))
      }
    }
    
    // Strategy 2: Try database function if no teacher-specific classes
    if (classes.length === 0) {
      try {
        const { data: dbClasses, error: rpcError } = await supabaseAdmin
          .rpc('get_grade_classes', { 
            p_school_id: schoolId,
            p_grade_level_id: gradeLevelId 
          } as any) as { data: any[] | null; error: any }
        
        if (!rpcError && dbClasses && Array.isArray(dbClasses)) {
          classes = dbClasses.map((cls: any) => normalizeClass(cls))
        } else if (rpcError) {
          console.warn('Database function failed:', rpcError.message)
        }
      } catch (rpcErr) {
        console.warn('RPC call failed, trying direct query')
      }
    }
    
    // Strategy 3: Fallback to direct table query
    if (classes.length === 0) {
      const { data: directClasses, error: directError } = await supabaseAdmin
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)
        .eq('grade_level_id', gradeLevelId)
      
      if (!directError && directClasses) {
        classes = directClasses.map((cls: any) => normalizeClass(cls))
      }
    }
    
  } catch (error) {
    console.error('Error in fetchClassesData:', error)
    classes = []
  }

  // Add assignment status if teacher_id provided
  if (teacherId && classes.length > 0) {
    try {
      const { data: assignments } = await supabaseAdmin
        .from('teacher_class_assignments')
        .select('class_id')
        .eq('teacher_id', teacherId)
      
      if (assignments && Array.isArray(assignments)) {
        const assignedClassIds = new Set(assignments.map((a: any) => a.class_id))
        classes = classes.map(cls => ({
          ...cls,
          is_assigned: assignedClassIds.has(cls.id)
        }))
      }
    } catch (assignError) {
      console.warn('Failed to check assignments:', assignError)
    }
  }

  // Ensure all classes have is_assigned flag
  const classesWithAssignment = classes.map(cls => ({
    ...cls,
    is_assigned: cls.is_assigned ?? false
  }))

  return { classes: classesWithAssignment }
}

// Normalize class data to consistent format
function normalizeClass(cls: any): ClassData {
  return {
    id: cls.id,
    class_name: cls.class_name && cls.class_name.length > 0 && !cls.class_name.includes('-') 
      ? cls.class_name 
      : `Class ${cls.id?.substring(0, 8) || 'Unknown'}`,
    subject: cls.subject && cls.subject.length > 0 ? cls.subject : 'General Education',
    room_number: cls.room_number && cls.room_number.length > 0 ? cls.room_number : null,
    current_students: cls.current_students || 0,
    grade_level_id: cls.grade_level_id,
    school_id: cls.school_id,
    is_assigned: false
  }
}
