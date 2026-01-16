import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

// POST /api/applications/[id]/submit - Submit application for review
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

        // Check if already submitted or approved
        if (application.status !== 'draft' && application.status !== 'rejected') {
            return NextResponse.json(
                { error: `Cannot submit application with status: ${application.status}` },
                { status: 400 }
            )
        }

        // Validate required fields
        const validationErrors: string[] = []

        if (!application.name || application.name.length < 3) {
            validationErrors.push('Name must be at least 3 characters')
        }
        if (!application.description || application.description.length < 20) {
            validationErrors.push('Description must be at least 20 characters')
        }
        if (!application.website_url) {
            validationErrors.push('Website URL is required')
        }
        if (!application.privacy_policy_url) {
            validationErrors.push('Privacy Policy URL is required')
        }
        if (!application.terms_of_service_url) {
            validationErrors.push('Terms of Service URL is required')
        }
        if (!application.redirect_uris || application.redirect_uris.length === 0) {
            validationErrors.push('At least one redirect URI is required')
        }
        if (!application.requested_scopes || application.requested_scopes.length === 0) {
            validationErrors.push('At least one scope must be requested')
        }

        if (validationErrors.length > 0) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    validation_errors: validationErrors
                },
                { status: 400 }
            )
        }

        // Update application status
        const { data: updatedApp, error: updateError } = await admin
            .from('developer_applications')
            .update({
                status: 'submitted',
                submitted_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) throw updateError

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: developer.id,
            application_id: id,
            action: 'submitted_application',
            resource_type: 'application',
            resource_id: id,
            details: {
                requested_scopes: application.requested_scopes,
                environment: application.environment
            },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

        // Create notification for developer
        await admin.from('developer_notifications').insert({
            developer_id: developer.id,
            title: `Application "${application.name}" submitted for review`,
            message: 'Your application has been submitted and is pending review. This usually takes 1-3 business days.',
            type: 'info',
            category: 'app_status',
            action_url: `/dashboard/applications/${id}`,
            action_label: 'View Application'
        })

        return NextResponse.json({
            message: 'Application submitted for review',
            application: updatedApp,
            next_steps: [
                'Your application is now pending review',
                'Review typically takes 1-3 business days',
                'You will be notified when the review is complete',
                'Make sure your privacy policy and terms of service are accessible'
            ]
        })
    } catch (error: any) {
        console.error('Error submitting application:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
