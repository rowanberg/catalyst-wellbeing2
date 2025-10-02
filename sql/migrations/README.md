# Database Migrations

This directory contains SQL migration files for the Catalyst application database.

## Migration Files

### 001_add_exam_type_and_due_date_to_assessments.sql
**Purpose**: Adds 'exam' type to assessments and includes due date functionality

**Changes**:
- Adds `due_date` column (TIMESTAMP WITH TIME ZONE, nullable)
- Adds `exam` to the assessment type constraint
- Adds `class_id` column with foreign key to classes table
- Creates performance indexes on `due_date`, `type`, and `class_id`

**Dependencies**: Requires `assessments` and `classes` tables to exist

### 001_rollback_exam_type_and_due_date.sql
**Purpose**: Rollback migration for the above changes

**Changes**:
- Removes `due_date` column
- Removes `class_id` column
- Restores original type constraint (without 'exam')
- Drops all related indexes

## How to Run Migrations

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the migration file content
5. Click **Run** to execute

### Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migration
supabase db push

# Or manually run SQL file
psql -h your-db-host -U postgres -d postgres -f 001_add_exam_type_and_due_date_to_assessments.sql
```

### Using psql directly

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]/postgres" -f 001_add_exam_type_and_due_date_to_assessments.sql
```

## Rollback Procedure

If you need to rollback a migration:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]/postgres" -f 001_rollback_exam_type_and_due_date.sql
```

## Verification

After running the migration, verify the changes:

```sql
-- Check columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND column_name IN ('due_date', 'class_id', 'type');

-- Check constraint includes 'exam'
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'assessments_type_check';

-- Check indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'assessments'
AND indexname LIKE 'idx_assessments%';
```

## Migration Naming Convention

Format: `{number}_{description}.sql`

- **number**: Sequential number (e.g., 001, 002, 003)
- **description**: Brief description using snake_case
- **rollback**: Add `rollback_` prefix for rollback scripts

Examples:
- `001_add_exam_type_and_due_date_to_assessments.sql`
- `001_rollback_exam_type_and_due_date.sql`
- `002_add_student_preferences_table.sql`

## Best Practices

1. **Always test migrations** in development before production
2. **Create rollback scripts** for every migration
3. **Use IF EXISTS/IF NOT EXISTS** to make migrations idempotent
4. **Add comments** to explain complex changes
5. **Create indexes** for frequently queried columns
6. **Backup database** before running migrations in production

## Troubleshooting

### Migration fails with "column already exists"
- The migration may have been partially applied
- Check which parts completed successfully
- Either complete manually or run rollback and retry

### Migration fails with "constraint already exists"
- Drop the constraint first: `ALTER TABLE table_name DROP CONSTRAINT IF EXISTS constraint_name;`
- Then re-run the migration

### Permission errors
- Ensure you're using the correct database credentials
- Verify your user has sufficient permissions
- For Supabase, use the service role key for admin operations

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review migration logs for error messages
3. Consult the development team
