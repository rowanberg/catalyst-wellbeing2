# Gemini API Governance - Supabase Functions

This directory contains Edge Functions for the Gemini API governance system.

## Functions

### 1. get-available-key
Selects an available API key with remaining capacity.

**Input:**
```json
{
  "model": "gemini_3_pro" | "gemini_2_5_pro",
  "estimated_tokens": 100
}
```

**Output:**
```json
{
  "api_key": "AIza...",
  "model": "gemini_3_pro",
  "capacity_remaining": { "rpm": null, "rpd": null, "tpm": 124900 }
}
```

### 2. log-usage
Records API usage after Gemini call.

**Input:**
```json
{
  "api_key": "AIza...",
  "model": "gemini_3_pro",
  "tokens_used": 150,
  "success": true
}
```

### 3. rotate-key
Manually or automatically rotates to next available key.

### 4. get-key-stats
Returns usage stats for all keys (API keys masked).

### 5. get-model-stats
Returns aggregated stats per model.

### 6. reset-windows
Cron job function - resets minute/day windows and aggregates usage.

## Deployment

### Deploy All Functions
```bash
npx supabase functions deploy get-available-key
npx supabase functions deploy log-usage
npx supabase functions deploy rotate-key
npx supabase functions deploy get-key-stats
npx supabase functions deploy get-model-stats
npx supabase functions deploy reset-windows
```

### Deploy Single Function
```bash
npx supabase functions deploy get-available-key
```

## Local Testing

```bash
npx supabase functions serve get-available-key
```

## Environment Variables

Set in Supabase Dashboard → Edge Functions → Secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Scheduling reset-windows

Use pg_cron or external scheduler to call every minute:
```bash
curl -X POST https://[project-id].supabase.co/functions/v1/reset-windows \
  -H "Authorization: Bearer [service-role-key]"
```
