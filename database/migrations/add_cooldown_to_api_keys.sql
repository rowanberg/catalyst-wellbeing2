-- Add cooldown tracking columns to gemini_api_keys table
-- This enables reactive 60-second cooldown when a key hits rate limits (429 errors)

ALTER TABLE gemini_api_keys 
ADD COLUMN IF NOT EXISTS is_in_cooldown BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cooldown_expires_at TIMESTAMPTZ NULL;

-- Create index for efficient cooldown queries
CREATE INDEX IF NOT EXISTS idx_gemini_api_keys_cooldown 
ON gemini_api_keys(is_in_cooldown, cooldown_expires_at) 
WHERE is_in_cooldown = true;

-- Create index for key selection (not in cooldown, has capacity)
CREATE INDEX IF NOT EXISTS idx_gemini_api_keys_available 
ON gemini_api_keys(last_used_timestamp) 
WHERE is_in_cooldown = false AND daily_request_count < 1000;

-- Function to get next available key with cooldown awareness
CREATE OR REPLACE FUNCTION get_available_gemini_key_with_cooldown(
  input_model_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  out_key_id UUID,
  out_api_key TEXT,
  out_remaining_daily INTEGER,
  out_remaining_minute INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_key RECORD;
  v_daily_limit INTEGER := 1000;
  v_minute_limit INTEGER := 15;
BEGIN
  -- Find an available key that is:
  -- 1. Not in cooldown
  -- 2. Has remaining daily capacity (daily_request_count < 1000)
  -- 3. Not disabled
  -- Order by least recently used
  
  SELECT 
    k.id,
    k.encrypted_api_key,
    (v_daily_limit - k.daily_request_count) AS remaining_daily,
    (v_minute_limit - k.current_minute_request_count) AS remaining_minute
  INTO v_key
  FROM gemini_api_keys k
  WHERE k.is_in_cooldown = false
    AND k.is_disabled = false
    AND k.daily_request_count < v_daily_limit
  ORDER BY k.last_used_timestamp ASC NULLS FIRST
  LIMIT 1;
  
  IF v_key IS NOT NULL THEN
    RETURN QUERY SELECT 
      v_key.id,
      v_key.encrypted_api_key,
      v_key.remaining_daily,
      v_key.remaining_minute;
  END IF;
  
  -- No key available
  RETURN;
END;
$$;

-- Function to put a key in cooldown after 429 error
CREATE OR REPLACE FUNCTION set_key_cooldown(
  input_key_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE gemini_api_keys
  SET 
    is_in_cooldown = true,
    cooldown_expires_at = NOW() + INTERVAL '61 seconds'
  WHERE id = input_key_id;
  
  RETURN FOUND;
END;
$$;

-- Function to reset expired cooldowns (called by cron job)
CREATE OR REPLACE FUNCTION reset_expired_cooldowns()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_reset_count INTEGER;
BEGIN
  UPDATE gemini_api_keys
  SET 
    is_in_cooldown = false,
    cooldown_expires_at = NULL
  WHERE 
    is_in_cooldown = true 
    AND cooldown_expires_at <= NOW();
  
  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  
  RETURN v_reset_count;
END;
$$;

-- Function to update key usage after successful request
CREATE OR REPLACE FUNCTION update_gemma_key_usage(
  p_key_id UUID,
  p_tokens_used INTEGER DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the key's usage counters
  UPDATE gemini_api_keys
  SET 
    daily_request_count = daily_request_count + 1,
    current_minute_request_count = current_minute_request_count + 1,
    last_used_timestamp = NOW(),
    updated_at = NOW()
  WHERE id = p_key_id;
  
  RETURN FOUND;
END;
$$;

-- Add key_id column to ai_request_logs if it doesn't exist
ALTER TABLE ai_request_logs 
ADD COLUMN IF NOT EXISTS key_id UUID REFERENCES gemini_api_keys(id);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_available_gemini_key_with_cooldown TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION set_key_cooldown TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION reset_expired_cooldowns TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION update_gemma_key_usage TO authenticated, anon, service_role;

COMMENT ON COLUMN gemini_api_keys.is_in_cooldown IS 'Tracks if the key is benched due to hitting rate limits (429)';
COMMENT ON COLUMN gemini_api_keys.cooldown_expires_at IS 'Timestamp when the 60-second cooldown period ends';
COMMENT ON FUNCTION get_available_gemini_key_with_cooldown IS 'Gets next available API key that is not in cooldown and has capacity';
COMMENT ON FUNCTION set_key_cooldown IS 'Places a key in 60-second cooldown after hitting rate limits';
COMMENT ON FUNCTION reset_expired_cooldowns IS 'Resets all keys whose cooldown period has expired (run by cron job)';
