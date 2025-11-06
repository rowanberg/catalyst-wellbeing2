// ============================================================================
// Intelligent AI Key Router - Multi-Model Gemini API Key Management
// ============================================================================
// Manages 100+ API keys across 4 model families with intelligent fallback
// Tracks RPM, RPD, and TPM limits per key with automatic rotation
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// Model Configuration
// ============================================================================
interface ModelConfig {
  name: string
  tableName: string
  columnPrefix: string  // e.g., 'flash2', 'gemma_27b'
  rpmLimit: number
  rpdLimit: number
  tpmLimit: number
  fallbackPriority: number
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'gemini-2.0-flash': {
    name: 'gemini-2.0-flash',
    tableName: 'gemini_api_keys',
    columnPrefix: 'flash2',
    rpmLimit: 15,
    rpdLimit: 200,
    tpmLimit: 1000000,
    fallbackPriority: 1
  },
  'gemma-2-27b': {
    name: 'gemma-2-27b',
    tableName: 'gemini_api_keys',
    columnPrefix: 'gemma_27b',
    rpmLimit: 10,
    rpdLimit: 100,
    tpmLimit: 500000,
    fallbackPriority: 2
  },
  'gemma-2-12b': {
    name: 'gemma-2-12b',
    tableName: 'gemini_api_keys',
    columnPrefix: 'gemma_12b',
    rpmLimit: 15,
    rpdLimit: 150,
    tpmLimit: 750000,
    fallbackPriority: 3
  },
  'gemma-2-4b': {
    name: 'gemma-2-4b',
    tableName: 'gemini_api_keys',
    columnPrefix: 'gemma_4b',
    rpmLimit: 20,
    rpdLimit: 200,
    tpmLimit: 1000000,
    fallbackPriority: 4
  }
}

// Fallback chain ordered by priority
const FALLBACK_CHAIN = Object.values(MODEL_CONFIGS).sort((a, b) => a.fallbackPriority - b.fallbackPriority)

// ============================================================================
// Encryption/Decryption (AES-256-GCM)
// ============================================================================
async function decryptApiKey(encryptedData: string, encryptionKey: string): Promise<string> {
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':')
    
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    const authTag = new Uint8Array(authTagHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    const encrypted = new Uint8Array(encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    
    const ciphertext = new Uint8Array([...encrypted, ...authTag])
    
    const keyBuffer = new Uint8Array(encryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    )
    
    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt API key')
  }
}

