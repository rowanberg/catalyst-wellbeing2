# Edge Function Environment Variables Setup

## ⚠️ Important: Supabase vs Vercel Environment Variables

**Edge Functions run on Supabase infrastructure**, not Vercel. They need their own environment variables configured in Supabase Dashboard.

---

## Required Environment Variables for ai-homework-chat

The following environment variables are automatically available to all Supabase Edge Functions:

### Automatic Variables (Already Set)
- ✅ `SUPABASE_URL` - Your project URL
- ✅ `SUPABASE_ANON_KEY` - Public anon key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for database access)

These are **automatically injected** by Supabase and don't need manual configuration.

---

## How to Set Custom Environment Variables

If you need additional variables (e.g., custom API keys), set them via:

### Option 1: Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/qtngqlvrqdvaogckigvu/settings/functions
2. Click **"Edge Functions"** in left sidebar
3. Scroll to **"Environment Variables"**
4. Add variables as needed
5. They'll be available to all Edge Functions

### Option 2: Supabase CLI
```bash
supabase secrets set VARIABLE_NAME=value
```

---

## Current Setup Status

### ✅ ai-homework-chat Edge Function
**Status:** Fully configured with automatic variables

**What it uses:**
- `Deno.env.get('SUPABASE_URL')` ✅
- `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` ✅
- `Deno.env.get('SUPABASE_ANON_KEY')` ✅

**Database functions it calls:**
- `get_or_create_user_quota()`
- `increment_user_quota()`
- `intelligent-ai-router` (via supabase.functions.invoke)

**External APIs:**
- Gemini API (keys managed via database + intelligent-ai-router)

---

## Vercel vs Supabase

| Resource | Runs On | Uses Env From | Counts Toward |
|----------|---------|---------------|---------------|
| Next.js Pages | Vercel | `.env.local` / Vercel Dashboard | Vercel quota |
| API Routes (`/api/*`) | Vercel | `.env.local` / Vercel Dashboard | Vercel quota |
| **Edge Functions** | **Supabase** | **Supabase Dashboard** | **Supabase quota** |
| Database | Supabase | N/A | Supabase quota |

---

## Migration Complete ✅

**Before:**
```
Client → Vercel API (/api/chat/gemini-extended) → Supabase (get key) → Gemini API
```
- ❌ Used Vercel compute
- ❌ Used Vercel environment variables
- ❌ Counted toward Vercel quota

**After:**
```
Client → Supabase Edge Function (ai-homework-chat) → Gemini API
```
- ✅ Uses Supabase compute
- ✅ Uses Supabase environment variables (auto-injected)
- ✅ Counts toward Supabase quota only
- ✅ **No Vercel usage at all**

---

## Verification

To verify Edge Function is working correctly:

1. **Check Supabase Dashboard:**
   - https://supabase.com/dashboard/project/qtngqlvrqdvaogckigvu/functions
   - Click `ai-homework-chat`
   - View **Logs** tab for requests

2. **Check Browser Network Tab:**
   - Should see: `https://qtngqlvrqdvaogckigvu.supabase.co/functions/v1/ai-homework-chat`
   - NOT: `http://localhost:3000/api/chat/...`

3. **Check Vercel Analytics (if deployed):**
   - Should see NO requests to `/api/chat/gemini-extended`
   - Only static page requests

---

## Cost Breakdown

### Supabase Edge Functions (Free Tier)
- **500K requests/month** free
- **2M function invocations/month** free
- More than enough for AI homework helper

### Vercel (Free Tier - No longer used for AI)
- Edge Functions quota preserved ✅
- Serverless quota preserved ✅
- Only serves Next.js pages

**Result:** Zero Vercel compute used for AI requests! 🎉
