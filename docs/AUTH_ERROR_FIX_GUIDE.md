# Authentication Error Fix Guide

## ❌ Error: "Invalid Refresh Token: Refresh Token Not Found"

This error occurs when the Supabase refresh token is missing or invalid, typically after:
- Session expiration
- Browser cookies/localStorage cleared
- Supabase configuration changes
- Server restart with session mismatch

## ✅ Fixes Applied

### 1. **Updated Supabase Client Configuration**
File: `src/lib/supabaseClient.ts`

**Changes:**
- ✅ Added `flowType: 'pkce'` for better security
- ✅ Added `Secure` flag to cookies
- ✅ Implemented auth state change monitoring
- ✅ Added automatic token refresh handling
- ✅ Added session cleanup on sign out

### 2. **Enhanced Server-Side Client**
File: `src/lib/supabase-server.ts`

**Changes:**
- ✅ Added PKCE flow type
- ✅ Better error logging for cookie operations
- ✅ Created `getAuthenticatedUser()` helper function
- ✅ Graceful error handling

### 3. **Created Auth Error Handler**
File: `src/lib/auth-error-handler.ts`

**Features:**
- ✅ Detects refresh token errors automatically
- ✅ Clears localStorage and cookies
- ✅ Shows user-friendly toast messages
- ✅ Redirects to login page
- ✅ Retry mechanism with exponential backoff
- ✅ Global error monitoring
- ✅ Session validity checking

## 🔧 How to Use the Auth Error Handler

### 1. Initialize in Your App

Add to your root layout or main app component:

```typescript
// src/app/layout.tsx or src/app/page.tsx
import { initAuthErrorMonitoring } from '@/lib/auth-error-handler'
import { useEffect } from 'react'

export default function RootLayout() {
  useEffect(() => {
    initAuthErrorMonitoring()
  }, [])
  
  return (
    // Your layout
  )
}
```

### 2. Wrap API Calls

```typescript
import { withAuthErrorHandling } from '@/lib/auth-error-handler'

// Wrap your API function
const fetchData = withAuthErrorHandling(async () => {
  const { data, error } = await supabase
    .from('table')
    .select('*')
  
  if (error) throw error
  return data
})

// Use it
try {
  const data = await fetchData()
} catch (error) {
  // Error is automatically handled
  console.error('Failed to fetch data:', error)
}
```

### 3. Check Session Before Critical Operations

```typescript
import { checkSessionValidity } from '@/lib/auth-error-handler'

const handleCriticalAction = async () => {
  const isValid = await checkSessionValidity()
  
  if (!isValid) {
    console.log('Session invalid, user will be redirected')
    return
  }
  
  // Proceed with action
}
```

### 4. Manual Session Refresh

```typescript
import { refreshSession } from '@/lib/auth-error-handler'

const handleRefresh = async () => {
  const success = await refreshSession()
  
  if (success) {
    console.log('Session refreshed successfully')
  } else {
    console.log('Failed to refresh, user will be redirected')
  }
}
```

## 🚨 Immediate Solutions

### Solution 1: Clear Browser Data (Quick Fix)
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear all localStorage items
4. Clear all cookies for localhost
5. Refresh the page
6. Sign in again

### Solution 2: Sign Out and Sign In
1. Click sign out (if available)
2. Clear browser cache
3. Sign in again with credentials

### Solution 3: Reset Supabase Session
```typescript
// Run this in browser console
localStorage.clear()
document.cookie.split(";").forEach((c) => {
  document.cookie = c
    .replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
})
window.location.href = '/login'
```

## 🔍 Debugging Steps

### 1. Check Supabase Configuration
```bash
# Verify environment variables
cat .env.local | grep SUPABASE
```

Should show:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Check Browser Console
Look for these messages:
- ✅ `Token refreshed successfully` - Good!
- ❌ `Invalid Refresh Token` - Problem
- ❌ `Refresh Token Not Found` - Problem

### 3. Check Network Tab
- Look for failed `/auth/v1/token` requests
- Check response status (should be 200)
- Verify request headers include proper tokens

### 4. Check Cookies
In DevTools → Application → Cookies:
- Should see `sb-*-auth-token` cookies
- Should have valid expiration dates
- Should have `Secure` and `SameSite` flags

## 🛠️ Advanced Fixes

### Fix 1: Update Supabase Packages
```bash
npm install @supabase/supabase-js@latest @supabase/ssr@latest
```

### Fix 2: Reset Supabase Project (if needed)
1. Go to Supabase Dashboard
2. Settings → API
3. Reset anon key (if compromised)
4. Update `.env.local` with new key

### Fix 3: Check RLS Policies
Ensure your Row Level Security policies allow authenticated users:
```sql
-- Check auth policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Example policy
CREATE POLICY "Users can read own data"
ON your_table FOR SELECT
USING (auth.uid() = user_id);
```

## 📋 Prevention Checklist

- [ ] Use PKCE flow (`flowType: 'pkce'`)
- [ ] Enable auto refresh (`autoRefreshToken: true`)
- [ ] Persist sessions (`persistSession: true`)
- [ ] Set secure cookies (`Secure` flag)
- [ ] Monitor auth state changes
- [ ] Handle errors gracefully
- [ ] Clear data on sign out
- [ ] Test session expiration
- [ ] Implement retry logic
- [ ] Add user feedback (toasts)

## 🎯 Expected Behavior After Fix

### Normal Flow:
1. User signs in → Session created
2. Token expires → Auto-refreshed
3. Refresh succeeds → User continues
4. User signs out → Data cleared

### Error Flow:
1. Refresh token invalid → Error detected
2. Handler clears data → Clean state
3. Toast shown → User informed
4. Redirect to login → User re-authenticates

## 📞 Support

If the error persists:

1. **Check Supabase Status**: https://status.supabase.com
2. **Review Logs**: Check browser console and server logs
3. **Test with Fresh Browser**: Try incognito mode
4. **Verify Environment**: Ensure `.env.local` is correct
5. **Contact Support**: Provide error logs and steps to reproduce

## 🔗 Related Files

- `src/lib/supabaseClient.ts` - Client configuration
- `src/lib/supabase-server.ts` - Server configuration
- `src/lib/auth-error-handler.ts` - Error handling utility
- `src/app/(auth)/login/page.tsx` - Login page
- `.env.local` - Environment variables

---

**Last Updated**: 2025-09-30
**Status**: ✅ Fixed and Monitored
