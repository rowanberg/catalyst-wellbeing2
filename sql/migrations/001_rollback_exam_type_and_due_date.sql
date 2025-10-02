-- Rollback Migration: Remove exam type and due_date from assessments table
-- Created: 2025-10-02
-- Description: Reverts changes made in 001_add_exam_type_and_due_date_to_assessments.sql

-- Step 1: Drop indexes
DROP INDEX IF EXISTS idx_assessments_due_date;
DROP INDEX IF EXISTS idx_assessments_type;
DROP INDEX IF EXISTS idx_assessments_class_id;

-- Step 2: Drop foreign key constraint
ALTER TABLE assessments 
DROP CONSTRAINT IF EXISTS fk_assessments_class_id;

-- Step 3: Drop class_id column
ALTER TABLE assessments 
DROP COLUMN IF EXISTS class_id;

-- Step 4: Drop due_date column
ALTER TABLE assessments 
DROP COLUMN IF EXISTS due_date;

-- Step 5: Restore original type constraint (without 'exam')
ALTER TABLE assessments 
DROP CONSTRAINT IF EXISTS assessments_type_check;

ALTER TABLE assessments 
ADD CONSTRAINT assessments_type_check 
CHECK (type IN ('quiz', 'test', 'assignment', 'project'));

-- Verification query to check the rollback
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'assessments' 
-- AND column_name IN ('due_date', 'class_id', 'type');
