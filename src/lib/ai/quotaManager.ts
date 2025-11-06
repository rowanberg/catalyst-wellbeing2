/**
 * AI Quota Manager
 * Handles user quotas and model selection for AI chat system
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create service role client for bypassing RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface UserQuota {
  userId: string
  normalDailyUsage: number
  extraDailyUsage: number
  canUseNormal: boolean
  canUseExtra: boolean
  needsReset: boolean
}

export interface GemmaApiKey {
  keyId: string
  encryptedKey: string
  modelName: string
  remainingRpm: number
  remainingTpm: number
  remainingRpd: number
}

export interface QuotaCheckResult {
  canProceed: boolean
  quotaType: 'normal' | 'extra' | 'none'
  remainingNormal: number
  remainingExtra: number
  message?: string
}

/**
 * Check user's quota and determine if they can make a request
 */
export async function checkUserQuota(userId: string): Promise<QuotaCheckResult> {
  try {
    // Call the database function to get or create user quota
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

    // Check if user can use normal quota (Gemini)
    if (quota.out_can_use_normal) {
      return {
        canProceed: true,
        quotaType: 'normal',
        remainingNormal,
        remainingExtra,
        message: `${remainingNormal} standard requests remaining today`
      }
    }

    // Check if user can use extra quota (Gemma)
    if (quota.out_can_use_extra) {
      return {
        canProceed: true,
        quotaType: 'extra',
        remainingNormal: 0,
        remainingExtra,
        message: `${remainingExtra} extra requests remaining today`
      }
    }

    // User has exhausted all quotas
    return {
      canProceed: false,
      quotaType: 'none',
      remainingNormal: 0,
      remainingExtra: 0,
      message: 'Daily AI request limit reached. Resets at midnight UTC.'
    }
  } catch (error) {
    console.error('Error in checkUserQuota:', error)
    return {
      canProceed: false,
      quotaType: 'none',
      remainingNormal: 0,
      remainingExtra: 0,
      message: 'Service temporarily unavailable'
    }
  }
}

/**
 * Increment user's quota usage after successful request
 */
export async function incrementUserQuota(userId: string, quotaType: 'normal' | 'extra'): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('increment_user_quota', {
      input_user_id: userId,
      input_request_type: quotaType
    })

    if (error) {
      console.error('Error incrementing quota:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error in incrementUserQuota:', error)
    return false
  }
}

/**
 * Get an available API key for Gemma models with fallback logic and cooldown awareness
 * Uses the existing Edge Function which handles decryption and cooldown checking
 */
export async function getAvailableGemmaKey(): Promise<GemmaApiKey | null> {
  // Gemma instruction-tuned model configuration with fallback order
  const GEMMA_MODELS = [
    { name: 'gemma-3-27b-it', priority: 1 },  // Try highest tier first
    { name: 'gemma-3-12b-it', priority: 2 },  // Fall back to middle tier
    { name: 'gemma-3-4b-it', priority: 3 }    // Final fallback to lower tier
  ]
  
  // Try each model in order until we find one with available capacity
  for (const model of GEMMA_MODELS) {
    try {
      // Use the existing Edge Function which handles decryption and cooldown
      const { getAvailableGeminiKey } = await import('@/lib/supabase/geminiKeyRouter')
      // Strip the '-it' suffix to match database model names (gemma-3-27b-it -> gemma-3-27b)
      const modelParam = model.name.replace('-it', '')
      const keyData = await getAvailableGeminiKey(modelParam)
      
      if (keyData && keyData.remainingDaily > 0) {
        console.log(`[Cooldown System] Using key for ${model.name}: ${keyData.remainingDaily} daily, ${keyData.remainingMinute}/min remaining`)
        
        return {
          keyId: keyData.keyId,
          encryptedKey: keyData.apiKey, // Already decrypted by Edge Function
          modelName: model.name,
          remainingRpm: Math.min(keyData.remainingMinute, 15),
          remainingTpm: 15000,
          remainingRpd: Math.min(keyData.remainingDaily, 1000)
        }
      }
      
      console.log(`[Cooldown System] No available keys for ${model.name}, trying next model...`)
    } catch (error) {
      console.error(`[Cooldown System] Error getting key for ${model.name}:`, error)
    }
  }
  
  console.error('[Cooldown System] All Gemma models exhausted or in cooldown')
  return null
}

