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

async function createAttendanceTable() {
  try {
    console.log('🚀 Creating attendance table...')
    
    // Create attendance table
    const createTableSQL = `
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
        
        -- Ensure unique attendance per student per date
        UNIQUE(student_id, date)
      );
    `
    
    // Enable RLS
    const enableRLSSQL = `
      ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
    `
    
    // Create RLS policy
    const createPolicySQL = `
      DROP POLICY IF EXISTS "Teachers can manage attendance for their school" ON attendance;
      CREATE POLICY "Teachers can manage attendance for their school" ON attendance
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin')
            AND profiles.school_id = attendance.school_id
          )
        );
    `
    
    // Create indexes
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
      CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON attendance(teacher_id, date);
      CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
      CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);
    `
    
    console.log('📄 Creating attendance table...')
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    if (tableError && !tableError.message.includes('already exists')) {
      console.error('Error creating table:', tableError)
    } else {
      console.log('✅ Attendance table created/verified')
    }
    
    console.log('🔒 Enabling RLS...')
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL })
    if (rlsError && !rlsError.message.includes('already')) {
      console.warn('RLS warning:', rlsError.message)
    }
    
    console.log('🛡️ Creating RLS policy...')
    const { error: policyError } = await supabase.rpc('exec_sql', { sql: createPolicySQL })
    if (policyError && !policyError.message.includes('already exists')) {
      console.warn('Policy warning:', policyError.message)
    }
    
    console.log('📊 Creating indexes...')
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL })
    if (indexError && !indexError.message.includes('already exists')) {
      console.warn('Index warning:', indexError.message)
    }
    
    console.log('✅ Attendance system setup completed!')
    
    // Test the table
    console.log('🧪 Testing attendance table...')
    const { data: testData, error: testError } = await supabase
      .from('attendance')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.log('⚠️  Table test failed:', testError.message)
    } else {
      console.log('✅ Table test successful! Records found:', testData?.length || 0)
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

createAttendanceTable()
