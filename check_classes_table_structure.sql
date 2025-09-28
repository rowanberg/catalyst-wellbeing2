-- Check the actual structure of the classes table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'classes' 
ORDER BY ordinal_position;

-- Also check what data is currently in the classes table
SELECT * FROM classes LIMIT 10;
