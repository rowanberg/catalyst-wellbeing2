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

// Rate limit tiers
const RATE_LIMITS: { [tier: string]: { requests_per_minute: number; requests_per_day: number } } = {
    free: { requests_per_minute: 60, requests_per_day: 1000 },
    starter: { requests_per_minute: 120, requests_per_day: 10000 },
    growth: { requests_per_minute: 300, requests_per_day: 50000 },
    enterprise: { requests_per_minute: 1000, requests_per_day: 500000 }
}

// GET /api/analytics/rate-limits - Get rate limit status
export async function GET(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const applicationId = searchParams.get('application_id')

        const admin = getSupabaseAdmin()

        // Get developer's tier
        const tier = developer.subscription_tier || 'free'
        const limits = RATE_LIMITS[tier] || RATE_LIMITS.free

        // Get app IDs
        let appIds: string[] = []
        if (applicationId) {
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
            const { data: apps } = await admin
                .from('developer_applications')
                .select('id')
                .eq('developer_id', developer.id)
            appIds = apps?.map(a => a.id) || []
        }

        const now = new Date()
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)

        // Count requests in last minute
        const { count: requestsLastMinute } = await admin
            .from('api_request_logs')
            .select('*', { count: 'exact', head: true })
            .in('application_id', appIds)
            .gte('created_at', oneMinuteAgo.toISOString())

        // Count requests today
        const { count: requestsToday } = await admin
            .from('api_request_logs')
            .select('*', { count: 'exact', head: true })
            .in('application_id', appIds)
            .gte('created_at', startOfDay.toISOString())

        // Calculate usage percentages
        const minuteUsage = ((requestsLastMinute || 0) / limits.requests_per_minute) * 100
        const dailyUsage = ((requestsToday || 0) / limits.requests_per_day) * 100

        // Get hourly breakdown
        const hourlyBreakdown: { hour: string; count: number }[] = []
        for (let h = 0; h <= now.getHours(); h++) {
            const hourStart = new Date(startOfDay.getTime() + h * 60 * 60 * 1000)
            const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)

            const { count } = await admin
                .from('api_request_logs')
                .select('*', { count: 'exact', head: true })
                .in('application_id', appIds)
                .gte('created_at', hourStart.toISOString())
                .lt('created_at', hourEnd.toISOString())

            hourlyBreakdown.push({
                hour: `${h.toString().padStart(2, '0')}:00`,
                count: count || 0
            })
        }

        // Check for rate limit events in last 24 hours
        const { count: rateLimitEvents } = await admin
            .from('api_request_logs')
            .select('*', { count: 'exact', head: true })
            .in('application_id', appIds)
            .eq('response_status', 429)
            .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())

        // Estimate when limits reset
        const minuteReset = new Date(now.getTime() + (60 * 1000))
        const dailyReset = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

        return NextResponse.json({
            tier,
            limits: {
                requests_per_minute: limits.requests_per_minute,
                requests_per_day: limits.requests_per_day
            },
            current_usage: {
                requests_last_minute: requestsLastMinute || 0,
                requests_today: requestsToday || 0,
                minute_usage_percent: Math.min(100, Math.round(minuteUsage * 10) / 10),
                daily_usage_percent: Math.min(100, Math.round(dailyUsage * 10) / 10)
            },
            status: {
                minute_limit_approaching: minuteUsage > 80,
                daily_limit_approaching: dailyUsage > 80,
                is_rate_limited: minuteUsage >= 100 || dailyUsage >= 100
            },
            resets: {
                minute_resets_at: minuteReset.toISOString(),
                daily_resets_at: dailyReset.toISOString()
            },
            rate_limit_events_24h: rateLimitEvents || 0,
            hourly_breakdown: hourlyBreakdown,
            recommendations: [
                minuteUsage > 80 ? 'Consider implementing request queuing to stay under rate limits.' : null,
                dailyUsage > 80 ? 'Approaching daily limit. Consider upgrading your plan or optimizing API usage.' : null,
                rateLimitEvents ? 'Rate limiting occurred in the last 24 hours. Implement exponential backoff.' : null
            ].filter(Boolean)
        })
    } catch (error: any) {
        console.error('Rate limits API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
