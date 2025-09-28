const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.log('Required variables:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runSQLMigration() {
  try {
    console.log('🚀 Running attendance schema migration...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', 'attendance_schema.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📝 Executing attendance schema...')
    
    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec', { sql: sqlContent })
    
    if (error) {
      console.error('❌ Migration failed:', error.message)
      
      // Try alternative approach - execute statements one by one
      console.log('🔄 Trying alternative execution method...')
      
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.length === 0) continue
        
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}`)
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement })
          
          if (stmtError) {
            if (stmtError.message.includes('already exists')) {
              console.log(`✅ Statement ${i + 1} - Object already exists`)
            } else {
              console.error(`❌ Statement ${i + 1} failed:`, stmtError.message)
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (execError) {
          console.error(`❌ Statement ${i + 1} execution error:`, execError.message)
        }
      }
    } else {
      console.log('✅ Migration executed successfully')
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying table creation...')
    
    const { data: attendanceTable, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .limit(1)
    
    const { data: summaryTable, error: summaryError } = await supabase
      .from('attendance_summary')
      .select('*')
      .limit(1)
    
    if (!attendanceError) {
      console.log('✅ attendance table created successfully')
    } else {
      console.log('❌ attendance table verification failed:', attendanceError.message)
    }
    
    if (!summaryError) {
      console.log('✅ attendance_summary table created successfully')
    } else {
      console.log('❌ attendance_summary table verification failed:', summaryError.message)
    }
    
    console.log('\n🎉 Attendance system migration completed!')
    console.log('📋 The attendance system is ready to use at /teacher/')
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    process.exit(1)
  }
}

runSQLMigration()
