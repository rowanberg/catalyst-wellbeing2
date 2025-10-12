-- =====================================================
-- BULK RLS FIX - Processes All Policies Automatically
-- =====================================================
-- This fixes ALL auth.uid() calls in RLS policies
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    pol RECORD;
    old_def TEXT;
    new_def TEXT;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting RLS performance fix...';
    
    -- Loop through all policies that need fixing
    FOR pol IN 
        SELECT 
            schemaname,
            tablename,
            policyname,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        AND (
            (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%')
            OR (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%')
        )
        ORDER BY tablename, policyname
    LOOP
        BEGIN
            -- Build the new policy with optimized auth.uid()
            new_def := 'CREATE POLICY ' || quote_ident(pol.policyname) || 
                       ' ON ' || pol.schemaname || '.' || pol.tablename || 
                       ' FOR ' || pol.cmd;
            
            -- Add USING clause if exists
            IF pol.qual IS NOT NULL THEN
                new_def := new_def || ' USING (' || REPLACE(pol.qual, 'auth.uid()', '(SELECT auth.uid())') || ')';
            END IF;
            
            -- Add WITH CHECK clause if exists
            IF pol.with_check IS NOT NULL THEN
                new_def := new_def || ' WITH CHECK (' || REPLACE(pol.with_check, 'auth.uid()', '(SELECT auth.uid())') || ')';
            END IF;
            
            new_def := new_def || ';';
            
            -- Drop existing policy
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || 
                    ' ON ' || pol.schemaname || '.' || pol.tablename;
            
            -- Create new optimized policy
            EXECUTE new_def;
            
            fixed_count := fixed_count + 1;
            
            IF fixed_count % 10 = 0 THEN
                RAISE NOTICE 'Fixed % policies...', fixed_count;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to fix %.%: %', pol.tablename, pol.policyname, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Completed! Fixed % policies', fixed_count;
    RAISE NOTICE '========================================';
    
    -- Verify
    PERFORM FROM pg_policies
    WHERE schemaname = 'public'
    AND (
        (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%')
        OR (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%')
    );
    
    IF FOUND THEN
        RAISE WARNING 'Some policies may still need manual review';
    ELSE
        RAISE NOTICE '✅ All policies optimized successfully!';
    END IF;
END $$;
