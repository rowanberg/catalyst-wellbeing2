# AI Quota System - Deployment Steps

## Step 1: Run Database Migration

Go to your Supabase SQL Editor and run the migration:

```sql
-- Run this file: database/migrations/create_ai_quota_system_simplified.sql
```

This will create:
- `user_ai_quotas` table
- `ai_request_logs` table  
- Helper functions for quota management

## Step 2: Verify Tables Created

Run this query to verify:

```sql
SELECT * FROM user_ai_quotas LIMIT 1;
SELECT * FROM ai_request_logs LIMIT 1;
```

## Step 3: Test the System

1. Open http://localhost:3000/student/homework-helper
2. You should now see the QuotaIndicator showing "0/30" and "0/500"
3. Send a message - it should work!
4. The quota will increment automatically

## How It Works

### Before Migration:
- ❌ Extended API tries to access non-existent tables
- ❌ Returns error: "Daily request limit reached"
- ❌ QuotaIndicator can't load data

### After Migration:
- ✅ Tables exist, quota tracking works
- ✅ First 30 requests use Gemini 2.0 Flash
- ✅ Next 500 requests use Gemma models (27b → 12b → 4b)
- ✅ QuotaIndicator shows real-time usage

## Troubleshooting

### If you still see errors:

1. **Check if migration ran successfully:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name IN ('user_ai_quotas', 'ai_request_logs');
   ```

2. **Manually create a quota entry for testing:**
   ```sql
   INSERT INTO user_ai_quotas (user_id, normal_daily_usage, extra_daily_usage)
   VALUES (auth.uid(), 0, 0)
   ON CONFLICT (user_id) DO NOTHING;
   ```

3. **Check API logs:**
   - Open browser DevTools → Network tab
   - Send a message
   - Look at the `/api/chat/gemini-extended` response

### Common Issues:

**"Authentication required"**
- Make sure you're logged in
- The session token may have expired - refresh the page

**"Failed to check quota"**  
- The database migration didn't run
- RLS policies might be blocking access

**"No available API keys"**
- All 100+ Gemini keys are exhausted (unlikely)
- Check Supabase Edge Function is working

## Quick Fix for Development

If you want to test without the full migration, temporarily disable quota checks:

In `src/app/api/chat/gemini-extended/route.ts`, comment out the quota check:

```typescript
// const quotaCheck = await checkUserQuota(userId)
// if (!quotaCheck.canProceed) { ... }

// Force it to use normal quota for testing:
const quotaCheck = { canProceed: true, quotaType: 'normal', remainingNormal: 30, remainingExtra: 500 }
```

But make sure to re-enable it after testing!
