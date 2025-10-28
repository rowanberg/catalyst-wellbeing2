-- ============================================================================
-- Populate New Model Tables with Existing API Keys
-- ============================================================================
-- Copies encrypted API keys from gemini_api_keys table to all three new model tables
-- Each Google AI Studio key works for ALL Gemini models, so we can reuse them
-- ============================================================================

-- ============================================================================
-- Populate Gemini 2.5 Flash Lite Keys
-- ============================================================================
INSERT INTO public.gemini_25_flash_lite_keys (
  encrypted_api_key,
  status,
  rpm_limit,
  rpd_limit,
  tpm_limit,
  notes,
  created_at
)
SELECT 
  encrypted_api_key,
  CASE 
    WHEN is_disabled = TRUE THEN 'disabled'
    ELSE 'active'
  END as status,
  15 as rpm_limit,
  1000 as rpd_limit,
  250000 as tpm_limit,
  'Imported from gemini_api_keys table' as notes,
  created_at
FROM public.gemini_api_keys
WHERE NOT EXISTS (
  SELECT 1 FROM public.gemini_25_flash_lite_keys 
  WHERE gemini_25_flash_lite_keys.encrypted_api_key = gemini_api_keys.encrypted_api_key
);

-- ============================================================================
-- Populate Gemini 2.5 Flash Keys
-- ============================================================================
INSERT INTO public.gemini_25_flash_keys (
  encrypted_api_key,
  status,
  rpm_limit,
  rpd_limit,
  tpm_limit,
  notes,
  created_at
)
SELECT 
  encrypted_api_key,
  CASE 
    WHEN is_disabled = TRUE THEN 'disabled'
    ELSE 'active'
  END as status,
  10 as rpm_limit,
  250 as rpd_limit,
  250000 as tpm_limit,
  'Imported from gemini_api_keys table' as notes,
  created_at
FROM public.gemini_api_keys
WHERE NOT EXISTS (
  SELECT 1 FROM public.gemini_25_flash_keys 
  WHERE gemini_25_flash_keys.encrypted_api_key = gemini_api_keys.encrypted_api_key
);

-- ============================================================================
-- Populate Gemini 2.0 Flash Lite Keys
-- ============================================================================
INSERT INTO public.gemini_20_flash_lite_keys (
  encrypted_api_key,
  status,
  rpm_limit,
  rpd_limit,
  tpm_limit,
  notes,
  created_at
)
SELECT 
  encrypted_api_key,
  CASE 
    WHEN is_disabled = TRUE THEN 'disabled'
    ELSE 'active'
  END as status,
  30 as rpm_limit,
  200 as rpd_limit,
  1000000 as tpm_limit,
  'Imported from gemini_api_keys table' as notes,
  created_at
FROM public.gemini_api_keys
WHERE NOT EXISTS (
  SELECT 1 FROM public.gemini_20_flash_lite_keys 
  WHERE gemini_20_flash_lite_keys.encrypted_api_key = gemini_api_keys.encrypted_api_key
);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the import worked correctly
DO $$
DECLARE
  original_count BIGINT;
  lite_25_count BIGINT;
  flash_25_count BIGINT;
  lite_20_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO original_count FROM public.gemini_api_keys;
  SELECT COUNT(*) INTO lite_25_count FROM public.gemini_25_flash_lite_keys;
  SELECT COUNT(*) INTO flash_25_count FROM public.gemini_25_flash_keys;
  SELECT COUNT(*) INTO lite_20_count FROM public.gemini_20_flash_lite_keys;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'API Key Population Summary';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Original gemini_api_keys table: % keys', original_count;
  RAISE NOTICE 'Gemini 2.5 Flash Lite: % keys', lite_25_count;
  RAISE NOTICE 'Gemini 2.5 Flash: % keys', flash_25_count;
  RAISE NOTICE 'Gemini 2.0 Flash Lite: % keys', lite_20_count;
  RAISE NOTICE '========================================';
  
  IF lite_25_count >= original_count AND 
     flash_25_count >= original_count AND 
     lite_20_count >= original_count THEN
    RAISE NOTICE '✓ SUCCESS: All keys imported successfully!';
  ELSE
    RAISE WARNING '⚠ WARNING: Some keys may not have been imported';
  END IF;