/**
 * Put a key in 60-second cooldown after hitting rate limits (429 error)
 * Now supports per-model cooldowns
 */
export async function setKeyCooldown(keyId: string, model: string = 'flash2'): Promise<boolean> {
  try {
    console.log(`[Cooldown System] Placing key ${keyId} in 60s cooldown for model: ${model}`)
    
    const { data, error } = await supabase.rpc('set_model_cooldown', {
      p_key_id: keyId,
      p_model: model
    })
    
    if (error) {
      console.error('[Cooldown System] Error setting cooldown:', error)
      return false
    }
    
    return data === true
  } catch (error) {
    console.error('[Cooldown System] Error in setKeyCooldown:', error)
    return false
  }
}

/**
 * Update API key usage after successful request
 */
export async function updateGemmaKeyUsage(keyId: string, tokensUsed: number = 0): Promise<void> {
  try {
    const { error } = await supabase.rpc('update_gemma_key_usage', {
      p_key_id: keyId,
      p_tokens_used: tokensUsed
    })

    if (error) {
      console.error('Error updating key usage:', error)
    }
  } catch (error) {
    console.error('Error in updateGemmaKeyUsage:', error)
  }
}

/**
 * Log AI request for analytics
 */
export async function logAiRequest(
  userId: string,
  requestType: 'normal' | 'extra',
  modelUsed: string,
  keyId?: string,
  tokensUsed?: number,
  responseTimeMs?: number,
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_request_logs')
      .insert({
        user_id: userId,
        request_type: requestType,
        model_used: modelUsed,
        key_id: keyId,
        tokens_used: tokensUsed,
        response_time_ms: responseTimeMs,
        success,
        error_message: errorMessage
      })

    if (error) {
      console.error('Error logging AI request:', error)
    }
  } catch (error) {
    console.error('Error in logAiRequest:', error)
  }
}

/**
 * Get user's current quota status (for UI display)
 */
export async function getUserQuotaStatus(userId: string): Promise<{
  normalUsed: number
  normalTotal: number
  extraUsed: number
  extraTotal: number
  totalUsedToday: number
  nextResetTime: Date
}> {
  try {
    const { data, error } = await supabase
      .from('user_ai_quotas')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error getting quota status:', error)
    }

    // If no record exists, create one
    if (!data || error?.code === 'PGRST116') {
      await supabase.rpc('get_or_create_user_quota', {
        p_user_id: userId
      })
      
      // Try again
      const { data: newData } = await supabase
        .from('user_ai_quotas')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (newData) {
        const nextReset = getNextResetTime(new Date(newData.last_reset_timestamp))
        return {
          normalUsed: newData.normal_daily_usage,
          normalTotal: 30,
          extraUsed: newData.extra_daily_usage,
          extraTotal: 45,
          totalUsedToday: newData.normal_daily_usage + newData.extra_daily_usage,
          nextResetTime: nextReset
        }
      }
    }

    if (data) {
      const nextReset = getNextResetTime(new Date(data.last_reset_timestamp))
      return {
        normalUsed: data.normal_daily_usage,
        normalTotal: 30,
        extraUsed: data.extra_daily_usage,
        extraTotal: 45,
        totalUsedToday: data.normal_daily_usage + data.extra_daily_usage,
        nextResetTime: nextReset
      }
    }

    // Default values if everything fails
    return {
      normalUsed: 0,
      normalTotal: 30,
      extraUsed: 0,
      extraTotal: 45,
      totalUsedToday: 0,
      nextResetTime: getNextResetTime(new Date())
    }
  } catch (error) {
    console.error('Error in getUserQuotaStatus:', error)
    return {
      normalUsed: 0,
      normalTotal: 30,
      extraUsed: 0,
      extraTotal: 45,
      totalUsedToday: 0,
      nextResetTime: getNextResetTime(new Date())
    }
  }
}

/**
 * Calculate next reset time (midnight UTC)
 */
function getNextResetTime(lastReset: Date): Date {
  const now = new Date()
  const nextReset = new Date(lastReset)
  
  // Set to next midnight UTC
  nextReset.setUTCHours(24, 0, 0, 0)
  
  // If that's in the past, add a day
  while (nextReset <= now) {
    nextReset.setUTCDate(nextReset.getUTCDate() + 1)
  }
  
  return nextReset
}
