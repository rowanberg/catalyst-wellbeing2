-- Fix for school registration - Creates essential tables
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS school_details CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

-- Schools table
CREATE TABLE schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    admin_id UUID NOT NULL,
    school_code VARCHAR(12) UNIQUE NOT NULL,
    messaging_encryption_key VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'parent', 'teacher', 'admin')),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    avatar_url TEXT,
    xp INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    strengths TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- School details table (additional school information)
CREATE TABLE school_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
    school_name VARCHAR(255),
    school_code VARCHAR(12),
    primary_email VARCHAR(255),
    primary_phone VARCHAR(20),
    street_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    school_type VARCHAR(50),
    principal_name VARCHAR(255),
    principal_email VARCHAR(255),
    principal_phone VARCHAR(20),
    student_count INTEGER DEFAULT 0,
    teacher_count INTEGER DEFAULT 0,
    setup_completed BOOLEAN DEFAULT FALSE,
    setup_completed_by UUID REFERENCES auth.users(id),
    setup_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_school_id ON profiles(school_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_school_details_school_id ON school_details(school_id);

-- Enable Row Level Security
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can bypass RLS for profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can bypass RLS for profiles" ON profiles 
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for schools
DROP POLICY IF EXISTS "Admins can view own school" ON schools;
DROP POLICY IF EXISTS "Service role can bypass RLS for schools" ON schools;

CREATE POLICY "Admins can view own school" ON schools 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.school_id = schools.id
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Service role can bypass RLS for schools" ON schools 
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for school_details
DROP POLICY IF EXISTS "Admins can view own school details" ON school_details;
DROP POLICY IF EXISTS "Service role can bypass RLS for school_details" ON school_details;

CREATE POLICY "Admins can view own school details" ON school_details 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.school_id = school_details.school_id
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Service role can bypass RLS for school_details" ON school_details 
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_schools_updated_at ON schools;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_school_details_updated_at ON school_details;

CREATE TRIGGER update_schools_updated_at 
    BEFORE UPDATE ON schools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_details_updated_at 
    BEFORE UPDATE ON school_details 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT 
    'schools' as table_name, 
    COUNT(*) as exists 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'schools'
UNION ALL
SELECT 
    'profiles' as table_name, 
    COUNT(*) as exists 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles'
UNION ALL
SELECT 
    'school_details' as table_name, 
    COUNT(*) as exists 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'school_details';
