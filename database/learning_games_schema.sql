-- Learning Games Database Schema
-- This schema supports educational mini-games, quizzes, and interactive learning experiences

-- Game definitions and templates
CREATE TABLE IF NOT EXISTS learning_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    game_type VARCHAR(30) CHECK (game_type IN (
        'quiz', 'flashcard', 'matching', 'word_puzzle', 'math_challenge', 
        'memory_game', 'drag_drop', 'fill_blank', 'multiple_choice', 
        'true_false', 'typing_game', 'puzzle', 'simulation', 'adventure'
    )) NOT NULL,
    
    -- Educational content
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(200),
    grade_levels TEXT[] NOT NULL, -- ['9', '10', '11']
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5) DEFAULT 1,
    learning_objectives TEXT[],
    
    -- Game mechanics and configuration
    game_config JSONB NOT NULL, -- Game-specific configuration
    -- Examples:
    -- quiz: {questions: [...], time_limit: 300, randomize: true, show_hints: false}
    -- flashcard: {cards: [...], auto_flip: true, shuffle: true}
    -- matching: {pairs: [...], grid_size: "4x4", time_limit: 180}
    
    -- Scoring and progression
    max_score INTEGER DEFAULT 100,
    passing_score INTEGER DEFAULT 60,
    time_limit_seconds INTEGER, -- NULL for no time limit
    attempts_allowed INTEGER DEFAULT -1, -- -1 for unlimited
    
    -- Rewards and incentives
    xp_reward INTEGER DEFAULT 10 CHECK (xp_reward >= 0),
    gem_reward INTEGER DEFAULT 2 CHECK (gem_reward >= 0),
    bonus_multipliers JSONB DEFAULT '{}', -- {perfect_score: 2.0, speed_bonus: 1.5, streak_bonus: 1.2}
    
    -- Visual and audio assets
    thumbnail_url TEXT,
    background_image_url TEXT,
    background_music_url TEXT,
    sound_effects JSONB DEFAULT '{}', -- {correct: "ding.mp3", incorrect: "buzz.mp3", ...}
    
    -- Accessibility and customization
    accessibility_features JSONB DEFAULT '{}', -- {high_contrast: true, large_text: true, audio_cues: true}
    customization_options JSONB DEFAULT '{}', -- {themes: [...], difficulty_adjust: true}
    
    -- Availability and scheduling
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    
    -- Prerequisites and unlocking
    prerequisite_games UUID[] DEFAULT '{}',
    required_achievements UUID[] DEFAULT '{}',
    unlock_criteria JSONB DEFAULT '{}', -- {min_level: 5, completed_games: 3}
    
    -- Metadata and organization
    tags TEXT[] DEFAULT '{}',
    estimated_duration_minutes INTEGER DEFAULT 10,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Analytics
    total_plays INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0.0,
    average_duration_seconds INTEGER DEFAULT 0
);

-- Student game sessions and attempts
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES learning_games(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Session details
    session_type VARCHAR(20) CHECK (session_type IN ('practice', 'assessment', 'challenge', 'tournament')) DEFAULT 'practice',
    status VARCHAR(20) CHECK (status IN ('started', 'paused', 'completed', 'abandoned', 'timeout')) DEFAULT 'started',
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    total_duration_seconds INTEGER DEFAULT 0,
    active_play_time_seconds INTEGER DEFAULT 0, -- Excluding pauses
    
    -- Scoring and performance
    current_score INTEGER DEFAULT 0,
    max_possible_score INTEGER NOT NULL,
    percentage_score DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN max_possible_score > 0 THEN (current_score::DECIMAL / max_possible_score * 100)
            ELSE 0
        END
    ) STORED,
    
    -- Progress tracking
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    skipped_questions INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    
    -- Game state and progress
    current_level INTEGER DEFAULT 1,
    current_question_index INTEGER DEFAULT 0,
    game_state JSONB DEFAULT '{}', -- Current state of the game
    
    -- Performance metrics
    accuracy_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN questions_answered > 0 THEN (correct_answers::DECIMAL / questions_answered * 100)
            ELSE 0
        END
    ) STORED,
    average_response_time_seconds DECIMAL(6,2) DEFAULT 0,
    
    -- Rewards earned
    xp_earned INTEGER DEFAULT 0,
    gems_earned INTEGER DEFAULT 0,
    bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    -- Device and context
    device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'tablet', 'mobile')) DEFAULT 'desktop',
    browser_info JSONB,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual question responses and analytics
