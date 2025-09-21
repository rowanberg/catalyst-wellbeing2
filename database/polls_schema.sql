-- Polls and Surveys Database Schema
-- This schema supports comprehensive poll and survey functionality for schools

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('poll', 'survey')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    target_audience TEXT NOT NULL CHECK (target_audience IN ('students', 'teachers', 'parents', 'all')),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_anonymous BOOLEAN DEFAULT false,
    allow_multiple_responses BOOLEAN DEFAULT false,
    require_authentication BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    
    -- Indexes for performance
    CONSTRAINT polls_dates_check CHECK (end_date IS NULL OR start_date IS NULL OR start_date <= end_date)
);

-- Create poll questions table
CREATE TABLE IF NOT EXISTS poll_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'single_choice', 'text', 'rating', 'yes_no', 'scale')),
    options JSONB DEFAULT '[]', -- Array of options for choice questions
    is_required BOOLEAN DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0,
    settings JSONB DEFAULT '{}', -- Additional question settings (min/max for rating, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure proper ordering
    UNIQUE(poll_id, order_index)
);

-- Create poll responses table
CREATE TABLE IF NOT EXISTS poll_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    respondent_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL for anonymous responses
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET, -- For anonymous response tracking
    user_agent TEXT,
    is_complete BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    
    -- Prevent duplicate responses (unless allowed)
    UNIQUE(poll_id, respondent_id)
);

-- Create poll answers table
CREATE TABLE IF NOT EXISTS poll_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    response_id UUID NOT NULL REFERENCES poll_responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES poll_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    answer_options JSONB DEFAULT '[]', -- Selected options for multiple choice
    answer_number INTEGER, -- For rating/scale questions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One answer per question per response
    UNIQUE(response_id, question_id)
);

-- Create poll analytics table for caching results
CREATE TABLE IF NOT EXISTS poll_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    question_id UUID REFERENCES poll_questions(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(poll_id, question_id, metric_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_polls_school_id ON polls(school_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_target_audience ON polls(target_audience);
CREATE INDEX IF NOT EXISTS idx_polls_dates ON polls(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_poll_questions_poll_id ON poll_questions(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_questions_order ON poll_questions(poll_id, order_index);

CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_respondent ON poll_responses(respondent_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_submitted ON poll_responses(submitted_at);

CREATE INDEX IF NOT EXISTS idx_poll_answers_response_id ON poll_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_poll_answers_question_id ON poll_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_poll_analytics_poll_id ON poll_analytics(poll_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage polls for their school" ON polls;
DROP POLICY IF EXISTS "Teachers can view polls for their school" ON polls;
DROP POLICY IF EXISTS "Users can view active polls targeted to them" ON polls;
DROP POLICY IF EXISTS "Questions inherit poll permissions" ON poll_questions;
DROP POLICY IF EXISTS "Users can create responses to polls they can access" ON poll_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON poll_responses;
DROP POLICY IF EXISTS "Admins and teachers can view responses for their school polls" ON poll_responses;
DROP POLICY IF EXISTS "Users can manage answers for their responses" ON poll_answers;
DROP POLICY IF EXISTS "Admins and teachers can view answers for their school" ON poll_answers;
DROP POLICY IF EXISTS "Admins and teachers can view analytics for their school" ON poll_analytics;

-- Polls policies
CREATE POLICY "Admins can manage polls for their school" ON polls
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin' 
            AND profiles.school_id = polls.school_id
        )
    );

CREATE POLICY "Teachers can view polls for their school" ON polls
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'teacher') 
            AND profiles.school_id = polls.school_id
        )
    );

CREATE POLICY "Users can view active polls targeted to them" ON polls
    FOR SELECT USING (
        status = 'active' AND (
            target_audience = 'all' OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.school_id = polls.school_id
                AND (
                    (target_audience = 'students' AND profiles.role = 'student') OR
                    (target_audience = 'teachers' AND profiles.role = 'teacher') OR
                    (target_audience = 'parents' AND profiles.role = 'parent')
                )
            )
        )
    );

-- Poll questions policies
CREATE POLICY "Questions inherit poll permissions" ON poll_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_questions.poll_id 
            AND (
                -- Admin/teacher access
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('admin', 'teacher') 
                    AND profiles.school_id = polls.school_id
                ) OR
                -- User access to active polls
                (polls.status = 'active' AND (
                    polls.target_audience = 'all' OR
                    EXISTS (
                        SELECT 1 FROM profiles 
                        WHERE profiles.id = auth.uid() 
                        AND profiles.school_id = polls.school_id
                        AND (
                            (polls.target_audience = 'students' AND profiles.role = 'student') OR
                            (polls.target_audience = 'teachers' AND profiles.role = 'teacher') OR
                            (polls.target_audience = 'parents' AND profiles.role = 'parent')
                        )
                    )
                ))
            )
        )
    );

-- Poll responses policies
CREATE POLICY "Users can create responses to polls they can access" ON poll_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_responses.poll_id 
            AND polls.status = 'active'
            AND (
                polls.target_audience = 'all' OR
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.school_id = polls.school_id
                    AND (
                        (polls.target_audience = 'students' AND profiles.role = 'student') OR
                        (polls.target_audience = 'teachers' AND profiles.role = 'teacher') OR
                        (polls.target_audience = 'parents' AND profiles.role = 'parent')
                    )
                )
            )
        )
    );

-- Add missing columns to poll_responses for API compatibility
ALTER TABLE poll_responses 
ADD COLUMN IF NOT EXISTS respondent_role TEXT,
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id),
ADD COLUMN IF NOT EXISTS response_metadata JSONB DEFAULT '{}';