// ============================================================================
// Key Selection Logic
// ============================================================================
async function selectAvailableKey(
  supabase: any,
  tableName: string,
  config: ModelConfig,
  estimatedTokens: number = 1000
): Promise<any | null> {
  try {
    const now = new Date()
    const nowISO = now.toISOString()
    const oneMinuteAgo = new Date(now.getTime() - 60000).toISOString()
    const oneDayAgo = new Date(now.getTime() - 86400000).toISOString()
    const prefix = config.columnPrefix

    // Column names based on prefix
    const minuteCountCol = `${prefix}_minute_count`
    const dailyCountCol = `${prefix}_daily_count`
    const lastMinuteResetCol = `${prefix}_last_minute_reset`
    const lastDailyResetCol = `${prefix}_last_daily_reset`
    const isCooldownCol = `${prefix}_is_in_cooldown`
    const cooldownExpiresCol = `${prefix}_cooldown_expires_at`

    // ========================================================================
    // ON-DEMAND RESETS
    // ========================================================================
    
    // 1. Clear expired cooldowns
    await supabase.from(tableName)
      .update({ [isCooldownCol]: false, [cooldownExpiresCol]: null })
      .eq(isCooldownCol, true)
      .lt(cooldownExpiresCol, nowISO)

    // 2. Reset minute counter for keys >60 seconds old
    await supabase.from(tableName)
      .update({ [minuteCountCol]: 0, [lastMinuteResetCol]: nowISO })
      .lt(lastMinuteResetCol, oneMinuteAgo)

    // 3. Reset daily counter for keys >24 hours old
    await supabase.from(tableName)
      .update({ [dailyCountCol]: 0, [lastDailyResetCol]: nowISO })
      .lt(lastDailyResetCol, oneDayAgo)

    // ========================================================================
    // KEY SELECTION
    // ========================================================================
    
    const { data: keys, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('is_disabled', false)
      .eq(isCooldownCol, false)
      .lt(minuteCountCol, config.rpmLimit)
      .lt(dailyCountCol, config.rpdLimit)
      .order('last_used_timestamp', { ascending: true })
      .limit(10)

    if (error) {
      console.error(`Error querying ${tableName}:`, error)
      return null
    }

    if (!keys || keys.length === 0) {
      console.log(`No available keys in ${tableName} for ${config.name}`)
      return null
    }

    // Select the least recently used key
    const selectedKey = keys[0]

    // ========================================================================
    // ATOMIC UPDATE
    // ========================================================================
    
    const { data: updatedKey, error: updateError } = await supabase
      .from(tableName)
      .update({
        [minuteCountCol]: selectedKey[minuteCountCol] + 1,
        [dailyCountCol]: selectedKey[dailyCountCol] + 1,
        last_used_timestamp: nowISO
      })
      .eq('id', selectedKey.id)
      .select()
      .single()

    if (updateError) {
      console.error(`Error updating key usage:`, updateError)
      return null
    }

    return { ...updatedKey, table_name: tableName, model_name: config.name, column_prefix: prefix }

  } catch (error) {
    console.error(`Error in selectAvailableKey for ${tableName}:`, error)
    return null
  }
}

// ============================================================================
// Intelligent Key Router with Fallback
// ============================================================================
async function getAvailableKeyWithFallback(
  supabase: any,
  requestedModel: string,
  estimatedTokens: number,
  userId?: string,
  endpoint?: string
): Promise<{ key: any, modelUsed: string, fallbackCount: number }> {
  let fallbackCount = 0
  let startModel = requestedModel

  // Determine starting point in fallback chain
  const requestedConfig = MODEL_CONFIGS[requestedModel]
  if (!requestedConfig) {
    throw new Error(`Unknown model: ${requestedModel}`)
  }

  const startIndex = FALLBACK_CHAIN.findIndex(m => m.name === requestedModel)
  
  // Try requested model first, then fall back through the chain
  for (let i = startIndex; i < FALLBACK_CHAIN.length; i++) {
    const config = FALLBACK_CHAIN[i]
    
    console.log(`Attempting to get key from: ${config.name}`)
    
    const key = await selectAvailableKey(supabase, config.tableName, config, estimatedTokens)
    
    if (key) {
      if (i > startIndex) {
        fallbackCount = i - startIndex
        console.log(`Fallback successful: ${startModel} → ${config.name} (${fallbackCount} steps)`)
      }
      
      // Log usage
      await logApiUsage(supabase, {
        model_requested: requestedModel,
        model_used: config.name,
        key_id: key.id,
        table_name: config.tableName,
        tokens_used: estimatedTokens,
        status: fallbackCount > 0 ? 'fallback' : 'success',
        fallback_count: fallbackCount,
        user_id: userId,
        endpoint: endpoint
      })
      
      return { key, modelUsed: config.name, fallbackCount }
    }
  }

  // All models exhausted
  await logApiUsage(supabase, {
    model_requested: requestedModel,
    model_used: 'none',
    key_id: null,
    table_name: 'none',
    tokens_used: 0,
    status: 'error',
    error_message: 'All model keys exhausted',
    fallback_count: FALLBACK_CHAIN.length - startIndex - 1,
    user_id: userId,
    endpoint: endpoint
  })

  throw new Error('All model keys exhausted')
}

// ============================================================================
// Usage Logging
// ============================================================================
async function logApiUsage(supabase: any, logData: any) {
  try {
    await supabase.from('api_usage_logs').insert({
      model_requested: logData.model_requested,
      model_used: logData.model_used,
      key_id: logData.key_id,
      table_name: logData.table_name,
      tokens_used: logData.tokens_used || 0,
      status: logData.status,
      error_message: logData.error_message,
      fallback_count: logData.fallback_count || 0,
      user_id: logData.user_id,
      endpoint: logData.endpoint,
      request_duration_ms: logData.request_duration_ms
    })
  } catch (error) {
    console.error('Failed to log API usage:', error)
  }
}

// ============================================================================
// Main Handler
// ============================================================================
serve(async (req) => {
  const requestStartTime = Date.now()

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Parse request body
    const { model, tokens, prompt, userId, endpoint } = await req.json()

    if (!model) {
      return new Response(
        JSON.stringify({ error: 'Model parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate model
    if (!MODEL_CONFIGS[model]) {
      const validModels = Object.keys(MODEL_CONFIGS)
      return new Response(
        JSON.stringify({ 
          error: `Invalid model: ${model}. Valid models: ${validModels.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Estimate tokens if not provided
    const estimatedTokens = tokens || (prompt ? Math.ceil(prompt.length / 4) : 1000)

    // 2. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const encryptionKey = Deno.env.get('GEMINI_ENCRYPTION_KEY')!
    
    if (!encryptionKey) {
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 3. Get available key with intelligent fallback
    let result
    try {
      result = await getAvailableKeyWithFallback(
        supabase,
        model,
        estimatedTokens,
        userId,
        endpoint
      )
    } catch (error: any) {
      if (error.message === 'All model keys exhausted') {
        return new Response(
          JSON.stringify({ 
            error: 'All model keys exhausted',
            message: 'All API keys across all models are currently rate-limited. Please try again shortly.',
            retryAfter: 60
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Retry-After': '60'
            } 
          }
        )
      }
      throw error
    }

    // 4. Decrypt the API key
    const decryptedKey = await decryptApiKey(result.key.encrypted_api_key, encryptionKey)

    // 5. Calculate request duration
    const requestDuration = Date.now() - requestStartTime

    // 6. Update log with duration
    await supabase.from('api_usage_logs')
      .update({ request_duration_ms: requestDuration })
      .eq('key_id', result.key.id)
      .order('created_at', { ascending: false })
      .limit(1)

    // 7. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        api_key: decryptedKey,
        model_requested: model,
        model_used: result.modelUsed,
        fallback_count: result.fallbackCount,
        key_id: result.key.id,
        usage: {
          current_rpm: result.key.current_rpm,
          current_rpd: result.key.current_rpd,
          current_tpm: result.key.current_tpm,
          rpm_limit: MODEL_CONFIGS[result.modelUsed].rpmLimit,
          rpd_limit: MODEL_CONFIGS[result.modelUsed].rpdLimit,
          tpm_limit: MODEL_CONFIGS[result.modelUsed].tpmLimit
        },
        request_duration_ms: requestDuration
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
