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

// Verify access token
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

// GET /api/v1/wellbeing/mood/history - Get mood history
export async function GET(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({
            error: 'unauthorized',
            error_description: auth.error
        }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'wellbeing.mood.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: wellbeing.mood.read'
        }, { status: 403 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const studentId = searchParams.get('student_id')
        const days = parseInt(searchParams.get('days') || '30')
        const limit = parseInt(searchParams.get('limit') || '50')

        const admin = getSupabaseAdmin()
        const userId = auth.payload.sub

        if (!studentId) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'student_id parameter is required'
            }, { status: 400 })
        }

        // Get student and check consent
        const { data: student } = await admin
            .from('students')
            .select('user_id, full_name')
            .eq('id', studentId)
            .single()

        if (!student) {
            return NextResponse.json({
                error: 'not_found',
                error_description: 'Student not found'
            }, { status: 404 })
        }

        // Check consent
        const { data: consent } = await admin
            .from('wellbeing_consents')
            .select('is_granted')
            .eq('user_id', student.user_id)
            .eq('consent_type', 'api_access')
            .eq('is_active', true)
            .single()

        if (!consent?.is_granted) {
            return NextResponse.json({
                error: 'consent_required',
                error_description: 'Student has not granted consent for wellbeing data access',
                consent_url: `/wellbeing/consent?student_id=${studentId}`
            }, { status: 403 })
        }

        // Get mood history
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        const { data: moodHistory, error } = await admin
            .from('mood_check_ins')
            .select(`
                id,
                mood_level,
                mood_emoji,
                energy_level,
                stress_level,
                sleep_quality,
                notes,
                created_at
            `)
            .eq('student_id', studentId)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        // Calculate trends
        const avgMood = moodHistory.reduce((sum, m) => sum + (m.mood_level || 0), 0) / (moodHistory.length || 1)
        const avgEnergy = moodHistory.reduce((sum, m) => sum + (m.energy_level || 0), 0) / (moodHistory.length || 1)
        const avgStress = moodHistory.reduce((sum, m) => sum + (m.stress_level || 0), 0) / (moodHistory.length || 1)

        // Detect trends (comparing first half vs second half)
        const midpoint = Math.floor(moodHistory.length / 2)
        const recentMood = moodHistory.slice(0, midpoint)
        const olderMood = moodHistory.slice(midpoint)

        const recentAvg = recentMood.reduce((sum, m) => sum + (m.mood_level || 0), 0) / (recentMood.length || 1)
        const olderAvg = olderMood.reduce((sum, m) => sum + (m.mood_level || 0), 0) / (olderMood.length || 1)

        let trend = 'stable'
        if (recentAvg > olderAvg + 0.5) trend = 'improving'
        if (recentAvg < olderAvg - 0.5) trend = 'declining'

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: userId,
                endpoint: '/api/v1/wellbeing/mood/history',
                method: 'GET',
                response_status: 200
            })
        } catch {
            // Ignore logging errors
        }

        return NextResponse.json({
            student_id: studentId,
            student_name: student.full_name,
            period: {
                days,
                start_date: startDate.toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            },
            summary: {
                total_check_ins: moodHistory.length,
                average_mood: Math.round(avgMood * 100) / 100,
                average_energy: Math.round(avgEnergy * 100) / 100,
                average_stress: Math.round(avgStress * 100) / 100,
                trend
            },
            history: moodHistory.map(m => ({
                date: m.created_at.split('T')[0],
                time: m.created_at.split('T')[1]?.split('.')[0],
                mood_level: m.mood_level,
                mood_emoji: m.mood_emoji,
                energy_level: m.energy_level,
                stress_level: m.stress_level,
                sleep_quality: m.sleep_quality,
                has_notes: !!m.notes
            })),
            consent_granted: true,
            disclaimer: 'This data is provided for educational purposes only and should not be used for medical diagnosis.'
        })
    } catch (error: any) {
        console.error('Wellbeing mood history API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
