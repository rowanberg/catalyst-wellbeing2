# Email Service Architecture - AWS SES via Supabase Edge Functions

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CATALYST MAIN APP                         │
│                  (Next.js on Vercel)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Direct Function Call
                     │ (No API Route Middleman)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTION                          │
│              send-email (Deno Runtime)                       │
│                                                              │
│  • Receives email request                                   │
│  • Generates HTML from templates                            │
│  • Calls AWS SES API                                        │
│  • Returns success/failure                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ AWS SDK
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   AMAZON SES                                 │
│              (Email Delivery Service)                        │
│                                                              │
│  • Sends transactional emails                               │
│  • Handles bounce/complaint tracking                        │
│  • Provides delivery analytics                              │
└─────────────────────────────────────────────────────────────┘
```

## Why This Architecture?

### ✅ Benefits

1. **No Vercel Middleman**
   - Direct function invocation from Next.js to Supabase
   - Reduces latency (one less network hop)
   - No API route overhead

2. **Separate Processing**
   - Email logic runs in isolated Edge Function
   - Does not consume Vercel serverless function resources
   - Independent scaling

3. **Cost Efficiency**
   - AWS SES is extremely cheap ($0.10 per 1,000 emails)
   - Supabase Edge Functions free tier: 500K executions/month
   - No SendGrid subscription fees

4. **Better Performance**
   - Edge Functions run globally (Deno Deploy)
   - Fast cold starts (<50ms)
   - No Next.js compilation overhead

5. **Reliability**
   - AWS SES 99.9% uptime SLA
   - Automatic retry logic
   - Built-in bounce handling

---

## Setup Instructions

### Step 1: AWS SES Configuration

1. **Sign up for AWS Account** (if you don't have one)
   - Go to https://aws.amazon.com/ses/

2. **Verify Your Domain**
   ```bash
   # In AWS SES Console:
   1. Go to "Verified identities"
   2. Click "Create identity"
   3. Choose "Domain"
   4. Enter: catalystwells.com
   5. Add DNS records (TXT, CNAME, MX)
   ```

3. **Verify Sender Email**
   ```bash
   # For testing, verify individual email:
   1. Go to "Verified identities"
   2. Click "Create identity"
   3. Choose "Email address"
   4. Enter: noreply@catalystwells.com
   5. Click verification link in email
   ```

4. **Request Production Access**
   ```bash
   # By default, SES is in sandbox mode
   1. Go to "Account dashboard"
   2. Click "Request production access"
   3. Fill form (usually approved in 24 hours)
   4. Sandbox: 200 emails/day, verified recipients only
   5. Production: 50,000 emails/day (can request increase)
   ```

5. **Create IAM User for SES**
   ```bash
   # Create user with SES-only permissions:
   1. Go to IAM Console
   2. Create user: "catalyst-ses-sender"
   3. Attach policy: "AmazonSESFullAccess"
   4. Create Access Key
   5. Save: Access Key ID and Secret Access Key
   ```

---

### Step 2: Supabase Edge Function Setup

#### Option A: Same Supabase Project (Simple)

**Deploy to existing project:**

```bash
# Deploy the send-email function
cd c:\projects\kids\catalyst
supabase functions deploy send-email

# Set environment secrets
supabase secrets set AWS_SES_REGION=us-east-1
supabase secrets set AWS_SES_ACCESS_KEY_ID=your_access_key_id
supabase secrets set AWS_SES_SECRET_ACCESS_KEY=your_secret_key
supabase secrets set AWS_SES_FROM_EMAIL=noreply@catalystwells.com
supabase secrets set APP_URL=https://catalystwells.com
```

**Pros:**
- Simple setup
- One Supabase project to manage
- No additional costs

**Cons:**
- Email processing shares resources with main database
- Edge function limits apply to entire project

---

#### Option B: Separate Supabase Project (Recommended for Scale)

**Create new Supabase project for email processing:**

```bash
# 1. Create new Supabase project
Project name: catalyst-email-service
Region: Same as main project
Plan: Free (unless high volume)

