# Timetable Management System - Database Setup Guide

## 📋 Overview

This guide provides complete instructions for setting up the timetable management system database infrastructure. The system includes tables, functions, RLS policies, triggers, and seed data for managing school timetables efficiently.

## 🗂️ Files Included

1. **`timetable_management_schema.sql`** - Core database tables, indexes, RLS policies, and triggers
2. **`timetable_management_functions.sql`** - Database functions for CRUD operations and business logic
3. **`timetable_management_seed.sql`** - Initial sample data for subjects, schemes, and configurations

## ⚙️ Installation Steps

### Prerequisites

- PostgreSQL database (Supabase recommended)
- Existing `schools`, `profiles`, and `classes` tables
- Admin access to the database

### Step 1: Run Schema File

Execute the schema file first to create all tables and security policies:

```bash
psql -h your-host -U your-user -d your-database -f timetable_management_schema.sql
```

Or in Supabase SQL Editor:
1. Open SQL Editor
2. Copy contents of `timetable_management_schema.sql`
3. Click "Run"

**This creates:**
- ✅ `subjects` table
- ✅ `timetable_schemes` table
- ✅ `timetable_time_slots` table
- ✅ `timetable_entries` table
- ✅ `teacher_capabilities` table
- ✅ `timetable_conflicts` table
- ✅ `timetable_history` table
- ✅ All indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Automatic triggers for updates and history logging

### Step 2: Run Functions File

Execute the functions file to add database functions:

```bash
psql -h your-host -U your-user -d your-database -f timetable_management_functions.sql
```

**This creates:**
- ✅ `get_timetable_for_class()` - Retrieve complete timetable
- ✅ `get_teacher_schedule()` - Get teacher's schedule
- ✅ `create_timetable_entry()` - Create with validation
- ✅ `update_timetable_entry()` - Update existing entry
- ✅ `delete_timetable_entry()` - Soft delete entry
- ✅ `detect_teacher_conflicts()` - Find double-bookings
- ✅ `detect_room_conflicts()` - Find room conflicts
- ✅ `get_teacher_workload()` - Calculate workload
- ✅ `get_subject_distribution()` - Analyze subject balance
- ✅ `copy_timetable_to_class()` - Bulk copy
- ✅ `clear_timetable_for_class()` - Clear all entries
- ✅ `validate_timetable_completeness()` - Check completion
- ✅ `get_available_teachers_for_slot()` - Find available teachers
- ✅ `create_default_timetable_scheme()` - Quick setup
- ✅ `bulk_create_timetable_entries()` - Bulk insert

### Step 3: Run Seed Data (Optional but Recommended)

Execute the seed file to populate initial data:

```bash
psql -h your-host -U your-user -d your-database -f timetable_management_seed.sql
```

**This creates:**
- ✅ 15 common subjects (Math, English, Science, etc.)
- ✅ 3 timetable schemes (6-period, 7-period, 5-period)
- ✅ Time slots for each scheme
- ✅ Default teacher capabilities

## 📊 Database Structure

### Core Tables

#### 1. **subjects**
Stores all subjects/courses offered by the school.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| school_id | UUID | FK to schools |
| name | VARCHAR(100) | Subject name (e.g., "Mathematics") |
| code | VARCHAR(20) | Subject code (e.g., "MATH") |
| description | TEXT | Subject description |
| color | VARCHAR(7) | Hex color for UI |
| is_active | BOOLEAN | Active status |

#### 2. **timetable_schemes**
Configuration templates for timetable structure.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| school_id | UUID | FK to schools |
| name | VARCHAR(100) | Scheme name |
| description | TEXT | Description |
| working_days | TEXT[] | Array of working days |
| periods_per_day | INTEGER | Number of teaching periods |
| is_default | BOOLEAN | Default scheme flag |
| is_active | BOOLEAN | Active status |

#### 3. **timetable_time_slots**
Individual time slots (periods, breaks, lunch).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| scheme_id | UUID | FK to timetable_schemes |
| slot_type | VARCHAR(20) | 'period', 'break', or 'lunch' |
| label | VARCHAR(50) | Slot label (e.g., "Period 1") |
| start_time | TIME | Start time |
| end_time | TIME | End time |
| slot_order | INTEGER | Order in the day |
| duration_minutes | INTEGER | Auto-calculated duration |

#### 4. **timetable_entries**
Actual timetable assignments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| school_id | UUID | FK to schools |
| class_id | UUID | FK to classes |
| subject_id | UUID | FK to subjects |
| teacher_id | UUID | FK to profiles (teachers) |
| time_slot_id | UUID | FK to timetable_time_slots |
| day_of_week | VARCHAR(10) | Day name |
| room_number | VARCHAR(20) | Room assignment |
| notes | TEXT | Optional notes |
| is_active | BOOLEAN | Active status |
| created_by | UUID | Admin who created |
| updated_by | UUID | Admin who last updated |

#### 5. **teacher_capabilities**
Teacher preferences and capabilities for AI generation.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| school_id | UUID | FK to schools |
| teacher_id | UUID | FK to profiles |
| subject_ids | UUID[] | Array of subject IDs |
| grade_levels | TEXT[] | Array of grade levels |
| max_periods_per_day | INTEGER | Maximum daily periods |
| max_periods_per_week | INTEGER | Maximum weekly periods |
| preferred_days | TEXT[] | Preferred working days |
| unavailable_slots | JSONB | Array of unavailable times |
| specializations | TEXT[] | Special qualifications |

#### 6. **timetable_conflicts**
Detected conflicts for review.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| school_id | UUID | FK to schools |
| conflict_type | VARCHAR(50) | Type of conflict |
| severity | VARCHAR(20) | low/medium/high/critical |
| entry_ids | UUID[] | Array of conflicting entry IDs |
| description | TEXT | Conflict description |
| is_resolved | BOOLEAN | Resolution status |

#### 7. **timetable_history**
Audit log for all changes.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| school_id | UUID | FK to schools |
| entry_id | UUID | FK to timetable_entries |
| action | VARCHAR(20) | CREATE/UPDATE/DELETE |
| changed_by | UUID | User who made change |
| old_data | JSONB | Previous state |
| new_data | JSONB | New state |
| change_reason | TEXT | Reason for change |

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:

1. **School Isolation** - Users can only access data from their school
2. **Role-Based Access** - Admins have full CRUD, others have limited access
3. **Teacher Self-Service** - Teachers can manage their own capabilities
4. **Read Access** - All authenticated users can view timetables from their school

### Automatic Triggers

1. **Updated At Trigger** - Automatically updates `updated_at` timestamp
2. **History Logging** - All changes to `timetable_entries` are logged
3. **Single Default Scheme** - Ensures only one scheme is marked as default per school

## 📝 Example Usage

### Creating a Timetable Entry

```sql
SELECT create_timetable_entry(
    'school-uuid',      -- school_id
    'class-uuid',       -- class_id
    'subject-uuid',     -- subject_id
    'teacher-uuid',     -- teacher_id
    'timeslot-uuid',    -- time_slot_id
    'Monday',           -- day_of_week
    'R101',             -- room_number
    'Lab session',      -- notes
    auth.uid()          -- created_by
);
```

### Getting Class Timetable

```sql
SELECT * FROM get_timetable_for_class('class-uuid');
```

### Detecting Conflicts

```sql
SELECT * FROM detect_teacher_conflicts(
    'teacher-uuid',
    'Monday',
    'timeslot-uuid'
);
```

### Copying Timetable

```sql
SELECT copy_timetable_to_class(
    'source-class-uuid',
    'target-class-uuid',
    'school-uuid'
);
```

### Validating Completeness

```sql
SELECT * FROM validate_timetable_completeness(
    'class-uuid',
    'scheme-uuid'
);
```

## 🔌 API Integration Guide

### Recommended API Endpoints

Create these Next.js API routes to interact with the database:

#### 1. **GET `/api/admin/timetable/subjects`**
```typescript
// Fetch all subjects for the school
const { data } = await supabase
  .from('subjects')
  .select('*')
  .eq('school_id', schoolId)
  .eq('is_active', true);
```

#### 2. **GET `/api/admin/timetable/schemes`**
```typescript
// Fetch all timetable schemes
const { data } = await supabase
  .from('timetable_schemes')
  .select(`
    *,
    time_slots:timetable_time_slots(*)
  `)
  .eq('school_id', schoolId)
  .order('is_default', { ascending: false });
```

#### 3. **GET `/api/admin/timetable/entries?classId=xxx`**
```typescript
// Fetch timetable for a class
const { data } = await supabase
  .rpc('get_timetable_for_class', {
    p_class_id: classId,
    p_school_id: schoolId
  });
```

