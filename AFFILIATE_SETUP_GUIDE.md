# Affiliate System Setup Guide

## ✅ Step 1: Check if Affiliates Table Exists

Run this in your Supabase SQL Editor:

```sql
-- Check if affiliates table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliates'
);

-- Check if schools has the referral column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'schools' 
AND column_name = 'referred_by_affiliate_id';
```

---

## 🔧 Step 2: Run Migration (If Tables Don't Exist)

**Option A: Run the full migration file**

Go to: `database/migrations/042_add_affiliate_referral_tracking.sql`

Copy the entire contents and paste into **Supabase SQL Editor**, then click **Run**.

**Option B: Quick Setup (Manual)**

```sql
-- 1. Create affiliates table
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    payment_method VARCHAR(50),
    payment_details JSONB,
    total_referrals INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    total_commission_earned NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add column to schools table (only if doesn't exist)
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID 
REFERENCES public.affiliates(id) ON DELETE SET NULL;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code 
ON public.affiliates(referral_code);

CREATE INDEX IF NOT EXISTS idx_affiliates_status 
ON public.affiliates(status);

CREATE INDEX IF NOT EXISTS idx_schools_referred_by_affiliate 
ON public.schools(referred_by_affiliate_id);

-- 4. Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Service role has full access to affiliates"
ON public.affiliates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

---

## 📊 Step 3: Insert Sample Affiliate Data

```sql
-- Insert test affiliates
INSERT INTO public.affiliates (name, email, referral_code, status)
VALUES 
    ('Test Affiliate Partner', 'affiliate@example.com', 'TEST2024', 'active'),
    ('Education Solutions Inc', 'partners@edusolve.com', 'EDUSOLVE', 'active'),
    ('School Growth Network', 'contact@schoolgrowth.com', 'SGN2024', 'active'),
    ('Partner Demo', 'demo@partner.com', 'DEMO123', 'active')
ON CONFLICT (referral_code) DO NOTHING;
```

---

## 🧪 Step 4: Verify Setup

```sql
-- Check affiliates exist
SELECT id, name, referral_code, status FROM public.affiliates;

-- Test lookup (simulate registration API)
SELECT id, name, referral_code 
FROM public.affiliates 
WHERE referral_code = 'TEST2024' 
AND status = 'active';
```

**Expected Result:**
```
id                                    | name                    | referral_code | status
--------------------------------------+-------------------------+---------------+--------
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | Test Affiliate Partner  | TEST2024      | active
```

---

## 🔗 Step 5: Test Registration URL

Once data is inserted, test with:

```
http://10.80.234.242:3000/register/wizard?ref=TEST2024
```

**What Should Happen:**
1. Frontend captures `ref=TEST2024` from URL
2. Backend looks up affiliate by `referral_code = 'TEST2024'`
3. If found and `status = 'active'`, stores `affiliate.id` in `schools.referred_by_affiliate_id`
4. If not found or inactive, registration continues without affiliate tracking (no error)

---

## 🎯 Step 6: Create Your Own Affiliates

```sql
INSERT INTO public.affiliates (
    name, 
    email, 
    referral_code, 
    phone,
    status,
    notes
)
VALUES (
    'Your Affiliate Name',
    'contact@yourpartner.com',
    'CUSTOM_CODE',  -- Use this in URLs: ?ref=CUSTOM_CODE
    '+1234567890',
    'active',
    'Optional notes about this affiliate'
);
```

---

## 📈 Step 7: Track Affiliate Performance

```sql
-- Get affiliate referral stats
SELECT 
    a.name,
    a.referral_code,
    a.total_referrals,
    a.active_referrals,
    COUNT(s.id) as actual_schools_count,
    array_agg(s.name) as referred_schools
FROM public.affiliates a
LEFT JOIN public.schools s ON s.referred_by_affiliate_id = a.id
WHERE a.status = 'active'
GROUP BY a.id, a.name, a.referral_code, a.total_referrals, a.active_referrals
ORDER BY a.total_referrals DESC;
```

---

## 🚨 Troubleshooting

### Error: "relation 'affiliates' does not exist"
**Solution:** Run Step 2 - the table hasn't been created yet

### Error: "column 'referred_by_affiliate_id' does not exist"
**Solution:** Run this:
```sql
ALTER TABLE public.schools 
ADD COLUMN referred_by_affiliate_id UUID 
REFERENCES public.affiliates(id) ON DELETE SET NULL;
```

### Affiliate code not working
**Check:**
1. Code exists: `SELECT * FROM affiliates WHERE referral_code = 'YOUR_CODE';`
2. Status is active: `UPDATE affiliates SET status = 'active' WHERE referral_code = 'YOUR_CODE';`
3. Check API logs for: "📌 Referral code captured:" and "✅ Affiliate found:"

### Registration works but no affiliate tracking
**This is normal** - the system is designed to allow registration even if:
- No `ref` parameter in URL
- Invalid referral code
- Affiliate is inactive
- Column doesn't exist in database

The fix in `/api/register-school/route.ts` makes it optional.

---

## 🔐 Security Notes

1. **RLS Enabled:** Affiliates table is protected by Row Level Security
2. **Service Role Only:** Only backend with `service_role` key can access
3. **No Client Access:** Frontend cannot directly query affiliates table
4. **Lookup Server-Side:** All referral code lookups happen in API routes

---

## 📝 Summary

**Required Tables:**
- ✅ `public.affiliates` - stores affiliate information
- ✅ `public.schools.referred_by_affiliate_id` - links schools to affiliates

**Sample Referral Codes (After Setup):**
- `TEST2024` - Test Affiliate Partner
- `EDUSOLVE` - Education Solutions Inc
- `SGN2024` - School Growth Network
- `DEMO123` - Partner Demo

**Test URL:**
```
http://10.80.234.242:3000/register/wizard?ref=TEST2024
```

**API Endpoint:**
`/api/register-school` (already updated to handle optional affiliate tracking)

**Migration File:**
`database/migrations/042_add_affiliate_referral_tracking.sql`
