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

    // Try to get existing profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('user_id', user.id)
      .maybeSingle()

    let userRole = 'student' // default

    if (profileError) {
      console.error('⚠️ [OAuth Callback] Profile query error:', profileError.message)
    }

    if (profile?.role) {
      // Profile exists with role
      userRole = profile.role
      console.log('✅ [OAuth Callback] Found existing profile with role:', userRole)
    } else {
      // No profile or no role - detect from email
      userRole = getRoleFromEmail(user.email || '')
      console.log('🔍 [OAuth Callback] Detected role from email:', userRole)

      // Create or update profile
      if (!profile) {
        // Create new profile - use minimal fields
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User',
            last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            role: userRole,
          })

        if (insertError) {
          console.error('❌ [OAuth Callback] Profile creation error:', insertError.message)
        } else {
          console.log('✅ [OAuth Callback] Created new profile for user')
        }
      } else {
        // Update existing profile with role
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: userRole })
          .eq('id', profile.id)

        if (updateError) {
          console.error('❌ [OAuth Callback] Profile update error:', updateError.message)
        } else {
          console.log('✅ [OAuth Callback] Updated profile with role')
        }
      }
    }

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
