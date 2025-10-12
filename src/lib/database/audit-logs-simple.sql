-- Simple Audit Logs Table Creation (for testing)
-- This is a minimal version to test table creation

-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop table if exists (for testing)
-- DROP TABLE IF EXISTS audit_logs;

-- Create audit logs table with minimal dependencies
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Test if table was created successfully
SELECT 'audit_logs table created successfully' as status;

-- Only create basic indexes if table creation succeeded
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Test final result
SELECT COUNT(*) as table_exists FROM information_schema.tables WHERE table_name = 'audit_logs';
