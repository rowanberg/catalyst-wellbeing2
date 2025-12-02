# Step-by-Step Deployment Guide
## Gemini API Governance System

Follow these exact steps to deploy your governance system.

---

## ✅ Prerequisites

- [ ] Supabase account at https://supabase.com
- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] Your Gemini API keys ready (get from https://aistudio.google.com/apikey)

---

## 📋 Step 1: Create Separate Supabase Project

### 1.1 Log into Supabase Dashboard

1. Open https://supabase.com/dashboard
2. Click **"New Project"**

### 1.2 Configure New Project

**Fill in these details:**

```
Project Name: gemini-api-governance
Database Password: [Generate a strong password - SAVE THIS!]
Region: Singapore (Southeast Asia) or closest to you
Pricing Plan: Free tier
```

3. Click **"Create new project"**
4. Wait 2-3 minutes for project to initialize

### 1.3 Save Your Credentials

Once created, go to **Settings → API**:

```bash
# Copy and save these - you'll need them!
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbG...
service_role key: eyJhbG... [KEEP SECRET!]
```

**✅ Checkpoint**: You should have a new empty Supabase project

---

## 📋 Step 2: Run Database Migration

### 2.1 Open SQL Editor

1. In your new Supabase project, click **SQL Editor** in left sidebar
2. Click **"New query"**

### 2.2 Run Schema Migration

1. Open this file locally: `c:\projects\kids\catalyst\database\migrations\create_gemini_api_usage_tables.sql`
2. Copy **ALL** the contents
3. Paste into Supabase SQL Editor
4. Click **"Run"** (bottom right)

**Expected Result**: 
```
Success. No rows returned
```

### 2.3 Verify Tables Created

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('gemini_api_key_usage', 'gemini_model_usage_summary');
```

**Expected Result**: Should show both tables

**✅ Checkpoint**: Database schema is ready

---

## 📋 Step 3: Deploy Edge Functions

### 3.1 Login to Supabase CLI

Open PowerShell in your project directory:

```powershell
cd c:\projects\kids\catalyst

# Login to Supabase
npx supabase login
```

This will open a browser - authorize the CLI.

### 3.2 Link to Your New Project

```powershell
# Get your project reference ID from dashboard URL
# URL format: https://supabase.com/dashboard/project/xxxxxxxxxxxxx
# The xxxxxxxxxxxxx is your project ref

npx supabase link --project-ref YOUR_PROJECT_REF_HERE
```

**Example:**
```powershell
npx supabase link --project-ref abcdefghijklmnop
```

Enter your database password when prompted.

### 3.3 Deploy Each Function

Deploy all 6 functions one by one:

```powershell
# Function 1: Get available key
npx supabase functions deploy get-available-key

# Function 2: Log usage
npx supabase functions deploy log-usage

# Function 3: Rotate key
npx supabase functions deploy rotate-key

# Function 4: Get key stats
npx supabase functions deploy get-key-stats

# Function 5: Get model stats
npx supabase functions deploy get-model-stats

# Function 6: Reset windows (optional)
npx supabase functions deploy reset-windows
```

### 3.4 Set Function Secrets

Set environment variables for Edge Functions:

```powershell
# Set Supabase URL
npx supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co

# Set service role key
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

**Replace with your actual values from Step 1.3!**

### 3.5 Verify Deployment

```powershell
npx supabase functions list
```

**Expected Output**:
```
┌────────────────────────┬─────────┬──────────────┐
│ NAME                   │ STATUS  │ UPDATED AT   │
├────────────────────────┼─────────┼──────────────┤
│ get-available-key      │ ACTIVE  │ just now     │
│ log-usage              │ ACTIVE  │ just now     │
│ rotate-key             │ ACTIVE  │ just now     │
│ get-key-stats          │ ACTIVE  │ just now     │
│ get-model-stats        │ ACTIVE  │ just now     │
│ reset-windows          │ ACTIVE  │ just now     │
└────────────────────────┴─────────┴──────────────┘
```

**✅ Checkpoint**: All 6 Edge Functions deployed

---

## 📋 Step 4: Add Gemini API Keys to Database

### 4.1 Prepare Your API Keys

Get your Gemini API keys from https://aistudio.google.com/apikey

You need at least:
- **2-3 keys for Gemini 3 Pro** (unlimited rpm/rpd)
- **3-5 keys for Gemini 2.5 Pro** (2 rpm, 50 rpd each)

### 4.2 Insert Keys via SQL Editor

Go back to **SQL Editor** in Supabase, click **"New query"**, and run:

#### For Gemini 3 Pro Keys:

```sql
-- Replace with YOUR actual API keys
INSERT INTO gemini_api_key_usage (
  api_key,
  model,
  status,
  rpm_limit,
  rpd_limit,
  tpm_limit
) VALUES
  ('AIzaSy...YOUR_KEY_1...', 'gemini_3_pro', 'active', NULL, NULL, 125000),
  ('AIzaSy...YOUR_KEY_2...', 'gemini_3_pro', 'active', NULL, NULL, 125000),
  ('AIzaSy...YOUR_KEY_3...', 'gemini_3_pro', 'active', NULL, NULL, 125000);
```

#### For Gemini 2.5 Pro Keys:

```sql
-- Replace with YOUR actual API keys
INSERT INTO gemini_api_key_usage (
  api_key,
  model,
  status,
  rpm_limit,
  rpd_limit,
  tpm_limit
) VALUES
  ('AIzaSy...YOUR_KEY_4...', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('AIzaSy...YOUR_KEY_5...', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('AIzaSy...YOUR_KEY_6...', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('AIzaSy...YOUR_KEY_7...', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('AIzaSy...YOUR_KEY_8...', 'gemini_2_5_pro', 'active', 2, 50, 125000);
```

### 4.3 Initialize Model Summary

```sql
SELECT aggregate_model_usage();
```

### 4.4 Verify Keys Added

```sql
SELECT 
  model,
  COUNT(*) as key_count,
  COUNT(*) FILTER (WHERE status = 'active') as active_keys
FROM gemini_api_key_usage
GROUP BY model;
```

**Expected Result**:
```
model           | key_count | active_keys
----------------|-----------|------------
gemini_3_pro    | 3         | 3
gemini_2_5_pro  | 5         | 5
```

**✅ Checkpoint**: API keys are in the database

---

## 📋 Step 5: Update Environment Variables

### 5.1 Add to Your CatalystWells `.env.local`

Open `c:\projects\kids\catalyst\.env.local` and add:

```bash
# Gemini API Governance Service
GEMINI_GOVERNANCE_URL=https://YOUR_PROJECT_ID.supabase.co
GEMINI_GOVERNANCE_ANON_KEY=eyJhbG...YOUR_ANON_KEY...
```

**Replace with your values from Step 1.3!**

### 5.2 Restart Your Dev Server

```powershell
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

**✅ Checkpoint**: Environment variables configured

---

## 🧪 Step 6: Test the System

### 6.1 Test Get Available Key

Open PowerShell and test:

```powershell
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/get-available-key" `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d '{"model":"gemini_3_pro","estimated_tokens":100}'
```

**Expected Response**:
```json
{
  "api_key": "AIzaSy...",
  "model": "gemini_3_pro",
  "capacity_remaining": {
    "rpm": null,
    "rpd": null,
    "tpm": 124900
  }
}
```

### 6.2 Test Log Usage

```powershell
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/log-usage" `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d '{"api_key":"YOUR_API_KEY_FROM_STEP_6.1","model":"gemini_3_pro","tokens_used":150,"success":true}'
```

**Expected Response**:
```json
{
  "success": true,
  "usage": {
    "rpm_used": 1,
    "rpd_used": 1,
    "tpm_used": 150
  },
  "rotated": false
}
```

### 6.3 Verify in Dashboard

Go to **Database → Tables → gemini_api_key_usage**

You should see:
- `rpm_used = 1`
- `tpm_used = 150`
- `total_requests = 1`
- `total_tokens = 150`

**✅ Checkpoint**: System is working!

---

## 🎯 Step 7: Integrate with Your Admin AI

### 7.1 Update Your AI Chat Code

You can now use the governance system in your admin AI. Example:

```typescript
import { GeminiApiGovernance } from '@/lib/gemini-api-governance'

const governance = new GeminiApiGovernance({
  governanceUrl: process.env.GEMINI_GOVERNANCE_URL!,
  governanceKey: process.env.GEMINI_GOVERNANCE_ANON_KEY!,
})

// Get key
const { api_key } = await governance.getAvailableKey('gemini_3_pro', 500)

// Make Gemini call
const genAI = new GoogleGenerativeAI(api_key)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
const result = await model.generateContent(prompt)

// Log usage
await governance.logUsage({
  api_key,
  model: 'gemini_3_pro',
  tokens_used: result.response.usageMetadata?.totalTokenCount || 0,
  success: true,
})
```

**OR** use the helper from `gemini-integration.ts`:

```typescript
import { chatWithGemini } from '@/lib/gemini-integration'

const response = await chatWithGemini(
  "Analyze student performance",
  conversationHistory,
  systemPrompt
)
```

---

## 🎉 Done!

Your Gemini API Governance System is now live and operational!

## 📊 Monitor Usage

View usage stats anytime:

```sql
-- Check current usage
SELECT * FROM gemini_api_key_usage;

-- Check model summaries
SELECT * FROM gemini_model_usage_summary;

-- Check rotated keys
SELECT api_key, rotation_count, last_rotated_at 
FROM gemini_api_key_usage 
WHERE status = 'rotated';
```

## 🆘 Troubleshooting

### Edge Functions Not Working

```powershell
# Check function logs
npx supabase functions logs get-available-key
```

### Keys Exhausting Too Fast

Add more keys following Step 4.2

### Reset a Key Manually

```sql
UPDATE gemini_api_key_usage
SET 
  status = 'active',
  rpm_used = 0,
  rpd_used = 0,
  tpm_used = 0,
  minute_window_start = NOW(),
  day_window_start = NOW()
WHERE api_key = 'YOUR_KEY_HERE';
```

## 📚 Additional Resources

- Full deployment guide: `DEPLOYMENT.md`
- SDK documentation: `c:\projects\kids\catalyst\src\lib\gemini-api-governance.ts`
- Edge Functions code: `c:\projects\kids\catalyst\supabase\functions\`

---

**Need help?** Review the logs:
- Supabase Dashboard → Edge Functions → Logs
- Your app: `npm run dev` console output
