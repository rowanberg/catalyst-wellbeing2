import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin credentials not configured')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
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

// GET /api/v1/homework - List homework
export async function GET(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'student.academic.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: student.academic.read'
        }, { status: 403 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const studentId = searchParams.get('student_id')
        const classId = searchParams.get('class_id')
        const subjectId = searchParams.get('subject_id')
        const date = searchParams.get('date') // specific date
        const upcoming = searchParams.get('upcoming') === 'true'
        const overdue = searchParams.get('overdue') === 'true'
        const limit = parseInt(searchParams.get('limit') || '50')

        const admin = getSupabaseAdmin()

        // If student_id provided, get their class
        let targetClassId = classId
        if (studentId && !classId) {
            const { data: student } = await admin
                .from('students')
                .select('class_id')
                .eq('id', studentId)
                .single()
            targetClassId = student?.class_id
        }

        const now = new Date()
        const today = now.toISOString().split('T')[0]

        let query = admin
            .from('homework')
            .select(`
                id,
                title,
                description,
                assigned_date,
                due_date,
                estimated_time_minutes,
                priority,
                subject:subjects(id, name, code, color),
                class:classes(id, name, grade, section),
                teacher:teachers(id, full_name)
            `)
            .order('due_date', { ascending: true })
            .limit(limit)

        if (targetClassId) {
            query = query.eq('class_id', targetClassId)
        }
        if (subjectId) {
            query = query.eq('subject_id', subjectId)
        }
        if (date) {
            query = query.eq('due_date', date)
        }
        if (upcoming) {
            query = query.gte('due_date', today)
        }
        if (overdue) {
            query = query.lt('due_date', today)
        }

        const { data: homework, error } = await query

        if (error) throw error

        // Get completion status if student_id provided
        let completionMap: { [key: string]: any } = {}
        if (studentId && homework) {
            const homeworkIds = homework.map(h => h.id)
            const { data: completions } = await admin
                .from('homework_completions')
                .select('homework_id, is_completed, completed_at, notes')
                .eq('student_id', studentId)
                .in('homework_id', homeworkIds)

            completions?.forEach(c => {
                completionMap[c.homework_id] = c
            })
        }

        // Group by due date
        const byDueDate: { [key: string]: any[] } = {}
        homework?.forEach(h => {
            const dueKey = h.due_date
            if (!byDueDate[dueKey]) {
                byDueDate[dueKey] = []
            }
            byDueDate[dueKey].push(h)
        })

        // Calculate summary
        const totalHomework = homework?.length || 0
        const completedCount = Object.values(completionMap).filter(c => c.is_completed).length
        const overdueCount = homework?.filter(h =>
            new Date(h.due_date) < now && !completionMap[h.id]?.is_completed
        ).length || 0
        const dueTodayCount = homework?.filter(h => h.due_date === today).length || 0

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/homework',
                method: 'GET',
                response_status: 200
            })
        } catch { }

        return NextResponse.json({
            total: totalHomework,
            summary: {
                total: totalHomework,
                completed: completedCount,
                pending: totalHomework - completedCount,
                overdue: overdueCount,
                due_today: dueTodayCount,
                completion_rate: totalHomework > 0 ? Math.round(completedCount / totalHomework * 100) : 0
            },
            by_due_date: Object.keys(byDueDate).map(date => ({
                date,
                is_today: date === today,
                is_overdue: new Date(date) < now,
                count: byDueDate[date].length
            })),
            homework: homework?.map(h => {
                const subject = Array.isArray(h.subject) ? h.subject[0] : h.subject
                const classData = Array.isArray(h.class) ? h.class[0] : h.class
                const teacher = Array.isArray(h.teacher) ? h.teacher[0] : h.teacher
                const completion = completionMap[h.id]

                const dueDate = new Date(h.due_date)
                const isOverdue = dueDate < now && !completion?.is_completed

                return {
                    id: h.id,
                    title: h.title,
                    description: h.description,
                    assigned_date: h.assigned_date,
                    due_date: h.due_date,
                    estimated_time_minutes: h.estimated_time_minutes,
                    priority: h.priority,
                    is_overdue: isOverdue,
                    is_completed: completion?.is_completed || false,
                    completed_at: completion?.completed_at || null,
                    days_until_due: Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
                    subject: subject ? { id: subject.id, name: subject.name, color: subject.color } : null,
                    class: classData ? { id: classData.id, name: classData.name } : null,
                    teacher: teacher ? { id: teacher.id, name: teacher.full_name } : null
                }
            }) || []
        })
    } catch (error: any) {
        console.error('Homework API error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}
