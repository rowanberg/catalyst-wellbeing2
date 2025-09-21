const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Read environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim()
  }
})

const supabaseAdmin = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('=== RUNNING POLL TRIGGER FIX ===')
  
  try {
    // Read the migration SQL
    const migrationSQL = fs.readFileSync('database/fix_poll_trigger.sql', 'utf8')
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (const statement of statements) {
      console.log('Executing:', statement.trim().substring(0, 50) + '...')
      
      const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
        sql: statement.trim() 
      }).catch(async () => {
        // Fallback: try direct query execution
        return await supabaseAdmin.from('_').select('*').limit(0).then(() => {
          throw new Error('Cannot execute SQL directly')
        })
      })
      
      if (error) {
        console.error('Error executing statement:', error)
        // Try alternative approach - create a simple test
        break
      } else {
        console.log('✓ Statement executed successfully')
      }
    }
    
    console.log('Migration completed')
    
  } catch (error) {
    console.error('Migration failed:', error)
    console.log('Please run the SQL manually in your database admin panel:')
    console.log(fs.readFileSync('database/fix_poll_trigger.sql', 'utf8'))
  }
}

runMigration().catch(console.error)
