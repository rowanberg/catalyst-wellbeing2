-- Intervention Activities Schema
-- Interactive well-being activities and tracking system

-- Activity Categories and Templates
CREATE TABLE intervention_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-built Activity Templates
CREATE TABLE activity_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES intervention_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    duration_minutes INT NOT NULL,
    materials_needed TEXT[],
    age_group VARCHAR(20) CHECK (age_group IN ('early_primary', 'primary', 'middle', 'secondary', 'all')),
    mood_targets VARCHAR(20)[] DEFAULT '{}', -- moods this activity helps with
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    group_size VARCHAR(20) DEFAULT 'class' CHECK (group_size IN ('individual', 'small_group', 'class', 'flexible')),
    benefits TEXT[],
    variations TEXT[],
    safety_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teacher's Custom Activities
CREATE TABLE custom_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES intervention_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    duration_minutes INT NOT NULL,
    materials_needed TEXT[],
    mood_targets VARCHAR(20)[] DEFAULT '{}',
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    group_size VARCHAR(20) DEFAULT 'class' CHECK (group_size IN ('individual', 'small_group', 'class', 'flexible')),
    benefits TEXT[],
    variations TEXT[],
    safety_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_shared BOOLEAN DEFAULT FALSE, -- can other teachers in school use it
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Sessions (when activities are conducted)
CREATE TABLE activity_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('template', 'custom')),
    activity_id UUID NOT NULL, -- references either activity_templates or custom_activities
    session_name VARCHAR(100),
    conducted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_actual_minutes INT,
    participant_count INT,
    participant_ids UUID[], -- specific students if not whole class
    session_notes TEXT,
    effectiveness_rating INT CHECK (effectiveness_rating BETWEEN 1 AND 5),
    mood_before JSONB, -- {"happy": 5, "sad": 3, "angry": 2, ...}
    mood_after JSONB,
    follow_up_needed BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Participation Tracking
CREATE TABLE student_activity_participation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES activity_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    participation_level VARCHAR(20) DEFAULT 'full' CHECK (participation_level IN ('none', 'minimal', 'partial', 'full', 'enthusiastic')),
    mood_before VARCHAR(20),
    mood_after VARCHAR(20),
    engagement_score INT CHECK (engagement_score BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- Activity Feedback and Ratings
CREATE TABLE activity_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('template', 'custom')),
    activity_id UUID NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    would_recommend BOOLEAN,
    suggested_improvements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default intervention categories
INSERT INTO intervention_categories (name, description, icon, color) VALUES
('Mindfulness', 'Breathing exercises, meditation, and mindful awareness activities', 'Brain', 'from-blue-400 to-blue-600'),
('Physical', 'Movement breaks, stretching, and energizing activities', 'Zap', 'from-green-400 to-green-600'),
('Social', 'Team building, communication, and relationship activities', 'Users', 'from-purple-400 to-purple-600'),
('Emotional', 'Emotion regulation, expression, and coping strategies', 'Heart', 'from-pink-400 to-pink-600'),
('Creative', 'Art, music, storytelling, and imaginative activities', 'Palette', 'from-yellow-400 to-orange-600'),
('Academic', 'Learning games, brain breaks, and educational activities', 'BookOpen', 'from-indigo-400 to-indigo-600');

-- Insert comprehensive activity templates
INSERT INTO activity_templates (category_id, name, description, instructions, duration_minutes, materials_needed, age_group, mood_targets, difficulty_level, group_size, benefits, variations, safety_notes) VALUES
-- Mindfulness Activities
((SELECT id FROM intervention_categories WHERE name = 'Mindfulness'), 
'Deep Breathing Garden', 
'A guided breathing exercise using nature imagery to help students relax and focus',
'1. Have students sit comfortably with feet flat on floor
2. Guide them to imagine they are flowers in a garden
3. Breathe in slowly (flower opening to sun) for 4 counts
4. Hold breath gently for 2 counts
5. Breathe out slowly (flower closing) for 6 counts
6. Repeat 5-8 times while maintaining garden imagery
7. End with gentle stretching like flowers swaying in breeze',
8,
ARRAY['Comfortable seating', 'Optional soft background music'],
'all',
ARRAY['anxious', 'overwhelmed', 'angry', 'restless'],
'easy',
'class',
ARRAY['Reduces anxiety', 'Improves focus', 'Teaches self-regulation', 'Promotes calm'],
ARRAY['Use ocean waves imagery', 'Add gentle hand movements', 'Include aromatherapy'],
'Ensure students with breathing difficulties can participate at their own pace'),

