import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import { getCurrentUserProfile, getDedupedProfileWithSchool, clearProfileCache } from '@/lib/services/profileService'

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
// Supports both /api/profile and /api/get-profile?userId=X use cases
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let profile
    
    if (userId) {
      // Get specific user's profile (for /api/get-profile compatibility)
      profile = await getDedupedProfileWithSchool(userId)
    } else {
      // Get current authenticated user's profile
      profile = await getCurrentUserProfile()
    }

    if (!profile) {
      return NextResponse.json({ 
        error: 'Unauthorized or profile not found',
        code: 'PROFILE_NOT_FOUND'
      }, { status: 401 })
    }

    // Return with aggressive cache headers
    const response = NextResponse.json(profile)
    response.headers.set('Cache-Control', 'private, max-age=1800, stale-while-revalidate=300')
    response.headers.set('Vary', 'Cookie')
    response.headers.set('X-Cache-TTL', '1800')
    
    return response

  } catch (error) {
    logger.error('Error in profile GET', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
