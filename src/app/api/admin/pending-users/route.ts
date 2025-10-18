import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    // Get all auth users
    const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUserError) {
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: getUserError.message
      }, { status: 500 })
    }

    // Get all profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name, role, created_at')

    if (profileError) {
      return NextResponse.json({
        error: 'Failed to fetch profiles',
        details: profileError.message
      }, { status: 500 })
    }

    // Find users without profiles (pending approval)
    const profileUserIds = new Set(profiles?.map(p => p.user_id) || [])
    const pendingUsers = users.users.filter((user: any) => !profileUserIds.has(user.id))

    const pendingUsersWithDetails = pendingUsers.map((user: any) => ({
      id: user.id,
      email: user.email,
      email_confirmed: !!user.email_confirmed_at,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    }))

    return NextResponse.json({
      pending_users: pendingUsersWithDetails,
      count: pendingUsersWithDetails.length
    })
  } catch (error) {
    console.error('Pending users API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, firstName, lastName, role, action } = await request.json()

    if (action === 'approve') {
      // Get default school
      const { data: schools, error: schoolsError } = await supabaseAdmin
        .from('schools')
        .select('*')
        .limit(1)

      if (schoolsError || !schools || schools.length === 0) {
        return NextResponse.json({
          message: 'No schools found. Please create a school first.',
          error: schoolsError?.message
        }, { status: 400 })
      }

      const defaultSchool = schools[0]

      // Create profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userId,
          first_name: firstName || 'Student',
          last_name: lastName || 'User',
          role: role || 'student',
          school_id: defaultSchool.id,
          xp: 0,
          gems: 0,
          level: 1,
        })
        .select()
        .single()

      if (profileError) {
        return NextResponse.json({
          message: 'Failed to create profile',
          error: profileError.message
        }, { status: 500 })
      }

      // Confirm user email by setting email_confirmed_at timestamp
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      )
      
      if (confirmError) {
        console.error('⚠️ Failed to confirm email for user:', userId, confirmError)
        // Continue anyway - profile is created, user can still log in
      } else {
        console.log('✅ Email confirmed for user:', userId)
      }

      return NextResponse.json({
        message: 'User approved successfully and email confirmed',
        profile: profile,
        email_confirmed: !confirmError
      })
    } else if (action === 'reject') {
      // Delete user from auth
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (deleteError) {
        return NextResponse.json({
          message: 'Failed to reject user',
          error: deleteError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        message: 'User rejected and removed successfully'
      })
    }

    return NextResponse.json({
      message: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Approve/reject user API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
