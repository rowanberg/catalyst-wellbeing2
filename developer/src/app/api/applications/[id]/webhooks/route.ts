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

// Generate webhook signing secret
function generateWebhookSecret(): string {
    return `whsec_${crypto.randomBytes(24).toString('hex')}`
}

// GET /api/applications/[id]/webhooks - List webhooks
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: appId } = params
        const admin = getSupabaseAdmin()

        // Verify app ownership
        const { data: app } = await admin
            .from('developer_applications')
            .select('id')
            .eq('id', appId)
            .eq('developer_id', developer.id)
            .single()

        if (!app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Get webhooks
        const { data: webhooks, error } = await admin
            .from('application_webhooks')
            .select('*')
            .eq('application_id', appId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ webhooks })
    } catch (error: any) {
        console.error('Error fetching webhooks:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/applications/[id]/webhooks - Create webhook
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: appId } = params
        const body = await request.json()
        const { url, events, description } = body
        const admin = getSupabaseAdmin()

        // Verify app ownership
        const { data: app } = await admin
            .from('developer_applications')
            .select('id, name')
            .eq('id', appId)
            .eq('developer_id', developer.id)
            .single()

        if (!app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Validate URL
        if (!url) {
            return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 })
        }

        try {
            new URL(url)
        } catch {
            return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 })
        }

        // Validate events
        const validEvents = [
            'student.created',
            'student.updated',
            'student.deleted',
            'attendance.marked',
            'grade.published',
            'assessment.created',
            'assessment.submitted',
            'school.linked',
            'school.unlinked',
            'consent.granted',
            'consent.revoked',
            'app.approved',
            'app.rejected',
            'app.suspended'
        ]

        const requestedEvents = events || ['*']
        const invalidEvents = requestedEvents.filter((e: string) => e !== '*' && !validEvents.includes(e))
        if (invalidEvents.length > 0) {
            return NextResponse.json({
                error: 'Invalid events',
                invalid_events: invalidEvents,
                valid_events: validEvents
            }, { status: 400 })
        }

        // Generate signing secret
        const signingSecret = generateWebhookSecret()

        // Create webhook
        const { data: webhook, error } = await admin
            .from('application_webhooks')
            .insert({
                application_id: appId,
                url,
                events: requestedEvents,
                description: description || null,
                signing_secret: signingSecret,
                is_active: true,
                status: 'active'
            })
            .select()
            .single()

        if (error) throw error

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: developer.id,
            application_id: appId,
            action: 'created_webhook',
            resource_type: 'webhook',
            resource_id: webhook.id,
            details: { url, events: requestedEvents }
        })

        return NextResponse.json({
            webhook: {
                ...webhook,
                signing_secret: signingSecret // Only returned on creation
            },
            warning: 'Save the signing secret - it will not be shown again!'
        }, { status: 201 })
    } catch (error: any) {
        console.error('Error creating webhook:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

// PATCH /api/applications/[id]/webhooks - Update webhook
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: appId } = params
        const body = await request.json()
        const { webhook_id, url, events, is_active, description } = body
        const admin = getSupabaseAdmin()

        if (!webhook_id) {
            return NextResponse.json({ error: 'webhook_id is required' }, { status: 400 })
        }

        // Verify app ownership
        const { data: app } = await admin
            .from('developer_applications')
            .select('id')
            .eq('id', appId)
            .eq('developer_id', developer.id)
            .single()

        if (!app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Build update object
        const updates: any = { updated_at: new Date().toISOString() }
        if (url !== undefined) {
            try {
                new URL(url)
                updates.url = url
            } catch {
                return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 })
            }
        }
        if (events !== undefined) updates.events = events
        if (is_active !== undefined) updates.is_active = is_active
        if (description !== undefined) updates.description = description

        // Update webhook
        const { data: webhook, error } = await admin
            .from('application_webhooks')
            .update(updates)
            .eq('id', webhook_id)
            .eq('application_id', appId)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ webhook })
    } catch (error: any) {
        console.error('Error updating webhook:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/applications/[id]/webhooks - Delete webhook
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: appId } = params
        const { searchParams } = new URL(request.url)
        const webhookId = searchParams.get('webhook_id')
        const admin = getSupabaseAdmin()

        if (!webhookId) {
            return NextResponse.json({ error: 'webhook_id is required' }, { status: 400 })
        }

        // Verify app ownership
        const { data: app } = await admin
            .from('developer_applications')
            .select('id')
            .eq('id', appId)
            .eq('developer_id', developer.id)
            .single()

        if (!app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Delete webhook
        const { error } = await admin
            .from('application_webhooks')
            .delete()
            .eq('id', webhookId)
            .eq('application_id', appId)

        if (error) throw error

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: developer.id,
            application_id: appId,
            action: 'deleted_webhook',
            resource_type: 'webhook',
            resource_id: webhookId
        })

        return NextResponse.json({ message: 'Webhook deleted successfully' })
    } catch (error: any) {
        console.error('Error deleting webhook:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
