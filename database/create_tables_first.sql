-- Create missing tables that are required for the functions to work

-- Create classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  grade_level VARCHAR(20) NOT NULL,
  subject VARCHAR(100),
  description TEXT,
  academic_year VARCHAR(20) NOT NULL DEFAULT '2024-2025',
  max_students INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(school_id, name, academic_year)
);

-- Create teacher_classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS teacher_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  is_primary_teacher BOOLEAN DEFAULT false,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(teacher_id, class_id)
);

-- Create parent_child_relationships table if it doesn't exist
CREATE TABLE IF NOT EXISTS parent_child_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'parent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(parent_id, child_id)
);
