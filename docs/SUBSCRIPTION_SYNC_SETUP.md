# 🔐 Subscription Sync Integration - Setup Guide

Complete guide to integrate secure payment sync from landing page to main app.

---

## 📋 Overview

This system allows the landing page to securely sync subscription data to the main app after successful Razorpay payments using a **7-layer security architecture**.

### Security Layers

1. **IP Whitelisting** - Only allow requests from landing page server
2. **API Key Authentication** - Shared secret validation
3. **JWT Token Validation** - Time-limited service tokens
4. **HMAC Request Signing** - Prevent tampering and replay attacks
5. **AES-256-GCM Encryption** - Encrypted data in transit
6. **Timestamp Validation** - 5-minute window prevents replay
7. **Rate Limiting** - Application-level protection

---

## 🚀 Setup Steps

### Step 1: Run Database Migration

```bash
# In Supabase SQL Editor, run this file:
database/migrations/042_subscription_sync_integration.sql
```

This creates:
- `subscription_sync` table - Stores synced subscription data
- `audit_logs` table - Immutable audit trail
- `security_logs` table - Security event tracking
- `sync_retry_queue` table - Failed sync retry queue
- All necessary indexes, RLS policies, and views

### Step 2: Install Dependencies

```bash
npm install jsonwebtoken @types/jsonwebtoken
```

### Step 3: Generate Security Secrets

**CRITICAL:** Use the **EXACT SAME** secrets as your landing page!

If you don't have them yet, generate new ones:

```bash
# Run these commands in terminal to generate secure random secrets:

# API Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Signing Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ IMPORTANT:** Share these secrets securely with your landing page team!

### Step 4: Configure Environment Variables

Add to `.env.local`:

```bash
# Copy from landing page - MUST BE IDENTICAL
INTER_SERVICE_API_SECRET=<64-char-hex-from-landing-page>
INTER_SERVICE_API_KEY_ID=landing_page_v1
INTER_SERVICE_JWT_SECRET=<64-char-hex-from-landing-page>
REQUEST_SIGNING_SECRET=<64-char-hex-from-landing-page>
DATA_ENCRYPTION_KEY=<64-char-hex-from-landing-page>

# Get actual server IP from landing page deployment
ALLOWED_LANDING_PAGE_IPS=203.0.113.5,198.51.100.10

# These should already exist
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Step 5: Verify Setup

Test the endpoint is accessible:

```bash
curl http://localhost:3000/api/sync/subscription
```

Expected response:
```json
{
  "status": "ok",
  "service": "subscription-sync",
  "timestamp": "2025-11-01T09:45:00.000Z"
}
```

---

## 🔄 How It Works

### Payment Flow

1. **User completes payment on landing page** via Razorpay
2. **Landing page creates subscription** in its database
3. **Landing page encrypts** subscription data using AES-256-GCM
4. **Landing page generates JWT token** (5-minute expiry)
5. **Landing page signs request** with HMAC-SHA256
6. **Landing page sends POST** to `/api/sync/subscription`
7. **Main app validates** all 7 security layers
8. **Main app decrypts** and validates data
9. **Main app creates/updates** school record
10. **Main app logs** to audit trail
11. **Main app returns** success + school_id

### Request Format (from landing page)

```http
POST /api/sync/subscription HTTP/1.1
Host: your-main-app.com
Authorization: Bearer <jwt-token>
x-api-key: <shared-secret>
x-api-key-id: landing_page_v1
x-timestamp: 1698765432
x-signature: <hmac-sha256-signature>
Content-Type: application/json

{
  "data": "iv:authTag:encrypted-json-string"
}
```

### Decrypted Data Schema

```typescript
{
  id: "uuid-from-landing-page",
  user_email: "school@example.com",
  school_name: "ABC International School",
  phone: "+919876543210",
  plan_name: "Catalyst AI Pro",
  plan_price: 99.00,
  student_count: 75,
  billing_cycle: "yearly",
  status: "trial",
  trial_end_date: "2025-12-01T00:00:00Z",
  subscription_start_date: "2025-11-01T00:00:00Z",
  next_billing_date: "2025-12-01T00:00:00Z",
  razorpay_subscription_id: "sub_xxxxx",
  razorpay_order_id: "order_xxxxx",
  razorpay_payment_id: "pay_xxxxx",
  amount_paid: 7425.00
}
```

### Response Format

**Success (200):**
```json
{
  "success": true,
  "school_id": "uuid-of-school"
}
```

**Security Error (401):**
```json
{
  "error": "Unauthorized"
}
```

**Validation Error (400):**
```json
{
  "error": "Invalid data schema"
}
```

**Server Error (500):**
```json
{
  "error": "Internal server error"
}
```

---

## 🛡️ Security Features

### IP Whitelisting
- Only whitelisted IPs can access endpoint
- Development mode allows localhost
- Production requires explicit IP configuration

### Token Expiry
- JWT tokens expire in 5 minutes
- Prevents stolen token reuse

### Replay Attack Prevention
- Timestamp validation (5-minute window)
- HMAC signature unique per request
- Cannot reuse old requests

### Data Encryption
- AES-256-GCM encryption in transit
- Authenticated encryption prevents tampering
- Decryption failure = potential attack

### Audit Trail
- All requests logged to `audit_logs`
- Security failures logged to `security_logs`
- Immutable records for compliance

