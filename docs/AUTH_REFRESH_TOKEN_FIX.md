# Supabase Auth Refresh Token Error Fix

## Problem
The application was showing the error:
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

This error occurred because:
1. Missing auth callback route for OAuth flow
2. Middleware not handling Supabase auth state
3. No automatic token refresh in middleware

## Solution Implemented

### 1. Created Auth Callback Route
**File:** `src/app/auth/callback/route.ts`

This route handles:
- OAuth redirects from Supabase
- Code exchange for session tokens
- Role-based dashboard redirection
- Error handling for failed auth attempts

### 2. Updated Middleware
**File:** `src/middleware.ts`

Changes:
- Integrated Supabase SSR client
- Added automatic token refresh via `supabase.auth.getUser()`
- Proper cookie handling for auth state
- Protected route validation

The middleware now:
- Creates a Supabase client on every request
- Automatically refreshes expired tokens
- Syncs auth cookies between client and server
- Redirects unauthenticated users to login

### 3. Enhanced Client Configuration
**File:** `src/lib/supabaseClient.ts`

Added auth options:
- `autoRefreshToken: true` - Automatically refresh tokens before expiry
- `persistSession: true` - Keep session across page reloads
- `detectSessionInUrl: true` - Handle OAuth redirects
- `flowType: 'pkce'` - Use PKCE flow for enhanced security

## Required Supabase Configuration

### Redirect URLs
In your Supabase dashboard, add these redirect URLs:

**Development:**
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/**` (wildcard)

**Production:**
- `https://yourdomain.com/auth/callback`
- `https://yourdomain.com/**` (wildcard)

**Steps:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add the callback URL to "Redirect URLs"
3. Add the wildcard URL for general auth flows
4. Save changes

### Site URL
Set your site URL in Supabase:
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

## Environment Variables Required

Ensure these are set in your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site URL (must match Supabase configuration)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## How It Works

### Authentication Flow

1. **User signs in** → Supabase redirects to `/auth/callback?code=xxx`
2. **Callback route** → Exchanges code for session tokens
3. **Middleware** → Automatically refreshes tokens on every request
4. **Client** → Handles auth state changes and token refresh

### Token Refresh Cycle

```
Request → Middleware → Check token expiry → Refresh if needed → Set new cookies → Continue
```

The refresh happens automatically and silently in the background.

### Cookie Management

The SSR package manages cookies across:
- Client-side (browser storage)
- Server-side (route handlers)
- Middleware (request/response)

All three stay in sync automatically.

## Testing the Fix

### 1. Clear Existing Session
```bash
# Clear browser cookies and localStorage
# Or use incognito mode
```

### 2. Sign In
- Visit `/login`
- Sign in with credentials
- Should redirect to appropriate dashboard

### 3. Verify Token Refresh
- Keep the app open for 1+ hours
- Navigate between pages
- Should NOT see refresh token errors

### 4. Check Logs (Development)
Look for these messages:
- `🔄 [AuthStateChange] Event: TOKEN_REFRESHED` - Success
- `🔄 [RefreshToken] Invalid or expired refresh token` - Handled gracefully

## Common Issues

### Issue: Still seeing refresh token error
**Solution:** 
1. Clear all browser cookies
2. Clear localStorage: `localStorage.clear()`
3. Verify callback URL is added to Supabase
4. Check environment variables are correct

### Issue: Redirect loop on protected pages
**Solution:**
1. Verify middleware is not blocking auth routes
2. Check that user session exists
3. Verify profile exists in database

### Issue: OAuth providers not working
**Solution:**
1. Add provider callback URL to Supabase
2. Format: `https://yourdomain.com/auth/callback`
3. Enable provider in Supabase dashboard

## Security Improvements

This fix also adds:
- ✅ PKCE flow for OAuth (prevents authorization code interception)
- ✅ Automatic token rotation
- ✅ Secure cookie handling with httpOnly flags
- ✅ Protection against CSRF attacks
- ✅ Session validation on every request

## Migration Notes

### For Existing Users
No data migration needed. Existing users will:
1. Be automatically signed out on first request
2. Need to sign in again
3. New session will use improved auth flow

### For Developers
If you've customized auth:
1. Review middleware changes
2. Ensure custom routes don't conflict
3. Test OAuth providers thoroughly

## Additional Resources

- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js 15 Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [PKCE Flow Explained](https://oauth.net/2/pkce/)

## Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs for auth errors
3. Verify Supabase dashboard settings
4. Clear all auth-related storage

---

**Last Updated:** November 2024  
**Next.js Version:** 15.5.2  
**Supabase Version:** Latest (SSR package)
