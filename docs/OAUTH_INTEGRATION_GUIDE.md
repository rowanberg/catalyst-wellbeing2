# CatalystWells OAuth 2.0 Integration Guide

## Overview

CatalystWells provides a comprehensive OAuth 2.0 implementation that allows third-party applications to securely access user data with explicit user consent. This guide will walk you through integrating your application with the CatalystWells platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Registration Process](#registration-process)
3. [OAuth 2.0 Flow](#oauth-20-flow)
4. [Available Scopes](#available-scopes)
5. [API Endpoints](#api-endpoints)
6. [Code Examples](#code-examples)
7. [Security Best Practices](#security-best-practices)
8. [Testing](#testing)

---

## Getting Started

### Prerequisites

Before integrating with CatalystWells OAuth, you'll need:

- A registered application with CatalystWells
- Client ID and Client Secret
- Configured redirect URIs
- Understanding of OAuth 2.0 Authorization Code flow

### Base URL

```
Production: https://app.catalystwells.com
Development: http://localhost:3000
```

---

## Registration Process

### Step 1: Register Your Application

Contact CatalystWells support at `support@catalystwells.com` with the following information:

```json
{
  "application_name": "Your App Name",
  "description": "Brief description of your application",
  "website_url": "https://yourapp.com",
  "privacy_policy_url": "https://yourapp.com/privacy",
  "terms_of_service_url": "https://yourapp.com/terms",
  "redirect_uris": [
    "https://yourapp.com/auth/callback",
    "http://localhost:3001/auth/callback"
  ],
  "requested_scopes": [
    "profile.read",
    "profile.email"
  ],
  "developer_name": "Your Name/Company",
  "developer_email": "dev@yourapp.com",
  "developer_website": "https://yourcompany.com",
  "logo_url": "https://yourapp.com/logo.png"
}
```

### Step 2: Receive Credentials

After approval, you'll receive:

- **Client ID**: `your-app-client-id`
- **Client Secret**: `your-app-secret-key` (Store securely! Never expose in public code)

---

## OAuth 2.0 Flow

### Authorization Code Flow (Recommended)

```
┌──────────┐                                      ┌──────────────┐
│          │                                      │              │
│  Your    │                                      │ CatalystWells│
│  App     │                                      │              │
│          │                                      │              │
└─────┬────┘                                      └──────┬───────┘
      │                                                  │
      │  1. Redirect to Authorization URL               │
      │ ─────────────────────────────────────────────>  │
      │                                                  │
      │  2. User Authenticates & Grants Permission      │
      │                                                  │
      │  3. Redirect to callback with code              │
      │ <─────────────────────────────────────────────  │
      │                                                  │
      │  4. Exchange code for access token              │
      │ ─────────────────────────────────────────────>  │
      │                                                  │
      │  5. Return access token                         │
      │ <─────────────────────────────────────────────  │
      │                                                  │
      │  6. Access protected resources                  │
      │ ─────────────────────────────────────────────>  │
      │                                                  │
```

### Step-by-Step Implementation

#### Step 1: Initiate Authorization

Redirect the user to the CatalystWells authorization page:

```
GET https://app.catalystwells.com/authsso
```

**Required Parameters:**

| Parameter      | Description                                         | Example                                    |
|----------------|-----------------------------------------------------|--------------------------------------------|
| `client_id`    | Your application's client ID                        | `your-app-client-id`                       |
| `redirect_uri` | Your callback URL (must match registered URI)       | `https://yourapp.com/auth/callback`        |
| `response_type`| Must be `code`                                      | `code`                                     |
| `scope`        | Space-separated list of requested scopes            | `profile.read profile.email`               |
| `state`        | Random string for CSRF protection (recommended)     | `random-secure-string-12345`               |

**Example Authorization URL:**

```
https://app.catalystwells.com/authsso?client_id=your-app-client-id&redirect_uri=https://yourapp.com/auth/callback&response_type=code&scope=profile.read%20profile.email&state=abc123xyz
```

#### Step 2: User Authorizes

The user will see a consent screen showing:
- Your application name, logo, and description
- The permissions you're requesting
- Developer information
- Privacy policy and terms links

#### Step 3: Handle Callback

After authorization, the user will be redirected to your `redirect_uri`:

**Success:**
```
https://yourapp.com/auth/callback?code=cw_ac_abc123...&state=abc123xyz
```

**Error:**
```
https://yourapp.com/auth/callback?error=access_denied&error_description=User%20denied%20access&state=abc123xyz
```

#### Step 4: Exchange Code for Token

Make a POST request to exchange the authorization code for an access token:

```http
POST https://app.catalystwells.com/api/oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "cw_ac_abc123...",
  "client_id": "your-app-client-id",
  "client_secret": "your-app-secret-key",
  "redirect_uri": "https://yourapp.com/auth/callback"
}
```

**Response:**

```json
{
  "access_token": "cw_at_xyz789...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "cw_rt_def456...",
  "scope": "profile.read profile.email"
}
```

#### Step 5: Access Protected Resources

Use the access token to make authenticated API requests:

```http
GET https://app.catalystwells.com/api/oauth/userinfo
Authorization: Bearer cw_at_xyz789...
```

#### Step 6: Refresh Access Token (Optional)

When the access token expires, use the refresh token:

```http
POST https://app.catalystwells.com/api/oauth/token
Content-Type: application/json

{
  "grant_type": "refresh_token",
  "refresh_token": "cw_rt_def456...",
  "client_id": "your-app-client-id",
  "client_secret": "your-app-secret-key"
}
```

---

## Available Scopes

### User Profile Scopes

| Scope            | Description                              | Data Returned                           |
|------------------|------------------------------------------|-----------------------------------------|
| `profile.read`   | Read basic profile information           | Name, avatar, role                      |
| `profile.email`  | Read email address                       | Email address                           |
| `profile.write`  | Update profile information               | -                                       |

### Student Scopes

| Scope                        | Description                    | Available For |
|------------------------------|--------------------------------|---------------|
| `student.classes.read`       | Read student class information | Students      |
| `student.grades.read`        | Read student grades            | Students      |
| `student.assignments.read`   | Read assignments               | Students      |
| `student.attendance.read`    | Read attendance records        | Students      |
| `student.wellbeing.read`     | Read wellbeing data            | Students      |
| `student.achievements.read`  | Read achievements              | Students      |

### Teacher Scopes

| Scope                       | Description                     | Available For |
|-----------------------------|---------------------------------|---------------|
| `teacher.students.read`     | Read student information        | Teachers      |
| `teacher.grades.write`      | Update student grades           | Teachers      |
| `teacher.attendance.write`  | Mark attendance                 | Teachers      |
| `teacher.analytics.read`    | Read class analytics            | Teachers      |

### Parent Scopes

| Scope                             | Description                       | Available For |
|-----------------------------------|-----------------------------------|---------------|
| `parent.children.read`            | Read children's information       | Parents       |
| `parent.grades.read`              | Read children's grades            | Parents       |
| `parent.communications.read`      | Read communications               | Parents       |

### Common Scopes

| Scope              | Description                    | Available For |
|--------------------|--------------------------------|---------------|
| `calendar.read`    | Read calendar events           | All           |
| `school.read`      | Read school information        | All           |

---

## API Endpoints

### OAuth Endpoints

#### 1. Get Application Information

```http
GET /api/oauth/app-info?client_id={client_id}
```

**Response:**

```json
{
  "client_id": "your-app-client-id",
  "name": "Your App Name",
  "description": "App description",
  "logo_url": "https://yourapp.com/logo.png",
  "website_url": "https://yourapp.com",
  "privacy_policy_url": "https://yourapp.com/privacy",
  "terms_of_service_url": "https://yourapp.com/terms",
  "developer_name": "Developer Name",
  "is_verified": true,
  "is_first_party": false,
  "trust_level": "verified",
  "allowed_scopes": ["profile.read", "profile.email"]
}
```

#### 2. Authorization Endpoint

```
GET /authsso
```

See [Step 1: Initiate Authorization](#step-1-initiate-authorization)

#### 3. Token Endpoint

```
POST /api/oauth/token
```

See [Step 4: Exchange Code for Token](#step-4-exchange-code-for-token)

#### 4. User Info Endpoint

```http
GET /api/oauth/userinfo
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "sub": "user-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student",
  "avatar_url": "https://...",
  "school_id": "school-uuid",
  "school_name": "Example School"
}
```

#### 5. Revoke Token

```http
POST /api/oauth/revoke
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "token": "cw_at_xyz789...",
  "token_type_hint": "access_token"
}
```

---

## Code Examples

### JavaScript/TypeScript (Node.js)

```typescript
import express from 'express';
import axios from 'axios';

const app = express();

const config = {
  clientId: 'your-app-client-id',
  clientSecret: 'your-app-secret-key',
  redirectUri: 'http://localhost:3001/auth/callback',
  baseUrl: 'https://app.catalystwells.com'
};

// Step 1: Redirect to authorization
app.get('/auth/login', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  req.session.oauthState = state;

  const authUrl = new URL(`${config.baseUrl}/authsso`);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'profile.read profile.email');
  authUrl.searchParams.set('state', state);

  res.redirect(authUrl.toString());
});

// Step 2: Handle callback
app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // Verify state
  if (state !== req.session.oauthState) {
    return res.status(400).send('Invalid state');
  }

  if (error) {
    return res.status(400).send(`Authorization error: ${error}`);
  }

  try {
    // Step 3: Exchange code for token
    const tokenResponse = await axios.post(`${config.baseUrl}/api/oauth/token`, {
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri
    });

    const { access_token, refresh_token } = tokenResponse.data;

    // Step 4: Get user info
    const userResponse = await axios.get(`${config.baseUrl}/api/oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    // Store tokens and user info
    req.session.user = user Response.data;
    req.session.accessToken = access_token;
    req.session.refreshToken = refresh_token;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
```

### Python (Flask)

```python
from flask import Flask, redirect, request, session
import requests
import secrets

app = Flask(__name__)
app.secret_key = 'your-secret-key'

CONFIG = {
    'client_id': 'your-app-client-id',
    'client_secret': 'your-app-secret-key',
    'redirect_uri': 'http://localhost:5000/auth/callback',
    'base_url': 'https://app.catalystwells.com'
}

@app.route('/auth/login')
def login():
    state = secrets.token_urlsafe(32)
    session['oauth_state'] = state

    params = {
        'client_id': CONFIG['client_id'],
        'redirect_uri': CONFIG['redirect_uri'],
        'response_type': 'code',
        'scope': 'profile.read profile.email',
        'state': state
    }

    auth_url = f"{CONFIG['base_url']}/authsso"
    return redirect(f"{auth_url}?{urllib.parse.urlencode(params)}")

@app.route('/auth/callback')
def callback():
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')

    if session.get('oauth_state') != state:
        return 'Invalid state', 400

    if error:
        return f'Authorization error: {error}', 400

    # Exchange code for token
    token_response = requests.post(
        f"{CONFIG['base_url']}/api/oauth/token",
        json={
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': CONFIG['client_id'],
            'client_secret': CONFIG['client_secret'],
            'redirect_uri': CONFIG['redirect_uri']
        }
    )

    if token_response.status_code != 200:
        return 'Token exchange failed', 500

    tokens = token_response.json()
    access_token = tokens['access_token']

    # Get user info
    user_response = requests.get(
        f"{CONFIG['base_url']}/api/oauth/userinfo",
        headers={'Authorization': f"Bearer {access_token}"}
    )

    session['user'] = user_response.json()
    session['access_token'] = access_token

    return redirect('/dashboard')

if __name__ == '__main__':
    app.run(port=5000, debug=True)
```

---

## Security Best Practices

### 1. Protect Client Secret

- **Never** expose your client secret in frontend code
- Store securely in environment variables
- Use server-side code for token exchange
- Rotate secrets periodically

### 2. Use State Parameter

Always use the `state` parameter to prevent CSRF attacks:

```javascript
const state = crypto.randomBytes(32).toString('hex');
// Store in session
session.oauthState = state;
```

Verify on callback:

```javascript
if (req.query.state !== session.oauthState) {
  throw new Error('Invalid state - possible CSRF attack');
}
```

### 3. Validate Redirect URI

- CatalystWells will only redirect to pre-registered URIs
- Always validate the redirect_uri in your callback

### 4. Secure Token Storage

- Store access tokens securely (httpOnly cookies, encrypted storage)
- Never expose tokens in URLs or logs
- Clear tokens on logout

### 5. Use HTTPS

- Always use HTTPS in production
- OAuth is only allowed to localhost for development

### 6. Implement Token Refresh

- Access tokens expire after 1 hour
- Implement automatic refresh using refresh tokens
- Handle token expiration gracefully

### 7. Request Minimum Scopes

- Only request the scopes you actually need
- Users are more likely to authorize minimal permissions

---

## Testing

### Test Applications

CatalystWells provides test applications for development:

- **Luminex AI Tutor**: `client_id=luminex-tutor`
- **Parent Connect**: `client_id=parent-connect`
- **Study Buddy**: `client_id=study-buddy`

### Test URLs

Development:
```
http://localhost:3000/authsso?client_id=luminex-tutor&redirect_uri=http://localhost:3001/callback&response_type=code&scope=profile.read%20profile.email&state=test123
```

### Test User Accounts

Contact support for test credentials in the sandbox environment.

---

## Error Handling

### Authorization Errors

| Error Code          | Description                               | Solution                                  |
|---------------------|-------------------------------------------|-------------------------------------------|
| `invalid_request`   | Missing or invalid parameters             | Check all required parameters             |
| `unauthorized_client` | Client ID not recognized                | Verify your client ID                     |
| `access_denied`     | User denied authorization                 | Handle gracefully, allow retry            |
| `unsupported_response_type` | Invalid response_type parameter   | Use `response_type=code`                  |
| `invalid_scope`     | Requested scope not allowed               | Check allowed scopes for your app         |
| `server_error`      | Internal server error                     | Retry later, contact support if persists  |

### Token Errors

| Error Code          | Description                               | Solution                                  |
|---------------------|-------------------------------------------|-------------------------------------------|
| `invalid_grant`     | Invalid or expired authorization code     | Request new authorization                 |
| `invalid_client`    | Invalid client credentials                | Check client ID and secret                |
| `unauthorized_client` | Client not authorized for this grant type | Contact support                         |

---

## Support

### Contact Information

- **Email**: support@catalystwells.com
- **Developer Portal**: https://developers.catalystwells.com
- **Documentation**: https://docs.catalystwells.com
- **Status Page**: https://status.catalystwells.com

### Reporting Issues

When reporting issues, include:
- Client ID (never share client secret)
- Timestamp of the issue
- Error messages received
- Steps to reproduce

---

## Changelog

### Version 1.0.0 (Current)
- Initial OAuth 2.0 implementation
- Authorization Code flow support
- Refresh token support
- User info endpoint
- Application verification system

---

## Appendix

### Complete Scope Reference

See the [Available Scopes](#available-scopes) section for detailed scope descriptions.

### Rate Limits

- **Authorization requests**: 10 per minute per IP
- **Token requests**: 60 per hour per client
- **API requests**: 1000 per hour per access token

### Token Lifetimes

- **Authorization Code**: 10 minutes
- **Access Token**: 1 hour
- **Refresh Token**: 30 days

### Webhook Support

Coming soon: Real-time webhooks for grade updates, attendance changes, and more.

---

**Last Updated**: January 16, 2026  
**Version**: 1.0.0
