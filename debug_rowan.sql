-- Debug script to check Rowan's profile and school setup data

-- 1. Find Rowan's profile
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  role,
  school_id,
  school_code,
  created_at,
  updated_at
FROM profiles 
WHERE first_name = 'Rowan' AND last_name = 'berg';

-- 2. Find Rowan's school details
SELECT 
  s.id,
  s.name,
  s.school_code,
  s.created_at
FROM schools s
JOIN profiles p ON p.school_id = s.id
WHERE p.first_name = 'Rowan' AND p.last_name = 'berg';

-- 3. Check if RAEVEN PUBLIC SCHOOL has setup data
SELECT 
  sd.id,
  sd.school_id,
  sd.school_code,
  sd.school_name,
  sd.status,
  sd.setup_completed,
  sd.setup_completed_at,
  sd.created_at
FROM school_details sd
WHERE sd.school_name LIKE '%RAEVEN%' OR sd.school_code = '172QIQ7VJ1GE';

-- 4. Check what school_details records exist for Rowan's school_id
SELECT 
  sd.id,
  sd.school_id,
  sd.school_code,
  sd.school_name,
  sd.status,
  sd.setup_completed
FROM school_details sd
JOIN profiles p ON p.school_id = sd.school_id
WHERE p.first_name = 'Rowan' AND p.last_name = 'berg';
