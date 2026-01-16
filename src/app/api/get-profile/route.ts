import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Check for empty body
    const text = await request.text()
    if (!text) {
      return NextResponse.json(
        { message: 'Request body is empty' },
        { status: 400 }
      )
    }
    const { userId } = JSON.parse(text)

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Authenticate the user
    const supabaseUser = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Security check: Ensure user is fetching their own profile
    if (user.id !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Use Service Role to bypass potential RLS recursion
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

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
            *,
            schools!fk_profiles_school_id (
                id,
                name,
                school_code,
                logo_url
            )
        `)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            message: 'Profile not found. Your account may not be fully set up yet. Please contact your school administrator.',
            code: 'PROFILE_NOT_FOUND'
          },
          { status: 404 }
        )
      }
      console.error('Database error in get-profile:', error)
      throw error
    }

    // Normalize response
    const profile = {
      ...data,
      full_name: `${data.first_name} ${data.last_name}`.trim(),
      school: Array.isArray(data.schools) ? data.schools[0] : data.schools
    }
    delete profile.schools

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
