import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LogUsageRequest {
    api_key: string
    model: 'gemini_3_pro' | 'gemini_2_5_pro'
    tokens_used: number
    success: boolean
    error?: string
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { api_key, model, tokens_used, success }: LogUsageRequest = await req.json()

        if (!api_key || !model || tokens_used === undefined) {
            return new Response(
                JSON.stringify({ error: 'api_key, model, and tokens_used are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get current key data
        const { data: keyData, error: fetchError } = await supabase
            .from('gemini_api_key_usage')
            .select('*')
            .eq('api_key', api_key)
            .eq('model', model)
            .single()

        if (fetchError || !keyData) {
            return new Response(
                JSON.stringify({ error: 'API key not found', details: fetchError?.message }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Check if windows need reset (defensive check)
        const now = new Date()
        const minuteWindowStart = new Date(keyData.minute_window_start)
        const dayWindowStart = new Date(keyData.day_window_start)

        let resetMinute = false
        let resetDay = false

        if (now.getTime() - minuteWindowStart.getTime() > 60 * 1000) {
            resetMinute = true
        }

        if (now.getTime() - dayWindowStart.getTime() > 24 * 60 * 60 * 1000) {
            resetDay = true
        }

        // Calculate new values
        const newRpmUsed = resetMinute ? 1 : keyData.rpm_used + 1
        const newTpmUsed = resetMinute ? tokens_used : keyData.tpm_used + tokens_used
        const newRpdUsed = resetDay ? 1 : keyData.rpd_used + 1
        const newMinuteWindowStart = resetMinute ? now.toISOString() : keyData.minute_window_start
        const newDayWindowStart = resetDay ? now.toISOString() : keyData.day_window_start

        // Check if limits will be exceeded
        let shouldRotate = false
        let rotationReason = ''

        if (keyData.rpm_limit && newRpmUsed >= keyData.rpm_limit) {
            shouldRotate = true
            rotationReason = 'rpm_limit_exceeded'
        } else if (keyData.rpd_limit && newRpdUsed >= keyData.rpd_limit) {
            shouldRotate = true
            rotationReason = 'rpd_limit_exceeded'
        } else if (newTpmUsed >= keyData.tpm_limit) {
            shouldRotate = true
            rotationReason = 'tpm_limit_exceeded'
        }

        // Update usage
        const { error: updateError } = await supabase
            .from('gemini_api_key_usage')
            .update({
                rpm_used: newRpmUsed,
                rpd_used: newRpdUsed,
                tpm_used: newTpmUsed,
                total_requests: keyData.total_requests + 1,
                total_tokens: keyData.total_tokens + tokens_used,
                minute_window_start: newMinuteWindowStart,
                day_window_start: newDayWindowStart,
                updated_at: now.toISOString(),
            })
            .eq('api_key', api_key)
            .eq('model', model)

        if (updateError) {
            console.error('Update error:', updateError)
            return new Response(
                JSON.stringify({ error: 'Failed to update usage', details: updateError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Auto-rotate if needed
        if (shouldRotate) {
            await supabase
                .from('gemini_api_key_usage')
                .update({
                    status: 'rotated',
                    auto_rotated: true,
                    last_rotated_at: now.toISOString(),
                    notes: `Auto-rotated: ${rotationReason}`,
                })
                .eq('api_key', api_key)
                .eq('model', model)
        }

        return new Response(
            JSON.stringify({
                success: true,
                usage: {
                    rpm_used: newRpmUsed,
                    rpd_used: newRpdUsed,
                    tpm_used: newTpmUsed,
                },
                rotated: shouldRotate,
                rotation_reason: rotationReason || null,
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
