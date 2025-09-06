import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('=== AUTH DEBUG API START ===')
    
    // Check environment variables
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL,
      isPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
    }
    
    console.log('Environment check:', envCheck)
    
    if (envCheck.isPlaceholder) {
      return NextResponse.json({
        error: 'Still using placeholder credentials',
        envCheck,
        authenticated: false,
        profile: null
      })
    }

    // Create auth client
    const cookieStore = await cookies()
    console.log('Available cookies:', cookieStore.getAll().map(c => c.name))
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // No-op for server-side
          },
          remove(name: string, options: any) {
            // No-op for server-side
          },
        },
      }
    )

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check authentication
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    console.log('User auth result:', { hasUser: !!user, error: userError?.message, userId: user?.id })

    // Also check session
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession()
    console.log('Session result:', { hasSession: !!session, error: sessionError?.message })

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        error: userError?.message || 'No user session found',
        envCheck,
        profile: null,
        session: !!session,
        sessionError: sessionError?.message,
        cookies: cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
      })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('Profile result:', { hasProfile: !!profile, error: profileError?.message, role: profile?.role })

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile || null,
      profileError: profileError?.message || null,
      envCheck
    })

  } catch (error) {
    console.error('Auth debug error:', error)
    return NextResponse.json({
      error: 'Debug API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
