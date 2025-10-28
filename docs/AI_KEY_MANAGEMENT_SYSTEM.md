# Intelligent AI Key Management System

## Overview
Automated multi-model Gemini API key management system with intelligent fallback routing across 100+ API keys and 4 model families.

---

## 🎯 Model Families

| Model | RPM | RPD | TPM | Fallback Priority | Table |
|-------|-----|-----|-----|-------------------|-------|
| **Gemini 2.5 Flash Lite** | 15 | 1,000 | 250K | 1 (Primary) | `gemini_25_flash_lite_keys` |
| **Gemini 2.5 Flash** | 10 | 250 | 250K | 2 | `gemini_25_flash_keys` |
| **Gemini 2.0 Flash Lite** | 30 | 200 | 1M | 3 | `gemini_20_flash_lite_keys` |
| **Gemini Flash 2 (Legacy)** | 15 | 1,500 | 1M | 4 (Fallback) | `gemini_api_keys` |

---

## 🚀 Usage

### Edge Function Call

```javascript
const response = await fetch('https://your-project.supabase.co/functions/v1/intelligent-ai-router', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gemini-2.5-flash-lite',
    tokens: 1500,  // Optional: estimated tokens
    prompt: 'Your prompt here',  // Optional: for auto-estimation
    userId: 'user-uuid',  // Optional: for analytics
    endpoint: '/api/chat'  // Optional: for logging
  })
})

const data = await response.json()
```

### Response Format

**Success (200):**
```json
{
  "success": true,
  "api_key": "AIza...decrypted-key",
  "model_requested": "gemini-2.5-flash-lite",
  "model_used": "gemini-2.5-flash-lite",
  "fallback_count": 0,
  "key_id": "uuid-of-key",
  "usage": {
    "current_rpm": 3,
    "current_rpd": 45,
    "current_tpm": 4500,
    "rpm_limit": 15,
    "rpd_limit": 1000,
    "tpm_limit": 250000
  },
  "request_duration_ms": 125
}
```

**Fallback (200):**
```json
{
  "success": true,
  "api_key": "AIza...decrypted-key",
  "model_requested": "gemini-2.5-flash-lite",
  "model_used": "gemini-2.5-flash",
  "fallback_count": 1,
  ...
}
```

**Rate Limited (429):**
```json
{
  "error": "All model keys exhausted",
  "message": "All API keys across all models are currently rate-limited.",
  "retryAfter": 60
}
```

---

## 📊 Monitoring Queries

### Key Usage Summary
```sql
SELECT * FROM get_key_usage_summary();
```

### Recent API Usage (Last Hour)
```sql
SELECT 
  model_requested,
  model_used,
  COUNT(*) as request_count,
  AVG(tokens_used) as avg_tokens,
  AVG(request_duration_ms) as avg_duration_ms,
  COUNT(*) FILTER (WHERE status = 'fallback') as fallback_count
FROM api_usage_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY model_requested, model_used
ORDER BY request_count DESC;
```

### Keys Near Limits
```sql
-- Gemini 2.5 Flash Lite
SELECT 
  id,
  current_rpm,
  rpm_limit,
  current_rpd,
  rpd_limit,
  ROUND((current_rpm::NUMERIC / rpm_limit) * 100, 1) as rpm_usage_pct,
  ROUND((current_rpd::NUMERIC / rpd_limit) * 100, 1) as rpd_usage_pct
FROM gemini_25_flash_lite_keys
WHERE status = 'active'
  AND (
    current_rpm >= rpm_limit * 0.8 
    OR current_rpd >= rpd_limit * 0.8
  )
ORDER BY rpd_usage_pct DESC;
```

### Fallback Rate Analysis
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE fallback_count > 0) as fallback_requests,
  ROUND(
    (COUNT(*) FILTER (WHERE fallback_count > 0)::NUMERIC / COUNT(*)) * 100, 
    2
  ) as fallback_rate_pct,
  AVG(fallback_count) FILTER (WHERE fallback_count > 0) as avg_fallback_steps
FROM api_usage_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

---

## 🔧 Administration

### Add New API Key

```sql
-- Gemini 2.5 Flash Lite
INSERT INTO gemini_25_flash_lite_keys (encrypted_api_key, notes)
VALUES ('encrypted:hex:data', 'Production key #5');

-- Gemini 2.5 Flash
INSERT INTO gemini_25_flash_keys (encrypted_api_key, notes)
VALUES ('encrypted:hex:data', 'Production key #3');
```

### Disable Key
```sql
UPDATE gemini_25_flash_lite_keys
SET status = 'disabled'
WHERE id = 'key-uuid';
```

### Put Key in Cooldown (Manual)
```sql
UPDATE gemini_25_flash_lite_keys
SET is_in_cooldown = TRUE,
    cooldown_expires_at = NOW() + INTERVAL '5 minutes'
WHERE id = 'key-uuid';
```

### Force Reset Counters
```sql
-- Reset all RPM counters
SELECT reset_all_rpm_counters();

-- Reset all RPD counters
SELECT reset_all_rpd_counters();

-- Clear expired cooldowns
SELECT clear_expired_cooldowns();
```

---

## 🔐 Security

### Environment Variables Required
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_ENCRYPTION_KEY=64-character-hex-string
```

### Generate Encryption Key
```javascript
const crypto = require('crypto')
const key = crypto.randomBytes(32).toString('hex')
console.log(key)
```

### Encrypt API Key (Node.js)
```javascript
const crypto = require('crypto')

