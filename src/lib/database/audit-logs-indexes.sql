-- Audit Logs Indexes
-- Run this AFTER audit-logs-schema.sql has been successfully executed

-- Step 1: Verify audit_logs table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    RAISE EXCEPTION 'audit_logs table does not exist. Run audit-logs-schema.sql first.';
  END IF;
END $$;

-- Step 2: Create basic indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON audit_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_id ON audit_logs(school_id);

-- Step 3: Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_timestamp ON audit_logs(school_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_timestamp ON audit_logs(risk_level, timestamp DESC);

-- Step 4: Create partial indexes for monitoring
CREATE INDEX IF NOT EXISTS idx_audit_logs_failed_operations 
ON audit_logs(timestamp DESC) WHERE success = false;

CREATE INDEX IF NOT EXISTS idx_audit_logs_critical_events 
ON audit_logs(timestamp DESC) WHERE risk_level = 'critical';

CREATE INDEX IF NOT EXISTS idx_audit_logs_high_risk_events 
ON audit_logs(timestamp DESC) WHERE risk_level IN ('high', 'critical');

-- Step 5: Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Success message
SELECT 'audit_logs indexes created successfully' as status;