CREATE TABLE IF NOT EXISTS game_question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL, -- Reference to question in game config
    question_type VARCHAR(30) NOT NULL,
    
    -- Response details
    student_answer JSONB NOT NULL, -- The student's response
    correct_answer JSONB NOT NULL, -- The correct answer
    is_correct BOOLEAN NOT NULL,
    
    -- Timing
    question_started_at TIMESTAMPTZ NOT NULL,
    question_answered_at TIMESTAMPTZ NOT NULL,
    response_time_seconds DECIMAL(6,2) GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (question_answered_at - question_started_at))
    ) STORED,
    
    -- Assistance and hints
    hints_requested INTEGER DEFAULT 0,
    hint_details JSONB DEFAULT '[]', -- [{hint_text: "...", requested_at: "..."}]
    
    -- Scoring
    points_earned INTEGER DEFAULT 0,
    partial_credit BOOLEAN DEFAULT false,
    
    -- Question metadata
    difficulty_level INTEGER,
    topic_tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game leaderboards and competitions
CREATE TABLE IF NOT EXISTS game_leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES learning_games(id) ON DELETE CASCADE,
    leaderboard_type VARCHAR(20) CHECK (leaderboard_type IN ('high_score', 'speed', 'accuracy', 'streak')) DEFAULT 'high_score',
    time_period VARCHAR(20) CHECK (time_period IN ('all_time', 'monthly', 'weekly', 'daily')) DEFAULT 'all_time',
    
    -- Scope
    scope VARCHAR(20) CHECK (scope IN ('global', 'school', 'grade', 'class')) DEFAULT 'school',
    grade_level VARCHAR(10), -- For grade-specific leaderboards
    
    -- Settings
    max_entries INTEGER DEFAULT 100,
    reset_frequency VARCHAR(20) CHECK (reset_frequency IN ('never', 'daily', 'weekly', 'monthly')),
    last_reset TIMESTAMPTZ,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard entries
CREATE TABLE IF NOT EXISTS game_leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id UUID NOT NULL REFERENCES game_leaderboards(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    
    -- Ranking
    current_rank INTEGER,
    previous_rank INTEGER,
    
    -- Score/metric
    score INTEGER NOT NULL,
    secondary_metric DECIMAL(8,2), -- For tie-breaking (time, accuracy, etc.)
    
    -- Achievement details
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(leaderboard_id, student_id)
);

-- Game tournaments and challenges
CREATE TABLE IF NOT EXISTS game_tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    tournament_type VARCHAR(20) CHECK (tournament_type IN ('single_elimination', 'round_robin', 'ladder', 'time_attack')) DEFAULT 'ladder',
    
    -- Games included
    game_ids UUID[] NOT NULL,
    
    -- Scheduling
    registration_start TIMESTAMPTZ NOT NULL,
    registration_end TIMESTAMPTZ NOT NULL,
    tournament_start TIMESTAMPTZ NOT NULL,
    tournament_end TIMESTAMPTZ NOT NULL,
    
    -- Participation
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    entry_fee_gems INTEGER DEFAULT 0,
    
    -- Eligibility
    eligible_grades TEXT[] DEFAULT '{}',
    min_level_required INTEGER DEFAULT 1,
    required_achievements UUID[] DEFAULT '{}',
    
    -- Prizes and rewards
    prize_pool JSONB DEFAULT '[]', -- [{rank: 1, xp: 500, gems: 100, title: "Champion"}]
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('upcoming', 'registration_open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'upcoming',
    
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournament participants
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES game_tournaments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Registration
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    entry_fee_paid INTEGER DEFAULT 0,
    
    -- Performance
    total_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    current_rank INTEGER,
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('registered', 'active', 'eliminated', 'withdrawn')) DEFAULT 'registered',
    
    UNIQUE(tournament_id, student_id)
);

