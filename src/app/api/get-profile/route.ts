import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      )
    }

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

    console.log('Profile query result:', { profile: profile ? 'found' : 'not found', error: error?.message, userId })

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

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Get profile API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
