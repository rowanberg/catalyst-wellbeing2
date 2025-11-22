import { NextRequest, NextResponse } from 'next/server'
import { invalidateStudentAnalytics } from '@/lib/redis/parent-cache'

export async function POST(request: NextRequest) {
    try {
        const { studentId } = await request.json()

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
        }

        console.log('[Cache Clear] Clearing analytics cache for student:', studentId)
        await invalidateStudentAnalytics(studentId)

        return NextResponse.json({
            success: true,
            message: `Analytics cache cleared for student ${studentId}`
        })
    } catch (error) {
        console.error('[Cache Clear] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
