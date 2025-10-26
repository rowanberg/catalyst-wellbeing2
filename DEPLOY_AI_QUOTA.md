# Deploy AI Quota System - Quick Start

## Current Status: ✅ Code Complete | ⏳ Database Pending

All code changes are complete. You just need to run the database migration.

## Run This Now:

### Step 1: Open Supabase SQL Editor
Go to your Supabase project → SQL Editor

### Step 2: Copy & Run This SQL
Open `database/migrations/create_ai_quota_system_simplified.sql` and execute it.

This creates:
- ✅ `user_ai_quotas` table (tracks 30 + 500 requests)
- ✅ `ai_request_logs` table (analytics)
- ✅ Helper functions for quota management
- ✅ RLS policies

### Step 3: Verify Tables Created
```sql
-- Run this to verify:
SELECT * FROM user_ai_quotas LIMIT 1;
SELECT * FROM ai_request_logs LIMIT 1;
```

### Step 4: Test It
1. Refresh http://localhost:3000/student/homework-helper
2. You should see the QuotaIndicator showing "0/30" and "0/500"
3. Send a message - it should work!

## What You Get:

### User Experience:
- **First 30 requests/day**: Gemini 2.0 Flash (fastest)
- **Next 500 requests/day**: Gemma models with automatic fallback:
  - Tries gemma-3-27b first
  - Falls back to gemma-3-12b if needed
  - Final fallback to gemma-3-4b
- **Real-time quota display** with progress bars
- **Daily reset** at midnight UTC

### Technical Details:
- Uses existing 100+ Gemini API keys
- Each model has separate rate limits (30 rpm, 15,000 tpm, 144,000 rpd)
- Server-side quota tracking (no client-side manipulation)
- Comprehensive request logging for analytics

## Current Error Explained:

**Error**: "Failed to check quota"
**Cause**: Database tables don't exist yet
**Fix**: Run the migration (Step 1-2 above)

After migration, the error will disappear and users get 530 total requests/day instead of 30.
