# Deploy Intelligent AI Router to Supabase Edge Functions

## 📋 Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Supabase project linked**
   ```bash
   cd c:\projects\kids\catalyst
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. **Database migrations applied**
   ```bash
   # Run these first
   psql -d your_database -f database/migrations/030_add_gemini_model_families.sql
   psql -d your_database -f database/migrations/031_add_scheduled_resets.sql
   psql -d your_database -f database/migrations/032_populate_model_keys_from_existing.sql
   ```

---

## 🔐 Step 1: Set Environment Variables

The Edge Function needs the encryption key to decrypt API keys:

```bash
# Generate or use existing encryption key (64-character hex string)
supabase secrets set GEMINI_ENCRYPTION_KEY=your-64-char-hex-key
```

**To get your existing key from your environment:**
```powershell
# Windows PowerShell
$env:GEMINI_ENCRYPTION_KEY
```

---

## 🚀 Step 2: Deploy the Function

```bash
# Navigate to project root
cd c:\projects\kids\catalyst

# Deploy the function
supabase functions deploy intelligent-ai-router --no-verify-jwt
```

**Expected output:**
```
Deploying function intelligent-ai-router...
  Function URL: https://your-project.supabase.co/functions/v1/intelligent-ai-router
  Status: Deployed
```

---

## ✅ Step 3: Verify Deployment

### Check Function Status
```bash
supabase functions list
```

### View Function Logs (Real-time)
```bash
supabase functions logs intelligent-ai-router --tail
```

---

## 🧪 Step 4: Test the Deployed Function

### Test with curl (PowerShell)

```powershell
# Get your Supabase anon key from dashboard
$SUPABASE_URL = "https://your-project.supabase.co"
$SUPABASE_ANON_KEY = "your-anon-key"

# Test request
curl -X POST "$SUPABASE_URL/functions/v1/intelligent-ai-router" `
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d '{
    "model": "gemini-2.5-flash-lite",
    "tokens": 1500,
    "prompt": "Hello world",
    "userId": "test-user-123"
  }'
```

### Test with JavaScript

```javascript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/intelligent-ai-router',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gemini-2.5-flash-lite',
      tokens: 1500,
      prompt: 'Test prompt',
      userId: 'test-user-123'
    })
  }
)

const data = await response.json()
console.log(data)
// Expected: { success: true, api_key: "AIza...", model_used: "...", ... }
```

---

## 🔍 Step 5: Monitor Performance

### View Recent Logs
```bash
# Last 100 entries
supabase functions logs intelligent-ai-router --limit 100
```

### Check Usage Analytics in Database
```sql
-- View last hour of API usage
SELECT 
  model_requested,
  model_used,
  COUNT(*) as requests,
  AVG(request_duration_ms) as avg_duration,
  COUNT(*) FILTER (WHERE status = 'fallback') as fallback_count
FROM api_usage_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY model_requested, model_used;
```

---

## 🔄 Step 6: Update/Redeploy

When you make changes to the function:

```bash
# Redeploy
supabase functions deploy intelligent-ai-router --no-verify-jwt

# Verify new version
supabase functions logs intelligent-ai-router --tail
```

---

## 🛡️ Security Configuration

### CORS Settings (if needed)
The function already includes CORS headers:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### Restrict Origins (Production)
For production, update CORS to specific domains:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

---

## 📊 Integration Example

### In Your Application (Next.js)

**Create API Route:** `src/app/api/ai/get-key/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { model, tokens, prompt } = await request.json()
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/intelligent-ai-router`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'gemini-2.5-flash-lite',
        tokens: tokens || 1000,
        prompt,
        userId: request.headers.get('x-user-id'),
        endpoint: '/api/ai/chat'
      })
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    return NextResponse.json(error, { status: response.status })
  }
  
  const data = await response.json()
  return NextResponse.json(data)
}
```

**Usage in Client:**

```typescript
async function getAIKey(model: string) {
  const response = await fetch('/api/ai/get-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      model,
      prompt: 'Your prompt here'
    })
  })
  
  const { api_key, model_used, fallback_count } = await response.json()
  
  if (fallback_count > 0) {
    console.log(`Fallback: ${model} → ${model_used}`)
  }
  
  return api_key
}
```

---

## 🐛 Troubleshooting

### Function Not Found (404)
```bash
# Check if function is deployed
supabase functions list

# Redeploy
supabase functions deploy intelligent-ai-router --no-verify-jwt
```

### Encryption Key Error
```bash
# Verify secret is set
supabase secrets list

# Set again if missing
supabase secrets set GEMINI_ENCRYPTION_KEY=your-key
```

### Database Connection Error
```bash
# Check database tables exist
psql -d your_database -c "\dt gemini*"

# If missing, run migrations
psql -d your_database -f database/migrations/030_add_gemini_model_families.sql
```

### All Keys Exhausted (429)
```sql
-- Check key availability
SELECT * FROM get_key_usage_summary();

-- Force reset all counters if needed
SELECT * FROM admin_reset_all_rpm_counters();
SELECT * FROM admin_reset_all_rpd_counters();
```

---

## 📈 Performance Optimization

### Enable HTTP/2
Already enabled by default in Supabase Edge Functions

### Add Function Timeout
```typescript
// In your function, add timeout handling
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

try {
  const response = await fetch(url, { signal: controller.signal })
  // ...
} finally {
  clearTimeout(timeoutId)
}
```

### Monitor Cold Starts
```bash
# Check function invocation times
supabase functions logs intelligent-ai-router --limit 50 | grep "request_duration_ms"
```

---

## 🎯 Quick Reference

| Command | Purpose |
|---------|---------|
| `supabase functions deploy intelligent-ai-router` | Deploy/update function |
| `supabase functions logs intelligent-ai-router --tail` | Live logs |
| `supabase functions list` | List all functions |
| `supabase secrets set KEY=value` | Set environment variable |
| `supabase secrets list` | List all secrets |
| `supabase functions delete intelligent-ai-router` | Delete function |

---

## ✅ Deployment Checklist

- [ ] Database migrations applied (030, 031, 032)
- [ ] API keys populated in tables
- [ ] `GEMINI_ENCRYPTION_KEY` secret set
- [ ] Function deployed successfully
- [ ] Test request returns valid API key
- [ ] Logs show no errors
- [ ] Usage analytics recording in `api_usage_logs`
- [ ] Fallback chain working (test with rate-limited keys)
- [ ] Production CORS configured (if needed)
- [ ] Monitoring dashboard set up

---

## 📞 Support

**View Function URL:**
```bash
supabase functions list
```

**Get Project Reference:**
```bash
supabase projects list
```

**Check Supabase Dashboard:**
- Functions: https://app.supabase.com/project/your-ref/functions
- Database: https://app.supabase.com/project/your-ref/editor
- Logs: https://app.supabase.com/project/your-ref/logs
