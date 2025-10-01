-- ============================================================================
-- COMPREHENSIVE ASSESSMENTS & GRADES SYSTEM - PART 2
-- Functions, Triggers, and Row Level Security Policies
-- ============================================================================
-- Run this file AFTER comprehensive_assessments_part1.sql
-- This file contains all business logic, automation, and security policies
-- ============================================================================

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to calculate letter grade from percentage
CREATE OR REPLACE FUNCTION calculate_letter_grade(percentage DECIMAL)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE
        WHEN percentage >= 97 THEN 'A+'
        WHEN percentage >= 93 THEN 'A'
        WHEN percentage >= 90 THEN 'A-'
        WHEN percentage >= 87 THEN 'B+'
        WHEN percentage >= 83 THEN 'B'
        WHEN percentage >= 80 THEN 'B-'
        WHEN percentage >= 77 THEN 'C+'
        WHEN percentage >= 73 THEN 'C'
        WHEN percentage >= 70 THEN 'C-'
        WHEN percentage >= 67 THEN 'D+'
        WHEN percentage >= 63 THEN 'D'
        WHEN percentage >= 60 THEN 'D-'
        ELSE 'F'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate grade points for GPA
CREATE OR REPLACE FUNCTION calculate_grade_points(letter_grade TEXT)
RETURNS DECIMAL AS $$
BEGIN
    RETURN CASE letter_grade
        WHEN 'A+' THEN 4.0
        WHEN 'A' THEN 4.0
        WHEN 'A-' THEN 3.7
        WHEN 'B+' THEN 3.3
        WHEN 'B' THEN 3.0
        WHEN 'B-' THEN 2.7
        WHEN 'C+' THEN 2.3
        WHEN 'C' THEN 2.0
        WHEN 'C-' THEN 1.7
        WHEN 'D+' THEN 1.3
        WHEN 'D' THEN 1.0
        WHEN 'D-' THEN 0.7
        ELSE 0.0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function to update assessment metadata when grades are added/updated
CREATE OR REPLACE FUNCTION update_assessment_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Update assessment statistics
    UPDATE assessments a
    SET 
        graded_count = (
            SELECT COUNT(*)
            FROM assessment_grades
            WHERE assessment_id = a.id
        ),
        average_score = (
            SELECT ROUND(AVG(percentage)::numeric, 2)
            FROM assessment_grades
            WHERE assessment_id = a.id
        ),
        is_graded = (
            SELECT COUNT(*) >= total_students
            FROM assessment_grades
            WHERE assessment_id = a.id
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.assessment_id, OLD.assessment_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to automatically calculate percentage and letter grade
CREATE OR REPLACE FUNCTION auto_calculate_grade()
RETURNS TRIGGER AS $$
DECLARE
    max_score_value DECIMAL;
BEGIN
    -- Get max score from assessment
    SELECT max_score INTO max_score_value
    FROM assessments
    WHERE id = NEW.assessment_id;
    
    -- Calculate percentage
    NEW.percentage := ROUND((NEW.score / max_score_value * 100)::numeric, 2);
    
    -- Calculate letter grade
    NEW.letter_grade := calculate_letter_grade(NEW.percentage);
    
    -- Calculate grade points
    NEW.grade_points := calculate_grade_points(NEW.letter_grade);
    
    -- Set graded date
    IF NEW.graded_date IS NULL THEN
        NEW.graded_date := NOW();
    END IF;
    
    -- Set updated timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update template use count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE grade_templates
    SET use_count = use_count + 1,
        updated_at = NOW()
    WHERE id = (NEW.feedback::jsonb->>'template_id')::uuid
    AND (NEW.feedback::jsonb->>'template_id') IS NOT NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ANALYTICS FUNCTIONS
-- ============================================================================

-- Function to calculate comprehensive assessment analytics
CREATE OR REPLACE FUNCTION calculate_assessment_analytics(p_assessment_id UUID)
RETURNS void AS $$
DECLARE
    v_total INTEGER;
    v_submitted INTEGER;
    v_graded INTEGER;
    v_missing INTEGER;
    v_avg DECIMAL;
    v_median DECIMAL;
    v_highest DECIMAL;
    v_lowest DECIMAL;
    v_std_dev DECIMAL;
    v_grade_dist JSONB;
    v_difficulty TEXT;
    v_completion_rate DECIMAL;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO v_total
    FROM student_class_assignments sca
    JOIN assessments a ON a.class_id = sca.class_id
    WHERE a.id = p_assessment_id AND sca.is_active = true;
    
    SELECT COUNT(*) INTO v_graded
    FROM assessment_grades
    WHERE assessment_id = p_assessment_id;
    
    v_missing := v_total - v_graded;
    
    -- Calculate statistics
    SELECT 
        ROUND(AVG(percentage)::numeric, 2),
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY percentage)::numeric, 2),
        MAX(score),
        MIN(score),
        ROUND(STDDEV(percentage)::numeric, 2)
    INTO v_avg, v_median, v_highest, v_lowest, v_std_dev
    FROM assessment_grades
    WHERE assessment_id = p_assessment_id;
    
    -- Calculate grade distribution
    SELECT jsonb_object_agg(letter_grade, grade_count)
    INTO v_grade_dist
    FROM (
        SELECT letter_grade, COUNT(*) as grade_count
        FROM assessment_grades
        WHERE assessment_id = p_assessment_id
        GROUP BY letter_grade
    ) dist;
    
    -- Determine difficulty level
    v_difficulty := CASE
        WHEN v_avg >= 85 THEN 'easy'
        WHEN v_avg >= 70 THEN 'moderate'
        WHEN v_avg >= 60 THEN 'challenging'
        ELSE 'very_difficult'
    END;
    
    -- Calculate completion rate
    v_completion_rate := CASE 
        WHEN v_total > 0 THEN ROUND((v_graded::decimal / v_total * 100)::numeric, 2)
        ELSE 0
    END;
    
    -- Upsert analytics
    INSERT INTO assessment_analytics (
        assessment_id,
        school_id,
        total_students,
        submitted_count,
        graded_count,
        missing_count,
        average_score,
        median_score,
        highest_score,
        lowest_score,
        std_deviation,
        grade_distribution,
        difficulty_level,
        completion_rate,
        last_calculated
    )
    SELECT 
        p_assessment_id,
        a.school_id,
        v_total,
        v_graded,
        v_graded,
        v_missing,
        v_avg,
        v_median,
        v_highest,
        v_lowest,
        v_std_dev,
        v_grade_dist,
        v_difficulty,
        v_completion_rate,
        NOW()
    FROM assessments a
    WHERE a.id = p_assessment_id
    ON CONFLICT (assessment_id)
    DO UPDATE SET
        total_students = EXCLUDED.total_students,
        submitted_count = EXCLUDED.submitted_count,
        graded_count = EXCLUDED.graded_count,
        missing_count = EXCLUDED.missing_count,
        average_score = EXCLUDED.average_score,
        median_score = EXCLUDED.median_score,
        highest_score = EXCLUDED.highest_score,
        lowest_score = EXCLUDED.lowest_score,
        std_deviation = EXCLUDED.std_deviation,
        grade_distribution = EXCLUDED.grade_distribution,
        difficulty_level = EXCLUDED.difficulty_level,
        completion_rate = EXCLUDED.completion_rate,
        last_calculated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get teacher's assessment summary
CREATE OR REPLACE FUNCTION get_teacher_assessment_summary(p_teacher_id UUID)
RETURNS TABLE (
    total_assessments BIGINT,
    published_assessments BIGINT,
    total_grades_entered BIGINT,
    pending_grading BIGINT,
    average_class_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT a.id)::BIGINT as total_assessments,
        COUNT(DISTINCT CASE WHEN a.is_published THEN a.id END)::BIGINT as published_assessments,
        COUNT(ag.id)::BIGINT as total_grades_entered,
        (COUNT(DISTINCT a.id) * a.total_students - COUNT(ag.id))::BIGINT as pending_grading,
        ROUND(AVG(ag.percentage)::numeric, 2) as average_class_score
    FROM assessments a
    LEFT JOIN assessment_grades ag ON ag.assessment_id = a.id
    WHERE a.teacher_id = p_teacher_id
    GROUP BY a.total_students;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger to update assessment metadata on grade changes
DROP TRIGGER IF EXISTS trigger_update_assessment_metadata ON assessment_grades;
CREATE TRIGGER trigger_update_assessment_metadata
    AFTER INSERT OR UPDATE OR DELETE ON assessment_grades
    FOR EACH ROW
    EXECUTE FUNCTION update_assessment_metadata();

