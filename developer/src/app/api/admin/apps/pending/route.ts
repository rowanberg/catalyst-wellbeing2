import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Create admin client
const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) throw new Error('Supabase admin credentials not configured')

    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Check if user is admin
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

    if (!account || !['admin', 'super_admin'].includes(account.role)) {
        return null
    }

    return account
}

// GET /api/admin/apps/pending - Get pending applications for review
export async function GET(request: NextRequest) {
    try {
        const adminUser = await getAdminUser()
        if (!adminUser) {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'pending_review'
        const category = searchParams.get('category')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const admin = getSupabaseAdmin()

        let query = admin
            .from('developer_applications')
            .select(`
                id,
                name,
                description,
                category,
                app_type,
                logo_url,
                website_url,
                privacy_policy_url,
                terms_of_service_url,
                requested_scopes,
                status,
                submitted_at,
                created_at,
                developer:developer_accounts(id, company_name, email, verified)
            `, { count: 'exact' })
            .eq('status', status)
            .order('submitted_at', { ascending: true })
            .range(offset, offset + limit - 1)

        if (category) {
            query = query.eq('category', category)
        }

        const { data: apps, count, error } = await query

        if (error) throw error

        // Get review history counts
        const appIds = apps?.map(a => a.id) || []
        const { data: reviewCounts } = await admin
            .from('app_reviews')
            .select('application_id')
            .in('application_id', appIds)

        const reviewCountMap: { [key: string]: number } = {}
        reviewCounts?.forEach(r => {
            reviewCountMap[r.application_id] = (reviewCountMap[r.application_id] || 0) + 1
        })

        return NextResponse.json({
            total: count || 0,
            offset,
            limit,
            apps: apps?.map(app => {
                const developer = Array.isArray(app.developer) ? app.developer[0] : app.developer
                return {
                    id: app.id,
                    name: app.name,
                    description: app.description,
                    category: app.category,
                    app_type: app.app_type,
                    logo_url: app.logo_url,
                    website_url: app.website_url,
                    privacy_policy_url: app.privacy_policy_url,
                    terms_of_service_url: app.terms_of_service_url,
                    requested_scopes: app.requested_scopes,
                    status: app.status,
                    submitted_at: app.submitted_at,
                    created_at: app.created_at,
                    developer: {
                        id: developer?.id,
                        company_name: developer?.company_name,
                        email: developer?.email,
                        verified: developer?.verified
                    },
                    review_count: reviewCountMap[app.id] || 0,
                    days_pending: Math.floor((Date.now() - new Date(app.submitted_at).getTime()) / (1000 * 60 * 60 * 24))
                }
            })
        })
    } catch (error: any) {
        console.error('Admin pending apps error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
