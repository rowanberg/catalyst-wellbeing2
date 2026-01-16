import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth/api-auth'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

// GET - Fetch live NFC scans (poll endpoint)
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { allowedRoles: ['teacher', 'admin'] })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const { searchParams } = new URL(request.url)
        const classId = searchParams.get('classId')
        const since = searchParams.get('since') // ISO timestamp

        // Default to last 30 seconds if no 'since' provided
        const sinceTime = since
            ? new Date(since).toISOString()
            : new Date(Date.now() - 30000).toISOString()

        // Get recent scans from access logs
        const { data: scans, error: scanError } = await supabaseAdmin
            .from('nfc_access_logs')
            .select(`
                id,
                card_uid,
                student_id,
                student_name,
                student_tag,
                access_granted,
                denial_reason,
                created_at,
                reader:nfc_readers!nfc_access_logs_reader_id_fkey(name, location, location_type)
            `)
            .eq('school_id', profile.school_id)
            .gte('created_at', sinceTime)
            .order('created_at', { ascending: false })
            .limit(50)

        if (scanError) {
            console.error('Failed to fetch live scans:', scanError)
            return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 })
        }

        // Optionally filter by class if classId provided
        let filteredScans = scans || []

        if (classId) {
            // Get students in the class
            const { data: classStudents } = await supabaseAdmin
                .from('student_class_assignments')
                .select('student_id')
                .eq('class_id', classId)
                .eq('is_active', true)

            const studentIds = new Set((classStudents || []).map(s => s.student_id))

            // Filter scans to only include class students
            filteredScans = filteredScans.filter(s =>
                s.student_id && studentIds.has(s.student_id)
            )
        }

        // Transform to camelCase
        const transformedScans = filteredScans.map(s => ({
            id: s.id,
            cardUid: s.card_uid,
            studentId: s.student_id,
            studentName: s.student_name || 'Unknown',
            studentTag: s.student_tag,
            accessGranted: s.access_granted,
            denialReason: s.denial_reason,
            timestamp: s.created_at,
            readerName: (s.reader as any)?.name || 'Unknown Reader',
            readerLocation: (s.reader as any)?.location,
            readerLocationType: (s.reader as any)?.location_type
        }))

        return NextResponse.json({
            scans: transformedScans,
            serverTime: new Date().toISOString()
        })

    } catch (error: any) {
        console.error('Error fetching live scans:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
