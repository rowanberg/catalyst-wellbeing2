-- Catalyst Database Schema
-- This file contains the complete database schema for the Catalyst well-being platform

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

-- Profiles table (extends Supabase auth.users)
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
    strengths TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courage log entries
CREATE TABLE IF NOT EXISTS courage_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gratitude journal entries
CREATE TABLE IF NOT EXISTS gratitude_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Help requests
CREATE TABLE IF NOT EXISTS help_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    encrypted_message TEXT NOT NULL,
    school_encryption_key VARCHAR(64) NOT NULL,
    urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habit tracking
CREATE TABLE IF NOT EXISTS habit_tracker (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sleep_hours INTEGER,
    water_glasses INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Kindness counter
CREATE TABLE IF NOT EXISTS kindness_counter (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Digital detox sessions
CREATE TABLE IF NOT EXISTS digital_detox (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strengths quiz results
CREATE TABLE IF NOT EXISTS strengths_quiz (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_data JSONB NOT NULL,
    results TEXT[] NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parent-child relationships
CREATE TABLE IF NOT EXISTS parent_child_relationships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, child_id)
);

-- Teacher-class assignments
CREATE TABLE IF NOT EXISTS teacher_classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    class_name VARCHAR(100) NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student-class assignments
CREATE TABLE IF NOT EXISTS student_classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID REFERENCES teacher_classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, class_id)
);

-- Bullying reports
CREATE TABLE IF NOT EXISTS bullying_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    incident_description TEXT NOT NULL,
    incident_date DATE NOT NULL,
    location TEXT,
    witnesses TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_user_id_unique'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_courage_log_user_id ON courage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_id ON gratitude_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_student_id ON help_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_habit_tracker_user_id ON habit_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_tracker_date ON habit_tracker(date);
CREATE INDEX IF NOT EXISTS idx_kindness_counter_user_id ON kindness_counter(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE gratitude_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE kindness_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_detox ENABLE ROW LEVEL SECURITY;
ALTER TABLE strengths_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bullying_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for courage_log
DROP POLICY IF EXISTS "Users can view own courage entries" ON courage_log;
DROP POLICY IF EXISTS "Users can insert own courage entries" ON courage_log;
CREATE POLICY "Users can view own courage entries" ON courage_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own courage entries" ON courage_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for gratitude_entries
DROP POLICY IF EXISTS "Users can view own gratitude entries" ON gratitude_entries;
DROP POLICY IF EXISTS "Users can insert own gratitude entries" ON gratitude_entries;
CREATE POLICY "Users can view own gratitude entries" ON gratitude_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gratitude entries" ON gratitude_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for help_requests
DROP POLICY IF EXISTS "Students can view own help requests" ON help_requests;
DROP POLICY IF EXISTS "Students can insert own help requests" ON help_requests;
DROP POLICY IF EXISTS "Teachers and admins can view help requests" ON help_requests;
CREATE POLICY "Students can view own help requests" ON help_requests FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own help requests" ON help_requests FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Teachers and admins can view help requests" ON help_requests FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p1
        WHERE p1.user_id = auth.uid() 
        AND p1.role IN ('teacher', 'admin')
        AND EXISTS (
            SELECT 1 FROM profiles p2
            WHERE p2.user_id = help_requests.student_id
            AND p2.school_id = p1.school_id
        )
    )
);

-- Allow admins to update help requests only from their school
DROP POLICY IF EXISTS "Admins can update help requests from their school" ON help_requests;
CREATE POLICY "Admins can update help requests from their school" ON help_requests FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p1
        WHERE p1.user_id = auth.uid() 
        AND p1.role = 'admin'
        AND EXISTS (
            SELECT 1 FROM profiles p2
            WHERE p2.user_id = help_requests.student_id
            AND p2.school_id = p1.school_id
        )
    )
);

-- RLS Policies for habit_tracker
DROP POLICY IF EXISTS "Users can manage own habits" ON habit_tracker;
CREATE POLICY "Users can manage own habits" ON habit_tracker FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for kindness_counter
DROP POLICY IF EXISTS "Users can manage own kindness counter" ON kindness_counter;
CREATE POLICY "Users can manage own kindness counter" ON kindness_counter FOR ALL USING (auth.uid() = user_id);

-- Functions for automatic timestamp updates
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
DROP TRIGGER IF EXISTS update_help_requests_updated_at ON help_requests;
DROP TRIGGER IF EXISTS update_bullying_reports_updated_at ON bullying_reports;
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_help_requests_updated_at BEFORE UPDATE ON help_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bullying_reports_updated_at BEFORE UPDATE ON bullying_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
