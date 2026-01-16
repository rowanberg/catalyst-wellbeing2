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

// GET /api/v1/students/[id]/marks - Get student academic marks
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({
            error: 'unauthorized',
            error_description: auth.error
        }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'student.academic.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: student.academic.read'
        }, { status: 403 })
    }

    try {
        const { id: studentId } = params
        const { searchParams } = new URL(request.url)
        const term = searchParams.get('term')
        const subject = searchParams.get('subject')
        const academicYear = searchParams.get('academic_year')

        const admin = getSupabaseAdmin()

        // Verify student exists
        const { data: student, error: studentError } = await admin
            .from('students')
            .select('id, full_name, grade, section')
            .eq('id', studentId)
            .single()

        if (studentError || !student) {
            return NextResponse.json({
                error: 'not_found',
                error_description: 'Student not found'
            }, { status: 404 })
        }

        // Build marks query
        let query = admin
            .from('student_marks')
            .select(`
                id,
                marks_obtained,
                max_marks,
                grade,
                percentage,
                remarks,
                exam:exams(id, name, type, date, term, academic_year),
                subject:subjects(id, name, code)
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })

        // Apply filters
        if (term) {
            query = query.eq('exam.term', term)
        }
        if (subject) {
            query = query.eq('subject_id', subject)
        }
        if (academicYear) {
            query = query.eq('exam.academic_year', academicYear)
        }

        const { data: marks, error } = await query

        if (error) throw error

        // Group marks by subject
        const subjectMarks: { [key: string]: any } = {}
        marks?.forEach((mark: any) => {
            // Handle both array and object returns from Supabase joins
            const subjectData = Array.isArray(mark.subject) ? mark.subject[0] : mark.subject
            const examData = Array.isArray(mark.exam) ? mark.exam[0] : mark.exam

            const subjectId = subjectData?.id
            if (!subjectId) return

            if (!subjectMarks[subjectId]) {
                subjectMarks[subjectId] = {
                    subject: {
                        id: subjectData.id,
                        name: subjectData.name,
                        code: subjectData.code
                    },
                    exams: [],
                    average_percentage: 0
                }
            }

            subjectMarks[subjectId].exams.push({
                exam: examData ? {
                    id: examData.id,
                    name: examData.name,
                    type: examData.type,
                    date: examData.date,
                    term: examData.term
                } : null,
                marks_obtained: mark.marks_obtained,
                max_marks: mark.max_marks,
                percentage: mark.percentage,
                grade: mark.grade,
                remarks: mark.remarks
            })
        })

        // Calculate averages
        Object.keys(subjectMarks).forEach(subjectId => {
            const exams = subjectMarks[subjectId].exams
            const totalPercentage = exams.reduce((sum: number, e: any) => sum + (e.percentage || 0), 0)
            subjectMarks[subjectId].average_percentage = exams.length > 0
                ? Math.round(totalPercentage / exams.length * 100) / 100
                : 0
        })

        // Calculate overall GPA/percentage
        const allPercentages = marks?.filter((m: any) => m.percentage).map((m: any) => m.percentage) || []
        const overallAverage = allPercentages.length > 0
            ? allPercentages.reduce((a: number, b: number) => a + b, 0) / allPercentages.length
            : 0

        // Log API call (fire and forget)
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: `/api/v1/students/${studentId}/marks`,
                method: 'GET',
                response_status: 200
            })
        } catch {
            // Ignore logging errors
        }

        return NextResponse.json({
            student: {
                id: student.id,
                name: student.full_name,
                grade: student.grade,
                section: student.section
            },
            summary: {
                total_exams: marks?.length || 0,
                overall_average: Math.round(overallAverage * 100) / 100,
                subjects_count: Object.keys(subjectMarks).length
            },
            subjects: Object.values(subjectMarks),
            filters: {
                term: term || null,
                subject: subject || null,
                academic_year: academicYear || null
            }
        })
    } catch (error: any) {
        console.error('Marks API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
