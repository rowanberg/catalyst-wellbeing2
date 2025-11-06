import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getCachedGrades, setCachedGrades } from '@/lib/redis'

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to verify they are a teacher
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.school_id) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const schoolId = profile.school_id

    // Step 1: Try Redis cache first
    const cached = await getCachedGrades(schoolId)
    
    if (cached) {
      const duration = Math.round(performance.now() - startTime)
      console.log(`⚡ [Grade Levels API] Cache HIT in ${duration}ms | School: ${schoolId}`)
      
      // Return in expected format
      return NextResponse.json({ 
        gradeLevels: cached.grades || [],
        success: true,
        source: 'cache'
      })
    }
    
    // Step 2: Cache miss - query database
    console.log(`❌ [Grade Levels API] Cache MISS | Querying database for school: ${schoolId}`)

    const { data: gradeLevels, error: gradeLevelsError } = await supabase
      .from('grade_levels')
      .select(`
        id,
        grade_level,
        grade_name,
        is_active
      `)
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('grade_level')

    const duration = Math.round(performance.now() - startTime)
    console.log(`⚡ [Grade Levels API] Database query completed in ${duration}ms`)

    if (gradeLevelsError) {
      console.error('Error fetching grade levels:', gradeLevelsError)
      return NextResponse.json({ error: 'Failed to fetch grade levels' }, { status: 500 })
    }

    // Prepare cache data in standard format
    const cacheData = {
      grades: gradeLevels || [],
      school_id: schoolId,
      cached_at: new Date().toISOString(),
      source: 'database'
    }

    // Step 3: Store in Redis cache (fire-and-forget for speed)
    setCachedGrades(schoolId, cacheData).catch((err) => {
      console.error('Failed to cache grade levels:', err)
    })

    return NextResponse.json({ 
      gradeLevels: gradeLevels || [],
      success: true,
      source: 'database'
    })

  } catch (error) {
    console.error('Error in grade-levels API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
