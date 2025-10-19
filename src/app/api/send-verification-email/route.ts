import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verification email endpoint called')
    
    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ SENDGRID_API_KEY is not configured in environment variables')
      return NextResponse.json(
        { error: 'SendGrid is not configured. Please add SENDGRID_API_KEY to .env.local' },
        { status: 500 }
      )
    }

    // Check if FROM email is configured
    if (!process.env.SENDGRID_FROM_EMAIL) {
      console.error('❌ SENDGRID_FROM_EMAIL is not configured in environment variables')
      return NextResponse.json(
        { error: 'SendGrid FROM email is not configured. Please add SENDGRID_FROM_EMAIL to .env.local' },
        { status: 500 }
      )
    }

    // Initialize SendGrid with API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    console.log('✅ SendGrid API key configured')
    
    const { email, firstName, verificationUrl } = await request.json()

    if (!email || !firstName || !verificationUrl) {
      console.error('❌ Missing required fields:', { hasEmail: !!email, hasFirstName: !!firstName, hasVerificationUrl: !!verificationUrl })
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, and verificationUrl are required' },
        { status: 400 }
      )
    }

    console.log('📧 Sending verification email to:', email)
    console.log('🔗 Verification URL:', verificationUrl.substring(0, 50) + '...')

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@catalystwells.com',
      subject: 'Verify Your Email - Catalyst Wellbeing',
      text: `Hi ${firstName},\n\nPlease verify your email by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nThanks,\nThe Catalyst Team`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Catalyst!</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e1e8ed; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #2d3748; margin-top: 0;">Hi ${firstName},</h2>
              
              <p style="color: #4a5568; font-size: 16px;">
                Thank you for registering with Catalyst Wellbeing. To complete your registration and access your account, please verify your email address.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="background: #f7fafc; padding: 12px; border-radius: 6px; word-break: break-all; color: #4a5568; font-size: 12px;">
                ${verificationUrl}
              </p>
              
              <div style="background: #fef5e7; border-left: 4px solid #f39c12; padding: 12px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #8b6914; font-size: 14px;">
                  <strong>Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with Catalyst, you can safely ignore this email.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e1e8ed; margin: 30px 0;">
              
              <div style="text-align: center;">
                <p style="color: #718096; font-size: 13px; margin: 5px 0;">
                  Need help? Contact us at support@catalystwells.com
                </p>
                <p style="color: #a0aec0; font-size: 12px; margin: 5px 0;">
                  © 2024 Catalyst Wellbeing. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    }

    console.log('📤 Attempting to send email via SendGrid...')
    const result = await sgMail.send(msg)
    console.log('✅ Email sent successfully!', result)

    return NextResponse.json(
      { success: true, message: 'Verification email sent successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ SendGrid Error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    })
    
    // Provide specific error messages
    let errorMessage = 'Failed to send verification email'
    if (error.code === 403) {
      errorMessage = 'SendGrid API key is invalid or does not have permission to send emails'
    } else if (error.code === 401) {
      errorMessage = 'SendGrid API key is not authorized'
    } else if (error.message?.includes('from')) {
      errorMessage = 'The FROM email address is not verified in SendGrid'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
