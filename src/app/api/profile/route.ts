import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

// Server-side cache (5 minute TTL)
const profileCache = new Map<string, { profile: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Request deduplication
const inFlightRequests = new Map<string, Promise<any>>()

// Create Supabase client with cookie-based auth
async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
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
}

// GET - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check cache first
    const cacheKey = `profile-${user.id}`
    const cached = profileCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug('Profile cache hit', { userId: user.id })
      const response = NextResponse.json(cached.profile)
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('Cache-Control', 'private, max-age=300')
      return response
    }

    // Check for in-flight request
    const inFlightKey = `inflight-${user.id}`
    if (inFlightRequests.has(inFlightKey)) {
      logger.debug('Waiting for in-flight profile request', { userId: user.id })
      const profile = await inFlightRequests.get(inFlightKey)!
      return NextResponse.json(profile)
    }

    // Create fetch promise for deduplication
    const fetchPromise = (async () => {
      // Get user profile with school information via JOIN
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          role,
          school_id,
          grade_level,
          class_name,
          avatar_url,
          profile_picture_url,
          bio,
          xp,
          gems,
          level,
          streak_days,
          created_at,
          updated_at,
          school:schools(
            id,
            name,
            school_code,
            address,
            city,
            country
          )
        `)
        .eq('user_id', user.id)
        .single()
      return { profile, profileError }
    })()

    // Store in-flight request
    inFlightRequests.set(inFlightKey, fetchPromise.then(({ profile }) => profile))

    const { profile, profileError } = await fetchPromise

    if (profileError || !profile) {
      logger.error('Error fetching profile', profileError)
      inFlightRequests.delete(inFlightKey)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // For teachers without school_id in profile, try to get it from teacher_class_assignments
    if (profile.role === 'teacher' && !profile.school_id) {
      logger.debug('Teacher profile missing school_id, checking teacher_class_assignments')
      
      const { data: assignment } = await supabase
        .from('teacher_class_assignments')
        .select('school_id')
        .eq('teacher_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single()
      
      if (assignment?.school_id) {
        profile.school_id = assignment.school_id
        logger.debug('Found school_id from teacher_class_assignments', { school_id: assignment.school_id })
        
        // Update the profile with the school_id for future requests
        await supabase
          .from('profiles')
          .update({ school_id: assignment.school_id })
          .eq('user_id', user.id)
        
        logger.info('Updated teacher profile with school_id', { user_id: user.id, school_id: assignment.school_id })
      } else {
        // Try with profile.id instead of user.id
        const { data: assignmentByProfileId } = await supabase
          .from('teacher_class_assignments')
          .select('school_id')
          .eq('teacher_id', profile.id)
          .eq('is_active', true)
          .limit(1)
          .single()
        
        if (assignmentByProfileId?.school_id) {
          profile.school_id = assignmentByProfileId.school_id
          logger.debug('Found school_id from teacher_class_assignments using profile.id', { school_id: assignmentByProfileId.school_id })
          
          // Update the profile with the school_id for future requests
          await supabase
            .from('profiles')
            .update({ school_id: assignmentByProfileId.school_id })
            .eq('user_id', user.id)
          
          logger.info('Updated teacher profile with school_id', { user_id: user.id, school_id: assignmentByProfileId.school_id })
        }
      }
    }

    // Store in cache
    profileCache.set(cacheKey, { profile, timestamp: Date.now() })
    logger.debug('Profile cached', { userId: user.id })

    // Clean up cache (keep last 100 entries)
    if (profileCache.size > 100) {
      const entries = Array.from(profileCache.entries())
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      profileCache.clear()
      entries.slice(0, 100).forEach(([k, v]) => profileCache.set(k, v))
    }

    // Clean up in-flight request
    inFlightRequests.delete(inFlightKey)

    const response = NextResponse.json(profile)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'private, max-age=300')
    return response

  } catch (error) {
    logger.error('Error in profile GET', error)
    // Clean up in-flight on error
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
    if (user) {
      inFlightRequests.delete(`inflight-${user.id}`)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
