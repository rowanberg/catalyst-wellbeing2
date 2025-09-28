-- Clean Database Setup for Catalyst
-- Run this in Supabase SQL Editor to set up the database properly

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    admin_id UUID NOT NULL,
    school_code VARCHAR(12) UNIQUE NOT NULL,
    messaging_encryption_key VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
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
    grade_level VARCHAR(20),
    class_name VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Help requests table
CREATE TABLE IF NOT EXISTS help_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'in_progress', 'resolved', 'escalated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers and admins can view help requests" ON help_requests;
DROP POLICY IF EXISTS "Students can insert own help requests" ON help_requests;
DROP POLICY IF EXISTS "Admins can update help requests from their school" ON help_requests;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Teachers and admins can view help requests" ON help_requests 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('teacher', 'admin')
        AND p.school_id = help_requests.school_id
    )
);

CREATE POLICY "Students can insert own help requests" ON help_requests 
FOR INSERT WITH CHECK (
    auth.uid() = student_id 
    AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid()
        AND p.role = 'student'
        AND p.school_id = help_requests.school_id
    )
);

CREATE POLICY "Admins can update help requests from their school" ON help_requests 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid() 
        AND p.role = 'admin'
        AND p.school_id = help_requests.school_id
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_school_id ON help_requests(school_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_student_id ON help_requests(student_id);

-- Insert a test school if none exists
INSERT INTO schools (name, address, phone, email, admin_id, school_code, messaging_encryption_key)
SELECT 
    'Test School',
    '123 Education St, Learning City, LC 12345',
    '+1-555-0123',
    'admin@testschool.edu',
    '00000000-0000-0000-0000-000000000000',
    'TEST001',
    'test_encryption_key_12345'
WHERE NOT EXISTS (SELECT 1 FROM schools WHERE school_code = 'TEST001');
