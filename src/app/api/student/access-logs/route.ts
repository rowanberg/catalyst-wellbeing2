import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
    // Authenticate the request - verified user with role check
    const authResult = await authenticateRequest(req, {
        allowedRoles: ['student', 'parent', 'teacher', 'admin']
    })

    if ('error' in authResult) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        )
    }

    const { profile, supabase } = authResult

    try {
        // Fetch access logs for this student
        const { data: logs, error: logsError } = await supabase
            .from('nfc_access_logs')
            .select(`
                id,
                access_granted,
                denial_reason,
                created_at,
                reader_id,
                nfc_readers:reader_id (
                    name,
                    location,
                    location_type
                )
            `)
            .eq('student_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (logsError) {
            console.error('Error fetching logs:', logsError)
            return NextResponse.json(
                { error: 'Failed to fetch access logs' },
                { status: 500 }
            )
        }

        // Transform data for easier consumption
        const formattedLogs = logs.map(log => ({
            id: log.id,
            timestamp: log.created_at,
            accessGranted: log.access_granted,
            denialReason: log.denial_reason,
            reader: log.nfc_readers ? {
                // @ts-ignore - Supabase types might imply array or single object depending on relationship, usually single object for FK
                name: Array.isArray(log.nfc_readers) ? log.nfc_readers[0]?.name : log.nfc_readers?.name,
                // @ts-ignore
                location: Array.isArray(log.nfc_readers) ? log.nfc_readers[0]?.location : log.nfc_readers?.location,
                // @ts-ignore
                type: Array.isArray(log.nfc_readers) ? log.nfc_readers[0]?.location_type : log.nfc_readers?.location_type
            } : { name: 'Unknown Reader', location: 'Unknown', type: 'unknown' }
        }))

        return NextResponse.json({ logs: formattedLogs })

    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
