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

// POST /api/playground/execute - Execute API request in playground
export async function POST(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            application_id,
            method,
            endpoint,
            headers: customHeaders,
            body: requestBody,
            use_sandbox
        } = body

        if (!method || !endpoint) {
            return NextResponse.json({
                error: 'method and endpoint are required'
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        // Get application
        let accessToken: string | null = null
        if (application_id) {
            const { data: app } = await admin
                .from('developer_applications')
                .select('*')
                .eq('id', application_id)
                .eq('developer_id', developer.id)
                .single()

            if (!app) {
                return NextResponse.json({ error: 'Application not found' }, { status: 404 })
            }

            // Get or create sandbox token
            if (use_sandbox !== false) {
                const { data: existingToken } = await admin
                    .from('playground_tokens')
                    .select('access_token, expires_at')
                    .eq('application_id', application_id)
                    .eq('developer_id', developer.id)
                    .gt('expires_at', new Date().toISOString())
                    .single()

                if (existingToken) {
                    accessToken = existingToken.access_token
                } else {
                    // Generate sandbox token
                    const jwt = require('jsonwebtoken')
                    const secret = process.env.JWT_SECRET || 'dev-secret'

                    accessToken = jwt.sign(
                        {
                            sub: developer.id,
                            app_id: application_id,
                            scopes: ['*'], // Full access for playground
                            iat: Math.floor(Date.now() / 1000),
                            exp: Math.floor(Date.now() / 1000) + 3600,
                            type: 'playground'
                        },
                        secret
                    )

                    await admin.from('playground_tokens').insert({
                        application_id,
                        developer_id: developer.id,
                        access_token: accessToken,
                        expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
                    })
                }
            }
        }

        // Determine base URL
        const baseUrl = use_sandbox !== false
            ? (process.env.NEXT_PUBLIC_SANDBOX_API_URL || 'http://localhost:4000')
            : (process.env.NEXT_PUBLIC_PRODUCTION_API_URL || 'http://localhost:4000')

        const url = endpoint.startsWith('http')
            ? endpoint
            : `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`

        // Prepare headers
        const requestHeaders: { [key: string]: string } = {
            'Content-Type': 'application/json',
            'User-Agent': 'CatalystWells-Playground/1.0',
            ...customHeaders
        }

        if (accessToken && !requestHeaders['Authorization']) {
            requestHeaders['Authorization'] = `Bearer ${accessToken}`
        }

        // Execute request
        const startTime = Date.now()
        let response: Response
        let responseBody: any
        let responseError: string | null = null

        try {
            const fetchOptions: RequestInit = {
                method,
                headers: requestHeaders,
                signal: AbortSignal.timeout(30000)
            }

            if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
                fetchOptions.body = typeof requestBody === 'string'
                    ? requestBody
                    : JSON.stringify(requestBody)
            }

            response = await fetch(url, fetchOptions)

            const contentType = response.headers.get('content-type')
            if (contentType?.includes('application/json')) {
                responseBody = await response.json()
            } else {
                responseBody = await response.text()
            }
        } catch (err: any) {
            responseError = err.message
            response = new Response(null, { status: 0 })
            responseBody = null
        }

        const responseTime = Date.now() - startTime

        // Log playground request
        await admin.from('playground_requests').insert({
            developer_id: developer.id,
            application_id,
            method,
            endpoint,
            request_headers: requestHeaders,
            request_body: requestBody,
            response_status: response.status,
            response_body: typeof responseBody === 'object'
                ? JSON.stringify(responseBody).substring(0, 10000)
                : responseBody?.substring(0, 10000),
            response_time_ms: responseTime,
            error: responseError
        })

        return NextResponse.json({
            success: response.ok,
            request: {
                method,
                url,
                headers: Object.fromEntries(
                    Object.entries(requestHeaders).map(([k, v]) => [
                        k,
                        k.toLowerCase() === 'authorization' ? v.substring(0, 20) + '...' : v
                    ])
                ),
                body: requestBody
            },
            response: {
                status: response.status,
                status_text: response.statusText || (response.status === 0 ? 'Network Error' : ''),
                headers: response.headers ? Object.fromEntries(response.headers.entries()) : {},
                body: responseBody,
                time_ms: responseTime
            },
            error: responseError,
            tips: generateTips(response.status, responseBody)
        })
    } catch (error: any) {
        console.error('Playground execute error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

function generateTips(status: number, body: any): string[] {
    const tips: string[] = []

    if (status === 0) {
        tips.push('Network error - check if the API server is running and accessible.')
    } else if (status === 401) {
        tips.push('Authentication failed. Try refreshing your access token.')
        tips.push('Ensure your application has valid credentials configured.')
    } else if (status === 403) {
        tips.push('Access denied. Your token may not have the required scopes.')
        tips.push('Check the API documentation for required permissions.')
    } else if (status === 404) {
        tips.push('Resource not found. Verify the endpoint URL and any IDs in the path.')
    } else if (status === 429) {
        tips.push('Rate limited. Wait before making more requests.')
        tips.push('Consider implementing request queuing in your application.')
    } else if (status >= 500) {
        tips.push('Server error. This may be temporary - try again in a moment.')
        tips.push('If the error persists, check the API status page.')
    } else if (status >= 200 && status < 300) {
        tips.push('Success! The response contains the requested data.')
    }

    return tips
}

// GET /api/playground/history - Get request history
export async function GET(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        const admin = getSupabaseAdmin()

        const { data: history, error } = await admin
            .from('playground_requests')
            .select('id, method, endpoint, response_status, response_time_ms, created_at')
            .eq('developer_id', developer.id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        return NextResponse.json({
            total: history?.length || 0,
            requests: history?.map(h => ({
                id: h.id,
                method: h.method,
                endpoint: h.endpoint,
                status: h.response_status,
                time_ms: h.response_time_ms,
                timestamp: h.created_at
            })) || []
        })
    } catch (error: any) {
        console.error('Playground history error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
