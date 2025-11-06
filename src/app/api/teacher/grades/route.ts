import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getCachedGrades, setCachedGrades } from '@/lib/redis'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    // Parse URL once
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')
    
    if (!schoolId) {
      return NextResponse.json(
        { message: 'school_id is required' },
        { status: 400 }
      )
    }
    
    // Step 1: Try Redis cache first
    const cached = await getCachedGrades(schoolId)
    
    if (cached) {
      const duration = Math.round(performance.now() - startTime)
      console.log(`⚡ [Grades API] Cache HIT in ${duration}ms | School: ${schoolId}`)
      return NextResponse.json(cached)
    }
    
    // Step 2: Cache miss - query database
    console.log(`❌ [Grades API] Cache MISS | Querying database for school: ${schoolId}`)
    
    const { data: grades, error } = await supabaseAdmin
      .from('grade_levels')
      .select('id, grade_level, grade_name, school_id, is_active')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('grade_level', { ascending: true })
    
    const duration = Math.round(performance.now() - startTime)
    console.log(`⚡ [Grades API] Database query completed in ${duration}ms`)
    
    if (error) {
      console.error('Error fetching grades:', error.message)
      return NextResponse.json({ 
        grades: [], 
        school_id: schoolId 
      })
    }

    const response = {
      grades: grades || [],
      school_id: schoolId,
      cached_at: new Date().toISOString(),
      source: 'database'
    }

    // Step 3: Store in Redis cache (fire-and-forget for speed)
    setCachedGrades(schoolId, response).catch((err) => {
      console.error('Failed to cache grades:', err)
    })

    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error fetching grades:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
