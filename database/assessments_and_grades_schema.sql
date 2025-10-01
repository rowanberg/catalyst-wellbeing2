-- Assessment and Grade Management System Schema
-- This schema supports the comprehensive grade entry system with multiple input methods

-- First ensure all required dependency tables exist
-- Create profiles table if it doesn't exist (needed for RLS policies)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'parent', 'teacher', 'admin')),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    avatar_url TEXT,
    xp INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    grade_level VARCHAR(20),
    class_name VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_class_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(student_id, class_id)
);

-- Create parent_child_relationships table if it doesn't exist
CREATE TABLE IF NOT EXISTS parent_child_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'parent',
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, child_id)
);

-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('quiz', 'test', 'assignment', 'project', 'exam')),
    max_score INTEGER NOT NULL CHECK (max_score > 0),
    class_id UUID REFERENCES classes(id),
    teacher_id UUID NOT NULL REFERENCES auth.users(id),
    school_id UUID NOT NULL REFERENCES schools(id),
    rubric_criteria JSONB, -- For rubric-based assessments
    answer_key JSONB, -- For OMR scanning
    due_date TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assessment_grades table
CREATE TABLE IF NOT EXISTS assessment_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    teacher_id UUID NOT NULL REFERENCES auth.users(id),
    school_id UUID NOT NULL REFERENCES schools(id),
    score DECIMAL(10,2) NOT NULL CHECK (score >= 0),
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    letter_grade TEXT NOT NULL CHECK (letter_grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F')),
    feedback TEXT,
    rubric_scores JSONB, -- Individual rubric criteria scores
    submission_data JSONB, -- For digital submissions
    is_excused BOOLEAN DEFAULT false,
    late_penalty DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one grade per student per assessment
    UNIQUE(student_id, assessment_id)
);

-- Create grade_templates table for quick feedback
CREATE TABLE IF NOT EXISTS grade_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id),
    school_id UUID NOT NULL REFERENCES schools(id),
    template_name TEXT NOT NULL,
    feedback_text TEXT NOT NULL,
    category TEXT, -- 'positive', 'improvement', 'concern', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offline_grade_sync table for offline capability
