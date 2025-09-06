import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Get user by email from auth
    const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUserError) {
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: getUserError.message
      }, { status: 500 })
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({
        found: false,
        message: 'User not found in auth system',
        email: email
      })
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        schools (
          id,
          name,
          school_code
        )
      `)
      .eq('user_id', user.id)
      .single()

    // Check schools table
    const { data: schools, error: schoolsError } = await supabaseAdmin
      .from('schools')
      .select('*')

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      profile: {
        found: !!profile,
        data: profile,
        error: profileError?.message
      },
      schools: {
        count: schools?.length || 0,
        data: schools,
        error: schoolsError?.message
      },
      debug_info: {
        user_id: user.id,
        profile_query_error: profileError?.code,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Debug profile API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
