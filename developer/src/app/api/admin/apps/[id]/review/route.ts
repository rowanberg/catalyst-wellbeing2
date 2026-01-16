import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin credentials not configured')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function getAdminUser() {
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
        .select('*, role')
        .eq('auth_user_id', user.id)
        .single()

    if (!account || !['admin', 'super_admin'].includes(account.role)) return null
    return account
}

// GET /api/admin/apps/[id]/review - Get app details for review
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminUser = await getAdminUser()
        if (!adminUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params
        const admin = getSupabaseAdmin()

        // Get full application details
        const { data: app, error } = await admin
            .from('developer_applications')
            .select(`
                *,
                developer:developer_accounts(
                    id, company_name, email, verified, created_at,
                    full_name, phone, website
                )
            `)
            .eq('id', id)
            .single()

        if (error || !app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Get review history
        const { data: reviews } = await admin
            .from('app_reviews')
            .select(`
                id,
                action,
                notes,
                created_at,
                reviewer:developer_accounts!reviewer_id(id, full_name, email)
            `)
            .eq('application_id', id)
            .order('created_at', { ascending: false })

        // Get usage statistics
        const { count: authCount } = await admin
            .from('oauth_authorization_codes')
            .select('*', { count: 'exact', head: true })
            .eq('application_id', id)

        const { count: tokenCount } = await admin
            .from('oauth_access_tokens')
            .select('*', { count: 'exact', head: true })
            .eq('application_id', id)

        const developer = Array.isArray(app.developer) ? app.developer[0] : app.developer

        return NextResponse.json({
            application: {
                ...app,
                developer: {
                    id: developer?.id,
                    company_name: developer?.company_name,
                    email: developer?.email,
                    verified: developer?.verified,
                    created_at: developer?.created_at,
                    full_name: developer?.full_name,
                    website: developer?.website
                }
            },
            review_history: reviews?.map(r => {
                const reviewer = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer
                return {
                    id: r.id,
                    action: r.action,
                    notes: r.notes,
                    created_at: r.created_at,
                    reviewer: {
                        name: reviewer?.full_name,
                        email: reviewer?.email
                    }
                }
            }) || [],
            statistics: {
                total_authorizations: authCount || 0,
                total_tokens: tokenCount || 0
            },
            checklist: {
                has_privacy_policy: !!app.privacy_policy_url,
                has_terms_of_service: !!app.terms_of_service_url,
                has_support_contact: !!app.support_email,
                has_logo: !!app.logo_url,
                has_description: app.description?.length > 50,
                developer_verified: developer?.verified || false
            }
        })
    } catch (error: any) {
        console.error('Admin review API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/admin/apps/[id]/review - Submit review action
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminUser = await getAdminUser()
        if (!adminUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()
        const { action, notes, approved_scopes } = body

        const validActions = ['approve', 'reject', 'request_changes', 'suspend', 'reinstate']
        if (!validActions.includes(action)) {
            return NextResponse.json({
                error: `Invalid action. Must be one of: ${validActions.join(', ')}`
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        // Get application
        const { data: app } = await admin
            .from('developer_applications')
            .select('*, developer:developer_accounts(id, email, full_name)')
            .eq('id', id)
            .single()

        if (!app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Determine new status based on action
        let newStatus: string
        switch (action) {
            case 'approve':
                newStatus = 'approved'
                break
            case 'reject':
                newStatus = 'rejected'
                break
            case 'request_changes':
                newStatus = 'changes_requested'
                break
            case 'suspend':
                newStatus = 'suspended'
                break
            case 'reinstate':
                newStatus = 'approved'
                break
            default:
                newStatus = app.status
        }

        // Update application
        const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString()
        }

        if (action === 'approve') {
            updateData.approved_at = new Date().toISOString()
            updateData.approved_by = adminUser.id
            if (approved_scopes) {
                updateData.allowed_scopes = approved_scopes
            }
        }

        if (action === 'reject') {
            updateData.rejected_at = new Date().toISOString()
            updateData.rejection_reason = notes
        }

        await admin
            .from('developer_applications')
            .update(updateData)
            .eq('id', id)

        // Create review record
        await admin.from('app_reviews').insert({
            application_id: id,
            reviewer_id: adminUser.id,
            action,
            notes,
            previous_status: app.status,
            new_status: newStatus
        })

        // Create notification for developer
        const developer = Array.isArray(app.developer) ? app.developer[0] : app.developer
        if (developer) {
            const notificationMessages: { [key: string]: { title: string, message: string, type: string } } = {
                approve: {
                    title: `"${app.name}" Approved!`,
                    message: 'Congratulations! Your application has been approved and is now live.',
                    type: 'success'
                },
                reject: {
                    title: `"${app.name}" Not Approved`,
                    message: `Your application was not approved. Reason: ${notes || 'See details in your dashboard.'}`,
                    type: 'error'
                },
                request_changes: {
                    title: `Changes Requested for "${app.name}"`,
                    message: notes || 'Please review the requested changes in your dashboard.',
                    type: 'warning'
                },
                suspend: {
                    title: `"${app.name}" Suspended`,
                    message: `Your application has been suspended. Reason: ${notes || 'Contact support for details.'}`,
                    type: 'error'
                },
                reinstate: {
                    title: `"${app.name}" Reinstated`,
                    message: 'Your application has been reinstated and is now active.',
                    type: 'success'
                }
            }

            const notification = notificationMessages[action]
            await admin.from('developer_notifications').insert({
                developer_id: developer.id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                category: 'app_review',
                action_url: `/dashboard/applications/${id}`,
                action_label: 'View Application'
            })
        }

        // Log admin activity
        await admin.from('admin_activity_logs').insert({
            admin_id: adminUser.id,
            action: `app_${action}`,
            resource_type: 'application',
            resource_id: id,
            details: { notes, previous_status: app.status, new_status: newStatus },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

        return NextResponse.json({
            success: true,
            application_id: id,
            action,
            previous_status: app.status,
            new_status: newStatus,
            message: `Application ${action}d successfully`
        })
    } catch (error: any) {
        console.error('Admin review action error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