# 2. Link to new project locally
supabase link --project-ref YOUR_EMAIL_PROJECT_REF

# 3. Deploy send-email function to email project
supabase functions deploy send-email --project-ref YOUR_EMAIL_PROJECT_REF

# 4. Set secrets in email project
supabase secrets set AWS_SES_REGION=us-east-1 --project-ref YOUR_EMAIL_PROJECT_REF
supabase secrets set AWS_SES_ACCESS_KEY_ID=your_key --project-ref YOUR_EMAIL_PROJECT_REF
supabase secrets set AWS_SES_SECRET_ACCESS_KEY=your_secret --project-ref YOUR_EMAIL_PROJECT_REF
supabase secrets set AWS_SES_FROM_EMAIL=noreply@catalystwells.com --project-ref YOUR_EMAIL_PROJECT_REF
supabase secrets set APP_URL=https://catalystwells.com --project-ref YOUR_EMAIL_PROJECT_REF
```

**Update Next.js to call email project:**

```typescript
// Create separate Supabase client for email service
// src/lib/supabase/email-client.ts
import { createClient } from '@supabase/supabase-js'

export const emailServiceClient = createClient(
  process.env.EMAIL_SUPABASE_URL!, // Different project URL
  process.env.EMAIL_SUPABASE_ANON_KEY!
)

// Usage in API routes
import { emailServiceClient } from '@/lib/supabase/email-client'

const { data, error } = await emailServiceClient.functions.invoke('send-email', {
  body: { 
    type: 'verification',
    to: 'user@example.com',
    name: 'John Doe',
    url: 'https://...'
  }
})
```

**Environment Variables (.env.local):**
```env
# Main Supabase Project
NEXT_PUBLIC_SUPABASE_URL=https://your-main-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_main_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_main_service_key

# Email Service Supabase Project (separate)
EMAIL_SUPABASE_URL=https://your-email-project.supabase.co
EMAIL_SUPABASE_ANON_KEY=your_email_anon_key
EMAIL_SUPABASE_SERVICE_KEY=your_email_service_key
```

**Pros:**
- ✅ Complete isolation of email processing
- ✅ Independent scaling and rate limits
- ✅ Main database not affected by email workload
- ✅ Separate monitoring and logs
- ✅ Can upgrade email project independently
- ✅ Better security (email credentials isolated)

**Cons:**
- Two Supabase projects to manage
- Slightly more complex setup

---

### Step 3: Usage in Your Code

**Registration endpoint example:**

```typescript
// src/app/api/register-student/route.ts
import { createClient } from '@supabase/supabase-js'

// Use admin client to call edge function
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Send verification email
const { data, error } = await supabaseAdmin.functions.invoke('send-email', {
  body: { 
    type: 'verification',
    to: email,
    name: firstName,
    url: verificationUrl
  }
})

if (data?.success) {
  console.log('✅ Email sent:', data.messageId)
}
```

**Password reset example:**

```typescript
const { data, error } = await supabaseAdmin.functions.invoke('send-email', {
  body: { 
    type: 'password-reset',
    to: userEmail,
    name: userName,
    url: resetUrl
  }
})
```

**Custom email example:**

```typescript
const { data, error } = await supabaseAdmin.functions.invoke('send-email', {
  body: { 
    type: 'custom',
    to: ['user1@example.com', 'user2@example.com'],
    subject: 'Important Announcement',
    html: '<h1>Hello!</h1><p>Custom HTML content</p>',
    text: 'Hello! Custom text content'
  }
})
```

---

## Email Types Supported

| Type | Required Fields | Description |
|------|----------------|-------------|
| `welcome` | `to`, `name`, `role` | Welcome email after registration |
| `verification` | `to`, `name`, `url` | Email verification link |
| `password-reset` | `to`, `name`, `url` | Password reset link |
| `custom` | `to`, `subject`, `html` | Custom email content |

---

## Cost Analysis

### AWS SES Pricing (us-east-1)
```
First 62,000 emails/month: FREE (when sending from EC2)
Otherwise:
- $0.10 per 1,000 emails sent
- $0.12 per GB of attachments