-- Trigger to auto-calculate grades
DROP TRIGGER IF EXISTS trigger_auto_calculate_grade ON assessment_grades;
CREATE TRIGGER trigger_auto_calculate_grade
    BEFORE INSERT OR UPDATE ON assessment_grades
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_grade();

-- Trigger to update timestamps on assessments
DROP TRIGGER IF EXISTS trigger_update_assessments_timestamp ON assessments;
CREATE TRIGGER trigger_update_assessments_timestamp
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update timestamps on assessment_grades
DROP TRIGGER IF EXISTS trigger_update_grades_timestamp ON assessment_grades;
CREATE TRIGGER trigger_update_grades_timestamp
    BEFORE UPDATE ON assessment_grades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to increment template usage
DROP TRIGGER IF EXISTS trigger_increment_template_usage ON assessment_grades;
CREATE TRIGGER trigger_increment_template_usage
    AFTER INSERT ON assessment_grades
    FOR EACH ROW
    EXECUTE FUNCTION increment_template_usage();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_grade_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_rubrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ASSESSMENTS POLICIES
-- ============================================================================

-- Teachers can view their own assessments
DROP POLICY IF EXISTS "Teachers can view own assessments" ON assessments;
CREATE POLICY "Teachers can view own assessments" ON assessments
    FOR SELECT USING (
        teacher_id = auth.uid()
    );

-- Teachers can create assessments
DROP POLICY IF EXISTS "Teachers can create assessments" ON assessments;
CREATE POLICY "Teachers can create assessments" ON assessments
    FOR INSERT WITH CHECK (
        teacher_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() AND role = 'teacher'
        )
    );

-- Teachers can update their own assessments
DROP POLICY IF EXISTS "Teachers can update own assessments" ON assessments;
CREATE POLICY "Teachers can update own assessments" ON assessments
    FOR UPDATE USING (
        teacher_id = auth.uid()
    );

-- Teachers can delete their own assessments
DROP POLICY IF EXISTS "Teachers can delete own assessments" ON assessments;
CREATE POLICY "Teachers can delete own assessments" ON assessments
    FOR DELETE USING (
        teacher_id = auth.uid()
    );

-- Students can view published assessments in their classes
DROP POLICY IF EXISTS "Students can view published assessments" ON assessments;
CREATE POLICY "Students can view published assessments" ON assessments
    FOR SELECT USING (
        is_published = true AND
        class_id IN (
            SELECT class_id FROM student_class_assignments
            WHERE student_id = auth.uid() AND is_active = true
        )
    );

-- Admins can view all assessments in their school
DROP POLICY IF EXISTS "Admins can view school assessments" ON assessments;
CREATE POLICY "Admins can view school assessments" ON assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid() 
            AND role = 'admin'
            AND school_id = assessments.school_id
        )
    );

-- ============================================================================
-- ASSESSMENT GRADES POLICIES
-- ============================================================================

-- Teachers can view grades for their assessments
DROP POLICY IF EXISTS "Teachers can view grades for their assessments" ON assessment_grades;
CREATE POLICY "Teachers can view grades for their assessments" ON assessment_grades
    FOR SELECT USING (
        teacher_id = auth.uid()
    );

-- Teachers can create grades for their assessments
DROP POLICY IF EXISTS "Teachers can create grades" ON assessment_grades;
CREATE POLICY "Teachers can create grades" ON assessment_grades
    FOR INSERT WITH CHECK (
        teacher_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM assessments
            WHERE id = assessment_id AND teacher_id = auth.uid()
        )
    );

-- Teachers can update grades for their assessments
DROP POLICY IF EXISTS "Teachers can update grades" ON assessment_grades;
CREATE POLICY "Teachers can update grades" ON assessment_grades
    FOR UPDATE USING (
        teacher_id = auth.uid()
    );

-- Teachers can delete grades
DROP POLICY IF EXISTS "Teachers can delete grades" ON assessment_grades;
CREATE POLICY "Teachers can delete grades" ON assessment_grades
    FOR DELETE USING (
        teacher_id = auth.uid()
    );

-- Students can view their own grades
DROP POLICY IF EXISTS "Students can view own grades" ON assessment_grades;
CREATE POLICY "Students can view own grades" ON assessment_grades
    FOR SELECT USING (
        student_id = auth.uid()
    );

