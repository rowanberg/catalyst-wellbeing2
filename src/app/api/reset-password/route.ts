import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail } from '@/lib/email/smtp'
import { generatePasswordResetEmail } from '@/lib/email/templates'

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

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()
    console.log(`🔍 [Reset Password] Processing request for: ${normalizedEmail}`)

    // Generate password reset link directly
    // This handles user lookup internally and avoids pagination issues with listUsers()
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password-confirm`
      }
    })

    if (error) {
      console.warn(`⚠️ [Reset Password] Failed to generate link (User likely not found): ${error.message}`)
      // Return success to prevent email enumeration
      return NextResponse.json({
        message: 'If an account with that email exists, we\'ve sent password reset instructions.'
      })
    }

    // User exists if we got here
    const user = data.user

    if (!user) {
      console.error('❌ [Reset Password] Link generated but no user data returned')
      return NextResponse.json({
        message: 'If an account with that email exists, we\'ve sent password reset instructions.'
      })
    }

    console.log(`✅ [Reset Password] User found via generateLink: ${user.id}`)

    // Send password reset email via TurboSMTP
    console.log('📨 Preparing to send password reset email...')
    try {
      // Use Supabase's action_link directly - it contains the proper hashed token
      // Don't try to reconstruct it as that breaks the PKCE flow
      const resetUrl = data.properties?.action_link || ''

      const firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'User'
      const userRole = user.user_metadata?.role || 'student' // Default to student if role not set

      console.log('📧 Email details:', {
        email: normalizedEmail,
        firstName,
        role: userRole,
        hasResetUrl: !!resetUrl
      })

      // Generate professional email template
      const emailHtml = generatePasswordResetEmail({
        url: resetUrl,
        name: firstName,
        role: userRole
      })

      // Send email via TurboSMTP
      await sendEmail({
        to: normalizedEmail,
        subject: 'Reset Your Password - CatalystWells',
        html: emailHtml,
        from: '"CatalystWells Accounts" <accounts@catalystwells.in>'
      })

      console.log('✅ Password reset email sent to:', normalizedEmail)
    } catch (emailError) {
      console.error('❌ Error sending password reset email:', emailError)
      // Don't fail the request if email sending fails
    }

    // Log the reset link for development (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Password reset link (DEV ONLY):', data.properties?.action_link)
    }

    return NextResponse.json({
      message: 'If an account with that email exists, we\'ve sent password reset instructions.'
    })
  } catch (error) {
    console.error('Reset password API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
