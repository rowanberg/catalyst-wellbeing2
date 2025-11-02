import { NextRequest, NextResponse } from 'next/server'
import { getDedupedProfileWithSchool } from '@/lib/services/profileService'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Use centralized profile service with built-in caching and deduplication
    const profile = await getDedupedProfileWithSchool(userId)

    if (!profile) {
      return NextResponse.json(
        { 
          message: 'Profile not found. Your account may not be fully set up yet. Please contact your school administrator.',
          code: 'PROFILE_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    const response = NextResponse.json(profile)
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60')
    return response
  } catch (error) {
    console.error('Error in get-profile:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
