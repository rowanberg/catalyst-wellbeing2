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

// GET /api/analytics/errors - Get error logs
export async function GET(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const applicationId = searchParams.get('application_id')
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')
        const errorCode = searchParams.get('error_code')
        const endpoint = searchParams.get('endpoint')
        const limit = parseInt(searchParams.get('limit') || '100')

        const admin = getSupabaseAdmin()

        // Build query
        let appIds: string[] = []
        if (applicationId) {
            // Verify ownership
            const { data: app } = await admin
                .from('developer_applications')
                .select('id')
                .eq('id', applicationId)
                .eq('developer_id', developer.id)
                .single()

            if (!app) {
                return NextResponse.json({ error: 'Application not found' }, { status: 404 })
            }
            appIds = [applicationId]
        } else {
            // Get all developer's apps
            const { data: apps } = await admin
                .from('developer_applications')
                .select('id')
                .eq('developer_id', developer.id)
            appIds = apps?.map(a => a.id) || []
        }

        let query = admin
            .from('api_request_logs')
            .select('*')
            .in('application_id', appIds)
            .gte('response_status', 400)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (startDate) {
            query = query.gte('created_at', startDate)
        }
        if (endDate) {
            query = query.lte('created_at', endDate)
        }
        if (errorCode) {
            query = query.eq('error_code', errorCode)
        }
        if (endpoint) {
            query = query.ilike('endpoint', `%${endpoint}%`)
        }

        const { data: errors, error } = await query

        if (error) throw error

        // Group by error code
        const byCode: { [key: string]: number } = {}
        errors?.forEach(e => {
            const code = e.error_code || `HTTP_${e.response_status}`
            byCode[code] = (byCode[code] || 0) + 1
        })

        // Group by endpoint
        const byEndpoint: { [key: string]: number } = {}
        errors?.forEach(e => {
            byEndpoint[e.endpoint] = (byEndpoint[e.endpoint] || 0) + 1
        })

        // Group by status code
        const byStatus: { [key: number]: number } = {}
        errors?.forEach(e => {
            byStatus[e.response_status] = (byStatus[e.response_status] || 0) + 1
        })

        // Calculate error rate
        const { count: totalRequests } = await admin
            .from('api_request_logs')
            .select('*', { count: 'exact', head: true })
            .in('application_id', appIds)
            .gte('created_at', startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        const errorRate = totalRequests
            ? ((errors?.length || 0) / totalRequests * 100).toFixed(2)
            : '0'

        return NextResponse.json({
            total_errors: errors?.length || 0,
            total_requests: totalRequests || 0,
            error_rate_percent: parseFloat(errorRate),
            summary: {
                by_error_code: byCode,
                by_endpoint: byEndpoint,
                by_status_code: byStatus
            },
            errors: errors?.map(e => ({
                id: e.id,
                endpoint: e.endpoint,
                method: e.method,
                status_code: e.response_status,
                error_code: e.error_code,
                error_message: e.error_message,
                request_id: e.request_id,
                user_agent: e.user_agent,
                ip_address: e.ip_address,
                response_time_ms: e.response_time_ms,
                timestamp: e.created_at
            })) || [],
            recommendations: generateRecommendations(byCode, byStatus)
        })
    } catch (error: any) {
        console.error('Error logs API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

function generateRecommendations(
    byCode: { [key: string]: number },
    byStatus: { [key: number]: number }
): string[] {
    const recommendations: string[] = []

    // Check for common issues
    if (byStatus[401] > 5) {
        recommendations.push('High 401 errors detected. Check your token refresh logic and ensure tokens are valid before making requests.')
    }
    if (byStatus[403] > 5) {
        recommendations.push('Multiple 403 errors. Verify your application has the required scopes for the endpoints being called.')
    }
    if (byStatus[429] > 0) {
        recommendations.push('Rate limiting detected. Consider implementing request batching or caching to reduce API calls.')
    }
    if (byStatus[500] > 0) {
        recommendations.push('Server errors (500) detected. These may be temporary - implement retry logic with exponential backoff.')
    }
    if (byCode['invalid_token'] > 0) {
        recommendations.push('Invalid token errors. Ensure you\'re using the correct token type and refreshing before expiry.')
    }
    if (byCode['insufficient_scope'] > 0) {
        recommendations.push('Scope errors detected. Request additional permissions during OAuth authorization.')
    }

    if (recommendations.length === 0) {
        recommendations.push('No common issues detected. Keep monitoring for any emerging patterns.')
    }

    return recommendations
}
