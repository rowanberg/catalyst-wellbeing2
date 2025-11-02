import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY || ''

// Decrypt API key (supports both encrypted and plaintext for development)
// Matches the AES-256-GCM encryption used in intelligent-ai-router edge function
async function decryptApiKey(encryptedKey: string): Promise<string> {
  try {
    // Check if key is in encrypted format
    const parts = encryptedKey.split(':')
    
    // Check for AES-256-GCM format: iv:authTag:encrypted (3 parts)
    if (parts.length === 3 && parts[0].length === 32) {
      console.log('🔐 Decrypting API key (AES-256-GCM)...')
      
      // Validate encryption key
      if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
        throw new Error('API_KEY_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Get it from Supabase Edge Functions GEMINI_ENCRYPTION_KEY secret.')
      }
      
      // Convert hex strings to buffers
      const iv = Buffer.from(parts[0], 'hex')
      const authTag = Buffer.from(parts[1], 'hex')
      const encrypted = Buffer.from(parts[2], 'hex')
      
      // Convert encryption key from hex (64 hex chars = 32 bytes)
      const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex')
      
      // Validate key length
      if (keyBuffer.length !== 32) {
        throw new Error(`Encryption key must be 32 bytes, got ${keyBuffer.length} bytes`)
      }
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv)
      decipher.setAuthTag(authTag)
      
      // Decrypt
      let decrypted = decipher.update(encrypted)
      decrypted = Buffer.concat([decrypted, decipher.final()])
      
      return decrypted.toString('utf8')
    } else {
      // Assume plaintext (development mode)
      console.log('⚠️ Using plaintext API key (development mode)')
      return encryptedKey
    }
  } catch (error: any) {
    console.error('Decryption error:', error)
    
    if (error.code === 'ERR_CRYPTO_INVALID_KEYLEN') {
      console.log('❌ API_KEY_ENCRYPTION_KEY must be a 64-character hex string')
      console.log('💡 Get it from: supabase secrets get GEMINI_ENCRYPTION_KEY')
      throw new Error('Invalid encryption key length. Need 64-char hex string (32 bytes)')
    }
    
    console.log('💡 Make sure API_KEY_ENCRYPTION_KEY matches GEMINI_ENCRYPTION_KEY from Supabase Edge Functions')
    throw new Error(error.message || 'Failed to decrypt API key')
  }
}

// Get available API key from gemini_25_flash_keys
async function getAvailableApiKey(supabase: any) {
  const now = new Date().toISOString()
  
  // First, reset cooldowns that have expired
  await supabase
    .from('gemini_25_flash_keys')
    .update({ 
      is_in_cooldown: false,
      cooldown_expires_at: null 
    })
    .lt('cooldown_expires_at', now)
    .eq('is_in_cooldown', true)
  
  // Reset RPM counters (every minute)
  await supabase
    .from('gemini_25_flash_keys')
    .update({ 
      current_rpm: 0,
      last_rpm_reset: now 
    })
    .lt('last_rpm_reset', new Date(Date.now() - 60000).toISOString())
  
  // Reset RPD counters (every day)
  await supabase
    .from('gemini_25_flash_keys')
    .update({ 
      current_rpd: 0,
      last_rpd_reset: now 
    })
    .lt('last_rpd_reset', new Date(Date.now() - 86400000).toISOString())
  
  // Get available keys (fetch all active, non-cooldown keys and filter in JS)
  const { data: keys, error } = await supabase
    .from('gemini_25_flash_keys')
    .select('*')
    .eq('status', 'active')
    .eq('is_in_cooldown', false)
    .order('last_used_at', { ascending: true })
  
  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }
  
  if (!keys || keys.length === 0) {
    throw new Error('No available API keys')
  }
  
  // Filter keys that haven't hit their limits
  const availableKeys = keys.filter(key => 
    key.current_rpm < key.rpm_limit &&
    key.current_rpd < key.rpd_limit &&
    key.current_tpm < key.tpm_limit
  )
  
  if (availableKeys.length === 0) {
    throw new Error('No available API keys')
  }
  
  return availableKeys[0]
}

