-- =====================================================
-- Gemini API Usage Tracking - Database Schema
-- CatalystWells Admin Dashboard
-- =====================================================

-- Drop existing types if recreating
DROP TYPE IF EXISTS gemini_model CASCADE;
DROP TYPE IF EXISTS key_status CASCADE;

-- Create custom types
CREATE TYPE gemini_model AS ENUM (
  'gemini_3_pro',
  'gemini_2_5_pro'
);

CREATE TYPE key_status AS ENUM (
  'active',
  'rotated',
  'disabled'
);

-- =====================================================
-- Main Table: Per-Key, Per-Model Usage Tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS gemini_api_key_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Key identification
  api_key TEXT NOT NULL,
  model gemini_model NOT NULL,
  status key_status DEFAULT 'active',
  
  -- Rate limits (configured per key)
  rpm_limit INT,           -- Requests per minute (null = unlimited)
  rpd_limit INT,           -- Requests per day (null = unlimited)
  tpm_limit INT NOT NULL,  -- Tokens per minute (always enforced)
  
  -- Current usage counters
  rpm_used INT DEFAULT 0 NOT NULL,
  rpd_used INT DEFAULT 0 NOT NULL,
  tpm_used INT DEFAULT 0 NOT NULL,
  total_requests BIGINT DEFAULT 0 NOT NULL,
  total_tokens BIGINT DEFAULT 0 NOT NULL,
  
  -- Tracking windows
  minute_window_start TIMESTAMPTZ DEFAULT NOW(),
  day_window_start TIMESTAMPTZ DEFAULT NOW(),
  
  -- Rotation metadata
  auto_rotated BOOLEAN DEFAULT FALSE,
  rotation_count INT DEFAULT 0,
  last_rotated_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(api_key, model),
  CHECK (rpm_used >= 0),
  CHECK (rpd_used >= 0),
  CHECK (tpm_used >= 0),
  CHECK (total_requests >= 0),
  CHECK (total_tokens >= 0)
);

-- =====================================================
-- Secondary Table: Aggregated Model Usage Summary
-- =====================================================

CREATE TABLE IF NOT EXISTS gemini_model_usage_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  model gemini_model NOT NULL UNIQUE,
  
  -- Aggregated usage across all keys
  total_rpm_used INT DEFAULT 0 NOT NULL,
  total_rpd_used INT DEFAULT 0 NOT NULL,
  total_tpm_used INT DEFAULT 0 NOT NULL,
  total_requests BIGINT DEFAULT 0 NOT NULL,
  total_tokens BIGINT DEFAULT 0 NOT NULL,
  
  -- Active key count
  active_keys INT DEFAULT 0 NOT NULL,
  rotated_keys INT DEFAULT 0 NOT NULL,
  
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (total_rpm_used >= 0),
  CHECK (total_rpd_used >= 0),
  CHECK (total_tpm_used >= 0),
  CHECK (total_requests >= 0),
  CHECK (total_tokens >= 0)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Fast lookup by key and model
CREATE INDEX IF NOT EXISTS idx_key_model ON gemini_api_key_usage(api_key, model);

-- Fast lookup of active keys only
CREATE INDEX IF NOT EXISTS idx_status_model ON gemini_api_key_usage(status, model) WHERE status = 'active';

-- Window reset queries
CREATE INDEX IF NOT EXISTS idx_minute_window ON gemini_api_key_usage(minute_window_start);
CREATE INDEX IF NOT EXISTS idx_day_window ON gemini_api_key_usage(day_window_start);

-- Model lookup for aggregation
CREATE INDEX IF NOT EXISTS idx_model ON gemini_api_key_usage(model);

-- =====================================================
-- Auto-update timestamp trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gemini_api_key_usage_updated_at
  BEFORE UPDATE ON gemini_api_key_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Function: Aggregate model usage from all keys
-- =====================================================

CREATE OR REPLACE FUNCTION aggregate_model_usage()
RETURNS void AS $$
BEGIN
  -- Update or insert aggregated stats for each model
  INSERT INTO gemini_model_usage_summary (
    model,
    total_rpm_used,
    total_rpd_used,
    total_tpm_used,
    total_requests,
    total_tokens,
    active_keys,
    rotated_keys,
    calculated_at
  )
  SELECT 
    model,
    SUM(rpm_used) AS total_rpm_used,
    SUM(rpd_used) AS total_rpd_used,
    SUM(tpm_used) AS total_tpm_used,
    SUM(total_requests) AS total_requests,
    SUM(total_tokens) AS total_tokens,
    COUNT(*) FILTER (WHERE status = 'active') AS active_keys,
    COUNT(*) FILTER (WHERE status = 'rotated') AS rotated_keys,
    NOW() AS calculated_at
  FROM gemini_api_key_usage
  GROUP BY model
  ON CONFLICT (model) 
  DO UPDATE SET
    total_rpm_used = EXCLUDED.total_rpm_used,
    total_rpd_used = EXCLUDED.total_rpd_used,
    total_tpm_used = EXCLUDED.total_tpm_used,
    total_requests = EXCLUDED.total_requests,
    total_tokens = EXCLUDED.total_tokens,
    active_keys = EXCLUDED.active_keys,
    rotated_keys = EXCLUDED.rotated_keys,
    calculated_at = EXCLUDED.calculated_at;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Reset minute windows
-- =====================================================

CREATE OR REPLACE FUNCTION reset_minute_windows()
RETURNS void AS $$
BEGIN
  UPDATE gemini_api_key_usage
  SET 
    rpm_used = 0,
    tpm_used = 0,
    minute_window_start = NOW()
  WHERE minute_window_start < NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Reset day windows
-- =====================================================

CREATE OR REPLACE FUNCTION reset_day_windows()
RETURNS void AS $$
BEGIN
  UPDATE gemini_api_key_usage
  SET 
    rpd_used = 0,
    day_window_start = NOW()
  WHERE day_window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE gemini_api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE gemini_model_usage_summary ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything (Edge Functions use service role)
-- Since this is a standalone governance service accessed only via Edge Functions,
-- we use a simple policy that allows authenticated access
CREATE POLICY "Allow authenticated access" ON gemini_api_key_usage
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated access" ON gemini_model_usage_summary
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note: Edge Functions using service_role key bypass RLS entirely
-- These policies are for any future direct database access

-- =====================================================
-- Initial Data: Insert default model summaries
-- =====================================================

INSERT INTO gemini_model_usage_summary (model, calculated_at)
VALUES 
  ('gemini_3_pro', NOW()),
  ('gemini_2_5_pro', NOW())
ON CONFLICT (model) DO NOTHING;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE gemini_api_key_usage IS 'Tracks individual API key usage with rate limiting for Gemini models';
COMMENT ON TABLE gemini_model_usage_summary IS 'Aggregated usage statistics per Gemini model across all keys';

COMMENT ON COLUMN gemini_api_key_usage.rpm_limit IS 'Requests per minute limit (NULL = unlimited)';
COMMENT ON COLUMN gemini_api_key_usage.rpd_limit IS 'Requests per day limit (NULL = unlimited)';
COMMENT ON COLUMN gemini_api_key_usage.tpm_limit IS 'Tokens per minute limit (always enforced)';
