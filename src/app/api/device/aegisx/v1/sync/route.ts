import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'

// Service Role Client for Device Auth (Bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(request: NextRequest) {
    try {
        // 1. Get headers for HMAC validation
        const signature = request.headers.get('x-aegisx-signature')
        const timestamp = request.headers.get('x-aegisx-timestamp')
        const serialNumber = request.headers.get('x-aegisx-serial')

        if (!signature || !timestamp || !serialNumber) {
            return NextResponse.json({ error: 'Missing security headers' }, { status: 401 })
        }

        // 2. Prevent Replay Attacks (5 minute window)
        const now = Math.floor(Date.now() / 1000)
        const reqTimestamp = parseInt(timestamp)
        if (Math.abs(now - reqTimestamp) > 300) {
            return NextResponse.json({ error: 'Request expired' }, { status: 401 })
        }

        // 3. Get Device Secret from DB
        const { data: reader, error: readerError } = await supabaseAdmin
            .from('nfc_readers')
            .select('id, device_secret, school_id, config, name, metadata')
            .eq('serial_number', serialNumber)
            .single()

        if (readerError || !reader) {
            return NextResponse.json({ error: 'Device not found' }, { status: 404 })
        }

        // 4. Read body
        const bodyText = await request.text()

        // 5. Verify HMAC Signature
        // Signature = HMAC-SHA256(secret, timestamp + body)
        const expectedSignature = crypto
            .createHmac('sha256', reader.device_secret)
            .update(`${timestamp}${bodyText}`)
            .digest('hex')

        if (signature !== expectedSignature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // 6. Process Payload
        const payload = JSON.parse(bodyText)
        const { logs, status, version } = payload

        // 7. Update Reader Status
        await supabaseAdmin
            .from('nfc_readers')
            .update({
                status: 'online',
                last_sync: new Date().toISOString(),
                version: version || '1.0.0',
                metadata: {
                    ...reader.metadata,
                    ip: request.headers.get('x-forwarded-for') || 'unknown',
                    status_details: status
                }
            })
            .eq('id', reader.id)

        // 8. Process Logs (if any)
        if (logs && Array.isArray(logs) && logs.length > 0) {
            // Process each log
            for (const log of logs) {
                const { cardId, timestamp, accessGranted, details } = log

                // Find user by NFC Card
                const { data: userProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('user_id, first_name, last_name, role')
                    .eq('nfc_card_id', cardId)
                    .single()

                // Insert Access Log
                await supabaseAdmin
                    .from('access_logs')
                    .insert({
                        reader_id: reader.id,
                        user_id: userProfile?.user_id,
                        card_id: cardId, // RAW card ID if user not found
                        status: accessGranted ? 'allowed' : 'denied',
                        timestamp: timestamp || new Date().toISOString(),
                        reader_name: reader.name, // Denormalized for speed
                        user_name: userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'Unknown User',
                        user_role: userProfile?.role || 'unknown'
                    })

                // Update scan counts
                await supabaseAdmin.rpc('increment_reader_scans', { reader_id: reader.id })
            }
        }

        // 9. Check for Pending Commands
        const { data: commands } = await supabaseAdmin
            .from('nfc_command_queue')
            .select('*')
            .eq('reader_id', reader.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })

        // Mark commands as sent
        if (commands && commands.length > 0) {
            await supabaseAdmin
                .from('nfc_command_queue')
                .update({ status: 'sent', executed_at: new Date().toISOString() })
                .in('id', commands.map((c: any) => c.id))
        }

        // 10. Return Response (Config + Commands)
        return NextResponse.json({
            success: true,
            ts: now,
            config: reader.config,
            commands: commands || []
        })

    } catch (error: any) {
        console.error('Device Sync Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
