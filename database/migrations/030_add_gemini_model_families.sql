-- ============================================================================
-- Multi-Model AI Key Management System
-- ============================================================================
-- Creates tables for managing 100+ API keys across multiple Gemini model families
-- with per-key tracking of RPM, RPD, and TPM limits
-- ============================================================================

-- ============================================================================
-- 1. Gemini 2.5 Flash Lite Keys (High Volume)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gemini_25_flash_lite_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  encrypted_api_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'rate_limited')),
  
  -- Usage limits (per key)
  rpm_limit INTEGER NOT NULL DEFAULT 15,
  rpd_limit INTEGER NOT NULL DEFAULT 1000,
  tpm_limit INTEGER NOT NULL DEFAULT 250000,
  
  -- Current usage counters
  current_rpm INTEGER NOT NULL DEFAULT 0,
  current_rpd INTEGER NOT NULL DEFAULT 0,
  current_tpm INTEGER NOT NULL DEFAULT 0,
  
  -- Timing for resets
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_rpm_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_rpd_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Cooldown management
  is_in_cooldown BOOLEAN NOT NULL DEFAULT FALSE,
  cooldown_expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  
  CONSTRAINT gemini_25_flash_lite_keys_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Indexes for efficient key selection
CREATE INDEX IF NOT EXISTS idx_25_flash_lite_active 
  ON public.gemini_25_flash_lite_keys(status, last_used_at)
  WHERE status = 'active' AND is_in_cooldown = FALSE;

CREATE INDEX IF NOT EXISTS idx_25_flash_lite_usage 
  ON public.gemini_25_flash_lite_keys(current_rpm, current_rpd, current_tpm)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_25_flash_lite_cooldown 
  ON public.gemini_25_flash_lite_keys(is_in_cooldown, cooldown_expires_at)
  WHERE is_in_cooldown = TRUE;

-- ============================================================================
-- 2. Gemini 2.5 Flash Keys (Standard)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gemini_25_flash_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  encrypted_api_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'rate_limited')),
  
  -- Usage limits (per key)
  rpm_limit INTEGER NOT NULL DEFAULT 10,
  rpd_limit INTEGER NOT NULL DEFAULT 250,
  tpm_limit INTEGER NOT NULL DEFAULT 250000,
  
  -- Current usage counters
  current_rpm INTEGER NOT NULL DEFAULT 0,
  current_rpd INTEGER NOT NULL DEFAULT 0,
  current_tpm INTEGER NOT NULL DEFAULT 0,
  
  -- Timing for resets
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_rpm_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_rpd_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Cooldown management
  is_in_cooldown BOOLEAN NOT NULL DEFAULT FALSE,
  cooldown_expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  
  CONSTRAINT gemini_25_flash_keys_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Indexes for efficient key selection
CREATE INDEX IF NOT EXISTS idx_25_flash_active 
  ON public.gemini_25_flash_keys(status, last_used_at)
  WHERE status = 'active' AND is_in_cooldown = FALSE;

CREATE INDEX IF NOT EXISTS idx_25_flash_usage 
  ON public.gemini_25_flash_keys(current_rpm, current_rpd, current_tpm)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_25_flash_cooldown 
  ON public.gemini_25_flash_keys(is_in_cooldown, cooldown_expires_at)
  WHERE is_in_cooldown = TRUE;

-- ============================================================================
-- 3. Gemini 2.0 Flash Lite Keys (High Throughput)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gemini_20_flash_lite_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  encrypted_api_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'rate_limited')),
  
  -- Usage limits (per key)
  rpm_limit INTEGER NOT NULL DEFAULT 30,
  rpd_limit INTEGER NOT NULL DEFAULT 200,
  tpm_limit INTEGER NOT NULL DEFAULT 1000000,
  
  -- Current usage counters
  current_rpm INTEGER NOT NULL DEFAULT 0,
  current_rpd INTEGER NOT NULL DEFAULT 0,
  current_tpm INTEGER NOT NULL DEFAULT 0,
  
  -- Timing for resets
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_rpm_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_rpd_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Cooldown management
  is_in_cooldown BOOLEAN NOT NULL DEFAULT FALSE,
  cooldown_expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  
  CONSTRAINT gemini_20_flash_lite_keys_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Indexes for efficient key selection
CREATE INDEX IF NOT EXISTS idx_20_flash_lite_active 
  ON public.gemini_20_flash_lite_keys(status, last_used_at)
  WHERE status = 'active' AND is_in_cooldown = FALSE;

CREATE INDEX IF NOT EXISTS idx_20_flash_lite_usage 
  ON public.gemini_20_flash_lite_keys(current_rpm, current_rpd, current_tpm)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_20_flash_lite_cooldown 
  ON public.gemini_20_flash_lite_keys(is_in_cooldown, cooldown_expires_at)
  WHERE is_in_cooldown = TRUE;

