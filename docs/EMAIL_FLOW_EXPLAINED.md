# Email Processing Flow - Direct from Website to Supabase Edge Function

## Complete Technical Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: User Action on Website                                 │
│  (Browser → Vercel/Next.js)                                      │
│                                                                  │
│  User clicks "Register" → Form submission                       │
│  Browser sends POST to: /api/register-student                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTP POST
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Next.js API Route on Vercel                            │
│  File: src/app/api/register-student/route.ts                    │
│                                                                  │
│  1. Creates user in Supabase Auth                               │
│  2. Creates profile in database                                 │
│  3. Calls Supabase Edge Function (NOT Vercel API route)         │
│                                                                  │
│  Code:                                                           │
│  const { data, error } = await supabaseAdmin.functions.invoke(  │
│    'send-email',                                                 │
│    { body: { type: 'verification', to: email, ... } }           │
│  )                                                               │
│                                                                  │
│  This uses Supabase JS SDK to call Edge Function DIRECTLY       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTPS POST to Supabase Edge Function
                     │ URL: https://PROJECT_ID.supabase.co/functions/v1/send-email
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Supabase Edge Function (Deno Deploy)                   │
│  Location: supabase/functions/send-email/index.ts               │
│  Runs on: Supabase Infrastructure (NOT Vercel)                  │
│                                                                  │
│  This is a serverless function running in Deno runtime          │
│  Hosted on Deno Deploy (globally distributed)                   │
│                                                                  │
│  1. Receives request from Next.js                               │
│  2. Generates HTML email from templates                         │
│  3. Calls AWS SES SDK                                           │
│  4. Returns success/failure to Next.js                          │
│                                                                  │
│  Code:                                                           │
│  import { SESClient, SendEmailCommand } from                    │
│    'npm:@aws-sdk/client-ses@3.700.0'                            │
│                                                                  │
│  const response = await sesClient.send(command)                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ AWS SDK API Call
                     │ Uses AWS credentials stored in Supabase secrets
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Amazon SES                                             │
│  AWS Email Service                                              │
│                                                                  │
│  1. Receives email request from Edge Function                   │
│  2. Validates sender domain (DKIM, SPF)                         │
│  3. Sends email to recipient                                    │
│  4. Returns MessageId to Edge Function                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Technical Details

### 1. **No Vercel API Route for Email**

**OLD WAY (with Vercel middleman):**
```typescript
// Website calls Vercel API route
fetch('/api/send-email', { ... })
  ↓
// Vercel API route (src/app/api/send-email/route.ts)
export async function POST(request) {
  await sendEmail(...)  // Runs on Vercel
}
```

**NEW WAY (direct to Supabase):**
```typescript
// Website calls Supabase Edge Function DIRECTLY
const { data } = await supabaseAdmin.functions.invoke('send-email', {
  body: { type: 'verification', to: email, ... }
})
  ↓
// Edge Function (supabase/functions/send-email/index.ts)
// Runs on SUPABASE infrastructure, NOT Vercel
serve(async (req) => {
  await sesClient.send(command)  // Runs on Deno Deploy
})
```

---

### 2. **Supabase JS SDK - How .functions.invoke() Works**

```typescript
// This is in your Next.js code (runs on Vercel)
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,  // https://PROJECT.supabase.co
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// When you call this:
const { data, error } = await supabaseAdmin.functions.invoke('send-email', {
  body: { type: 'verification', to: 'user@example.com', name: 'John' }
})

// Behind the scenes, the SDK makes an HTTP request:
// POST https://PROJECT_ID.supabase.co/functions/v1/send-email
// Headers:
//   Authorization: Bearer YOUR_SERVICE_ROLE_KEY
//   Content-Type: application/json
// Body:
//   { type: 'verification', to: 'user@example.com', name: 'John' }
```

**The function runs on Supabase's servers, NOT on Vercel!**

---

### 3. **Where Does the Code Execute?**

