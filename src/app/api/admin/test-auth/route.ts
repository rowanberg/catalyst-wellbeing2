import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('=== AUTH TEST ENDPOINT START ===')
  
  try {
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Environment variables check:')
    console.log('- SUPABASE_URL exists:', !!supabaseUrl)
    console.log('- SUPABASE_KEY exists:', !!supabaseKey)
    console.log('- URL value:', supabaseUrl?.substring(0, 30) + '...')
    console.log('- URL is placeholder:', supabaseUrl?.includes('placeholder'))
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      console.error('Invalid Supabase configuration')
      return NextResponse.json({ 
        error: 'Invalid Supabase configuration',
        details: 'Environment variables not properly set',
        config: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          isPlaceholder: supabaseUrl?.includes('placeholder')
        }
      }, { status: 500 })
    }

    const cookieStore = await cookies()
    console.log('Cookies available:', cookieStore.getAll().map(c => c.name))
    
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value
          console.log(`Cookie ${name}:`, value ? 'exists' : 'missing')
          return value
        },
      },
    })
    
    console.log('Supabase client created, attempting auth...')
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: userError?.message
    })
    
    if (userError) {
      console.error('Authentication error:', userError)
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: userError.message,
        step: 'auth.getUser'
      }, { status: 401 })
    }
    
    if (!user) {
      console.log('No user found - user not logged in')
      return NextResponse.json({ 
        error: 'No user found - please log in',
        step: 'no_user'
      }, { status: 401 })
    }
    
    console.log('User authenticated, fetching profile...')
    
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()
    
    console.log('Profile result:', {
      hasProfile: !!profile,
      role: profile?.role,
      error: profileError?.message
    })
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      profileError: profileError?.message,
      step: 'complete'
    })
    
  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      step: 'catch_block'
    }, { status: 500 })
  } finally {
    console.log('=== AUTH TEST ENDPOINT END ===')
  }
}
