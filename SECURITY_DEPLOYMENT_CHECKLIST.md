# 🔒 Catalyst Wells Security Deployment Checklist

## Pre-Deployment Security Verification

Use this checklist before deploying to production to ensure all security measures are properly configured.

---

## ✅ Environment Configuration

- [ ] **Create `.env.local`** from `.env.example` template
- [ ] **Set all required environment variables** with real values
- [ ] **Generate strong `SUPER_ADMIN_SECRET_KEY`** (minimum 32 characters)
  ```bash
  # Generate using OpenSSL:
  openssl rand -hex 32
  ```
- [ ] **Verify Supabase credentials** are production values
- [ ] **Set `NEXT_PUBLIC_APP_ENV=production`** for production
- [ ] **Configure `NEXT_PUBLIC_SITE_URL`** with actual domain

---

## ✅ Database Security

- [ ] **Run security indexes migration** in Supabase:
  ```sql
  -- Execute: database/security_performance_indexes.sql
  ```
- [ ] **Verify RLS policies** are enabled on all tables:
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public';
  ```
- [ ] **Create audit_logs table** if not exists
- [ ] **Test database connections** with limited permissions
- [ ] **Backup database** before deployment

---

## ✅ Code Security Verification

- [ ] **No hardcoded credentials** in codebase:
  ```bash
  # Search for potential issues:
  grep -r "SUPABASE_SERVICE_ROLE_KEY\!" src/
  grep -r "process.env\." src/ | grep -v "NEXT_PUBLIC"
  ```
- [ ] **No console.log of sensitive data**:
  ```bash
  grep -r "console.log.*user" src/
  grep -r "console.log.*password" src/
  grep -r "console.log.*token" src/
  ```
- [ ] **All API routes use authentication**:
  ```bash
  # Check for unprotected routes:
  grep -l "export.*function.*GET\|POST\|PUT\|DELETE" src/app/api/**/*.ts | xargs grep -L "auth\|Auth"
  ```

---

## ✅ Dependencies & Packages

- [ ] **Install production dependencies**:
  ```bash
  npm ci --production
  ```
- [ ] **Verify bcryptjs is installed**:
  ```bash
  npm list bcryptjs
  ```
- [ ] **Check for security vulnerabilities**:
  ```bash
  npm audit
  npm audit fix # If any found
  ```
- [ ] **Update all packages** to latest stable versions

---

## ✅ Build & Deployment

- [ ] **Build succeeds without errors**:
  ```bash
  npm run build
  ```
- [ ] **TypeScript strict mode** has no errors
- [ ] **Environment validation passes**:
  ```bash
  # Should see: "Environment Variable Validation Report - Status: VALID"
  ```
- [ ] **Test authentication flows** in staging
- [ ] **Verify CORS settings** for production domain

---

## ✅ Network Security

- [ ] **HTTPS enabled** on production domain
- [ ] **SSL certificate** is valid and not expiring
- [ ] **Security headers** configured in Netlify:
  ```toml
  # netlify.toml
  [[headers]]
    for = "/*"
    [headers.values]
      X-Frame-Options = "DENY"
      X-Content-Type-Options = "nosniff"
      X-XSS-Protection = "1; mode=block"
      Referrer-Policy = "strict-origin-when-cross-origin"
      Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  ```
- [ ] **Rate limiting** is active
- [ ] **CDN configured** for static assets

---

## ✅ Authentication & Authorization

- [ ] **Test all user roles**:
  - [ ] Student login and access
  - [ ] Teacher login and access
  - [ ] Admin login and access
  - [ ] Parent login and access
  - [ ] Super admin access
- [ ] **Password reset flow** works
- [ ] **Email verification** is functional
- [ ] **Session timeout** configured appropriately
- [ ] **Multi-factor authentication** enabled for admins (if applicable)

---

## ✅ Monitoring & Logging

- [ ] **Audit logging** is working:
  ```sql
  SELECT COUNT(*) FROM audit_logs WHERE timestamp > NOW() - INTERVAL '1 hour';
  ```
- [ ] **Error tracking** configured (e.g., Sentry)
- [ ] **Performance monitoring** active
- [ ] **Security alerts** configured
- [ ] **Backup schedule** confirmed

---

## ✅ Testing

- [ ] **Security testing completed**:
  - [ ] SQL injection tests
  - [ ] XSS attack tests
  - [ ] CSRF token validation
  - [ ] Authentication bypass attempts
  - [ ] Rate limiting verification
- [ ] **Load testing** performed
- [ ] **Penetration testing** (if required)
- [ ] **Accessibility testing** passed
- [ ] **Cross-browser testing** completed

---

## ✅ Documentation

- [ ] **Security guide** is up to date
- [ ] **API documentation** includes auth requirements
- [ ] **Incident response plan** documented
- [ ] **Recovery procedures** documented
- [ ] **Team trained** on security procedures

---

## ✅ Post-Deployment

- [ ] **Monitor first 24 hours** closely
- [ ] **Check audit logs** for anomalies:
  ```sql
  SELECT action, COUNT(*) 
  FROM audit_logs 
  WHERE timestamp > NOW() - INTERVAL '24 hours'
  GROUP BY action
  ORDER BY COUNT(*) DESC;
  ```
- [ ] **Verify all features** working in production
- [ ] **Performance metrics** within acceptable range
- [ ] **No security warnings** in browser console

---

## 🚨 Emergency Contacts

| Role | Contact | When to Contact |
|------|---------|----------------|
| Security Lead | security@team.com | Security breaches |
| DevOps Lead | devops@team.com | Infrastructure issues |
| Database Admin | dba@team.com | Database problems |
| On-Call Engineer | oncall@team.com | After hours emergencies |

---

## 📊 Sign-Off

### Deployment Approval

- [ ] **Development Team Lead** approved
- [ ] **Security Team** reviewed
- [ ] **QA Team** tested
- [ ] **Product Owner** signed off
- [ ] **Deployment scheduled** for: _______________

### Deployment Details

| Field | Value |
|-------|-------|
| Version | |
| Environment | |
| Deployed By | |
| Date | |
| Time | |
| Rollback Plan | |

---

## 🔄 Rollback Procedure

If issues arise post-deployment:

1. **Immediate Actions**:
   ```bash
   # Enable emergency lockdown
   EMERGENCY_LOCKDOWN=true npm run start
   ```

2. **Revert to previous version**:
   ```bash
   git revert HEAD
   npm run build
   npm run deploy
   ```

3. **Notify team** via emergency channel

4. **Document incident** for post-mortem

---

## 📝 Notes

_Add any deployment-specific notes here:_

---

*Last Updated: October 10, 2025*
*Checklist Version: 1.0*
*Next Review: Before each deployment*
