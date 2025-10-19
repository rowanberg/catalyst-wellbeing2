import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/login'

  if (token_hash && type) {
    // Handle password reset (recovery) - redirect to reset password page with token
    if (type === 'recovery') {
      // Don't verify the token here - let the reset-password-confirm page handle it
      // Just redirect with the token_hash preserved
      return NextResponse.redirect(
        new URL(`/auth/reset-password-confirm?token_hash=${token_hash}&type=${type}`, request.url)
      )
    }

    // Handle email confirmation and other types
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      // Email confirmed successfully
      return NextResponse.redirect(new URL(`/email-confirmed?message=Your email has been verified successfully! You can now access all features.`, request.url))
    } else {
      // Error confirming email
      console.error('Email confirmation error:', error)
      return NextResponse.redirect(new URL(`/login?error=Email confirmation failed. Please try again.`, request.url))
    }
  }

  // Invalid or missing parameters
  return NextResponse.redirect(new URL('/login?error=Invalid confirmation link.', request.url))
}
