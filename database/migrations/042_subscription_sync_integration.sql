-- ============================================
-- SUBSCRIPTION SYNC INTEGRATION - MAIN APP
-- Adds tables for secure payment sync from landing page
-- Run Date: 2025-11-01
-- ============================================

-- ============================================
-- STEP 1: ADD SUBSCRIPTION FIELDS TO SCHOOLS TABLE
-- ============================================

-- Add subscription-related columns if they don't exist
DO $$ 
BEGIN
  -- Subscription Information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'subscription_status') THEN
    ALTER TABLE schools ADD COLUMN subscription_status VARCHAR(20) CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired', 'pending'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'subscription_plan') THEN
    ALTER TABLE schools ADD COLUMN subscription_plan VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'student_limit') THEN
    ALTER TABLE schools ADD COLUMN student_limit INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'trial_end_date') THEN
    ALTER TABLE schools ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'subscription_start_date') THEN
    ALTER TABLE schools ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'subscription_end_date') THEN
    ALTER TABLE schools ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'next_billing_date') THEN
    ALTER TABLE schools ADD COLUMN next_billing_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'created_from') THEN
    ALTER TABLE schools ADD COLUMN created_from VARCHAR(50) DEFAULT 'direct';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'razorpay_subscription_id') THEN
    ALTER TABLE schools ADD COLUMN razorpay_subscription_id VARCHAR(255);
  END IF;
END $$;

-- ============================================
-- STEP 2: CREATE SUBSCRIPTION SYNC TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_sync (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  landing_page_subscription_id UUID NOT NULL,
  
  -- Full subscription data from landing page (encrypted backup)
  data JSONB NOT NULL,
  
  -- Sync metadata
  sync_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_source VARCHAR(50) DEFAULT 'landing_page',
  sync_status VARCHAR(20) DEFAULT 'completed' CHECK (sync_status IN ('completed', 'partial', 'failed')),
  
  -- Payment information from landing page
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  amount_paid DECIMAL(10, 2),
  
  CONSTRAINT unique_landing_subscription UNIQUE (landing_page_subscription_id)
);

-- ============================================
-- STEP 3: CREATE AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Event Information
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  service VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  
  -- Actor
  user_id UUID,
  school_id UUID,
  
  -- Request Information
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id UUID,
  
  -- Data
  payload_hash VARCHAR(64),
  changes JSONB,
  
  -- Result
  success BOOLEAN NOT NULL,
  error TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Immutable timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$ 
BEGIN
  -- Add all columns that might be missing from previous audit_logs versions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'service') THEN
    ALTER TABLE audit_logs ADD COLUMN service VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'metadata') THEN
    ALTER TABLE audit_logs ADD COLUMN metadata JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'school_id') THEN
    ALTER TABLE audit_logs ADD COLUMN school_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'success') THEN
    ALTER TABLE audit_logs ADD COLUMN success BOOLEAN NOT NULL DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'error') THEN
    ALTER TABLE audit_logs ADD COLUMN error TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'request_id') THEN
    ALTER TABLE audit_logs ADD COLUMN request_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'payload_hash') THEN
    ALTER TABLE audit_logs ADD COLUMN payload_hash VARCHAR(64);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'changes') THEN
    ALTER TABLE audit_logs ADD COLUMN changes JSONB;
  END IF;
END $$;

-- ============================================
-- STEP 4: CREATE SECURITY LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Source
  ip_address VARCHAR(45),
  user_agent TEXT,
  service VARCHAR(50),
  
  -- Details
  description TEXT,
  details JSONB,
  
  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_logs' AND column_name = 'service') THEN
    ALTER TABLE security_logs ADD COLUMN service VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'security_logs' AND column_name = 'resolution_notes') THEN
    ALTER TABLE security_logs ADD COLUMN resolution_notes TEXT;
  END IF;
END $$;

-- ============================================
-- STEP 5: CREATE SYNC RETRY QUEUE TABLE
-- ============================================