((SELECT id FROM intervention_categories WHERE name = 'Mindfulness'), 
'Mindful Body Scan', 
'Progressive relaxation technique to increase body awareness and reduce tension',
'1. Students lie down or sit comfortably
2. Start at the top of head, slowly move attention down body
3. Notice each body part without judgment
4. Tense and release each muscle group for 3 seconds
5. Pay attention to the difference between tense and relaxed
6. Move through: head, shoulders, arms, chest, stomach, legs, feet
7. End with whole body awareness and gratitude',
12,
ARRAY['Yoga mats or comfortable floor space', 'Quiet environment'],
'primary',
ARRAY['stressed', 'tense', 'overwhelmed'],
'medium',
'class',
ARRAY['Reduces physical tension', 'Increases body awareness', 'Promotes relaxation'],
ARRAY['Focus only on breathing', 'Add visualization', 'Use with calming music'],
'Check for students with physical limitations or trauma history'),

-- Physical Activities
((SELECT id FROM intervention_categories WHERE name = 'Physical'), 
'Energy Shake-Out', 
'Quick movement activity to release tension and boost energy levels',
'1. Stand with feet shoulder-width apart
2. Start shaking hands gently, gradually increase intensity
3. Add arms, then shoulders
4. Include whole upper body shaking for 30 seconds
5. Add gentle bouncing on feet
6. Shake whole body vigorously for 15 seconds
7. Gradually slow down and return to stillness
8. Take 3 deep breaths and notice how body feels',
5,
ARRAY['Open space', 'Comfortable clothing'],
'all',
ARRAY['restless', 'low_energy', 'frustrated'],
'easy',
'class',
ARRAY['Releases physical tension', 'Increases energy', 'Improves circulation'],
ARRAY['Add music with strong beat', 'Include animal movements', 'Partner shaking'],
'Ensure adequate space between students to avoid collisions'),

((SELECT id FROM intervention_categories WHERE name = 'Physical'), 
'Yoga Flow for Focus', 
'Simple yoga sequence to improve concentration and body awareness',
'1. Mountain Pose: Stand tall, arms at sides (1 min)
2. Tree Pose: Balance on one foot, other foot on ankle/calf (30 sec each side)
3. Forward Fold: Bend forward, let arms hang (1 min)
4. Cat-Cow: On hands and knees, arch and round back (1 min)
5. Child''s Pose: Sit back on heels, arms forward (1 min)
6. Seated Twist: Sit cross-legged, twist gently each direction (1 min)
7. Final relaxation: Lie down, focus on breathing (2 min)',
8,
ARRAY['Yoga mats', 'Comfortable clothing', 'Quiet space'],
'primary',
ARRAY['restless', 'unfocused', 'anxious'],
'medium',
'class',
ARRAY['Improves flexibility', 'Enhances focus', 'Builds body awareness'],
ARRAY['Add partner poses', 'Include animal-themed poses', 'Use guided imagery'],
'Modify poses for students with physical limitations'),

-- Social Activities
((SELECT id FROM intervention_categories WHERE name = 'Social'), 
'Compliment Circle', 
'Building positive relationships through appreciation and recognition',
'1. Sit in circle with all students visible to each other
2. Explain rules: genuine compliments only, everyone participates
3. Start with teacher giving compliment to student on right
4. That student gives compliment to next person
5. Continue around circle until everyone has given and received
6. Focus on character traits, efforts, or kind actions
7. End with group reflection on how it felt to give/receive compliments',
15,
ARRAY['Circle seating arrangement'],
'all',
ARRAY['sad', 'lonely', 'low_confidence'],
'easy',
'class',
ARRAY['Builds self-esteem', 'Strengthens relationships', 'Creates positive atmosphere'],
ARRAY['Written compliments', 'Specific theme compliments', 'Anonymous compliment box'],
'Monitor for students who might struggle to participate'),

