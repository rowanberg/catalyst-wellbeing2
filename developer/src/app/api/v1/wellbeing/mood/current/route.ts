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

// Check if user has granted wellbeing data consent
async function checkWellbeingConsent(admin: any, userId: string): Promise<boolean> {
    const { data: consent } = await admin
        .from('wellbeing_consents')
        .select('is_granted')
        .eq('user_id', userId)
        .eq('consent_type', 'api_access')
        .eq('is_active', true)
        .single()

    return consent?.is_granted || false
}

// GET /api/v1/wellbeing/mood/current - Get current mood state
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
        const aggregated = searchParams.get('aggregated') === 'true'

        const admin = getSupabaseAdmin()
        const userId = auth.payload.sub

        // For individual student data, check consent
        if (studentId && !aggregated) {
            // Get student's user_id
            const { data: student } = await admin
                .from('students')
                .select('user_id')
                .eq('id', studentId)
                .single()

            if (!student) {
                return NextResponse.json({
                    error: 'not_found',
                    error_description: 'Student not found'
                }, { status: 404 })
            }

            // Check consent
            const hasConsent = await checkWellbeingConsent(admin, student.user_id)
            if (!hasConsent) {
                return NextResponse.json({
                    error: 'consent_required',
                    error_description: 'Student has not granted consent for wellbeing data access',
                    consent_url: `/wellbeing/consent?student_id=${studentId}`
                }, { status: 403 })
            }

            // Get current mood
            const { data: mood, error } = await admin
                .from('mood_check_ins')
                .select(`
                    id,
                    mood_level,
                    mood_emoji,
                    energy_level,
                    stress_level,
                    notes,
                    created_at
                `)
                .eq('student_id', studentId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (error && error.code !== 'PGRST116') throw error

            return NextResponse.json({
                student_id: studentId,
                current_mood: mood ? {
                    mood_level: mood.mood_level,
                    mood_emoji: mood.mood_emoji,
                    energy_level: mood.energy_level,
                    stress_level: mood.stress_level,
                    notes: mood.notes,
                    recorded_at: mood.created_at
                } : null,
                consent_granted: true,
                data_type: 'individual',
                disclaimer: 'This data is provided for educational purposes only and should not be used for medical diagnosis.'
            })
        }

        // Aggregated/anonymized data (no consent required)
        const { data: aggregatedMood } = await admin
            .from('mood_check_ins')
            .select('mood_level, energy_level, stress_level')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

        if (!aggregatedMood || aggregatedMood.length === 0) {
            return NextResponse.json({
                data_type: 'aggregated',
                period: 'last_7_days',
                sample_size: 0,
                averages: null,
                disclaimer: 'Aggregated data from multiple students. Individual identities are not disclosed.'
            })
        }

        // Calculate averages
        const avgMood = aggregatedMood.reduce((sum, m) => sum + (m.mood_level || 0), 0) / aggregatedMood.length
        const avgEnergy = aggregatedMood.reduce((sum, m) => sum + (m.energy_level || 0), 0) / aggregatedMood.length
        const avgStress = aggregatedMood.reduce((sum, m) => sum + (m.stress_level || 0), 0) / aggregatedMood.length

        // Distribution
        const distribution = {
            very_happy: aggregatedMood.filter(m => m.mood_level >= 4).length,
            happy: aggregatedMood.filter(m => m.mood_level === 3).length,
            neutral: aggregatedMood.filter(m => m.mood_level === 2).length,
            sad: aggregatedMood.filter(m => m.mood_level === 1).length,
            very_sad: aggregatedMood.filter(m => m.mood_level === 0).length
        }

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: userId,
                endpoint: '/api/v1/wellbeing/mood/current',
                method: 'GET',
                response_status: 200
            })
        } catch {
            // Ignore logging errors
        }

        return NextResponse.json({
            data_type: 'aggregated',
            period: 'last_7_days',
            sample_size: aggregatedMood.length,
            averages: {
                mood_level: Math.round(avgMood * 100) / 100,
                energy_level: Math.round(avgEnergy * 100) / 100,
                stress_level: Math.round(avgStress * 100) / 100
            },
            distribution,
            disclaimer: 'Aggregated data from multiple students. Individual identities are not disclosed.'
        })
    } catch (error: any) {
        console.error('Wellbeing mood API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
