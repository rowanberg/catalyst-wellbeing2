import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RotateKeyRequest {
    current_key: string
    model: 'gemini_3_pro' | 'gemini_2_5_pro'
    reason?: string
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { current_key, model, reason = 'manual' }: RotateKeyRequest = await req.json()

        if (!current_key || !model) {
            return new Response(
                JSON.stringify({ error: 'current_key and model are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Mark current key as rotated
        const { error: rotateError } = await supabase
            .from('gemini_api_key_usage')
            .update({
                status: 'rotated',
                auto_rotated: reason !== 'manual',
                last_rotated_at: new Date().toISOString(),
                notes: `Rotated: ${reason}`,
            })
            .eq('api_key', current_key)
            .eq('model', model)

        if (rotateError) {
            return new Response(
                JSON.stringify({ error: 'Failed to rotate key', details: rotateError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Find next available key
        const { data: nextKeys, error: fetchError } = await supabase
            .from('gemini_api_key_usage')
            .select('*')
            .eq('model', model)
            .eq('status', 'active')
            .neq('api_key', current_key)
            .limit(1)

        if (fetchError) {
            return new Response(
                JSON.stringify({ error: 'Failed to fetch next key', details: fetchError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!nextKeys || nextKeys.length === 0) {
            return new Response(
                JSON.stringify({
                    error: 'No alternative keys available',
                    message: `All keys for ${model} have been exhausted. Please add more keys or wait for window reset.`,
                    rotated_from: current_key,
                }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const nextKey = nextKeys[0]

        return new Response(
            JSON.stringify({
                new_key: nextKey.api_key,
                rotated_from: current_key,
                reason,
                capacity_remaining: {
                    rpm: nextKey.rpm_limit ? nextKey.rpm_limit - nextKey.rpm_used : null,
                    rpd: nextKey.rpd_limit ? nextKey.rpd_limit - nextKey.rpd_used : null,
                    tpm: nextKey.tpm_limit - nextKey.tpm_used,
                },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Function error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
