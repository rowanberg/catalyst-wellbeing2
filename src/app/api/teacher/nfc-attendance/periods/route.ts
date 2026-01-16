import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth/api-auth'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

// GET - Fetch school periods
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { allowedRoles: ['teacher', 'admin'] })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const { data: periods, error: fetchError } = await supabaseAdmin
            .from('school_periods')
            .select('*')
            .eq('school_id', profile.school_id)
            .eq('is_active', true)
            .order('period_number', { ascending: true })

        if (fetchError) {
            // Table might not exist yet
            if (fetchError.code === '42P01') {
                return NextResponse.json({
                    periods: [],
                    message: 'School periods table not configured. Please run migrations.'
                })
            }
            console.error('Failed to fetch periods:', fetchError)
            return NextResponse.json({ error: 'Failed to fetch periods' }, { status: 500 })
        }

        // Transform to camelCase
        const transformedPeriods = (periods || []).map(p => ({
            id: p.id,
            periodNumber: p.period_number,
            periodName: p.period_name,
            periodType: p.period_type,
            startTime: p.start_time,
            endTime: p.end_time,
            lateThresholdMinutes: p.late_threshold_minutes,
            applicableDays: p.applicable_days,
            isActive: p.is_active
        }))

        return NextResponse.json({ periods: transformedPeriods })

    } catch (error: any) {
        console.error('Error fetching periods:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create/Update school periods (admin only)
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { requiredRole: 'admin' })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const body = await request.json()
        const { periods } = body

        if (!periods || !Array.isArray(periods)) {
            return NextResponse.json({ error: 'Periods array required' }, { status: 400 })
        }

        // Upsert periods
        const upsertData = periods.map((p: any) => ({
            school_id: profile.school_id,
            period_number: p.periodNumber,
            period_name: p.periodName,
            period_type: p.periodType || 'class',
            start_time: p.startTime,
            end_time: p.endTime,
            late_threshold_minutes: p.lateThresholdMinutes || 5,
            applicable_days: p.applicableDays || [1, 2, 3, 4, 5],
            is_active: p.isActive !== false
        }))

        const { data, error: upsertError } = await supabaseAdmin
            .from('school_periods')
            .upsert(upsertData, { onConflict: 'school_id,period_number' })
            .select()

        if (upsertError) {
            console.error('Failed to upsert periods:', upsertError)
            return NextResponse.json({ error: 'Failed to save periods' }, { status: 500 })
        }

        return NextResponse.json({
            periods: data,
            message: 'Periods saved successfully'
        })

    } catch (error: any) {
        console.error('Error saving periods:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
