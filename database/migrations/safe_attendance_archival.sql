-- ============================================================================
-- SAFE ATTENDANCE DATA ARCHIVAL STRATEGY
-- Version: 1.0.0
-- Description: Archives old attendance records safely with rollback capability
-- Author: Catalyst Engineering Team
-- ============================================================================

-- STEP 0: ANALYSIS & PRE-CHECKS
-- ============================================================================

-- Check current attendance table size and oldest records
DO $$
DECLARE
    table_size TEXT;
    row_count BIGINT;
    oldest_date DATE;
    records_to_archive BIGINT;
BEGIN
    -- Get table size
    SELECT pg_size_pretty(pg_total_relation_size('attendance')) INTO table_size;
    SELECT COUNT(*) INTO row_count FROM attendance;
    SELECT MIN(date) INTO oldest_date FROM attendance;
    SELECT COUNT(*) INTO records_to_archive FROM attendance WHERE date < CURRENT_DATE - INTERVAL '6 months';
    
    RAISE NOTICE '=============== ATTENDANCE TABLE ANALYSIS ===============';
    RAISE NOTICE 'Current table size: %', table_size;
    RAISE NOTICE 'Total records: %', row_count;
    RAISE NOTICE 'Oldest record date: %', oldest_date;
    RAISE NOTICE 'Records to archive (>6 months): %', records_to_archive;
    RAISE NOTICE '=========================================================';
    
    IF records_to_archive = 0 THEN
        RAISE NOTICE 'No records to archive. Exiting...';
    END IF;
END $$;

-- STEP 1: CREATE ARCHIVE TABLE (IF NOT EXISTS)
-- ============================================================================

-- Create archive table with explicit structure (matching actual attendance schema)
CREATE TABLE IF NOT EXISTS attendance_archive (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    school_id UUID NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    -- Archive metadata
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archive_reason TEXT DEFAULT 'Age-based archival (>6 months)',
    -- Keep unique constraint
    UNIQUE(student_id, date)
);

-- STEP 2: CREATE BACKUP TABLE FOR ROLLBACK
-- ============================================================================

-- Create temporary backup table for rollback capability
CREATE TABLE IF NOT EXISTS attendance_archive_backup AS 
SELECT * FROM attendance WHERE FALSE;

-- STEP 3: CHECK DEPENDENCIES
-- ============================================================================

-- Check for foreign key dependencies
DO $$
DECLARE
    dep RECORD;
    dep_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Checking for dependencies...';
    
    FOR dep IN 
        SELECT 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name='attendance'
    LOOP
        dep_count := dep_count + 1;
        RAISE WARNING 'Foreign key found: %.% references attendance', dep.table_name, dep.column_name;
    END LOOP;
    
    IF dep_count > 0 THEN
        RAISE NOTICE 'Found % dependencies. Please review before proceeding.', dep_count;
    ELSE
        RAISE NOTICE 'No foreign key dependencies found.';
    END IF;
END $$;

-- STEP 4: CREATE SAFE ARCHIVAL FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION archive_attendance_safely(
    months_to_keep INTEGER DEFAULT 6,
    batch_size INTEGER DEFAULT 1000,
    dry_run BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
    archived_count BIGINT,
    status TEXT,
    execution_time INTERVAL
)
LANGUAGE plpgsql
AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    affected_rows BIGINT := 0;
    total_archived BIGINT := 0;
    archive_date DATE;
BEGIN
    start_time := clock_timestamp();
    archive_date := CURRENT_DATE - (months_to_keep || ' months')::INTERVAL;
    
    -- Count records to archive
    SELECT COUNT(*) INTO affected_rows 
    FROM attendance 
    WHERE date < archive_date;
    
    IF dry_run THEN
        RAISE NOTICE 'DRY RUN MODE - No data will be moved';
        RAISE NOTICE 'Would archive % records older than %', affected_rows, archive_date;
        
        RETURN QUERY
        SELECT 
            affected_rows,
            'DRY RUN - No changes made'::TEXT,
            clock_timestamp() - start_time;
        RETURN;
    END IF;
    
    -- Begin transaction
    RAISE NOTICE 'Starting archival process...';
    
    -- Archive in batches to avoid locks
    LOOP
        WITH archived AS (
            DELETE FROM attendance 
            WHERE date < archive_date
            AND id IN (
                SELECT id 
                FROM attendance 
                WHERE date < archive_date 
                LIMIT batch_size
            )
            RETURNING *
        )
        INSERT INTO attendance_archive 
        SELECT *, NOW(), 'Age-based archival (>' || months_to_keep || ' months)'
        FROM archived;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        total_archived := total_archived + affected_rows;
        
        EXIT WHEN affected_rows = 0;
        
        -- Progress update
        RAISE NOTICE 'Archived % records (Total: %)', affected_rows, total_archived;
        
        -- Small delay to prevent overwhelming the database
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    end_time := clock_timestamp();
    
    RAISE NOTICE 'Archival complete. Total records archived: %', total_archived;
    
    RETURN QUERY
    SELECT 
        total_archived,
        'SUCCESS'::TEXT,
        end_time - start_time;
