-- Insert test announcements to verify the system is working
-- Run this after the main schema has been applied

INSERT INTO school_announcements (
    title,
    content,
    priority,
    author_name,
    school_id,
    target_audience,
    is_active,
    expires_at
) VALUES 
(
    'Welcome Back Students!',
    'We hope everyone had a wonderful break. Let''s make this semester amazing together!',
    'medium',
    'Principal Johnson',
    (SELECT id FROM schools LIMIT 1),
    'students',
    true,
    NOW() + INTERVAL '30 days'
),
(
    'Library Hours Extended',
    'Great news! The library will now be open until 8 PM on weekdays to support your studies.',
    'low',
    'Ms. Chen',
    (SELECT id FROM schools LIMIT 1),
    'students',
    true,
    NOW() + INTERVAL '14 days'
),
(
    'Important: Safety Drill Tomorrow',
    'We will be conducting a fire safety drill tomorrow at 10 AM. Please follow your teacher''s instructions.',
    'high',
    'Safety Coordinator',
    (SELECT id FROM schools LIMIT 1),
    'students',
    true,
    NOW() + INTERVAL '2 days'
);