-- Parents can view their children's grades
DROP POLICY IF EXISTS "Parents can view children grades" ON assessment_grades;
CREATE POLICY "Parents can view children grades" ON assessment_grades
    FOR SELECT USING (
        student_id IN (
            SELECT child_id FROM parent_child_relationships
            WHERE parent_id = auth.uid() AND is_approved = true
        )
    );

-- Admins can view all grades in their school
DROP POLICY IF EXISTS "Admins can view school grades" ON assessment_grades;
CREATE POLICY "Admins can view school grades" ON assessment_grades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND school_id = assessment_grades.school_id
        )
    );

-- ============================================================================
-- GRADE TEMPLATES POLICIES
-- ============================================================================

-- Teachers can manage their own templates
DROP POLICY IF EXISTS "Teachers can manage own templates" ON grade_templates;
CREATE POLICY "Teachers can manage own templates" ON grade_templates
    FOR ALL USING (
        teacher_id = auth.uid()
    );

-- ============================================================================
-- OFFLINE SYNC POLICIES
-- ============================================================================

-- Teachers can manage their own offline sync data
DROP POLICY IF EXISTS "Teachers can manage own sync data" ON offline_grade_sync;
CREATE POLICY "Teachers can manage own sync data" ON offline_grade_sync
    FOR ALL USING (
        teacher_id = auth.uid()
    );

-- ============================================================================
-- ANALYTICS POLICIES
-- ============================================================================

-- Teachers can view analytics for their assessments
DROP POLICY IF EXISTS "Teachers can view own assessment analytics" ON assessment_analytics;
CREATE POLICY "Teachers can view own assessment analytics" ON assessment_analytics
    FOR SELECT USING (
        assessment_id IN (
            SELECT id FROM assessments WHERE teacher_id = auth.uid()
        )
    );

-- Admins can view all analytics in their school
DROP POLICY IF EXISTS "Admins can view school analytics" ON assessment_analytics;
CREATE POLICY "Admins can view school analytics" ON assessment_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND school_id = assessment_analytics.school_id
        )
    );

-- ============================================================================
-- RUBRICS POLICIES
-- ============================================================================

-- Teachers can manage their own rubrics
DROP POLICY IF EXISTS "Teachers can manage own rubrics" ON grading_rubrics;
CREATE POLICY "Teachers can manage own rubrics" ON grading_rubrics
    FOR ALL USING (
        teacher_id = auth.uid()
    );

-- Teachers can view shared templates
DROP POLICY IF EXISTS "Teachers can view shared rubrics" ON grading_rubrics;
CREATE POLICY "Teachers can view shared rubrics" ON grading_rubrics
    FOR SELECT USING (
        is_shared = true AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'teacher'
            AND school_id = grading_rubrics.school_id
        )
    );

-- ============================================================================
-- CREATE UNIQUE INDEX FOR ASSESSMENT ANALYTICS
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_analytics_assessment_unique 
    ON assessment_analytics(assessment_id);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ PART 2 COMPLETE: Functions, triggers, and RLS policies created successfully!';
    RAISE NOTICE 'Created Functions:';
    RAISE NOTICE '  - calculate_letter_grade()';
    RAISE NOTICE '  - calculate_grade_points()';
    RAISE NOTICE '  - update_assessment_metadata()';
    RAISE NOTICE '  - auto_calculate_grade()';
    RAISE NOTICE '  - calculate_assessment_analytics()';
    RAISE NOTICE '  - get_teacher_assessment_summary()';
    RAISE NOTICE '';
    RAISE NOTICE 'Created Triggers:';
    RAISE NOTICE '  - Auto-calculate grades on insert/update';
    RAISE NOTICE '  - Update assessment metadata on grade changes';
    RAISE NOTICE '  - Update timestamps automatically';
    RAISE NOTICE '  - Track template usage';
    RAISE NOTICE '';
    RAISE NOTICE 'Created RLS Policies:';
    RAISE NOTICE '  - Teachers: Full CRUD on own assessments and grades';
    RAISE NOTICE '  - Students: View published assessments and own grades';
    RAISE NOTICE '  - Parents: View children''s grades';
    RAISE NOTICE '  - Admins: View all school data';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Assessment system is now fully operational!';
    RAISE NOTICE 'Ready for /teacher/update-results page and all sub-pages';
END $$;
