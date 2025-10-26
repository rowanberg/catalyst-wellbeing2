import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './config'; // Your Firebase app initialization

const functions = getFunctions(app);

interface GeminiKeyResponse {
  apiKey: string;
  keyId: string;
  remainingDaily: number;
  remainingMinute: number;
}

/**
 * Get an available Gemini API key from the pool
 * This function handles rate limiting and key rotation automatically
 */
export async function getAvailableGeminiKey(): Promise<GeminiKeyResponse> {
  try {
    const getKey = httpsCallable<void, GeminiKeyResponse>(functions, 'getAvailableGeminiKey');
    const result = await getKey();
    return result.data;
  } catch (error: any) {
    console.error('Error getting Gemini API key:', error);
    
    // Handle specific error codes
    if (error.code === 'resource-exhausted') {
      throw new Error('All API keys are currently rate-limited. Please try again in a minute.');
    } else if (error.code === 'unauthenticated') {
      throw new Error('You must be logged in to use AI features.');
    }
    
    throw new Error('Failed to get API key. Please try again.');
  }
}

/**
 * Retry logic with exponential backoff for API calls
 */
export async function callGeminiWithRetry(
  apiCall: (apiKey: string) => Promise<any>,
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get a fresh API key for each attempt
      const { apiKey } = await getAvailableGeminiKey();
      
      // Make the actual API call
      return await apiCall(apiKey);
      
    } catch (error: any) {
      lastError = error;
      
      // If it's a rate limit error, wait before retrying
      if (error.message?.includes('rate-limited')) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw lastError || new Error('Failed after maximum retries');
}
