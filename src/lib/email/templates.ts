type UserRole = 'student' | 'teacher' | 'parent' | 'admin'

interface OTPEmailData {
	otp: string
	expiryMinutes: number
	role: UserRole
	email: string
	firstName?: string
	lastName?: string
}

function getRoleContent(role: UserRole, firstName?: string, lastName?: string) {
	const fullName = firstName && lastName ? `${firstName} ${lastName}` : null
	const shortName = firstName || null

	const content = {
		student: {
			greeting: fullName ? `Dear ${fullName}` : shortName ? `Hello ${shortName}` : 'Dear Student',
			message: 'Welcome to CatalystWells! We are excited to have you join our learning community.',
			footer: 'Get ready to track your wellness, build healthy habits, and achieve your goals!',
		},
		teacher: {
			greeting: fullName ? `Dear ${fullName}` : shortName ? `Hello ${shortName}` : 'Dear Educator',
			message: 'Welcome to CatalystWells! Thank you for joining our platform to support student wellness.',
			footer: 'Together, we can make a positive impact on student wellbeing and success.',
		},
		parent: {
			greeting: fullName ? `Dear ${fullName}` : shortName ? `Hello ${shortName}` : 'Dear Parent',
			message: 'Welcome to CatalystWells! We are glad you are taking an active role in your child wellness journey.',
			footer: 'Stay connected with your child progress and support their healthy habits.',
		},
		admin: {
			greeting: fullName ? `Dear ${fullName}` : shortName ? `Hello ${shortName}` : 'Dear Administrator',
			message: 'Welcome to CatalystWells! Your administrative account is being set up.',
			footer: 'You will have full access to manage and monitor your institution wellness program.',
		},
	}

	return content[role] || content.student
}

export function generateOTPEmail(data: OTPEmailData): string {
	const roleContent = getRoleContent(data.role, data.firstName, data.lastName)
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
	const currentYear = new Date().getFullYear()

	return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Email Verification</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff">
<tr><td style="background:#1a365d;padding:32px 40px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:28px">CatalystWells</h1>
<p style="margin:8px 0 0;color:#cbd5e0;font-size:14px">Empowering Student Wellness</p>
</td></tr>
<tr><td style="padding:40px">
<h2 style="margin:0 0 24px;color:#1a202c;font-size:20px">${roleContent.greeting}</h2>
<p style="margin:0 0 24px;color:#4a5568;font-size:15px;line-height:24px">${roleContent.message}</p>
<p style="margin:0 0 28px;color:#2d3748;font-size:15px">To complete your registration, please use the verification code below:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafc;border:2px solid #e2e8f0">
<tr><td style="padding:32px;text-align:center">
<p style="margin:0 0 12px;color:#718096;font-size:12px;font-weight:600;text-transform:uppercase">VERIFICATION CODE</p>
<p style="margin:0;color:#2d3748;font-size:40px;font-weight:700;letter-spacing:8px;font-family:Courier">${data.otp}</p>
<p style="margin:16px 0 0;color:#a0aec0;font-size:13px">Valid for ${data.expiryMinutes} minutes</p>
</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;background:#fffaf0;border-left:4px solid #ed8936">
<tr><td style="padding:16px 20px">
<p style="margin:0;color:#c05621;font-size:14px"><strong>Security Notice:</strong><br>Never share this code with anyone.</p>
</td></tr>
</table>
<p style="margin:28px 0 0;color:#4a5568;font-size:15px;line-height:24px">${roleContent.footer}</p>
</td></tr>
<tr><td style="background:#f7fafc;padding:32px 40px;border-top:1px solid #e2e8f0;text-align:center">
<p style="margin:0 0 16px;color:#1a365d;font-size:16px;font-weight:600">CatalystWells</p>
<p style="margin:0;color:#a0aec0;font-size:12px">Copyright ${currentYear} CatalystWells. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`.trim()
}

export function generateOTPEmailText(data: OTPEmailData): string {
	const roleContent = getRoleContent(data.role, data.firstName, data.lastName)

	return `${roleContent.greeting},

${roleContent.message}

To complete your registration, please verify your email address using the code below:

VERIFICATION CODE: ${data.otp}

This code expires in ${data.expiryMinutes} minutes.

SECURITY NOTICE:
Never share this code with anyone. CatalystWells staff will never ask for your verification code.

${roleContent.footer}

---
CatalystWells
Empowering Student Wellness Through Technology
Copyright ${new Date().getFullYear()} CatalystWells. All rights reserved.`.trim()
}

interface ResetPasswordEmailData {
	url: string
	name: string
	role: string
}

export function generatePasswordResetEmail(data: ResetPasswordEmailData): string {
	const currentYear = new Date().getFullYear()

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your Password - Catalyst Wells</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #870000 0%, #190a05 100%); padding: 40px 30px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Catalyst Wells</h1>
                    <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">Password Reset Request</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Greeting -->
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 600;">Hello ${data.name},</h2>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 24px;">
                We received a request to reset the password for your Catalyst Wells account. To proceed with resetting your password, please click the button below.
              </p>
              
              <!-- Reset Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="${data.url}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #870000 0%, #190a05 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(135, 0, 0, 0.3);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border-left: 4px solid #870000; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #1f2937; font-size: 14px; font-weight: 600;">Important Information:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 22px;">
                      <li style="margin-bottom: 6px;">This password reset link will expire in <strong>1 hour</strong> for your security</li>
                      <li style="margin-bottom: 6px;">If you didn't request this reset, you can safely ignore this email</li>
                      <li style="margin-bottom: 0;">Your password will remain unchanged until you create a new one</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef3c7; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; text-align: center;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 20px;">
                      <strong>🔒 Security Tip:</strong> If you didn't request this password reset, please contact your school administrator immediately or email us at 
                      <a href="mailto:security@catalystwells.in" style="color: #92400e; text-decoration: underline;">security@catalystwells.in</a>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Manual Link Fallback -->
              <p style="margin: 0 0 20px; color: #6b7280; font-size: 13px; line-height: 20px;">
                <strong>Button not working?</strong> Copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px; color: #870000; font-size: 12px; line-height: 18px; word-break: break-all; background-color: #f9fafb; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb;">
                ${data.url}
              </p>
              
              <!-- Closing -->
              <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 22px;">
                Best regards,<br/>
                <strong>The Catalyst Wells Team</strong>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 12px; color: #111827; font-size: 15px; font-weight: 600;">
                      Catalyst Wells
                    </p>
                    <p style="margin: 0 0 12px; color: #6b7280; font-size: 12px; line-height: 18px;">
                      Transforming Education Through Digital Innovation
                    </p>
                    <p style="margin: 0 0 12px; color: #9ca3af; font-size: 12px;">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://catalystwells.in'}" style="color: #870000; text-decoration: none; margin: 0 8px;">Visit Website</a> •
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://catalystwells.in'}/support" style="color: #870000; text-decoration: none; margin: 0 8px;">Support Center</a> •
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://catalystwells.in'}/privacy" style="color: #870000; text-decoration: none; margin: 0 8px;">Privacy Policy</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                      © ${currentYear} Catalyst Wells. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
        <!-- Footer Note -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; margin-top: 20px;">
          <tr>
            <td align="center" style="padding: 0 20px;">
              <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 16px; text-align: center;">
                You received this email because a password reset was requested for your Catalyst Wells account.
                If you didn't make this request, please disregard this email.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}
