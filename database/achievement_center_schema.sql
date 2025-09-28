-- Achievement Center Database Schema
-- This schema supports comprehensive gamification with badges, achievements, leaderboards, and rewards

-- Achievement definitions and templates
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) CHECK (category IN (
        'academic', 'participation', 'leadership', 'creativity', 'community_service', 
        'attendance', 'improvement', 'collaboration', 'milestone', 'special'
    )) NOT NULL,
    
    -- Visual design
    icon_name VARCHAR(50) NOT NULL, -- Lucide icon name
    icon_color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
    badge_design JSONB DEFAULT '{}', -- {shape: "circle", gradient: [...], border: "..."}
    rarity VARCHAR(20) CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    
    -- Achievement criteria and requirements
    criteria_type VARCHAR(30) CHECK (criteria_type IN (
        'single_action', 'cumulative_count', 'streak', 'percentage', 'time_based', 
        'grade_based', 'participation_based', 'custom'
    )) NOT NULL,
    criteria_config JSONB NOT NULL, -- Configuration for the specific criteria type
    -- Examples:
    -- single_action: {action: "complete_first_quest", target: 1}
    -- cumulative_count: {action: "submit_assignment", target: 50, timeframe: "semester"}
    -- streak: {action: "daily_login", target: 30}
    -- percentage: {action: "quiz_score", target: 95, subject: "math"}
    
    -- Requirements and dependencies
    prerequisite_achievements UUID[] DEFAULT '{}', -- Must earn these first
    required_grade_levels TEXT[] DEFAULT '{}', -- ['9', '10'] or empty for all
    required_subjects TEXT[] DEFAULT '{}', -- Specific subjects or empty for all
    
    -- Points and rewards
    xp_reward INTEGER DEFAULT 0 CHECK (xp_reward >= 0),
    gem_reward INTEGER DEFAULT 0 CHECK (gem_reward >= 0),
    special_rewards JSONB DEFAULT '[]', -- [{type: "badge", name: "...", description: "..."}]
    
    -- Availability and timing
    is_active BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false, -- Hidden until unlocked
    start_date DATE,
    end_date DATE,
    is_seasonal BOOLEAN DEFAULT false,
    season_config JSONB, -- {months: [9, 10, 11], years: [2025]}
    
    -- Difficulty and progression
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
    estimated_time_hours INTEGER, -- How long it typically takes
    completion_rate DECIMAL(5,2) DEFAULT 0.0, -- Percentage of students who complete it
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search and organization
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false
);

-- Student achievement progress and completions
CREATE TABLE IF NOT EXISTS student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Progress tracking
    current_progress INTEGER DEFAULT 0,
    target_progress INTEGER NOT NULL, -- Copied from achievement criteria
    progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN target_progress > 0 THEN (current_progress::DECIMAL / target_progress * 100)
            ELSE 0
        END
    ) STORED,
    
    -- Completion details
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    completion_method VARCHAR(50), -- 'automatic', 'manual_verification', 'teacher_approved'
    verified_by UUID REFERENCES profiles(id),
    verification_notes TEXT,
    
    -- Progress history and milestones
    progress_history JSONB DEFAULT '[]', -- [{date: "2025-09-27", progress: 25, milestone: "Quarter complete"}]
    milestone_rewards_claimed JSONB DEFAULT '{}', -- {25: true, 50: false, 75: false}
    
    -- Rewards received
    xp_earned INTEGER DEFAULT 0,
    gems_earned INTEGER DEFAULT 0,
    special_rewards_received JSONB DEFAULT '[]',
    
    -- Social features
    is_showcased BOOLEAN DEFAULT false, -- Display on profile
    celebration_shared BOOLEAN DEFAULT false, -- Shared completion with friends
    
    -- Metadata
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, achievement_id)
);

