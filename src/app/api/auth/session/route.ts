import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Session cache to prevent redundant auth checks (1 month TTL)
const sessionCache = new Map<string, { user: any; timestamp: number }>()
const SESSION_CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 1 month (30 days)

export async function GET(request: Request) {
  try {
    // Extract stable session token for cache key
    const cookies = request.headers.get('cookie') || ''
    const accessToken = cookies.match(/sb-[^-]+-auth-token=([^;]+)/)?.[1] || ''
    const refreshToken = cookies.match(/sb-[^-]+-auth-token-code-verifier=([^;]+)/)?.[1] || ''
    const cacheKey = `session-${accessToken.slice(0, 20)}-${refreshToken.slice(0, 20)}`

    // Check cache first
    const cached = sessionCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < SESSION_CACHE_TTL) {
      const response = NextResponse.json({ user: cached.user })
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('Cache-Control', 'private, max-age=2592000') // 30 days
      return response
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.log('🔄 [SessionAPI] Auth error:', error.message)

      // Handle "Offline mode" error specifically (Supabase connectivity issue)
      if (error.message?.includes('Offline mode')) {
        console.error('❌ [SessionAPI] Supabase client is in offline mode')
        return NextResponse.json({
          error: 'Offline mode - data unavailable',
          code: 'SUPABASE_OFFLINE'
        }, { status: 503 })
      }

      // Handle refresh token errors specifically
      if (error.message?.includes('Invalid Refresh Token') ||
        error.message?.includes('Refresh Token Not Found') ||
        error.message?.includes('refresh_token_not_found')) {
        console.log('🔄 [SessionAPI] Invalid refresh token detected')
        return NextResponse.json({
          error: 'Invalid refresh token',
          code: 'REFRESH_TOKEN_INVALID'
        }, { status: 401 })
      }

      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!user) {
      console.log('🔄 [SessionAPI] No user found in session')
      return NextResponse.json({ error: 'Auth session missing!' }, { status: 401 })
    }

    // Store in cache
    sessionCache.set(cacheKey, { user, timestamp: Date.now() })

    // Clean old cache entries (keep last 100)
    if (sessionCache.size > 100) {
      const entries = Array.from(sessionCache.entries())
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      sessionCache.clear()
      entries.slice(0, 100).forEach(([key, value]) => sessionCache.set(key, value))
    }

    console.log('✅ [SessionAPI] Valid session found for user:', user.email)
    const response = NextResponse.json({ user })
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'private, max-age=2592000') // 30 days
    return response
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
