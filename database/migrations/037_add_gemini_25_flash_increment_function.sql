-- Function to increment Gemini 2.5 Flash key usage atomically
CREATE OR REPLACE FUNCTION increment_gemini_25_flash_usage(
  key_id uuid,
  tokens integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE gemini_25_flash_keys
  SET 
    current_rpm = current_rpm + 1,
    current_rpd = current_rpd + 1,
    current_tpm = current_tpm + tokens,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = key_id;
  
  -- Check if key hit rate limits and put in cooldown if needed
  UPDATE gemini_25_flash_keys
  SET 
    is_in_cooldown = true,
    cooldown_expires_at = NOW() + INTERVAL '1 minute',
    status = 'rate_limited'
  WHERE id = key_id
    AND (
      current_rpm >= rpm_limit 
      OR current_rpd >= rpd_limit 
      OR current_tpm >= tpm_limit
    )
    AND is_in_cooldown = false;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_gemini_25_flash_usage(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_gemini_25_flash_usage(uuid, integer) TO service_role;
