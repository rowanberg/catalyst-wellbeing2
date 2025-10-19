# SendGrid Email Troubleshooting Guide

## Quick Diagnostics Checklist

### 1. Check Environment Variables

**Verify your `.env.local` file has these variables:**
```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@catalystwells.com
```

**Common Issues:**
- ❌ Missing `.env.local` file
- ❌ API key doesn't start with `SG.`
- ❌ Extra spaces or quotes around values
- ❌ Using `.env.example` instead of `.env.local`

### 2. Verify SendGrid API Key

**Test your API key is valid:**
```bash
# In terminal
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header 'Authorization: Bearer YOUR_API_KEY_HERE' \
  --header 'Content-Type: application/json' \
  --data '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"noreply@catalystwells.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'
```

**Expected Response:**
- ✅ Status 202 = Success
- ❌ Status 401 = Invalid API key
- ❌ Status 403 = No permission

### 3. Verify Sender Email Address

**Check SendGrid Dashboard:**
1. Go to https://app.sendgrid.com/settings/sender_auth
2. Verify your FROM email is listed and verified
3. Look for green checkmark ✅

**Common Issues:**
- ❌ Email not verified in SendGrid
- ❌ Using different email than verified
- ❌ Domain not authenticated

### 4. Check Server Logs

**Look for these console messages:**

**✅ Success Pattern:**
```
🔍 Password reset email endpoint called
✅ SendGrid API key configured
📧 Sending password reset email to: user@example.com
🔗 Reset URL: http://localhost:3000...
📤 Attempting to send email via SendGrid...
✅ Email sent successfully!
```

**❌ Error Patterns:**

**Missing API Key:**
```
❌ SENDGRID_API_KEY is not configured in environment variables
```
**Solution:** Add `SENDGRID_API_KEY=SG.xxx` to `.env.local`

**Invalid API Key:**
```
❌ SendGrid Error: { code: 401 }
```
**Solution:** Get new API key from SendGrid dashboard

**Unverified Sender:**
```
❌ SendGrid Error: { code: 403 }
Error details: { message: "from email is not verified" }
```
**Solution:** Verify sender email in SendGrid dashboard

**Network Error:**
```
❌ SendGrid Error: fetch failed
```
**Solution:** Check internet connection

### 5. Test Email Sending Manually

**Method 1: Using Browser Console**
```javascript
fetch('/api/send-verification-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'your-test@email.com',
    firstName: 'Test',
    verificationUrl: 'http://localhost:3000/auth/verify?token=test'
  })
})
.then(r => r.json())
.then(console.log)
```

**Method 2: Using cURL**
```bash
curl -X POST http://localhost:3000/api/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test@email.com",
    "firstName": "Test",
    "verificationUrl": "http://localhost:3000/auth/verify?token=test"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

### 6. Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Check API key is correct |
| 403 | Forbidden | Verify sender email in SendGrid |
| 413 | Payload too large | Email content is too big |
| 429 | Rate limit exceeded | Wait or upgrade plan |
| 500 | Server error | Check SendGrid status page |

### 7. Check SendGrid Activity

**View in Dashboard:**
1. Go to https://app.sendgrid.com/email_activity
2. Filter by your FROM email
3. Check delivery status

**Email Status Meanings:**
- **Processed**: SendGrid received it
- **Delivered**: Reached recipient's server
- **Opened**: Recipient opened email
- **Bounced**: Email rejected
- **Dropped**: SendGrid blocked it

### 8. Restart Development Server

**Important:** Environment variables are loaded at startup

```bash
# Stop the dev server (Ctrl+C)
# Restart it
npm run dev
```

### 9. Check Package Installation

**Verify @sendgrid/mail is installed:**
```bash
npm list @sendgrid/mail
```

**Should show:**
```
@sendgrid/mail@8.1.6
```

**If not installed:**
```bash
npm install @sendgrid/mail
```

## Step-by-Step Debugging

### Step 1: Verify Configuration
```bash
# Check if .env.local exists
ls -la .env.local

# View environment variables (Windows)
type .env.local

# View environment variables (Mac/Linux)
cat .env.local
```

### Step 2: Test API Key
Visit https://app.sendgrid.com/settings/api_keys and verify:
- [ ] API key exists
- [ ] Has "Mail Send" permission
- [ ] Not deleted or expired

### Step 3: Test Sender
Visit https://app.sendgrid.com/settings/sender_auth and verify:
- [ ] Sender email is listed
- [ ] Status is "Verified" (green checkmark)
- [ ] Email matches `SENDGRID_FROM_EMAIL` in `.env.local`

### Step 4: Check Logs
1. Open browser console (F12)
2. Go to Network tab
3. Trigger password reset
4. Look for `/api/reset-password` request
5. Check response for errors

### Step 5: Test Direct API Call
```bash
# Test verification email endpoint
curl -X POST http://localhost:3000/api/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "verificationUrl": "http://localhost:3000/test"
  }' \
  -v
```

## Production Deployment Issues

### Netlify/Vercel Environment Variables

**Check deployment environment:**
1. Go to your deployment dashboard
2. Navigate to Environment Variables
3. Verify `SENDGRID_API_KEY` is set
4. Verify `SENDGRID_FROM_EMAIL` is set
5. Redeploy after adding variables

**Important:** Some platforms require rebuild after adding env vars

### Domain Restrictions

If using domain authentication, ensure:
- DNS records are configured correctly
- Domain verification is complete
- Deployment domain matches authenticated domain

## Still Not Working?

### Enable Debug Mode

Add to `.env.local`:
```bash
DEBUG=true
NODE_ENV=development
```

### Check SendGrid Status
Visit: https://status.sendgrid.com/

### Contact Support
If everything checks out but emails still don't send:
1. Check SendGrid email activity logs
2. Verify account status (not suspended)
3. Check billing/usage limits
4. Contact SendGrid support with error logs

## Success Indicators

You'll know it's working when you see:
1. ✅ No console errors
2. ✅ Status 200 response from API
3. ✅ Email appears in SendGrid Activity
4. ✅ Email arrives in inbox (check spam)
5. ✅ Verification link works when clicked

## Quick Fix Checklist

- [ ] `.env.local` file exists in project root
- [ ] `SENDGRID_API_KEY` starts with `SG.`
- [ ] `SENDGRID_FROM_EMAIL` is verified in SendGrid
- [ ] Dev server restarted after adding env vars
- [ ] @sendgrid/mail package installed
- [ ] No console errors showing
- [ ] Network request succeeds (200/202)
- [ ] SendGrid Activity shows email processed
