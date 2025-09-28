import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Encryption key for API keys (should be in environment variables)
const ENCRYPTION_KEY = process.env.GEMINI_ENCRYPTION_KEY || 'your-32-character-secret-key-here'

function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift()!, 'hex')
  const encryptedText = textParts.join(':')
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Gemini configuration
    const { data: config, error } = await supabase
      .from('student_gemini_config')
      .select('encrypted_api_key, selected_model, created_at')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching Gemini config:', error)
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
    }

    if (!config) {
      return NextResponse.json({
        apiKey: '',
        selectedModel: 'gemini-1.5-flash',
        isConfigured: false
      })
    }

    // Decrypt API key for display (masked)
    let maskedApiKey = ''
    if (config.encrypted_api_key) {
      try {
        const decryptedKey = decrypt(config.encrypted_api_key)
        maskedApiKey = decryptedKey.substring(0, 8) + '...' + decryptedKey.substring(decryptedKey.length - 4)
      } catch (error) {
        console.error('Error decrypting API key:', error)
      }
    }

    return NextResponse.json({
      apiKey: maskedApiKey,
      selectedModel: config.selected_model || 'gemini-1.5-flash',
      isConfigured: !!config.encrypted_api_key
    })

  } catch (error) {
    console.error('Error in GET /api/student/gemini-config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { apiKey, selectedModel } = await request.json()

    if (!apiKey || !selectedModel) {
      return NextResponse.json({ error: 'API key and model selection are required' }, { status: 400 })
    }

    // Encrypt the API key
    const encryptedApiKey = encrypt(apiKey)

    // Upsert the configuration
    const { error } = await supabase
      .from('student_gemini_config')
      .upsert({
        user_id: user.id,
        encrypted_api_key: encryptedApiKey,
        selected_model: selectedModel,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error saving Gemini config:', error)
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Gemini configuration saved successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/student/gemini-config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
