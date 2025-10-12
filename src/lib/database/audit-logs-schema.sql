-- Audit Logs Table Schema - Simplified Version
-- Create table without any complex dependencies

-- Step 1: Drop and recreate table to ensure clean state
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Step 2: Create audit logs table with simple UUID generation
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  school_id UUID,
  action_details JSONB DEFAULT '{}',
  additional_context JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  risk_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 3: Create basic RLS policies
-- Policy: Users can only see their own audit logs
CREATE POLICY audit_logs_user_policy ON audit_logs
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- Policy: Only system can insert audit logs (service role)
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() IS NULL);

-- Policy: No updates allowed (audit logs are immutable)
CREATE POLICY audit_logs_no_update ON audit_logs
  FOR UPDATE USING (false);

-- Policy: No deletes allowed (audit logs are permanent)  
CREATE POLICY audit_logs_no_delete ON audit_logs
  FOR DELETE USING (false);

-- Function to automatically purge old audit logs (optional - run as cron job)
CREATE OR REPLACE FUNCTION purge_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs 
  WHERE timestamp < NOW() - INTERVAL '1 day' * retention_days;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the purge operation
  INSERT INTO audit_logs (
    event_type,
    action_details,
    success,
    risk_level
  ) VALUES (
    'audit_log_purge',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'retention_days', retention_days
    ),
    true,
    'low'
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit log statistics
CREATE OR REPLACE FUNCTION get_audit_log_stats(
  time_period INTERVAL DEFAULT INTERVAL '24 hours',
  school_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  total_events BIGINT,
  critical_events BIGINT,
  high_risk_events BIGINT,
  medium_risk_events BIGINT,
  low_risk_events BIGINT,
  failed_operations BIGINT,
  unique_users BIGINT,
  unique_ips BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE risk_level = 'critical') as critical_events,
    COUNT(*) FILTER (WHERE risk_level = 'high') as high_risk_events,
    COUNT(*) FILTER (WHERE risk_level = 'medium') as medium_risk_events,
    COUNT(*) FILTER (WHERE risk_level = 'low') as low_risk_events,
    COUNT(*) FILTER (WHERE success = false) as failed_operations,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips
  FROM audit_logs 
  WHERE 
    timestamp >= NOW() - time_period
    AND (school_filter IS NULL OR school_id = school_filter);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious activity patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity(
  lookback_minutes INTEGER DEFAULT 60,
  max_failed_attempts INTEGER DEFAULT 5
)
RETURNS TABLE (
  user_id UUID,
  ip_address INET,
  failed_attempts BIGINT,
  event_types TEXT[],
  first_attempt TIMESTAMPTZ,
  last_attempt TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.user_id,
    al.ip_address,
    COUNT(*) as failed_attempts,
    ARRAY_AGG(DISTINCT al.event_type) as event_types,
    MIN(al.timestamp) as first_attempt,
    MAX(al.timestamp) as last_attempt
  FROM audit_logs al
  WHERE 
    al.timestamp >= NOW() - INTERVAL '1 minute' * lookback_minutes
    AND al.success = false
    AND al.risk_level IN ('high', 'critical')
  GROUP BY al.user_id, al.ip_address
  HAVING COUNT(*) >= max_failed_attempts
  ORDER BY failed_attempts DESC, last_attempt DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for security dashboard
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  event_type,
  risk_level,
  COUNT(*) as event_count,
  COUNT(*) FILTER (WHERE success = false) as failed_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM audit_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp), event_type, risk_level
ORDER BY hour DESC, event_count DESC;

-- Grant permissions
GRANT SELECT ON security_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_log_stats TO authenticated;
GRANT EXECUTE ON FUNCTION detect_suspicious_activity TO authenticated;

-- Only service role can execute purge function
GRANT EXECUTE ON FUNCTION purge_old_audit_logs TO service_role;

-- Add foreign key constraints (conditionally, only if referenced tables exist)
DO $$ 
BEGIN
  -- Add foreign key to auth.users if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    BEGIN
      ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Constraint already exists
    END;
  END IF;
  
  -- Add foreign key to schools if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schools') THEN
    BEGIN
      ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_school_id 
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Constraint already exists
    END;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all security-sensitive operations';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event (e.g., auth_login_failed, wallet_transaction)';
COMMENT ON COLUMN audit_logs.risk_level IS 'Risk assessment: low, medium, high, critical';
COMMENT ON COLUMN audit_logs.action_details IS 'JSON object containing specific details about the action';
COMMENT ON COLUMN audit_logs.additional_context IS 'Additional context information for the event';
COMMENT ON FUNCTION get_audit_log_stats IS 'Get audit log statistics for a given time period';
COMMENT ON FUNCTION detect_suspicious_activity IS 'Detect patterns of suspicious activity based on failed attempts';
COMMENT ON FUNCTION purge_old_audit_logs IS 'Purge audit logs older than specified retention period';
