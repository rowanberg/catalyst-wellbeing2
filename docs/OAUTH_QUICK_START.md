# CatalystWells OAuth - Quick Start Guide

## 🚀 5-Minute Integration

### Step 1: Get Your Credentials

Email `support@catalystwells.com` with:
- App name
- Redirect URIs (e.g., `https://yourapp.com/callback`)
- Requested scopes

You'll receive:
```
CLIENT_ID=your-app-client-id
CLIENT_SECRET=your-secret-key-here
```

### Step 2: Redirect User to Authorize

```javascript
const authUrl = `https://app.catalystwells.com/authsso?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=profile.read%20profile.email&` +
  `state=${randomState}`;

window.location.href = authUrl;
```

### Step 3: Handle Callback

```javascript
// User redirected to: https://yourapp.com/callback?code=cw_ac_...&state=...

const code = new URLSearchParams(window.location.search).get('code');
```

### Step 4: Exchange Code for Token

```javascript
const response = await fetch('https://app.catalystwells.com/api/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI
  })
});

const { access_token, refresh_token } = await response.json();
```

### Step 5: Get User Info

```javascript
const userResponse = await fetch('https://app.catalystwells.com/api/oauth/userinfo', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const user = await userResponse.json();
// { sub: "user-id", name: "John Doe", email: "john@example.com", ... }
```

## 📋 Common Scopes

| Scope | Data |
|-------|------|
| `profile.read` | Name, avatar, role |
| `profile.email` | Email address |
| `student.classes.read` | Student's classes |
| `student.grades.read` | Student's grades |
| `parent.children.read` | Parent's children |

## 🔄 Refresh Expired Token

```javascript
const response = await fetch('https://app.catalystwells.com/api/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh_token,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  })
});

const { access_token: newToken } = await response.json();
```

## ⚠️ Important Security Notes

1. **Never** expose `CLIENT_SECRET` in frontend code
2. Always use `state` parameter (random string) to prevent CSRF
3. Validate `state` matches on callback
4. Use HTTPS in production
5. Store tokens securely (httpOnly cookies recommended)

## 🧪 Test with Luminex

Try the flow with our demo app:

```
https://app.catalystwells.com/authsso?client_id=luminex-tutor&redirect_uri=http://localhost:3001/callback&response_type=code&scope=profile.read%20profile.email&state=test123
```

## 📚 Full Documentation

**Complete Guide:** `/docs/OAUTH_INTEGRATION_GUIDE.md`

## 💬 Support

- Email: support@catalystwells.com
- Docs: https://docs.catalystwells.com

---

**Token Lifetimes:**
- Access Token: 1 hour
- Refresh Token: 30 days
- Authorization Code: 10 minutes
