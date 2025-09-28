-- Study Groups Database Schema
-- This schema supports collaborative learning groups with real-time features

-- Main study groups table
CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    description TEXT,
    max_members INTEGER DEFAULT 20 CHECK (max_members > 0 AND max_members <= 50),
    is_private BOOLEAN DEFAULT false,
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    meeting_schedule JSONB, -- {day: "tuesday", time: "16:00", frequency: "weekly"}
    next_session TIMESTAMPTZ,
    group_avatar_url TEXT,
    group_code VARCHAR(10) UNIQUE, -- For easy joining
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search and filtering
    tags TEXT[] DEFAULT '{}',
    grade_levels TEXT[] DEFAULT '{}', -- ['9', '10', '11']
    
    -- Statistics
    total_sessions INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    total_ratings INTEGER DEFAULT 0
);

-- Study group memberships
CREATE TABLE IF NOT EXISTS study_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('member', 'moderator', 'creator')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    contribution_score INTEGER DEFAULT 0, -- Points for participation
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(group_id, user_id)
);

-- Study group sessions/meetings
CREATE TABLE IF NOT EXISTS study_group_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    session_type VARCHAR(30) CHECK (session_type IN ('study', 'discussion', 'presentation', 'quiz', 'project')) DEFAULT 'study',
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    location_type VARCHAR(20) CHECK (location_type IN ('online', 'physical', 'hybrid')) DEFAULT 'online',
    location_details JSONB, -- {room: "Library Room 3", zoom_link: "...", meeting_id: "..."}
    max_attendees INTEGER,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')) DEFAULT 'scheduled',
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Session materials and resources
    materials JSONB DEFAULT '[]', -- [{type: "document", name: "...", url: "..."}]
    agenda JSONB DEFAULT '[]' -- [{time: "16:00", topic: "Introduction", duration: 15}]
);

-- Session attendance tracking
CREATE TABLE IF NOT EXISTS study_group_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES study_group_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0,
    participation_score INTEGER DEFAULT 0, -- 1-10 based on engagement
    notes TEXT, -- Personal notes from the session
    
    UNIQUE(session_id, user_id)
);

-- Group discussions/messages
CREATE TABLE IF NOT EXISTS study_group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    session_id UUID REFERENCES study_group_sessions(id) ON DELETE SET NULL,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message_type VARCHAR(20) CHECK (message_type IN ('text', 'image', 'file', 'link', 'poll', 'announcement')) DEFAULT 'text',
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]', -- [{type: "image", url: "...", name: "..."}]
    reply_to UUID REFERENCES study_group_messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Reactions and engagement
    reactions JSONB DEFAULT '{}', -- {"👍": ["user1", "user2"], "❤️": ["user3"]}
    mentions UUID[] DEFAULT '{}' -- Array of user IDs mentioned in the message
);

-- Study group resources/materials
CREATE TABLE IF NOT EXISTS study_group_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    resource_type VARCHAR(30) CHECK (resource_type IN ('document', 'video', 'audio', 'image', 'link', 'quiz', 'flashcard')) NOT NULL,
    file_url TEXT,
    file_size INTEGER, -- in bytes
    file_format VARCHAR(10), -- pdf, docx, mp4, etc.
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT true, -- Visible to all group members
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group ratings and reviews
CREATE TABLE IF NOT EXISTS study_group_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review TEXT,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);

-- Group join requests (for private groups)
CREATE TABLE IF NOT EXISTS study_group_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT, -- Why they want to join
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(group_id, user_id)
);

