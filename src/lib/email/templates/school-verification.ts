/**
 * Professional School Verification Email Template
 * Optimized for spam prevention and deliverability
 */

interface SchoolVerificationEmailData {
  schoolName: string
  schoolCode: string
  adminFirstName: string
  adminLastName: string
  verificationUrl: string
}

export function generateSchoolVerificationEmail(data: SchoolVerificationEmailData): { html: string; text: string } {
  const { schoolName, schoolCode, adminFirstName, adminLastName, verificationUrl } = data

  // Plain text version for spam prevention
  const text = `
Welcome to Catalyst Wells!

Dear ${adminFirstName} ${adminLastName},

Thank you for registering ${schoolName} with Catalyst Wells. We're excited to help transform your school's digital experience.

Your School Details:
- School Name: ${schoolName}
- School Access Code: ${schoolCode}
- Administrator: ${adminFirstName} ${adminLastName}

To complete your registration and access your administrator dashboard, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours.

Next Steps After Verification:
1. Log in to your admin dashboard
2. Complete your school profile setup
3. Invite teachers and staff members
4. Start onboarding students

Need Help?
Our support team is here to assist you. Contact us at support@catalystwells.in

Best regards,
The Catalyst Wells Team

---
© ${new Date().getFullYear()} Catalyst Wells. All rights reserved.
${process.env.NEXT_PUBLIC_SITE_URL || 'https://catalystwells.in'}
`.trim()

  // Professional HTML version with branding
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to Catalyst Wells</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #780206 0%, #061161 100%); padding: 40px 30px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://catalystwells.in'}/catalyst-logo.png" alt="Catalyst Wells" style="width: 80px; height: 80px; border-radius: 16px; margin-bottom: 20px; display: block;" />
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Catalyst Wells</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 24px;">
                Dear <strong>${adminFirstName} ${adminLastName}</strong>,
              </p>
              
              <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 24px;">
                Thank you for registering <strong>${schoolName}</strong> with Catalyst Wells. We're excited to help transform your school's digital experience with our comprehensive student wellbeing and analytics platform.
              </p>
              
              <!-- School Details Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">Your School Details</h2>
                    
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">School Name:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${schoolName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Access Code:</td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="background: linear-gradient(135deg, #780206 0%, #061161 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 18px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 1px;">${schoolCode}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Administrator:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${adminFirstName} ${adminLastName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Verification CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 22px;">
                      To complete your registration and access your administrator dashboard, please verify your email address:
                    </p>
                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #780206 0%, #061161 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(120, 2, 6, 0.3);">
                      Verify Email Address
                    </a>
                    <p style="margin: 20px 0 0; color: #9ca3af; font-size: 13px; line-height: 20px;">
                      This verification link will expire in 24 hours.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Next Steps -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border-left: 4px solid #780206; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 16px; font-weight: 600;">Next Steps After Verification</h3>
                    <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 22px;">
                      <li style="margin-bottom: 8px;">Log in to your admin dashboard</li>
                      <li style="margin-bottom: 8px;">Complete your school profile setup</li>
                      <li style="margin-bottom: 8px;">Invite teachers and staff members</li>
                      <li style="margin-bottom: 0;">Start onboarding students</li>
                    </ol>
                  </td>
                </tr>
              </table>
              
              <!-- Support Info -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef3c7; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px; text-align: center;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 20px;">
                      <strong>Need help?</strong> Our support team is here to assist you at
                      <a href="mailto:support@catalystwells.in" style="color: #92400e; text-decoration: underline;">support@catalystwells.in</a>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Manual Link -->
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 18px;">
                If the button above doesn't work, copy and paste this link into your browser:<br/>
                <a href="${verificationUrl}" style="color: #780206; word-break: break-all;">${verificationUrl}</a>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; font-weight: 600;">
                      Catalyst Wells
                    </p>
                    <p style="margin: 0 0 12px; color: #9ca3af; font-size: 12px; line-height: 18px;">
                      Transforming Education Through Digital Innovation
                    </p>
                    <p style="margin: 0 0 12px; color: #9ca3af; font-size: 12px;">
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://catalystwells.in'}" style="color: #780206; text-decoration: none; margin: 0 8px;">Visit Website</a> •
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://catalystwells.in'}/privacy" style="color: #780206; text-decoration: none; margin: 0 8px;">Privacy Policy</a> •
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://catalystwells.in'}/terms" style="color: #780206; text-decoration: none; margin: 0 8px;">Terms of Service</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                      © ${new Date().getFullYear()} Catalyst Wells. All rights reserved.
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
                You received this email because you registered an account at Catalyst Wells.
                If you didn't register, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()

  return { html, text }
}
