import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin credentials not configured')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const getMainSupabase = () => {
    const url = process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin credentials not configured')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function getAuthenticatedDeveloper() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_DEV_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        { cookies: { getAll() { return cookieStore.getAll() } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const admin = getSupabaseAdmin()
    const { data: account } = await admin
        .from('developer_accounts')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

    return account
}

// Test event payloads
const EVENT_PAYLOADS: { [key: string]: () => any } = {
    'attendance.marked': () => ({
        student_id: crypto.randomUUID(),
        student_name: 'Test Student',
        date: new Date().toISOString().split('T')[0],
        status: ['present', 'absent', 'late'][Math.floor(Math.random() * 3)],
        check_in_time: '08:30:00',
        marked_by: 'Test Teacher'
    }),
    'attendance.absent': () => ({
        student_id: crypto.randomUUID(),
        student_name: 'Test Student',
        date: new Date().toISOString().split('T')[0],
        consecutive_absences: Math.floor(Math.random() * 5) + 1,
        notified_parents: true
    }),
    'exam.results.published': () => ({
        exam_id: crypto.randomUUID(),
        exam_name: 'Mid-Term Examination',
        class_id: crypto.randomUUID(),
        class_name: 'Grade 10-A',
        subject: 'Mathematics',
        average_score: 75.5,
        pass_rate: 85.0,
        published_at: new Date().toISOString()
    }),
    'assignment.submitted': () => ({
        assignment_id: crypto.randomUUID(),
        assignment_title: 'Test Assignment',
        student_id: crypto.randomUUID(),
        student_name: 'Test Student',
        submitted_at: new Date().toISOString(),
        is_late: Math.random() > 0.8
    }),
    'assignment.graded': () => ({
        assignment_id: crypto.randomUUID(),
        assignment_title: 'Test Assignment',
        student_id: crypto.randomUUID(),
        student_name: 'Test Student',
        marks_obtained: Math.floor(Math.random() * 100),
        max_marks: 100,
        graded_by: 'Test Teacher',
        feedback: 'Good work!'
    }),
    'wellness.alert': () => ({
        alert_id: crypto.randomUUID(),
        student_id: crypto.randomUUID(),
        alert_type: ['mood_decline', 'stress_increase', 'engagement_drop'][Math.floor(Math.random() * 3)],
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        message: 'Wellness alert triggered for test student',
        recommended_action: 'Check in with student'
    }),
    'timetable.updated': () => ({
        class_id: crypto.randomUUID(),
        class_name: 'Grade 10-A',
        effective_date: new Date().toISOString().split('T')[0],
        changes: ['Period 3: Math → Science', 'Period 5: Art → Music'],
        updated_by: 'Admin'
    }),
    'student.enrolled': () => ({
        student_id: crypto.randomUUID(),
        student_name: 'New Test Student',
        enrollment_number: 'ENR' + Math.floor(Math.random() * 10000),
        class_id: crypto.randomUUID(),
        class_name: 'Grade 10-A',
        enrolled_at: new Date().toISOString()
    }),
    'parent.linked': () => ({
        parent_id: crypto.randomUUID(),
        parent_name: 'Test Parent',
        student_id: crypto.randomUUID(),
        student_name: 'Test Student',
        relationship: 'mother',
        linked_at: new Date().toISOString()
    })
}

// POST /api/sandbox/trigger-event - Trigger a test webhook event
export async function POST(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { application_id, event_type, custom_payload } = body

        if (!application_id || !event_type) {
            return NextResponse.json({
                error: 'application_id and event_type are required'
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()
        const mainDb = getMainSupabase()

        // Verify application belongs to developer and is in sandbox mode
        const { data: app } = await admin
            .from('developer_applications')
            .select('*')
            .eq('id', application_id)
            .eq('developer_id', developer.id)
            .single()

        if (!app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        if (app.environment !== 'sandbox') {
            return NextResponse.json({
                error: 'Event triggering is only available in sandbox mode'
            }, { status: 400 })
        }

        // Get event payload
        const payloadGenerator = EVENT_PAYLOADS[event_type]
        if (!payloadGenerator) {
            return NextResponse.json({
                error: 'Unknown event type',
                available_events: Object.keys(EVENT_PAYLOADS)
            }, { status: 400 })
        }

        const eventPayload = custom_payload || payloadGenerator()

        // Create webhook event in main database
        const eventId = crypto.randomUUID()
        const { error: eventError } = await mainDb
            .from('webhook_events')
            .insert({
                id: eventId,
                application_id,
                event_type,
                payload: eventPayload,
                delivered: false,
                retry_count: 0
            })

        if (eventError) throw eventError

        // Get webhooks subscribed to this event
        const { data: webhooks } = await admin
            .from('application_webhooks')
            .select('id, url, events')
            .eq('application_id', application_id)
            .eq('is_active', true)

        const matchingWebhooks = webhooks?.filter(w =>
            w.events?.includes(event_type) || w.events?.includes('*')
        ) || []

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: developer.id,
            application_id,
            action: 'triggered_test_event',
            resource_type: 'webhook_event',
            resource_id: eventId,
            details: { event_type },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

        return NextResponse.json({
            event_id: eventId,
            event_type,
            payload: eventPayload,
            webhooks_to_notify: matchingWebhooks.length,
            webhook_urls: matchingWebhooks.map(w => w.url),
            message: `Test event "${event_type}" triggered successfully.`,
            note: 'The webhook worker will deliver this event to your registered webhooks shortly.'
        })
    } catch (error: any) {
        console.error('Trigger event error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET /api/sandbox/trigger-event - List available event types
export async function GET() {
    return NextResponse.json({
        available_events: Object.keys(EVENT_PAYLOADS).map(event => ({
            event_type: event,
            sample_payload: EVENT_PAYLOADS[event]()
        }))
    })
}
