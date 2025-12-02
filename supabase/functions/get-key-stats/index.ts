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

        const url = new URL(req.url)
        const model = url.searchParams.get('model')

        let query = supabase
            .from('gemini_api_key_usage')
            .select('*')
            .order('created_at', { ascending: false })

        if (model) {
            query = query.eq('model', model)
        }

        const { data: keys, error } = await query

        if (error) {
            return new Response(
                JSON.stringify({ error: 'Failed to fetch keys', details: error.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Mask API keys for security (show only last 4 chars)
        const maskedKeys = keys?.map((key: any) => ({
            ...key,
            api_key: maskApiKey(key.api_key),
        }))

        return new Response(
            JSON.stringify({ keys: maskedKeys || [] }),
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

function maskApiKey(key: string): string {
    if (key.length <= 4) return key
    return key.substring(0, 6) + '***' + key.substring(key.length - 4)
}
