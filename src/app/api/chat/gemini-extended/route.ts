import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAvailableGeminiKey } from '@/lib/supabase/geminiKeyRouter'

// Force dynamic rendering to prevent webpack chunk caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { 
  checkUserQuota, 
  incrementUserQuota, 
  getAvailableGemmaKey,
  updateGemmaKeyUsage,
  logAiRequest,
  getUserQuotaStatus
} from '@/lib/ai/quotaManager'
import { callGemmaModel, checkTokenBudget, estimateTokens } from '@/lib/ai/gemmaClient'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { message, imageData, conversationHistory, schoolContext } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get user ID from the request
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('[Auth] No authorization header')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client with auth config
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Validate the user with the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('[Auth] Failed to validate user:', authError?.message || 'No user found')
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const userId = user.id
    console.log(`[Auth] User validated: ${userId.substring(0, 8)}...`)

    // Check user quota
    const quotaCheck = await checkUserQuota(userId)
    console.log(`[Quota Check] User ${userId.substring(0, 8)}... - Type: ${quotaCheck.quotaType}, Normal: ${quotaCheck.remainingNormal}/30, Extra: ${quotaCheck.remainingExtra}/500`)
    
    if (!quotaCheck.canProceed) {
      return NextResponse.json({ 
        error: quotaCheck.message || 'Daily AI request limit reached',
        quotaStatus: await getUserQuotaStatus(userId)
      }, { status: 429 })
    }

    let stream: ReadableStream
    let modelUsed: string
    let keyId: string | undefined
    let tokensUsed: number = 0

    // Use normal quota (Gemini)
    if (quotaCheck.quotaType === 'normal') {
      try {
        // Get Gemini API key
        const apiKeyData = await getAvailableGeminiKey()
        console.log(`Using Gemini from Supabase pool: ${apiKeyData.keyId}`)
        
        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKeyData.apiKey)
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash'
        })

        // Build prompt
        const systemPrompt = `You are Luminex AI, an intelligent learning assistant from Catalyst Innovations, helping ${schoolContext?.studentName || 'a student'} at ${schoolContext?.schoolName || 'school'}.
    
Your role is to:
- Help students understand concepts, not just give answers
- Guide them through problem-solving step by step
- Encourage critical thinking and learning
- Be supportive and patient
- Use clear, age-appropriate language

## IMPORTANT FORMATTING RULES:

1. **Use Emojis**: Start sections with relevant emojis (📚 for concepts, 💡 for tips, ✨ for examples, 🎯 for goals)
2. **Use Headings**: Structure with ## for main sections, ### for subsections
3. **Format Lists**: Use numbered lists for steps, bullet points for items
4. **Code Blocks**: Use triple backticks with language name
5. **Emphasis**: Use **bold** for important terms and *italics* for emphasis

You have ${quotaCheck.remainingNormal} standard requests remaining today.`

        // Format conversation history
        let contextMessages = ''
        if (conversationHistory && conversationHistory.length > 0) {
          contextMessages = '\n\nPrevious conversation:\n'
          conversationHistory.forEach((msg: any) => {
            contextMessages += `${msg.role === 'user' ? 'Student' : 'Helper'}: ${msg.content}\n`
          })
        }

        // Prepare content
        const contentParts: any[] = []
        const fullPrompt = systemPrompt + contextMessages + '\n\nStudent: ' + message
        contentParts.push({ text: fullPrompt })
        
        // Handle image
        if (imageData && schoolContext?.imageAttached) {
          const base64Match = imageData.match(/^data:(image\/\w+);base64,(.+)$/)
          if (base64Match) {
            contentParts.push({
              inlineData: {
                mimeType: base64Match[1],
                data: base64Match[2]
              }
            })
            contentParts.push({ 
              text: '\n\nPlease analyze the image and help me understand it.' 
            })
          }
        }

        // Generate response
        const result = await model.generateContentStream(contentParts)
        modelUsed = 'gemini-2.0-flash'
        
        // Create stream
        const encoder = new TextEncoder()
        stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                const text = chunk.text()
                if (text) {
                  tokensUsed += estimateTokens(text)
                  const data = JSON.stringify({ 
                    text,
                    quotaType: 'normal',
                    remainingRequests: quotaCheck.remainingNormal - 1
                  })
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                }
              }
              
              // Increment quota after successful response
              const incremented = await incrementUserQuota(userId, 'normal')
              console.log(`[Quota Increment] User ${userId.substring(0, 8)}... - Normal quota incremented: ${incremented}`)
              
              // Log request
              const responseTimeMs = Date.now() - startTime
              await logAiRequest(userId, 'normal', modelUsed, undefined, tokensUsed, responseTimeMs, true)
              
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            } catch (error) {
              console.error('Streaming error:', error)
              controller.error(error)
            }
          },
        })
      } catch (error: any) {
        console.error('Gemini error:', error)
        return NextResponse.json({ 
          error: 'Failed to process request with Gemini',
          quotaStatus: await getUserQuotaStatus(userId)
        }, { status: 500 })
      }
    } 
    // Use extra quota (Gemma)
    else if (quotaCheck.quotaType === 'extra') {
      // Get available Gemma key with fallback
      const gemmaKey = await getAvailableGemmaKey()
      
      if (!gemmaKey) {
        return NextResponse.json({ 
          error: 'Extra AI requests temporarily unavailable, try again later',
          quotaStatus: await getUserQuotaStatus(userId)
        }, { status: 503 })
      }

      keyId = gemmaKey.keyId
      modelUsed = gemmaKey.modelName

      // Check token budget
      const messageTokens = estimateTokens(message)
      if (!checkTokenBudget(message, gemmaKey.remainingTpm)) {
        return NextResponse.json({ 
          error: 'Message too long for current rate limits. Please try a shorter message.',
          quotaStatus: await getUserQuotaStatus(userId)
        }, { status: 429 })
      }

      try {
        // Call Gemma model with keyId for cooldown tracking
        stream = await callGemmaModel(
          {
            modelName: gemmaKey.modelName,
            apiKey: gemmaKey.encryptedKey,
            keyId: gemmaKey.keyId,  // Pass keyId for cooldown system
            maxTokens: 2048,
            temperature: 0.7
          },
          message,
          conversationHistory,
          imageData
        )

        // Wrap stream to handle quota updates
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()
        const reader = stream.getReader()
        
        stream = new ReadableStream({
          async start(controller) {
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                
                // Pass through the data
                controller.enqueue(value)
                
                // Parse for token count
                const text = decoder.decode(value)
                const lines = text.split('\n')
                for (const line of lines) {
                  if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                      const data = JSON.parse(line.slice(6))
                      if (data.tokensUsed) {
                        tokensUsed = data.tokensUsed
                      }
                    } catch {}
                  }
                }
              }
              
              // Update quota and key usage after successful response
              const incremented = await incrementUserQuota(userId, 'extra')
              console.log(`[Quota Increment] User ${userId.substring(0, 8)}... - Extra quota incremented: ${incremented}`)
              await updateGemmaKeyUsage(keyId!, tokensUsed)
              
              // Log request
              const responseTimeMs = Date.now() - startTime
              await logAiRequest(userId, 'extra', modelUsed, keyId, tokensUsed, responseTimeMs, true)
              
              controller.close()
            } catch (error) {
              console.error('Stream processing error:', error)
              controller.error(error)
            }
          }
        })
      } catch (error: any) {
        console.error('[Gemma Error] Model:', modelUsed, 'KeyId:', keyId)
        console.error('[Gemma Error] Message:', error.message)
        console.error('[Gemma Error] Stack:', error.stack)
        
        // Log failed request
        await logAiRequest(userId, 'extra', modelUsed, keyId, 0, Date.now() - startTime, false, error.message)
        
        return NextResponse.json({ 
          error: `Failed to process request with Gemma models: ${error.message}`,
          quotaStatus: await getUserQuotaStatus(userId)
        }, { status: 500 })
      }
    } else {
      return NextResponse.json({ 
        error: 'No quota available',
        quotaStatus: await getUserQuotaStatus(userId)
      }, { status: 429 })
    }

    // Return the stream
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('Error in extended Gemini chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// GET endpoint to check quota status
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const quotaStatus = await getUserQuotaStatus(user.id)
    return NextResponse.json(quotaStatus)
  } catch (error) {
    console.error('Error getting quota status:', error)
    return NextResponse.json({ error: 'Failed to get quota status' }, { status: 500 })
  }
}
