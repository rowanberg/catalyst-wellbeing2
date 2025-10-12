-- DEBUG: Step-by-step audit logs table creation
-- This file will help us identify exactly where the failure occurs

-- Step 1: Test extension creation
DO $$ 
BEGIN
  RAISE NOTICE 'Step 1: Creating uuid-ossp extension...';
END $$;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ 
BEGIN
  RAISE NOTICE 'Step 1 Complete: uuid-ossp extension created';
END $$;

-- Step 2: Drop existing table if it exists (for clean testing)
DO $$ 
BEGIN
  RAISE NOTICE 'Step 2: Dropping existing audit_logs table if it exists...';
END $$;

DROP TABLE IF EXISTS audit_logs;

DO $$ 
BEGIN
  RAISE NOTICE 'Step 2 Complete: Existing table dropped';
END $$;

-- Step 3: Create the table
DO $$ 
BEGIN
  RAISE NOTICE 'Step 3: Creating audit_logs table...';
END $$;

CREATE TABLE audit_logs (
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

DO $$ 
BEGIN
  RAISE NOTICE 'Step 3 Complete: audit_logs table created';
END $$;

-- Step 4: Verify table exists and check columns
DO $$ 
DECLARE
  table_exists INTEGER;
  column_count INTEGER;
BEGIN
  RAISE NOTICE 'Step 4: Verifying table creation...';
  
  SELECT COUNT(*) INTO table_exists 
  FROM information_schema.tables 
  WHERE table_name = 'audit_logs';
  
  RAISE NOTICE 'Table exists count: %', table_exists;
  
  IF table_exists > 0 THEN
    SELECT COUNT(*) INTO column_count 
    FROM information_schema.columns 
    WHERE table_name = 'audit_logs';
    
    RAISE NOTICE 'Column count: %', column_count;
    
    -- Check if event_type column exists specifically
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'audit_logs' AND column_name = 'event_type') THEN
      RAISE NOTICE 'SUCCESS: event_type column exists';
    ELSE
      RAISE NOTICE 'ERROR: event_type column does NOT exist';
    END IF;
  ELSE
    RAISE NOTICE 'ERROR: audit_logs table does NOT exist';
  END IF;
END $$;

-- Step 5: Only create one index if table verification passes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'event_type') THEN
    
    RAISE NOTICE 'Step 5: Creating event_type index...';
    CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
    RAISE NOTICE 'Step 5 Complete: Index created successfully';
  ELSE
    RAISE NOTICE 'Step 5 SKIPPED: Table or column verification failed';
  END IF;
END $$;

-- Final verification
SELECT 'FINAL CHECK: audit_logs table with event_type column' as status,
       COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_name = 'audit_logs';

SELECT 'FINAL CHECK: event_type column' as status,
       COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'audit_logs' AND column_name = 'event_type';