-- Game collections and playlists
CREATE TABLE IF NOT EXISTS game_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    collection_type VARCHAR(30) CHECK (collection_type IN (
        'subject_focus', 'skill_building', 'assessment_prep', 'fun_learning', 
        'challenge_series', 'curriculum_aligned', 'custom'
    )) NOT NULL,
    
    -- Games in collection
    game_ids UUID[] NOT NULL,
    recommended_order INTEGER[] DEFAULT '{}', -- Suggested play order
    
    -- Progression
    is_sequential BOOLEAN DEFAULT false, -- Must complete in order
    unlock_next_on_completion BOOLEAN DEFAULT false,
    
    -- Visual design
    banner_image_url TEXT,
    color_theme VARCHAR(7) DEFAULT '#3B82F6',
    
    -- Metadata
    estimated_total_time_minutes INTEGER,
    difficulty_progression VARCHAR(20) CHECK (difficulty_progression IN ('easy_to_hard', 'mixed', 'adaptive')) DEFAULT 'mixed',
    
    -- Availability
    is_public BOOLEAN DEFAULT true,
    target_grades TEXT[] DEFAULT '{}',
    
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student progress in game collections
CREATE TABLE IF NOT EXISTS student_collection_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES game_collections(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Progress tracking
    games_completed INTEGER DEFAULT 0,
    total_games INTEGER NOT NULL,
    current_game_index INTEGER DEFAULT 0,
    
    -- Performance summary
    total_score INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    total_time_spent_seconds INTEGER DEFAULT 0,
    
    -- Completion status
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    completion_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_games > 0 THEN (games_completed::DECIMAL / total_games * 100)
            ELSE 0
        END
    ) STORED,
    
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_played TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(collection_id, student_id)
);

