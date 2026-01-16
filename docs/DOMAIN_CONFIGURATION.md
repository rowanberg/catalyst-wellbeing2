# CatalystWells Domain Configuration

## 🌐 Domain Structure

CatalystWells uses a multi-subdomain architecture for better organization and security:

```
catalystwells.com (Root Domain)
├── app.catalystwells.com          → Main Application (Students, Teachers, Parents)
├── developers.catalystwells.com   → Developer Portal (Third-party integrations)
├── luminex.catalystwells.com      → Luminex AI Tutor (First-party app)
├── parent.catalystwells.com       → Parent Connect (First-party app)
└── studybuddy.catalystwells.com   → Study Buddy (Third-party app)
```

## 📍 Subdomain Purposes

### 1. **app.catalystwells.com** (Main Application)
**Port**: 3000 (Development)  
**Purpose**: Core platform for students, teachers, and parents

**Features**:
- User authentication (`/login`, `/register`)
- Student dashboard (`/student/*`)
- Teacher dashboard (`/teacher/*`)
- Parent dashboard (`/parent/*`)
- Admin panel (`/admin/*`, `/superpanel/*`)
- OAuth authorization (`/authsso`)
- API endpoints (`/api/*`)

**Environment Variables**:
```env
NEXT_PUBLIC_APP_URL=https://app.catalystwells.com
```

### 2. **developers.catalystwells.com** (Developer Portal)
**Port**: 4000 (Development)  
**Purpose**: Third-party developer console for OAuth integrations

**Features**:
- Developer registration and authentication
- Application management
- API key generation
- Webhook configuration
- Analytics dashboard
- Documentation
- Support tickets

**Environment Variables**:
```env
NEXT_PUBLIC_DEV_PORTAL_URL=https://developers.catalystwells.com
NEXT_PUBLIC_CATALYSTWELLS_URL=https://app.catalystwells.com
CATALYSTWELLS_OAUTH_AUTHORIZE_URL=https://app.catalystwells.com/authsso
CATALYSTWELLS_OAUTH_TOKEN_URL=https://app.catalystwells.com/api/oauth/token
CATALYSTWELLS_OAUTH_USERINFO_URL=https://app.catalystwells.com/api/oauth/userinfo
```

### 3. **luminex.catalystwells.com** (Luminex AI Tutor)
**Purpose**: First-party AI-powered learning assistant

**OAuth Configuration**:
```javascript
{
  client_id: 'luminex-tutor',
  redirect_uris: [
    'https://luminex.catalystwells.com/auth/callback',
    'http://localhost:3001/auth/callback'
  ],
  scopes: [
    'profile.read',
    'profile.email',
    'student.classes.read',
    'student.grades.read',
    'student.assignments.read'
  ]
}
```

### 4. **parent.catalystwells.com** (Parent Connect)
**Purpose**: First-party parent engagement platform

**OAuth Configuration**:
```javascript
{
  client_id: 'parent-connect',
  redirect_uris: [
    'https://parent.catalystwells.com/auth/callback',
    'http://localhost:3002/auth/callback'
  ],
  scopes: [
    'profile.read',
    'profile.email',
    'parent.children.read',
    'parent.grades.read',
    'parent.communications.read'
  ]
}
```

### 5. **studybuddy.catalystwells.com** (Study Buddy)
**Purpose**: Third-party collaborative learning platform

**OAuth Configuration**:
```javascript
{
  client_id: 'study-buddy',
  redirect_uris: [
    'https://studybuddy.catalystwells.com/auth/callback',
    'http://localhost:3003/auth/callback'
  ],
  scopes: [
    'profile.read',
    'profile.email',
    'student.classes.read',
    'calendar.read'
  ]
}
```

## 🔧 DNS Configuration

### Required DNS Records

```dns
# A Records (or CNAME to hosting provider)
app.catalystwells.com          → [Your Vercel/Server IP]
developers.catalystwells.com   → [Your Vercel/Server IP]
luminex.catalystwells.com      → [App Server IP]
parent.catalystwells.com       → [App Server IP]
studybuddy.catalystwells.com   → [App Server IP]

# SSL/TLS Certificates
*.catalystwells.com            → Wildcard SSL Certificate
```

### Vercel Configuration

If deploying to Vercel:

1. **Main App** (`app.catalystwells.com`):
```bash
cd catalyst
vercel --prod
# Add domain in Vercel dashboard: app.catalystwells.com
```

2. **Developer Portal** (`developers.catalystwells.com`):
```bash
cd developer
vercel --prod
# Add domain in Vercel dashboard: developers.catalystwells.com
```

## 🔐 CORS Configuration

### Main App (app.catalystwells.com)

