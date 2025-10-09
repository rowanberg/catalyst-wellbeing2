import { NextRequest, NextResponse } from 'next/server'

// Backup email service using fetch (works with Resend, SendGrid, etc.)
export async function POST(request: NextRequest) {
  try {
    const { email, type = 'confirmation', resetUrl } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // For now, we'll use a simple email service
    // You can replace this with Resend, SendGrid, or any other service
    
    console.log('📧 Backup email service called')
    console.log('📤 Sending email to:', email)
    console.log('📋 Email type:', type)

    // Example using Resend API (you'll need to sign up at resend.com)
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    
    if (RESEND_API_KEY) {
      try {
        const emailContent = generateEmailContent(type, resetUrl)
        
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Catalyst <noreply@yourdomain.com>', // Replace with your domain
            to: [email],
            subject: emailContent.subject,
            html: emailContent.html,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log('✅ Email sent via Resend:', result.id)
          
          return NextResponse.json({
            success: true,
            message: 'Email sent successfully via backup service',
            provider: 'Resend',
            emailId: result.id
          })
        } else {
          const error = await response.json()
          console.error('❌ Resend API error:', error)
          throw new Error(error.message || 'Resend API failed')
        }
      } catch (resendError) {
        console.error('❌ Resend service failed:', resendError)
        // Fall through to manual email generation
      }
    }

    // Fallback: Generate email content for manual sending
    const emailContent = generateEmailContent(type, resetUrl)
    
    console.log('📧 Generated email content for manual sending:')
    console.log('Subject:', emailContent.subject)
    console.log('HTML content generated (check console for full content)')
    
    // In development, log the email content
    if (process.env.NODE_ENV === 'development') {
      console.log('=== EMAIL CONTENT START ===')
      console.log('To:', email)
      console.log('Subject:', emailContent.subject)
      console.log('HTML:', emailContent.html)
      console.log('=== EMAIL CONTENT END ===')
    }

    return NextResponse.json({
      success: true,
      message: 'Email content generated (check server logs)',
      provider: 'Manual/Development',
      instructions: [
        'Check server console for email content',
        'Copy the HTML content to send manually',
        'Or configure Resend API key for automatic sending'
      ],
      setupInstructions: {
        resend: {
          step1: 'Sign up at https://resend.com',
          step2: 'Get your API key',
          step3: 'Add RESEND_API_KEY to your .env.local file',
          step4: 'Verify your sending domain'
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Backup email service error:', error)
    return NextResponse.json({
      success: false,
      message: 'Backup email service failed',
      error: error.message
    }, { status: 500 })
  }
}

function generateEmailContent(type: string, resetUrl?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  if (type === 'reset' || type === 'recovery') {
    return {
      subject: '🔑 Reset Your Catalyst Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Reset Your Password</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Catalyst Wellbeing Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #2d3748; margin-top: 0;">Password Reset Request</h2>
            <p>We received a request to reset your Catalyst account password.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl || baseUrl + '/auth/reset-password-confirm'}" 
                 style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                🔑 Reset My Password
              </a>
            </div>
            
            <p><strong>Security Information:</strong></p>
            <ul>
              <li>This link expires in 1 hour for your security</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Your account remains secure</li>
            </ul>
            
            <p>If the button doesn't work, copy and paste this link:</p>
            <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">
              ${resetUrl || baseUrl + '/auth/reset-password-confirm'}
            </p>
          </div>
          
          <div style="text-align: center; color: #6c757d; font-size: 14px;">
            <p>© 2024 Catalyst Wellbeing Platform. All rights reserved.</p>
            <p>Need help? Contact support@catalyst.com</p>
          </div>
        </body>
        </html>
      `
    }
  } else {
    // Confirmation email
    return {
      subject: '🎉 Welcome to Catalyst - Confirm Your Email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Welcome to Catalyst</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Catalyst!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Wellbeing Journey Starts Here</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #2d3748; margin-top: 0;">You're Almost Ready!</h2>
            <p>Just one more step to unlock your personalized wellbeing experience.</p>
            
            <div style="background: linear-gradient(135deg, #ffeaa7, #fdcb6e); padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; border: 2px solid #f39c12;">
              <p style="margin: 0; color: #d35400; font-weight: bold;">🏆 Achievement Unlocked! 🏆</p>
              <p style="margin: 5px 0 0 0; color: #2d3748;"><strong>Account Creator</strong> <span style="color: #27ae60;">+50 XP</span></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/auth/confirm" 
                 style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                🚀 Confirm My Account
              </a>
            </div>
            
            <h3 style="color: #2d3748;">✨ What Awaits You</h3>
            <div style="display: flex; justify-content: space-around; text-align: center; margin: 20px 0;">
              <div>
                <div style="font-size: 24px;">💎</div>
                <p style="margin: 5px 0; font-size: 14px; font-weight: bold;">Earn Gems & XP</p>
              </div>
              <div>
                <div style="font-size: 24px;">🎯</div>
                <p style="margin: 5px 0; font-size: 14px; font-weight: bold;">Daily Quests</p>
              </div>
              <div>
                <div style="font-size: 24px;">❤️</div>
                <p style="margin: 5px 0; font-size: 14px; font-weight: bold;">Wellbeing Focus</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; color: #6c757d; font-size: 14px;">
            <p>© 2024 Catalyst Wellbeing Platform. All rights reserved.</p>
            <p>"Every expert was once a beginner. Your journey starts today! 🌟"</p>
          </div>
        </body>
        </html>
      `
    }
  }
}
