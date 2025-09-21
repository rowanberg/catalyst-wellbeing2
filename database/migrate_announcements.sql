-- Migration script to handle announcements table structure
-- This script will either create the new table or migrate existing data

-- First, check if school_announcements table exists, if not create it
DO $$
BEGIN
    -- Check if school_announcements table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'school_announcements') THEN
        -- Create the new school_announcements table
        CREATE TABLE school_announcements (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
            author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            author_name VARCHAR(255),
            school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
            target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'teachers', 'parents')),
            is_active BOOLEAN DEFAULT true,
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX idx_school_announcements_school_id ON school_announcements(school_id);
        CREATE INDEX idx_school_announcements_created_at ON school_announcements(created_at DESC);
        CREATE INDEX idx_school_announcements_active ON school_announcements(is_active);
        CREATE INDEX idx_school_announcements_priority ON school_announcements(priority);

        -- Create updated_at trigger
        CREATE OR REPLACE FUNCTION update_school_announcements_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        CREATE TRIGGER trigger_update_school_announcements_updated_at
            BEFORE UPDATE ON school_announcements
            FOR EACH ROW
            EXECUTE FUNCTION update_school_announcements_updated_at();

        -- Enable RLS
        ALTER TABLE school_announcements ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Admins can manage school announcements" ON school_announcements
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.user_id = auth.uid() 
                    AND profiles.role = 'admin' 
                    AND profiles.school_id = school_announcements.school_id
                )
            );

        CREATE POLICY "Students can view active announcements" ON school_announcements
            FOR SELECT USING (
                is_active = true 
                AND (expires_at IS NULL OR expires_at > NOW())
                AND (target_audience IN ('all', 'students'))
                AND EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.user_id = auth.uid() 
                    AND profiles.school_id = school_announcements.school_id
                )
            );

        RAISE NOTICE 'Created school_announcements table successfully';
    ELSE
        -- Table exists, check if is_active column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'school_announcements' AND column_name = 'is_active') THEN
            -- Add missing columns to existing table
            ALTER TABLE school_announcements ADD COLUMN is_active BOOLEAN DEFAULT true;
            RAISE NOTICE 'Added is_active column to existing school_announcements table';
        END IF;

        -- Check and add other missing columns
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'school_announcements' AND column_name = 'target_audience') THEN
            ALTER TABLE school_announcements ADD COLUMN target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'teachers', 'parents'));
            RAISE NOTICE 'Added target_audience column to existing school_announcements table';
        END IF;

        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'school_announcements' AND column_name = 'author_name') THEN
            ALTER TABLE school_announcements ADD COLUMN author_name VARCHAR(255);
            RAISE NOTICE 'Added author_name column to existing school_announcements table';
        END IF;

        RAISE NOTICE 'Updated school_announcements table structure';
    END IF;
END
$$;
