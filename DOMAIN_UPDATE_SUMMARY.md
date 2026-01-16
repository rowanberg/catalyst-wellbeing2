# ✅ Domain Configuration Complete

## 🎯 What Was Updated

All URLs and configurations have been updated to use the proper subdomain structure:

### Main Application
- **Domain**: `app.catalystwells.com`
- **Development**: `http://localhost:3000`

### Developer Portal
- **Domain**: `developers.catalystwells.com`
- **Development**: `http://localhost:4000`

## 📝 Files Updated

### 1. Developer Portal Configuration
- ✅ `/developer/.env.example`
  - OAuth endpoints → `https://app.catalystwells.com`
  - Portal URL → `https://developers.catalystwells.com`
  - Main app URL → `https://app.catalystwells.com`

- ✅ `/developer/next.config.js`
  - Image domains updated
  - Remote patterns for `**.catalystwells.com`

### 2. Documentation
- ✅ `/docs/OAUTH_INTEGRATION_GUIDE.md`
  - Base URL → `https://app.catalystwells.com`
  - All OAuth endpoints updated

- ✅ `/docs/OAUTH_QUICK_START.md`
  - All example URLs updated
  - Code snippets use correct domains

- ✅ `/docs/DOMAIN_CONFIGURATION.md` (NEW)
  - Complete domain architecture guide
  - DNS configuration
  - CORS setup
  - Security considerations

- ✅ `/docs/DOMAIN_QUICK_REFERENCE.md` (NEW)
  - Quick reference card
  - All URLs in one place
  - Common commands

### 3. Database
- ✅ `/database/oauth_apps.sql`
  - Logo URLs → `https://app.catalystwells.com/apps/...`
  - Seed data updated

## 🌐 Domain Structure

```
catalystwells.com
├── app.catalystwells.com          (Main Platform)
│   ├── /authsso                   OAuth authorization
│   ├── /api/oauth/token           Token endpoint
│   ├── /api/oauth/userinfo        User info endpoint
│   ├── /student/*                 Student dashboard
│   ├── /teacher/*                 Teacher dashboard
│   ├── /parent/*                  Parent dashboard
│   └── /admin/*                   Admin panel
│
└── developers.catalystwells.com   (Developer Portal)
    ├── /                          Landing page
    ├── /login                     Developer login
    ├── /register                  Developer signup
    ├── /dashboard                 Developer dashboard
    ├── /docs                      Documentation
    └── /api/*                     Portal API
```

## 🔐 OAuth Flow

```
Third-Party App
    ↓
    Redirect to: https://app.catalystwells.com/authsso
    ↓
    User authorizes
    ↓
    Redirect back with code
    ↓
    Exchange code at: https://app.catalystwells.com/api/oauth/token
    ↓
    Get user info at: https://app.catalystwells.com/api/oauth/userinfo
```

## 📋 Environment Variables Checklist

### Main App (catalyst/.env.local)
```env
NEXT_PUBLIC_APP_URL=https://app.catalystwells.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Developer Portal (developer/.env.local)
```env
# Developer Portal Database
NEXT_PUBLIC_DEV_SUPABASE_URL=https://yyy.supabase.co
NEXT_PUBLIC_DEV_SUPABASE_ANON_KEY=your-dev-key
DEV_SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key

# Main CatalystWells Database
NEXT_PUBLIC_MAIN_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_MAIN_SUPABASE_ANON_KEY=your-main-key
MAIN_SUPABASE_SERVICE_ROLE_KEY=your-main-service-key

# URLs
NEXT_PUBLIC_DEV_PORTAL_URL=https://developers.catalystwells.com
NEXT_PUBLIC_CATALYSTWELLS_URL=https://app.catalystwells.com

# OAuth Endpoints
CATALYSTWELLS_OAUTH_AUTHORIZE_URL=https://app.catalystwells.com/authsso
CATALYSTWELLS_OAUTH_TOKEN_URL=https://app.catalystwells.com/api/oauth/token
CATALYSTWELLS_OAUTH_USERINFO_URL=https://app.catalystwells.com/api/oauth/userinfo

