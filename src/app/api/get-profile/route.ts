import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Profile cache (5 minute TTL)
const profileCache = new Map<string, { profile: any; timestamp: number }>()
const PROFILE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Request deduplication map (prevents concurrent duplicate requests)
const inFlightRequests = new Map<string, Promise<any>>()

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `profile-${userId}`
    const cached = profileCache.get(cacheKey)
    const cacheAge = cached ? Date.now() - cached.timestamp : 0
    
    if (cached && cacheAge < PROFILE_CACHE_TTL) {
      console.log(`✅ [ProfileCache] HIT for user ${userId} (age: ${Math.round(cacheAge/1000)}s)`)
      const response = NextResponse.json(cached.profile)
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('X-Cache-Age', Math.round(cacheAge/1000).toString())
      response.headers.set('Cache-Control', 'private, max-age=300')
      return response
    }
    
    // Check for in-flight request (prevents duplicate concurrent requests)
    const inFlightKey = `inflight-${userId}`
    if (inFlightRequests.has(inFlightKey)) {
      console.log(`🔄 [ProfileCache] Waiting for in-flight request for user ${userId}`)
      const inFlightProfile = await inFlightRequests.get(inFlightKey)!
      return NextResponse.json(inFlightProfile)
    }
    
    console.log(`🔄 [ProfileCache] MISS for user ${userId}`)

    // Create promise for in-flight tracking
    const fetchPromise = (async () => {
      // Get user profile with school information
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          schools (
            id,
            name,
            school_code
          )
        `)
        .eq('user_id', userId)
        .single()
      
      return { profile, error }
    })()
    
    // Store in-flight request
    inFlightRequests.set(inFlightKey, fetchPromise.then(({ profile }) => profile))
    
    const { profile, error } = await fetchPromise

    if (error) {
      console.error('Profile fetch error:', error)
      
      // If profile doesn't exist, provide helpful error message
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { 
            message: 'Profile not found. Your account may not be fully set up yet. Please contact your school administrator or try registering again.',
            code: 'PROFILE_NOT_FOUND'
          },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { message: `Failed to fetch profile: ${error.message}` },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { 
          message: 'Profile not found. Your account may not be fully set up yet. Please contact your school administrator.',
          code: 'PROFILE_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Store in cache
    profileCache.set(cacheKey, { profile, timestamp: Date.now() })
    console.log(`💾 [ProfileCache] Stored profile for user ${userId}`)
    
    // Clean old cache entries (keep last 100)
    if (profileCache.size > 100) {
      const entries = Array.from(profileCache.entries())
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      profileCache.clear()
      entries.slice(0, 100).forEach(([key, value]) => profileCache.set(key, value))
    }
    
    // Clean up in-flight request
    inFlightRequests.delete(inFlightKey)

    const response = NextResponse.json(profile)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'private, max-age=300')
    return response
  } catch (error) {
    console.error('Get profile API error:', error)
    // Clean up in-flight request on error
    const { userId } = await request.json().catch(() => ({}))
    if (userId) {
      inFlightRequests.delete(`inflight-${userId}`)
    }
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