-- Achievement categories and collections
CREATE TABLE IF NOT EXISTS achievement_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    collection_type VARCHAR(30) CHECK (collection_type IN (
        'subject_mastery', 'grade_level', 'seasonal', 'special_event', 'skill_tree', 'custom'
    )) NOT NULL,
    
    -- Visual design
    banner_image_url TEXT,
    icon_name VARCHAR(50),
    color_theme VARCHAR(7) DEFAULT '#3B82F6',
    
    -- Collection mechanics
    achievement_ids UUID[] NOT NULL, -- Achievements in this collection
    completion_requirement VARCHAR(20) CHECK (completion_requirement IN ('all', 'any', 'percentage', 'count')) DEFAULT 'all',
    completion_threshold INTEGER DEFAULT 1, -- For percentage/count requirements
    
    -- Collection rewards
    collection_xp_bonus INTEGER DEFAULT 0,
    collection_gem_bonus INTEGER DEFAULT 0,
    collection_badge_name VARCHAR(100), -- Special badge for completing collection
    collection_title VARCHAR(100), -- Title awarded (e.g., "Math Master")
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    unlock_requirements JSONB DEFAULT '{}', -- {grade_level: "10", achievements: [...]}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student collection progress
CREATE TABLE IF NOT EXISTS student_collection_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES achievement_collections(id) ON DELETE CASCADE,
    
    -- Progress tracking
    achievements_completed INTEGER DEFAULT 0,
    total_achievements INTEGER NOT NULL,
    completion_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_achievements > 0 THEN (achievements_completed::DECIMAL / total_achievements * 100)
            ELSE 0
        END
    ) STORED,
    
    -- Completion status
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    collection_rewards_claimed BOOLEAN DEFAULT false,
    
    -- Progress milestones
    milestones_reached JSONB DEFAULT '{}', -- {25: "2025-09-27T10:00:00Z", 50: null, ...}
    
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, collection_id)
);

-- Leaderboards and rankings
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    leaderboard_type VARCHAR(30) CHECK (leaderboard_type IN (
        'xp_total', 'xp_weekly', 'xp_monthly', 'achievements_count', 'gems_total', 
        'subject_specific', 'grade_level', 'custom_metric'
    )) NOT NULL,
    
    -- Scope and filtering
    scope VARCHAR(20) CHECK (scope IN ('school_wide', 'grade_level', 'subject', 'class')) DEFAULT 'school_wide',
    grade_levels TEXT[] DEFAULT '{}', -- Filter by grade levels
    subjects TEXT[] DEFAULT '{}', -- Filter by subjects
    class_ids UUID[] DEFAULT '{}', -- Filter by specific classes
    
    -- Time period
    time_period VARCHAR(20) CHECK (time_period IN ('all_time', 'yearly', 'semester', 'monthly', 'weekly', 'daily')) DEFAULT 'all_time',
    reset_frequency VARCHAR(20) CHECK (reset_frequency IN ('never', 'daily', 'weekly', 'monthly', 'semester', 'yearly')),
    last_reset TIMESTAMPTZ,
    next_reset TIMESTAMPTZ,
    
    -- Display settings
    max_positions INTEGER DEFAULT 100 CHECK (max_positions > 0),
    show_ties BOOLEAN DEFAULT true,
    show_percentiles BOOLEAN DEFAULT false,
    
    -- Rewards for top positions
    position_rewards JSONB DEFAULT '[]', -- [{positions: [1], xp: 100, gems: 50, title: "Champion"}]
    
    -- Visibility and access
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true, -- Visible to all students
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard entries and rankings
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Ranking information
    current_position INTEGER,
    previous_position INTEGER,
    position_change INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN previous_position IS NOT NULL AND current_position IS NOT NULL 
            THEN previous_position - current_position
            ELSE 0
        END
    ) STORED,
    
    -- Score/metric value
    score DECIMAL(12,2) NOT NULL DEFAULT 0,
    previous_score DECIMAL(12,2),
    score_change DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE 
            WHEN previous_score IS NOT NULL 
            THEN score - previous_score
            ELSE score
        END
    ) STORED,
    
    -- Additional metrics for context
    secondary_metrics JSONB DEFAULT '{}', -- {achievements: 15, streak: 7, ...}
    
    -- Timestamps
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    last_score_update TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(leaderboard_id, student_id)
);

-- Reward system and virtual economy
CREATE TABLE IF NOT EXISTS student_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Current balances
    total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
    available_gems INTEGER DEFAULT 0 CHECK (available_gems >= 0),
    spent_gems INTEGER DEFAULT 0 CHECK (spent_gems >= 0),
    
    -- Level system
    current_level INTEGER DEFAULT 1 CHECK (current_level >= 1),
    xp_for_next_level INTEGER DEFAULT 100,
    level_progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN xp_for_next_level > 0 
            THEN ((total_xp % xp_for_next_level)::DECIMAL / xp_for_next_level * 100)
            ELSE 0
        END
    ) STORED,
    
    -- Streaks and consistency
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    
    -- Titles and badges
    active_title VARCHAR(100),
    unlocked_titles TEXT[] DEFAULT '{}',
    featured_badges UUID[] DEFAULT '{}', -- Achievement IDs to display on profile
    
    -- Statistics
    total_achievements_earned INTEGER DEFAULT 0,
    rare_achievements_earned INTEGER DEFAULT 0,
    collections_completed INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one reward record per student
    UNIQUE(student_id)
);

