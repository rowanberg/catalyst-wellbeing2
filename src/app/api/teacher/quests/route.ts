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
    console.log('🎯 Fetching quests...')

    // Get user from session
    const authHeader = request.headers.get('authorization')
    const sessionToken = request.cookies.get('sb-access-token')?.value

    if (!authHeader && !sessionToken) {
      console.log('❌ No authorization found')
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
      console.log('❌ User authentication failed:', userError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    console.log('👤 Authenticated user:', user.email)

    // Get user profile to check role and school
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('❌ Profile not found:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!['teacher', 'admin'].includes(profile.role)) {
      console.log('❌ Insufficient permissions:', profile.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const active = searchParams.get('active')

    // Try to get quests, return empty array if table doesn't exist
    const { data: quests, error } = await supabaseAdmin
      .from('quests')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('⚠️ Quests table may not exist:', error)
      return NextResponse.json({ 
        quests: [], 
        message: 'Quest system not yet configured for this school'
      })
    }

    // Apply filters if provided
    let filteredQuests = quests || []
    
    if (category && category !== 'all') {
      filteredQuests = filteredQuests.filter(quest => quest.category === category)
    }
    if (difficulty && difficulty !== 'all') {
      filteredQuests = filteredQuests.filter(quest => quest.difficulty === difficulty)
    }
    if (active !== null) {
      filteredQuests = filteredQuests.filter(quest => quest.is_active === (active === 'true'))
    }

    console.log('✅ Quests fetched successfully:', filteredQuests.length)

    return NextResponse.json({ quests: filteredQuests })

  } catch (error) {
    console.error('❌ Error in GET /api/teacher/quests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
