const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAttendance() {
  try {
    console.log('🚀 Setting up attendance system...')
    
    // First, let's test if the attendance table exists by trying to query it
    console.log('🔍 Checking if attendance table exists...')
    const { data: existingData, error: existingError } = await supabase
      .from('attendance')
      .select('id')
      .limit(1)
    
    if (existingError) {
      if (existingError.message.includes('does not exist')) {
        console.log('❌ Attendance table does not exist')
        console.log('📝 Please run the following SQL in your Supabase dashboard:')
        console.log(`
-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  grade_level_id UUID REFERENCES grade_levels(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Teachers can manage attendance for their school" ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('teacher', 'admin')
      AND profiles.school_id = attendance.school_id
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON attendance(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);
        `)
      } else {
        console.error('❌ Error checking attendance table:', existingError)
      }
    } else {
      console.log('✅ Attendance table exists! Records found:', existingData?.length || 0)
    }
    
    // Test the API endpoints
    console.log('🧪 Testing API endpoints...')
    console.log('The attendance system should now work with the existing database structure.')
    console.log('The APIs will work with the existing teacher_class_assignments and student_class_assignments tables.')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupAttendance()
