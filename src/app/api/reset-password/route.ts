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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Error fetching users:', getUserError)
      return NextResponse.json(
        { message: 'Failed to process request' },
        { status: 500 }
      )
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      // For security, we don't reveal if the email exists or not
      // Always return success to prevent email enumeration attacks
      return NextResponse.json({ 
        message: 'If an account with that email exists, we\'ve sent password reset instructions.'
      })
    }

    // Generate password reset link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password-confirm`
      }
    })

    if (error) {
      console.error('Password reset error:', error)
      return NextResponse.json(
        { message: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      )
    }

    console.log('Password reset email sent successfully to:', email)
    
    // Log the reset link for development (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Password reset link (DEV ONLY):', data.properties?.action_link)
    }

    return NextResponse.json({ 
      message: 'If an account with that email exists, we\'ve sent password reset instructions.',
      // Include action link for development/testing (remove in production)
      ...(process.env.NODE_ENV === 'development' && { 
        actionUrl: data.properties?.action_link 
      })
    })
  } catch (error) {
    console.error('Reset password API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