CREATE TABLE IF NOT EXISTS offline_grade_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id),
    grade_data JSONB NOT NULL,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Dependency table indexes
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_student_id ON student_class_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_class_id ON student_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_school_id ON student_class_assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_relationships_parent_id ON parent_child_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_relationships_child_id ON parent_child_relationships(child_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_relationships_school_id ON parent_child_relationships(school_id);

-- Assessment table indexes
CREATE INDEX IF NOT EXISTS idx_assessments_teacher_id ON assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessments_school_id ON assessments(school_id);
CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_student_id ON assessment_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_assessment_id ON assessment_grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_grades_teacher_id ON assessment_grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grade_templates_teacher_id ON grade_templates(teacher_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_teacher_id ON offline_grade_sync(teacher_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_status ON offline_grade_sync(sync_status);

-- Row Level Security (RLS) Policies

-- Enable RLS
-- Core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Dependency tables
ALTER TABLE student_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;

-- Assessment tables
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_grade_sync ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Dependency table policies
-- Student class assignments policies
CREATE POLICY "Students can view their own class assignments" ON student_class_assignments
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view class assignments for their classes" ON student_class_assignments
    FOR SELECT USING (
        class_id IN (
            SELECT class_id FROM teacher_class_assignments 
            WHERE teacher_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage class assignments" ON student_class_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin' 
            AND profiles.school_id = student_class_assignments.school_id
        )
    );

-- Parent child relationships policies
CREATE POLICY "Parents can view their own relationships" ON parent_child_relationships
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Students can view their parent relationships" ON parent_child_relationships
    FOR SELECT USING (child_id = auth.uid());

CREATE POLICY "Admins can manage parent relationships" ON parent_child_relationships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin' 
            AND profiles.school_id = parent_child_relationships.school_id
        )
    );

-- Assessments policies
CREATE POLICY "Teachers can view their own assessments" ON assessments
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create assessments" ON assessments
    FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own assessments" ON assessments
    FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own assessments" ON assessments
    FOR DELETE USING (teacher_id = auth.uid());

-- Students can view published assessments in their classes
CREATE POLICY "Students can view published assessments" ON assessments
    FOR SELECT USING (
        is_published = true AND
        class_id IN (
            SELECT class_id FROM student_class_assignments 
            WHERE student_id = auth.uid()
        )
    );

-- Assessment grades policies
CREATE POLICY "Teachers can view grades for their assessments" ON assessment_grades
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create grades" ON assessment_grades
    FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update grades for their assessments" ON assessment_grades
    FOR UPDATE USING (teacher_id = auth.uid());

-- Students can view their own grades
CREATE POLICY "Students can view their own grades" ON assessment_grades
    FOR SELECT USING (student_id = auth.uid());

-- Parents can view their children's grades
CREATE POLICY "Parents can view their children's grades" ON assessment_grades
    FOR SELECT USING (
        student_id IN (
            SELECT child_id FROM parent_child_relationships 
            WHERE parent_id = auth.uid() AND is_approved = true
        )
    );

-- Grade templates policies
CREATE POLICY "Teachers can manage their own templates" ON grade_templates
    FOR ALL USING (teacher_id = auth.uid());

-- Offline sync policies
CREATE POLICY "Teachers can manage their own offline sync" ON offline_grade_sync
    FOR ALL USING (teacher_id = auth.uid());

-- Functions for grade calculations
CREATE OR REPLACE FUNCTION calculate_letter_grade(percentage DECIMAL)
RETURNS TEXT AS $$
BEGIN
    CASE 
        WHEN percentage >= 97 THEN RETURN 'A+';
        WHEN percentage >= 93 THEN RETURN 'A';
        WHEN percentage >= 90 THEN RETURN 'A-';
        WHEN percentage >= 87 THEN RETURN 'B+';
        WHEN percentage >= 83 THEN RETURN 'B';
        WHEN percentage >= 80 THEN RETURN 'B-';
        WHEN percentage >= 77 THEN RETURN 'C+';
        WHEN percentage >= 73 THEN RETURN 'C';
        WHEN percentage >= 70 THEN RETURN 'C-';
        WHEN percentage >= 67 THEN RETURN 'D+';
        WHEN percentage >= 63 THEN RETURN 'D';
        WHEN percentage >= 60 THEN RETURN 'D-';
        ELSE RETURN 'F';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get assessment analytics
CREATE OR REPLACE FUNCTION get_assessment_analytics(assessment_uuid UUID)
RETURNS TABLE(
    class_average DECIMAL,
    highest_score DECIMAL,
    lowest_score DECIMAL,
    pass_rate DECIMAL,
    grade_distribution JSONB,
    total_students INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH grade_stats AS (
        SELECT 
            AVG(percentage) as avg_pct,
            MAX(score) as max_score,
            MIN(score) as min_score,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE percentage >= 60) as passing
        FROM assessment_grades 
        WHERE assessment_id = assessment_uuid
    ),
    grade_dist AS (
        SELECT jsonb_object_agg(letter_grade, grade_count) as distribution
        FROM (
            SELECT letter_grade, COUNT(*) as grade_count
            FROM assessment_grades 
            WHERE assessment_id = assessment_uuid
            GROUP BY letter_grade
        ) dist
    )
    SELECT 
        ROUND(gs.avg_pct, 2) as class_average,
        gs.max_score as highest_score,
        gs.min_score as lowest_score,
        ROUND((gs.passing::DECIMAL / gs.total) * 100, 2) as pass_rate,
        COALESCE(gd.distribution, '{}'::jsonb) as grade_distribution,
        gs.total::INTEGER as total_students
    FROM grade_stats gs
    CROSS JOIN grade_dist gd;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update letter grades
CREATE OR REPLACE FUNCTION update_letter_grade()
RETURNS TRIGGER AS $$
BEGIN
    NEW.letter_grade := calculate_letter_grade(NEW.percentage);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessment_grades_update_letter_grade
    BEFORE INSERT OR UPDATE ON assessment_grades
    FOR EACH ROW
    EXECUTE FUNCTION update_letter_grade();

-- Insert default grade templates
INSERT INTO grade_templates (teacher_id, school_id, template_name, feedback_text, category) VALUES
    -- These will be inserted per teacher, this is just an example structure
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Excellent Work', 'Excellent work! Keep it up!', 'positive'),
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Good Effort', 'Good effort, but needs more practice', 'improvement'),
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Needs Help', 'Please see me for extra help', 'concern'),
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Great Improvement', 'Great improvement from last time!', 'positive'),
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Check Work', 'Please check your work for calculation errors', 'improvement')
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE student_class_assignments IS 'Links students to their assigned classes';
COMMENT ON TABLE parent_child_relationships IS 'Links parents to their children for grade access';
COMMENT ON TABLE assessments IS 'Stores all assessments created by teachers with support for multiple types and rubrics';
COMMENT ON TABLE assessment_grades IS 'Stores individual student grades for assessments with comprehensive tracking';
COMMENT ON TABLE grade_templates IS 'Reusable feedback templates for quick grading';
COMMENT ON TABLE offline_grade_sync IS 'Handles offline grade entry synchronization';
COMMENT ON FUNCTION calculate_letter_grade IS 'Automatically calculates letter grades from percentages';
COMMENT ON FUNCTION get_assessment_analytics IS 'Provides comprehensive analytics for assessment performance';

-- Verification: Check that all required tables exist
DO $$
BEGIN
    -- Check core tables
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE EXCEPTION 'ERROR: profiles table was not created';
    END IF;
    
    -- Check dependency tables
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_class_assignments') THEN
        RAISE EXCEPTION 'ERROR: student_class_assignments table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parent_child_relationships') THEN
        RAISE EXCEPTION 'ERROR: parent_child_relationships table was not created';
    END IF;
    
    -- Check assessment tables
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessments') THEN
        RAISE EXCEPTION 'ERROR: assessments table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_grades') THEN
        RAISE EXCEPTION 'ERROR: assessment_grades table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grade_templates') THEN
        RAISE EXCEPTION 'ERROR: grade_templates table was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offline_grade_sync') THEN
        RAISE EXCEPTION 'ERROR: offline_grade_sync table was not created';
    END IF;
    
    RAISE NOTICE 'SUCCESS: All assessment system tables created successfully!';
    RAISE NOTICE 'Tables created: profiles, student_class_assignments, parent_child_relationships, assessments, assessment_grades, grade_templates, offline_grade_sync';
    RAISE NOTICE 'Functions created: calculate_letter_grade, get_assessment_analytics';
    RAISE NOTICE 'Assessment system is ready for use!';
END $$;