# Security
JWT_SECRET=your-jwt-secret-32-chars
ENCRYPTION_KEY=your-encryption-key-32-chars
```

## 🚀 Deployment Steps

### 1. Deploy Main App
```bash
cd catalyst
vercel --prod
```

In Vercel Dashboard:
- Add domain: `app.catalystwells.com`
- Set environment variables
- Enable automatic deployments

### 2. Deploy Developer Portal
```bash
cd developer
vercel --prod
```

In Vercel Dashboard:
- Add domain: `developers.catalystwells.com`
- Set environment variables
- Enable automatic deployments

### 3. Configure DNS

Add these records to your DNS provider:

```dns
Type    Name          Value
CNAME   app           cname.vercel-dns.com
CNAME   developers    cname.vercel-dns.com
```

Or if using A records:
```dns
Type    Name          Value
A       app           76.76.21.21 (Vercel IP)
A       developers    76.76.21.21 (Vercel IP)
```

### 4. SSL Certificates

Vercel automatically provisions SSL certificates for:
- `app.catalystwells.com`
- `developers.catalystwells.com`

Wait 24-48 hours for DNS propagation.

## 🧪 Testing

### Local Testing
```bash
# Terminal 1: Main App
cd catalyst
npm run dev  # http://localhost:3000

# Terminal 2: Developer Portal
cd developer
npm run dev  # http://localhost:4000
```

### Test OAuth Flow
```
http://localhost:3000/authsso?
  client_id=luminex-tutor&
  redirect_uri=http://localhost:3001/callback&
  response_type=code&
  scope=profile.read%20profile.email&
  state=test123
```

### Production Testing
```
https://app.catalystwells.com/authsso?
  client_id=luminex-tutor&
  redirect_uri=https://luminex.catalystwells.com/callback&
  response_type=code&
  scope=profile.read%20profile.email&
  state=test123
```

## 📊 Verification Checklist

- [ ] Main app accessible at `app.catalystwells.com`
- [ ] Developer portal accessible at `developers.catalystwells.com`
- [ ] SSL certificates active (HTTPS)
- [ ] OAuth authorization works
- [ ] Token exchange works
- [ ] User info endpoint works
- [ ] CORS configured correctly
- [ ] Cookies set with correct domain
- [ ] All documentation updated
- [ ] Environment variables set
- [ ] DNS records propagated

## 🔄 Migration from Old URLs

If you had old URLs, update:

### Old → New
```
https://catalystwells.com/authsso
  → https://app.catalystwells.com/authsso

https://catalystwells.com/api/oauth/token
  → https://app.catalystwells.com/api/oauth/token

http://localhost:4000
  → https://developers.catalystwells.com (production)
```

### Update Third-Party Apps

Notify developers to update their redirect URIs:
```
Old: https://catalystwells.com/...
New: https://app.catalystwells.com/...
```

## 📞 Support

For domain-related issues:

1. **DNS not resolving**: Wait 24-48 hours for propagation
2. **SSL errors**: Check Vercel SSL certificate status
3. **CORS errors**: Verify allowed origins in config
4. **OAuth errors**: Check redirect URI matches exactly

## 📚 Documentation

- **Complete Guide**: `/docs/DOMAIN_CONFIGURATION.md`
- **Quick Reference**: `/docs/DOMAIN_QUICK_REFERENCE.md`
- **OAuth Guide**: `/docs/OAUTH_INTEGRATION_GUIDE.md`
- **Quick Start**: `/docs/OAUTH_QUICK_START.md`

---

## ✅ Summary

**Status**: ✅ **COMPLETE**

All configurations have been updated to use:
- Main App: `app.catalystwells.com`
- Developer Portal: `developers.catalystwells.com`

**Next Steps**:
1. Deploy both applications to Vercel
2. Configure DNS records
3. Wait for SSL certificates
4. Test OAuth flow end-to-end
5. Notify developers of URL changes

---

**Updated**: January 16, 2026  
**Version**: 2.0.0 (Multi-subdomain architecture)
