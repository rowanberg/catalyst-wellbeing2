-- Seed data for polls and announcements
-- Run this to create sample data for testing

-- Insert sample announcements
INSERT INTO school_announcements (
    school_id,
    title,
    content,
    priority,
    author_name,
    target_audience,
    is_active,
    created_by,
    created_at
)
SELECT 
    s.id as school_id,
    'Welcome to the New School Year!' as title,
    'We are excited to start this academic year with all of you. Please make sure to check your schedules and attend orientation.' as content,
    'high' as priority,
    'School Admin' as author_name,
    'all' as target_audience,
    true as is_active,
    p.user_id as created_by,
    NOW() as created_at
FROM schools s
CROSS JOIN LATERAL (
    SELECT user_id FROM profiles WHERE role = 'admin' AND school_id = s.id LIMIT 1
) p
WHERE NOT EXISTS (
    SELECT 1 FROM school_announcements WHERE title = 'Welcome to the New School Year!'
)
LIMIT 1;

INSERT INTO school_announcements (
    school_id,
    title,
    content,
    priority,
    author_name,
    target_audience,
    is_active,
    created_by,
    created_at
)
SELECT 
    s.id as school_id,
    'Important: Parent-Teacher Meeting Next Week' as title,
    'Parent-teacher conferences are scheduled for next week. Please check with your teachers for specific time slots.' as content,
    'medium' as priority,
    'School Admin' as author_name,
    'all' as target_audience,
    true as is_active,
    p.user_id as created_by,
    NOW() - INTERVAL '1 day' as created_at
FROM schools s
CROSS JOIN LATERAL (
    SELECT user_id FROM profiles WHERE role = 'admin' AND school_id = s.id LIMIT 1
) p
WHERE NOT EXISTS (
    SELECT 1 FROM school_announcements WHERE title = 'Important: Parent-Teacher Meeting Next Week'
)
LIMIT 1;

INSERT INTO school_announcements (
    school_id,
    title,
    content,
    priority,
    author_name,
    target_audience,
    is_active,
    created_by,
    created_at
)
SELECT 
    s.id as school_id,
    'School Sports Day - Friday' as title,
    'Join us for our annual sports day this Friday! All students are encouraged to participate. Parents are welcome to attend.' as content,
    'medium' as priority,
    'Athletics Department' as author_name,
    'students' as target_audience,
    true as is_active,
    p.user_id as created_by,
    NOW() - INTERVAL '2 hours' as created_at
FROM schools s
CROSS JOIN LATERAL (
    SELECT user_id FROM profiles WHERE role = 'admin' AND school_id = s.id LIMIT 1
) p
WHERE NOT EXISTS (
    SELECT 1 FROM school_announcements WHERE title = 'School Sports Day - Friday'
)
LIMIT 1;

-- Insert sample polls
INSERT INTO polls (
    id,
    title,
    description,
    type,
    status,
    school_id,
    created_by,
    target_audience,
    start_date,
    end_date,
    is_anonymous,
    allow_multiple_responses,
    require_authentication,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    'School Lunch Preferences' as title,
    'Help us improve our cafeteria menu by sharing your food preferences!' as description,
    'survey' as type,
    'active' as status,
    s.id as school_id,
    p.user_id as created_by,
    'students' as target_audience,
    NOW() as start_date,
    NOW() + INTERVAL '7 days' as end_date,
    false as is_anonymous,
    false as allow_multiple_responses,
    true as require_authentication,
    NOW() as created_at,
    NOW() as updated_at
FROM schools s
CROSS JOIN LATERAL (
    SELECT user_id FROM profiles WHERE role = 'admin' AND school_id = s.id LIMIT 1
) p
WHERE NOT EXISTS (
    SELECT 1 FROM polls WHERE title = 'School Lunch Preferences'
)
LIMIT 1
RETURNING id;

-- Insert poll questions for lunch preferences poll
INSERT INTO poll_questions (
    id,
    poll_id,
    question_text,
    question_type,
    options,
    required,
    order_index
)
SELECT 
    gen_random_uuid() as id,
    p.id as poll_id,
    'What is your favorite type of cuisine?' as question_text,
    'multiple_choice' as question_type,
    jsonb_build_array('Italian', 'Chinese', 'Mexican', 'Indian', 'American') as options,
    true as required,
    1 as order_index
FROM polls p
WHERE p.title = 'School Lunch Preferences'
AND NOT EXISTS (
    SELECT 1 FROM poll_questions pq WHERE pq.poll_id = p.id AND pq.question_text = 'What is your favorite type of cuisine?'
);

INSERT INTO poll_questions (
    id,
    poll_id,
    question_text,
    question_type,
    options,
    required,
    order_index
)
SELECT 
    gen_random_uuid() as id,
    p.id as poll_id,
    'Would you prefer more vegetarian options?' as question_text,
    'yes_no' as question_type,
    jsonb_build_array('Yes', 'No') as options,
    true as required,
    2 as order_index
FROM polls p
WHERE p.title = 'School Lunch Preferences'
AND NOT EXISTS (
    SELECT 1 FROM poll_questions pq WHERE pq.poll_id = p.id AND pq.question_text = 'Would you prefer more vegetarian options?'
);

-- Insert second poll
INSERT INTO polls (
    id,
    title,
    description,
    type,
    status,
    school_id,
    created_by,
    target_audience,
    start_date,
    end_date,
    is_anonymous,
    allow_multiple_responses,
    require_authentication,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    'Best Study Time' as title,
    'When do you study best? Help us schedule study halls at optimal times.' as description,
    'poll' as type,
    'active' as status,
    s.id as school_id,
    p.user_id as created_by,
    'all' as target_audience,
    NOW() - INTERVAL '1 day' as start_date,
    NOW() + INTERVAL '5 days' as end_date,
    false as is_anonymous,
    false as allow_multiple_responses,
    true as require_authentication,
    NOW() - INTERVAL '1 day' as created_at,
    NOW() - INTERVAL '1 day' as updated_at
FROM schools s
CROSS JOIN LATERAL (
    SELECT user_id FROM profiles WHERE role = 'admin' AND school_id = s.id LIMIT 1
) p
WHERE NOT EXISTS (
    SELECT 1 FROM polls WHERE title = 'Best Study Time'
)
LIMIT 1
RETURNING id;

-- Insert poll question for study time poll
INSERT INTO poll_questions (
    id,
    poll_id,
    question_text,
    question_type,
    options,
    required,
    order_index
)
SELECT 
    gen_random_uuid() as id,
    p.id as poll_id,
    'What time of day do you study most effectively?' as question_text,
    'multiple_choice' as question_type,
    jsonb_build_array('Early Morning (6-9 AM)', 'Late Morning (9-12 PM)', 'Afternoon (12-3 PM)', 'Evening (3-6 PM)', 'Night (6-9 PM)', 'Late Night (after 9 PM)') as options,
    true as required,
    1 as order_index
FROM polls p
WHERE p.title = 'Best Study Time'
AND NOT EXISTS (
    SELECT 1 FROM poll_questions pq WHERE pq.poll_id = p.id AND pq.question_text = 'What time of day do you study most effectively?'
);

-- Verify the data was inserted
SELECT 'Announcements created:' as info, COUNT(*) as count FROM school_announcements;
SELECT 'Polls created:' as info, COUNT(*) as count FROM polls;
SELECT 'Poll questions created:' as info, COUNT(*) as count FROM poll_questions;
