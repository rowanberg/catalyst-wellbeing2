import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

// GET /api/oauth/app-info?client_id=<client_id>
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const clientId = searchParams.get('client_id')

        if (!clientId) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'client_id is required'
            }, { status: 400 })
        }

        // Fetch application details
        const { data: app, error: appError } = await supabaseAdmin
            .from('oauth_applications')
            .select('*')
            .eq('client_id', clientId)
            .eq('status', 'active')
            .single()

        if (appError || !app) {
            return NextResponse.json({
                error: 'invalid_client',
                error_description: 'Application not found or inactive'
            }, { status: 404 })
        }

        // Return public app information (don't expose client_secret)
        return NextResponse.json({
            client_id: app.client_id,
            name: app.name,
            description: app.description,
            logo_url: app.logo_url,
            website_url: app.website_url,
            privacy_policy_url: app.privacy_policy_url,
            terms_of_service_url: app.terms_of_service_url,
            developer_name: app.developer_name,
            developer_website: app.developer_website,
            is_verified: app.is_verified,
            is_first_party: app.is_first_party,
            trust_level: app.trust_level,
            allowed_scopes: app.allowed_scopes
        })

    } catch (error: any) {
        console.error('Error fetching app info:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: 'Internal server error'
        }, { status: 500 })
    }
}