-- Reward transactions and history
CREATE TABLE IF NOT EXISTS reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('earned', 'spent', 'bonus', 'penalty', 'transfer', 'refund')) NOT NULL,
    reward_type VARCHAR(20) CHECK (reward_type IN ('xp', 'gems', 'title', 'badge')) NOT NULL,
    
    -- Transaction details
    amount INTEGER NOT NULL, -- Can be negative for spending/penalties
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    
    -- Source/reason
    source_type VARCHAR(30) CHECK (source_type IN (
        'achievement', 'quest', 'assignment', 'participation', 'bonus', 
        'purchase', 'admin_adjustment', 'event_reward', 'referral'
    )) NOT NULL,
    source_id UUID, -- ID of the source (achievement_id, quest_id, etc.)
    description TEXT NOT NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- Additional context
    processed_by UUID REFERENCES profiles(id), -- For manual transactions
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchasable rewards and store items
CREATE TABLE IF NOT EXISTS reward_store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    item_type VARCHAR(30) CHECK (item_type IN (
        'avatar_customization', 'profile_theme', 'title', 'badge', 'privilege', 
        'physical_reward', 'experience', 'boost', 'cosmetic'
    )) NOT NULL,
    
    -- Pricing
    gem_cost INTEGER NOT NULL CHECK (gem_cost >= 0),
    xp_cost INTEGER DEFAULT 0 CHECK (xp_cost >= 0),
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    stock_quantity INTEGER, -- NULL for unlimited
    max_per_student INTEGER DEFAULT 1, -- Purchase limit per student
    
    -- Requirements
    required_level INTEGER DEFAULT 1,
    required_achievements UUID[] DEFAULT '{}',
    required_titles TEXT[] DEFAULT '{}',
    
    -- Item details
    item_data JSONB DEFAULT '{}', -- Specific data for the item type
    preview_image_url TEXT,
    
    -- Visibility and timing
    is_featured BOOLEAN DEFAULT false,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student purchases from reward store
CREATE TABLE IF NOT EXISTS student_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES reward_store_items(id) ON DELETE CASCADE,
    
    -- Purchase details
    gems_spent INTEGER NOT NULL,
    xp_spent INTEGER DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('completed', 'pending', 'cancelled', 'refunded')) DEFAULT 'completed',
    
    -- Fulfillment
    is_redeemed BOOLEAN DEFAULT false,
    redeemed_at TIMESTAMPTZ,
    redemption_notes TEXT,
    
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_achievements_school_category ON achievements(school_id, category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_achievements_featured ON achievements(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_student_achievements_student ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_achievement ON student_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_completed ON student_achievements(is_completed, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_achievements_progress ON student_achievements(progress_percentage DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_leaderboard_position ON leaderboard_entries(leaderboard_id, current_position);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_student ON leaderboard_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_score ON leaderboard_entries(score DESC);

CREATE INDEX IF NOT EXISTS idx_student_rewards_student ON student_rewards(student_id);
CREATE INDEX IF NOT EXISTS idx_student_rewards_level ON student_rewards(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_student_rewards_xp ON student_rewards(total_xp DESC);

CREATE INDEX IF NOT EXISTS idx_reward_transactions_student_date ON reward_transactions(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_type ON reward_transactions(transaction_type, reward_type);

-- Triggers for updated_at
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_achievement_collections_updated_at BEFORE UPDATE ON achievement_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaderboards_updated_at BEFORE UPDATE ON leaderboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reward_store_items_updated_at BEFORE UPDATE ON reward_store_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update student rewards when achievements are completed
CREATE OR REPLACE FUNCTION update_student_rewards_on_achievement()
RETURNS TRIGGER AS $$
DECLARE
    achievement_record RECORD;
BEGIN
    IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
        -- Get achievement details
        SELECT xp_reward, gem_reward INTO achievement_record
        FROM achievements 
        WHERE id = NEW.achievement_id;
        
        -- Update student rewards
        UPDATE student_rewards 
        SET 
            total_xp = total_xp + achievement_record.xp_reward,
            available_gems = available_gems + achievement_record.gem_reward,
            total_achievements_earned = total_achievements_earned + 1,
            updated_at = NOW()
        WHERE student_id = NEW.student_id;
        
        -- Create reward transaction records
        IF achievement_record.xp_reward > 0 THEN
            INSERT INTO reward_transactions (
                student_id, transaction_type, reward_type, amount, 
                balance_before, balance_after, source_type, source_id, description
            ) VALUES (
                NEW.student_id, 'earned', 'xp', achievement_record.xp_reward,
                (SELECT total_xp - achievement_record.xp_reward FROM student_rewards WHERE student_id = NEW.student_id),
                (SELECT total_xp FROM student_rewards WHERE student_id = NEW.student_id),
                'achievement', NEW.achievement_id,
                'XP earned from completing achievement'
            );
        END IF;
        
        IF achievement_record.gem_reward > 0 THEN
            INSERT INTO reward_transactions (
                student_id, transaction_type, reward_type, amount,
                balance_before, balance_after, source_type, source_id, description
            ) VALUES (
                NEW.student_id, 'earned', 'gems', achievement_record.gem_reward,
                (SELECT available_gems - achievement_record.gem_reward FROM student_rewards WHERE student_id = NEW.student_id),
                (SELECT available_gems FROM student_rewards WHERE student_id = NEW.student_id),
                'achievement', NEW.achievement_id,
                'Gems earned from completing achievement'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_student_rewards_on_achievement 
    AFTER UPDATE ON student_achievements 
    FOR EACH ROW EXECUTE FUNCTION update_student_rewards_on_achievement();

-- Function to calculate and update student level
CREATE OR REPLACE FUNCTION update_student_level()
RETURNS TRIGGER AS $$
DECLARE
    new_level INTEGER;
    xp_for_level INTEGER;
BEGIN
    -- Simple level calculation: level = floor(sqrt(total_xp / 100)) + 1
    new_level := FLOOR(SQRT(NEW.total_xp::DECIMAL / 100)) + 1;
    xp_for_level := POWER(new_level, 2) * 100;
    
    -- Update level if it changed
    IF new_level != NEW.current_level THEN
        NEW.current_level := new_level;
        NEW.xp_for_next_level := POWER(new_level + 1, 2) * 100 - NEW.total_xp;
    ELSE
        NEW.xp_for_next_level := POWER(NEW.current_level + 1, 2) * 100 - NEW.total_xp;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_student_level 
    BEFORE UPDATE ON student_rewards 
    FOR EACH ROW EXECUTE FUNCTION update_student_level();

-- RLS Policies
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;

-- Sample data
INSERT INTO achievements (school_id, name, description, category, criteria_type, criteria_config, xp_reward, gem_reward, icon_name, rarity, created_by) VALUES
(
    (SELECT id FROM schools LIMIT 1),
    'First Steps',
    'Complete your first assignment successfully',
    'milestone',
    'single_action',
    '{"action": "complete_assignment", "target": 1}',
    50,
    10,
    'trophy',
    'common',
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
),
(
    (SELECT id FROM schools LIMIT 1),
    'Dedicated Learner',
    'Submit 25 assignments this semester',
    'academic',
    'cumulative_count',
    '{"action": "submit_assignment", "target": 25, "timeframe": "semester"}',
    200,
    50,
    'book-open',
    'uncommon',
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
),
(
    (SELECT id FROM schools LIMIT 1),
    'Perfect Attendance',
    'Attend school for 30 consecutive days',
    'attendance',
    'streak',
    '{"action": "daily_attendance", "target": 30}',
    300,
    75,
    'calendar-check',
    'rare',
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
),
(
    (SELECT id FROM schools LIMIT 1),
    'Math Wizard',
    'Score 95% or higher on 5 math quizzes',
    'academic',
    'percentage',
    '{"action": "quiz_score", "target": 95, "subject": "Mathematics", "count": 5}',
    400,
    100,
    'calculator',
    'epic',
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);

-- Initialize student rewards for existing students
INSERT INTO student_rewards (student_id)
SELECT id FROM profiles WHERE role = 'student'
ON CONFLICT (student_id) DO NOTHING;
