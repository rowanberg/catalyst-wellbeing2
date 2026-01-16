# 🌐 CatalystWells Domain Quick Reference

## Production URLs

| Service | URL | Port (Dev) | Purpose |
|---------|-----|------------|---------|
| **Main App** | `https://app.catalystwells.com` | 3000 | Core platform (Students/Teachers/Parents) |
| **Developer Portal** | `https://developers.catalystwells.com` | 4000 | Third-party integrations |
| **Luminex AI** | `https://luminex.catalystwells.com` | 3001 | AI Learning Assistant |
| **Parent Connect** | `https://parent.catalystwells.com` | 3002 | Parent Engagement |
| **Study Buddy** | `https://studybuddy.catalystwells.com` | 3003 | Collaborative Learning |

## OAuth Endpoints (Main App)

```
Authorization: https://app.catalystwells.com/authsso
Token:         https://app.catalystwells.com/api/oauth/token
User Info:     https://app.catalystwells.com/api/oauth/userinfo
```

## Environment Variables

### Main App (.env.local)
```env
NEXT_PUBLIC_APP_URL=https://app.catalystwells.com
```

### Developer Portal (.env.local)
```env
NEXT_PUBLIC_DEV_PORTAL_URL=https://developers.catalystwells.com
NEXT_PUBLIC_CATALYSTWELLS_URL=https://app.catalystwells.com
CATALYSTWELLS_OAUTH_AUTHORIZE_URL=https://app.catalystwells.com/authsso
CATALYSTWELLS_OAUTH_TOKEN_URL=https://app.catalystwells.com/api/oauth/token
CATALYSTWELLS_OAUTH_USERINFO_URL=https://app.catalystwells.com/api/oauth/userinfo
```

## Quick Commands

### Start Main App
```bash
cd catalyst
npm run dev  # http://localhost:3000
```

### Start Developer Portal
```bash
cd developer
npm run dev  # http://localhost:4000
```

### Deploy Main App
```bash
cd catalyst
vercel --prod
# Add domain: app.catalystwells.com
```

### Deploy Developer Portal
```bash
cd developer
vercel --prod
# Add domain: developers.catalystwells.com
```

## DNS Records

```dns
app.catalystwells.com          → CNAME to Vercel
developers.catalystwells.com   → CNAME to Vercel
*.catalystwells.com            → Wildcard SSL Certificate
```

## Testing OAuth Flow

```bash
# 1. Start both servers
cd catalyst && npm run dev &
cd developer && npm run dev &

# 2. Test authorization
open "http://localhost:3000/authsso?client_id=luminex-tutor&redirect_uri=http://localhost:3001/callback&response_type=code&scope=profile.read&state=test123"
```

---

**See `DOMAIN_CONFIGURATION.md` for complete documentation**