| Code Location | Runs On | Resources Used |
|---------------|---------|----------------|
| `/src/app/api/register-student/route.ts` | **Vercel** serverless | Vercel compute time |
| `supabaseAdmin.functions.invoke(...)` | SDK makes HTTP call | Just network request |
| `/supabase/functions/send-email/index.ts` | **Supabase (Deno Deploy)** | Supabase Edge Function quota |
| AWS SES SDK call | AWS infrastructure | AWS SES API quota |

**Important:** The email processing logic runs on **Supabase**, not Vercel!

---

### 4. **Using Separate Supabase Project for Email**

You can make this even MORE isolated:

```
┌──────────────────────────────────────────────────────────────┐
│  Main Supabase Project                                        │
│  URL: https://main-project.supabase.co                        │
│                                                               │
│  - Your main database                                        │
│  - User profiles                                             │
│  - Student/Teacher data                                      │
│  - ai-homework-chat Edge Function                            │
│  - intelligent-ai-router Edge Function                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Email Supabase Project (Separate)                           │
│  URL: https://email-service.supabase.co                      │
│                                                               │
│  - NO database (or minimal)                                  │
│  - ONLY send-email Edge Function                             │
│  - AWS SES credentials stored here                           │
│  - Completely isolated from main project                     │
└──────────────────────────────────────────────────────────────┘
```

**How to use separate project:**

```typescript
// Create a separate Supabase client for email service
// src/lib/supabase/email-client.ts
import { createClient } from '@supabase/supabase-js'

export const emailServiceClient = createClient(
  process.env.EMAIL_SUPABASE_URL!,        // Different URL!
  process.env.EMAIL_SUPABASE_SERVICE_KEY! // Different key!
)

// Use in registration
import { emailServiceClient } from '@/lib/supabase/email-client'

const { data, error } = await emailServiceClient.functions.invoke('send-email', {
  body: { ... }
})
```

**Benefits:**
- ✅ Main database completely unaffected by email processing
- ✅ Separate rate limits (500K function calls/month PER project)
- ✅ If email service goes down, main app still works
- ✅ Better security (email credentials isolated)
- ✅ Can scale email service independently

---

## Network Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (User)     │
└──────┬──────┘
       │
       │ 1. POST /api/register-student
       ▼
┌─────────────────────────────────────────────┐
│   Vercel (Next.js)                          │
│   ┌─────────────────────────────────────┐   │
│   │  API Route:                         │   │
│   │  /api/register-student              │   │
│   │                                     │   │
│   │  - Create user                      │   │
│   │  - Create profile                   │   │
│   │  - Call edge function ───────────┐  │   │
│   └─────────────────────────────────┘│  │   │
└─────────────────────────────────────┼───┘   │
                                      │       │
                        2. HTTPS POST │       │
                                      │       │
       ┌──────────────────────────────┘       │
       │                                      │
       ▼                                      │
┌─────────────────────────────────────────────┐
│   Supabase (Deno Deploy)                    │
│   ┌─────────────────────────────────────┐   │
│   │  Edge Function:                     │   │
│   │  send-email                         │   │
│   │                                     │   │
│   │  - Generate HTML                    │   │
│   │  - Call AWS SES ─────────────────┐  │   │
│   └─────────────────────────────────┘│  │   │
└─────────────────────────────────────┼───┘   │
                                      │       │
                        3. AWS SDK    │       │
                                      │       │
       ┌──────────────────────────────┘       │
       │                                      │
       ▼                                      │
┌─────────────────────────────────────────────┐
│   Amazon SES                                │
│   ┌─────────────────────────────────────┐   │
│   │  Email Delivery Service             │   │
│   │                                     │   │
│   │  - Send email to recipient          │   │
│   │  - Return MessageId                 │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## Code Execution Timeline