Allow requests from:
```javascript
const allowedOrigins = [
  'https://developers.catalystwells.com',
  'https://luminex.catalystwells.com',
  'https://parent.catalystwells.com',
  'https://studybuddy.catalystwells.com',
  'http://localhost:3001', // Luminex dev
  'http://localhost:3002', // Parent dev
  'http://localhost:3003', // Study Buddy dev
  'http://localhost:4000'  // Developer portal dev
]
```

### Developer Portal (developers.catalystwells.com)

Allow requests from:
```javascript
const allowedOrigins = [
  'https://app.catalystwells.com',
  'http://localhost:3000' // Main app dev
]
```

## 🔄 OAuth Flow Across Domains

### Example: Luminex AI Tutor Integration

```
1. User visits: https://luminex.catalystwells.com
2. Clicks "Connect with CatalystWells"
3. Redirected to: https://app.catalystwells.com/authsso?
   client_id=luminex-tutor&
   redirect_uri=https://luminex.catalystwells.com/auth/callback&
   response_type=code&
   scope=profile.read%20student.grades.read&
   state=random-state

4. User authorizes on app.catalystwells.com
5. Redirected back to: https://luminex.catalystwells.com/auth/callback?
   code=cw_ac_xyz123&
   state=random-state

6. Luminex exchanges code for token:
   POST https://app.catalystwells.com/api/oauth/token
   
7. Luminex accesses user data:
   GET https://app.catalystwells.com/api/oauth/userinfo
   Authorization: Bearer cw_at_abc456
```

## 🛡️ Security Considerations

### 1. **Cookie Domain Settings**

**Main App**:
```javascript
// Set cookies for *.catalystwells.com
res.setHeader('Set-Cookie', [
  `session=${token}; Domain=.catalystwells.com; Secure; HttpOnly; SameSite=Lax`
])
```

**Developer Portal**:
```javascript
// Set cookies only for developers.catalystwells.com
res.setHeader('Set-Cookie', [
  `dev_session=${token}; Domain=developers.catalystwells.com; Secure; HttpOnly; SameSite=Strict`
])
```

### 2. **CSP Headers**

**Main App**:
```
Content-Security-Policy:
  default-src 'self' https://*.catalystwells.com;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.catalystwells.com;
  connect-src 'self' https://*.catalystwells.com https://*.supabase.co;
```

**Developer Portal**:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  connect-src 'self' https://app.catalystwells.com https://*.supabase.co;
```

### 3. **Redirect URI Validation**

Always validate redirect URIs match registered domains:

```typescript
const isValidRedirectUri = (uri: string, allowedUris: string[]) => {
  try {
    const url = new URL(uri)
    return allowedUris.some(allowed => {
      const allowedUrl = new URL(allowed)
      return url.origin === allowedUrl.origin && 
             url.pathname === allowedUrl.pathname
    })
  } catch {
    return false
  }
}
```

## 📱 Mobile App Configuration

For mobile apps, use custom URL schemes:

```javascript
{
  client_id: 'catalystwells-mobile-ios',
  redirect_uris: [
    'catalystwells://oauth/callback',
    'https://app.catalystwells.com/mobile/callback' // Fallback
  ]
}
```

## 🧪 Development vs Production

### Development URLs

```
Main App:        http://localhost:3000
Developer Portal: http://localhost:4000
Luminex:         http://localhost:3001
Parent Connect:  http://localhost:3002
Study Buddy:     http://localhost:3003
```

### Production URLs

```
Main App:        https://app.catalystwells.com
Developer Portal: https://developers.catalystwells.com
Luminex:         https://luminex.catalystwells.com
Parent Connect:  https://parent.catalystwells.com
Study Buddy:     https://studybuddy.catalystwells.com
```

### Environment-Aware Configuration

```typescript
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  return 'https://app.catalystwells.com'
}

const getOAuthUrl = () => {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/authsso`
}
```

## 📊 Monitoring & Analytics

Track metrics per subdomain:

- **app.catalystwells.com**: User logins, API calls, OAuth authorizations
- **developers.catalystwells.com**: Developer signups, app submissions, API key usage
- **Third-party apps**: OAuth flows, token refreshes, API requests

## 🔄 Migration Checklist

When migrating from single domain to multi-subdomain:

- [ ] Update DNS records
- [ ] Configure SSL certificates
- [ ] Update environment variables
- [ ] Update CORS settings
- [ ] Update cookie domains
- [ ] Update CSP headers
- [ ] Update OAuth redirect URIs
- [ ] Test all OAuth flows
- [ ] Update documentation
- [ ] Notify developers of changes

## 📞 Support

For domain-related issues:

- **DNS/SSL**: Contact hosting provider
- **OAuth**: Check redirect URI configuration
- **CORS**: Verify allowed origins
- **Cookies**: Check domain settings

---

**Last Updated**: January 16, 2026  
**Version**: 1.0.0
