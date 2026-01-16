-- =====================================================
-- Teacher Info Table for Digital ID System
-- =====================================================
-- Stores additional teacher information for digital ID cards
-- Similar to student_info but tailored for staff
-- =====================================================

-- Create teacher_info table if not exists
CREATE TABLE IF NOT EXISTS teacher_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Professional Information
    department VARCHAR(100), -- e.g., "Science", "Mathematics", "Administration"
    designation VARCHAR(100), -- e.g., "Senior Teacher", "Department Head", "Principal"
    specialization VARCHAR(255), -- e.g., "Physics", "Organic Chemistry"
    qualification VARCHAR(255), -- e.g., "M.Ed", "Ph.D", "B.Ed"
    experience_years INTEGER,
    date_of_joining DATE,
    employee_id VARCHAR(50), -- School's internal employee ID
    
    -- Personal Information
    date_of_birth DATE,
    blood_group VARCHAR(5),
    gender VARCHAR(20),
    
    -- Contact Information
    personal_email VARCHAR(255),
    personal_phone VARCHAR(20),
    address TEXT,
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    
    -- Documents (URLs to uploaded documents)
    profile_picture_url TEXT,
    id_proof_url TEXT,
    qualification_docs_url TEXT,
    
    -- Medical Information (encrypted in production)
    medical_conditions TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_info_school ON teacher_info(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_info_teacher ON teacher_info(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_info_department ON teacher_info(department);

-- Enable RLS
ALTER TABLE teacher_info ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Teachers can view own info" ON teacher_info;
CREATE POLICY "Teachers can view own info" ON teacher_info
    FOR SELECT USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can update own info" ON teacher_info;
CREATE POLICY "Teachers can update own info" ON teacher_info
    FOR UPDATE USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Admins can manage teacher info in their school" ON teacher_info;
CREATE POLICY "Admins can manage teacher info in their school" ON teacher_info
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.school_id = teacher_info.school_id
        )
    );

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_teacher_info_updated_at ON teacher_info;
CREATE TRIGGER update_teacher_info_updated_at
    BEFORE UPDATE ON teacher_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Update NFC cards table comments to clarify multi-role usage
-- =====================================================
COMMENT ON COLUMN nfc_cards.student_id IS 'References user ID - can be student, teacher, or staff member despite column name';

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON teacher_info TO authenticated;

SELECT 'Teacher Info table and policies created successfully!' as status;