function encryptApiKey(apiKey, encryptionKey) {
  const algorithm = 'aes-256-gcm'
  const iv = crypto.randomBytes(12)
  const key = Buffer.from(encryptionKey, 'hex')
  
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

// Usage
const encryptionKey = process.env.GEMINI_ENCRYPTION_KEY
const apiKey = 'AIzaSyC...'
const encrypted = encryptApiKey(apiKey, encryptionKey)
console.log(encrypted)
```

---

## 🕐 Automated Jobs

### pg_cron Schedules

| Job | Schedule | Function |
|-----|----------|----------|
| **Reset RPM Counters** | Every minute | `reset_all_rpm_counters()` |
| **Reset RPD Counters** | Daily at midnight UTC | `reset_all_rpd_counters()` |
| **Clear Cooldowns** | Every 5 minutes | `clear_expired_cooldowns()` |

### Check Cron Jobs
```sql
SELECT * FROM cron.job;
```

### Cron Job Logs
```sql
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

---

## 🎯 Fallback Logic

**Automatic Fallback Chain:**
1. **Gemini 2.5 Flash Lite** (Primary)
   - If all keys rate-limited → fallback to step 2

2. **Gemini 2.5 Flash** (Secondary)
   - If all keys rate-limited → fallback to step 3

3. **Gemini 2.0 Flash Lite** (Tertiary)
   - If all keys rate-limited → fallback to step 4

4. **Gemini Flash 2** (Final Fallback)
   - If all keys rate-limited → **429 Error**

**Example:**
- Request for `gemini-2.5-flash-lite` with all keys exhausted
- System automatically tries `gemini-2.5-flash`
- Returns `{ fallback_count: 1, model_used: "gemini-2.5-flash" }`

---

## 📈 Performance Optimization

### Row-Level Locking
Keys are updated with row-level locking to prevent race conditions:
```sql
UPDATE gemini_25_flash_lite_keys
SET current_rpm = current_rpm + 1
WHERE id = 'key-uuid'
RETURNING *;
```

### Indexes
All tables have optimized indexes:
- `idx_{model}_active` - Fast active key lookup
- `idx_{model}_usage` - Usage counter queries
- `idx_{model}_cooldown` - Cooldown management

### Caching Strategy
- Edge function caches model configs in memory
- Database queries use indexed columns
- Key selection prioritizes least-recently-used

---

## 🐛 Troubleshooting

### All Keys Exhausted
```sql
-- Check key availability
SELECT 
  (SELECT COUNT(*) FROM gemini_25_flash_lite_keys WHERE status = 'active' AND is_in_cooldown = FALSE) as flash_lite_25,
  (SELECT COUNT(*) FROM gemini_25_flash_keys WHERE status = 'active' AND is_in_cooldown = FALSE) as flash_25,
  (SELECT COUNT(*) FROM gemini_20_flash_lite_keys WHERE status = 'active' AND is_in_cooldown = FALSE) as flash_lite_20;
```

### Reset All Counters Manually
```sql
-- Force reset everything
UPDATE gemini_25_flash_lite_keys SET current_rpm = 0, current_rpd = 0, current_tpm = 0;
UPDATE gemini_25_flash_keys SET current_rpm = 0, current_rpd = 0, current_tpm = 0;
UPDATE gemini_20_flash_lite_keys SET current_rpm = 0, current_rpd = 0, current_tpm = 0;
```

### Check Logs for Errors
```sql
SELECT * FROM api_usage_logs
WHERE status = 'error'
ORDER BY created_at DESC
LIMIT 50;
```

---

## 📝 Migration Steps

### 1. Run Migrations
```bash
# Apply database migrations
psql -d your_database -f database/migrations/030_add_gemini_model_families.sql
psql -d your_database -f database/migrations/031_add_scheduled_resets.sql
```

### 2. Deploy Edge Function
```bash
cd supabase/functions
supabase functions deploy intelligent-ai-router
```

### 3. Set Environment Variables
```bash
supabase secrets set GEMINI_ENCRYPTION_KEY=your-64-char-hex-key
```

### 4. Add API Keys
Use the encryption script to encrypt your keys, then insert into tables.

### 5. Verify Setup
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'gemini%';

-- Check cron jobs scheduled
SELECT * FROM cron.job WHERE jobname LIKE '%gemini%' OR jobname LIKE '%rpm%' OR jobname LIKE '%rpd%';
```

---

## 🔄 Maintenance

### Daily Tasks
- Monitor `get_key_usage_summary()` for anomalies
- Check `api_usage_logs` for high error rates
- Review fallback rates

### Weekly Tasks
- Analyze token usage trends
- Optimize key distribution
- Review and remove old logs (>30 days)

### Monthly Tasks
- Audit encryption key rotation
- Review model performance metrics
- Plan capacity for key additions

---

## 📚 Related Files

- `database/migrations/030_add_gemini_model_families.sql` - Table definitions
- `database/migrations/031_add_scheduled_resets.sql` - Scheduled functions
- `supabase/functions/intelligent-ai-router/index.ts` - Edge function
- `supabase/functions/get-available-gemini-key/index.ts` - Legacy function

---

## 🎉 Features

✅ **100+ Key Management** - Scale across multiple API keys per model  
✅ **Intelligent Fallback** - Automatic model switching when limits reached  
✅ **Real-time Monitoring** - Usage logs and analytics  
✅ **Automated Resets** - Scheduled RPM/RPD counter resets  
✅ **Cooldown Management** - Automatic key recovery after rate limits  
✅ **Row-level Locking** - Prevent race conditions in concurrent requests  
✅ **Token-aware Selection** - Keys selected based on available TPM capacity  
✅ **Encrypted Storage** - AES-256-GCM encryption for API keys  
✅ **Performance Optimized** - Indexed queries and efficient key rotation
