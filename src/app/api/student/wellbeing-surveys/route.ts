import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

// Get ISO week number
function getISOWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Calculate weekly score
function calculateWeeklyScore(data: {
    overall_feeling?: number
    stress_level?: number
    sleep_quality?: number
    support_feeling?: number
}): number {
    const mood = ((data.overall_feeling || 3) - 1) / 4 * 100 * 0.30
    const stress = (5 - (data.stress_level || 2)) / 3 * 100 * 0.25
    const sleep = ((data.sleep_quality || 2) - 1) / 3 * 100 * 0.25
    const support = ((data.support_feeling || 2) - 1) / 3 * 100 * 0.20
    return Math.round(Math.min(100, Math.max(0, mood + stress + sleep + support)))
}

// GET: Fetch survey status and history
export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateStudent(request)
        if (isAuthError(auth)) {
            return NextResponse.json({ error: auth.error }, { status: auth.status })
        }

        const { supabase, profile } = auth
        const now = new Date()
        const currentWeek = getISOWeekNumber(now)
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        // Fetch this week's and this month's surveys
        const [weeklyRes, monthlyRes, historyRes] = await Promise.all([
            supabase
                .from('wellbeing_survey_responses')
                .select('*')
                .eq('student_id', profile.id)
                .eq('survey_type', 'weekly')
                .eq('week_number', currentWeek)
                .eq('year', currentYear)
                .single(),
            supabase
                .from('wellbeing_survey_responses')
                .select('*')
                .eq('student_id', profile.id)
                .eq('survey_type', 'monthly')
                .eq('month_number', currentMonth)
                .eq('year', currentYear)
                .single(),
            supabase
                .from('wellbeing_survey_responses')
                .select('survey_type, weekly_score, monthly_score, created_at, week_number, month_number, year')
                .eq('student_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(12)
        ])

        // Calculate trends from history
        const history = historyRes.data || []
        const weeklyHistory = history.filter((h: any) => h.survey_type === 'weekly')
        const monthlyHistory = history.filter((h: any) => h.survey_type === 'monthly')

        let weeklyTrend = 'stable'
        if (weeklyHistory.length >= 2) {
            const diff = (weeklyHistory[0]?.weekly_score || 0) - (weeklyHistory[1]?.weekly_score || 0)
            if (diff > 5) weeklyTrend = 'up'
            else if (diff < -5) weeklyTrend = 'down'
        }

        let monthlyTrend = 'stable'
        if (monthlyHistory.length >= 2) {
            const diff = (monthlyHistory[0]?.monthly_score || 0) - (monthlyHistory[1]?.monthly_score || 0)
            if (diff > 5) monthlyTrend = 'up'
            else if (diff < -5) monthlyTrend = 'down'
        }

        return NextResponse.json({
            weekly: {
                completed: !!weeklyRes.data,
                data: weeklyRes.data,
                score: weeklyRes.data?.weekly_score || null,
                trend: weeklyTrend,
                weekNumber: currentWeek
            },
            monthly: {
                completed: !!monthlyRes.data,
                data: monthlyRes.data,
                score: monthlyRes.data?.monthly_score || null,
                trend: monthlyTrend,
                monthNumber: currentMonth
            },
            history: history.slice(0, 8)
        })

    } catch (error: any) {
        console.error('Wellbeing surveys GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST: Submit a survey
export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateStudent(request)
        if (isAuthError(auth)) {
            return NextResponse.json({ error: auth.error }, { status: auth.status })
        }

        const { supabase, profile } = auth
        const body = await request.json()
        const { survey_type, ...answers } = body

        if (!['weekly', 'monthly'].includes(survey_type)) {
            return NextResponse.json({ error: 'Invalid survey type' }, { status: 400 })
        }

        const now = new Date()
        const currentWeek = getISOWeekNumber(now)
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        // Check if already submitted
        const { data: existing } = await supabase
            .from('wellbeing_survey_responses')
            .select('id')
            .eq('student_id', profile.id)
            .eq('survey_type', survey_type)
            .eq(survey_type === 'weekly' ? 'week_number' : 'month_number',
                survey_type === 'weekly' ? currentWeek : currentMonth)
            .eq('year', currentYear)
            .single()

        if (existing) {
            return NextResponse.json({
                error: `You've already completed the ${survey_type} survey for this period.`
            }, { status: 400 })
        }

        // Calculate score
        const weeklyScore = survey_type === 'weekly' ? calculateWeeklyScore(answers) : null

        // Insert response
        const { data: response, error: insertError } = await supabase
            .from('wellbeing_survey_responses')
            .insert({
                student_id: profile.id,
                school_id: profile.school_id,
                survey_type,
                week_number: survey_type === 'weekly' ? currentWeek : null,
                month_number: survey_type === 'monthly' ? currentMonth : null,
                year: currentYear,
                weekly_score: weeklyScore,
                ...answers
            })
            .select()
            .single()

        if (insertError) {
            console.error('Survey insert error:', insertError)
            return NextResponse.json({ error: 'Failed to save survey' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: `${survey_type.charAt(0).toUpperCase() + survey_type.slice(1)} survey submitted successfully!`,
            score: weeklyScore,
            response
        })

    } catch (error: any) {
        console.error('Wellbeing surveys POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