---

## 📊 Database Tables

### schools (modified)
```sql
-- New columns added:
subscription_status VARCHAR(20)
subscription_plan VARCHAR(100)
student_limit INTEGER
trial_end_date TIMESTAMP WITH TIME ZONE
subscription_start_date TIMESTAMP WITH TIME ZONE
subscription_end_date TIMESTAMP WITH TIME ZONE
next_billing_date TIMESTAMP WITH TIME ZONE
razorpay_subscription_id VARCHAR(255)
created_from VARCHAR(50)
```

### subscription_sync
```sql
-- Stores full sync history
id UUID PRIMARY KEY
school_id UUID REFERENCES schools(id)
landing_page_subscription_id UUID UNIQUE
data JSONB -- Full encrypted backup
sync_timestamp TIMESTAMP
sync_source VARCHAR(50)
sync_status VARCHAR(20)
```

### audit_logs
```sql
-- Immutable audit trail
id UUID PRIMARY KEY
timestamp TIMESTAMP
service VARCHAR(50)
action VARCHAR(100)
school_id UUID
ip_address VARCHAR(45)
payload_hash VARCHAR(64)
success BOOLEAN
error TEXT
```

### security_logs
```sql
-- Security event tracking
id UUID PRIMARY KEY
event_type VARCHAR(50)
severity VARCHAR(20)
ip_address VARCHAR(45)
description TEXT
resolved BOOLEAN
```

---

## 🔍 Monitoring & Debugging

### Check Recent Syncs

```sql
SELECT * FROM subscription_sync 
ORDER BY sync_timestamp DESC 
LIMIT 10;
```

### Check Failed Syncs

```sql
SELECT * FROM failed_syncs;
```

### Check Security Events

```sql
SELECT * FROM recent_security_events;
```

### Check Audit Logs

```sql
SELECT * FROM audit_logs 
WHERE service = 'landing-page' 
AND action = 'subscription_sync'
ORDER BY timestamp DESC 
LIMIT 20;
```

### View Active Subscriptions

```sql
SELECT * FROM active_subscriptions;
```

### View Trials Ending Soon

```sql
SELECT * FROM trial_schools_ending_soon;
```

---

## ⚠️ Common Issues

### Issue: "Unauthorized IP address"
**Solution:** Add landing page server IP to `ALLOWED_LANDING_PAGE_IPS`

### Issue: "Invalid API key"
**Solution:** Verify secrets match exactly between landing page and main app

### Issue: "Token expired"
**Solution:** Landing page needs to generate fresh JWT (5-min expiry)

### Issue: "Invalid request signature"
**Solution:** Check timestamp is current and signing secret matches

### Issue: "Decryption failed"
**Solution:** Verify `DATA_ENCRYPTION_KEY` matches landing page exactly

### Issue: "Missing required field"
**Solution:** Landing page must send all required fields in data schema

---

## 🧪 Testing

### Test Security Validation

```bash
# This should fail with 401 (no security headers)
curl -X POST http://localhost:3000/api/sync/subscription \
  -H "Content-Type: application/json" \
  -d '{"data":"test"}'
```

### Test Complete Flow

From landing page after successful payment, the sync happens automatically.

Monitor logs:
```sql
-- Real-time monitoring
SELECT * FROM audit_logs WHERE action = 'subscription_sync' ORDER BY timestamp DESC LIMIT 5;
SELECT * FROM security_logs WHERE resolved = false ORDER BY created_at DESC LIMIT 5;
```

---

## 📦 Files Created

```
catalyst/
├── database/
│   └── migrations/
│       └── 042_subscription_sync_integration.sql  ✅ Database schema
├── src/
│   ├── lib/
│   │   └── security.ts                            ✅ 7-layer security
│   └── app/
│       └── api/
│           └── sync/
│               └── subscription/
│                   └── route.ts                   ✅ Sync endpoint
├── .env.subscription-sync.example                 ✅ Env template
└── docs/
    └── SUBSCRIPTION_SYNC_SETUP.md                 ✅ This guide
```

---

## ✅ Pre-Production Checklist

- [ ] Database migration run successfully
- [ ] All environment variables configured
- [ ] Secrets match landing page exactly
- [ ] Landing page server IP whitelisted
- [ ] Test sync endpoint responds
- [ ] Complete end-to-end payment test
- [ ] Verify school record created
- [ ] Check audit logs working
- [ ] Security logs capturing failures
- [ ] RLS policies enabled and tested
- [ ] Service role key secure
- [ ] HTTPS enforced in production
- [ ] Error monitoring setup
- [ ] Backup strategy in place

---

## 🆘 Support

For issues:
1. Check `security_logs` for security failures
2. Check `audit_logs` for sync history
3. Verify environment variables
4. Confirm landing page using same secrets
5. Test endpoint health check

---

## 🔒 Security Best Practices

1. **Never commit** `.env.local` to git
2. **Rotate secrets** every 90 days
3. **Monitor** `security_logs` daily
4. **Alert** on critical severity events
5. **Audit** access logs monthly
6. **Backup** databases daily
7. **Test** disaster recovery quarterly
8. **Review** RLS policies annually

---

**Setup complete! 🎉**

The main app is now ready to receive secure subscription syncs from the landing page.
