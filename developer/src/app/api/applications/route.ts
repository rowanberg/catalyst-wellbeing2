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

// Generate client ID
function generateClientId(): string {
    return `cw_app_${crypto.randomBytes(16).toString('hex')}`
}

// Generate client secret
function generateClientSecret(): string {
    return `cw_sec_${crypto.randomBytes(32).toString('hex')}`
}

// Hash secret
function hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex')
}

// GET /api/applications - List all applications
export async function GET(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const admin = getSupabaseAdmin()
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        let query = admin
            .from('developer_applications')
            .select('*', { count: 'exact' })
            .eq('developer_id', developer.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }

        const { data: applications, error, count } = await query

        if (error) throw error

        return NextResponse.json({
            applications,
            total: count,
            limit,
            offset
        })
    } catch (error: any) {
        console.error('Error fetching applications:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            name,
            description,
            short_description,
            category,
            website_url,
            privacy_policy_url,
            terms_of_service_url,
            support_url,
            documentation_url,
            redirect_uris,
            requested_scopes,
            environment,
            logo_url,
            banner_url
        } = body

        // Validation
        if (!name || name.length < 3) {
            return NextResponse.json(
                { error: 'Name must be at least 3 characters' },
                { status: 400 }
            )
        }

        if (!description || description.length < 20) {
            return NextResponse.json(
                { error: 'Description must be at least 20 characters' },
                { status: 400 }
            )
        }

        if (!website_url || !privacy_policy_url || !terms_of_service_url) {
            return NextResponse.json(
                { error: 'Website, Privacy Policy, and Terms of Service URLs are required' },
                { status: 400 }
            )
        }

        if (!redirect_uris || redirect_uris.length === 0) {
            return NextResponse.json(
                { error: 'At least one redirect URI is required' },
                { status: 400 }
            )
        }

        const admin = getSupabaseAdmin()

        // Generate credentials
        const clientId = generateClientId()
        const clientSecret = generateClientSecret()
        const clientSecretHash = hashSecret(clientSecret)

        // Create application
        const { data: application, error } = await admin
            .from('developer_applications')
            .insert({
                developer_id: developer.id,
                name,
                description,
                short_description: short_description || null,
                category: category || null,
                website_url,
                privacy_policy_url,
                terms_of_service_url,
                support_url: support_url || null,
                documentation_url: documentation_url || null,
                redirect_uris: redirect_uris || [],
                requested_scopes: requested_scopes || ['profile.read'],
                allowed_scopes: [],
                environment: environment || 'sandbox',
                logo_url: logo_url || null,
                banner_url: banner_url || null,
                client_id: clientId,
                client_secret_hash: clientSecretHash,
                status: 'draft'
            })
            .select()
            .single()

        if (error) throw error

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: developer.id,
            application_id: application.id,
            action: 'created_application',
            resource_type: 'application',
            resource_id: application.id,
            details: { name },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

        // Return with client secret (only shown once!)
        return NextResponse.json({
            application,
            credentials: {
                client_id: clientId,
                client_secret: clientSecret, // Only returned on creation
                warning: 'Save this client secret - it will not be shown again!'
            }
        }, { status: 201 })
    } catch (error: any) {
        console.error('Error creating application:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
