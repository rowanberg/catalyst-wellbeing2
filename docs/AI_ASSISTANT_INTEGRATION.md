# Admin AI Assistant - Intelligent Router Integration

## ✅ Integration Complete

The Admin AI Assistant (`/admin/ai-assistant`) now uses the **intelligent-ai-router** Edge Function to manage API keys from the `gemini_25_flash_keys` database table.

---

## 🔄 How It Works

### **Request Flow**

```
User sends message
    ↓
/api/admin/ai-chat
    ↓
Intelligent AI Router (Edge Function)
    ↓
gemini_25_flash_keys table
    ↓
- Check RPM (10/min per key)
- Check RPD (250/day per key)
- Check TPM (250K tokens/day per key)
- Clear expired cooldowns
- Reset counters if needed
- Select least-recently-used key
    ↓
Return decrypted API key
    ↓
Generate AI response with Gemini
    ↓
Update usage logs
    ↓
Return response to user
```

---

## 📊 Automatic Management

### **On-Demand Resets**
- ✅ **RPM Reset**: Every 60 seconds (when key is requested)
- ✅ **RPD/TPM Reset**: Every 24 hours (when key is requested)
- ✅ **Cooldown Clearing**: Expired cooldowns removed automatically
- ✅ **Zero overhead**: Only runs when AI assistant is actively used

### **Intelligent Features**
1. **Least-Recently-Used Selection** - Balances load across all keys
2. **Automatic Fallback** - Falls back to other models if all keys exhausted
3. **Row-Level Locking** - Prevents race conditions in high-traffic
4. **Token-Aware** - Won't select keys that can't handle estimated tokens
5. **Usage Analytics** - All requests logged to `api_usage_logs`

---

## 🎯 Database Tables Used

### **gemini_25_flash_keys**
```sql
- id: UUID (primary key)
- encrypted_api_key: TEXT (AES-256-GCM encrypted)
- status: 'active' | 'disabled' | 'rate_limited'
- rpm_limit: 10 (requests per minute)
- rpd_limit: 250 (requests per day)
- tpm_limit: 250000 (tokens per minute)
- current_rpm: INT (auto-resets every 60s)
- current_rpd: INT (auto-resets every 24h)
- current_tpm: INT (auto-resets every 24h)
- is_in_cooldown: BOOLEAN
- cooldown_expires_at: TIMESTAMP
```

### **api_usage_logs**
Every AI request is logged:
```sql
- model_requested: 'gemini-2.5-flash'
- model_used: 'gemini-2.5-flash' (or fallback model)
- key_id: UUID (which key was used)
- tokens_used: INT (actual tokens consumed)
- status: 'success' | 'error' | 'fallback'
- user_id: UUID (admin user)
- endpoint: '/api/admin/ai-chat'
- request_duration_ms: INT
```

---

## 📈 Monitoring

### **Check Current Usage**
```sql
SELECT * FROM get_key_usage_summary();
```

**Output:**
```
┌─────────────────────────┬────────────┬─────────────┬─────────────┬──────────────┬──────────────┐
│ model_family            │ total_keys │ active_keys │ in_cooldown │ avg_rpm      │ avg_rpd      │
├─────────────────────────┼────────────┼─────────────┼─────────────┼──────────────┼──────────────┤
│ Gemini 2.5 Flash        │         25 │          25 │           0 │         2.3  │        45.8  │
└─────────────────────────┴────────────┴─────────────┴─────────────┴──────────────┴──────────────┘
```

### **View Recent AI Assistant Usage**
```sql
SELECT 
  created_at,
  model_used,
  tokens_used,
  request_duration_ms,
  status
FROM api_usage_logs
WHERE endpoint = '/api/admin/ai-chat'
ORDER BY created_at DESC
LIMIT 20;
```

### **Check Keys Near Limits**
```sql
SELECT 
  id,
  current_rpm || '/' || rpm_limit as rpm,
  current_rpd || '/' || rpd_limit as rpd,
  ROUND((current_rpd::NUMERIC / rpd_limit) * 100, 1) || '%' as daily_usage,
  is_in_cooldown,
  last_used_at
FROM gemini_25_flash_keys
WHERE status = 'active'
ORDER BY current_rpd DESC
LIMIT 10;
```