-- For tracking failed syncs and retries
CREATE TABLE IF NOT EXISTS sync_retry_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_subscription_id UUID NOT NULL,
  encrypted_data TEXT NOT NULL,
  
  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  last_error TEXT,
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 6: CREATE INDEXES
-- ============================================

-- Schools subscription indexes
CREATE INDEX IF NOT EXISTS idx_schools_subscription_status ON schools(subscription_status);
CREATE INDEX IF NOT EXISTS idx_schools_razorpay_id ON schools(razorpay_subscription_id);
CREATE INDEX IF NOT EXISTS idx_schools_trial_end ON schools(trial_end_date) WHERE trial_end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schools_next_billing ON schools(next_billing_date) WHERE next_billing_date IS NOT NULL;

-- Subscription sync indexes
CREATE INDEX IF NOT EXISTS idx_subscription_sync_school_id ON subscription_sync(school_id);
CREATE INDEX IF NOT EXISTS idx_subscription_sync_landing_id ON subscription_sync(landing_page_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_sync_timestamp ON subscription_sync(sync_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_sync_status ON subscription_sync(sync_status);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_service ON audit_logs(service);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_service_action ON audit_logs(service, action);

-- Create school_id index only if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'school_id') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_school_id ON audit_logs(school_id);
  END IF;
END $$;

-- Security logs indexes
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_resolved ON security_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip_address);

