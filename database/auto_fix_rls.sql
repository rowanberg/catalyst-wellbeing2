-- =====================================================
-- AUTOMATIC RLS FIX - NO GUESSING
-- =====================================================
-- This generates the fix script from your actual policies

DO $$
DECLARE
    policy_rec RECORD;
    new_qual TEXT;
    new_check TEXT;
    fix_sql TEXT;
BEGIN
    RAISE NOTICE '-- =====================================================';
    RAISE NOTICE '-- AUTO-GENERATED RLS PERFORMANCE FIX';
    RAISE NOTICE '-- Generated: %', NOW();
    RAISE NOTICE '-- =====================================================';
    RAISE NOTICE 'BEGIN;';
    RAISE NOTICE '';

    FOR policy_rec IN 
        SELECT 
            tablename,
            policyname,
            cmd,
            qual,
            with_check
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
        -- Replace auth.uid() with (SELECT auth.uid()) in qual
        new_qual := policy_rec.qual;
        IF new_qual IS NOT NULL THEN
            new_qual := REPLACE(new_qual, 'auth.uid()', '(SELECT auth.uid())');
        END IF;
        
        -- Replace auth.uid() with (SELECT auth.uid()) in with_check
        new_check := policy_rec.with_check;
        IF new_check IS NOT NULL THEN
            new_check := REPLACE(new_check, 'auth.uid()', '(SELECT auth.uid())');
        END IF;
        
        -- Generate DROP and CREATE statements
        RAISE NOTICE '-- Fix: %.%', policy_rec.tablename, policy_rec.policyname;
        RAISE NOTICE 'DROP POLICY IF EXISTS "%" ON public.%;', policy_rec.policyname, policy_rec.tablename;
        
        fix_sql := 'CREATE POLICY "' || policy_rec.policyname || '" ON public.' || policy_rec.tablename || E'\nFOR ' || policy_rec.cmd;
        
        IF new_qual IS NOT NULL THEN
            fix_sql := fix_sql || E'\nUSING (' || new_qual || ')';
        END IF;
        
        IF new_check IS NOT NULL THEN
            fix_sql := fix_sql || E'\nWITH CHECK (' || new_check || ')';
        END IF;
        
        fix_sql := fix_sql || ';';
        
        RAISE NOTICE '%', fix_sql;
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE 'COMMIT;';
    RAISE NOTICE '';
    RAISE NOTICE '-- =====================================================';
    RAISE NOTICE '-- END OF AUTO-GENERATED FIX';
    RAISE NOTICE '-- =====================================================';
END $$;
