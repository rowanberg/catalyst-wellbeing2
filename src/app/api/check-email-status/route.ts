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

    // Get user by email to check verification status
    const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Error fetching users:', getUserError)
      return NextResponse.json(
        { message: 'Failed to check email status' },
        { status: 500 }
      )
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { 
          verified: false,
          exists: false,
          message: 'User not found' 
        },
        { status: 404 }
      )
    }

    const isVerified = !!user.email_confirmed_at

    return NextResponse.json({ 
      verified: isVerified,
      exists: true,
      confirmedAt: user.email_confirmed_at,
      message: isVerified ? 'Email is verified' : 'Email is not verified'
    })
  } catch (error) {
    console.error('Check email status API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