---

## 🧪 Testing

### **1. Test in UI**
```
1. Navigate to http://localhost:3000/admin/ai-assistant
2. Send a message: "Analyze student performance trends"
3. Check browser console for:
   ✅ "🔑 Requesting API key from intelligent router..."
   ✅ "✅ API key obtained: { model_used: 'gemini-2.5-flash', ... }"
   ✅ "✅ AI response generated: { tokens: 1234, duration_ms: 2500 }"
```

### **2. Check Logs**
```sql
-- Should see new entry with your user_id
SELECT * FROM api_usage_logs 
ORDER BY created_at DESC 
LIMIT 1;
```

### **3. Verify Key Usage Incremented**
```sql
-- Pick a key and check its counters
SELECT 
  current_rpm,
  current_rpd,
  current_tpm,
  last_used_at
FROM gemini_25_flash_keys
WHERE id = 'key-uuid-from-logs';
```

---

## ⚠️ Rate Limiting Behavior

### **What Happens When Limits Are Reached**

**Scenario 1: Single Key RPM Limit (10/min)**
- Key A reaches 10 requests in 1 minute
- Router automatically selects Key B
- Key A resets after 60 seconds

**Scenario 2: All Keys RPM Limited**
- All keys in `gemini_25_flash_keys` at RPM limit
- Router falls back to `gemini_25_flash_lite_keys` (if available)
- Or `gemini_20_flash_lite_keys`
- Or returns 429 error if all exhausted

**Scenario 3: Daily Limit (RPD)**
- Key reaches 250 requests in 24 hours
- Router skips that key
- Selects different key
- Key resets after 24 hours

---

## 🔧 Admin Controls

### **Force Reset All Counters**
```sql
-- Reset RPM for all keys
SELECT * FROM admin_reset_all_rpm_counters();

-- Reset RPD for all keys
SELECT * FROM admin_reset_all_rpd_counters();

-- Clear all cooldowns
SELECT * FROM admin_clear_all_cooldowns();
```

### **Disable a Problematic Key**
```sql
UPDATE gemini_25_flash_keys
SET status = 'disabled'
WHERE id = 'problematic-key-uuid';
```

### **Add New API Key to System**
```sql
-- Use helper function to add to ALL model tables
SELECT * FROM add_api_key_to_all_models(
  'iv:hex:tag:hex:encrypted:hex',
  'Production key #26'
);
```

---

## 📝 Response Metadata

Every AI response now includes routing metadata:

```json
{
  "response": "AI generated text...",
  "metadata": {
    "dataType": ["students", "grades", "attendance"],
    "metrics": {
      "totalStudents": 150,
      "attendanceRate": "92.5"
    },
    "aiRouting": {
      "model_requested": "gemini-2.5-flash",
      "model_used": "gemini-2.5-flash",
      "fallback_count": 0,
      "tokens_used": 1234,
      "key_usage": {
        "rpm": "3/10",
        "rpd": "47/250"
      },
      "request_duration_ms": 2456
    }
  }
}
```

---

## 🚨 Troubleshooting

### **Error: "All API keys are currently rate-limited"**
```sql
-- Check if keys need reset
SELECT * FROM get_key_usage_summary();

-- Force reset if needed
SELECT * FROM admin_reset_all_rpd_counters();
```

### **Error: "Router error: Service configuration error"**
```bash
# Check encryption key is set
supabase secrets list

# Set if missing
supabase secrets set GEMINI_ENCRYPTION_KEY=your-key
```

### **No API keys in table**
```bash
# Run population migration
psql -d your_database -f database/migrations/032_populate_model_keys_from_existing.sql
```

---

## ✨ Benefits

✅ **No hardcoded API keys** - All keys encrypted in database  
✅ **Automatic load balancing** - Distributes requests across 100+ keys  
✅ **Rate limit protection** - Never exceeds Google's limits  
✅ **Automatic failover** - Seamless fallback to other models  
✅ **Complete analytics** - Track every request and token  
✅ **Zero manual intervention** - Self-managing system  
✅ **Scalable** - Add keys without code changes  
✅ **Efficient** - On-demand resets, no wasted resources
