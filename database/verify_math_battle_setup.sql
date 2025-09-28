-- Verification script for Math Battle Arena database setup
-- Run this to check if everything was created properly

-- Check if math_battle_progress table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'math_battle_progress') 
        THEN '✅ math_battle_progress table exists'
        ELSE '❌ math_battle_progress table MISSING'
    END as table_status;

-- Check if profiles has the required columns
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_xp') 
        THEN '✅ profiles.total_xp column exists'
        ELSE '❌ profiles.total_xp column MISSING'
    END as total_xp_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_gems') 
        THEN '✅ profiles.total_gems column exists'
        ELSE '❌ profiles.total_gems column MISSING'
    END as total_gems_status;

-- Check RLS policies
SELECT 
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ RLS policies created'
        ELSE '❌ Missing RLS policies'
    END as policy_status
FROM pg_policies 
WHERE tablename = 'math_battle_progress';

-- Check indexes
SELECT 
    COUNT(*) as index_count,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ Indexes created'
        ELSE '❌ Missing indexes'
    END as index_status
FROM pg_indexes 
WHERE tablename = 'math_battle_progress';

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'math_battle_progress'
ORDER BY ordinal_position;
