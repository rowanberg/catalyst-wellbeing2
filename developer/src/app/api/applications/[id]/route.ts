import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Create admin client
const getSupabaseAdmin = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// Get authenticated developer
async function getAuthenticatedDeveloper() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

// GET /api/applications/[id] - Get single application
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const admin = getSupabaseAdmin()

        const { data: application, error } = await admin
            .from('developer_applications')
            .select(`
                *,
                webhooks:application_webhooks(*),
                api_keys:application_api_keys(id, name, last_four, created_at, last_used_at, is_active)
            `)
            .eq('id', id)
            .eq('developer_id', developer.id)
            .single()

        if (error) throw error
        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Get analytics summary
        const { data: analytics } = await admin
            .from('application_analytics')
            .select('*')
            .eq('application_id', id)
            .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('date', { ascending: false })

        // Calculate totals
        const totalApiCalls = analytics?.reduce((sum, a) => sum + (a.api_calls || 0), 0) || 0
        const totalErrors = analytics?.reduce((sum, a) => sum + (a.error_count || 0), 0) || 0

        return NextResponse.json({
            application,
            analytics: {
                last_30_days: {
                    api_calls: totalApiCalls,
                    errors: totalErrors,
                    error_rate: totalApiCalls > 0 ? (totalErrors / totalApiCalls * 100).toFixed(2) : 0
                },
                daily: analytics || []
            }
        })
    } catch (error: any) {
        console.error('Error fetching application:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

// PATCH /api/applications/[id] - Update application
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const admin = getSupabaseAdmin()

        // Check ownership
        const { data: existing } = await admin
            .from('developer_applications')
            .select('id, status, developer_id')
            .eq('id', id)
            .eq('developer_id', developer.id)
            .single()

        if (!existing) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Fields that can be updated
        const allowedFields = [
            'name',
            'description',
            'short_description',
            'category',
            'website_url',
            'privacy_policy_url',
            'terms_of_service_url',
            'support_url',
            'documentation_url',
            'redirect_uris',
            'requested_scopes',
            'logo_url',
            'banner_url'
        ]

        // Filter only allowed fields
        const updates: any = {}
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field]
            }
        }

        updates.updated_at = new Date().toISOString()

        // Update application
        const { data: application, error } = await admin
            .from('developer_applications')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: developer.id,
            application_id: id,
            action: 'updated_application',
            resource_type: 'application',
            resource_id: id,
            details: { updated_fields: Object.keys(updates) },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

        return NextResponse.json({ application })
    } catch (error: any) {
        console.error('Error updating application:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/applications/[id] - Delete application
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const admin = getSupabaseAdmin()

        // Check ownership
        const { data: existing } = await admin
            .from('developer_applications')
            .select('id, name, status, developer_id')
            .eq('id', id)
            .eq('developer_id', developer.id)
            .single()

        if (!existing) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Soft delete - set deleted_at and recovery_deadline
        const recoveryDeadline = new Date()
        recoveryDeadline.setDate(recoveryDeadline.getDate() + 30)

        const { error } = await admin
            .from('developer_applications')
            .update({
                deleted_at: new Date().toISOString(),
                recovery_deadline: recoveryDeadline.toISOString(),
                status: 'deleted'
            })
            .eq('id', id)

        if (error) throw error

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: developer.id,
            application_id: id,
            action: 'deleted_application',
            resource_type: 'application',
            resource_id: id,
            details: { name: existing.name, recovery_deadline: recoveryDeadline },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

        // Create notification
        await admin.from('developer_notifications').insert({
            developer_id: developer.id,
            title: `Application "${existing.name}" deleted`,
            message: `Your application has been deleted. It can be recovered within 30 days.`,
            type: 'warning',
            category: 'app_status',
            action_url: `/dashboard/applications/${id}/recover`,
            action_label: 'Recover App'
        })

        return NextResponse.json({
            message: 'Application deleted',
            recovery_deadline: recoveryDeadline
        })
    } catch (error: any) {
        console.error('Error deleting application:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
