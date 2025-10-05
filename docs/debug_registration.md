# Debug Registration Issues

## Common Issues & Solutions:

### 1. School Details Table Missing
**Error**: `table "school_details" does not exist`
**Solution**: Run `create_school_details_table.sql` in Supabase SQL Editor

### 2. Column Name Mismatch  
**Error**: `column "admin_user_id" does not exist`
**Solution**: ✅ Already fixed - changed to `admin_id`

### 3. RLS Policy Issues
**Error**: `insufficient privileges` or `access denied`
**Solution**: 
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'school_details';

-- Temporarily disable RLS for testing (re-enable after)
ALTER TABLE school_details DISABLE ROW LEVEL SECURITY;
```

### 4. API Endpoint Issues
**Check**: Browser Network tab for API call failures
**Check**: Server console for detailed error messages

## Debug Commands:

### Check Recent Registrations:
```sql
SELECT s.name, s.school_code, sd.school_name, sd.setup_completed 
FROM schools s 
LEFT JOIN school_details sd ON s.id = sd.school_id 
ORDER BY s.created_at DESC LIMIT 3;
```

### Check Admin Profiles:
```sql
SELECT p.*, s.name as school_name 
FROM profiles p 
JOIN schools s ON p.school_id = s.id 
WHERE p.role = 'admin' 
ORDER BY p.created_at DESC LIMIT 3;
```

### Test API Manually:
```bash
curl -X POST http://localhost:3000/api/register-school \
  -H "Content-Type: application/json" \
  -d '{
    "schoolName": "Debug Test School",
    "address": "123 Debug St",
    "phone": "555-DEBUG",
    "schoolEmail": "debug@test.school",
    "adminFirstName": "Debug",
    "adminLastName": "Admin", 
    "adminEmail": "debug@admin.test",
    "password": "debugpass123"
  }'
```
