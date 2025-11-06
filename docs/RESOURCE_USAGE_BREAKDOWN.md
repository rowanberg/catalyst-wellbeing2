# Resource Usage Breakdown: Vercel vs Supabase

## You're Right - The API Route Uses Vercel Resources

Let me clarify what runs where and what resources are consumed:

---

## Resource Consumption Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│  VERCEL SERVERLESS FUNCTION                                  │
│  File: /api/register-student/route.ts                       │
│                                                              │
│  USES VERCEL RESOURCES:                                     │
│  ✅ Function execution time (~200ms)                        │
│  ✅ Function invocations (1 per registration)               │
│  ✅ Database writes (Supabase client calls)                 │
│  ✅ Network bandwidth (request/response)                    │
│                                                              │
│  Code executed on Vercel:                                   │
│  - Parse request body                                       │
│  - Validate input data                                      │
│  - Create auth user (Supabase API call)                     │
│  - Create profile record (Supabase API call)                │
│  - Call Edge Function SDK (just the HTTP call)              │
│  - Return response to browser                               │
│                                                              │
│  DOES NOT USE VERCEL RESOURCES:                             │
│  ❌ Email HTML generation (happens on Supabase)            │
│  ❌ AWS SES API calls (happens on Supabase)                │
│  ❌ Email template rendering (happens on Supabase)          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SUPABASE EDGE FUNCTION                                      │
│  File: supabase/functions/send-email/index.ts               │
│                                                              │
│  USES SUPABASE RESOURCES:                                   │
│  ✅ Edge Function execution time (~250ms)                   │
│  ✅ Edge Function invocations (1 per email)                 │
│  ✅ Deno Deploy compute time                                │
│  ✅ AWS SDK bandwidth                                       │
│                                                              │
│  Code executed on Supabase:                                 │
│  - Receive request from Vercel                              │
│  - Generate HTML email template (CPU intensive)             │
│  - Initialize AWS SES client                                │
│  - Send email via AWS SDK (network intensive)               │
│  - Return MessageId to Vercel                               │
│                                                              │
│  DOES NOT USE VERCEL RESOURCES:                             │
│  ❌ None of this runs on Vercel                            │
└─────────────────────────────────────────────────────────────┘
```

---

## The Key Difference: What Work is Offloaded?

### **OLD Architecture (SendGrid via Vercel API Route):**

```typescript
// EVERYTHING runs on Vercel:
export async function POST(request) {
  // ⚡ Uses Vercel compute
  const { email, name } = await request.json()
  
  // ⚡ Uses Vercel compute + memory
  const html = generateEmailHTML(name)  // Template rendering
  
  // ⚡ Uses Vercel compute + network
  await sgMail.send({
    to: email,
    subject: '...',
    html: html  // This data goes through Vercel
  })
  
  return Response.json({ success: true })
}
```

**Vercel Resource Usage:**
- ✅ Request parsing
- ✅ Template generation (CPU)
- ✅ SendGrid API call (network)
- ✅ Response handling

---

### **NEW Architecture (AWS SES via Supabase Edge Function):**

```typescript
// Lightweight call on Vercel:
export async function POST(request) {
  // ⚡ Uses Vercel compute (small)
  const { email, name } = await request.json()
  
  // ⚡ Uses Vercel network ONLY (just HTTP call)
  const { data } = await supabaseAdmin.functions.invoke('send-email', {
    body: { type: 'verification', to: email, name }
  })
  
  // Heavy work happens on Supabase:
  // - HTML generation ❌ NOT on Vercel
  // - AWS SES call ❌ NOT on Vercel
  // - Template rendering ❌ NOT on Vercel
  
  return Response.json({ success: true })
}
```

**Vercel Resource Usage:**
- ✅ Request parsing (same as before)
- ✅ SDK HTTP call (minimal - just a network request)
- ✅ Response handling (same as before)
- ❌ NO template generation
- ❌ NO email sending logic
- ❌ NO AWS SDK overhead

---

## Resource Comparison

| Task | Old (SendGrid) | New (SES + Edge Function) |
|------|---------------|---------------------------|
| **Parse request** | Vercel | Vercel |
| **Generate HTML template** | Vercel ⚡ | **Supabase** 🚀 |
| **Email API call** | Vercel ⚡ | **Supabase** 🚀 |
| **Template rendering** | Vercel ⚡ | **Supabase** 🚀 |
| **Response handling** | Vercel | Vercel |

**Vercel execution time:**
- Old: ~300-500ms (includes email processing)
- New: ~100-200ms (just HTTP call to Edge Function)

---

## Real-World Example: Registration with Email

```
┌─────────────────────────────────────────────────────────┐
│  USER REGISTERS                                          │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  VERCEL: /api/register-student                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Time: 0ms - 200ms                                      │
│                                                          │
│  ⚡ Validate input (10ms)                               │
│  ⚡ Create auth user (80ms) → Supabase API             │
│  ⚡ Create profile (60ms) → Supabase API               │
│  ⚡ Call edge function (5ms) → Just SDK call           │
│     ↓                                                    │
│     supabaseAdmin.functions.invoke('send-email', {...}) │
│     (This is just an HTTP POST, returns immediately)    │
│                                                          │
│  ⚡ Return success to browser (5ms)                     │
│                                                          │
│  Total Vercel time: ~160ms                              │
│  Vercel function invocations: 1                         │
└─────────────────────────────────────────────────────────┘
                    │
                    │ HTTP POST (async)
                    ▼