((SELECT id FROM intervention_categories WHERE name = 'Social'), 
'Teamwork Challenge', 
'Collaborative problem-solving activity to build cooperation skills',
'1. Divide class into teams of 4-6 students
2. Present challenge: build tallest tower with given materials
3. Rules: everyone must contribute, no talking for first 2 minutes
4. Materials: paper, tape, straws, marshmallows
5. Teams have 10 minutes to plan and build
6. Test towers and celebrate all efforts
7. Debrief: what worked well? How did you communicate?
8. Discuss teamwork strategies learned',
20,
ARRAY['Paper', 'Tape', 'Straws', 'Marshmallows', 'Timer'],
'primary',
ARRAY['frustrated', 'isolated', 'competitive'],
'medium',
'small_group',
ARRAY['Develops cooperation', 'Improves communication', 'Builds problem-solving skills'],
ARRAY['Different building materials', 'Blindfolded building', 'Silent communication only'],
'Ensure balanced teams and monitor for exclusion'),

-- Emotional Activities
((SELECT id FROM intervention_categories WHERE name = 'Emotional'), 
'Emotion Weather Report', 
'Creative way for students to identify and express their current emotional state',
'1. Introduce concept: emotions are like weather - always changing
2. Give examples: sunny = happy, stormy = angry, cloudy = confused
3. Students draw their current emotional weather on paper
4. Add details: light rain = slightly sad, hurricane = very angry
5. Share in pairs or small groups if comfortable
6. Discuss: weather changes, emotions change too
7. Create class weather map showing everyone''s emotions
8. End with positive weather forecast for tomorrow',
15,
ARRAY['Paper', 'Colored pencils/markers', 'Weather symbols'],
'all',
ARRAY['confused', 'mixed_emotions', 'difficulty_expressing'],
'easy',
'class',
ARRAY['Improves emotional vocabulary', 'Encourages expression', 'Normalizes emotions'],
ARRAY['3D weather models', 'Emotion weather journal', 'Group weather patterns'],
'Respect students who prefer not to share publicly'),

((SELECT id FROM intervention_categories WHERE name = 'Emotional'), 
'Gratitude Tree', 
'Collective activity to focus on positive aspects and build appreciation',
'1. Draw large tree trunk and branches on board/poster
2. Give each student leaf-shaped paper
3. Students write/draw something they''re grateful for
4. Share gratitude items in circle (optional)
5. Attach leaves to tree branches
6. Admire completed gratitude tree together
7. Discuss how gratitude makes us feel
8. Keep tree visible and add leaves throughout week',
20,
ARRAY['Large paper/poster', 'Leaf-shaped cutouts', 'Markers', 'Tape/glue'],
'all',
ARRAY['sad', 'negative', 'ungrateful'],
'easy',
'class',
ARRAY['Promotes positive thinking', 'Builds appreciation', 'Creates community'],
ARRAY['Gratitude journal', 'Photo gratitude', 'Gratitude letters'],
'Help students who struggle to identify positive things'),

-- Creative Activities
((SELECT id FROM intervention_categories WHERE name = 'Creative'), 
'Emotion Art Expression', 
'Non-verbal emotional expression through colors, shapes, and artistic creation',
'1. Provide various art materials
2. Ask students to think about current feeling
3. Choose colors that represent that emotion
4. Create abstract art using those colors
5. No rules - just express the feeling
6. Work in silence for 10 minutes
7. Optional sharing: what colors did you choose and why?
8. Display artwork and celebrate all expressions',
20,
ARRAY['Paper', 'Paints/markers/crayons', 'Brushes', 'Water containers'],
'all',
ARRAY['any - helps process all emotions'],
'easy',
'individual',
ARRAY['Provides emotional outlet', 'Develops creativity', 'Non-verbal expression'],
ARRAY['Clay sculpting', 'Collage making', 'Digital art'],
'No judgment on artistic ability - focus on expression'),

((SELECT id FROM intervention_categories WHERE name = 'Creative'), 
'Storytelling Circle', 
'Collaborative story creation to build imagination and social connection',
'1. Sit in circle with talking stick/object
2. Teacher starts story with opening sentence
3. Pass talking stick clockwise
4. Each student adds one sentence to story
5. Encourage creativity and building on others'' ideas
6. Continue until story reaches natural conclusion
7. Retell complete story together
8. Discuss favorite parts and creative elements',
25,
ARRAY['Talking stick/object', 'Circle seating'],
'all',
ARRAY['shy', 'disconnected', 'low_creativity'],
'medium',
'class',
ARRAY['Builds imagination', 'Encourages participation', 'Develops listening skills'],
ARRAY['Themed stories', 'Character-based stories', 'Illustrated stories'],
'Support shy students with encouragement, allow pass if needed');

