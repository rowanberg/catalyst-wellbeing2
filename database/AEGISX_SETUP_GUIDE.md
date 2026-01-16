# AegisX NFC Access Control System - Setup Guide

## Overview
The AegisX system provides comprehensive NFC-based access control and digital student ID management for schools. This document explains how to set up the database and integrate it with the frontend.

## Database Setup

### Step 1: Run the SQL Migration

1. Open your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Open the file: `database/aegisx_nfc_system.sql`
4. Copy and paste the entire contents into the SQL Editor
5. Click **Run** to execute the migration

This will create the following tables:
- `nfc_readers` - Physical NFC reader devices
- `nfc_cards` - Student NFC cards linked to profiles
- `nfc_access_logs` - Access attempt logs
- `student_info` - Extended student information
- `nfc_reader_stats` - Daily reader statistics

### Step 2: Verify Table Creation

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'nfc_%' OR table_name = 'student_info'
ORDER BY table_name;
```

You should see 5 tables listed.

### Step 3: Initial Data Setup (Optional)

To add sample readers for testing, run:

```sql
-- Get your school_id first
SELECT id, name FROM schools;

-- Replace YOUR_SCHOOL_ID with actual school ID
INSERT INTO nfc_readers (school_id, name, serial_number, location, location_type, status)
VALUES 
    ('YOUR_SCHOOL_ID', 'Main Library Entrance', 'NFC-LIB-001', 'Building A, Ground Floor', 'library', 'online'),
    ('YOUR_SCHOOL_ID', 'Canteen Point A', 'NFC-CAN-001', 'Student Center', 'canteen', 'online'),
    ('YOUR_SCHOOL_ID', 'North Gate', 'NFC-GATE-001', 'Main Campus Entry', 'gate', 'online'),
    ('YOUR_SCHOOL_ID', 'Chemistry Lab', 'NFC-LAB-001', 'Science Block, Room 302', 'lab', 'online');
```

## Frontend Integration

### Admin Dashboard (`/admin/aegisx`)

The admin dashboard automatically fetches real data from the database:

**Features:**
- View all NFC readers with live status
- Create new readers
- Monitor access logs in real-time
- View statistics (total scans, online readers, etc.)
- Delete or manage readers

**API Endpoints Used:**
- `GET /api/admin/aegisx/readers` - Fetch all readers
- `POST /api/admin/aegisx/readers` - Create new reader
- `DELETE /api/admin/aegisx/readers?id={id}` - Delete reader
- `GET /api/admin/aegisx/logs` - Fetch access logs

### Student Dashboard (`/aegisx`)

Students can view their digital ID and NFC card status:

**Features:**
- View digital student ID card (front and back)
- Check NFC card link status
- See card validity and expiration
- View access statistics

## Data Flow

### Creating a New Reader

1. Admin clicks "Add Reader" button
2. Fills in reader details:
   - Reader Name (e.g., "Main Library Entrance")
   - Location Type (library, canteen, gate, lab, etc.)
   - Building/Floor location
   - Serial Number (unique identifier)
3. POST request sent to `/api/admin/aegisx/readers`
4. Database validates serial number uniqueness
5. New reader inserted into `nfc_readers` table
6. Reader appears immediately in the dashboard

### Logging NFC Access

When a student taps their NFC card:

```sql
-- This function is called by the NFC reader system
SELECT log_nfc_access(
    'reader-uuid',           -- Reader ID
    'CARD-UID-12345',       -- NFC card UID
    true,                    -- Access granted?
    NULL                     -- Denial reason (if denied)
);
```

This automatically:
1. Looks up the student by card UID
2. Records the access attempt in `nfc_access_logs`
3. Updates reader statistics
4. Updates daily statistics

### Viewing Access Logs

Admins see real-time access logs showing:
- Student name and tag
- Reader name and location
- Access granted/denied status
- Timestamp (e.g., "2 mins ago")
- Denial reason (if applicable)

## Database Schema Overview

### `nfc_readers`
```
- id (UUID, primary key)
- school_id (UUID, foreign key to schools)
- name (varchar)
- serial_number (varchar, unique)
- location (varchar)
- location_type (enum: library, canteen, gate, lab, etc.)
- status (enum: online, offline, maintenance)
- total_scans (integer)
- today_scans (integer)
- created_at (timestamp)
```

### `nfc_cards`
```
- id (UUID, primary key)
- school_id (UUID)
- card_uid (varchar, unique) - Physical card UID
- student_id (UUID, foreign key to auth.users)
- status (enum: active, inactive, lost, stolen, expired)
- linked_at (timestamp)
- expires_at (timestamp)
```

### `nfc_access_logs`
```
- id (UUID, primary key)
- school_id (UUID)
- reader_id (UUID, foreign key to nfc_readers)
- card_id (UUID, foreign key to nfc_cards)
- student_id (UUID)
- student_name (varchar) - Denormalized for performance
- access_granted (boolean)
- denial_reason (varchar)
- created_at (timestamp)
```

### `student_info`
```
- id (UUID, primary key)
- student_id (UUID, foreign key to auth.users)
- school_id (UUID)
- date_of_birth (date)
- blood_group (varchar)
- emergency_contact_name (varchar)
- emergency_contact_phone (varchar)
- grade_level (varchar)
- class_name (varchar)
- admission_date (date)
- medical_conditions (text, encrypted)
```

## Security (Row Level Security)

All tables have RLS enabled:

**Admins can:**
- View/manage all readers in their school
- View all access logs in their school
- Manage student info in their school

**Students can:**
- View their own NFC card info
- View their own access logs
- View/update their own student info

**Teachers can:**
- View readers in their school

## API Implementation Details

### GET `/api/admin/aegisx/readers`

```typescript
// Fetches all readers for the admin's school
const { data: readers } = await supabase
    .from('nfc_readers')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })
