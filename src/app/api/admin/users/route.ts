import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID required' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('profiles')
      .select(`
        *,
        schools!inner(name, school_code)
      `)
      .eq('school_id', schoolId)

    if (role) {
      query = query.eq('role', role)
    }

    const { data: profiles, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get emails from auth.users table
    const userIds = profiles?.map(profile => profile.id) || []
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch user emails' }, { status: 500 })
    }

    // Merge profile data with email from auth users
    const users = profiles?.map(profile => {
      const authUser = authUsers.users.find(user => user.id === profile.user_id)
      return {
        ...profile,
        email: authUser?.email || 'No email'
      }
    })

    console.log('🔍 Users API - Returning user IDs:', users?.map(u => ({ id: u.id, user_id: u.user_id, name: `${u.first_name} ${u.last_name}` })))

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Admin users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, role, schoolId } = await request.json()

    // Create user with admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        role,
        school_id: schoolId,
        xp: 0,
        gems: 0,
        level: 1,
      })
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ user: authData.user, profile })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