Example: 100,000 emails/month = $10/month
```

### Supabase Edge Functions
```
Free tier: 500,000 invocations/month
Pro tier: 2,000,000 invocations/month

Example: 100,000 emails = 100,000 invocations = FREE
```

### Total Cost for 100K Emails/Month
```
AWS SES:         $10
Supabase:        $0 (within free tier)
Total:          $10/month
```

### vs SendGrid
```
SendGrid Essential: $19.95/month (50K emails)
For 100K emails: $89.95/month

Savings: $79.95/month = $959/year
```

---

## Monitoring & Analytics

### AWS SES Dashboard
- Delivery rate
- Bounce rate
- Complaint rate
- Reputation metrics

### Supabase Logs
```bash
# View edge function logs
supabase functions logs send-email --tail
```

### Success Tracking
```typescript
// Each email returns MessageId
{
  "success": true,
  "messageId": "010001234567abcd-12345678-1234-1234-1234-123456789abc-000000"
}
```

---

## Security Best Practices

1. **Never commit AWS credentials**
   - Use Supabase secrets (encrypted at rest)
   - Rotate keys quarterly

2. **Verify sender domain**
   - DKIM, SPF, DMARC records
   - Reduces spam classification

3. **Rate limiting**
   - Implement in Edge Function if needed
   - AWS SES has built-in rate limits

4. **Bounce handling**
   - Set up SNS notifications
   - Remove bounced emails from lists

5. **Separate projects**
   - Email service isolated from main app
   - Compromised email keys don't affect main DB

---

## Migration Steps

### From SendGrid to AWS SES

1. ✅ **Remove SendGrid** (completed)
   - Deleted `/api/send-verification-email`
   - Deleted `/api/send-password-reset-email`
   - Deleted `/api/send-email-backup`
   - Removed `@sendgrid/mail` from package.json

2. ✅ **Create Edge Function** (completed)
   - Created `/supabase/functions/send-email/index.ts`
   - Configured with AWS SES SDK
   - Added email templates

3. ✅ **Update registration endpoint** (completed)
   - Changed to call Supabase Edge Function
   - No more Vercel API middleman

4. ⏳ **TODO: Update other endpoints**
   - Password reset flows
   - Welcome emails
   - Parent notifications
   - Assignment reminders

5. ⏳ **TODO: Deploy & Test**
   - Deploy Edge Function
   - Set AWS credentials
   - Test all email types

---

## Troubleshooting

### Email not sending

**Check 1: AWS SES Sandbox Mode**
```bash
# In sandbox, can only send to verified emails
# Request production access in AWS Console
```

**Check 2: Environment Variables**
```bash
supabase secrets list
# Verify all AWS_SES_* variables are set
```

**Check 3: Edge Function Logs**
```bash
supabase functions logs send-email --tail
# Look for AWS SDK errors
```

### Emails going to spam

**Fix 1: Verify Domain**
- Add DKIM, SPF, DMARC DNS records
- Warm up IP (gradually increase volume)

**Fix 2: Content Quality**
- Avoid spam trigger words
- Balance text/image ratio
- Include unsubscribe link

---

## Next Steps

1. **Deploy Edge Function**
   ```bash
   supabase functions deploy send-email
   ```

2. **Set AWS Secrets**
   ```bash
   supabase secrets set AWS_SES_ACCESS_KEY_ID=xxx
   supabase secrets set AWS_SES_SECRET_ACCESS_KEY=xxx
   supabase secrets set AWS_SES_FROM_EMAIL=noreply@catalystwells.com
   ```

3. **Test Email Sending**
   ```bash
   # Test from Next.js app
   # Register a new student and verify email is sent
   ```

4. **Monitor Performance**
   - Check AWS SES dashboard
   - Review Supabase function logs
   - Track delivery rates

5. **Scale Considerations**
   - If >100K emails/month, consider separate Supabase project
   - Request SES sending limit increase from AWS
   - Implement email queue for bulk sends

---

## Support

- **AWS SES Docs:** https://docs.aws.amazon.com/ses/
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Deno AWS SDK:** https://deno.land/x/aws_sdk
