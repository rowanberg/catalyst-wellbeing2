-- Create black_marks table for student disciplinary management
-- This table stores disciplinary actions with remedial requirements

CREATE TABLE IF NOT EXISTS public.black_marks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core relationships
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL,
    
    -- Black mark details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('behavioral', 'academic', 'attendance', 'conduct', 'safety')),
    severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'severe')),
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'resolved')),
    
    -- Remedy/Resolution details
    remedy_description TEXT NOT NULL,
    remedy_type TEXT NOT NULL CHECK (remedy_type IN ('assignment', 'community_service', 'reflection', 'apology', 'behavior_plan', 'parent_meeting', 'detention', 'counseling')),
    remedy_due_date TIMESTAMPTZ,
    remedy_completed_at TIMESTAMPTZ,
    
    -- Additional notes and resolution
    teacher_notes TEXT,
    student_response TEXT,
    resolution_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMPTZ,
    
    -- Indexes for common queries
    CONSTRAINT black_marks_school_fk FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_black_marks_student_id ON public.black_marks(student_id);
CREATE INDEX IF NOT EXISTS idx_black_marks_teacher_id ON public.black_marks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_black_marks_school_id ON public.black_marks(school_id);
CREATE INDEX IF NOT EXISTS idx_black_marks_status ON public.black_marks(status);
CREATE INDEX IF NOT EXISTS idx_black_marks_created_at ON public.black_marks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_black_marks_category ON public.black_marks(category);
CREATE INDEX IF NOT EXISTS idx_black_marks_severity ON public.black_marks(severity);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_black_marks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_black_marks_updated_at
    BEFORE UPDATE ON public.black_marks
    FOR EACH ROW
    EXECUTE FUNCTION update_black_marks_updated_at();

-- Enable Row Level Security
ALTER TABLE public.black_marks ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Teachers can view black marks for students in their school
CREATE POLICY "Teachers can view black marks in their school"
    ON public.black_marks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'teacher'
            AND profiles.school_id = black_marks.school_id
        )
    );

-- Teachers can create black marks for students in their school
CREATE POLICY "Teachers can create black marks in their school"
    ON public.black_marks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'teacher'
            AND profiles.school_id = black_marks.school_id
        )
        AND teacher_id = auth.uid()
    );

-- Teachers can update black marks they created
CREATE POLICY "Teachers can update their own black marks"
    ON public.black_marks
    FOR UPDATE
    TO authenticated
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

-- Students can view their own black marks
CREATE POLICY "Students can view their own black marks"
    ON public.black_marks
    FOR SELECT
    TO authenticated
    USING (
        student_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'student'
        )
    );

-- Students can update the student_response field for their own black marks
CREATE POLICY "Students can update their response"
    ON public.black_marks
    FOR UPDATE
    TO authenticated
    USING (
        student_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'student'
        )
    )
    WITH CHECK (
        student_id = auth.uid()
        AND status IN ('active', 'in_progress')
    );

-- Admins can view all black marks in their school
CREATE POLICY "Admins can view all black marks in their school"
    ON public.black_marks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
            AND profiles.school_id = black_marks.school_id
        )
    );

-- Admins can update any black marks in their school
CREATE POLICY "Admins can update black marks in their school"
    ON public.black_marks
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
            AND profiles.school_id = black_marks.school_id
        )
    );

-- Admins can delete black marks in their school
CREATE POLICY "Admins can delete black marks in their school"
    ON public.black_marks
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
            AND profiles.school_id = black_marks.school_id
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.black_marks TO authenticated;
GRANT DELETE ON public.black_marks TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.black_marks IS 'Stores student disciplinary records with remedial action requirements';
COMMENT ON COLUMN public.black_marks.category IS 'Type of infraction: behavioral, academic, attendance, conduct, safety';
COMMENT ON COLUMN public.black_marks.severity IS 'Severity level: minor, moderate, major, severe';
COMMENT ON COLUMN public.black_marks.status IS 'Current status: active, in_progress, completed, resolved';
COMMENT ON COLUMN public.black_marks.remedy_type IS 'Type of remedial action required';
