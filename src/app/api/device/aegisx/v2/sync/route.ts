import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'

/**
 * AegisX Device Sync API v2
 * 
 * Enhanced device synchronization with:
 * - HMAC authentication & replay protection
 * - Period-wise attendance marking from NFC scans
 * - Access rules evaluation
 * - Behavior detection & alerts
 * - Parent notifications
 * - Emergency mode handling
 */

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

// Types
interface ScanLog {
    cardUid: string
    timestamp: string
    readerTime: string
    scanType?: 'entry' | 'exit' | 'tap'
}

interface DeviceStatus {
    batteryLevel?: number
    wifiStrength?: number
    temperature?: number
    uptime?: number
    lastError?: string
}

interface SyncPayload {
    logs?: ScanLog[]
    status?: DeviceStatus
    version?: string
    mode?: string
}

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // ============================================
        // 1. SECURITY: Validate Headers
        // ============================================
        const signature = request.headers.get('x-aegisx-signature')
        const timestamp = request.headers.get('x-aegisx-timestamp')
        const serialNumber = request.headers.get('x-aegisx-serial')

        if (!signature || !timestamp || !serialNumber) {
            return NextResponse.json({
                error: 'Missing security headers',
                required: ['x-aegisx-signature', 'x-aegisx-timestamp', 'x-aegisx-serial']
            }, { status: 401 })
        }

        // ============================================
        // 2. SECURITY: Prevent Replay Attacks (5 min window)
        // ============================================
        const now = Math.floor(Date.now() / 1000)
        const reqTimestamp = parseInt(timestamp)
        if (Math.abs(now - reqTimestamp) > 300) {
            return NextResponse.json({
                error: 'Request expired',
                serverTime: now,
                requestTime: reqTimestamp
            }, { status: 401 })
        }

        // ============================================
        // 3. Get Device from Database
        // ============================================
        const { data: reader, error: readerError } = await supabaseAdmin
            .from('nfc_readers')
            .select(`
                id, device_secret, school_id, config, name, 
                location, location_type, metadata, enabled,
                total_scans, today_scans
            `)
            .eq('serial_number', serialNumber)
            .single()

        if (readerError || !reader) {
            console.error('Device lookup failed:', readerError)
            return NextResponse.json({ error: 'Device not found' }, { status: 404 })
        }

        if (!reader.enabled) {
            return NextResponse.json({ error: 'Device is disabled' }, { status: 403 })
        }

        // ============================================
        // 4. SECURITY: Verify HMAC Signature
        // ============================================
        const bodyText = await request.text()
        const expectedSignature = crypto
            .createHmac('sha256', reader.device_secret)
            .update(`${timestamp}${bodyText}`)
            .digest('hex')

        if (signature !== expectedSignature) {
            console.error('Signature mismatch for device:', serialNumber)
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        // ============================================
        // 5. Check Emergency Modes
        // ============================================
        const { data: emergencyMode } = await supabaseAdmin
            .from('emergency_modes')
            .select('*')
            .eq('school_id', reader.school_id)
            .eq('is_active', true)
            .order('activated_at', { ascending: false })
            .limit(1)
            .single()

        let globalAccessOverride: 'allow' | 'deny' | null = null
        let silentMode = false

        if (emergencyMode) {
            if (emergencyMode.mode_type === 'lockdown') {
                globalAccessOverride = 'deny'
            } else if (emergencyMode.mode_type === 'emergency_unlock') {
                globalAccessOverride = 'allow'
            } else if (emergencyMode.mode_type === 'silent_mode') {
                silentMode = true
            }
        }

        // ============================================
        // 6. Parse and Process Payload
        // ============================================
        const payload: SyncPayload = JSON.parse(bodyText || '{}')
        const { logs, status, version } = payload

        // Update reader status
        await supabaseAdmin
            .from('nfc_readers')
            .update({
                status: 'online',
                last_sync: new Date().toISOString(),
                version: version || reader.metadata?.version || '1.0.0',
                metadata: {
                    ...reader.metadata,
                    ip: request.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: request.headers.get('user-agent'),
                    lastStatus: status,
                    lastSyncDuration: Date.now() - startTime
                }
            })
            .eq('id', reader.id)

        // ============================================
        // 7. Process Scan Logs
        // ============================================
        const processedLogs: any[] = []
        const attendanceResults: any[] = []
        const accessResults: any[] = []
        const behaviorAlerts: any[] = []

        if (logs && Array.isArray(logs) && logs.length > 0) {
            for (const log of logs) {
                const { cardUid, timestamp: scanTimestamp } = log
                const scanTime = new Date(scanTimestamp || new Date())

                // 7a. Find the card
                const { data: card } = await supabaseAdmin
                    .from('nfc_cards')
                    .select(`
                        id, student_id, card_type, status, 
                        is_suspended, valid_from, valid_until,
                        school_id
                    `)
                    .eq('card_uid', cardUid)
                    .single()

                let accessGranted = false
                let denialReason: string | null = null
                let studentInfo: any = null

                if (!card) {
                    denialReason = 'Card not registered'
                } else if (card.status !== 'active') {
                    denialReason = `Card status: ${card.status}`
                } else if (card.is_suspended) {
                    denialReason = 'Card is suspended'
                } else if (card.valid_until && new Date(card.valid_until) < scanTime) {
                    denialReason = 'Card has expired'
                } else if (card.school_id !== reader.school_id) {
                    denialReason = 'Card from different school'
                } else {
                    // Card is valid, check access rules
                    if (globalAccessOverride === 'deny') {
                        denialReason = 'School in lockdown mode'
                    } else if (globalAccessOverride === 'allow') {
                        accessGranted = true
                    } else {
                        // Evaluate access rules
                        const { data: ruleResult } = await supabaseAdmin
                            .rpc('evaluate_access_rules', {
                                p_reader_id: reader.id,
                                p_card_id: card.id,
                                p_scan_time: scanTime.toISOString()
                            })

                        if (ruleResult && ruleResult.access === 'deny') {
                            denialReason = ruleResult.reason || 'Access denied by rule'
                        } else {
                            accessGranted = true
                        }
                    }

                    // Get student info for logging
                    if (card.student_id) {
                        const { data: profile } = await supabaseAdmin
                            .from('profiles')
                            .select('id, first_name, last_name, student_tag, role')
                            .eq('user_id', card.student_id)
                            .single()
                        studentInfo = profile
                    }
                }

                // 7b. Log the access attempt
                const { data: accessLog } = await supabaseAdmin
                    .from('nfc_access_logs')
                    .insert({
                        school_id: reader.school_id,
                        reader_id: reader.id,
                        card_id: card?.id || null,
                        card_uid: cardUid,
                        student_id: card?.student_id || null,
                        student_name: studentInfo ? `${studentInfo.first_name} ${studentInfo.last_name}` : null,
                        student_tag: studentInfo?.student_tag || null,
                        access_granted: accessGranted,
                        denial_reason: denialReason,
                        created_at: scanTime.toISOString()
                    })
                    .select()
                    .single()

                accessResults.push({
                    cardUid,
                    granted: accessGranted,
                    reason: denialReason,
                    silent: silentMode
                })

                // 7c. Process attendance if access granted and it's an attendance reader
                if (accessGranted && card && ['gate', 'classroom'].includes(reader.location_type)) {
                    try {
                        const { data: attendanceResult } = await supabaseAdmin
                            .rpc('process_nfc_attendance_scan', {
                                p_reader_id: reader.id,
                                p_card_uid: cardUid,
                                p_scan_time: scanTime.toISOString()
                            })

                        if (attendanceResult) {
                            attendanceResults.push(attendanceResult)

                            // 7d. Send notifications for late entries
                            if (attendanceResult.status === 'late' && attendanceResult.late_minutes > 0) {
                                await queueParentNotification(
                                    supabaseAdmin,
                                    reader.school_id,
                                    card.student_id,
                                    'late_entry',
                                    `Your child arrived ${attendanceResult.late_minutes} minutes late to ${attendanceResult.period_name || 'school'}`
                                )
                            }
                        }
                    } catch (attendanceError) {
                        console.error('Attendance processing error:', attendanceError)
                    }
                }

                // 7e. Check for unusual behavior
                if (accessGranted && card?.student_id) {
                    try {
                        const { data: behaviorResult } = await supabaseAdmin
                            .rpc('check_unusual_behavior', {
                                p_student_id: studentInfo?.id,
                                p_reader_id: reader.id,
                                p_scan_time: scanTime.toISOString()
                            })

                        if (behaviorResult?.alert) {
                            behaviorAlerts.push(behaviorResult)
                        }
                    } catch (behaviorError) {
                        console.error('Behavior check error:', behaviorError)
                    }
                }

                processedLogs.push({
                    cardUid,
                    processed: true,
                    accessGranted,
                    attendanceMarked: attendanceResults.length > 0
                })
            }

            // Update reader scan counts
            await supabaseAdmin
                .from('nfc_readers')
                .update({
                    total_scans: (reader.total_scans || 0) + logs.length,
                    today_scans: (reader.today_scans || 0) + logs.length
                })
                .eq('id', reader.id)
        }

        // ============================================
        // 8. Fetch Pending Commands
        // ============================================
        const { data: commands } = await supabaseAdmin
            .from('nfc_command_queue')
            .select('id, command_type, payload, priority')
            .eq('reader_id', reader.id)
            .eq('status', 'pending')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(10)

        // Mark commands as sent
        if (commands && commands.length > 0) {
            await supabaseAdmin
                .from('nfc_command_queue')
                .update({
                    status: 'sent',
                    executed_at: new Date().toISOString()
                })
                .in('id', commands.map((c: any) => c.id))
        }

        // Add emergency mode command if active
        const deviceCommands: any[] = commands || []
        if (emergencyMode) {
            deviceCommands.unshift({
                id: `emergency-${emergencyMode.id}`,
                command_type: 'emergency_mode',
                payload: {
                    mode: emergencyMode.mode_type,
                    message: emergencyMode.activation_reason
                },
                priority: 100
            })
        }

        // ============================================
        // 9. Prepare Response
        // ============================================
        const processingTime = Date.now() - startTime

        return NextResponse.json({
            success: true,
            ts: now,
            processingTime,

            // Device config
            config: reader.config || {},

            // Commands to execute
            commands: deviceCommands,

            // Access results for each scanned card
            accessResults,

            // Summary
            summary: {
                logsProcessed: processedLogs.length,
                attendanceMarked: attendanceResults.length,
                alertsGenerated: behaviorAlerts.length
            },

            // Global settings
            settings: {
                silentMode,
                emergencyMode: emergencyMode?.mode_type || 'normal'
            }
        })

    } catch (error: any) {
        console.error('Device Sync Error:', error)
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message
        }, { status: 500 })
    }
}

// Helper function to queue parent notifications
async function queueParentNotification(
    supabase: any,
    schoolId: string,
    studentUserId: string,
    notificationType: string,
    message: string
) {
    try {
        // Get student's profile
        const { data: studentProfile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('user_id', studentUserId)
            .single()

        if (!studentProfile) return

        // Find parent relationships
        const { data: parentRelations } = await supabase
            .from('parent_child_relationships')
            .select('parent_id')
            .eq('child_id', studentUserId)

        if (!parentRelations || parentRelations.length === 0) return

        // Queue notification for each parent
        for (const relation of parentRelations) {
            await supabase
                .from('notification_queue')
                .insert({
                    school_id: schoolId,
                    recipient_id: relation.parent_id,
                    recipient_type: 'parent',
                    notification_type: notificationType,
                    related_student_id: studentProfile.id,
                    title: `${studentProfile.first_name} - ${notificationType.replace('_', ' ')}`,
                    message,
                    delivery_channel: 'push',
                    priority: notificationType.includes('emergency') ? 'urgent' : 'normal'
                })
        }
    } catch (error) {
        console.error('Failed to queue parent notification:', error)
    }
}
