-- Black Marks System Schema
-- This schema handles student disciplinary tracking with remedial actions

-- Black marks table to track disciplinary issues
CREATE TABLE IF NOT EXISTS black_marks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Black mark details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'behavioral', 'academic', 'attendance', 'conduct', 'safety'
    severity VARCHAR(50) NOT NULL DEFAULT 'minor', -- 'minor', 'moderate', 'major', 'severe'
    
    -- Remedy and resolution
    remedy_description TEXT NOT NULL, -- What student needs to do to remove the mark
    remedy_type VARCHAR(100) NOT NULL, -- 'assignment', 'community_service', 'reflection', 'apology', 'behavior_plan', 'parent_meeting'
    remedy_due_date DATE,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'in_progress', 'completed', 'resolved', 'expired'
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_category CHECK (category IN ('behavioral', 'academic', 'attendance', 'conduct', 'safety')),
    CONSTRAINT valid_severity CHECK (severity IN ('minor', 'moderate', 'major', 'severe')),
    CONSTRAINT valid_remedy_type CHECK (remedy_type IN ('assignment', 'community_service', 'reflection', 'apology', 'behavior_plan', 'parent_meeting', 'detention', 'counseling')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'in_progress', 'completed', 'resolved', 'expired'))
);

-- Black mark evidence/attachments table
CREATE TABLE IF NOT EXISTS black_mark_evidence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    black_mark_id UUID NOT NULL REFERENCES black_marks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL, -- 'image', 'document', 'video', 'audio'
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student remedy submissions table
CREATE TABLE IF NOT EXISTS black_mark_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    black_mark_id UUID NOT NULL REFERENCES black_marks(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Submission details
    submission_text TEXT,
    submission_files JSONB DEFAULT '[]'::jsonb, -- Array of file URLs
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Teacher review
    teacher_feedback TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'needs_revision'
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id),
    
    CONSTRAINT valid_submission_status CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision'))
);

-- Black mark comments/communication thread
CREATE TABLE IF NOT EXISTS black_mark_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    black_mark_id UUID NOT NULL REFERENCES black_marks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false, -- Private comments only visible to teachers/admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_black_marks_student_id ON black_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_black_marks_teacher_id ON black_marks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_black_marks_school_id ON black_marks(school_id);
CREATE INDEX IF NOT EXISTS idx_black_marks_status ON black_marks(status);
CREATE INDEX IF NOT EXISTS idx_black_marks_created_at ON black_marks(created_at);
CREATE INDEX IF NOT EXISTS idx_black_mark_submissions_black_mark_id ON black_mark_submissions(black_mark_id);
CREATE INDEX IF NOT EXISTS idx_black_mark_comments_black_mark_id ON black_mark_comments(black_mark_id);

-- Row Level Security (RLS) Policies
ALTER TABLE black_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE black_mark_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE black_mark_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE black_mark_comments ENABLE ROW LEVEL SECURITY;

-- Students can only see their own black marks
CREATE POLICY "Students can view their own black marks" ON black_marks
    FOR SELECT USING (
        auth.uid() = student_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

-- Teachers can view black marks for students in their school
CREATE POLICY "Teachers can view school black marks" ON black_marks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher' 
            AND school_id = black_marks.school_id
        )
    );

-- Teachers can create black marks for students in their school
CREATE POLICY "Teachers can create black marks" ON black_marks
    FOR INSERT WITH CHECK (
        auth.uid() = teacher_id AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher' 
            AND school_id = black_marks.school_id
        )
    );

-- Teachers can update black marks they created
CREATE POLICY "Teachers can update their black marks" ON black_marks
    FOR UPDATE USING (
        auth.uid() = teacher_id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
            AND school_id = black_marks.school_id
        )
    );

-- Similar policies for related tables
CREATE POLICY "Black mark evidence access" ON black_mark_evidence
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM black_marks bm
            WHERE bm.id = black_mark_evidence.black_mark_id
            AND (
                bm.student_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role IN ('teacher', 'admin', 'super_admin')
                    AND p.school_id = bm.school_id
                )
            )
        )
    );

CREATE POLICY "Black mark submissions access" ON black_mark_submissions
    FOR ALL USING (
        student_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM black_marks bm
            JOIN profiles p ON p.id = auth.uid()
            WHERE bm.id = black_mark_submissions.black_mark_id
            AND p.role IN ('teacher', 'admin', 'super_admin')
            AND p.school_id = bm.school_id
        )
    );

CREATE POLICY "Black mark comments access" ON black_mark_comments
    FOR ALL USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM black_marks bm
            WHERE bm.id = black_mark_comments.black_mark_id
            AND (
                bm.student_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role IN ('teacher', 'admin', 'super_admin')
                    AND p.school_id = bm.school_id
                )
            )
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_black_marks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_black_marks_updated_at_trigger
    BEFORE UPDATE ON black_marks
    FOR EACH ROW
    EXECUTE FUNCTION update_black_marks_updated_at();

-- Function to get student's black marks with details
CREATE OR REPLACE FUNCTION get_student_black_marks(student_uuid UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    category VARCHAR,
    severity VARCHAR,
    remedy_description TEXT,
    remedy_type VARCHAR,
    remedy_due_date DATE,
    status VARCHAR,
    teacher_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bm.id,
        bm.title,
        bm.description,
        bm.category,
        bm.severity,
        bm.remedy_description,
        bm.remedy_type,
        bm.remedy_due_date,
        bm.status,
        CONCAT(tp.first_name, ' ', tp.last_name) as teacher_name,
        bm.created_at,
        bm.resolution_notes,
        bm.resolved_at
    FROM black_marks bm
    JOIN profiles tp ON tp.id = bm.teacher_id
    WHERE bm.student_id = student_uuid
    ORDER BY bm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get teacher's assigned black marks
CREATE OR REPLACE FUNCTION get_teacher_black_marks(teacher_uuid UUID, target_school_id UUID)
RETURNS TABLE (
    id UUID,
    student_name TEXT,
    student_id UUID,
    title VARCHAR,
    description TEXT,
    category VARCHAR,
    severity VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    remedy_due_date DATE
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bm.id,
        CONCAT(sp.first_name, ' ', sp.last_name) as student_name,
        bm.student_id,
        bm.title,
        bm.description,
        bm.category,
        bm.severity,
        bm.status,
        bm.created_at,
        bm.remedy_due_date
    FROM black_marks bm
    JOIN profiles sp ON sp.id = bm.student_id
    WHERE bm.teacher_id = teacher_uuid 
    AND bm.school_id = target_school_id
    ORDER BY bm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON black_marks TO authenticated;
GRANT ALL ON black_mark_evidence TO authenticated;
GRANT ALL ON black_mark_submissions TO authenticated;
GRANT ALL ON black_mark_comments TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_black_marks TO authenticated;
GRANT EXECUTE ON FUNCTION get_teacher_black_marks TO authenticated;