-- ============================================================================
-- 4. API Usage Logs (Analytics & Monitoring)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Request details
  model_requested TEXT NOT NULL,
  model_used TEXT NOT NULL,
  key_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  
  -- Usage metrics
  tokens_used INTEGER NOT NULL DEFAULT 0,
  request_duration_ms INTEGER,
  
  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('success', 'rate_limited', 'error', 'fallback')),
  error_message TEXT,
  fallback_count INTEGER NOT NULL DEFAULT 0,
  
  -- Context
  user_id UUID,
  endpoint TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT api_usage_logs_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at 
  ON public.api_usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_logs_model_status 
  ON public.api_usage_logs(model_used, status, created_at);

CREATE INDEX IF NOT EXISTS idx_usage_logs_key_id 
  ON public.api_usage_logs(key_id, created_at);

-- ============================================================================
-- 5. Model Configuration Table (for dynamic limits)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.model_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL UNIQUE,
  table_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  
  -- Priority for fallback (lower = higher priority)
  fallback_priority INTEGER NOT NULL,
  
  -- Default limits
  default_rpm INTEGER NOT NULL,
  default_rpd INTEGER NOT NULL,
  default_tpm INTEGER NOT NULL,
  
  -- Status
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT model_configurations_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Insert model configurations
INSERT INTO public.model_configurations (model_name, table_name, display_name, fallback_priority, default_rpm, default_rpd, default_tpm)
VALUES 
  ('gemini-2.5-flash-lite', 'gemini_25_flash_lite_keys', 'Gemini 2.5 Flash Lite', 1, 15, 1000, 250000),
  ('gemini-2.5-flash', 'gemini_25_flash_keys', 'Gemini 2.5 Flash', 2, 10, 250, 250000),
  ('gemini-2.0-flash-lite', 'gemini_20_flash_lite_keys', 'Gemini 2.0 Flash Lite', 3, 30, 200, 1000000),
  ('gemini-flash-2', 'gemini_api_keys', 'Gemini Flash 2 (Legacy)', 4, 15, 1500, 1000000)
ON CONFLICT (model_name) DO NOTHING;

-- ============================================================================
-- 6. Update Triggers
-- ============================================================================
CREATE TRIGGER update_gemini_25_flash_lite_keys_updated_at 
  BEFORE UPDATE ON public.gemini_25_flash_lite_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gemini_25_flash_keys_updated_at 
  BEFORE UPDATE ON public.gemini_25_flash_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gemini_20_flash_lite_keys_updated_at 
  BEFORE UPDATE ON public.gemini_20_flash_lite_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_configurations_updated_at 
  BEFORE UPDATE ON public.model_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. Helper Functions
-- ============================================================================

-- Function to check if key needs RPM reset
CREATE OR REPLACE FUNCTION check_and_reset_rpm(
  p_table_name TEXT,
  p_key_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_needs_reset BOOLEAN;
  v_sql TEXT;
BEGIN
  v_sql := format(
    'SELECT (EXTRACT(EPOCH FROM (NOW() - last_rpm_reset)) > 60) FROM %I WHERE id = $1',
    p_table_name
  );
  EXECUTE v_sql USING p_key_id INTO v_needs_reset;
  
  IF v_needs_reset THEN
    v_sql := format(
      'UPDATE %I SET current_rpm = 0, last_rpm_reset = NOW() WHERE id = $1',
      p_table_name
    );
    EXECUTE v_sql USING p_key_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if key needs RPD reset
CREATE OR REPLACE FUNCTION check_and_reset_rpd(
  p_table_name TEXT,
  p_key_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_needs_reset BOOLEAN;
  v_sql TEXT;
BEGIN
  v_sql := format(
    'SELECT (EXTRACT(EPOCH FROM (NOW() - last_rpd_reset)) > 86400) FROM %I WHERE id = $1',
    p_table_name
  );
  EXECUTE v_sql USING p_key_id INTO v_needs_reset;
  
  IF v_needs_reset THEN
    v_sql := format(
      'UPDATE %I SET current_rpd = 0, last_rpd_reset = NOW() WHERE id = $1',
      p_table_name
    );
    EXECUTE v_sql USING p_key_id;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. Comments
-- ============================================================================
COMMENT ON TABLE public.gemini_25_flash_lite_keys IS 'High-volume Gemini 2.5 Flash Lite API keys - 1000 RPD, 15 RPM, 250K TPM';
COMMENT ON TABLE public.gemini_25_flash_keys IS 'Standard Gemini 2.5 Flash API keys - 250 RPD, 10 RPM, 250K TPM';
COMMENT ON TABLE public.gemini_20_flash_lite_keys IS 'High-throughput Gemini 2.0 Flash Lite API keys - 200 RPD, 30 RPM, 1M TPM';
COMMENT ON TABLE public.api_usage_logs IS 'Analytics and monitoring logs for all AI API requests';
COMMENT ON TABLE public.model_configurations IS 'Configuration and fallback priority for each model family';
