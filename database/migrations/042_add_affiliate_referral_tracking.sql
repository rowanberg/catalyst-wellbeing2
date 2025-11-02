-- =============================================
-- MIGRATION 042: Affiliate Referral Tracking System
-- =============================================
-- Purpose: Enable school registration to track which affiliate referred them
-- This allows commission tracking and affiliate performance monitoring

-- =============================================
-- 1. CREATE AFFILIATES TABLE
-- =============================================
-- This table stores affiliate partners who can refer schools

CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: link to user account
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., "AFF1234", "PARTNER2024"
    
    -- Contact & Payment Info
    phone VARCHAR(20),
    payment_method VARCHAR(50), -- 'bank_transfer', 'paypal', etc.
    payment_details JSONB, -- Flexible storage for payment info
    
    -- Tracking
    total_referrals INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    total_commission_earned NUMERIC(10, 2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. ADD REFERRED_BY_AFFILIATE_ID TO SCHOOLS
-- =============================================
-- This column links a school to the affiliate who referred them

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'schools' 
        AND column_name = 'referred_by_affiliate_id'
    ) THEN
        ALTER TABLE public.schools 
        ADD COLUMN referred_by_affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN public.schools.referred_by_affiliate_id IS 
        'The affiliate who referred this school. Used for commission tracking.';
    END IF;
END $$;

-- =============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Index on referral_code for fast lookups during registration
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code 
ON public.affiliates(referral_code);

-- Index on email for affiliate management
CREATE INDEX IF NOT EXISTS idx_affiliates_email 
ON public.affiliates(email);

-- Index on status for filtering active affiliates
CREATE INDEX IF NOT EXISTS idx_affiliates_status 
ON public.affiliates(status);

-- Index on schools.referred_by_affiliate_id for commission queries
CREATE INDEX IF NOT EXISTS idx_schools_referred_by_affiliate 
ON public.schools(referred_by_affiliate_id);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on affiliates table
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all affiliates
CREATE POLICY "Admins can view all affiliates"
ON public.affiliates
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Policy: Service role can do everything (for Edge Functions)
CREATE POLICY "Service role has full access to affiliates"
ON public.affiliates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Block all client-side access for security
-- (Affiliates should only be accessed via service_role in Edge Functions)
CREATE POLICY "Block direct client access to affiliates"
ON public.affiliates
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- =============================================
-- 5. HELPER FUNCTION: UPDATE AFFILIATE STATS
-- =============================================
-- This function updates affiliate statistics when schools are created/updated

CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new school is referred by an affiliate
    IF (TG_OP = 'INSERT' AND NEW.referred_by_affiliate_id IS NOT NULL) THEN
        UPDATE public.affiliates
        SET 
            total_referrals = total_referrals + 1,
            active_referrals = active_referrals + 1,
            updated_at = NOW()
        WHERE id = NEW.referred_by_affiliate_id;
    END IF;
    
    -- When a school's affiliate reference is updated
    IF (TG_OP = 'UPDATE' AND OLD.referred_by_affiliate_id IS DISTINCT FROM NEW.referred_by_affiliate_id) THEN
        -- Decrement old affiliate
        IF (OLD.referred_by_affiliate_id IS NOT NULL) THEN
            UPDATE public.affiliates
            SET 
                active_referrals = GREATEST(0, active_referrals - 1),
                updated_at = NOW()
            WHERE id = OLD.referred_by_affiliate_id;
        END IF;
        
        -- Increment new affiliate
        IF (NEW.referred_by_affiliate_id IS NOT NULL) THEN
            UPDATE public.affiliates
            SET 
                total_referrals = total_referrals + 1,
                active_referrals = active_referrals + 1,
                updated_at = NOW()
            WHERE id = NEW.referred_by_affiliate_id;
        END IF;
    END IF;
    
    -- When a school is deleted
    IF (TG_OP = 'DELETE' AND OLD.referred_by_affiliate_id IS NOT NULL) THEN
        UPDATE public.affiliates
        SET 
            active_referrals = GREATEST(0, active_referrals - 1),
            updated_at = NOW()
        WHERE id = OLD.referred_by_affiliate_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. CREATE TRIGGER
-- =============================================

DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON public.schools;

CREATE TRIGGER trigger_update_affiliate_stats
    AFTER INSERT OR UPDATE OF referred_by_affiliate_id OR DELETE
    ON public.schools
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_stats();

-- =============================================
-- 7. CREATE VIEW FOR AFFILIATE REPORTING
-- =============================================

CREATE OR REPLACE VIEW public.affiliate_performance AS
SELECT 
    a.id,
    a.name,
    a.email,
    a.referral_code,
    a.status,
    a.total_referrals,
    a.active_referrals,
    a.total_commission_earned,
    COUNT(s.id) as verified_schools_count,
    a.created_at,
    a.updated_at
FROM public.affiliates a
LEFT JOIN public.schools s ON s.referred_by_affiliate_id = a.id
GROUP BY a.id, a.name, a.email, a.referral_code, a.status, 
         a.total_referrals, a.active_referrals, a.total_commission_earned,
         a.created_at, a.updated_at;

-- =============================================
-- 8. SAMPLE DATA (Optional - Remove in Production)
-- =============================================

-- Insert a test affiliate for development
INSERT INTO public.affiliates (name, email, referral_code, status)
VALUES 
    ('Test Affiliate Partner', 'affiliate@example.com', 'TEST2024', 'active'),
    ('Education Solutions Inc', 'partners@edusolve.com', 'EDUSOLVE', 'active'),
    ('School Growth Network', 'contact@schoolgrowth.com', 'SGN2024', 'active')
ON CONFLICT (referral_code) DO NOTHING;

-- =============================================
-- NOTES
-- =============================================
-- 1. The affiliates table is protected by RLS - only service_role can access
-- 2. All referral lookups must happen server-side via Edge Functions
-- 3. The trigger automatically updates affiliate statistics
-- 4. referred_by_affiliate_id is nullable - schools can register without a referral
-- 5. Use SET NULL on delete to preserve historical data if affiliate is removed
-- 6. Commission tracking can be built on top of this schema

-- =============================================
-- ROLLBACK (if needed)
-- =============================================
-- DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON public.schools;
-- DROP FUNCTION IF EXISTS update_affiliate_stats();
-- DROP VIEW IF EXISTS public.affiliate_performance;
-- ALTER TABLE public.schools DROP COLUMN IF EXISTS referred_by_affiliate_id;
-- DROP TABLE IF EXISTS public.affiliates CASCADE;
