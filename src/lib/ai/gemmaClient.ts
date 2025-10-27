/**
 * Extended Model Client
 * Handles communication with additional Google AI models using the same API keys
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface GemmaModelConfig {
  modelName: string
  apiKey: string
  keyId?: string  // For cooldown tracking
  maxTokens?: number
  temperature?: number
}

export interface GemmaResponse {
  text: string
  tokensUsed: number
  modelUsed: string
  responseTimeMs: number
}

/**
 * Call extended models with streaming support
 * Uses the same Gemini API keys for different model tiers
 */
export async function callGemmaModel(
  config: GemmaModelConfig,
  message: string,
  conversationHistory?: any[],
  imageData?: string
): Promise<ReadableStream> {
  const startTime = Date.now()
  const maxRetries = 3 // Maximum retry attempts for 429 errors
  let retryCount = 0
  
  // Retry loop for handling 429 errors
  while (retryCount <= maxRetries) {
    try {
      return await attemptGemmaCall(config, message, conversationHistory, imageData, retryCount)
    } catch (error: any) {
      // Check if this is a 429 rate limit error
      if (error.message?.includes('[429') || error.message?.includes('429') || error.status === 429) {
        console.log(`[Cooldown System] Detected 429 error on attempt ${retryCount + 1} for key ${config.keyId || 'unknown'}`)
        
        // Put the failed key in cooldown (if we have a keyId and modelName)
        if (config.keyId && config.modelName) {
          const { setKeyCooldown } = await import('./quotaManager')
          // Convert model name to database format (e.g., gemma-3-27b-it -> gemma-3-27b)
          const modelParam = config.modelName.replace('-it', '')
          await setKeyCooldown(config.keyId, modelParam)
        }
        
        retryCount++
        
        if (retryCount <= maxRetries) {
          console.log(`[Cooldown System] Retrying with next available key (attempt ${retryCount + 1}/${maxRetries + 1})...`)
          // The next iteration will get a new key from the pool
          continue
        }
      }
      
      // If not a 429 error, or we've exhausted retries, throw the error
      throw error
    }
  }
  
  throw new Error('Failed to get response after multiple retries')
}

/**
 * Internal function to attempt a Gemma API call
 */
async function attemptGemmaCall(
  config: GemmaModelConfig,
  message: string,
  conversationHistory?: any[],
  imageData?: string,
  retryAttempt: number = 0
): Promise<ReadableStream> {
  const startTime = Date.now() // Track start time for this attempt
  
  try {
    // Initialize with the same Gemini API key
    const genAI = new GoogleGenerativeAI(config.apiKey)
    
    // Use actual Gemma instruction-tuned models - same API keys work for both Gemini and Gemma
    // Each model has separate rate limits per key (30 rpm, 15,000 tpm, 144,000 rpd)
    const modelMap: Record<string, string> = {
      'gemma-3-27b': 'gemma-3-27b-it',    // Highest tier - most capable
      'gemma-3-12b': 'gemma-3-12b-it',    // Middle tier - balanced
      'gemma-3-4b': 'gemma-3-4b-it'       // Lower tier - fastest
    }
    
    const actualModelName = modelMap[config.modelName] || config.modelName
    
    const model = genAI.getGenerativeModel({ 
      model: actualModelName,
      generationConfig: {
        maxOutputTokens: config.maxTokens || 2048,
        temperature: config.temperature || 0.7,
      }
    })

    // Build the context-aware prompt
    const systemPrompt = `You are Luminex AI (powered by ${config.modelName}), an intelligent learning assistant helping students with their homework and studies.
    
Your role is to:
- Help students understand concepts through clear explanations
- Guide them step-by-step through problems
- Encourage critical thinking and learning
- Be supportive, patient, and encouraging
- Use age-appropriate language

## FORMATTING GUIDELINES:

1. **Use Emojis**: Add relevant emojis to make responses engaging (📚 for concepts, 💡 for tips, ✨ for examples, 🎯 for goals)

2. **Structure with Headings**:
   - Use ## for main sections
   - Use ### for subsections

3. **Format Lists and Steps**:
   - Use numbered lists (1. 2. 3.) for sequential steps
   - Use bullet points (- or *) for non-sequential items

4. **Code Formatting**: Use triple backticks with language name for code blocks

5. **Emphasis**: Use **bold** for important terms and *italics* for emphasis

Note: You are using the ${config.modelName} model as part of the extra quota system (500 requests/day after the initial 30 Gemini requests).`

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
    
    // Add the text prompt
    const fullPrompt = systemPrompt + contextMessages + '\n\nStudent: ' + message
    contentParts.push({ text: fullPrompt })
    
    // Handle image if provided
    if (imageData) {
      const base64Match = imageData.match(/^data:(image\/\w+);base64,(.+)$/)
      if (base64Match) {
        const mimeType = base64Match[1]
        const base64Data = base64Match[2]
        
        contentParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        })
        
        contentParts.push({ 
          text: '\n\nPlease analyze the image above and help me understand it. If there are problems or questions shown, guide me through solving them step by step.' 
        })
      }
    }

    // Generate response with streaming
    const result = await model.generateContentStream(contentParts)
    
    // Check for rate limit errors in the response
    // Note: GoogleGenerativeAI throws errors for 429, but we catch them in the parent function
    
    // Convert to ReadableStream for the response
    const encoder = new TextEncoder()
    let totalTokens = 0
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
              totalTokens += Math.ceil(text.length / 4)
              
              // Send as Server-Sent Events format
              const data = JSON.stringify({ 
                text,
                modelUsed: config.modelName,
                tokensUsed: totalTokens
              })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }
          
          // Send completion signal with final stats
          const responseTimeMs = Date.now() - startTime
          const finalData = JSON.stringify({
            done: true,
            modelUsed: config.modelName,
            tokensUsed: totalTokens,
            responseTimeMs
          })
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return stream
  } catch (error: any) {
    // Log the error with attempt number
    console.error(`[Attempt ${retryAttempt + 1}] Failed to call ${config.modelName}:`, error.message || error)
    
    // Check if this is a rate limit error
    if (error.message?.includes('429') || error.status === 429) {
      // Create a specific 429 error to be caught by the retry logic
      const rateLimitError: any = new Error(`[429] Rate limit hit for ${config.modelName}: ${error.message}`)
      rateLimitError.status = 429
      throw rateLimitError
    }
    
    throw new Error(`Failed to call ${config.modelName}: ${error.message}`)
  }
}

/**
 * Estimate token count for a message
 * Rough approximation: 1 token ≈ 4 characters
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Check if we have enough token budget
 */
export function checkTokenBudget(
  message: string,
  remainingTpm: number,
  bufferTokens: number = 2000 // Reserve for response
): boolean {
  const messageTokens = estimateTokens(message)
  const totalNeeded = messageTokens + bufferTokens
  return totalNeeded <= remainingTpm
}
