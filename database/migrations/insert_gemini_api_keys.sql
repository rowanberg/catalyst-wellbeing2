-- =====================================================
-- Insert Gemini API Keys for Both Models
-- 9 keys total - each key used for both model types
-- =====================================================

-- Gemini 3 Pro: Unlimited rpm/rpd, 125K tpm
INSERT INTO gemini_api_key_usage (api_key, model, status, rpm_limit, rpd_limit, tpm_limit)
VALUES
  ('AIzaSyBK_C2RU-b4QLSO4AREhmfwWaYHjvNHnTQ', 'gemini_3_pro', 'active', NULL, NULL, 125000),
  ('AIzaSyB-iIeJOWaTpIbhniaSurpr9xNJvI6roRg', 'gemini_3_pro', 'active', NULL, NULL, 125000),
  ('AIzaSyCPdoqXs8ZPjDFJgec6lRaheamZQVo46XU', 'gemini_3_pro', 'active', NULL, NULL, 125000),
  ('AIzaSyBQ67RjvGzdxK_P6OKxMQx9vpveI90hgqc', 'gemini_3_pro', 'active', NULL, NULL, 125000),
  ('AIzaSyDgedf-_ekMNo2URO515EK8bPw0YJNACuU', 'gemini_3_pro', 'active', NULL, NULL, 125000),
  ('AIzaSyCVSw4U21X8vmFolC8m-znAJFcVzX5bz-w', 'gemini_3_pro', 'active', NULL, NULL, 125000),
  ('AIzaSyD8m7bJeXumle8lvcYUc7mnd0-EgtFxcH8', 'gemini_3_pro', 'active', NULL, NULL, 125000),
  ('AIzaSyDtOvc7l6Zo8iqT9nj4HDr6RQ_Q-LgEN88', 'gemini_3_pro', 'active', NULL, NULL, 125000),
  ('AIzaSyDArPcGkiM34H1rk7ZnqHCRso3PolMaGfc', 'gemini_3_pro', 'active', NULL, NULL, 125000);

-- Gemini 2.5 Pro: 2 rpm, 50 rpd, 125K tpm (same keys, strict limits)
INSERT INTO gemini_api_key_usage (api_key, model, status, rpm_limit, rpd_limit, tpm_limit)
VALUES
  ('AIzaSyBK_C2RU-b4QLSO4AREhmfwWaYHjvNHnTQ', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('AIzaSyB-iIeJOWaTpIbhniaSurpr9xNJvI6roRg', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('AIzaSyCPdoqXs8ZPjDFJgec6lRaheamZQVo46XU', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('AIzaSyBQ67RjvGzdxK_P6OKxMQx9vpveI90hgqc', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('AIzaSyDgedf-_ekMNo2URO515EK8bPw0YJNACuU', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('AIzaSyCVSw4U21X8vmFolC8m-znAJFcVzX5bz-w', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('AIzaSyD8m7bJeXumle8lvcYUc7mnd0-EgtFxcH8', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('AIzaSyDtOvc7l6Zo8iqT9nj4HDr6RQ_Q-LgEN88', 'gemini_2_5_pro', 'active', 2, 50, 125000),
  ('AIzaSyDArPcGkiM34H1rk7ZnqHCRso3PolMaGfc', 'gemini_2_5_pro', 'active', 2, 50, 125000);

-- Initialize model usage aggregation
SELECT aggregate_model_usage();

-- Verify insertion
SELECT 
  model,
  COUNT(*) as total_keys,
  COUNT(*) FILTER (WHERE status = 'active') as active_keys
FROM gemini_api_key_usage
GROUP BY model
ORDER BY model;