```
Time: 0ms
├─ User submits registration form
│
Time: 50ms
├─ Next.js API route starts (on Vercel)
│  ├─ Create Supabase auth user (150ms)
│  ├─ Create profile in database (100ms)
│  └─ Call supabaseAdmin.functions.invoke()
│
Time: 200ms
├─ Supabase SDK makes HTTPS request
│  URL: https://PROJECT.supabase.co/functions/v1/send-email
│  └─ Network latency: ~50ms
│
Time: 250ms
├─ Edge Function starts (on Supabase/Deno Deploy)
│  ├─ Parse request (5ms)
│  ├─ Generate HTML template (10ms)
│  ├─ Call AWS SES SDK (200ms)
│  │  └─ Network to AWS: ~50ms
│  │  └─ SES processing: ~100ms
│  │  └─ Response: ~50ms
│  └─ Return success to Next.js
│
Time: 465ms
├─ Next.js receives response
│  └─ Return 200 to browser
│
Time: 500ms
└─ Registration complete
```

**Total time:** ~500ms
- ~200ms on Vercel (user creation + DB)
- ~250ms on Supabase Edge Function
- ~50ms network overhead

---

## Environment Variables Setup

### **Vercel (Next.js) Environment Variables**

```env
# Main Supabase Project
NEXT_PUBLIC_SUPABASE_URL=https://main-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ...

# OPTIONAL: Separate Email Service Project
EMAIL_SUPABASE_URL=https://email-project.supabase.co
EMAIL_SUPABASE_SERVICE_KEY=eyJhbGciOiJ...
```

### **Supabase Edge Function Secrets**

```bash
# Set these using Supabase CLI (stored encrypted on Supabase)
supabase secrets set AWS_SES_REGION=us-east-1
supabase secrets set AWS_SES_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
supabase secrets set AWS_SES_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
supabase secrets set AWS_SES_FROM_EMAIL=noreply@catalystwells.com
supabase secrets set APP_URL=https://catalystwells.com
```

**Important:** AWS credentials are NEVER stored in your Next.js code or Vercel!

---

## Security Flow

```
┌─────────────────────────────────────────────────────────┐
│  Vercel (Next.js)                                        │
│  - Has Supabase service key                             │
│  - Can call Edge Functions                              │
│  - DOES NOT have AWS credentials                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Authenticated request
                     │ (includes service role key)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase Edge Function                                 │
│  - Validates service role key                           │
│  - Has AWS credentials (in secrets)                     │
│  - Calls AWS SES with credentials                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ AWS SDK request
                     │ (includes AWS credentials)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  AWS SES                                                │
│  - Validates AWS credentials                            │
│  - Sends email                                          │
└─────────────────────────────────────────────────────────┘
```

**Security Benefits:**
- AWS credentials never leave Supabase
- Even if Vercel is compromised, can't access AWS
- Service role key can be rotated independently
- Edge Function validates all requests

---

## Why This is Better Than Vercel API Routes

| Aspect | Vercel API Route | Supabase Edge Function |
|--------|------------------|------------------------|
| **Location** | Runs on Vercel | Runs on Supabase/Deno Deploy |
| **Resources** | Uses Vercel compute quota | Uses Supabase Edge Function quota |
| **Scaling** | Tied to Vercel plan | Independent scaling |
| **Cold Start** | 200-800ms (Next.js) | 50-100ms (Deno) |
| **Global** | Regional | Global edge network |
| **Isolation** | Mixed with app code | Completely separate |
| **Cost** | Vercel function time | Supabase function calls |

---

## Summary

**How it works WITHOUT Vercel middleman:**

1. ✅ Your Next.js code (on Vercel) uses **Supabase JS SDK**
2. ✅ SDK makes **direct HTTPS call** to Supabase Edge Function endpoint
3. ✅ Edge Function runs on **Supabase infrastructure** (Deno Deploy)
4. ✅ Edge Function calls **AWS SES API** to send email
5. ✅ Response flows back: AWS → Supabase → Next.js → Browser

**No Vercel API route is involved in email sending!**

The only Vercel code is the registration logic that CALLS the Edge Function. The email processing itself happens entirely on Supabase.

**Optional Isolation:**
- Use a separate Supabase project for email processing
- Main database completely unaffected
- Better scaling, security, and resource isolation
