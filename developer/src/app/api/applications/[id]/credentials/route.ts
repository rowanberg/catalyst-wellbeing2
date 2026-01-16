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

// Generate client secret
function generateClientSecret(): string {
    return `cw_sec_${crypto.randomBytes(32).toString('hex')}`
}

// Hash secret
function hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex')
}

// POST /api/applications/[id]/credentials - Rotate credentials
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = params
        const body = await request.json()
        const { rotate_type, grace_period_hours = 24 } = body
        const admin = getSupabaseAdmin()

        // Get application
        const { data: application, error: fetchError } = await admin
            .from('developer_applications')
            .select('*')
            .eq('id', id)
            .eq('developer_id', developer.id)
            .single()

        if (fetchError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        let response: any = {
            message: 'Credentials rotated successfully'
        }

        if (rotate_type === 'client_secret' || rotate_type === 'all') {
            // Generate new secret
            const newSecret = generateClientSecret()
            const newSecretHash = hashSecret(newSecret)

            // Calculate grace period expiry
            const graceExpiry = new Date()
            graceExpiry.setHours(graceExpiry.getHours() + grace_period_hours)

            // Update with both old and new secret during grace period
            await admin
                .from('developer_applications')
                .update({
                    client_secret_hash: newSecretHash,
                    previous_client_secret_hash: application.client_secret_hash,
                    previous_secret_expires_at: graceExpiry.toISOString(),
                    client_secret_rotated_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            response.client_secret = newSecret
            response.secret_warning = 'Save this client secret - it will not be shown again!'
            response.grace_period = {
                hours: grace_period_hours,
                expires_at: graceExpiry.toISOString(),
                message: `Your old secret will continue to work until ${graceExpiry.toISOString()}`
            }
        }

        if (rotate_type === 'client_id' || rotate_type === 'all') {
            // Generate new client ID
            const newClientId = `cw_app_${crypto.randomBytes(16).toString('hex')}`

            await admin
                .from('developer_applications')
                .update({
                    client_id: newClientId,
                    client_id_rotated_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            response.client_id = newClientId
            response.client_id_warning = 'Client ID has been changed. Update your application configuration.'
        }

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: developer.id,
            application_id: id,
            action: 'rotated_credentials',
            resource_type: 'application',
            resource_id: id,
            details: {
                rotate_type,
                grace_period_hours
            },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

        // Create notification
        await admin.from('developer_notifications').insert({
            developer_id: developer.id,
            title: `Credentials rotated for "${application.name}"`,
            message: rotate_type === 'all'
                ? 'Both client ID and secret have been rotated. Update your application configuration.'
                : `Your ${rotate_type.replace('_', ' ')} has been rotated.`,
            type: 'warning',
            category: 'security',
            action_url: `/dashboard/applications/${id}/settings`,
            action_label: 'View Settings'
        })

        return NextResponse.json(response)
    } catch (error: any) {
        console.error('Error rotating credentials:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET /api/applications/[id]/credentials - Get credentials info (no secrets)
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = params
        const admin = getSupabaseAdmin()

        const { data: application, error } = await admin
            .from('developer_applications')
            .select(`
                id,
                client_id,
                client_secret_rotated_at,
                client_id_rotated_at,
                previous_secret_expires_at,
                environment
            `)
            .eq('id', id)
            .eq('developer_id', developer.id)
            .single()

        if (error || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        const now = new Date()
        const graceActive = application.previous_secret_expires_at
            ? new Date(application.previous_secret_expires_at) > now
            : false

        return NextResponse.json({
            client_id: application.client_id,
            client_secret: '••••••••••••••••', // Masked
            environment: application.environment,
            client_id_rotated_at: application.client_id_rotated_at,
            client_secret_rotated_at: application.client_secret_rotated_at,
            grace_period_active: graceActive,
            grace_period_expires_at: graceActive ? application.previous_secret_expires_at : null
        })
    } catch (error: any) {
        console.error('Error fetching credentials:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
