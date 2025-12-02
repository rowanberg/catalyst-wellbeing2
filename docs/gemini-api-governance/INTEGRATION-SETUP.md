# =====================================================
# SETUP INSTRUCTIONS
# Gemini API Governance Integration
# =====================================================

## Step 1: Get Your Governance Supabase Credentials

1. Open your Gemini Governance Supabase project:
   https://supabase.com/dashboard/project/pomzuyuibiodlxzarhsj/settings/api

2. Copy these two values:
   - **Project URL**: https://pomzuyuibiodlxzarhsj.supabase.co
   - **anon/public key**: (starts with eyJhbG...)

## Step 2: Add to .env.local

Open `c:\projects\kids\catalyst\.env.local` and add these lines:

```bash
# Gemini API Governance (separate Supabase project)
GEMINI_GOVERNANCE_URL=https://pomzuyuibiodlxzarhsj.supabase.co
GEMINI_GOVERNANCE_ANON_KEY=YOUR_ANON_KEY_HERE
```

Replace `YOUR_ANON_KEY_HERE` with the anon key you copied in Step 1.

## Step 3: Restart Your Dev Server

```powershell
# Stop current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

## Step 4: Test the Admin AI Assistant

1. Go to: http://localhost:3000/admin/ai-assistant
2. Send a message
3. Your message will now use Gemini 3 Pro via the governance system!

## ✅ What This Does

- Uses **Gemini 3 Pro** (gemini-2.0-flash-exp model)
- Gets API keys from your **separate Supabase governance project**
- Automatically tracks usage and rotates keys
- No rate limit issues (9 keys available)

## 🔍 Verify It's Working

Check logs in your terminal for:
```
🔑 Requesting API key from governance...
✅ API key obtained from governance
🤖 Generating AI response with Gemini 3 Pro...
✅ AI response generated
📊 Usage logged to governance system
```

## 📊 Monitor Usage

View your API key usage in Supabase:
https://supabase.com/dashboard/project/pomzuyuibiodlxzarhsj/editor

Run this SQL to see current usage:
```sql
SELECT 
  model,
  COUNT(*) as total_keys,
  SUM(total_requests) as total_requests,
  SUM(total_tokens) as total_tokens
FROM gemini_api_key_usage
WHERE status = 'active'
GROUP BY model;
```

## 🆘 Troubleshooting

### Error: "Gemini governance not configured"
- Make sure you added both environment variables to `.env.local`
- Make sure you restarted `npm run dev`

### Error: "All API keys are rate-limited"
- Check if you inserted your Gemini keys into the database
- Run the SQL from `database/migrations/insert_gemini_api_keys.sql`

### Error: "Failed to get API key"
- Verify your governance Supabase project is running
- Check the anon key is correct
- Verify Edge Functions are deployed

## 🎉 Done!

Your admin AI assistant now uses Gemini 3 Pro with automatic API key management!
