# Supabase Email Template Setup Instructions

## How to Add This Email Template to Supabase

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure Confirm Signup Template
1. Click on **"Confirm signup"** template
2. Replace the default HTML in the **"Message (HTML)"** field with the content from `supabase-confirm-signup.html`

### Step 3: Supabase Template Variables
The template uses these Supabase variables:
- `{{ .ConfirmationURL }}` - The confirmation link URL
- `{{ .SiteURL }}` - Your site URL (optional)
- `{{ .Token }}` - The confirmation token (optional)

### Step 4: Email Settings Configuration
Make sure your Supabase project has:

#### SMTP Settings (Recommended for Production)
```
SMTP Host: your-smtp-host.com
SMTP Port: 587
SMTP User: your-email@domain.com
SMTP Pass: your-app-password
```

#### Site URL Configuration
```
Site URL: https://your-domain.com
Redirect URLs: 
- https://your-domain.com/auth/confirm
- http://localhost:3000/auth/confirm (for development)
```

### Step 5: Test the Email Template
1. Register a new user in your application
2. Check that the email is sent with the new template
3. Verify the confirmation link works correctly

## Template Features

✨ **Professional Design**
- Gradient background matching Catalyst branding
- Glassmorphism effects for modern look
- Mobile-responsive design

🎮 **Gamification Elements**
- Achievement unlock animation
- XP reward system (+50 XP for email confirmation)
- Trophy and badge icons

🔒 **Security & Trust**
- Clear security messaging
- Professional company branding
- Alternative link for accessibility

📱 **Mobile Optimized**
- Responsive table layout
- Touch-friendly buttons
- Readable typography on all devices

## Customization Options

### Colors
- Primary: `#667eea` to `#764ba2` (gradient)
- Secondary: `#ff6b6b` to `#4ecdc4` (logo gradient)
- Accent: `#ffd700` (achievement badge)

### Content
- Update company name and contact information
- Modify the motivational quote
- Adjust the feature highlights
- Change social media links

### Branding
- Replace emoji icons with your logo
- Update color scheme to match your brand
- Modify the achievement system messaging

## Email Client Compatibility

✅ **Fully Supported**
- Gmail (Web, Mobile, App)
- Outlook (Web, Desktop, Mobile)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Thunderbird

⚠️ **Limited Support**
- Older Outlook versions (2007-2010)
- Some corporate email clients

## Troubleshooting

### Email Not Sending
1. Check SMTP configuration in Supabase
2. Verify sender email is authenticated
3. Check spam folder
4. Review Supabase logs for errors

### Styling Issues
1. Some email clients strip CSS
2. Use inline styles for critical formatting
3. Test with Email on Acid or Litmus
4. Provide plain text fallback

### Links Not Working
1. Verify Site URL configuration
2. Check redirect URL whitelist
3. Ensure HTTPS in production
4. Test confirmation flow end-to-end

## Plain Text Version

For email clients that don't support HTML, here's a plain text version:

```
🎉 Welcome to Catalyst!

Your Wellbeing Journey Starts Here

You're Almost Ready!
Just one more step to unlock your personalized wellbeing experience.

🏆 Achievement Unlocked! 🏆
Account Creator +50 XP

CONFIRM YOUR ACCOUNT:
{{ .ConfirmationURL }}

What Awaits You:
💎 Earn Gems & XP
🎯 Daily Quests  
❤️ Wellbeing Focus

🔒 Secure & Private
Your data is encrypted and protected. We never share your personal information with third parties.

Need help? Contact us at support@catalyst.com

---
Catalyst Wellbeing Platform
Empowering students to build healthy habits and achieve their potential

"Every expert was once a beginner. Every pro was once an amateur."
- Your journey starts today! 🌟

© 2024 Catalyst. All rights reserved.
```

## Next Steps

1. Copy the HTML template to Supabase
2. Test with a new user registration
3. Monitor email delivery rates
4. Collect user feedback on the experience
5. Iterate and improve based on analytics

For support with implementation, contact your development team or Supabase support.
