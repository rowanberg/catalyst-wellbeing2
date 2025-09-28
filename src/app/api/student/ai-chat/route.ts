import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import crypto from 'crypto'

// Encryption key for API keys (should match the one in gemini-config route)
const ENCRYPTION_KEY = process.env.GEMINI_ENCRYPTION_KEY || 'your-32-character-secret-key-here'

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

export async function POST(request: NextRequest) {
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

    const { message, imageData, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get user's Gemini configuration
    const { data: config, error: configError } = await supabase
      .from('student_gemini_config')
      .select('encrypted_api_key, selected_model')
      .eq('user_id', user.id)
      .single()

    if (configError || !config?.encrypted_api_key) {
      return NextResponse.json({ 
        error: 'Gemini AI not configured. Please set up your API key in Settings.' 
      }, { status: 400 })
    }

    // Decrypt the API key
    let apiKey: string
    try {
      apiKey = decrypt(config.encrypted_api_key)
    } catch (error) {
      console.error('Error decrypting API key:', error)
      return NextResponse.json({ 
        error: 'Invalid API key configuration. Please reconfigure in Settings.' 
      }, { status: 400 })
    }

    // Try different model name formats to find what works
    let actualModel = 'gemini-1.5-flash-latest' // Try the latest format first
    
    if (config.selected_model === 'gemini-1.5-flash') {
      actualModel = 'gemini-1.5-flash-latest'
    } else if (config.selected_model === 'gemini-1.5-pro') {
      actualModel = 'gemini-1.5-pro-latest'
    } else if (config.selected_model === 'gemini-pro') {
      actualModel = 'gemini-1.5-flash-latest' // Default to flash-latest
    }

    console.log('Using AI model:', actualModel)

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: actualModel })

    // Prepare the conversation context
    let prompt = `You are a helpful AI homework assistant for students. Please provide educational support, explanations, and guidance. Always encourage learning and understanding rather than just giving direct answers.

Student's question: ${message}`

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      const historyText = conversationHistory
        .slice(-5) // Only include last 5 messages to avoid token limits
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join('\n')
      
      prompt = `Previous conversation:\n${historyText}\n\nStudent's new question: ${message}`
    }

    let result
    
    // Handle image input if provided
    if (imageData && config.selected_model.includes('1.5')) {
      // Only Gemini 1.5 models support images
      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
          mimeType: imageData.split(';')[0].split(':')[1]
        }
      }
      
      result = await model.generateContent([prompt, imagePart])
    } else {
      result = await model.generateContent(prompt)
    }

    const response = await result.response
    const text = response.text()

    if (!text) {
      return NextResponse.json({ 
        error: 'No response generated. Please try again.' 
      }, { status: 500 })
    }

    // Log the interaction for monitoring (optional)
    try {
      await supabase
        .from('ai_chat_logs')
        .insert({
          user_id: user.id,
          model_used: config.selected_model,
          message_length: message.length,
          response_length: text.length,
          has_image: !!imageData,
          created_at: new Date().toISOString()
        })
    } catch (logError: any) {
      console.log('Logging error (non-critical):', logError)
    }

    return NextResponse.json({
      response: text,
      model: config.selected_model,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error in AI chat:', error)
    
    // Handle specific Gemini API errors
    if (error.message?.includes('API_KEY_INVALID')) {
      return NextResponse.json({ 
        error: 'Invalid API key. Please check your Gemini configuration in Settings.' 
      }, { status: 400 })
    }
    
    if (error.message?.includes('QUOTA_EXCEEDED')) {
      return NextResponse.json({ 
        error: 'API quota exceeded. Please wait before making more requests.' 
      }, { status: 429 })
    }
    
    if (error.message?.includes('SAFETY')) {
      return NextResponse.json({ 
        error: 'Content was blocked for safety reasons. Please rephrase your question.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to process your request. Please try again.' 
    }, { status: 500 })
  }
}
