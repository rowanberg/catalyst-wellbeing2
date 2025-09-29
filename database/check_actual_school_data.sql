-- Check what's actually in the school record
SELECT 
    s.*,
    'Raw school data' as source
FROM schools s 
WHERE s.id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';

-- Check if ANY schools exist at all
SELECT 
    COUNT(*) as total_schools,
    'Total schools in database' as info
FROM schools;

-- Check if the school_id exists in ANY school record
SELECT 
    s.id,
    s.name,
    'Found school with this ID' as info
FROM schools s 
WHERE s.id::text LIKE '%f2baa26b%';

-- Check what school_ids actually exist
SELECT 
    s.id,
    s.name,
    s.email,
    'All schools in database' as info
FROM schools s 
ORDER BY s.created_at DESC
LIMIT 10;

-- Check school_details table too
SELECT 
    sd.*,
    'School details data' as source
FROM school_details sd 
WHERE sd.school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8';

-- Check if school_details table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'school_details' 
ORDER BY ordinal_position;

-- Check if ANY school_details records exist
SELECT 
    COUNT(*) as total_school_details,
    'Total school_details records' as info
FROM school_details;

-- Check what columns exist in schools table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'schools' 
ORDER BY ordinal_position;
