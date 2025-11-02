-- Insert a test Gemini 2.5 Flash API key for development
-- Replace 'YOUR_GEMINI_API_KEY_HERE' with your actual API key from https://makersuite.google.com/app/apikey

INSERT INTO public.gemini_25_flash_keys (
  encrypted_api_key,
  status,
  rpm_limit,
  rpd_limit,
  tpm_limit,
  notes
)
VALUES (
  'YOUR_GEMINI_API_KEY_HERE',  -- Replace with your actual Gemini API key
  'active',
  10,      -- 10 requests per minute
  250,     -- 250 requests per day
  250000,  -- 250k tokens per minute
  'Development test key - plaintext (not encrypted)'
)
ON CONFLICT (encrypted_api_key) DO NOTHING;

-- To get your Gemini API key:
-- 1. Visit: https://makersuite.google.com/app/apikey
-- 2. Create a new API key or use an existing one
-- 3. Replace 'YOUR_GEMINI_API_KEY_HERE' above with the actual key
-- 4. Run this SQL in your Supabase SQL editor

-- Note: For production, encrypt your keys using proper encryption
