import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is admin
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, school_id')
            .eq('user_id', user.id)

        if (profileError || !profiles || profiles.length === 0) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const profile = profiles[0]

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch real NFC access logs from database
        const { data: accessLogs, error } = await supabaseAdmin
            .from('nfc_access_logs')
            .select(`
                id,
                created_at,
                access_granted,
                denial_reason,
                card_uid,
                student_name,
                student_tag,
                reader_id
            `)
            .eq('school_id', profile.school_id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error fetching access logs:', error)
            // If table doesn't exist yet, return empty array
            return NextResponse.json({
                logs: [],
                message: 'NFC access logs table not found. Please run the aegisx_nfc_system.sql migration.'
            })
        }

        // Get reader names for the logs
        const readerIds = [...new Set(accessLogs?.map((log: any) => log.reader_id).filter(Boolean))]
        let readerMap: Record<string, string> = {}

        if (readerIds.length > 0) {
            const { data: readers } = await supabaseAdmin
                .from('nfc_readers')
                .select('id, name')
                .in('id', readerIds)

            if (readers) {
                readerMap = readers.reduce((acc: Record<string, string>, r: any) => {
                    acc[r.id] = r.name
                    return acc
                }, {})
            }
        }

        // Transform data to match frontend interface
        const transformedLogs = accessLogs?.map((log: any) => {
            const now = new Date()
            const logTime = new Date(log.created_at)
            const diffMs = now.getTime() - logTime.getTime()
            const diffMins = Math.floor(diffMs / 60000)

            let timeDisplay = ''
            if (diffMins < 1) {
                timeDisplay = 'Just now'
            } else if (diffMins < 60) {
                timeDisplay = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
            } else {
                const hours = Math.floor(diffMins / 60)
                if (hours < 24) {
                    timeDisplay = `${hours} hour${hours > 1 ? 's' : ''} ago`
                } else {
                    const days = Math.floor(hours / 24)
                    timeDisplay = `${days} day${days > 1 ? 's' : ''} ago`
                }
            }

            return {
                id: log.id,
                readerId: log.reader_id || 'unknown',
                readerName: readerMap[log.reader_id] || 'Unknown Reader',
                userName: log.student_name || 'Unknown User',
                userRole: log.student_tag ? 'Student' : 'Guest',
                timestamp: timeDisplay,
                status: log.access_granted ? 'allowed' : 'denied',
                denialReason: log.denial_reason
            }
        }) || []

        return NextResponse.json({ logs: transformedLogs })

    } catch (error: any) {
        console.error('Error in GET /api/admin/aegisx/logs:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