// Update key usage
async function updateKeyUsage(supabase: any, keyId: string, tokensUsed: number) {
  const { error } = await supabase.rpc('increment_gemini_25_flash_usage', {
    key_id: keyId,
    tokens: tokensUsed
  })
  
  if (error) {
    console.error('Failed to update key usage via RPC:', error)
    console.log('Make sure to run the migration: database/migrations/037_add_gemini_25_flash_increment_function.sql')
    
    // Simple fallback - fetch current values and update
    const { data: currentKey } = await supabase
      .from('gemini_25_flash_keys')
      .select('current_rpm, current_rpd, current_tpm')
      .eq('id', keyId)
      .single()
    
    if (currentKey) {
      await supabase
        .from('gemini_25_flash_keys')
        .update({
          current_rpm: currentKey.current_rpm + 1,
          current_rpd: currentKey.current_rpd + 1,
          current_tpm: currentKey.current_tpm + tokensUsed,
          last_used_at: new Date().toISOString()
        })
        .eq('id', keyId)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, subject, grade_level, difficulty, count = 5 } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Get available API key
    const keyRecord = await getAvailableApiKey(supabase)
    const apiKey = await decryptApiKey(keyRecord.encrypted_api_key)
    
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey.length < 20) {
      return NextResponse.json({ 
        error: 'Invalid API key configured. Please add a valid Gemini API key to the database.',
        hint: 'Get your API key from https://makersuite.google.com/app/apikey'
      }, { status: 500 })
    }
    
    // Initialize Gemini AI with 2.5 Flash model (balanced, general purpose)
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    })

    // Construct prompt for question generation
    const systemPrompt = `You are an expert educator creating examination questions. Generate ${count} high-quality questions based on the following criteria:

Subject: ${subject || 'General'}
Grade Level: ${grade_level || 'Not specified'}
Difficulty: ${difficulty || 'medium'}
Topic: ${prompt}

For each question, provide:
1. Question text (clear and educational)
2. Question type (multiple_choice, true_false, short_answer, or essay)
3. Marks (appropriate for difficulty: easy=1-2, medium=3-5, hard=6-8, expert=9-10)
4. For multiple choice: Provide 4 options with one correct answer
5. For true/false: Indicate the correct answer

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question_text": "What is...?",
      "question_type": "multiple_choice",
      "marks": 5,
      "options": [
        {"option_text": "Option A", "is_correct": false},
        {"option_text": "Option B", "is_correct": true},
        {"option_text": "Option C", "is_correct": false},
        {"option_text": "Option D", "is_correct": false}
      ]
    }
  ]
}

Ensure questions are age-appropriate, clear, and educational.`

    // Generate content
    const result = await model.generateContent(systemPrompt)
    const response = result.response
    const text = response.text()
    
    // Update key usage (estimate ~500 tokens per request)
    await updateKeyUsage(supabase, keyRecord.id, 500)

    // Parse JSON response
    let questions
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/)
      const jsonText = jsonMatch ? jsonMatch[1] : text
      
      const parsed = JSON.parse(jsonText)
      questions = parsed.questions || []
      
      // Add IDs to questions and options
      questions = questions.map((q: any) => ({
        ...q,
        id: crypto.randomUUID(),
        options: q.options?.map((opt: any, idx: number) => ({
          ...opt,
          id: (idx + 1).toString()
        }))
      }))
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw response:', text)
      return NextResponse.json({ 
        error: 'Failed to parse AI response',
        raw: text 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      questions,
      keyUsed: keyRecord.id,
      model: 'gemini-2.5-flash'
    })

  } catch (error: any) {
    console.error('Question generation error:', error)
    
    if (error.message === 'No available API keys') {
      return NextResponse.json({ 
        error: 'All API keys are currently rate limited. Please try again later.' 
      }, { status: 429 })
    }
    
    // Handle Gemini API errors
    if (error.message?.includes('API key not valid')) {
      return NextResponse.json({ 
        error: 'Invalid Gemini API key. Please check your API key in the database.',
        hint: 'Get a valid API key from https://makersuite.google.com/app/apikey',
        details: 'Make sure to replace YOUR_GEMINI_API_KEY_HERE with your actual key'
      }, { status: 500 })
    }
    
    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({ 
        error: 'API quota exceeded. Please try again later or add more API keys.' 
      }, { status: 429 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to generate questions',
      hint: error.status === 400 ? 'Check if your Gemini API key is valid' : undefined
    }, { status: 500 })
  }
}
