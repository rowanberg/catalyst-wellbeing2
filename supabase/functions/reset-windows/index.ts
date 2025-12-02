import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const now = new Date()
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        // Reset minute windows
        const { data: minuteResets, error: minuteError } = await supabase
            .from('gemini_api_key_usage')
            .update({
                rpm_used: 0,
                tpm_used: 0,
                minute_window_start: now.toISOString(),
            })
            .lt('minute_window_start', oneMinuteAgo.toISOString())
            .select('api_key, model')

        // Reset day windows
        const { data: dayResets, error: dayError } = await supabase
            .from('gemini_api_key_usage')
            .update({
                rpd_used: 0,
                day_window_start: now.toISOString(),
            })
            .lt('day_window_start', oneDayAgo.toISOString())
            .select('api_key, model')

        // Aggregate model usage
        await aggregateAllModels(supabase)

        return new Response(
            JSON.stringify({
                success: true,
                reset_stats: {
                    minute_windows_reset: minuteResets?.length || 0,
                    day_windows_reset: dayResets?.length || 0,
                    aggregation_completed: true,
                },
                timestamp: now.toISOString(),
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

async function aggregateAllModels(supabase: any) {
    const models = ['gemini_3_pro', 'gemini_2_5_pro']

    for (const model of models) {
        const { data: keys } = await supabase
            .from('gemini_api_key_usage')
            .select('*')
            .eq('model', model)

        if (!keys || keys.length === 0) continue

        const aggregated = keys.reduce((acc: any, key: any) => ({
            total_rpm_used: acc.total_rpm_used + key.rpm_used,
            total_rpd_used: acc.total_rpd_used + key.rpd_used,
            total_tpm_used: acc.total_tpm_used + key.tpm_used,
            total_requests: acc.total_requests + key.total_requests,
            total_tokens: acc.total_tokens + key.total_tokens,
            active_keys: key.status === 'active' ? acc.active_keys + 1 : acc.active_keys,
            rotated_keys: key.status === 'rotated' ? acc.rotated_keys + 1 : acc.rotated_keys,
        }), {
            total_rpm_used: 0,
            total_rpd_used: 0,
            total_tpm_used: 0,
            total_requests: 0,
            total_tokens: 0,
            active_keys: 0,
            rotated_keys: 0,
        })

        await supabase
            .from('gemini_model_usage_summary')
            .upsert({
                model,
                ...aggregated,
                calculated_at: new Date().toISOString(),
            })
    }
}
