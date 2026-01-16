import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// Create admin client
const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Supabase admin credentials not configured')
    }

    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

function verifyAccessToken(request: NextRequest): { valid: boolean; payload?: any; error?: string } {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.substring(7)
    try {
        const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'dev-secret'
        const payload = jwt.verify(token, secret)
        return { valid: true, payload }
    } catch {
        return { valid: false, error: 'Invalid or expired access token' }
    }
}

function hasScope(payload: any, requiredScope: string): boolean {
    const scopes = payload.scopes || []
    return scopes.includes(requiredScope) || scopes.includes('*')
}

// GET /api/v1/wellbeing/behavior/summary - Get behavior summary
export async function GET(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({
            error: 'unauthorized',
            error_description: auth.error
        }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'wellbeing.behavior.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: wellbeing.behavior.read'
        }, { status: 403 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const studentId = searchParams.get('student_id')
        const classId = searchParams.get('class_id')
        const period = searchParams.get('period') || 'month' // week, month, term

        const admin = getSupabaseAdmin()

        // Calculate date range
        let startDate: Date
        const now = new Date()
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
            case 'term':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                break
            default: // month
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        let query = admin
            .from('behavior_records')
            .select(`
                id,
                behavior_type,
                category,
                severity,
                points,
                description,
                created_at,
                student:students(id, full_name, grade, section)
            `)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false })

        if (studentId) {
            // Check consent for individual student data
            const { data: student } = await admin
                .from('students')
                .select('user_id')
                .eq('id', studentId)
                .single()

            if (student) {
                const { data: consent } = await admin
                    .from('wellbeing_consents')
                    .select('is_granted')
                    .eq('user_id', student.user_id)
                    .eq('consent_type', 'behavior_data')
                    .eq('is_active', true)
                    .single()

                if (!consent?.is_granted) {
                    return NextResponse.json({
                        error: 'consent_required',
                        error_description: 'Student has not granted consent for behavior data access'
                    }, { status: 403 })
                }
            }
            query = query.eq('student_id', studentId)
        }

        if (classId) {
            query = query.eq('class_id', classId)
        }

        const { data: records, error } = await query.limit(100)

        if (error) throw error

        // Calculate summary statistics
        const positive = records?.filter(r => r.behavior_type === 'positive') || []
        const negative = records?.filter(r => r.behavior_type === 'negative') || []
        const neutral = records?.filter(r => r.behavior_type === 'neutral') || []

        // Category breakdown
        const categories: { [key: string]: number } = {}
        records?.forEach(r => {
            categories[r.category] = (categories[r.category] || 0) + 1
        })

        // Severity breakdown for negative
        const severity = {
            minor: negative.filter(r => r.severity === 'minor').length,
            moderate: negative.filter(r => r.severity === 'moderate').length,
            major: negative.filter(r => r.severity === 'major').length,
            severe: negative.filter(r => r.severity === 'severe').length
        }

        // Points summary
        const totalPoints = records?.reduce((sum, r) => sum + (r.points || 0), 0) || 0

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/wellbeing/behavior/summary',
                method: 'GET',
                response_status: 200
            })
        } catch {
            // Ignore logging errors
        }

        return NextResponse.json({
            period: {
                type: period,
                start_date: startDate.toISOString().split('T')[0],
                end_date: now.toISOString().split('T')[0]
            },
            summary: {
                total_records: records?.length || 0,
                positive_count: positive.length,
                negative_count: negative.length,
                neutral_count: neutral.length,
                positive_ratio: records?.length ? positive.length / records.length : 0,
                total_points: totalPoints
            },
            categories,
            severity,
            recent_records: records?.slice(0, 10).map(r => ({
                id: r.id,
                type: r.behavior_type,
                category: r.category,
                severity: r.severity,
                points: r.points,
                description: r.description,
                date: r.created_at.split('T')[0],
                student: studentId ? undefined : {
                    id: (r.student as any)?.id,
                    name: (r.student as any)?.full_name
                }
            })),
            disclaimer: 'Behavior data is for educational purposes only and should be used constructively.'
        })
    } catch (error: any) {
        console.error('Behavior summary API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
