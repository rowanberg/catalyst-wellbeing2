import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars. Make sure .env.local exists and has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
    console.log('Fetching AI usage stats...')

    // Fetch from ai_request_logs
    const { data: requestLogs, error: requestError } = await supabase
        .from('ai_request_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    if (requestError) {
        console.error('Error fetching request logs:', requestError.message)
    } else {
        console.log(`\n=== Recent AI Requests (Last ${requestLogs.length}) ===`)
        if (requestLogs.length > 0) {
            console.table(requestLogs.map(l => ({
                time: new Date(l.created_at).toISOString().split('T')[1].split('.')[0],
                model: l.model_used,
                tokens: l.tokens_used,
                success: l.success,
                error: l.error_message ? l.error_message.substring(0, 20) + '...' : ''
            })))

            // Aggregate stats
            const stats = requestLogs.reduce((acc, curr) => {
                const model = curr.model_used || 'unknown';
                if (!acc[model]) acc[model] = { count: 0, tokens: 0, errors: 0 };
                acc[model].count++;
                acc[model].tokens += curr.tokens_used || 0;
                if (!curr.success) acc[model].errors++;
                return acc;
            }, {} as Record<string, any>);

            console.log('\n=== Usage Statistics (Sample) ===');
            console.table(stats);
        } else {
            console.log('No request logs found.')
        }
    }

    // Fetch from api_usage_logs (intelligent router logs)
    const { data: usageLogs, error: usageError } = await supabase
        .from('api_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    if (usageError) {
        console.error('Error fetching usage logs:', usageError.message)
    } else {
        console.log(`\n=== Recent Router Usage (Last ${usageLogs.length}) ===`)
        if (usageLogs.length > 0) {
            console.table(usageLogs.map(l => ({
                time: new Date(l.created_at).toISOString().split('T')[1].split('.')[0],
                model: l.model_used,
                key_id: l.key_id ? l.key_id.substring(0, 8) + '...' : 'N/A',
                status: l.status,
                fallback: l.fallback_count
            })))
        } else {
            console.log('No router usage logs found.')
        }
    }

    // Check Gemini Keys Status
    console.log('\n=== Gemini Keys Status ===')
    const { data: keys, error: keysError } = await supabase
        .from('gemini_api_keys')
        .select('id, flash2_minute_count, flash2_daily_count, flash2_is_in_cooldown, gemma_27b_minute_count')
        .limit(10)

    if (keysError) {
        console.error('Error fetching keys:', keysError.message)
    } else {
        if (keys && keys.length > 0) {
            console.table(keys.map(k => ({
                id: k.id.substring(0, 8) + '...',
                flash2_rpm: k.flash2_minute_count,
                flash2_rpd: k.flash2_daily_count,
                cooldown: k.flash2_is_in_cooldown,
                gemma_rpm: k.gemma_27b_minute_count
            })))
        } else {
            console.log('No keys found or access denied.')
        }
    }
}

main()
