# Debugging Checklist - Gemini Governance Integration

## ❌ Current Error
```
❌ Governance error: {
  code: 'WORKER_ERROR',
  message: 'Function exited due to an error (please check logs)'
}
```

## 🔍 Most Likely Issue: API Keys Not Inserted

### Check 1: Verify API Keys in Database

1. Go to Supabase SQL Editor:
   https://supabase.com/dashboard/project/pomzuyuibiodlxzarhsj/sql/new

2. Run this query:
```sql
SELECT 
  model,
  COUNT(*) as total_keys,
  COUNT(*) FILTER (WHERE status = 'active') as active_keys
FROM gemini_api_key_usage
GROUP BY model;
```

**Expected Result:**
```
model           | total_keys | active_keys
----------------|------------|------------
gemini_3_pro    | 9          | 9
gemini_2_5_pro  | 9          | 9
```

**If you get 0 rows:** You need to insert your API keys!

### Fix: Insert Your API Keys

Run the SQL from: `c:\projects\kids\catalyst\database\migrations\insert_gemini_api_keys.sql`

Copy the entire file content and paste it into Supabase SQL Editor, then click "Run".

---

## Check 2: View Edge Function Logs

1. Go to Edge Functions dashboard:
   https://supabase.com/dashboard/project/pomzuyuibiodlxzarhsj/functions

2. Click on `get-available-key` function

3. Click "Logs" tab

4. Look for error messages - paste them here

---

## Check 3: Verify Environment Variables

Make sure your `.env.local` has:

```bash
GEMINI_GOVERNANCE_URL=https://pomzuyuibiodlxzarhsj.supabase.co
GEMINI_GOVERNANCE_ANON_KEY=eyJhbG... (your actual key)
```

Get anon key from:
https://supabase.com/dashboard/project/pomzuyuibiodlxzarhsj/settings/api

---

## Check 4: Test Edge Function Directly

Test the governance API directly with curl:

```powershell
curl -X POST "https://pomzuyuibiodlxzarhsj.supabase.co/functions/v1/get-available-key" `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d '{"model":"gemini_3_pro","estimated_tokens":100}'
```

**Replace `YOUR_ANON_KEY`** with your actual anon key.

**Expected Response:**
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

---

## Quick Fix Steps

1. **Did you insert the API keys?** If not, run `insert_gemini_api_keys.sql`
2. **Did you add environment variables?** Check `.env.local`
3. **Did you restart dev server?** Run `npm run dev` again

---

## Next Steps

1. Check if keys are in database (SQL query above)
2. If no keys, insert them
3. Test Edge Function with curl
4. Share any error messages from Edge Function logs
