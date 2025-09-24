import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { encryptMessage } from '@/lib/schoolEncryption'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const { message, urgency } = await request.json()

    if (!message || !urgency) {
      return NextResponse.json({ 
        error: 'Message and urgency are required' 
      }, { status: 400 })
    }

    // Get student's session
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // No-op for server-side
          },
          remove(name: string, options: any) {
            // No-op for server-side
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student's profile and school information
    const { data: studentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        schools!profiles_school_id_fkey (
          id,
          name,
          messaging_encryption_key
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (profileError || !studentProfile || !studentProfile.schools) {
      console.error('Student profile or school not found:', profileError)
      return NextResponse.json({ 
        error: 'Student profile or school not found'
      }, { status: 403 })
    }

    const studentSchool = studentProfile.schools
    const schoolEncryptionKey = studentSchool.messaging_encryption_key

    // Encrypt the message using school's encryption key (if key exists)
    let encryptedMessage = null
    if (schoolEncryptionKey) {
      try {
        encryptedMessage = encryptMessage(message, schoolEncryptionKey)
      } catch (error: any) {
        console.error('Encryption failed, proceeding without encryption:', error)
      }
    }

    // Create help request with encrypted message and school_code
    const { data: helpRequest, error: helpRequestError } = await supabaseAdmin
      .from('help_requests')
      .insert({
        student_id: user.id,
        school_id: studentSchool.id,
        school_code: studentProfile.school_code,
        message: message, // Store plain text for fallback
        encrypted_message: encryptedMessage,
        school_encryption_key: schoolEncryptionKey || null,
        urgency: urgency,
        status: 'pending'
      })
      .select()
      .single()

    if (helpRequestError) {
      console.error('Error creating help request:', helpRequestError)
      return NextResponse.json({ 
        error: 'Failed to submit help request',
        details: helpRequestError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      helpRequest: {
        id: helpRequest.id,
        message: message,
        urgency: urgency,
        status: helpRequest.status,
        school: studentSchool.name,
        created_at: helpRequest.created_at
      }
    })

  } catch (error: any) {
    console.error('Submit help request API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