-- Study group achievements/milestones
CREATE TABLE IF NOT EXISTS study_group_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL, -- 'first_session', 'milestone_members', 'high_rating', etc.
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50), -- Lucide icon name
    color VARCHAR(7), -- Hex color
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Achievement criteria
    criteria JSONB -- {type: "member_count", target: 10, current: 8}
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_groups_school_subject ON study_groups(school_id, subject);
CREATE INDEX IF NOT EXISTS idx_study_groups_status ON study_groups(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_study_groups_difficulty ON study_groups(difficulty);
CREATE INDEX IF NOT EXISTS idx_study_groups_tags ON study_groups USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_at ON study_groups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_group_members_group_user ON study_group_members(group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user_active ON study_group_members(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_study_group_sessions_group_date ON study_group_sessions(group_id, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_study_group_sessions_status ON study_group_sessions(status);

CREATE INDEX IF NOT EXISTS idx_study_group_messages_group_created ON study_group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_group_messages_session ON study_group_messages(session_id) WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_study_group_resources_group ON study_group_resources(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_group_resources_type ON study_group_resources(resource_type);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON study_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_group_resources_updated_at BEFORE UPDATE ON study_group_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_group_ratings_updated_at BEFORE UPDATE ON study_group_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update member count when someone joins
        UPDATE study_groups 
        SET updated_at = NOW() 
        WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update member count when someone leaves
        UPDATE study_groups 
        SET updated_at = NOW() 
        WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_group_member_count 
    AFTER INSERT OR DELETE ON study_group_members 
    FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Function to update group rating
CREATE OR REPLACE FUNCTION update_group_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE study_groups 
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0) 
                FROM study_group_ratings 
                WHERE group_id = NEW.group_id
            ),
            total_ratings = (
                SELECT COUNT(*) 
                FROM study_group_ratings 
                WHERE group_id = NEW.group_id
            ),
            updated_at = NOW()
        WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE study_groups 
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0) 
                FROM study_group_ratings 
                WHERE group_id = OLD.group_id
            ),
            total_ratings = (
                SELECT COUNT(*) 
                FROM study_group_ratings 
                WHERE group_id = OLD.group_id
            ),
            updated_at = NOW()
        WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_group_rating 
    AFTER INSERT OR UPDATE OR DELETE ON study_group_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_group_rating();

-- RLS (Row Level Security) Policies
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_join_requests ENABLE ROW LEVEL SECURITY;

-- Policies for study_groups
CREATE POLICY "Users can view active groups in their school" ON study_groups
    FOR SELECT USING (
        status = 'active' AND 
        school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create groups in their school" ON study_groups
    FOR INSERT WITH CHECK (
        school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid()) AND
        created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Group creators and moderators can update groups" ON study_groups
    FOR UPDATE USING (
        id IN (
            SELECT group_id FROM study_group_members 
            WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) 
            AND role IN ('creator', 'moderator')
        )
    );

-- Policies for study_group_members
CREATE POLICY "Users can view members of groups they belong to" ON study_group_members
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM study_group_members 
            WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can join groups" ON study_group_members
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Sample data for testing
INSERT INTO study_groups (school_id, name, subject, description, max_members, difficulty, tags, grade_levels, created_by, group_code) VALUES
(
    (SELECT id FROM schools LIMIT 1),
    'Algebra Masters',
    'Mathematics',
    'Master algebraic concepts together! We meet twice a week to solve problems and help each other understand complex equations.',
    15,
    'intermediate',
    ARRAY['algebra', 'equations', 'problem-solving'],
    ARRAY['9', '10'],
    (SELECT id FROM profiles WHERE role = 'student' LIMIT 1),
    'ALG001'
),
(
    (SELECT id FROM schools LIMIT 1),
    'Chemistry Lab Partners',
    'Science',
    'Explore chemistry experiments and discuss lab results. Perfect for understanding chemical reactions and molecular structures.',
    12,
    'advanced',
    ARRAY['chemistry', 'experiments', 'lab-work'],
    ARRAY['10', '11'],
    (SELECT id FROM profiles WHERE role = 'student' LIMIT 1),
    'CHEM01'
),
(
    (SELECT id FROM schools LIMIT 1),
    'Creative Writing Circle',
    'English',
    'Share your stories, get feedback, and improve your writing skills in a supportive environment.',
    20,
    'beginner',
    ARRAY['creative-writing', 'storytelling', 'feedback'],
    ARRAY['8', '9', '10'],
    (SELECT id FROM profiles WHERE role = 'student' LIMIT 1),
    'WRITE1'
);