┌─────────────────────────────────────────────────────────┐
│  SUPABASE: send-email Edge Function                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Time: 200ms - 450ms                                    │
│                                                          │
│  🚀 Receive request (5ms)                               │
│  🚀 Generate HTML template (15ms) ← NOT on Vercel      │
│  🚀 Initialize AWS SES client (10ms) ← NOT on Vercel   │
│  🚀 Call AWS SES API (180ms) ← NOT on Vercel           │
│  🚀 Return MessageId (5ms)                              │
│                                                          │
│  Total Supabase time: ~215ms                            │
│  Supabase Edge invocations: 1                           │
└─────────────────────────────────────────────────────────┘
```

---

## Why This Still Matters

### **Vercel Limits (Hobby Plan):**
- 100 GB-hours compute/month
- 100,000 function invocations/month

### **Old Way (all on Vercel):**
```
Email processing per request: ~300ms
100 registrations with emails = 100 × 300ms = 30 seconds of compute

Monthly with 10,000 emails:
- Compute: 10,000 × 300ms = 3,000 seconds = 50 minutes
- Invocations: 10,000
```

### **New Way (email logic on Supabase):**
```
Vercel API route per request: ~160ms
Supabase Edge Function: ~215ms (separate quota)

Monthly with 10,000 emails:
- Vercel compute: 10,000 × 160ms = 1,600 seconds = 27 minutes ✅
- Vercel invocations: 10,000
- Supabase invocations: 10,000 (free tier: 500K/month) ✅
```

**Savings:**
- 46% less Vercel compute time
- Email processing moved to Supabase free tier

---

## The Real Win: Heavy Email Workloads

For bulk emails (newsletters, notifications):

```
┌─────────────────────────────────────────────────────────┐
│  OLD: Send 1,000 emails via Vercel API route            │
│                                                          │
│  1,000 × 300ms = 300 seconds = 5 minutes Vercel compute │
│  1,000 function invocations                             │
│                                                          │
│  Vercel has to process all email logic                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  NEW: Send 1,000 emails via Edge Function               │
│                                                          │
│  Vercel: 1 API call to trigger = 100ms                  │
│  Supabase: 1,000 emails × 215ms = 215 seconds           │
│                                                          │
│  Vercel only handles the trigger, not email processing  │
└─────────────────────────────────────────────────────────┘
```

---

## Bottom Line

**YES, the API route runs on Vercel and uses Vercel resources.**

**BUT:**
- The **heavy email processing** (HTML generation, AWS SDK calls) runs on **Supabase**
- Vercel only handles **database operations** and **SDK HTTP call**
- Email logic is **offloaded** to Supabase Edge Functions
- This reduces **Vercel compute time by ~46%** per email
- For bulk emails, the difference is **massive**

---

## Optional: Use Separate Supabase Project

To **completely remove email from main infrastructure:**

```
Main Supabase Project:
├─ Database (students, teachers, grades)
├─ Edge Functions (ai-homework-chat, intelligent-ai-router)
└─ Main application logic

Email Supabase Project (separate):
├─ NO database (or minimal)
├─ ONLY send-email Edge Function
└─ AWS SES credentials
```

**This way:**
- Main database quota completely untouched by email
- Email service has its own 500K function calls/month
- Complete isolation for security and scaling

---

## Summary

| Aspect | Runs On | Uses Resources |
|--------|---------|----------------|
| API route execution | Vercel | Vercel |
| Database writes | Vercel → Supabase | Vercel network |
| **Email HTML generation** | **Supabase** | **Supabase** |
| **AWS SES API calls** | **Supabase** | **Supabase** |
| Response to browser | Vercel | Vercel |

The email **processing** happens on Supabase, not Vercel. The API route just **triggers** it.
