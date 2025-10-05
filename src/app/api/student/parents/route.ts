import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    // Get authentication from cookies
    const cookieStore = await cookies()
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    
    const authToken = cookieStore.get('sb-access-token')?.value
    const refreshToken = cookieStore.get('sb-refresh-token')?.value

    if (!authToken || !refreshToken) {
      return NextResponse.json({ error: 'No authentication token found' }, { status: 401 })
    }

    // Set session for the client
    await supabaseClient.auth.setSession({
      access_token: authToken,
      refresh_token: refreshToken
    })

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    // Get student profile to ensure they are a student
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Access denied. Student role required.' }, { status: 403 })
    }

    // Fetch parents linked to this student
    const { data: relationships, error: relationshipsError } = await supabaseAdmin
      .from('parent_child_relationships')
      .select(`
        id,
        parent_profile:parent_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          user_id
        )
      `)
      .eq('child_id', profile.id)

    if (relationshipsError) {
      console.error('Error fetching parent relationships:', relationshipsError)
      return NextResponse.json({ error: 'Failed to fetch parent relationships' }, { status: 500 })
    }

    // Transform the data for frontend consumption
    const parents = relationships?.map((rel: any) => ({
      id: rel.parent_profile?.id,
      name: `${rel.parent_profile?.first_name || ''} ${rel.parent_profile?.last_name || ''}`.trim(),
      email: rel.parent_profile?.email,
      phone: rel.parent_profile?.phone || '',
      user_id: rel.parent_profile?.user_id,
      relationship_id: rel.id
    })) || []

    return NextResponse.json({ 
      parents,
      student: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`
      }
    })

  } catch (error: any) {
    console.error('Error in student parents API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
