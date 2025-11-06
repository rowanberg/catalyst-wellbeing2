import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SESClient, SendEmailCommand } from 'npm:@aws-sdk/client-ses@3.621.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize SES Client
const sesClient = new SESClient({
  region: Deno.env.get('AWS_SES_REGION') || 'us-east-1',
  credentials: {
    accessKeyId: Deno.env.get('AWS_SES_ACCESS_KEY_ID') || '',
    secretAccessKey: Deno.env.get('AWS_SES_SECRET_ACCESS_KEY') || '',
  },
})

interface EmailRequest {
  type: 'welcome' | 'verification' | 'password-reset' | 'custom'
  to: string | string[]
  name: string
  role: 'student' | 'teacher' | 'parent' | 'admin'
  url?: string
  subject?: string
  html?: string
  text?: string
  schoolName?: string
}

// Role-specific color schemes
const roleColors = {
  student: {
    primary: '#4F46E5', // Indigo-600
    secondary: '#818CF8', // Indigo-400
    gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    light: '#EEF2FF', // Indigo-50
    border: '#C7D2FE', // Indigo-200
    text: '#312E81', // Indigo-900
    icon: '🎓',
    title: 'Student Portal'
  },
  teacher: {
    primary: '#9333EA', // Purple-600
    secondary: '#C084FC', // Purple-400
    gradient: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
    light: '#FAF5FF', // Purple-50
    border: '#E9D5FF', // Purple-200
    text: '#581C87', // Purple-900
    icon: '👩‍🏫',
    title: 'Teacher Dashboard'
  },
  parent: {
    primary: '#059669', // Emerald-600
    secondary: '#34D399', // Emerald-400
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    light: '#ECFDF5', // Emerald-50
    border: '#A7F3D0', // Emerald-200
    text: '#065F46', // Emerald-900
    icon: '👨‍👩‍👧',
    title: 'Parent Portal'
  },
  admin: {
    primary: '#1E40AF', // Blue-800
    secondary: '#60A5FA', // Blue-400
    gradient: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
    light: '#EFF6FF', // Blue-50
    border: '#BFDBFE', // Blue-200
    text: '#1E3A8A', // Blue-900
    icon: '⚡',
    title: 'Admin Control Panel'
  }
}

