-- Sample API keys for testing Gemini API usage tracking
-- Run this after creating the main schema

-- Gemini 3 Pro keys (unlimited rpm/rpd, 125K tpm)
INSERT INTO gemini_api_key_usage (
  api_key,
  model,
  status,
  rpm_limit,
  rpd_limit,
  tpm_limit
) VALUES
  ('GEMINI_3_PRO_KEY_1', 'gemini_3_pro', 'active', NULL, NULL, 125000),
  ('GEMINI_3_PRO_KEY_2', 'gemini_3_pro', 'active', NULL, NULL, 125000);

-- Gemini 2.5 Pro keys (2 rpm, 50 rpd, 125K tpm)
INSERT INTO gemini_model_usage_summary (
  api_key,
  model,
  status,
  rpm_limit,
  rpd_limit,
  tpm_limit
) VALUES
  ('GEMINI_2_5_PRO_KEY_1', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('GEMINI_2_5_PRO_KEY_2', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('GEMINI_2_5_PRO_KEY_3', 'gemini_2_5_pro', 'active', 2, 50, 125000);

-- Initial aggregation
SELECT aggregate_model_usage();
