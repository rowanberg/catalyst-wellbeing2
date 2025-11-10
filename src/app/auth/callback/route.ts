import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
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
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the user to determine redirect
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Fetch profile to determine dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (profile?.role) {
          // Redirect based on role
          const dashboards: Record<string, string> = {
            student: '/student/dashboard',
            teacher: '/teacher/dashboard',
            parent: '/parent/dashboard',
            admin: '/admin/dashboard',
          }
          
          const dashboard = dashboards[profile.role] || '/student/dashboard'
          return NextResponse.redirect(`${origin}${dashboard}`)
        }
      }
    }
  }

  // Return the user to an error page with some instructions or home page
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