CREATE POLICY "Users can view their own responses" ON poll_responses
    FOR SELECT USING (respondent_id = auth.uid());

CREATE POLICY "Admins and teachers can view responses for their school polls" ON poll_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM polls 
            JOIN profiles ON profiles.id = auth.uid()
            WHERE polls.id = poll_responses.poll_id 
            AND profiles.role IN ('admin', 'teacher')
            AND profiles.school_id = polls.school_id
        )
    );

-- Poll answers policies
CREATE POLICY "Users can manage answers for their responses" ON poll_answers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM poll_responses 
            WHERE poll_responses.id = poll_answers.response_id 
            AND poll_responses.respondent_id = auth.uid()
        )
    );

CREATE POLICY "Admins and teachers can view answers for their school" ON poll_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM poll_responses 
            JOIN polls ON polls.id = poll_responses.poll_id
            JOIN profiles ON profiles.id = auth.uid()
            WHERE poll_responses.id = poll_answers.response_id 
            AND profiles.role IN ('admin', 'teacher')
            AND profiles.school_id = polls.school_id
        )
    );

-- Poll analytics policies
CREATE POLICY "Admins and teachers can view analytics for their school" ON poll_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM polls 
            JOIN profiles ON profiles.id = auth.uid()
            WHERE polls.id = poll_analytics.poll_id 
            AND profiles.role IN ('admin', 'teacher')
            AND profiles.school_id = polls.school_id
        )
    );

-- Functions for poll management

-- Function to update poll analytics
CREATE OR REPLACE FUNCTION update_poll_analytics(poll_uuid UUID)
RETURNS void AS $$
BEGIN
    -- Delete existing analytics for this poll
    DELETE FROM poll_analytics WHERE poll_id = poll_uuid;
    
    -- Calculate response count
    INSERT INTO poll_analytics (poll_id, metric_name, metric_value)
    SELECT 
        poll_uuid,
        'total_responses',
        to_jsonb(COUNT(*))
    FROM poll_responses 
    WHERE poll_id = poll_uuid AND is_complete = true;
    
    -- Calculate completion rate
    INSERT INTO poll_analytics (poll_id, metric_name, metric_value)
    SELECT 
        poll_uuid,
        'completion_rate',
        to_jsonb(
            CASE 
                WHEN total_target.count > 0 
                THEN (completed.count::float / total_target.count::float) * 100 
                ELSE 0 
            END
        )
    FROM 
        (SELECT COUNT(*) as count FROM poll_responses WHERE poll_id = poll_uuid AND is_complete = true) completed,
        (SELECT 
            CASE 
                WHEN p.target_audience = 'all' THEN (SELECT COUNT(*) FROM profiles WHERE school_id = p.school_id)
                WHEN p.target_audience = 'students' THEN (SELECT COUNT(*) FROM profiles WHERE school_id = p.school_id AND role = 'student')
                WHEN p.target_audience = 'teachers' THEN (SELECT COUNT(*) FROM profiles WHERE school_id = p.school_id AND role = 'teacher')
                WHEN p.target_audience = 'parents' THEN (SELECT COUNT(*) FROM profiles WHERE school_id = p.school_id AND role = 'parent')
                ELSE 0
            END as count
         FROM polls p WHERE p.id = poll_uuid) total_target;
    
    -- Calculate question-specific analytics
    INSERT INTO poll_analytics (poll_id, question_id, metric_name, metric_value)
    SELECT 
        poll_uuid,
        pq.id,
        'response_distribution',
        jsonb_agg(
            jsonb_build_object(
                'option', COALESCE(pa.answer_text, pa.answer_number::text),
                'count', option_count.count
            )
        )
    FROM poll_questions pq
    LEFT JOIN (
        SELECT 
            pa.question_id,
            COALESCE(pa.answer_text, pa.answer_number::text) as answer_value,
            COUNT(*) as count
        FROM poll_answers pa
        JOIN poll_responses pr ON pr.id = pa.response_id
        WHERE pr.poll_id = poll_uuid AND pr.is_complete = true
        GROUP BY pa.question_id, COALESCE(pa.answer_text, pa.answer_number::text)
    ) option_count ON option_count.question_id = pq.id
    JOIN poll_answers pa ON pa.question_id = pq.id
    WHERE pq.poll_id = poll_uuid
    GROUP BY pq.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update analytics when responses change
CREATE OR REPLACE FUNCTION trigger_update_poll_analytics()
RETURNS trigger AS $$
BEGIN
    -- Update analytics for the affected poll
    IF TG_OP = 'DELETE' THEN
        PERFORM update_poll_analytics((SELECT poll_id FROM poll_responses WHERE id = OLD.response_id));
        RETURN OLD;
    ELSE
        PERFORM update_poll_analytics((SELECT poll_id FROM poll_responses WHERE id = NEW.response_id));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_poll_analytics_on_answer_change ON poll_answers;
CREATE TRIGGER trigger_poll_analytics_on_answer_change
    AFTER INSERT OR UPDATE OR DELETE ON poll_answers
    FOR EACH ROW EXECUTE FUNCTION trigger_update_poll_analytics();

DROP TRIGGER IF EXISTS trigger_poll_analytics_on_response_change ON poll_responses;
CREATE TRIGGER trigger_poll_analytics_on_response_change
    AFTER INSERT OR UPDATE OR DELETE ON poll_responses
    FOR EACH ROW EXECUTE FUNCTION trigger_update_poll_analytics();
