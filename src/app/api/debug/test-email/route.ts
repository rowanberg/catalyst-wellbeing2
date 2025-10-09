import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🧪 Debug email API called')
  
  try {
    // Safely parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json({
        success: false,
        message: 'Invalid JSON in request body',
        error: 'Request parsing failed'
      }, { status: 400 })
    }

    const { email, type = 'signup' } = body

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email is required',
        error: 'Missing email parameter'
      }, { status: 400 })
    }

    console.log('📧 Testing email delivery to:', email)
    console.log('📋 Email type:', type)

    // Check if Supabase is available
    let supabaseAdmin
    try {
      const { supabaseAdmin: admin } = await import('@/lib/supabaseAdmin')
      supabaseAdmin = admin
      console.log('✅ Supabase admin client loaded')
    } catch (supabaseError) {
      console.error('❌ Failed to load Supabase admin:', supabaseError)
      return NextResponse.json({
        success: false,
        message: 'Supabase configuration error',
        error: 'Failed to initialize Supabase admin client',
        troubleshooting: {
          commonCauses: [
            'Missing SUPABASE_SERVICE_ROLE_KEY in environment variables',
            'Invalid Supabase URL or key',
            'Supabase admin client not properly configured'
          ],
          solutions: [
            'Check .env.local file for SUPABASE_SERVICE_ROLE_KEY',
            'Verify Supabase project URL and keys',
            'Restart development server after adding environment variables'
          ]
        }
      }, { status: 500 })
    }

    // Test different email types
    let result
    let emailType = type

    try {
      console.log('📤 Attempting to send email via Supabase...')
      
      if (type === 'signup' || type === 'confirmation') {
        console.log('📤 Sending signup confirmation email...')
        result = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink', // Use magiclink instead of signup to avoid password requirement
          email: email,
        })
        emailType = 'Signup Confirmation'
      } else if (type === 'recovery' || type === 'reset') {
        console.log('📤 Sending password reset email...')
        result = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
        })
        emailType = 'Password Reset'
      } else if (type === 'magiclink') {
        console.log('📤 Sending magic link email...')
        result = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
        })
        emailType = 'Magic Link'
      } else {
        return NextResponse.json({
          success: false,
          message: 'Invalid email type',
          error: `Unsupported email type: ${type}`,
          supportedTypes: ['signup', 'recovery', 'magiclink']
        }, { status: 400 })
      }

      console.log('📊 Supabase response:', result)

      if (result?.error) {
        console.error('❌ Supabase email error:', result.error)
        return NextResponse.json({
          success: false,
          message: `Failed to send ${emailType.toLowerCase()} email`,
          error: result.error.message || 'Unknown Supabase error',
          errorCode: result.error.code || 'UNKNOWN',
          troubleshooting: {
            commonCauses: [
              'SMTP not configured in Supabase',
              'Rate limiting (3 emails/hour on free tier)',
              'Invalid email address',
              'Email templates not configured',
              'Supabase project not properly set up'
            ],
            nextSteps: [
              'Check Supabase Auth logs in dashboard',
              'Verify SMTP settings in Authentication > Settings',
              'Try different email address (Gmail, Yahoo)',
              'Check spam folder',
              'Wait 1 hour if rate limited'
            ]
          }
        }, { status: 500 })
      }

      if (result?.data) {
        console.log('✅ Email sent successfully!')
        console.log('📧 Email data:', {
          actionLink: result.data.properties?.action_link,
          emailOtp: result.data.properties?.email_otp,
          redirectTo: result.data.properties?.redirect_to
        })

        return NextResponse.json({
          success: true,
          message: `${emailType} email sent successfully!`,
          emailType,
          recipient: email,
          data: {
            actionLink: result.data.properties?.action_link,
            emailOtp: result.data.properties?.email_otp,
            redirectTo: result.data.properties?.redirect_to,
            // Include link for development testing
            ...(process.env.NODE_ENV === 'development' && {
              devLink: result.data.properties?.action_link
            })
          },
          instructions: [
            'Check your email inbox',
            'Look in spam/junk folder',
            'Check promotions tab (Gmail)',
            'Wait up to 5 minutes for delivery'
          ]
        })
      } else {
        console.error('❌ Unexpected Supabase response format:', result)
        return NextResponse.json({
          success: false,
          message: 'Unexpected response from Supabase',
          error: 'Invalid response format',
          rawResponse: result
        }, { status: 500 })
      }

    } catch (emailError: any) {
      console.error('❌ Email sending failed:', emailError)
      
      return NextResponse.json({
        success: false,
        message: 'Email sending failed',
        error: emailError.message || 'Unknown email error',
        errorType: emailError.constructor.name,
        troubleshooting: {
          possibleCauses: [
            'Supabase email service not configured',
            'Invalid email address format',
            'Rate limiting exceeded (3/hour on free tier)',
            'SMTP authentication failed',
            'Network connectivity issues'
          ],
          solutions: [
            'Configure custom SMTP in Supabase dashboard',
            'Verify email address is valid',
            'Wait 1 hour before sending another email',
            'Check Supabase project settings',
            'Try using a different email service (Resend, SendGrid)'
          ]
        }
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Debug email API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message || 'Unknown server error',
      errorType: error.constructor?.name || 'UnknownError',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      troubleshooting: {
        immediateActions: [
          'Check server console for detailed error logs',
          'Verify environment variables are set',
          'Restart development server',
          'Check network connectivity'
        ]
      }
    }, { status: 500 })
  }
}

// GET endpoint for quick testing
export async function GET(request: NextRequest) {
  console.log('🧪 Debug email API GET called')
  
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const type = searchParams.get('type') || 'signup'

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email parameter required',
        usage: 'GET /api/debug/test-email?email=test@example.com&type=signup',
        supportedTypes: ['signup', 'recovery', 'magiclink'],
        examples: [
          '/api/debug/test-email?email=your-email@gmail.com&type=recovery',
          '/api/debug/test-email?email=test@yahoo.com&type=signup',
          '/api/debug/test-email?email=user@example.com&type=magiclink'
        ]
      })
    }

    // Create a mock request for the POST handler
    const mockRequest = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type })
    })

    return POST(mockRequest as NextRequest)
  } catch (error: any) {
    console.error('❌ GET handler error:', error)
    return NextResponse.json({
      success: false,
      message: 'GET handler failed',
      error: error.message
    }, { status: 500 })
  }
}
