# Email Delivery Troubleshooting Guide

## 🚨 Common Causes of Email Not Being Sent

### 1. **Supabase Email Configuration Issues**
- Default Supabase email service has limitations
- SMTP not properly configured
- Email templates not saved correctly
- Rate limiting on Supabase free tier

### 2. **Environment Variables Missing**
- `NEXT_PUBLIC_SUPABASE_URL` not set
- `SUPABASE_SERVICE_ROLE_KEY` not set
- `NEXT_PUBLIC_SITE_URL` not configured

### 3. **Email Provider Issues**
- Emails going to spam folder
- Corporate email blocking
- Gmail/Outlook filtering

## 🔧 Step-by-Step Debugging

### Step 1: Check Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**
3. Check **SMTP Settings** section:
   - If using default: Limited to 3 emails/hour on free tier
   - If custom SMTP: Verify all settings are correct

### Step 2: Verify Environment Variables
Create/check your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 3: Check Supabase Logs
1. Go to **Logs** → **Auth Logs** in Supabase dashboard
2. Look for email-related errors
3. Check for rate limiting messages

### Step 4: Test Email Manually
Use the debug endpoint I'll create below to test email sending directly.

## 🛠️ Quick Fixes

### Fix 1: Use Custom SMTP (Recommended)
Configure a reliable email service:

#### Gmail SMTP Setup:
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password (not regular password!)
```

#### SendGrid Setup:
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: your-sendgrid-api-key
```

### Fix 2: Increase Rate Limits
- Upgrade to Supabase Pro plan for higher email limits
- Or implement email queuing system

### Fix 3: Check Spam Folders
- Gmail: Check "Promotions" and "Spam" tabs
- Outlook: Check "Junk Email" folder
- Corporate email: Contact IT department

## 🧪 Testing Tools

I'll create a debug endpoint to test email sending directly.

## 📧 Alternative Solutions

If Supabase emails continue to fail, we can implement:
1. **Resend.com integration** (modern email API)
2. **SendGrid integration** (enterprise-grade)
3. **Nodemailer with Gmail** (simple setup)

## 🔍 Immediate Actions

1. **Check your spam folder first** - this is the most common issue
2. **Try a different email address** (Gmail, Yahoo, etc.)
3. **Check Supabase logs** for error messages
4. **Verify your email templates are saved** in Supabase dashboard

## 📱 Contact Information

If none of these solutions work, we may need to:
- Set up a custom email service
- Debug your specific Supabase configuration
- Implement a backup email system