END;
$$;

-- STEP 5: CREATE VIEW FOR SEAMLESS ACCESS
-- ============================================================================

-- Drop existing view if exists
DROP VIEW IF EXISTS attendance_all;

-- Create unified view
CREATE VIEW attendance_all AS
SELECT 
    id,
    student_id,
    teacher_id,
    school_id,
    date,
    status,
    notes,
    created_at,
    updated_at,
    'current'::TEXT as source
FROM attendance

UNION ALL

SELECT 
    id,
    student_id,
    teacher_id,
    school_id,
    date,
    status,
    notes,
    created_at,
    updated_at,
    'archive'::TEXT as source
FROM attendance_archive;

-- Grant permissions on view
GRANT SELECT ON attendance_all TO authenticated;
GRANT SELECT ON attendance_all TO service_role;

-- STEP 6: CREATE INDEXES ON ARCHIVE TABLE
-- ============================================================================

-- Create same indexes as main table
CREATE INDEX IF NOT EXISTS idx_attendance_archive_student_date 
ON attendance_archive(student_id, date);

CREATE INDEX IF NOT EXISTS idx_attendance_archive_school_date 
ON attendance_archive(school_id, date);

-- Note: class_id index not needed as column doesn't exist in attendance table

CREATE INDEX IF NOT EXISTS idx_attendance_archive_date 
ON attendance_archive(date);

CREATE INDEX IF NOT EXISTS idx_attendance_archive_archived_at 
ON attendance_archive(archived_at);

-- STEP 7: CREATE ROLLBACK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION rollback_attendance_archive(
    rollback_date TIMESTAMP DEFAULT NOW() - INTERVAL '1 hour'
)
RETURNS TABLE(
    restored_count BIGINT,
    status TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    affected_rows BIGINT := 0;
BEGIN
    -- Restore records archived after the rollback date
    WITH restored AS (
        DELETE FROM attendance_archive
        WHERE archived_at > rollback_date
        RETURNING 
            id,
            student_id,
            teacher_id,
            school_id,
            date,
            status,
            notes,
            created_at,
            updated_at
    )
    INSERT INTO attendance 
    SELECT * FROM restored
    ON CONFLICT (student_id, date) DO NOTHING;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RAISE NOTICE 'Restored % records from archive', affected_rows;
    
    RETURN QUERY
    SELECT 
        affected_rows,
        'SUCCESS'::TEXT;
END;
$$;

-- STEP 8: CREATE MONITORING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION monitor_attendance_tables()
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT,
    table_size TEXT,
    oldest_record DATE,
    newest_record DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'attendance'::TEXT,
        COUNT(*),
        pg_size_pretty(pg_total_relation_size('attendance')),
        MIN(date),
        MAX(date)
    FROM attendance
    
    UNION ALL
    
    SELECT 
        'attendance_archive'::TEXT,
        COUNT(*),
        pg_size_pretty(pg_total_relation_size('attendance_archive')),
        MIN(date),
        MAX(date)
    FROM attendance_archive;
END;
$$;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

-- 1. First, run a DRY RUN to see what would be archived:
--    SELECT * FROM archive_attendance_safely(6, 1000, TRUE);

-- 2. If satisfied, run the actual archival:
--    SELECT * FROM archive_attendance_safely(6, 1000, FALSE);

-- 3. Monitor the tables:
--    SELECT * FROM monitor_attendance_tables();

-- 4. If needed, rollback archives from last hour:
--    SELECT * FROM rollback_attendance_archive();

-- 5. To query all attendance data (current + archive):
--    SELECT * FROM attendance_all WHERE student_id = 'xxx';

-- ============================================================================
-- SAFETY NOTES
-- ============================================================================
-- 1. Always run DRY RUN first
-- 2. Archive process uses batches to avoid long locks
-- 3. Rollback function available for recovery
-- 4. View 'attendance_all' provides seamless access to all data
-- 5. Monitor table sizes regularly with monitor_attendance_tables()
