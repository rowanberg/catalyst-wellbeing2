-- =====================================================
-- COMPLETE RLS PERFORMANCE FIX
-- Generated from actual database policies
-- Simple replacement: auth.uid() → (SELECT auth.uid())
-- NO logic changes whatsoever
-- =====================================================

BEGIN;

-- This is a SIMPLE find-and-replace operation on your existing policies
-- We're not changing ANY logic, just wrapping auth.uid() calls

-- =====================================================
-- APPROACH: Use PostgreSQL's built-in policy recreation
-- =====================================================

-- Step 1: Create a function to fix a single policy
CREATE OR REPLACE FUNCTION fix_rls_policy(
    p_table text,
    p_policy text
) RETURNS void AS $$
DECLARE
    policy_def text;
    fixed_def text;
BEGIN
    -- Get the current policy definition
    SELECT 
        pg_get_policydef(oid)
    INTO policy_def
    FROM pg_policy
    WHERE polname = p_policy
    AND polrelid = p_table::regclass;
    
    IF policy_def IS NULL THEN
        RAISE NOTICE 'Policy % on table % not found', p_policy, p_table;
        RETURN;
    END IF;
    
    -- Replace auth.uid() with (SELECT auth.uid())
    fixed_def := REPLACE(policy_def, 'auth.uid()', '(SELECT auth.uid())');
    
    -- Only recreate if there was a change
    IF fixed_def != policy_def THEN
        -- Drop and recreate
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(p_policy) || ' ON ' || p_table;
        EXECUTE fixed_def;
        RAISE NOTICE 'Fixed: %.%', p_table, p_policy;
    ELSE
        RAISE NOTICE 'Already optimized: %.%', p_table, p_policy;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Fix ALL policies that need it
DO $$
DECLARE
    pol RECORD;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Starting RLS Performance Fix';
    RAISE NOTICE '========================================';
    
    FOR pol IN 
        SELECT 
            schemaname,
            tablename,
            policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND (
            qual LIKE '%auth.uid()%' 
            OR with_check LIKE '%auth.uid()%'
        )
        AND (
            qual NOT LIKE '%(SELECT auth.uid())%'
            OR with_check NOT LIKE '%(SELECT auth.uid())%'
        )
        ORDER BY tablename, policyname
    LOOP
        BEGIN
            PERFORM fix_rls_policy(
                'public.' || pol.tablename,
                pol.policyname
            );
            fixed_count := fixed_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to fix %.%: %', 
                pol.tablename, pol.policyname, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Processed % policies', fixed_count;
    RAISE NOTICE '========================================';
END $$;

-- Step 3: Clean up the helper function
DROP FUNCTION IF EXISTS fix_rls_policy(text, text);

-- Step 4: Verification
DO $$
DECLARE
    remaining INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
        qual LIKE '%auth.uid()%' 
        OR with_check LIKE '%auth.uid()%'
    )
    AND (
        qual NOT LIKE '%(SELECT auth.uid())%'
        AND with_check NOT LIKE '%(SELECT auth.uid())%'
    );
    
    IF remaining = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All RLS policies optimized!';
    ELSE
        RAISE WARNING '⚠️ Warning: % policies may still need review', remaining;
    END IF;
END $$;

COMMIT;