// Professional Welcome Email Template
function getWelcomeEmailHTML(name: string, role: 'student' | 'teacher' | 'parent' | 'admin', schoolName?: string): string {
  const colors = roleColors[role]
  const currentYear = new Date().getFullYear()
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Catalyst Wellbeing</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #F9FAFB; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F9FAFB;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header with Role-Specific Gradient -->
          <tr>
            <td style="background: ${colors.gradient}; padding: 48px 40px; text-align: center;">
              <div style="font-size: 56px; line-height: 1; margin-bottom: 16px;">${colors.icon}</div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Catalyst</h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 500;">${colors.title}</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 48px 40px;">
              
              <!-- Personalized Greeting -->
              <div style="margin-bottom: 32px;">
                <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px; font-weight: 600;">Hello ${name}! 👋</h2>
                <p style="margin: 0; color: #6B7280; font-size: 16px; line-height: 1.6;">
                  Welcome to <strong style="color: ${colors.primary};">Catalyst Wellbeing</strong> – your comprehensive education management platform. We're thrilled to have you join us${schoolName ? ` at <strong>${schoolName}</strong>` : ''}.
                </p>
              </div>
              
              <!-- Role-Specific Welcome Message -->
              <div style="background: ${colors.light}; border-left: 4px solid ${colors.primary}; border-radius: 8px; padding: 20px 24px; margin-bottom: 32px;">
                <p style="margin: 0; color: ${colors.text}; font-size: 15px; line-height: 1.6;">
                  ${getRoleSpecificMessage(role)}
                </p>
              </div>
              
              <!-- Key Features -->
              <div style="margin-bottom: 32px;">
                <h3 style="margin: 0 0 20px 0; color: #374151; font-size: 18px; font-weight: 600;">What You Can Do:</h3>
                ${getRoleFeatures(role, colors)}
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 10px; background: ${colors.gradient}; text-align: center;">
                    <a href="${Deno.env.get('APP_URL') || 'https://catalystwells.com'}/login" 
                       style="display: inline-block; padding: 16px 48px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.3px;">
                      Access Your Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Help Section -->
              <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #E5E7EB;">
                <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #374151;">Need help getting started?</strong><br>
                  Our support team is here to assist you. Reply to this email or visit our Help Center.
                </p>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 32px 40px; border-top: 1px solid #E5E7EB;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #9CA3AF; font-size: 13px;">
                      <strong style="color: #6B7280;">Catalyst Wellbeing</strong>
                    </p>
                    <p style="margin: 0 0 16px 0; color: #9CA3AF; font-size: 12px;">
                      Enterprise Education Management Platform
                    </p>
                    <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                      © ${currentYear} Catalyst Wellbeing. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// Email Verification Template
function getEmailVerificationHTML(name: string, role: 'student' | 'teacher' | 'parent' | 'admin', verificationUrl: string): string {
  const colors = roleColors[role]
  const currentYear = new Date().getFullYear()
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #F9FAFB;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F9FAFB;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: ${colors.gradient}; padding: 48px 40px; text-align: center;">
              <div style="font-size: 64px; line-height: 1; margin-bottom: 16px;">✉️</div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700;">Verify Your Email</h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">Complete your Catalyst account setup</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 22px; font-weight: 600;">Hi ${name}! 👋</h2>
              
              <p style="margin: 0 0 24px 0; color: #6B7280; font-size: 16px; line-height: 1.6;">
                Thank you for registering with <strong style="color: ${colors.primary};">Catalyst Wellbeing</strong>. To complete your ${role} account setup, please verify your email address.
              </p>
              
              <!-- Verification Box -->
              <div style="background: ${colors.light}; border: 2px solid ${colors.border}; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
                <p style="margin: 0 0 20px 0; color: ${colors.text}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Click below to verify
                </p>
                
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                  <tr>
                    <td style="border-radius: 10px; background: ${colors.gradient}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                      <a href="${verificationUrl}" 
                         style="display: inline-block; padding: 16px 40px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.3px;">
                        Verify Email Address →
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Security Notice -->
              <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400E; font-size: 13px; line-height: 1.6;">
                  <strong>⏱️ Time-Sensitive:</strong> This verification link will expire in <strong>24 hours</strong> for security purposes.
                </p>
              </div>
              
              <p style="margin: 0; color: #9CA3AF; font-size: 14px; line-height: 1.6;">
                If you didn't create this account, you can safely ignore this email.
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 32px 40px; border-top: 1px solid #E5E7EB; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px; font-weight: 600;">Catalyst Wellbeing</p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">© ${currentYear} All rights reserved.</p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// Password Reset Template
function getPasswordResetHTML(name: string, role: 'student' | 'teacher' | 'parent' | 'admin', resetUrl: string): string {
  const colors = roleColors[role]
  const currentYear = new Date().getFullYear()
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #F9FAFB;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F9FAFB;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: ${colors.gradient}; padding: 48px 40px; text-align: center;">
              <div style="font-size: 64px; line-height: 1; margin-bottom: 16px;">🔐</div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700;">Reset Your Password</h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px;">Secure your ${colors.title}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 22px; font-weight: 600;">Hi ${name}! 👋</h2>
              
              <p style="margin: 0 0 24px 0; color: #6B7280; font-size: 16px; line-height: 1.6;">
                We received a request to reset the password for your Catalyst ${role} account. Click the button below to create a new password.
              </p>
              
              <!-- Reset Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 32px auto;">
                <tr>
                  <td style="border-radius: 10px; background: ${colors.gradient}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 16px 40px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.3px;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Security Warnings -->
              <div style="background: #FEE2E2; border-left: 4px solid #DC2626; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #7F1D1D; font-size: 13px; font-weight: 600;">⚠️ Important Security Notice:</p>
                <ul style="margin: 0; padding-left: 20px; color: #991B1B; font-size: 13px; line-height: 1.6;">
                  <li>This link expires in <strong>1 hour</strong></li>
                  <li>Only valid for one-time use</li>
                  <li>Don't share this link with anyone</li>
                </ul>
              </div>
              
              <div style="background: #F3F4F6; border-radius: 8px; padding: 16px 20px;">
                <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #374151;">Didn't request this?</strong><br>
                  If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                </p>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 32px 40px; border-top: 1px solid #E5E7EB; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px; font-weight: 600;">Catalyst Wellbeing</p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">© ${currentYear} All rights reserved.</p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// Helper: Get role-specific welcome message
function getRoleSpecificMessage(role: string): string {
  switch (role) {
    case 'student':
      return '🎓 <strong>Your Learning Journey Begins!</strong><br>Access your personalized student portal to view assignments, track your progress, connect with teachers, and unlock achievements as you excel in your studies.'
    case 'teacher':
      return '👩‍🏫 <strong>Empower Your Classroom!</strong><br>Your teacher dashboard is ready. Manage classes, track student progress, create assignments, analyze performance data, and engage with students and parents seamlessly.'
    case 'parent':
      return '👨‍👩‍👧 <strong>Stay Connected with Your Child\'s Education!</strong><br>Monitor your child\'s academic journey, view grades and attendance, communicate with teachers, and receive real-time updates on their progress and wellbeing.'
    case 'admin':
      return '⚡ <strong>Full System Control!</strong><br>Your admin control panel provides complete oversight of your institution. Manage users, configure settings, view analytics, and ensure smooth operation of all platform features.'
    default:
      return 'Your account is ready! Start exploring all the features available to you on the Catalyst platform.'
  }
}

// Helper: Get role-specific features
function getRoleFeatures(role: string, colors: any): string {
  const features: Record<string, string[]> = {
    student: [
      '<strong>📚 Assignments & Homework:</strong> View, submit, and track all your assignments',
      '<strong>📊 Grade Dashboard:</strong> Monitor your academic performance in real-time',
      '<strong>🎯 Achievement Center:</strong> Earn rewards and track your learning milestones',
      '<strong>💬 AI Homework Helper:</strong> Get instant help with your studies 24/7'
    ],
    teacher: [
      '<strong>👥 Class Management:</strong> Organize students, create groups, and manage rosters',
      '<strong>📝 Assignment Creation:</strong> Design and distribute assignments with ease',
      '<strong>📈 Performance Analytics:</strong> Track student progress with detailed insights',
      '<strong>✉️ Parent Communication:</strong> Send updates and share student achievements'
    ],
    parent: [
      '<strong>👁️ Real-Time Monitoring:</strong> Track your child\'s daily attendance and grades',
      '<strong>📧 Teacher Communication:</strong> Stay in touch with your child\'s educators',
      '<strong>📊 Progress Reports:</strong> View comprehensive academic performance analytics',
      '<strong>🔔 Smart Notifications:</strong> Get alerts for important updates and milestones'
    ],
    admin: [
      '<strong>🏫 School Management:</strong> Complete control over institution settings',
      '<strong>👤 User Administration:</strong> Manage students, teachers, and parents',
      '<strong>📊 System Analytics:</strong> Access comprehensive platform usage data',
      '<strong>⚙️ Configuration Tools:</strong> Customize platform features and permissions'
    ]
  }
  
  return (features[role] || features['student'])
    .map(feature => `
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <div style="flex-shrink: 0; width: 6px; height: 6px; background: ${colors.primary}; border-radius: 50%; margin-top: 7px; margin-right: 12px;"></div>
        <p style="margin: 0; color: #4B5563; font-size: 14px; line-height: 1.6;">${feature}</p>
      </div>
    `)
    .join('')
}

// Main send email function
async function sendEmail(request: EmailRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const fromEmail = Deno.env.get('AWS_SES_FROM_EMAIL') || 'noreply@catalystwells.com'
    
    if (!Deno.env.get('AWS_SES_ACCESS_KEY_ID') || !Deno.env.get('AWS_SES_SECRET_ACCESS_KEY')) {
      throw new Error('AWS SES credentials not configured')
    }

    let subject = request.subject || ''
    let html = request.html || ''
    let text = request.text || ''

    // Generate email based on type
    switch (request.type) {
      case 'welcome':
        subject = `Welcome to Catalyst Wellbeing, ${request.name}! ${roleColors[request.role].icon}`
        html = getWelcomeEmailHTML(request.name, request.role, request.schoolName)
        text = `Welcome to Catalyst Wellbeing, ${request.name}! Your ${request.role} account has been successfully created. Log in at ${Deno.env.get('APP_URL')}/login`
        break

      case 'verification':
        if (!request.url) throw new Error('Verification URL is required')
        subject = `Verify Your Email - Catalyst ${roleColors[request.role].title}`
        html = getEmailVerificationHTML(request.name, request.role, request.url)
        text = `Hi ${request.name}, verify your email: ${request.url}`
        break

      case 'password-reset':
        if (!request.url) throw new Error('Reset URL is required')
        subject = `Reset Your Password - Catalyst ${roleColors[request.role].title}`
        html = getPasswordResetHTML(request.name, request.role, request.url)
        text = `Hi ${request.name}, reset your password: ${request.url}`
        break

      case 'custom':
        if (!subject || !html) throw new Error('Subject and HTML are required for custom emails')
        break
    }

    const toAddresses = Array.isArray(request.to) ? request.to : [request.to]

    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: toAddresses },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text, Charset: 'UTF-8' },
        },
      },
    })

    const response = await sesClient.send(command)

    console.log(`✅ [${request.role.toUpperCase()}] Email sent to:`, toAddresses.join(', '))
    console.log('📬 MessageId:', response.MessageId)

    return { success: true, messageId: response.MessageId }
  } catch (error: any) {
    console.error('❌ Email error:', error.message)
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: EmailRequest = await req.json()

    console.log(`[Email] Processing ${request.type} email for ${request.role}: ${request.to}`)

    const result = await sendEmail(request)

    if (result.success) {
      return new Response(
        JSON.stringify({ success: true, messageId: result.messageId, message: 'Email sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Email] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
