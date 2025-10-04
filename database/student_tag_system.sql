-- Student Tag System for Wallet Transactions
-- Each student gets a unique 12-digit transaction tag

-- Add student_tag column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS student_tag VARCHAR(12) UNIQUE;

-- Function to generate unique 12-digit student tag
CREATE OR REPLACE FUNCTION generate_student_tag() RETURNS VARCHAR(12) AS $$
DECLARE
    new_tag VARCHAR(12);
    tag_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 12-digit tag (format: XXXX-XXXX-XXXX for readability)
        new_tag := LPAD(FLOOR(RANDOM() * 1000000000000)::TEXT, 12, '0');
        
        -- Check if tag already exists
        SELECT EXISTS(SELECT 1 FROM profiles WHERE student_tag = new_tag) INTO tag_exists;
        
        -- Exit loop if tag is unique
        EXIT WHEN NOT tag_exists;
    END LOOP;
    
    RETURN new_tag;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate student tag for new students
CREATE OR REPLACE FUNCTION set_student_tag() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.student_tag IS NULL AND NEW.role = 'student' THEN
        NEW.student_tag := generate_student_tag();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_student_tag
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_student_tag();

-- Generate tags for existing students without tags
UPDATE profiles 
SET student_tag = generate_student_tag()
WHERE role = 'student' AND student_tag IS NULL;

-- Create index for faster tag lookups
CREATE INDEX IF NOT EXISTS idx_profiles_student_tag ON profiles(student_tag);

-- Function to get classmates with their tags
CREATE OR REPLACE FUNCTION get_classmates_with_tags(student_uuid UUID)
RETURNS TABLE (
    id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    student_tag VARCHAR,
    wallet_address VARCHAR,
    class_name VARCHAR,
    grade_level VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.id,
        p.first_name,
        p.last_name,
        p.student_tag,
        sw.wallet_address,
        c.name as class_name,
        gl.name as grade_level
    FROM profiles p
    INNER JOIN student_class_assignments sca1 ON p.id = sca1.student_id
    INNER JOIN student_class_assignments sca2 ON sca1.class_id = sca2.class_id
    LEFT JOIN student_wallets sw ON p.id = sw.student_id
    LEFT JOIN classes c ON sca1.class_id = c.id
    LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
    WHERE sca2.student_id = student_uuid
        AND p.id != student_uuid
        AND p.role = 'student'
        AND sca1.is_active = true
        AND sca2.is_active = true
    ORDER BY p.first_name, p.last_name;
END;
$$ LANGUAGE plpgsql;

-- Add student_tag to wallet_transactions for easier lookup
ALTER TABLE wallet_transactions
ADD COLUMN IF NOT EXISTS from_student_tag VARCHAR(12),
ADD COLUMN IF NOT EXISTS to_student_tag VARCHAR(12);

-- Create indexes for tag-based transaction lookups
CREATE INDEX IF NOT EXISTS idx_transactions_from_tag ON wallet_transactions(from_student_tag);
CREATE INDEX IF NOT EXISTS idx_transactions_to_tag ON wallet_transactions(to_student_tag);

-- Function to lookup wallet by student tag
CREATE OR REPLACE FUNCTION get_wallet_by_student_tag(tag VARCHAR(12))
RETURNS TABLE (
    wallet_id UUID,
    wallet_address VARCHAR,
    student_id UUID,
    student_name VARCHAR,
    student_tag VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sw.id as wallet_id,
        sw.wallet_address,
        p.id as student_id,
        CONCAT(p.first_name, ' ', p.last_name) as student_name,
        p.student_tag
    FROM profiles p
    INNER JOIN student_wallets sw ON p.id = sw.student_id
    WHERE p.student_tag = tag
        AND p.role = 'student';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_classmates_with_tags(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_wallet_by_student_tag(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_student_tag() TO authenticated;
