// ============================================================================
// AI Homework Chat - Direct Edge Function Implementation
// ============================================================================
// Bypasses Vercel entirely for faster response and lower costs
// Handles: Authentication, Quota Management, Gemini/Gemma API calls, Streaming
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Estimate token count for text
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Check if message fits within token budget
 */
function checkTokenBudget(message: string, remainingTpm: number): boolean {
  const estimatedTokens = estimateTokens(message)
  return estimatedTokens <= remainingTpm
}

/**
 * Get user quota from database
 */
async function checkUserQuota(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc('get_or_create_user_quota', {
    input_user_id: userId
  })

  if (error) {
    console.error('Error checking user quota:', error)
    return {
      canProceed: false,
      quotaType: 'none',
      remainingNormal: 0,
      remainingExtra: 0,
      message: 'Failed to check quota'
    }
  }

  const quota = data[0]
  const remainingNormal = Math.max(0, 30 - quota.out_normal_daily_usage)
  const remainingExtra = Math.max(0, 45 - quota.out_extra_daily_usage)

  if (quota.out_can_use_normal) {
    return {
      canProceed: true,
      quotaType: 'normal',
      remainingNormal,
      remainingExtra,
      message: `${remainingNormal} standard requests remaining today`
    }
  }

  if (quota.out_can_use_extra) {
    return {
      canProceed: true,
      quotaType: 'extra',
      remainingNormal: 0,
      remainingExtra,
      message: `${remainingExtra} extra requests remaining today`
    }
  }

  return {
    canProceed: false,
    quotaType: 'none',
    remainingNormal: 0,
    remainingExtra: 0,
    message: 'Daily AI request limit reached. Resets at midnight UTC.'
  }
}

/**
 * Increment user quota
 */
async function incrementUserQuota(supabase: any, userId: string, quotaType: 'normal' | 'extra'): Promise<boolean> {
  const { error } = await supabase.rpc('increment_user_quota', {
    input_user_id: userId,
    input_request_type: quotaType
  })

  if (error) {
    console.error('Error incrementing quota:', error)
    return false
  }

  return true
}

/**
 * Log AI request to database
 */
async function logAiRequest(
  supabase: any,
  userId: string,
  quotaType: string,
  modelUsed: string,
  keyId: string | undefined,
  tokensUsed: number,
  responseTimeMs: number,
  success: boolean,
  errorMessage?: string
) {
  await supabase.from('ai_request_logs').insert({
    user_id: userId,
    quota_type: quotaType,
    model_used: modelUsed,
    key_id: keyId,
    tokens_used: tokensUsed,
    response_time_ms: responseTimeMs,
    success,
    error_message: errorMessage
  })
}

/**
 * Get user quota status
 */
async function getUserQuotaStatus(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc('get_or_create_user_quota', {
    input_user_id: userId
  })

  if (error) {
    return {
      normalUsed: 0,
      normalRemaining: 30,
      extraUsed: 0,
      extraRemaining: 45,
      canUseNormal: true,
      canUseExtra: false
    }
  }

  const quota = data[0]
  return {
    normalUsed: quota.out_normal_daily_usage,
    normalRemaining: Math.max(0, 30 - quota.out_normal_daily_usage),
    extraUsed: quota.out_extra_daily_usage,
    extraRemaining: Math.max(0, 45 - quota.out_extra_daily_usage),
    canUseNormal: quota.out_can_use_normal,
    canUseExtra: quota.out_can_use_extra
  }
}

/**
 * Get available Gemini key from intelligent router
 */
async function getAvailableGeminiKey(supabaseClient: any) {
  const { data, error } = await supabaseClient.functions.invoke('intelligent-ai-router', {
    body: { model: 'gemini-2.0-flash' }
  })

  if (error || data?.error) {
    throw new Error(data?.error || error?.message || 'Failed to get API key')
  }

  return data
}

/**
 * Get available Gemma key
 */
async function getAvailableGemmaKey(supabase: any) {
  const models = ['gemma-2-27b', 'gemma-2-12b', 'gemma-2-4b']
  
  for (const model of models) {
    try {
      const { data, error } = await supabase.functions.invoke('intelligent-ai-router', {
        method: 'POST',
        body: { model }
      })

      if (!error && data && !data.error) {
        return {
          keyId: data.key_id,
          encryptedKey: data.api_key,
          modelName: model,
          remainingRpm: 15,
          remainingTpm: 1000000,
          remainingRpd: 100
        }
      }
    } catch (e) {
      console.log(`Model ${model} not available, trying next...`)
      continue
    }
  }

  return null
}