END $$;

-- ============================================================================
-- Helper Function: Add New Key to All Models
-- ============================================================================
-- Use this function when adding new API keys in the future
CREATE OR REPLACE FUNCTION add_api_key_to_all_models(
  p_encrypted_key TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
  model_family TEXT,
  key_id UUID,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key_id_25_lite UUID;
  v_key_id_25 UUID;
  v_key_id_20_lite UUID;
BEGIN
  -- Insert into Gemini 2.5 Flash Lite
  INSERT INTO public.gemini_25_flash_lite_keys (encrypted_api_key, notes)
  VALUES (p_encrypted_key, COALESCE(p_notes, 'Added via add_api_key_to_all_models()'))
  RETURNING id INTO v_key_id_25_lite;
  
  -- Insert into Gemini 2.5 Flash
  INSERT INTO public.gemini_25_flash_keys (encrypted_api_key, notes)
  VALUES (p_encrypted_key, COALESCE(p_notes, 'Added via add_api_key_to_all_models()'))
  RETURNING id INTO v_key_id_25;
  
  -- Insert into Gemini 2.0 Flash Lite
  INSERT INTO public.gemini_20_flash_lite_keys (encrypted_api_key, notes)
  VALUES (p_encrypted_key, COALESCE(p_notes, 'Added via add_api_key_to_all_models()'))
  RETURNING id INTO v_key_id_20_lite;
  
  -- Return results
  RETURN QUERY
  SELECT 'Gemini 2.5 Flash Lite'::TEXT, v_key_id_25_lite, 'inserted'::TEXT
  UNION ALL
  SELECT 'Gemini 2.5 Flash'::TEXT, v_key_id_25, 'inserted'::TEXT
  UNION ALL
  SELECT 'Gemini 2.0 Flash Lite'::TEXT, v_key_id_20_lite, 'inserted'::TEXT;
END;
$$;

-- ============================================================================
-- Helper Function: Disable Key Across All Models
-- ============================================================================
CREATE OR REPLACE FUNCTION disable_api_key_everywhere(
  p_encrypted_key TEXT
)
RETURNS TABLE(
  model_family TEXT,
  keys_disabled BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_25_lite BIGINT;
  count_25 BIGINT;
  count_20_lite BIGINT;
BEGIN
  -- Disable in Gemini 2.5 Flash Lite
  WITH updated AS (
    UPDATE public.gemini_25_flash_lite_keys
    SET status = 'disabled'
    WHERE encrypted_api_key = p_encrypted_key
    RETURNING id
  )
  SELECT COUNT(*) INTO count_25_lite FROM updated;
  
  -- Disable in Gemini 2.5 Flash
  WITH updated AS (
    UPDATE public.gemini_25_flash_keys
    SET status = 'disabled'
    WHERE encrypted_api_key = p_encrypted_key
    RETURNING id
  )
  SELECT COUNT(*) INTO count_25 FROM updated;
  
  -- Disable in Gemini 2.0 Flash Lite
  WITH updated AS (
    UPDATE public.gemini_20_flash_lite_keys
    SET status = 'disabled'
    WHERE encrypted_api_key = p_encrypted_key
    RETURNING id
  )
  SELECT COUNT(*) INTO count_20_lite FROM updated;
  
  -- Also disable in legacy table
  UPDATE public.gemini_api_keys
  SET is_disabled = TRUE
  WHERE encrypted_api_key = p_encrypted_key;
  
  -- Return results
  RETURN QUERY
  SELECT 'Gemini 2.5 Flash Lite'::TEXT, count_25_lite
  UNION ALL
  SELECT 'Gemini 2.5 Flash'::TEXT, count_25
  UNION ALL
  SELECT 'Gemini 2.0 Flash Lite'::TEXT, count_20_lite;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON FUNCTION add_api_key_to_all_models(TEXT, TEXT) IS 
  'Add a new encrypted API key to all three Gemini model tables at once';
  
COMMENT ON FUNCTION disable_api_key_everywhere(TEXT) IS 
  'Disable an API key across all model tables (useful when a key is compromised)';
