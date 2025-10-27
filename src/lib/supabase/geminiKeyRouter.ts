import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface GeminiKeyResponse {
  apiKey: string
  keyId: string
  remainingDaily: number
  remainingMinute: number
}

/**
 * Get an available Gemini API key from Supabase Edge Function
 * This function handles rate limiting and key rotation automatically
 * 
 * @param model - The AI model to get a key for (flash2, gemma-27b, gemma-12b, gemma-4b)
 */
export async function getAvailableGeminiKey(model: string = 'flash2'): Promise<GeminiKeyResponse> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const { data, error } = await supabase.functions.invoke('get-available-gemini-key', {
      method: 'POST',
      body: { model }
    })

    if (error) {
      console.error('Error invoking Edge Function:', error)
      throw new Error(error.message || 'Failed to get API key')
    }

    if (data?.error) {
      // Handle rate limit error
      if (data.retryAfter) {
        throw new Error('All API keys are currently rate-limited. Please try again in a minute.')
      }
      throw new Error(data.error)
    }

    return data as GeminiKeyResponse
  } catch (error: any) {
    console.error('Error getting Gemini API key:', error)
    throw new Error(error.message || 'Failed to get API key')
  }
}

/**
 * Retry logic with exponential backoff for API calls
 * 
 * @param apiCall - Function that makes the API call with the provided key
 * @param maxRetries - Maximum number of retry attempts
 * @param model - The AI model to use (flash2, gemma-27b, gemma-12b, gemma-4b)
 */
export async function callGeminiWithRetry(
  apiCall: (apiKey: string) => Promise<any>,
  maxRetries: number = 3,
  model: string = 'flash2'
): Promise<any> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { apiKey } = await getAvailableGeminiKey(model)
      return await apiCall(apiKey)
    } catch (error: any) {
      lastError = error
      
      // If it's a rate limit error, wait before retrying
      if (error.message?.includes('rate-limited')) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }
      
      // For other errors, throw immediately
      throw error
    }
  }
  
  throw lastError || new Error('Failed after maximum retries')
}
