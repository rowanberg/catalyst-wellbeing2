-- Migration: Add Universal Welcome Post Feature
-- This enables a single, automated welcome post pinned to the top of every parent's community feed

-- Step 1: Add the is_school_welcome_post column to community_posts
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS is_school_welcome_post BOOLEAN DEFAULT false;

-- Step 2: Create index for efficient welcome post lookup
CREATE INDEX IF NOT EXISTS idx_community_posts_welcome 
ON community_posts(school_id, is_school_welcome_post) 
WHERE is_school_welcome_post = true;

-- Step 3: Add constraint to ensure only one welcome post per school
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_welcome_post_per_school
ON community_posts(school_id)
WHERE is_school_welcome_post = true;

-- Step 4: Create a system admin profile for school-level posts (if needed)
-- Note: This should be run per school. Replace with actual school_id values.
-- Example for inserting a welcome post:

/*
INSERT INTO community_posts (
    teacher_id,
    school_id,
    class_id,
    title,
    content,
    media_urls,
    post_type,
    visibility,
    is_pinned,
    is_school_welcome_post,
    created_at
) VALUES (
    (SELECT id FROM profiles WHERE role = 'admin' AND school_id = 'YOUR_SCHOOL_ID' LIMIT 1),
    'YOUR_SCHOOL_ID',
    NULL, -- No specific class
    'Welcome to Your School Community!',
    E'Hello Parents, and welcome to your private School Community feed!\n\nThis is your direct window into your child''s classroom. Here, teachers will share updates, photos, videos, and a glimpse into the wonderful learning happening every day.\n\n**How it works:**\n\n✨ **A Positive Highlights Reel**: This is a one-way feed from the school to you.\n\n❤️ **Emoji Reactions**: You can show your appreciation for posts by reacting with emojis. To keep the feed clear and positive, replies are disabled.\n\nWe''re excited for you to be a part of our connected community!',
    '[{"type": "image", "url": "https://placeholder-for-welcome-image.com/welcome.jpg", "thumbnail": "https://placeholder-for-welcome-image.com/welcome-thumb.jpg"}]'::jsonb,
    'announcement',
    'all_parents',
    true, -- Pinned
    true, -- Welcome post flag
    NOW()
) ON CONFLICT DO NOTHING;
*/

-- Step 5: Update RLS policies to allow parents to see welcome posts
-- (Assuming you already have RLS policies for community_posts)

COMMENT ON COLUMN community_posts.is_school_welcome_post IS 
'Marks this post as the universal welcome post for the school. Only one per school allowed.';