#### 4. **POST `/api/admin/timetable/entries`**
```typescript
// Create a new timetable entry
const { data } = await supabase
  .rpc('create_timetable_entry', {
    p_school_id: schoolId,
    p_class_id: classId,
    p_subject_id: subjectId,
    p_teacher_id: teacherId,
    p_time_slot_id: timeSlotId,
    p_day_of_week: dayOfWeek,
    p_room_number: roomNumber,
    p_notes: notes
  });
```

#### 5. **PUT `/api/admin/timetable/entries/:id`**
```typescript
// Update an existing entry
const { data } = await supabase
  .rpc('update_timetable_entry', {
    p_entry_id: entryId,
    p_subject_id: subjectId,
    p_teacher_id: teacherId,
    p_room_number: roomNumber
  });
```

#### 6. **DELETE `/api/admin/timetable/entries/:id`**
```typescript
// Soft delete an entry
const { data } = await supabase
  .rpc('delete_timetable_entry', {
    p_entry_id: entryId
  });
```

#### 7. **GET `/api/admin/timetable/validate?classId=xxx`**
```typescript
// Validate timetable completeness
const { data } = await supabase
  .rpc('validate_timetable_completeness', {
    p_class_id: classId,
    p_scheme_id: schemeId
  });
```

#### 8. **GET `/api/admin/timetable/conflicts/teacher`**
```typescript
// Check for teacher conflicts
const { data } = await supabase
  .rpc('detect_teacher_conflicts', {
    p_teacher_id: teacherId,
    p_day_of_week: dayOfWeek,
    p_time_slot_id: timeSlotId
  });
```

#### 9. **GET `/api/admin/timetable/workload/:teacherId`**
```typescript
// Get teacher workload
const { data } = await supabase
  .rpc('get_teacher_workload', {
    p_teacher_id: teacherId,
    p_school_id: schoolId
  });
```

#### 10. **POST `/api/admin/timetable/copy`**
```typescript
// Copy timetable between classes
const { data } = await supabase
  .rpc('copy_timetable_to_class', {
    p_source_class_id: sourceClassId,
    p_target_class_id: targetClassId,
    p_school_id: schoolId
  });
```

## 🧪 Testing Queries

### Verify Installation

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'timetable_%'
  OR table_name = 'subjects'
  OR table_name = 'teacher_capabilities';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'subjects', 'timetable_schemes', 'timetable_time_slots',
    'timetable_entries', 'teacher_capabilities',
    'timetable_conflicts', 'timetable_history'
  );

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%timetable%';
```

### Sample Test Data

```sql
-- View created schemes
SELECT * FROM timetable_schemes ORDER BY is_default DESC;

-- View time slots for default scheme
SELECT ts.*, tts.* 
FROM timetable_schemes ts
JOIN timetable_time_slots tts ON tts.scheme_id = ts.id
WHERE ts.is_default = true
ORDER BY tts.slot_order;

-- View subjects
SELECT * FROM subjects ORDER BY name;

-- View teacher capabilities
SELECT 
    tc.*,
    p.first_name || ' ' || p.last_name as teacher_name
FROM teacher_capabilities tc
JOIN profiles p ON p.user_id = tc.teacher_id;
```

## 🚨 Troubleshooting

### Issue: Foreign Key Constraint Errors

**Solution:** Ensure prerequisite tables exist:
```sql
-- Check required tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('schools', 'profiles', 'classes');
```

### Issue: RLS Blocking Queries

**Solution:** Temporarily disable RLS for testing (NOT for production):
```sql
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
-- Re-enable after testing
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
```

### Issue: Duplicate Key Violations

**Solution:** Check for existing data:
```sql
-- Clear existing timetable data
UPDATE timetable_entries SET is_active = false;
DELETE FROM timetable_time_slots;
DELETE FROM timetable_schemes;
```

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the test queries
3. Verify RLS policies are correctly configured
4. Ensure school_id and user authentication are set up properly

## ✅ Post-Installation Checklist

- [ ] Schema file executed successfully
- [ ] Functions file executed successfully
- [ ] Seed data loaded
- [ ] All tables created
- [ ] RLS policies enabled
- [ ] Triggers working
- [ ] Sample data visible
- [ ] API endpoints created
- [ ] Frontend integrated
- [ ] Testing completed

---

**Version:** 1.0.0  
**Last Updated:** November 2024  
**Compatibility:** PostgreSQL 12+, Supabase
