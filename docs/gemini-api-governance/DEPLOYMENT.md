# Gemini API Governance System - Deployment Guide

## Complete setup guide for the standalone Supabase governance service

---

## 📋 Prerequisites

- Supabase account (supabase.com)
- Supabase CLI (`npm install -g supabase`)
- Git repository access
- Gemini API keys (multiple keys for rotation)

---

## 🚀 Step 1: Create New Supabase Project

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. **Project Name**: `gemini-api-governance`
4. **Database Password**: [Generate strong password]
5. **Region**: Choose closest to your app
6. Click "Create new project"

### 1.2 Note Your Credentials

Once created, find in Settings → API:
- **Project URL**: `https://[project-id].supabase.co`
- **Anon/Public Key**: `eyJhbG...`
- **Service Role Key**: `eyJhbG...` (keep secret!)

---

## 🗄️ Step 2: Create Database Schema

### 2.1 Run Migration SQL

1. Go to SQL Editor in Supabase Dashboard
2. Create new query
3. Copy contents of `database/migrations/create_gemini_api_usage_tables.sql`
4. Click "Run"

This creates:
- ✅ `gemini_api_key_usage` table
- ✅ `gemini_model_usage_summary` table
- ✅ Custom types (enums)
- ✅ Indexes
- ✅ RLS policies
- ✅ Helper functions

### 2.2 Verify Tables

```sql
-- Check tables exist
SELECT * FROM gemini_api_key_usage LIMIT 1;
SELECT * FROM gemini_model_usage_summary;
```

---

## 🔑 Step 3: Insert API Keys

### 3.1 Add Gemini 3 Pro Keys

```sql
INSERT INTO gemini_api_key_usage (
  api_key,
  model,
  status,
  rpm_limit,
  rpd_limit,
  tpm_limit
) VALUES
  ('YOUR_GEMINI_3_PRO_KEY_1', 'gemini_3_pro', 'active', NULL, NULL, 125000),
  ('YOUR_GEMINI_3_PRO_KEY_2', 'gemini_3_pro', 'active', NULL, NULL, 125000);
```

### 3.2 Add Gemini 2.5 Pro Keys

```sql
INSERT INTO gemini_api_key_usage (
  api_key,
  model,
  status,
  rpm_limit,
  rpd_limit,
  tpm_limit
) VALUES
  ('YOUR_GEMINI_2_5_PRO_KEY_1', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('YOUR_GEMINI_2_5_PRO_KEY_2', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('YOUR_GEMINI_2_5_PRO_KEY_3', 'gemini_2_5_pro', 'active', 2, 50, 125000);
```

### 3.3 Initialize Model Summaries

```sql
SELECT aggregate_model_usage();
```

---

## 📦 Step 4: Deploy Edge Functions

### 4.1 Login to Supabase CLI

```bash
npx supabase login
```

### 4.2 Link to Project

```bash
cd c:\projects\kids\catalyst
npx supabase link --project-ref [your-project-id]
```

### 4.3 Deploy All Functions

```bash
npx supabase functions deploy get-available-key
npx supabase functions deploy log-usage
npx supabase functions deploy rotate-key
npx supabase functions deploy get-key-stats
npx supabase functions deploy get-model-stats
npx supabase functions deploy reset-windows
```

### 4.4 Verify Deployment

```bash
npx supabase functions list
```

Should show all 6 functions as "deployed".

---

## ⚙️ Step 5: Configure Environment Variables

### 5.1 Set Secrets for Edge Functions

Go to Dashboard → Edge Functions → Manage secrets

Add:
```
SUPABASE_URL=https://[your-project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

Or via CLI:
```bash
npx supabase secrets set SUPABASE_URL=https://[project-id].supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

---

## ⏰ Step 6: Set Up Cron Jobs

### Option A: pg_cron (Recommended)

Enable pg_cron extension:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

Schedule jobs:
```sql
-- Reset minute windows every minute
SELECT cron.schedule(
  'reset-minute-windows',
  '* * * * *',
  $$SELECT reset_minute_windows()$$
);

-- Reset day windows daily at midnight UTC
SELECT cron.schedule(
  'reset-day-windows',
  '0 0 * * *',
  $$SELECT reset_day_windows()$$
);

-- Aggregate model usage every hour
SELECT cron.schedule(
  'aggregate-model-usage',
  '0 * * * *',
  $$SELECT aggregate_model_usage()$$
);
```

### Option B: External Cron (GitHub Actions, etc.)

Create workflow to call reset-windows function:
```bash
curl -X POST \
  https://[project-id].supabase.co/functions/v1/reset-windows \
  -H "Authorization: Bearer [service-role-key]"
```

---

## 🔗 Step 7: Integrate with CatalystWells

