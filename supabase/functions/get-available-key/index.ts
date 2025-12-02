import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetKeyRequest {
  model: 'gemini_3_pro' | 'gemini_2_5_pro' | 'gemini_2_5_flash'
  estimated_tokens?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { model, estimated_tokens = 0 }: GetKeyRequest = await req.json()

    if (!model) {
      return new Response(
        JSON.stringify({ error: 'model is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    // Model-specific limits (based on official Gemini API limits)
    const limits = model === 'gemini_3_pro'
      ? { rpm: null, rpd: null, tpm: 125000 }
      : model === 'gemini_2_5_flash'
        ? { rpm: 10, rpd: 250, tpm: 250000 } // Flash: 10 RPM, 250 RPD, 250K TPM
        : { rpm: 2, rpd: 50, tpm: 125000 } // Pro: 2 RPM, 50 RPD, 125K TPM

    // On-demand reset and query
    // Reset expired minute windows
    await supabase
      .from('gemini_api_key_usage')
      .update({
        rpm_used: 0,
        tpm_used: 0,
        minute_window_start: now.toISOString(),
      })
      .eq('model', model)
      .lt('minute_window_start', oneMinuteAgo)

    // Reset expired day windows
    await supabase
      .from('gemini_api_key_usage')
      .update({
        rpd_used: 0,
        day_window_start: now.toISOString(),
      })
      .eq('model', model)
      .lt('day_window_start', oneDayAgo)

    // Query for available key
    let query = supabase
      .from('gemini_api_key_usage')
      .select('*')
      .eq('model', model)
      .eq('status', 'active')
      .lt('tpm_used', limits.tpm - estimated_tokens)

    if (limits.rpm !== null) {
      query = query.lt('rpm_used', limits.rpm)
    }
    if (limits.rpd !== null) {
      query = query.lt('rpd_used', limits.rpd)
    }

    const { data: availableKeys, error } = await query.limit(1)

    if (error || !availableKeys || availableKeys.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'All API keys exhausted',
          retry_after: 60,
          message: 'All keys have reached their limits. Please retry after 1 minute.'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const selectedKey = availableKeys[0]

    return new Response(
      JSON.stringify({
        api_key: selectedKey.api_key,
        model: selectedKey.model,
        capacity_remaining: {
          rpm: limits.rpm !== null ? limits.rpm - selectedKey.rpm_used : null,
          rpd: limits.rpd !== null ? limits.rpd - selectedKey.rpd_used : null,
          tpm: limits.tpm - selectedKey.tpm_used,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
