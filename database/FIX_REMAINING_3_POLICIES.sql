-- Fix the 3 remaining auth function calls in RLS policies

DO $$
DECLARE
    pol RECORD;
    new_def TEXT;
    fixed_count INTEGER := 0;
BEGIN
    -- Target the 3 specific tables
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
        AND tablename IN ('school_gemini_config', 'achievement_templates', 'milestone_templates')
        AND (
            qual LIKE '%auth.%' 
            OR with_check LIKE '%auth.%'
        )
        ORDER BY tablename, policyname
    LOOP
        BEGIN
            -- Build the new policy with all auth.* functions wrapped
            new_def := 'CREATE POLICY ' || quote_ident(pol.policyname) || 
                       ' ON ' || pol.schemaname || '.' || pol.tablename || 
                       ' FOR ' || pol.cmd;
            
            -- Add USING clause if exists - wrap ALL auth.* calls
            IF pol.qual IS NOT NULL THEN
                new_def := new_def || ' USING (' || 
                    REPLACE(
                        REPLACE(
                            REPLACE(pol.qual, 
                                'auth.uid()', '(SELECT auth.uid())'),
                            'auth.role()', '(SELECT auth.role())'),
                        'auth.jwt()', '(SELECT auth.jwt())')
                    || ')';
            END IF;
            
            -- Add WITH CHECK clause if exists
            IF pol.with_check IS NOT NULL THEN
                new_def := new_def || ' WITH CHECK (' || 
                    REPLACE(
                        REPLACE(
                            REPLACE(pol.with_check, 
                                'auth.uid()', '(SELECT auth.uid())'),
                            'auth.role()', '(SELECT auth.role())'),
                        'auth.jwt()', '(SELECT auth.jwt())')
                    || ')';
            END IF;
            
            new_def := new_def || ';';
            
            -- Drop existing policy
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || 
                    ' ON ' || pol.schemaname || '.' || pol.tablename;
            
            -- Create new optimized policy
            EXECUTE new_def;
            
            fixed_count := fixed_count + 1;
            RAISE NOTICE 'Fixed: %.%', pol.tablename, pol.policyname;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to fix %.%: %', pol.tablename, pol.policyname, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fixed % remaining policies', fixed_count;
    RAISE NOTICE '========================================';
END $$;