/**
 * Update Gemma key usage
 */
async function updateGemmaKeyUsage(supabase: any, keyId: string, tokensUsed: number) {
  // The intelligent-ai-router handles this automatically
  console.log(`Tokens used for key ${keyId}: ${tokensUsed}`)
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Parse request body
    const { message, imageData, conversationHistory, schoolContext, flashCardMode, flashCardInstructions } = await req.json()
    
    // Auto-detect quiz requests
    const isQuizRequest = /\b(quiz|test|questions|multiple choice|mcq|exam)\b/i.test(message)

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client with service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate user with token
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    
    if (authError || !user) {
      console.error('[Auth] Failed to validate user:', authError?.message || 'No user found')
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id
    console.log(`[Auth] User validated: ${userId.substring(0, 8)}...`)

    // Check quota
    const quotaCheck = await checkUserQuota(supabaseAdmin, userId)
    console.log(`[Quota Check] User ${userId.substring(0, 8)}... - Type: ${quotaCheck.quotaType}, Normal: ${quotaCheck.remainingNormal}/30, Extra: ${quotaCheck.remainingExtra}/500`)
    
    if (!quotaCheck.canProceed) {
      return new Response(
        JSON.stringify({ 
          error: quotaCheck.message || 'Daily AI request limit reached',
          quotaStatus: await getUserQuotaStatus(supabaseAdmin, userId)
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let modelUsed: string
    let keyId: string | undefined
    let tokensUsed = 0

    // ========================================================================
    // Normal Quota - Gemini
    // ========================================================================
    if (quotaCheck.quotaType === 'normal') {
      try {
        // Get Gemini API key from router (use admin client for cross-function calls)
        const apiKeyData = await getAvailableGeminiKey(supabaseAdmin)
        keyId = apiKeyData.key_id
        console.log(`Using Gemini from Supabase pool: ${keyId}`)
        
        modelUsed = apiKeyData.model_used || 'gemini-2.0-flash'

        // Build system prompt with quiz detection
        let systemPrompt = `You are Luminex AI, an intelligent learning assistant from Catalyst Innovations, helping ${schoolContext?.studentName || 'a student'} at ${schoolContext?.schoolName || 'school'}.
    
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
6. **GRAPHS & PLOTS**: When you want to show an interactive graph, use this EXACT format:

Start with: <<<GRAPH:line>>>
Then JSON data: {"title":"Function Name","data":[{"x":0,"y":0},{"x":1,"y":1}],"xKey":"x","yKeys":["y"]}
End with: <<<END_GRAPH>>>

Supported types: line, bar, area, scatter
Always provide 15-30 data points for smooth curves.
Round values to 2 decimal places.

Example for sin(x) from -2π to 2π:
<<<GRAPH:line>>>
{"title":"y = sin(x)","data":[{"x":-6.28,"y":0},{"x":-5.5,"y":0.71},{"x":-4.71,"y":1},{"x":-3.93,"y":0.71},{"x":-3.14,"y":0},{"x":-2.36,"y":-0.71},{"x":-1.57,"y":-1},{"x":-0.79,"y":-0.71},{"x":0,"y":0},{"x":0.79,"y":0.71},{"x":1.57,"y":1},{"x":2.36,"y":0.71},{"x":3.14,"y":0},{"x":3.93,"y":-0.71},{"x":4.71,"y":-1},{"x":5.5,"y":-0.71},{"x":6.28,"y":0}],"xKey":"x","yKeys":["y"]}
<<<END_GRAPH>>>

You have ${quotaCheck.remainingNormal} standard requests remaining today.
${flashCardMode && flashCardInstructions ? flashCardInstructions : ''}`

        // If today's topics are provided from the client, include them as context
        if (schoolContext?.todayTopics && Array.isArray(schoolContext.todayTopics) && schoolContext.todayTopics.length > 0) {
          try {
            const topicsText = schoolContext.todayTopics
              .slice(0, 10)
              .map((t: any, idx: number) => {
                const subject = t.classes?.subject || t.classes?.class_name || 'Subject'
                const topic = t.topic || t.title || ''
                const teacherName = t.profiles
                  ? `${t.profiles.first_name || ''} ${t.profiles.last_name || ''}`.trim() || 'Teacher'
                  : 'Teacher'
                return `${idx + 1}. [${subject}] ${topic} (Teacher: ${teacherName})`
              })
              .join('\n')

            systemPrompt += `\n\n## Today's Class Topics (from school system):\n${topicsText}\n\nWhen helping the student, prefer to relate explanations and examples to these topics when relevant.`
          } catch (e) {
            console.error('Failed to format todayTopics for prompt:', e)
          }
        }

        // Add quiz instructions if quiz is detected
        if (isQuizRequest) {
          systemPrompt += `

🚨🚨🚨 QUIZ MODE DETECTED - YOU MUST FOLLOW THIS FORMAT EXACTLY 🚨🚨🚨

The user is asking for quiz questions. You MUST respond ONLY with quiz questions in the exact format below. NO explanations, NO introductory text, NO other content.

MANDATORY QUIZ FORMAT:
Start each question with: <<<QUIZ>>>
Then: Q: [question text]
Then: A: [option A]
Then: B: [option B]
Then: C: [option C]
Then: D: [option D]
Then: CORRECT: [A, B, C, or D]
Then: EXPLANATION: [brief explanation]
End each question with: <<<END_QUIZ>>>

EXAMPLE:
<<<QUIZ>>>
Q: What is the capital of France?
A: London
B: Berlin
C: Paris
D: Madrid
CORRECT: C
EXPLANATION: Paris is the capital and largest city of France.
<<<END_QUIZ>>>

<<<QUIZ>>>
Q: Which process converts light energy to chemical energy?
A: Respiration
B: Photosynthesis
C: Digestion
D: Circulation
CORRECT: B
EXPLANATION: Photosynthesis converts light energy from the sun into chemical energy stored as glucose.
<<<END_QUIZ>>>

CRITICAL REQUIREMENTS:
1. Generate 3-5 quiz questions
2. Use ONLY the <<<QUIZ>>> format shown above
3. NO introductory text like "Here's a quiz" or explanations
4. Start your response immediately with <<<QUIZ>>>
5. Each question must have exactly 4 options (A, B, C, D)
6. Include correct answer and brief explanation for each question`
        }

        // Format conversation history
        let contextMessages = ''
        if (conversationHistory && conversationHistory.length > 0) {
          contextMessages = '\n\nPrevious conversation:\n'
          conversationHistory.forEach((msg: any) => {
            contextMessages += `${msg.role === 'user' ? 'Student' : 'Helper'}: ${msg.content}\n`
          })
        }

        // Prepare content parts
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

        // Call Gemini API
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelUsed}:streamGenerateContent?alt=sse&key=${apiKeyData.api_key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: contentParts }] })
          }
        )

        if (!geminiResponse.ok) {
          // Handle rate limiting by putting key in cooldown
          if (geminiResponse.status === 429 && keyId) {
            const cooldownMinutes = 5
            const cooldownExpiry = new Date(Date.now() + cooldownMinutes * 60000).toISOString()
            await supabaseAdmin.from('gemini_api_keys')
              .update({
                flash2_is_in_cooldown: true,
                flash2_cooldown_expires_at: cooldownExpiry
              })
              .eq('id', keyId)
            console.log(`[Cooldown] Key ${keyId.substring(0, 8)}... marked for ${cooldownMinutes}min cooldown`)
          }
          throw new Error(`Gemini API error: ${geminiResponse.status}`)
        }

        // Create streaming response
        const stream = new ReadableStream({
          async start(controller) {
            const reader = geminiResponse.body?.getReader()
            const decoder = new TextDecoder()
            const encoder = new TextEncoder()

            try {
              while (true) {
                const { done, value } = await reader!.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    if (data === '[DONE]') continue

                    try {
                      const parsed = JSON.parse(data)
                      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                      
                      if (text) {
                        tokensUsed += estimateTokens(text)
                        const responseData = JSON.stringify({
                          text,
                          quotaType: 'normal',
                          remainingRequests: quotaCheck.remainingNormal - 1
                        })
                        controller.enqueue(encoder.encode(`data: ${responseData}\n\n`))
                      }
                    } catch (e) {
                      // Skip malformed JSON
                    }
                  }
                }
              }

              // Increment quota
              await incrementUserQuota(supabaseAdmin, userId, 'normal')
              console.log(`[Quota Increment] User ${userId.substring(0, 8)}... - Normal quota incremented`)
              
              // Log request
              const responseTimeMs = Date.now() - startTime
              await logAiRequest(supabaseAdmin, userId, 'normal', modelUsed, undefined, tokensUsed, responseTimeMs, true)
              
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            } catch (error) {
              console.error('Streaming error:', error)
              controller.error(error)
            }
          }
        })

        return new Response(stream, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        })

      } catch (error: any) {
        console.error('Gemini error:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to process request with Luminex AI',
            quotaStatus: await getUserQuotaStatus(supabaseAdmin, userId)
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
    // ========================================================================
    // Extra Quota - Gemma
    // ========================================================================
    else if (quotaCheck.quotaType === 'extra') {
      const gemmaKey = await getAvailableGemmaKey(supabaseAdmin)
      
      if (!gemmaKey) {
        return new Response(
          JSON.stringify({ 
            error: 'Extra AI requests temporarily unavailable, try again later',
            quotaStatus: await getUserQuotaStatus(supabaseAdmin, userId)
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      keyId = gemmaKey.keyId
      modelUsed = gemmaKey.modelName

      // Check token budget
      if (!checkTokenBudget(message, gemmaKey.remainingTpm)) {
        return new Response(
          JSON.stringify({ 
            error: 'Message too long for current rate limits. Please try a shorter message.',
            quotaStatus: await getUserQuotaStatus(supabaseAdmin, userId)
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        // Build system prompt for Gemma
        let systemPrompt = `You are Luminex AI, an intelligent learning assistant helping students with their homework. Be helpful, patient, and encouraging.`
        
        if (conversationHistory && conversationHistory.length > 0) {
          systemPrompt += '\n\nPrevious conversation:\n'
          conversationHistory.forEach((msg: any) => {
            systemPrompt += `${msg.role === 'user' ? 'Student' : 'Helper'}: ${msg.content}\n`
          })
        }

        const fullPrompt = systemPrompt + '\n\nStudent: ' + message

        // Call Gemma API
        const gemmaResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelUsed}:streamGenerateContent?alt=sse&key=${gemmaKey.encryptedKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7
              }
            })
          }
        )

        if (!gemmaResponse.ok) {
          throw new Error(`Gemma API error: ${gemmaResponse.status}`)
        }

        // Create streaming response
        const stream = new ReadableStream({
          async start(controller) {
            const reader = gemmaResponse.body?.getReader()
            const decoder = new TextDecoder()
            const encoder = new TextEncoder()

            try {
              while (true) {
                const { done, value } = await reader!.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    if (data === '[DONE]') continue

                    try {
                      const parsed = JSON.parse(data)
                      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                      
                      if (text) {
                        tokensUsed += estimateTokens(text)
                        const responseData = JSON.stringify({
                          text,
                          quotaType: 'extra',
                          remainingRequests: quotaCheck.remainingExtra - 1
                        })
                        controller.enqueue(encoder.encode(`data: ${responseData}\n\n`))
                      }
                    } catch (e) {
                      // Skip malformed JSON
                    }
                  }
                }
              }

              // Increment quota
              await incrementUserQuota(supabaseAdmin, userId, 'extra')
              await updateGemmaKeyUsage(supabaseAdmin, keyId!, tokensUsed)
              console.log(`[Quota Increment] User ${userId.substring(0, 8)}... - Extra quota incremented`)
              
              // Log request
              const responseTimeMs = Date.now() - startTime
              await logAiRequest(supabaseAdmin, userId, 'extra', modelUsed, keyId, tokensUsed, responseTimeMs, true)
              
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            } catch (error) {
              console.error('Streaming error:', error)
              controller.error(error)
            }
          }
        })

        return new Response(stream, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        })

      } catch (error: any) {
        console.error('[Gemma Error] Model:', modelUsed, 'KeyId:', keyId)
        console.error('[Gemma Error]:', error)
        
        await logAiRequest(supabaseAdmin, userId, 'extra', modelUsed, keyId, 0, Date.now() - startTime, false, error.message)
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to process request with Luminex Standards',
            quotaStatus: await getUserQuotaStatus(supabaseAdmin, userId)
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'No quota available',
          quotaStatus: await getUserQuotaStatus(supabaseAdmin, userId)
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error: any) {
    console.error('Error in AI homework chat:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request with Luminex AI' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