```

### POST `/api/admin/aegisx/readers`

```typescript
// Creates a new reader
const { data: newReader } = await supabase
    .from('nfc_readers')
    .insert({
        school_id: profile.school_id,
        name,
        location,
        location_type: type,
        serial_number: serialNumber,
        status: 'online',
        enabled: true,
        total_scans: 0,
        today_scans: 0,
        created_by: session.user.id
    })
    .select()
    .single()
```

### GET `/api/admin/aegisx/logs`

```typescript
// Fetches access logs with reader and student info
const { data: accessLogs } = await supabase
    .from('nfc_access_logs')
    .select(`
        id,
        created_at,
        access_granted,
        student_name,
        reader:reader_id (
            id,
            name
        )
    `)
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })
    .limit(50)
```

## Testing the System

### 1. Test Reader Creation
1. Login as admin
2. Navigate to `/admin/aegisx`
3. Click "Add Reader"
4. Fill in details and submit
5. Verify reader appears in the list

### 2. Verify Database
```sql
-- Check readers
SELECT * FROM nfc_readers;

-- Check stats
SELECT * FROM nfc_reader_stats;
```

### 3. Test Access Logging (Manual)
```sql
-- Simulate an NFC card tap
SELECT log_nfc_access(
    (SELECT id FROM nfc_readers LIMIT 1),  -- First reader
    'TEST-CARD-UID-001',                    -- Test card UID
    true,                                    -- Access granted
    NULL                                     -- No denial reason
);

-- View the log
SELECT * FROM nfc_access_logs ORDER BY created_at DESC LIMIT 1;
```

## Maintenance

### Reset Daily Scans
Run this daily (can be automated with pg_cron):
```sql
SELECT reset_reader_daily_scans();
```

### View Reader Statistics
```sql
SELECT 
    r.name,
    r.today_scans,
    r.total_scans,
    r.status,
    r.last_sync
FROM nfc_readers r
WHERE r.school_id = 'YOUR_SCHOOL_ID'
ORDER BY r.today_scans DESC;
```

### View Recent Access Logs
```sql
SELECT 
    l.created_at,
    l.student_name,
    r.name as reader_name,
    l.access_granted,
    l.denial_reason
FROM nfc_access_logs l
JOIN nfc_readers r ON r.id = l.reader_id
WHERE l.school_id = 'YOUR_SCHOOL_ID'
ORDER BY l.created_at DESC
LIMIT 20;
```

## Troubleshooting

### Issue: "NFC readers table not found"
**Solution:** Run the `database/aegisx_nfc_system.sql` migration

### Issue: Readers not appearing
**Solutions:**
1. Check RLS policies are enabled
2. Verify user has admin role
3. Ensure school_id matches between user and readers

### Issue: Cannot create readers
**Solutions:**
1. Verify serial number is unique
2. Check user has admin permissions
3. Verify all required fields are provided

## Next Steps

1. **Link NFC Cards to Students:**
   - Add UI for students to link their physical NFC cards
   - Scan card UID and store in `nfc_cards` table

2. **Physical Reader Integration:**
   - Set up actual NFC readers
   - Configure them to call the `log_nfc_access` function

3. **Analytics Dashboard:**
   - Create charts showing usage patterns
   - Peak hours analysis
   - Most used readers

4. **Notifications:**
   - Alert admins of denied access attempts
   - Notify students of card expiration

## Support

For issues or questions, refer to the main application documentation or contact the development team.
