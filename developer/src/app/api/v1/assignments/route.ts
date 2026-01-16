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

// GET /api/v1/assignments - List assignments
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
        const status = searchParams.get('status') // pending, submitted, graded, overdue
        const dueAfter = searchParams.get('due_after')
        const dueBefore = searchParams.get('due_before')
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

        let query = admin
            .from('assignments')
            .select(`
                id,
                title,
                description,
                instructions,
                due_date,
                due_time,
                max_marks,
                weightage,
                is_graded,
                allow_late_submission,
                created_at,
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
        if (dueAfter) {
            query = query.gte('due_date', dueAfter)
        }
        if (dueBefore) {
            query = query.lte('due_date', dueBefore)
        }

        const { data: assignments, error } = await query

        if (error) throw error

        // Get submission status if student_id provided
        let submissionMap: { [key: string]: any } = {}
        if (studentId && assignments) {
            const assignmentIds = assignments.map(a => a.id)
            const { data: submissions } = await admin
                .from('assignment_submissions')
                .select('assignment_id, status, submitted_at, marks, feedback')
                .eq('student_id', studentId)
                .in('assignment_id', assignmentIds)

            submissions?.forEach(s => {
                submissionMap[s.assignment_id] = s
            })
        }

        // Filter by status if provided
        let filteredAssignments = assignments || []
        const now = new Date()

        if (status === 'pending') {
            filteredAssignments = filteredAssignments.filter(a =>
                !submissionMap[a.id] && new Date(a.due_date) >= now
            )
        } else if (status === 'submitted') {
            filteredAssignments = filteredAssignments.filter(a =>
                submissionMap[a.id]?.status === 'submitted'
            )
        } else if (status === 'graded') {
            filteredAssignments = filteredAssignments.filter(a =>
                submissionMap[a.id]?.status === 'graded'
            )
        } else if (status === 'overdue') {
            filteredAssignments = filteredAssignments.filter(a =>
                !submissionMap[a.id] && new Date(a.due_date) < now
            )
        }

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/assignments',
                method: 'GET',
                response_status: 200
            })
        } catch { }

        return NextResponse.json({
            total: filteredAssignments.length,
            student_id: studentId || null,
            assignments: filteredAssignments.map(a => {
                const subject = Array.isArray(a.subject) ? a.subject[0] : a.subject
                const classData = Array.isArray(a.class) ? a.class[0] : a.class
                const teacher = Array.isArray(a.teacher) ? a.teacher[0] : a.teacher
                const submission = submissionMap[a.id]

                const dueDate = new Date(a.due_date)
                const isOverdue = dueDate < now && !submission

                return {
                    id: a.id,
                    title: a.title,
                    description: a.description,
                    instructions: a.instructions,
                    due_date: a.due_date,
                    due_time: a.due_time,
                    max_marks: a.max_marks,
                    weightage: a.weightage,
                    is_graded: a.is_graded,
                    allow_late_submission: a.allow_late_submission,
                    is_overdue: isOverdue,
                    days_until_due: Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
                    subject: subject ? { id: subject.id, name: subject.name, color: subject.color } : null,
                    class: classData ? { id: classData.id, name: classData.name } : null,
                    teacher: teacher ? { id: teacher.id, name: teacher.full_name } : null,
                    submission: submission ? {
                        status: submission.status,
                        submitted_at: submission.submitted_at,
                        marks: submission.marks,
                        feedback: submission.feedback
                    } : null
                }
            })
        })
    } catch (error: any) {
        console.error('Assignments API error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}
