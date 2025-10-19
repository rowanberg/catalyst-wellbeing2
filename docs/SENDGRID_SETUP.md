# SendGrid Email Configuration Guide

This guide explains how to configure SendGrid for sending verification emails in the Catalyst Wellbeing platform.

## Overview

The platform uses **SendGrid** for all email communications, including:
- User registration email verification
- Password reset emails
- School administrator notifications
- Student/parent/teacher welcome emails

## Prerequisites

1. A SendGrid account ([Sign up here](https://signup.sendgrid.com/))
2. A verified sender identity in SendGrid
3. An API key with "Mail Send" permissions

## Step 1: Create a SendGrid Account

1. Go to [https://signup.sendgrid.com/](https://signup.sendgrid.com/)
2. Sign up for a free account (100 emails/day)
3. Verify your email address
4. Complete the account setup wizard

## Step 2: Verify Your Sender Identity

### Option A: Single Sender Verification (Recommended for Development)

1. Navigate to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your sender details:
   - **From Name**: Catalyst Wellbeing
   - **From Email**: noreply@yourdomain.com (or your email for testing)
   - **Reply To**: support@yourdomain.com
   - **Company Address**: Your organization's address
4. Click **Create**
5. Check your email and click the verification link

### Option B: Domain Authentication (Recommended for Production)

1. Navigate to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow the DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

## Step 3: Create an API Key

1. Navigate to **Settings** → **API Keys**
2. Click **Create API Key**
3. Enter a name: `Catalyst-Production` or `Catalyst-Development`
4. Select **Restricted Access**
5. Enable only: **Mail Send** → **Mail Send** (Full Access)
6. Click **Create & View**
7. **IMPORTANT**: Copy the API key immediately (you won't be able to see it again)

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@catalystwells.com
SENDGRID_FROM_NAME=Catalyst Wellbeing
```

### Environment Variables Explained

- `SENDGRID_API_KEY`: Your SendGrid API key (starts with `SG.`)
- `SENDGRID_FROM_EMAIL`: The verified sender email address
- `SENDGRID_FROM_NAME`: The display name shown to recipients

## Step 5: Test Email Sending

### Using the API Endpoint

```bash
curl -X POST http://localhost:3000/api/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "verificationUrl": "http://localhost:3000/auth/verify?token=test123"
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

## Troubleshooting

### Email Not Received

1. **Check Spam Folder**: SendGrid emails often land in spam initially
2. **Verify Sender**: Ensure your sender email is verified in SendGrid
3. **Check SendGrid Dashboard**: Go to **Activity** → **Email Activity** to see delivery status
4. **API Key Permissions**: Verify your API key has "Mail Send" permissions
5. **Rate Limits**: Free tier has 100 emails/day limit

### Authentication Errors

```
Error: Unauthorized
```

**Solution**: Check that your API key is correct and has proper permissions

### Invalid Sender

```
Error: The from address does not match a verified Sender Identity
```

**Solution**: Verify your sender email in SendGrid dashboard

### DNS Issues (Domain Authentication)

```
Error: DNS records not found
```

**Solution**: 
- Wait 24-48 hours for DNS propagation
- Verify CNAME records are correctly configured
- Use `nslookup` to check DNS records

## Production Checklist

- [ ] Domain authentication completed
- [ ] API key created with restricted permissions
- [ ] Environment variables configured
- [ ] Sender identity verified
- [ ] Test email sent successfully
- [ ] Email template reviewed and approved
- [ ] DKIM and SPF records configured
- [ ] Monitoring and alerts set up
- [ ] Upgrade to paid plan if needed (>100 emails/day)

## Email Templates

The platform uses HTML email templates with:
- Responsive design (mobile-friendly)
- Professional branding
- Clear call-to-action buttons
- Fallback plain-text version

### Customizing Templates

Edit the template in: `src/app/api/send-verification-email/route.ts`

```typescript
html: `
  <!DOCTYPE html>
  <html>
    <!-- Your custom HTML here -->
  </html>
`
```

## Monitoring & Analytics

### SendGrid Dashboard

1. Navigate to **Email Activity**
2. View delivery stats, bounces, and spam reports
3. Set up alerts for delivery issues

### Metrics to Monitor

- **Delivery Rate**: Should be >95%
- **Open Rate**: Industry average ~20-25%
- **Bounce Rate**: Should be <5%
- **Spam Report Rate**: Should be <0.1%

## Security Best Practices

1. **Never commit API keys**: Use environment variables only
2. **Rotate keys regularly**: Every 90 days recommended
3. **Use restricted keys**: Only grant necessary permissions
4. **Monitor usage**: Watch for unusual activity
5. **Enable 2FA**: On your SendGrid account
6. **Separate keys**: Different keys for dev/staging/production

## Cost & Limits

### Free Tier
- 100 emails/day
- 1 authenticated domain
- 1 sender identity
- 30-day email activity history

### Essentials Plan ($19.95/month)
- 50,000 emails/month
- Email API & SMTP
- 30-day email activity history
- Email support

### Pro Plan ($89.95/month)
- 100,000 emails/month
- Advanced analytics
- Dedicated IP
- 60-day email activity history
- 24/7 support

## Support Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference)
- [SendGrid Status Page](https://status.sendgrid.com/)
- [Community Forum](https://community.sendgrid.com/)

## Migration from Supabase Email

The platform has been migrated from Supabase's built-in email service to SendGrid for:
- Better deliverability
- Professional email templates
- Advanced analytics
- More control over email content
- Higher sending limits

All registration flows now use SendGrid for verification emails.

## Next Steps

1. Complete the setup checklist above
2. Test the registration flow end-to-end
3. Monitor email delivery in SendGrid dashboard
4. Configure custom email templates as needed
5. Set up alerts for delivery issues
