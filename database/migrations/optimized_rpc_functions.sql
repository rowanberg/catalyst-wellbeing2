-- Optional: High-performance RPC functions for atomic operations
-- These provide better performance than the fallback queries

-- Function: Atomic log usage with window reset
CREATE OR REPLACE FUNCTION log_usage_atomic(
  p_api_key TEXT,
  p_model gemini_model,
  p_tokens_used INT,
  p_now TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
  v_key RECORD;
  v_reset_minute BOOLEAN;
  v_reset_day BOOLEAN;
  v_should_rotate BOOLEAN := FALSE;
  v_rotation_reason TEXT := NULL;
BEGIN
  -- Lock row for update
  SELECT * INTO v_key
  FROM gemini_api_key_usage
  WHERE api_key = p_api_key AND model = p_model
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'API key not found';
  END IF;

  -- Check if windows expired
  v_reset_minute := (p_now - v_key.minute_window_start) > INTERVAL '1 minute';
  v_reset_day := (p_now - v_key.day_window_start) > INTERVAL '24 hours';

  -- Update with atomic operation
  UPDATE gemini_api_key_usage
  SET
    rpm_used = CASE WHEN v_reset_minute THEN 1 ELSE rpm_used + 1 END,
    rpd_used = CASE WHEN v_reset_day THEN 1 ELSE rpd_used + 1 END,
    tpm_used = CASE WHEN v_reset_minute THEN p_tokens_used ELSE tpm_used + p_tokens_used END,
    total_requests = total_requests + 1,
    total_tokens = total_tokens + p_tokens_used,
    minute_window_start = CASE WHEN v_reset_minute THEN p_now ELSE minute_window_start END,
    day_window_start = CASE WHEN v_reset_day THEN p_now ELSE day_window_start END,
    updated_at = p_now
  WHERE api_key = p_api_key AND model = p_model
  RETURNING rpm_used, rpd_used, tpm_used INTO v_key;

  -- Check if should rotate
  IF v_key.rpm_limit IS NOT NULL AND v_key.rpm_used >= v_key.rpm_limit THEN
    v_should_rotate := TRUE;
    v_rotation_reason := 'rpm_limit_exceeded';
  ELSIF v_key.rpd_limit IS NOT NULL AND v_key.rpd_used >= v_key.rpd_limit THEN
    v_should_rotate := TRUE;
    v_rotation_reason := 'rpd_limit_exceeded';
  ELSIF v_key.tpm_used >= v_key.tpm_limit THEN
    v_should_rotate := TRUE;
    v_rotation_reason := 'tpm_limit_exceeded';
  END IF;

  -- Auto-rotate if needed
  IF v_should_rotate THEN
    UPDATE gemini_api_key_usage
    SET
      status = 'rotated',
      auto_rotated = TRUE,
      last_rotated_at = p_now,
      notes = 'Auto-rotated: ' || v_rotation_reason
    WHERE api_key = p_api_key AND model = p_model;
  END IF;

  RETURN json_build_object(
    'rpm_used', v_key.rpm_used,
    'rpd_used', v_key.rpd_used,
    'tpm_used', v_key.tpm_used,
    'rotated', v_should_rotate,
    'rotation_reason', v_rotation_reason
  );
END;
$$ LANGUAGE plpgsql;
