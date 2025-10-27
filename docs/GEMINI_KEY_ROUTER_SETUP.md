# Gemini API Key Router Setup Guide

## Overview
This system manages 100+ Gemini API keys to maximize free tier usage while respecting rate limits (15 req/min, 1000 req/day per key).

## Architecture Components

### 1. Firestore Collection (`geminiApiKeys`)
- Stores encrypted API keys
- Tracks usage per key (daily & per-minute)
- Auto-resets counters at appropriate intervals
- Security: Only accessible by Cloud Functions, not clients

### 2. Cloud Functions
- `getAvailableGeminiKey`: Main function to get an available key
- `addGeminiApiKey`: Admin function to add new keys
- `toggleGeminiApiKey`: Enable/disable specific keys
- `getGeminiKeyStats`: View usage statistics

### 3. Client Integration
- Calls Cloud Function instead of using hardcoded keys
- Automatic retry with exponential backoff
- Transparent rate limit handling

## Setup Instructions

### Step 1: Generate Encryption Key
```bash
# Generate a 32-byte encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Set Environment Variables
```bash
# In Firebase Functions
firebase functions:config:set gemini.encryption_key="49ed34f4bdcfc4195d35270a372e8884cd155cfc7cc7ede2f1adf8aa1f8358c0"
```

### Step 3: Deploy Firestore Rules & Indexes
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Step 4: Deploy Cloud Functions
```bash
cd firebase/functions
npm install
firebase deploy --only functions:getAvailableGeminiKey,functions:addGeminiApiKey,functions:toggleGeminiApiKey,functions:getGeminiKeyStats
```

### Step 5: Populate API Keys
1. Add your service account JSON to `firebase-service-account.json`
2. Edit `scripts/setup-gemini-keys.js` with your API keys
3. Run the setup script:
```bash
GEMINI_ENCRYPTION_KEY=YOUR_KEY node scripts/setup-gemini-keys.js
```

## Usage in Application

### Basic Usage
```typescript
import { getAvailableGeminiKey } from '@/lib/firebase/geminiKeyRouter';

// Get an available key
const { apiKey, remainingDaily, remainingMinute } = await getAvailableGeminiKey();

// Use the key with Gemini
const genAI = new GoogleGenerativeAI(apiKey);
```

### With Retry Logic
```typescript
import { callGeminiWithRetry } from '@/lib/firebase/geminiKeyRouter';

const response = await callGeminiWithRetry(async (apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return await genAI.generateContent(prompt);
});
```

## Monitoring & Management

### View Statistics
```typescript
// Admin only - requires admin custom claim
const stats = await httpsCallable(functions, 'getGeminiKeyStats')();
console.log('Total keys:', stats.totalKeys);
console.log('Keys at limit:', stats.keysAtDailyLimit);
```

### Disable a Key
```typescript
// Admin only
await httpsCallable(functions, 'toggleGeminiApiKey')({
  keyId: 'key_1',
  isDisabled: true
});
```

## Rate Limit Strategy

### Per-Minute Limiting (15 req/min)
- Each key tracks requests in 60-second windows
- Automatically resets after 60 seconds
- Prevents burst usage

### Daily Limiting (1000 req/day)
- Resets at midnight UTC
- Tracks total usage per calendar day
- Keys near limit are deprioritized

### Key Selection Algorithm
1. Query keys with `isDisabled=false` and `dailyRequestCount<1000`
2. Order by `dailyRequestCount` (ascending) for even distribution
3. Check minute window within transaction
4. Select first available key
5. Update counters atomically

## Performance Optimization

### Firestore Reads
- Limited query to 10 keys per request
- Composite index on `isDisabled` + `dailyRequestCount`
- Transaction batching for atomic updates

### Latency Target: <200ms
- Indexed queries (~50ms)
- Transaction overhead (~100ms)
- Network latency (~50ms)

## Security Considerations

1. **API Key Encryption**: AES-256-GCM encryption at rest
2. **Access Control**: Firestore rules deny all client access
3. **Authentication**: Cloud Functions require authenticated users
4. **Admin Functions**: Require admin custom claim
5. **Audit Trail**: Tracks `createdBy` and `updatedBy`

## Cost Analysis (Firebase Free Tier)

### Firestore
- 100 keys × 2 updates/min × 60 min = 12,000 writes/hour
- Free tier: 20,000 writes/day ✓

### Cloud Functions
- ~1000 invocations/day per key = 100,000 total
- Free tier: 125,000 invocations/month ✓

### Bandwidth
- Minimal data transfer (<1KB per request)
- Well within free tier limits

## Troubleshooting

### "All keys rate-limited"
- Check if it's near midnight UTC (daily reset pending)
- Verify keys aren't disabled
- Check `getGeminiKeyStats` for usage

### "Failed to decrypt API key"
- Verify ENCRYPTION_KEY environment variable
- Check key format in Firestore

### High latency
- Check Firestore indexes are deployed
- Monitor transaction contention
- Consider increasing query limit

## Future Enhancements

1. **Predictive Loading**: Pre-select keys based on usage patterns
2. **Geographic Distribution**: Route to nearest region
3. **Priority Queuing**: Reserve keys for premium users
4. **Auto-scaling**: Add keys dynamically based on demand
5. **Usage Analytics**: Track patterns for optimization
