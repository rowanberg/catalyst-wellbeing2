# AI Quota System Documentation

## Overview
The AI quota system provides users with 530 total daily AI requests:
- **30 Standard Requests**: Using Gemini 2.0 Flash (fastest)
- **500 Extra Requests**: Using other Gemini models (1.5 Pro, 1.5 Flash, 1.0 Pro)

All requests use the same pool of 100+ Gemini API keys that are already configured in the system.

## How It Works

### Quota Allocation
1. **First 30 requests/day**: Routes through `gemini-2.0-flash` (standard quota)
2. **Next 500 requests/day**: Routes through tiered Gemini models (extra quota):
   - Tier 1: `gemini-1.5-pro` (most capable)
   - Tier 2: `gemini-1.5-flash` (balanced)
   - Tier 3: `gemini-1.0-pro` (fastest)
3. **Daily Reset**: All quotas reset at midnight UTC

### API Key Management
- Uses the existing Gemini API key pool (100+ keys)
- Keys are managed by the Supabase Edge Function `get-available-gemini-key`
- Automatic rotation when keys hit rate limits
- Rate limits per key: 1000 requests/day, 15 requests/minute

## Implementation

### Database Schema
Run the migration: `database/migrations/create_ai_quota_system_simplified.sql`

This creates:
- `user_ai_quotas` table: Tracks user quotas
- `ai_request_logs` table: Logs requests for analytics
- Helper functions for quota management

### API Endpoints

#### Extended Chat Endpoint
`POST /api/chat/gemini-extended`
- Checks user quota
- Routes to appropriate model based on quota type
- Tracks usage automatically

#### Quota Status Endpoint
`GET /api/chat/gemini-extended`
- Returns current quota usage
- Shows time until reset

### Frontend Integration

#### Update AI Homework Helper
In `src/components/student/tools/ai-homework-helper.tsx`:

1. Change the API endpoint:
```typescript
// Old
const response = await fetch('/api/chat/gemini', {

// New
const response = await fetch('/api/chat/gemini-extended', {
```

2. Add the QuotaIndicator component:
```tsx
import { QuotaIndicator } from './QuotaIndicator'

// In the component JSX, add near the top:
<QuotaIndicator />
```

## Deployment Steps

1. **Run the database migration**:
   - Go to Supabase SQL Editor
   - Run the contents of `create_ai_quota_system_simplified.sql`

2. **Deploy the new API routes**:
   - The routes are already created and ready to use
   - `/api/chat/gemini-extended` handles all quota logic

3. **Update the frontend**:
   - Update the homework helper to use the new endpoint
   - Add the quota indicator for user visibility

## User Experience

### What Users See
- First 30 requests: "X standard requests remaining today"
- Next 500 requests: "X extra requests remaining today" 
- Progress bars showing usage
- Time until daily reset
- Clear messages when quotas are exhausted

### Model Quality
- Standard quota (Gemini 2.0 Flash): Fastest responses, great for most tasks
- Extra quota models provide similar quality with slight variations:
  - Gemini 1.5 Pro: Best for complex reasoning
  - Gemini 1.5 Flash: Good balance of speed and quality
  - Gemini 1.0 Pro: Fastest fallback option

## Monitoring

Track usage with these queries:

```sql
-- Daily usage by user
SELECT 
  user_id,
  normal_daily_usage,
  extra_daily_usage,
  total_requests_today,
  last_reset_timestamp
FROM user_ai_quotas
ORDER BY total_requests_today DESC;

-- Request logs
SELECT 
  DATE(timestamp) as day,
  request_type,
  model_used,
  COUNT(*) as requests,
  AVG(response_time_ms) as avg_response_time
FROM ai_request_logs
GROUP BY DATE(timestamp), request_type, model_used
ORDER BY day DESC;
```

## Notes
- The system uses the same Gemini API keys for all models
- No separate Gemma API keys needed
- Automatic fallback between models based on availability
- All models support text and image inputs
