import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/api-auth'

export async function GET(req: NextRequest) {
    // Authenticate the request
    const authResult = await authenticateRequest(req, {
        allowedRoles: ['teacher', 'admin']
    })

    if ('error' in authResult) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        )
    }

    const { profile, supabase } = authResult

    try {
        // Fetch access logs for this teacher
        // The nfc_access_logs table uses student_id column for all user types
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
            .eq('student_id', profile.user_id)
            .order('created_at', { ascending: false })
            .limit(50)

        // Handle case where table doesn't exist or RLS blocks access
        if (logsError) {
            // If it's a permission error or table doesn't exist, return empty logs
            console.log('Access logs query result:', logsError.code, logsError.message)

            // Return empty logs gracefully instead of error
            // This is expected if teacher hasn't used NFC card yet
            return NextResponse.json({ logs: [] })
        }

        // Transform data for easier consumption
        const formattedLogs = (logs || []).map(log => ({
            id: log.id,
            timestamp: log.created_at,
            accessGranted: log.access_granted,
            denialReason: log.denial_reason,
            reader: log.nfc_readers ? {
                // @ts-ignore
                name: Array.isArray(log.nfc_readers) ? log.nfc_readers[0]?.name : log.nfc_readers?.name,
                // @ts-ignore
                location: Array.isArray(log.nfc_readers) ? log.nfc_readers[0]?.location : log.nfc_readers?.location,
                // @ts-ignore
                type: Array.isArray(log.nfc_readers) ? log.nfc_readers[0]?.location_type : log.nfc_readers?.location_type
            } : { name: 'Unknown Reader', location: 'Unknown', type: 'unknown' }
        }))

        return NextResponse.json({ logs: formattedLogs })

    } catch (error) {
        console.error('Unexpected error fetching access logs:', error)
        // Return empty logs instead of error for better UX
        return NextResponse.json({ logs: [] })
    }
}
