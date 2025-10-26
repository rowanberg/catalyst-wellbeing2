// Supabase Edge Function: get-available-gemini-key
// Manages 100+ Gemini API keys with intelligent rate limiting

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AES-256-GCM decryption using Web Crypto API
async function decryptApiKey(encryptedData: string, encryptionKey: string): Promise<string> {
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':')
    
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    const authTag = new Uint8Array(authTagHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    const encrypted = new Uint8Array(encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    
    // Combine encrypted data with auth tag (GCM format)
    const ciphertext = new Uint8Array([...encrypted, ...authTag])
    
    // Import the encryption key
    const keyBuffer = new Uint8Array(encryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )
    
    // Decrypt
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authentication check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const encryptionKey = Deno.env.get('GEMINI_ENCRYPTION_KEY')!
    
    if (!encryptionKey) {
      console.error('GEMINI_ENCRYPTION_KEY not set')
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

    // 3. Call the cooldown-aware PostgreSQL function to get an available key
    const { data, error } = await supabase.rpc('get_available_gemini_key_with_cooldown')

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Database error occurred' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Check if a key was found
    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'All API keys are currently rate-limited. Please try again shortly.',
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

    const keyData = data[0]

    // 5. Decrypt the API key
    let decryptedKey: string
    try {
      decryptedKey = await decryptApiKey(keyData.out_api_key, encryptionKey)
    } catch (error) {
      console.error('Decryption failed:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to process API key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Return the decrypted key with usage stats
    return new Response(
      JSON.stringify({
        apiKey: decryptedKey,
        keyId: keyData.out_key_id,
        remainingDaily: keyData.out_remaining_daily,
        remainingMinute: keyData.out_remaining_minute
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
