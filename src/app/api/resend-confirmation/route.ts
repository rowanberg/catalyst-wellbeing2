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

    // Resend confirmation email using admin client
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (error) {
      console.error('Resend confirmation error:', error)
      return NextResponse.json(
        { message: 'Failed to resend confirmation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Confirmation email sent successfully' 
    })
  } catch (error) {
    console.error('Resend confirmation API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