-- Indexes for performance
CREATE INDEX idx_activity_templates_category ON activity_templates(category_id);
CREATE INDEX idx_activity_templates_mood ON activity_templates USING GIN(mood_targets);
CREATE INDEX idx_custom_activities_teacher ON custom_activities(teacher_id, is_active);
CREATE INDEX idx_activity_sessions_teacher ON activity_sessions(teacher_id, conducted_at DESC);
CREATE INDEX idx_activity_sessions_class ON activity_sessions(class_id, conducted_at DESC);
CREATE INDEX idx_student_participation_student ON student_activity_participation(student_id);

-- Row Level Security
ALTER TABLE custom_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_activity_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Teachers can manage their custom activities" ON custom_activities
    FOR ALL USING (
        teacher_id IN (
            SELECT t.id FROM teachers t 
            WHERE t.user_id = auth.uid() AND t.school_id = custom_activities.school_id
        )
    );

CREATE POLICY "Teachers can view shared activities in their school" ON custom_activities
    FOR SELECT USING (
        school_id IN (
            SELECT t.school_id FROM teachers t 
            WHERE t.user_id = auth.uid()
        ) AND is_shared = TRUE
    );

CREATE POLICY "Teachers can manage their activity sessions" ON activity_sessions
    FOR ALL USING (
        teacher_id IN (
            SELECT t.id FROM teachers t 
            WHERE t.user_id = auth.uid() AND t.school_id = activity_sessions.school_id
        )
    );

-- Functions
CREATE OR REPLACE FUNCTION get_recommended_activities(
    target_moods TEXT[],
    duration_max INT DEFAULT 30,
    group_size_pref TEXT DEFAULT 'class'
)
RETURNS TABLE (
    activity_id UUID,
    activity_name TEXT,
    category_name TEXT,
    description TEXT,
    duration_minutes INT,
    difficulty_level TEXT,
    rating DECIMAL,
    usage_count INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        at.id,
        at.name,
        ic.name,
        at.description,
        at.duration_minutes,
        at.difficulty_level,
        at.rating,
        at.usage_count
    FROM activity_templates at
    JOIN intervention_categories ic ON ic.id = at.category_id
    WHERE at.is_active = TRUE
    AND at.duration_minutes <= duration_max
    AND (group_size_pref = 'flexible' OR at.group_size = group_size_pref OR at.group_size = 'flexible')
    AND (target_moods IS NULL OR at.mood_targets && target_moods)
    ORDER BY 
        CASE WHEN at.mood_targets && target_moods THEN 1 ELSE 2 END,
        at.rating DESC,
        at.usage_count DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_activity_session(
    p_teacher_id UUID,
    p_class_id UUID,
    p_activity_type TEXT,
    p_activity_id UUID,
    p_session_name TEXT,
    p_duration_actual INT,
    p_participant_count INT,
    p_effectiveness_rating INT,
    p_session_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
    school_id_val UUID;
BEGIN
    -- Get school_id from teacher
    SELECT t.school_id INTO school_id_val
    FROM teachers t
    WHERE t.id = p_teacher_id;
    
    -- Insert session record
    INSERT INTO activity_sessions (
        school_id, teacher_id, class_id, activity_type, activity_id,
        session_name, duration_actual_minutes, participant_count,
        effectiveness_rating, session_notes
    ) VALUES (
        school_id_val, p_teacher_id, p_class_id, p_activity_type, p_activity_id,
        p_session_name, p_duration_actual, p_participant_count,
        p_effectiveness_rating, p_session_notes
    ) RETURNING id INTO session_id;
    
    -- Update usage count for template activities
    IF p_activity_type = 'template' THEN
        UPDATE activity_templates 
        SET usage_count = usage_count + 1
        WHERE id = p_activity_id;
    ELSE
        UPDATE custom_activities 
        SET usage_count = usage_count + 1
        WHERE id = p_activity_id;
    END IF;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
