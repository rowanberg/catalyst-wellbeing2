-- Parent Dashboard Schema
-- Tables for School Community Feed and Performance Analytics

-- School Community Posts (Teacher announcements with rich media)
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]', -- Array of {type: 'image'|'video'|'document', url: string, thumbnail: string}
    post_type TEXT CHECK (post_type IN ('announcement', 'achievement', 'event', 'resource', 'update')) DEFAULT 'update',
    visibility TEXT CHECK (visibility IN ('all_parents', 'class_parents', 'specific_parents')) DEFAULT 'class_parents',
    target_parent_ids UUID[] DEFAULT '{}', -- For specific_parents visibility
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent reactions to posts (no comments allowed)
CREATE TABLE IF NOT EXISTS post_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reaction TEXT CHECK (reaction IN ('like', 'love', 'celebrate', 'thanks', 'interesting')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, parent_id) -- One reaction per parent per post
);

-- Parent notification preferences
CREATE TABLE IF NOT EXISTS parent_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'low_grade', 'missing_assignment', 'attendance', 
        'wellbeing', 'achievement', 'weekly_summary'
    )),
    is_enabled BOOLEAN DEFAULT true,
    threshold_value DECIMAL(5,2), -- e.g., 70 for "grades below 70%"
    frequency TEXT CHECK (frequency IN ('immediate', 'daily', 'weekly')) DEFAULT 'immediate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, notification_type)
);

-- Attendance records (if not exists)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('present', 'absent', 'late', 'excused', 'half_day')) NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- Anonymous class/school performance aggregates (pre-calculated)
CREATE TABLE IF NOT EXISTS performance_benchmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id),
    subject TEXT NOT NULL,
    grade_level TEXT,
    metric_type TEXT CHECK (metric_type IN ('avg_grade', 'avg_gpa', 'completion_rate', 'attendance_rate')) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    student_count INTEGER NOT NULL, -- Number of students in calculation
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, class_id, subject, metric_type, calculation_date)
);

-- Parent viewed posts tracking (for read receipts)
CREATE TABLE IF NOT EXISTS post_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, parent_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_school_class ON community_posts(school_id, class_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_lookup ON performance_benchmarks(school_id, class_id, subject);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent ON parent_notifications(parent_id);

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Community Posts: Parents can view posts for their children's classes
CREATE POLICY "Parents view relevant posts" ON community_posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_child_relationships pcr
            JOIN student_class_assignments sca ON sca.student_id = pcr.child_id
            WHERE pcr.parent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            AND (
                community_posts.visibility = 'all_parents' 
                OR (community_posts.visibility = 'class_parents' AND sca.class_id = community_posts.class_id)
                OR (community_posts.visibility = 'specific_parents' AND pcr.parent_id = ANY(community_posts.target_parent_ids))
            )
        )
    );

-- Teachers can manage their own posts
CREATE POLICY "Teachers manage own posts" ON community_posts
    FOR ALL USING (
        teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Post Reactions: Parents can manage their own reactions
CREATE POLICY "Parents manage own reactions" ON post_reactions
    FOR ALL USING (
        parent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Parent Notifications: Parents manage their own preferences
CREATE POLICY "Parents manage own notifications" ON parent_notifications
    FOR ALL USING (
        parent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Attendance: Parents view their children's attendance
CREATE POLICY "Parents view children attendance" ON attendance_records
    FOR SELECT USING (
        student_id IN (
            SELECT child_id FROM parent_child_relationships
            WHERE parent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );

-- Performance Benchmarks: Parents view relevant benchmarks
CREATE POLICY "Parents view benchmarks" ON performance_benchmarks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_child_relationships pcr
            JOIN profiles p ON p.id = pcr.child_id
            WHERE pcr.parent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            AND p.school_id = performance_benchmarks.school_id
        )
    );

-- Post Views: Track parent views
CREATE POLICY "Parents track own views" ON post_views
    FOR ALL USING (
        parent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );
