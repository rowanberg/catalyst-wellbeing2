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
// Now using centralized profileService for consistency and deduplication
export async function GET(request: NextRequest) {
  try {
    // Use centralized profile service with built-in caching and deduplication
    const profile = await getCurrentUserProfile()

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized or profile not found' }, { status: 401 })
    }

    // Return with cache headers for client-side caching
    const response = NextResponse.json(profile)
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60')
    response.headers.set('Vary', 'Cookie')
    
    return response

  } catch (error) {
    logger.error('Error in profile GET', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