-- Game analytics and insights
CREATE TABLE IF NOT EXISTS game_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES learning_games(id) ON DELETE CASCADE,
    
    -- Time period for analytics
    date_period DATE NOT NULL,
    period_type VARCHAR(10) CHECK (period_type IN ('daily', 'weekly', 'monthly')) NOT NULL,
    
    -- Engagement metrics
    unique_players INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Performance metrics
    average_score DECIMAL(5,2) DEFAULT 0,
    average_duration_seconds INTEGER DEFAULT 0,
    average_attempts DECIMAL(4,2) DEFAULT 0,
    
    -- Difficulty analysis
    questions_by_difficulty JSONB DEFAULT '{}', -- {1: {correct: 150, total: 200}, 2: {...}}
    common_mistakes JSONB DEFAULT '[]', -- [{question_id: "...", mistake: "...", frequency: 25}]
    
    -- Learning effectiveness
    improvement_rate DECIMAL(5,2) DEFAULT 0, -- Score improvement over attempts
    retention_rate DECIMAL(5,2) DEFAULT 0, -- Students returning to play again
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(game_id, date_period, period_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_games_school_subject ON learning_games(school_id, subject);
CREATE INDEX IF NOT EXISTS idx_learning_games_type ON learning_games(game_type);
CREATE INDEX IF NOT EXISTS idx_learning_games_difficulty ON learning_games(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_learning_games_grade_levels ON learning_games USING GIN(grade_levels);
CREATE INDEX IF NOT EXISTS idx_learning_games_featured ON learning_games(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_game_sessions_game_student ON game_sessions(game_id, student_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_student_date ON game_sessions(student_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_completed ON game_sessions(completed_at DESC) WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_game_question_responses_session ON game_question_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_game_question_responses_correct ON game_question_responses(is_correct);

CREATE INDEX IF NOT EXISTS idx_game_leaderboard_entries_leaderboard_rank ON game_leaderboard_entries(leaderboard_id, current_rank);
CREATE INDEX IF NOT EXISTS idx_game_leaderboard_entries_student ON game_leaderboard_entries(student_id);

CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_student ON tournament_participants(student_id);

-- Triggers for updated_at
CREATE TRIGGER update_learning_games_updated_at BEFORE UPDATE ON learning_games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_tournaments_updated_at BEFORE UPDATE ON game_tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_game_collections_updated_at BEFORE UPDATE ON game_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update game statistics
CREATE OR REPLACE FUNCTION update_game_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update total plays
        UPDATE learning_games 
        SET total_plays = total_plays + 1,
            updated_at = NOW()
        WHERE id = NEW.game_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update completions and average score when session is completed
        IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
            UPDATE learning_games 
            SET 
                total_completions = total_completions + 1,
                average_score = (
                    SELECT AVG(percentage_score) 
                    FROM game_sessions 
                    WHERE game_id = NEW.game_id AND status = 'completed'
                ),
                average_duration_seconds = (
                    SELECT AVG(total_duration_seconds) 
                    FROM game_sessions 
                    WHERE game_id = NEW.game_id AND status = 'completed'
                ),
                updated_at = NOW()
            WHERE id = NEW.game_id;
        END IF;
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_game_stats 
    AFTER INSERT OR UPDATE ON game_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_game_stats();

-- Function to update tournament participant count
CREATE OR REPLACE FUNCTION update_tournament_participants()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE game_tournaments 
        SET current_participants = current_participants + 1,
            updated_at = NOW()
        WHERE id = NEW.tournament_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE game_tournaments 
        SET current_participants = current_participants - 1,
            updated_at = NOW()
        WHERE id = OLD.tournament_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_tournament_participants 
    AFTER INSERT OR DELETE ON tournament_participants 
    FOR EACH ROW EXECUTE FUNCTION update_tournament_participants();

-- RLS Policies
ALTER TABLE learning_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

-- Policies for learning_games
CREATE POLICY "Users can view active games in their school" ON learning_games
    FOR SELECT USING (
        is_active = true AND 
        school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
    );

-- Policies for game_sessions
CREATE POLICY "Users can view and manage their own game sessions" ON game_sessions
    FOR ALL USING (
        student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Sample data
INSERT INTO learning_games (school_id, title, description, game_type, subject, grade_levels, difficulty_level, game_config, max_score, xp_reward, gem_reward, created_by) VALUES
(
    (SELECT id FROM schools LIMIT 1),
    'Math Quiz Challenge',
    'Test your algebra skills with this fun quiz game covering equations, inequalities, and graphing.',
    'quiz',
    'Mathematics',
    ARRAY['9', '10'],
    2,
    '{"questions": [{"id": "q1", "text": "Solve: 2x + 5 = 13", "type": "multiple_choice", "options": ["x = 4", "x = 6", "x = 8", "x = 9"], "correct": 0}], "time_limit": 300, "randomize": true}',
    100,
    25,
    5,
    (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1)
),
(
    (SELECT id FROM schools LIMIT 1),
    'Vocabulary Builder',
    'Expand your English vocabulary with this interactive matching game.',
    'matching',
    'English',
    ARRAY['8', '9', '10'],
    1,
    '{"pairs": [{"word": "Eloquent", "definition": "Fluent and persuasive in speaking"}, {"word": "Meticulous", "definition": "Showing great attention to detail"}], "grid_size": "4x4"}',
    100,
    20,
    4,
    (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1 OFFSET 1)
),
(
    (SELECT id FROM schools LIMIT 1),
    'Science Lab Simulation',
    'Conduct virtual chemistry experiments safely in this interactive simulation.',
    'simulation',
    'Chemistry',
    ARRAY['10', '11', '12'],
    4,
    '{"experiments": [{"name": "Acid-Base Titration", "equipment": ["burette", "conical_flask", "indicator"], "steps": ["Fill burette with acid solution", "Add indicator to base solution", "Titrate slowly until color change", "Record volume used"]}], "safety_checks": true}',
    150,
    40,
    8,
    (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1 OFFSET 2)
);

-- Create sample game collections
INSERT INTO game_collections (school_id, title, description, collection_type, game_ids, created_by) VALUES
(
    (SELECT id FROM schools LIMIT 1),
    'Math Mastery Series',
    'Complete collection of math games from basic arithmetic to advanced algebra.',
    'subject_focus',
    ARRAY[(SELECT id FROM learning_games WHERE subject = 'Mathematics' LIMIT 1)],
    (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1)
),
(
    (SELECT id FROM schools LIMIT 1),
    'Quick Learning Breaks',
    'Short 5-minute games perfect for study breaks and quick reviews.',
    'fun_learning',
    ARRAY[(SELECT id FROM learning_games WHERE estimated_duration_minutes <= 10 LIMIT 1)],
    (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1)
);
