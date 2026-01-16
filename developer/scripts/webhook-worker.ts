/**
 * Webhook Delivery Worker
 * 
 * This script processes webhook events from the queue and delivers them
 * to registered webhook endpoints with retry logic.
 * 
 * Run with: node scripts/webhook-worker.js
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase clients
const devSupabase = createClient(
    process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || '',
    process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || ''
)

const mainSupabase = createClient(
    process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || '',
    process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || ''
)

// Generate HMAC signature for webhook payload
function generateSignature(payload: string, secret: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')
}

// Deliver webhook to endpoint
async function deliverWebhook(webhook: any, event: any) {
    const payload = JSON.stringify({
        id: event.id,
        event: event.event_type,
        created_at: event.created_at,
        data: event.payload
    })

    const signature = generateSignature(payload, webhook.signing_secret)
    const timestamp = Math.floor(Date.now() / 1000)

    try {
        const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CatalystWells-Signature': signature,
                'X-CatalystWells-Timestamp': String(timestamp),
                'X-CatalystWells-Event': event.event_type,
                'User-Agent': 'CatalystWells-Webhooks/1.0'
            },
            body: payload,
            signal: AbortSignal.timeout(30000) // 30 second timeout
        })

        const responseBody = await response.text()

        // Log delivery
        await devSupabase.from('webhook_delivery_logs').insert({
            webhook_id: webhook.id,
            event_id: event.id,
            status: response.ok ? 'success' : 'failed',
            http_status: response.status,
            response_body: responseBody.substring(0, 1000), // Limit to 1000 chars
            attempt_number: event.retry_count + 1,
            delivered_at: new Date().toISOString()
        })

        return {
            success: response.ok,
            status: response.status,
            body: responseBody
        }
    } catch (error: any) {
        // Log failed delivery
        await devSupabase.from('webhook_delivery_logs').insert({
            webhook_id: webhook.id,
            event_id: event.id,
            status: 'failed',
            error_message: error.message,
            attempt_number: event.retry_count + 1,
            delivered_at: new Date().toISOString()
        })

        return {
            success: false,
            error: error.message
        }
    }
}

// Process webhook queue
async function processWebhookQueue() {
    console.log('[Webhook Worker] Processing queue...')

    // Get pending events (not delivered, not exceeded max retries)
    const { data: events, error } = await mainSupabase
        .from('webhook_events')
        .select('*')
        .eq('delivered', false)
        .lt('retry_count', 5)
        .order('created_at', { ascending: true })
        .limit(50)

    if (error) {
        console.error('[Webhook Worker] Error fetching events:', error)
        return
    }

    if (!events || events.length === 0) {
        console.log('[Webhook Worker] No pending events')
        return
    }

    console.log(`[Webhook Worker] Found ${events.length} pending events`)

    for (const event of events) {
        // Get webhooks subscribed to this event type
        const { data: webhooks } = await devSupabase
            .from('application_webhooks')
            .select('*')
            .eq('application_id', event.application_id)
            .eq('is_active', true)
            .contains('events', [event.event_type])

        if (!webhooks || webhooks.length === 0) {
            // Mark as delivered if no webhooks
            await mainSupabase
                .from('webhook_events')
                .update({ delivered: true })
                .eq('id', event.id)
            continue
        }

        console.log(`[Webhook Worker] Delivering event ${event.id} to ${webhooks.length} webhooks`)

        let allSuccessful = true

        for (const webhook of webhooks) {
            const result = await deliverWebhook(webhook, event)

            if (!result.success) {
                allSuccessful = false
                console.error(`[Webhook Worker] Failed to deliver to ${webhook.url}:`, result.error || result.status)
            } else {
                console.log(`[Webhook Worker] Successfully delivered to ${webhook.url}`)
            }

            // Small delay between deliveries
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        // Update event status
        if (allSuccessful) {
            await mainSupabase
                .from('webhook_events')
                .update({
                    delivered: true,
                    delivered_at: new Date().toISOString()
                })
                .eq('id', event.id)
        } else {
            // Increment retry count
            await mainSupabase
                .from('webhook_events')
                .update({
                    retry_count: event.retry_count + 1,
                    next_retry_at: new Date(Date.now() + Math.pow(2, event.retry_count) * 60000).toISOString() // Exponential backoff
                })
                .eq('id', event.id)
        }
    }

    console.log('[Webhook Worker] Queue processing complete')
}

// Main worker loop
async function startWorker() {
    console.log('[Webhook Worker] Starting...')

    // Process queue every 30 seconds
    setInterval(async () => {
        try {
            await processWebhookQueue()
        } catch (error) {
            console.error('[Webhook Worker] Error:', error)
        }
    }, 30000)

    // Initial run
    await processWebhookQueue()
}

// Start the worker
startWorker().catch(console.error)
