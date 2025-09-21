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

async function checkSchema() {
  console.log('=== CHECKING DATABASE SCHEMA ===')
  
  // Check poll_answers table structure
  const { data: columns, error } = await supabaseAdmin
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'poll_answers')
    .eq('table_schema', 'public')
  
  console.log('poll_answers table columns:')
  console.log(columns)
  
  if (error) {
    console.error('Error fetching schema:', error)
  }
  
  // Check if there are any poll_answers records
  const { data: answers, error: answersError } = await supabaseAdmin
    .from('poll_answers')
    .select('*')
    .limit(1)
  
  console.log('\nSample poll_answers records:')
  console.log(answers)
  
  if (answersError) {
    console.error('Error fetching poll_answers:', answersError)
  }
}

checkSchema().catch(console.error)
