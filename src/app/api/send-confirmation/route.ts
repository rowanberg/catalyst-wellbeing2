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

    // Generate confirmation link and send email
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (error) {
      console.error('Send confirmation error:', error)
      return NextResponse.json(
        { message: `Failed to send confirmation email: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Confirmation email sent successfully to:', email)
    return NextResponse.json({ 
      message: 'Confirmation email sent successfully'
    })
  } catch (error) {
    console.error('Send confirmation API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