-- Sync retry queue indexes
CREATE INDEX IF NOT EXISTS idx_sync_retry_status ON sync_retry_queue(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_sync_retry_landing_id ON sync_retry_queue(landing_page_subscription_id);
CREATE INDEX IF NOT EXISTS idx_sync_retry_created ON sync_retry_queue(created_at DESC);

-- ============================================
-- STEP 7: DROP EXISTING VIEWS
-- ============================================
-- NOTE: Run 042a_add_profiles_school_id.sql BEFORE this migration
-- It ensures profiles.school_id exists

-- Drop existing views first (will recreate later with new logic)
DROP VIEW IF EXISTS active_subscriptions CASCADE;
DROP VIEW IF EXISTS trial_schools_ending_soon CASCADE;
DROP VIEW IF EXISTS failed_syncs CASCADE;
DROP VIEW IF EXISTS sync_audit_summary CASCADE;
DROP VIEW IF EXISTS recent_security_events CASCADE;

-- ============================================
-- STEP 8: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE subscription_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_retry_queue ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 9: CREATE RLS POLICIES
-- ============================================

-- Subscription sync policies (service role only - sync endpoint uses service role)
DROP POLICY IF EXISTS "Service role full access to subscription sync" ON subscription_sync;
CREATE POLICY "Service role full access to subscription sync" 
  ON subscription_sync FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Note: Authenticated users (admins) can view their subscription via API endpoints
-- that use service role, not direct database access. This prevents RLS complexity.

-- Audit logs policies (service role only, append-only)
DROP POLICY IF EXISTS "Service role read access to audit logs" ON audit_logs;
CREATE POLICY "Service role read access to audit logs" 
  ON audit_logs FOR SELECT TO service_role USING (true);

DROP POLICY IF EXISTS "Service role insert access to audit logs" ON audit_logs;
CREATE POLICY "Service role insert access to audit logs" 
  ON audit_logs FOR INSERT TO service_role WITH CHECK (true);

-- Security logs policies (service role only)
DROP POLICY IF EXISTS "Service role full access to security logs" ON security_logs;
CREATE POLICY "Service role full access to security logs" 
  ON security_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Sync retry queue policies (service role only)
DROP POLICY IF EXISTS "Service role full access to sync retry queue" ON sync_retry_queue;
CREATE POLICY "Service role full access to sync retry queue" 
  ON sync_retry_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- STEP 10: CREATE TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sync retry queue
DROP TRIGGER IF EXISTS update_sync_retry_queue_updated_at ON sync_retry_queue;
CREATE TRIGGER update_sync_retry_queue_updated_at
  BEFORE UPDATE ON sync_retry_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 11: CREATE VIEWS (NON-DEPENDENT)
-- ============================================
-- Note: Views that depend on profiles.school_id are in 042b_create_subscription_views.sql

-- Recent security events view
CREATE OR REPLACE VIEW recent_security_events AS
SELECT 
  event_type,
  severity,
  ip_address,
  service,
  description,
  resolved,
  created_at
FROM security_logs
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC, severity DESC
LIMIT 100;

-- Failed syncs view (no dependency on profiles.school_id)
CREATE OR REPLACE VIEW failed_syncs AS
SELECT 
  sq.id,
  sq.landing_page_subscription_id,
  sq.retry_count,
  sq.max_retries,
  sq.last_error,
  sq.next_retry_at,
  sq.created_at,
  ss.school_id,
  s.name as school_name,
  s.email as school_email
FROM sync_retry_queue sq
LEFT JOIN subscription_sync ss ON sq.landing_page_subscription_id = ss.landing_page_subscription_id
LEFT JOIN schools s ON ss.school_id = s.id
WHERE sq.status IN ('pending', 'failed') 
ORDER BY sq.next_retry_at ASC NULLS LAST;

-- Sync audit summary view
CREATE OR REPLACE VIEW sync_audit_summary AS
SELECT 
  DATE(sync_timestamp) as sync_date,
  sync_source,
  sync_status,
  COUNT(*) as total_syncs,
  COUNT(DISTINCT school_id) as unique_schools
FROM subscription_sync
GROUP BY DATE(sync_timestamp), sync_source, sync_status
ORDER BY sync_date DESC;

-- ============================================
-- STEP 12: GRANT PERMISSIONS (CONDITIONAL)
-- ============================================

-- Grant permissions on views that don't depend on profiles.school_id
GRANT SELECT ON recent_security_events TO service_role;
GRANT SELECT ON failed_syncs TO service_role;
GRANT SELECT ON sync_audit_summary TO service_role;

-- Note: active_subscriptions and trial_schools_ending_soon permissions granted in 042b

-- ============================================
-- STEP 13: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to calculate subscription expiry (no dependency on profiles.school_id)
CREATE OR REPLACE FUNCTION get_subscription_days_remaining(school_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  days_left INTEGER;
BEGIN
  SELECT 
    CASE 
      WHEN subscription_status = 'trial' AND trial_end_date IS NOT NULL THEN
        EXTRACT(DAY FROM (trial_end_date - NOW()))::INTEGER
      WHEN subscription_status = 'active' AND subscription_end_date IS NOT NULL THEN
        EXTRACT(DAY FROM (subscription_end_date - NOW()))::INTEGER
      ELSE
        NULL
    END INTO days_left
  FROM schools
  WHERE id = school_id_param;
  
  RETURN days_left;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: check_student_limit function is in 042b_create_subscription_views.sql

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify tables created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('subscription_sync', 'audit_logs', 'security_logs', 'sync_retry_queue');

-- Verify views created
-- SELECT table_name FROM information_schema.views 
-- WHERE table_schema = 'public'
-- AND table_name IN ('active_subscriptions', 'trial_schools_ending_soon', 'recent_security_events', 'failed_syncs', 'sync_audit_summary');

-- Verify RLS enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('subscription_sync', 'audit_logs', 'security_logs', 'sync_retry_queue');

-- ============================================
-- MIGRATION COMPLETE! ✅
-- ============================================
-- Next steps:
-- 1. Install jsonwebtoken package: npm install jsonwebtoken @types/jsonwebtoken
-- 2. Create lib/security.ts with 7-layer security functions
-- 3. Create API endpoint: app/api/sync/subscription/route.ts
-- 4. Configure environment variables in .env.local
-- 5. Test the sync flow
-- ============================================

COMMENT ON TABLE subscription_sync IS 'Stores subscription data synced from landing page with full audit trail';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all critical operations including subscription syncs';
COMMENT ON TABLE security_logs IS 'Security event tracking for failed authentication, suspicious activity, etc.';
COMMENT ON TABLE sync_retry_queue IS 'Retry queue for failed subscription syncs with exponential backoff';
