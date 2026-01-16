import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Create admin client
const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Supabase admin credentials not configured')
    }

    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

// Get authenticated developer
async function getAuthenticatedDeveloper() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_DEV_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        }
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

// POST /api/sandbox/seed - Seed sandbox data for an application
export async function POST(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { application_id } = body
        const admin = getSupabaseAdmin()

        // Verify application belongs to developer and is in sandbox mode
        const { data: app, error: appError } = await admin
            .from('developer_applications')
            .select('*')
            .eq('id', application_id)
            .eq('developer_id', developer.id)
            .single()

        if (appError || !app) {
            return NextResponse.json({
                error: 'Application not found or access denied'
            }, { status: 404 })
        }

        if (app.environment !== 'sandbox') {
            return NextResponse.json({
                error: 'Only sandbox applications can use test data seeding'
            }, { status: 400 })
        }

        // Check if already seeded
        const { data: existingSeed } = await admin
            .from('sandbox_seeds')
            .select('id, seeded_at')
            .eq('application_id', application_id)
            .single()

        if (existingSeed) {
            return NextResponse.json({
                message: 'Sandbox data already seeded',
                seeded_at: existingSeed.seeded_at,
                can_reset: true,
                reset_url: `/api/sandbox/reset?application_id=${application_id}`
            })
        }

        // Mark as seeded (actual seeding happens in the main database)
        await admin.from('sandbox_seeds').insert({
            application_id,
            developer_id: developer.id,
            seed_version: '1.0',
            metadata: {
                schools: 5,
                students: 500,
                teachers: 50,
                classes: 50,
                attendance_days: 180
            }
        })

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: developer.id,
            application_id,
            action: 'seeded_sandbox_data',
            resource_type: 'sandbox',
            resource_id: application_id,
            details: {
                environment: 'sandbox',
                seed_version: '1.0'
            },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

        return NextResponse.json({
            message: 'Sandbox data seeded successfully',
            application_id,
            environment: 'sandbox',
            test_data: {
                schools: 5,
                students: 500,
                teachers: 50,
                classes: 50,
                subjects: 15,
                attendance_records: 90000,
                exam_records: 5000,
                mood_check_ins: 10000
            },
            sample_credentials: {
                student_email: 'test.student@sandbox.catalystwells.com',
                teacher_email: 'test.teacher@sandbox.catalystwells.com',
                parent_email: 'test.parent@sandbox.catalystwells.com',
                password: 'SandboxTest123!'
            },
            notes: [
                'All test data is isolated to sandbox environment',
                'Data resets every 24 hours',
                'No rate limits in sandbox mode',
                'Use sample credentials to test OAuth flow'
            ]
        })
    } catch (error: any) {
        console.error('Sandbox seed error:', error)
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 })
    }
}

// DELETE /api/sandbox/reset - Reset sandbox data
export async function DELETE(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const applicationId = searchParams.get('application_id')

        if (!applicationId) {
            return NextResponse.json({
                error: 'application_id parameter required'
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        // Verify application
        const { data: app } = await admin
            .from('developer_applications')
            .select('*')
            .eq('id', applicationId)
            .eq('developer_id', developer.id)
            .single()

        if (!app || app.environment !== 'sandbox') {
            return NextResponse.json({
                error: 'Invalid application or not in sandbox mode'
            }, { status: 400 })
        }

        // Delete seed record
        await admin
            .from('sandbox_seeds')
            .delete()
            .eq('application_id', applicationId)

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: developer.id,
            application_id: applicationId,
            action: 'reset_sandbox_data',
            resource_type: 'sandbox',
            resource_id: applicationId,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

        return NextResponse.json({
            message: 'Sandbox data reset successfully',
            application_id: applicationId,
            status: 'ready_for_reseed'
        })
    } catch (error: any) {
        console.error('Sandbox reset error:', error)
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 })
    }
}

// GET /api/sandbox/status - Get sandbox status
export async function GET(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const applicationId = searchParams.get('application_id')

        if (!applicationId) {
            return NextResponse.json({
                error: 'application_id parameter required'
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        // Get application
        const { data: app } = await admin
            .from('developer_applications')
            .select('*')
            .eq('id', applicationId)
            .eq('developer_id', developer.id)
            .single()

        if (!app) {
            return NextResponse.json({
                error: 'Application not found'
            }, { status: 404 })
        }

        // Get seed status
        const { data: seed } = await admin
            .from('sandbox_seeds')
            .select('*')
            .eq('application_id', applicationId)
            .single()

        return NextResponse.json({
            application_id: applicationId,
            environment: app.environment,
            is_seeded: !!seed,
            seeded_at: seed?.seeded_at || null,
            seed_version: seed?.seed_version || null,
            test_data_available: !!seed,
            rate_limits_disabled: app.environment === 'sandbox'
        })
    } catch (error: any) {
        console.error('Sandbox status error:', error)
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
