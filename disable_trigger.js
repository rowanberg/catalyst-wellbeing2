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

async function disableTrigger() {
  console.log('=== TEMPORARILY DISABLING POLL TRIGGER ===')
  
  try {
    // Try to insert a test record to confirm the trigger is the issue
    const testResponse = {
      poll_id: '34ce15f4-80d6-4189-b64e-d9250217ed1e', // Use actual poll ID from logs
      respondent_id: null,
      respondent_role: 'student',
      school_id: 'f2baa26b-ad79-4576-bead-e57dc942e4f8',
      is_complete: true,
      response_metadata: { test: true }
    }
    
    console.log('Testing poll response creation...')
    const { data: response, error: responseError } = await supabaseAdmin
      .from('poll_responses')
      .insert(testResponse)
      .select()
      .single()
    
    if (responseError) {
      console.error('Error creating test response:', responseError)
      return
    }
    
    console.log('Test response created:', response.id)
    
    // Now try to create a test answer
    const testAnswer = {
      response_id: response.id,
      question_id: '00000000-0000-0000-0000-000000000001', // Dummy question ID
      answer_text: 'test answer'
    }
    
    console.log('Testing poll answer creation...')
    const { data: answer, error: answerError } = await supabaseAdmin
      .from('poll_answers')
      .insert(testAnswer)
      .select()
    
    if (answerError) {
      console.error('Error creating test answer (this confirms trigger issue):', answerError)
    } else {
      console.log('Test answer created successfully:', answer)
    }
    
    // Clean up test data
    await supabaseAdmin.from('poll_responses').delete().eq('id', response.id)
    console.log('Test data cleaned up')
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

disableTrigger().catch(console.error)
