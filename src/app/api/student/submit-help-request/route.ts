import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { encryptMessage } from '@/lib/schoolEncryption'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { withRateLimit } from '@/lib/security/rateLimiter'

// Sanitize user input to prevent XSS attacks
function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*?>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .trim()
    .substring(0, 5000); // Limit message length
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const { message, urgency } = await request.json()

      if (!message || !urgency) {
        return NextResponse.json({ 
          error: 'Message and urgency are required' 
        }, { status: 400 })
      }
      
      // Validate message length and content
      if (message.length < 10) {
        return NextResponse.json({ 
          error: 'Message must be at least 10 characters long' 
        }, { status: 400 })
      }
      
      if (message.length > 5000) {
        return NextResponse.json({ 
          error: 'Message is too long (maximum 5000 characters)' 
        }, { status: 400 })
      }
      
      // Validate urgency level
      const validUrgencyLevels = ['low', 'medium', 'high'];
      if (!validUrgencyLevels.includes(urgency)) {
        return NextResponse.json({ 
          error: 'Invalid urgency level' 
        }, { status: 400 })
      }
      
      // Sanitize message to prevent XSS
      const sanitizedMessage = sanitizeInput(message);

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
    let encryptedMessage: string | null = null
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
        message: sanitizedMessage, // Store sanitized text
        encrypted_message: encryptedMessage,
        school_encryption_key: schoolEncryptionKey || null,
        urgency: urgency,
        status: 'pending',
        created_at: new Date().toISOString()
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
          urgency: urgency,
          status: helpRequest.status,
          created_at: helpRequest.created_at
        },
        message: 'Your help request has been submitted successfully. A trusted adult will respond soon.'
      })

    } catch (error: any) {
      console.error('Submit help request API error');
      // Never expose internal error details to client
      return NextResponse.json(
        { 
          error: 'Failed to submit help request. Please try again.',
          code: 'HELP_REQUEST_ERROR'
        },
        { status: 500 }
      )
    }
  }, 'helpRequest');
}
