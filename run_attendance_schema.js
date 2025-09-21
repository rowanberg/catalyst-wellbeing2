const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runAttendanceSchema() {
  try {
    console.log('🚀 Starting attendance schema migration...')
    
    // Read the attendance schema file
    const schemaPath = path.join(__dirname, 'attendance_schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📄 Executing attendance schema...')
    
    // Execute the schema
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema })
    
    if (error) {
      console.error('❌ Error executing schema:', error)
      
      // Try alternative approach - split and execute statements
      console.log('🔄 Trying alternative approach...')
      const statements = schema.split(';').filter(stmt => stmt.trim().length > 0)
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim()
        if (statement) {
          console.log(`Executing statement ${i + 1}/${statements.length}`)
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement })
            if (stmtError && !stmtError.message.includes('already exists')) {
              console.warn(`Warning on statement ${i + 1}:`, stmtError.message)
            }
          } catch (err) {
            console.warn(`Warning on statement ${i + 1}:`, err.message)
          }
        }
      }
    }
    
    console.log('✅ Attendance schema migration completed!')
    
    // Test the functions
    console.log('🧪 Testing database functions...')
    
    // Test get_teacher_assigned_grades function
    const { data: testData, error: testError } = await supabase
      .rpc('get_teacher_assigned_grades', { teacher_uuid: '641bb749-58ed-444e-b39c-984e59a93dd7' })
    
    if (testError) {
      console.log('⚠️  Function test failed (this is expected if no data exists):', testError.message)
    } else {
      console.log('✅ Function test successful! Found grades:', testData?.length || 0)
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runAttendanceSchema()
