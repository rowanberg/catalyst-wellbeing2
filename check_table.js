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

async function checkTable() {
  console.log('=== CHECKING poll_answers TABLE ===')
  
  // Try to insert a test record to see what fields are expected
  const testRecord = {
    response_id: '00000000-0000-0000-0000-000000000000',
    question_id: '00000000-0000-0000-0000-000000000000',
    answer_text: 'test'
  }
  
  const { data, error } = await supabaseAdmin
    .from('poll_answers')
    .insert(testRecord)
    .select()
  
  console.log('Test insert result:')
  console.log('Data:', data)
  console.log('Error:', error)
  
  // Check what tables exist
  const { data: tables, error: tablesError } = await supabaseAdmin
    .rpc('get_table_names')
    .catch(() => null)
  
  if (!tablesError && tables) {
    console.log('\nAvailable tables:', tables)
  }
  
  // Try alternative query to check table structure
  try {
    const { data: describe, error: descError } = await supabaseAdmin
      .rpc('describe_table', { table_name: 'poll_answers' })
      .catch(() => ({ data: null, error: 'RPC not available' }))
    
    if (describe) {
      console.log('\nTable structure:', describe)
    }
  } catch (e) {
    console.log('Could not describe table')
  }
}

checkTable().catch(console.error)
