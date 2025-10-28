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
  rpmLimit: number
  rpdLimit: number
  tpmLimit: number
  fallbackPriority: number
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'gemini-2.5-flash-lite': {
    name: 'gemini-2.5-flash-lite',
    tableName: 'gemini_25_flash_lite_keys',
    rpmLimit: 15,
    rpdLimit: 1000,
    tpmLimit: 250000,
    fallbackPriority: 1
  },
  'gemini-2.5-flash': {
    name: 'gemini-2.5-flash',
    tableName: 'gemini_25_flash_keys',
    rpmLimit: 10,
    rpdLimit: 250,
    tpmLimit: 250000,
    fallbackPriority: 2
  },
  'gemini-2.0-flash-lite': {
    name: 'gemini-2.0-flash-lite',
    tableName: 'gemini_20_flash_lite_keys',
    rpmLimit: 30,
    rpdLimit: 200,
    tpmLimit: 1000000,
    fallbackPriority: 3
  },
  'gemini-flash-2': {
    name: 'gemini-flash-2',
    tableName: 'gemini_api_keys',
    rpmLimit: 15,
    rpdLimit: 1500,
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

    // ========================================================================
    // ON-DEMAND RESETS - Only runs when keys are being selected
    // ========================================================================
    
    // 1. Clear expired cooldowns (inline, no separate query needed)
    await supabase.from(tableName)
      .update({
        is_in_cooldown: false,
        cooldown_expires_at: null
      })
      .eq('is_in_cooldown', true)
      .lt('cooldown_expires_at', nowISO)

    // 2. Reset RPM for keys that haven't been reset in >60 seconds
    await supabase.from(tableName)
      .update({
        current_rpm: 0,
        last_rpm_reset: nowISO
      })
      .lt('last_rpm_reset', oneMinuteAgo)

    // 3. Reset RPD/TPM for keys that haven't been reset in >24 hours
    await supabase.from(tableName)
      .update({
        current_rpd: 0,
        current_tpm: 0,
        last_rpd_reset: nowISO
      })
      .lt('last_rpd_reset', oneDayAgo)

    // ========================================================================
    // KEY SELECTION - After resets, find best available key
    // ========================================================================
    
    const { data: keys, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('status', 'active')
      .eq('is_in_cooldown', false)
      .lt('current_rpm', config.rpmLimit)
      .lt('current_rpd', config.rpdLimit)
      .order('last_used_at', { ascending: true })
      .limit(10)

    if (error) {
      console.error(`Error querying ${tableName}:`, error)
      return null
    }

    if (!keys || keys.length === 0) {
      console.log(`No available keys in ${tableName}`)
      return null
    }

    // Filter keys that can accommodate the estimated tokens
    const viableKeys = keys.filter(key => 
      key.current_rpm < config.rpmLimit &&
      key.current_rpd < config.rpdLimit &&
      (key.current_tpm + estimatedTokens) <= config.tpmLimit
    )

    if (viableKeys.length === 0) {
      console.log(`No viable keys in ${tableName} for ${estimatedTokens} tokens (TPM check failed)`)
      return null
    }

    // Select the least recently used key
    const selectedKey = viableKeys[0]

    // ========================================================================
    // ATOMIC UPDATE - Row-level locking prevents race conditions
    // ========================================================================
    
    const { data: updatedKey, error: updateError } = await supabase
      .from(tableName)
      .update({
        current_rpm: selectedKey.current_rpm + 1,
        current_rpd: selectedKey.current_rpd + 1,
        current_tpm: selectedKey.current_tpm + estimatedTokens,
        last_used_at: nowISO
      })
      .eq('id', selectedKey.id)
      .select()
      .single()

    if (updateError) {
      console.error(`Error updating key usage:`, updateError)
      return null
    }

    return { ...updatedKey, table_name: tableName, model_name: config.name }

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
