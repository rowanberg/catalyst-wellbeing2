import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Helper function to detect role from email
function getRoleFromEmail(email: string): string {
  const lowerEmail = email.toLowerCase()

  // Check email patterns
  if (lowerEmail.includes('teacher') || lowerEmail.includes('faculty') || lowerEmail.includes('instructor')) {
    return 'teacher'
  }
  if (lowerEmail.includes('parent') || lowerEmail.includes('guardian')) {
    return 'parent'
  }
  if (lowerEmail.includes('admin') || lowerEmail.includes('administrator')) {
    return 'admin'
  }

  // Default to student
  return 'student'
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  console.log('🔐 [OAuth Callback] Processing callback with code:', code ? 'present' : 'missing')

  if (!code) {
    console.error('❌ [OAuth Callback] No code provided')
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              console.error('❌ [OAuth Callback] Cookie set error:', error)
            }
          },
        },
      }
    )

    // Exchange code for session
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('❌ [OAuth Callback] Session exchange error:', sessionError.message)
      return NextResponse.redirect(`${origin}/login?error=session_error`)
    }

    if (!sessionData?.user) {
      console.error('❌ [OAuth Callback] No user in session')
      return NextResponse.redirect(`${origin}/login?error=no_user`)
    }

    const user = sessionData.user
    console.log('✅ [OAuth Callback] User authenticated:', user.email)

    // Extract user metadata from Google OAuth
    const googleUserData = {
      email: user.email || '',
      firstName: user.user_metadata?.given_name || user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
      lastName: user.user_metadata?.family_name || user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      providerId: user.id,
    }

    // Try to get existing profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, id, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('⚠️ [OAuth Callback] Profile query error:', profileError.message)
    }

    // Check if user has a complete profile with school association
    if (!profile || !profile.school_id) {
      // User is not fully registered - redirect to registration with Google data
      console.log('🔄 [OAuth Callback] User not registered with school, redirecting to registration')

      // Encode Google user data as URL-safe base64 for the redirect
      const encodedData = Buffer.from(JSON.stringify(googleUserData)).toString('base64url')

      // Redirect to an intermediate client-side page that will store data and redirect to /register
      return NextResponse.redirect(`${origin}/auth/google-register?data=${encodedData}`)
    }

    // User has a profile with school - proceed with normal login flow
    let userRole = profile.role || 'student'
    console.log('✅ [OAuth Callback] Found existing profile with role:', userRole)

    // Redirect based on role
    const dashboards: Record<string, string> = {
      student: '/student',
      teacher: '/teacher',
      parent: '/parent',
      admin: '/admin',
    }

    const dashboard = dashboards[userRole] || '/student'
    console.log('🎯 [OAuth Callback] Redirecting to:', dashboard)

    return NextResponse.redirect(`${origin}${dashboard}`)

  } catch (error: any) {
    console.error('❌ [OAuth Callback] Unexpected error:', error.message || error)
    return NextResponse.redirect(`${origin}/login?error=callback_failed`)
  }
}