### 7.1 Add Environment Variables

In your CatalystWells `.env.local`:
```env
GEMINI_GOVERNANCE_URL=https://[project-id].supabase.co
GEMINI_GOVERNANCE_ANON_KEY=[anon-key-from-step-1.2]
```

### 7.2 Use SDK in Your Code

```typescript
import { GeminiApiGovernance } from '@/lib/gemini-api-governance'

const governance = new GeminiApiGovernance({
  governanceUrl: process.env.GEMINI_GOVERNANCE_URL!,
  governanceKey: process.env.GEMINI_GOVERNANCE_ANON_KEY!,
})

// Before calling Gemini
const {api_key} = await governance.getAvailableKey('gemini_2_5_pro', 100)

// Make Gemini API call
const geminiResponse = await callGeminiAPI(api_key, prompt)

// Log usage
await governance.logUsage({
  api_key,
  model: 'gemini_2_5_pro',
  tokens_used: geminiResponse.usageMetadata.totalTokens,
  success: true
})
```

### 7.3 Or Use Helper Method

```typescript
const result = await governance.withGeminiKey(
  'gemini_2_5_pro',
  100,
  async (apiKey) => {
    const response = await callGeminiAPI(apiKey, prompt)
    return {
      result: response.text,
      tokensUsed: response.usageMetadata.totalTokens
    }
  }
)
```

---

## ✅ Step 8: Test the System

### 8.1 Test Get Available Key

```bash
curl -X POST \
  https://[project-id].supabase.co/functions/v1/get-available-key \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini_3_pro","estimated_tokens":100}'
```

Expected response:
```json
{
  "api_key": "YOUR_KEY",
  "model": "gemini_3_pro",
  "capacity_remaining": {"rpm": null, "rpd": null, "tpm": 124900}
}
```

### 8.2 Test Log Usage

```bash
curl -X POST \
  https://[project-id].supabase.co/functions/v1/log-usage \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_KEY",
    "model": "gemini_3_pro",
    "tokens_used": 150,
    "success": true
  }'
```

### 8.3 Check Stats

```bash
curl https://[project-id].supabase.co/functions/v1/get-key-stats \
  -H "Authorization: Bearer [anon-key]"

curl https://[project-id].supabase.co/functions/v1/get-model-stats \
  -H "Authorization: Bearer [anon-key]"
```

### 8.4 Verify Auto-Rotation

For Gemini 2.5 Pro (2 rpm limit):
1. Call `get-available-key` and `log-usage` twice
2. On 3rd call, check key status changed to 'rotated'
3. New key should be returned

---

## 📊 Step 9: View Dashboard Data

### SQL Queries for Monitoring

```sql
-- Current key usage
SELECT 
  api_key,
  model,
  status,
  rpm_used,
  rpd_used,
  tpm_used,
  total_requests
FROM gemini_api_key_usage
ORDER BY model, status;

-- Model summaries
SELECT * FROM gemini_model_usage_summary;

-- Recently rotated keys
SELECT 
  api_key,
  model,
  rotation_count,
  last_rotated_at,
  notes
FROM gemini_api_key_usage
WHERE status = 'rotated'
ORDER BY last_rotated_at DESC;
```

---

## 🔒 Security Checklist

- ✅ RLS policies enabled on both tables
- ✅ Service role key kept secret (never in client code)
- ✅ Anon key used for client requests only
- ✅ API keys stored securely in database
- ✅ CORS configured for Edge Functions

---

## 🐛 Troubleshooting

### Functions Not Deploying

```bash
# Check Supabase CLI version
npx supabase --version

# Update if needed
npm install -g supabase@latest

# Re-link project
npx supabase link --project-ref [project-id]
```

### No Keys Available Error

```sql
-- Check active keys
SELECT * FROM gemini_api_key_usage WHERE status = 'active';

-- Reset a key manually
UPDATE gemini_api_key_usage
SET status = 'active',
    rpm_used = 0,
    rpd_used = 0,
    tpm_used = 0
WHERE api_key = 'YOUR_KEY';
```

### Window Resets Not Working

```sql
-- Manually reset windows
SELECT reset_minute_windows();
SELECT reset_day_windows();

-- Check cron jobs
SELECT * FROM cron.job;

-- Check cron job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## 📈 Monitoring & Alerts

### Set Up Alerts (Optional)

Create Edge Function or use Supabase webhooks to alert when:
- Any key exceeds 80% of limits
- All keys exhausted for a model
- Rotation count is high
- Abnormal token usage

---

## 🎉 Complete!

Your Gemini API governance system is now live and managing your API keys automatically!

Next steps:
- Integrate into CatalystWells AI assistant
- Monitor usage via dashboard
- Add more keys as needed
- Set up alerts for limit tracking
