-- =====================================================
-- FIX FUNCTION SEARCH PATH SECURITY ISSUE
-- =====================================================
-- Adds "SET search_path = ''" to all public functions
-- Prevents privilege escalation attacks via search_path manipulation

DO $$
DECLARE
    func RECORD;
    func_sig TEXT;
    func_def TEXT;
    new_def TEXT;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Starting Function Search Path Security Fix';
    RAISE NOTICE '========================================';
    
    -- Loop through all functions that need fixing
    FOR func IN 
        SELECT 
            p.oid,
            p.proname AS name,
            pg_get_function_identity_arguments(p.oid) AS args,
            pg_get_functiondef(p.oid) AS definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        AND pg_get_functiondef(p.oid) !~ 'SET search_path'
        ORDER BY p.proname
    LOOP
        BEGIN
            func_def := func.definition;
            
            -- Build the modified function definition
            -- Insert "SET search_path = ''" before the function body
            
            -- Method: Replace the part right before AS keyword or LANGUAGE keyword
            IF func_def ~ '\s+AS\s+\$' THEN
                -- Insert before AS clause
                new_def := REGEXP_REPLACE(
                    func_def,
                    '(\s+)(AS\s+\$)',
                    E'\\1SET search_path = ''''\\n\\1\\2',
                    'i'
                );
            ELSIF func_def ~ '\s+LANGUAGE\s+' THEN
                -- Insert before LANGUAGE
                new_def := REGEXP_REPLACE(
                    func_def,
                    '(\s+)(LANGUAGE\s+)',
                    E'\\1SET search_path = ''''\\n\\1\\2',
                    'i'
                );
            ELSE
                RAISE WARNING 'Cannot determine insertion point for function: %', func.name;
                CONTINUE;
            END IF;
            
            -- Only recreate if we successfully modified the definition
            IF new_def IS NOT NULL AND new_def != func_def THEN
                -- Execute the new definition (CREATE OR REPLACE)
                EXECUTE new_def;
                
                fixed_count := fixed_count + 1;
                
                IF fixed_count % 20 = 0 THEN
                    RAISE NOTICE 'Fixed % functions...', fixed_count;
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to fix %.%(%): %', 
                'public', func.name, func.args, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Completed! Fixed % functions', fixed_count;
    RAISE NOTICE '========================================';
END $$;

-- Verification
DO $$
DECLARE
    remaining INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND pg_get_functiondef(p.oid) !~ 'SET search_path';
    
    IF remaining = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All functions secured with search_path!';
    ELSE
        RAISE WARNING '⚠️ Warning: % functions still need manual review', remaining;
    END IF;
END $$;
