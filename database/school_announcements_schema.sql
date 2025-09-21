-- School Announcements Table
-- This table stores announcements created by admins for display to students

CREATE TABLE IF NOT EXISTS school_announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'teachers', 'parents')),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_school_announcements_school_id ON school_announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_school_announcements_created_at ON school_announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_school_announcements_active ON school_announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_school_announcements_priority ON school_announcements(priority);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_school_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_school_announcements_updated_at ON school_announcements;

CREATE TRIGGER trigger_update_school_announcements_updated_at
    BEFORE UPDATE ON school_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_school_announcements_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE school_announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage school announcements" ON school_announcements;
DROP POLICY IF EXISTS "Students can view active announcements" ON school_announcements;
DROP POLICY IF EXISTS "Teachers can view active announcements" ON school_announcements;
DROP POLICY IF EXISTS "Parents can view active announcements" ON school_announcements;

-- Policy for admins to manage announcements in their school
CREATE POLICY "Admins can manage school announcements" ON school_announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin' 
            AND profiles.school_id = school_announcements.school_id
        )
    );

-- Policy for students to view active announcements in their school
CREATE POLICY "Students can view active announcements" ON school_announcements
    FOR SELECT USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (target_audience IN ('all', 'students'))
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.school_id = school_announcements.school_id
        )
    );

-- Policy for teachers to view active announcements in their school
CREATE POLICY "Teachers can view active announcements" ON school_announcements
    FOR SELECT USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (target_audience IN ('all', 'teachers'))
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'teacher'
            AND profiles.school_id = school_announcements.school_id
        )
    );

-- Policy for parents to view active announcements in their school
CREATE POLICY "Parents can view active announcements" ON school_announcements
    FOR SELECT USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (target_audience IN ('all', 'parents'))
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'parent'
            AND profiles.school_id = school_announcements.school_id
        )
    );
