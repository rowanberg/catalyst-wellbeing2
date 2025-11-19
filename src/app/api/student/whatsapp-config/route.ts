import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabase, userId } = auth

    // Get user's WhatsApp configuration
    const { data: whatsappConfig, error } = await supabase
      .from('student_whatsapp_config')
      .select('phone_number, whatsapp_link, is_enabled')
      .eq('student_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching WhatsApp config:', error)
      return NextResponse.json({ error: 'Failed to fetch WhatsApp configuration' }, { status: 500 })
    }

    // Return configuration or defaults
    return NextResponse.json({
      phoneNumber: whatsappConfig?.phone_number || '',
      whatsappLink: whatsappConfig?.whatsapp_link || '',
      isEnabled: whatsappConfig?.is_enabled || false
    })

  } catch (error) {
    console.error('WhatsApp config GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabase, userId } = auth

    const body = await request.json()
    const { phoneNumber, whatsappLink, isEnabled } = body

    // Validate phone number format if provided
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/\D/g, '')
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }
    }

    // Validate WhatsApp link format if provided
    if (whatsappLink && !whatsappLink.startsWith('https://wa.me/')) {
      return NextResponse.json(
        { error: 'Invalid WhatsApp link format. Must start with https://wa.me/' },
        { status: 400 }
      )
    }

    // Upsert WhatsApp configuration
    const { error } = await supabase
      .from('student_whatsapp_config')
      .upsert({
        student_id: userId,
        phone_number: phoneNumber || null,
        whatsapp_link: whatsappLink || null,
        is_enabled: isEnabled || false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id'
      })

    if (error) {
      console.error('Error saving WhatsApp config:', error)
      return NextResponse.json({ error: 'Failed to save WhatsApp configuration' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'WhatsApp configuration saved successfully',
      phoneNumber,
      whatsappLink,
      isEnabled
    })

  } catch (error) {
    console.error('WhatsApp config PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
