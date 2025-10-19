-- Migration: Fix UUID values in profiles.class_name to actual class names
-- This updates all student profiles that have UUID values stored in class_name
-- to use the actual human-readable class name from the classes table

-- Update profiles where class_name looks like a UUID (contains hyphens and is long)
UPDATE public.profiles p
SET class_name = c.class_name
FROM public.classes c
WHERE p.class_name = c.id::text
  AND LENGTH(p.class_name) > 10
  AND p.class_name LIKE '%-%'
  AND p.role = 'student';

-- Verify the update
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.class_name,
  p.grade_level
FROM public.profiles p
WHERE p.role = 'student'
  AND p.class_name IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 20;
