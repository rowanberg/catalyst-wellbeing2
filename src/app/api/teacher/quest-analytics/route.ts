import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    const sessionToken = request.cookies.get('sb-access-token')?.value

    if (!authHeader && !sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client for user session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    // Get user profile to check role and school
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Return basic analytics data since quest system may not be configured
    const analytics = {
      totalQuests: 0,
      activeQuests: 0,
      completedQuests: 0,
      totalParticipants: 0,
      averageCompletionRate: 0,
      topPerformers: [],
      questsByCategory: {},
      recentActivity: [],
      message: 'Quest analytics system not yet configured for this school'
    }

    return NextResponse.json({ analytics })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
