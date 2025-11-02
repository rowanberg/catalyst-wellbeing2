# 🎯 Affiliate Referral Tracking System - Implementation Guide

## Overview

This system captures affiliate referral codes during school registration and tracks which affiliate referred each school. This enables commission calculations and affiliate performance monitoring.

---

## 📊 Architecture

```
User visits registration page with ref code
    ↓
http://localhost:3000/register/wizard?ref=TEST2024
    ↓
Frontend captures 'ref' parameter from URL
    ↓
User completes registration form
    ↓
Frontend sends data + referralCode to API
    ↓
API looks up affiliate by referral_code
    ↓
API stores affiliate_id in schools.referred_by_affiliate_id
    ↓
Trigger automatically updates affiliate statistics
```

---

## 🗄️ Database Schema

### 1. Affiliates Table

```sql
CREATE TABLE public.affiliates (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL,  -- "TEST2024", "PARTNER2024"
    
    -- Stats (auto-updated by trigger)
    total_referrals INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    total_commission_earned NUMERIC(10, 2) DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Points:**
- `referral_code` is unique and indexed for fast lookups
- RLS blocks all client-side access (security)
- Only service_role can query this table

### 2. Schools Table - New Column

```sql
ALTER TABLE public.schools 
ADD COLUMN referred_by_affiliate_id UUID REFERENCES public.affiliates(id);
```

**Key Points:**
- Nullable - schools can register without a referral
- Foreign key with `ON DELETE SET NULL` (preserves data if affiliate removed)
- Indexed for performance

### 3. Auto-Update Trigger

When a school is created/updated/deleted, the trigger automatically updates:
- `affiliates.total_referrals`
- `affiliates.active_referrals`

---

## 💻 Frontend Implementation

### Registration Wizard (`src/app/(auth)/register/wizard/page.tsx`)

**Changes Made:**

1. **Import `useSearchParams`:**
```typescript
import { useRouter, useSearchParams } from 'next/navigation'
```

2. **Add State for Referral Code:**
```typescript
const [referralCode, setReferralCode] = useState<string | null>(null)
const searchParams = useSearchParams()
```

3. **Capture from URL on Mount:**
```typescript
useEffect(() => {
  const ref = searchParams.get('ref')
  if (ref) {
    setReferralCode(ref)
    console.log('📌 Referral code captured:', ref)
  }
}, [searchParams])
```

4. **Pass to API:**
```typescript
const onSubmit = async (data: SchoolForm) => {
  const payload = {
    ...data,
    referralCode: referralCode || undefined,
  }
  
  const response = await fetch('/api/register-school', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
```

---

## 🔧 Backend Implementation

### Register School API (`src/app/api/register-school/route.ts`)

**Changes Made:**

1. **Extract Referral Code from Request:**
```typescript
const {
  schoolName,
  address,
  // ... other fields
  referralCode // NEW: optional affiliate code
} = await request.json()
```

2. **Lookup Affiliate (Before School Creation):**
```typescript
let affiliateId: string | null = null

if (referralCode) {
  const { data: affiliateData } = await supabaseAdmin
    .from('affiliates')
    .select('id, name, status')
    .eq('referral_code', referralCode)
    .eq('status', 'active')
    .single()
  
  if (affiliateData) {
    affiliateId = affiliateData.id
    console.log('✅ Affiliate found:', affiliateData.name)
  }
}
```

**Important:**
- Uses `supabaseAdmin` (service_role) to bypass RLS
- Only matches active affiliates
- Doesn't fail registration if code is invalid

3. **Store Affiliate ID:**
```typescript
const { data: schoolData } = await supabaseAdmin
  .from('schools')
  .insert({
    name: schoolName,
    // ... other fields
    referred_by_affiliate_id: affiliateId, // NEW: Store affiliate UUID
  })
```

---

## 🔐 Security

### RLS Policies on Affiliates Table

```sql
-- Block all client-side access
CREATE POLICY "Block direct client access to affiliates"
ON public.affiliates FOR ALL
TO anon, authenticated
USING (false);

-- Service role has full access (for Edge Functions)
CREATE POLICY "Service role has full access to affiliates"
ON public.affiliates FOR ALL
TO service_role
USING (true);
```

**Why This Matters:**
- Prevents clients from viewing all referral codes
- Prevents clients from seeing affiliate commission data
- All affiliate lookups must go through server-side API

---

## 🧪 Testing Guide

### 1. Deploy Database Migration

```bash
# Run in Supabase SQL Editor
-- Execute: database/migrations/042_add_affiliate_referral_tracking.sql
```

**Verify:**
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('affiliates');

-- Check column added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'schools' AND column_name = 'referred_by_affiliate_id';

-- View test affiliates
SELECT id, name, referral_code FROM affiliates;
```

### 2. Test Registration Flow

**Step 1: Visit registration page WITH referral code**
```
http://localhost:3000/register/wizard?ref=TEST2024
```

**Step 2: Complete registration form**
- Fill in all school and admin details
- Submit the form

**Step 3: Check browser console**
Look for:
```
📌 Referral code captured: TEST2024
```

**Step 4: Check server logs**
Look for:
```
🔍 Looking up affiliate with referral code: TEST2024
✅ Affiliate found: { id: '...', name: 'Test Affiliate Partner' }
School registration completed: { affiliateId: '...', referralTracked: true }
```

**Step 5: Verify in database**
```sql
-- Check school was linked to affiliate
SELECT 
  s.id,
  s.name as school_name,
  a.name as affiliate_name,
  a.referral_code
FROM schools s
LEFT JOIN affiliates a ON a.id = s.referred_by_affiliate_id
WHERE s.created_at > NOW() - INTERVAL '1 hour'
ORDER BY s.created_at DESC
LIMIT 5;

-- Check affiliate stats updated
SELECT 
  name,
  referral_code,
  total_referrals,
  active_referrals
FROM affiliates
WHERE referral_code = 'TEST2024';
```

### 3. Test WITHOUT Referral Code

**Visit:**
```
http://localhost:3000/register/wizard
```

**Expected Behavior:**
- Registration completes successfully
- `referred_by_affiliate_id` is NULL in database
- No errors logged

### 4. Test Invalid Referral Code

**Visit:**
```
http://localhost:3000/register/wizard?ref=INVALID999
```

**Expected Behavior:**
- Registration completes successfully
- Warning logged: "No affiliate found with code: INVALID999"
- `referred_by_affiliate_id` is NULL
- Registration doesn't fail

---

## 📈 Querying Referral Data

### Get All Schools Referred by an Affiliate

```sql
SELECT 
  s.id,
  s.name,
  s.created_at,
  s.school_code
FROM schools s
WHERE s.referred_by_affiliate_id = 'affiliate-uuid-here'
ORDER BY s.created_at DESC;
```

### Affiliate Performance Report

```sql
SELECT * FROM affiliate_performance
ORDER BY total_referrals DESC;
```

### Schools Registered This Month with Referrals

```sql
SELECT 
  s.name as school_name,
  a.name as affiliate_name,
  a.referral_code,
  s.created_at
FROM schools s
INNER JOIN affiliates a ON a.id = s.referred_by_affiliate_id
WHERE s.created_at >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY s.created_at DESC;
```

---

## 🔄 Inheritance Logic

**Key Insight:** By storing `referred_by_affiliate_id` on the `schools` table, ALL future users (students, teachers, parents) linked to that school are implicitly tied to the affiliate.

**Query Example:**
```sql
-- Get all students referred by an affiliate
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.role,
  s.name as school_name,
  a.name as affiliate_name
FROM profiles p
INNER JOIN schools s ON s.id = p.school_id
INNER JOIN affiliates a ON a.id = s.referred_by_affiliate_id
WHERE a.referral_code = 'TEST2024'
AND p.role = 'student';
```

**No Need to Add affiliate_id to profiles table** - the relationship is established through the school.

---

## 🎯 Commission Tracking (Future Enhancement)

While not implemented yet, the schema supports commission calculations:

```sql
-- Example: Calculate commission based on school size
SELECT 
  a.name as affiliate_name,
  s.name as school_name,
  sd.total_students,
  CASE 
    WHEN sd.total_students > 1000 THEN 500
    WHEN sd.total_students > 500 THEN 250
    WHEN sd.total_students > 100 THEN 100
    ELSE 0
  END as monthly_commission
FROM schools s
INNER JOIN affiliates a ON a.id = s.referred_by_affiliate_id
LEFT JOIN school_details sd ON sd.school_id = s.id
WHERE a.status = 'active';
```

---

## 🛠️ Maintenance

### Add New Affiliate

```sql
INSERT INTO affiliates (name, email, referral_code, status)
VALUES ('Partner Name', 'partner@example.com', 'PARTNER2024', 'active');
```

### Deactivate Affiliate

```sql
UPDATE affiliates 
SET status = 'inactive' 
WHERE referral_code = 'OLD_CODE';
```

### View Affiliate Stats

```sql
SELECT * FROM affiliate_performance
WHERE referral_code = 'TEST2024';
```

---

## ✅ Verification Checklist

- [x] Database migration created (`042_add_affiliate_referral_tracking.sql`)
- [x] Affiliates table with RLS policies
- [x] `referred_by_affiliate_id` column added to schools
- [x] Indexes created for performance
- [x] Trigger for auto-updating affiliate stats
- [x] Frontend captures `ref` from URL query
- [x] Frontend passes `referralCode` to API
- [x] API looks up affiliate by code
- [x] API stores affiliate_id in schools table
- [x] Graceful handling of invalid codes
- [x] Security: RLS blocks client access to affiliates
- [x] Testing guide provided
- [x] Query examples documented

---

## 🚨 Important Notes

1. **Transaction Safety:** The affiliate lookup and school creation are NOT in a transaction. This is intentional - we don't want invalid referral codes to block school registration.

2. **Case Sensitivity:** Referral codes are case-sensitive. Consider adding `.toUpperCase()` normalization if needed.

3. **Service Role Required:** The affiliate lookup requires `supabaseAdmin` (service_role key) - regular client cannot access affiliates table.

4. **NULL is OK:** If no referral code is provided or it's invalid, `referred_by_affiliate_id` will be NULL. This is by design.

5. **Audit Trail:** All registrations log whether a referral was tracked for monitoring purposes.

---

## 📞 Support

For questions or issues:
- Check server logs for affiliate lookup errors
- Verify RLS policies are active
- Ensure service_role key is configured
- Test with sample affiliate codes (TEST2024, EDUSOLVE, SGN2024)
