-- ============================================================================
-- CREATE MISSING ASSESSMENT TABLES ONLY
-- ============================================================================
-- This creates only the tables that don't exist yet
-- Safe to run multiple times - won't affect existing tables
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ASSESSMENTS TABLE
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assessments') THEN
        CREATE TABLE assessments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT,
            type TEXT NOT NULL CHECK (type IN ('quiz', 'test', 'assignment', 'project', 'exam', 'homework', 'lab', 'presentation')),
            subject VARCHAR(100),
            max_score DECIMAL(10,2) NOT NULL CHECK (max_score > 0),
            passing_score DECIMAL(10,2),
            weight DECIMAL(5,2) DEFAULT 1.0,
            class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
            teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            rubric_criteria JSONB,
            answer_key JSONB,
            grading_scale JSONB,
            due_date TIMESTAMP WITH TIME ZONE,
            assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_published BOOLEAN DEFAULT false,
            is_graded BOOLEAN DEFAULT false,
            allow_late_submission BOOLEAN DEFAULT true,
            total_students INTEGER DEFAULT 0,
            graded_count INTEGER DEFAULT 0,
            average_score DECIMAL(5,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_assessments_teacher_id ON assessments(teacher_id);
        CREATE INDEX idx_assessments_class_id ON assessments(class_id);
        CREATE INDEX idx_assessments_school_id ON assessments(school_id);
        
        RAISE NOTICE '✅ Created assessments table';
    ELSE
        RAISE NOTICE 'ℹ️ assessments table already exists';
    END IF;
END $$;

-- ============================================================================
-- 2. ASSESSMENT GRADES TABLE
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assessment_grades') THEN
        CREATE TABLE assessment_grades (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
            teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
            score DECIMAL(10,2) NOT NULL CHECK (score >= 0),
            percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
            letter_grade TEXT NOT NULL CHECK (letter_grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W')),
            grade_points DECIMAL(3,2),
            feedback TEXT,
            teacher_comments TEXT,
            rubric_scores JSONB,
            submission_data JSONB,
            submission_date TIMESTAMP WITH TIME ZONE,
            graded_date TIMESTAMP WITH TIME ZONE,
            is_excused BOOLEAN DEFAULT false,
            is_late BOOLEAN DEFAULT false,
            is_missing BOOLEAN DEFAULT false,
            late_penalty DECIMAL(5,2) DEFAULT 0,
            bonus_points DECIMAL(5,2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(student_id, assessment_id)
        );
        
        CREATE INDEX idx_assessment_grades_student_id ON assessment_grades(student_id);
        CREATE INDEX idx_assessment_grades_assessment_id ON assessment_grades(assessment_id);
        CREATE INDEX idx_assessment_grades_teacher_id ON assessment_grades(teacher_id);
        
        RAISE NOTICE '✅ Created assessment_grades table';
    ELSE
        RAISE NOTICE 'ℹ️ assessment_grades table already exists';
    END IF;
END $$;

-- ============================================================================
-- 3. GRADE TEMPLATES TABLE
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grade_templates') THEN
        CREATE TABLE grade_templates (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            template_name TEXT NOT NULL,
            feedback_text TEXT NOT NULL,
            category TEXT CHECK (category IN ('positive', 'improvement', 'concern', 'excellent', 'needs_work', 'missing_work')),
            shortcut_key VARCHAR(10),
            is_active BOOLEAN DEFAULT true,
            use_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_grade_templates_teacher_id ON grade_templates(teacher_id);
        
        RAISE NOTICE '✅ Created grade_templates table';
    ELSE
        RAISE NOTICE 'ℹ️ grade_templates table already exists';
    END IF;
END $$;

-- ============================================================================
-- 4. OFFLINE GRADE SYNC TABLE
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'offline_grade_sync') THEN
        CREATE TABLE offline_grade_sync (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            grade_data JSONB NOT NULL,
            operation_type TEXT CHECK (operation_type IN ('create', 'update', 'delete')),
            sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'conflict')),
            error_message TEXT,
            retry_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            synced_at TIMESTAMP WITH TIME ZONE
        );
        
        CREATE INDEX idx_offline_grade_sync_teacher_id ON offline_grade_sync(teacher_id);
        CREATE INDEX idx_offline_grade_sync_status ON offline_grade_sync(sync_status);
        
        RAISE NOTICE '✅ Created offline_grade_sync table';
    ELSE
        RAISE NOTICE 'ℹ️ offline_grade_sync table already exists';
    END IF;
END $$;

-- ============================================================================
-- 5. ASSESSMENT ANALYTICS TABLE (with class_id!)
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assessment_analytics') THEN
        CREATE TABLE assessment_analytics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
            class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
            school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            total_students INTEGER DEFAULT 0,
            submitted_count INTEGER DEFAULT 0,
            graded_count INTEGER DEFAULT 0,
            missing_count INTEGER DEFAULT 0,
            average_score DECIMAL(5,2),
            median_score DECIMAL(5,2),
            highest_score DECIMAL(10,2),
            lowest_score DECIMAL(10,2),
            std_deviation DECIMAL(5,2),
            grade_distribution JSONB,
            score_ranges JSONB,
            difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'moderate', 'challenging', 'very_difficult')),
            completion_rate DECIMAL(5,2),
            last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_assessment_analytics_assessment_id ON assessment_analytics(assessment_id);
        CREATE INDEX idx_assessment_analytics_class_id ON assessment_analytics(class_id);
        CREATE INDEX idx_assessment_analytics_school_id ON assessment_analytics(school_id);
        CREATE UNIQUE INDEX idx_assessment_analytics_assessment_unique ON assessment_analytics(assessment_id);
        
        RAISE NOTICE '✅ Created assessment_analytics table';
    ELSE
        RAISE NOTICE 'ℹ️ assessment_analytics table already exists';
    END IF;
END $$;

-- ============================================================================
-- 6. GRADING RUBRICS TABLE
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grading_rubrics') THEN
        CREATE TABLE grading_rubrics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            rubric_name TEXT NOT NULL,
            description TEXT,
            subject VARCHAR(100),
            criteria JSONB NOT NULL,
            total_points INTEGER NOT NULL,
            is_template BOOLEAN DEFAULT false,
            is_shared BOOLEAN DEFAULT false,
            use_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_grading_rubrics_teacher_id ON grading_rubrics(teacher_id);
        CREATE INDEX idx_grading_rubrics_school_id ON grading_rubrics(school_id);
        
        RAISE NOTICE '✅ Created grading_rubrics table';
    ELSE
        RAISE NOTICE 'ℹ️ grading_rubrics table already exists';
    END IF;
END $$;

-- ============================================================================
-- VERIFY ALL TABLES CREATED
-- ============================================================================
SELECT 
    tablename,
    CASE 
        WHEN tablename IN ('assessments', 'assessment_grades', 'grade_templates', 'offline_grade_sync', 'assessment_analytics', 'grading_rubrics')
        THEN '✅ Created'
        ELSE '❌ Missing'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('assessments', 'assessment_grades', 'grade_templates', 'offline_grade_sync', 'assessment_analytics', 'grading_rubrics')
ORDER BY tablename;

-- SUCCESS MESSAGE
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '✅ All assessment tables created successfully!';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run comprehensive_assessments_part2.sql';
    RAISE NOTICE 'to add functions, triggers, and RLS policies';
END $$;
