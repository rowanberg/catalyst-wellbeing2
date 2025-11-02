-- ============================================
-- SUBSCRIPTION VIEWS AND FUNCTIONS
-- Run this AFTER 042a and 042_subscription_sync_integration.sql
-- Requires: profiles.school_id column to exist
-- ============================================

-- Verify profiles.school_id exists before proceeding
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'school_id') THEN
    RAISE EXCEPTION 'profiles.school_id column does not exist. Run 042a_add_profiles_school_id.sql first.';
  END IF;
END $$;

-- ============================================
-- CREATE VIEWS
-- ============================================

-- Active subscriptions view
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  s.id,
  s.email,
  s.name as school_name,
  s.phone,
  s.subscription_status,
  s.subscription_plan,
  s.student_limit,
  s.trial_end_date,
  s.subscription_start_date,
  s.subscription_end_date,
  s.next_billing_date,
  s.razorpay_subscription_id,
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT CASE WHEN p.role = 'student' THEN p.id END) as student_count,
  s.created_at,
  s.updated_at
FROM schools s
LEFT JOIN profiles p ON s.id = p.school_id
WHERE s.is_active = true AND s.subscription_status IN ('trial', 'active')
GROUP BY s.id;

-- Trial schools ending soon view
CREATE OR REPLACE VIEW trial_schools_ending_soon AS
SELECT 
  s.id,
  s.email,
  s.name as school_name,
  s.subscription_plan,
  s.trial_end_date,
  EXTRACT(DAY FROM (s.trial_end_date - NOW())) as days_remaining,
  COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'student') as student_count
FROM schools s
LEFT JOIN profiles p ON s.id = p.school_id
WHERE 
  s.subscription_status = 'trial' 
  AND s.trial_end_date IS NOT NULL
  AND s.trial_end_date > NOW()
  AND s.trial_end_date < NOW() + INTERVAL '7 days'
  AND s.is_active = true
GROUP BY s.id
ORDER BY s.trial_end_date ASC;

-- ============================================
-- CREATE HELPER FUNCTION
-- ============================================

-- Function to check if school is within student limit
CREATE OR REPLACE FUNCTION check_student_limit(school_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_students INTEGER;
  limit_count INTEGER;
BEGIN
  SELECT 
    COUNT(DISTINCT id) FILTER (WHERE role = 'student'),
    s.student_limit
  INTO current_students, limit_count
  FROM profiles p
  CROSS JOIN schools s
  WHERE p.school_id = school_id_param
    AND s.id = school_id_param
  GROUP BY s.student_limit;
  
  IF limit_count IS NULL THEN
    RETURN true; -- No limit set
  END IF;
  
  RETURN current_students < limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON active_subscriptions TO service_role, authenticated;
GRANT SELECT ON trial_schools_ending_soon TO service_role, authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify views created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
AND table_name IN ('active_subscriptions', 'trial_schools_ending_soon');

-- Expected: 2 rows

-- Test the views
SELECT COUNT(*) as active_schools FROM active_subscriptions;
SELECT COUNT(*) as trials_ending_soon FROM trial_schools_ending_soon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Subscription views and functions created successfully!';
END $$;
