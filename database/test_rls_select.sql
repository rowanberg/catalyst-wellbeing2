-- Test if RLS is blocking SELECT on seat_assignments
-- Run this while logged in as the teacher

-- 1. Check your current user
SELECT 
    auth.uid() as auth_user_id,
    auth.email() as auth_email;

-- 2. Check your profile
SELECT 
    id as profile_id,
    user_id,
    role,
    first_name,
    last_name
FROM profiles
WHERE user_id = auth.uid();

-- 3. Try to select seat_assignments directly
SELECT 
    sa.id,
    sa.seating_chart_id,
    sa.student_id,
    sa.seat_id,
    sa.assigned_at
FROM seat_assignments sa
WHERE sa.seating_chart_id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a';

-- 4. Check if assignments exist (bypass RLS as admin)
-- This will show if data exists but RLS is blocking it
SET LOCAL role TO postgres;
SELECT COUNT(*) as total_assignments_in_db
FROM seat_assignments
WHERE seating_chart_id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a';
RESET role;

-- 5. Test the RLS policy logic manually
SELECT 
    sa.id,
    sa.seat_id,
    -- Check if the JOIN condition matches
    EXISTS (
        SELECT 1 FROM seating_charts sc
        JOIN profiles p ON p.id = sc.teacher_id
        WHERE sc.id = sa.seating_chart_id
        AND p.user_id = auth.uid()
    ) as rls_policy_passes
FROM seat_assignments sa
WHERE sa.seating_chart_id = 'c9a2197f-0a84-431f-a3ab-62dec98d721a';
