import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile and verify admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, school_id')
            .eq('user_id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        // Extract query parameters
        const { searchParams } = new URL(request.url)
        const schoolId = searchParams.get('school_id')
        const className = searchParams.get('class_name')
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')

        if (!schoolId || !className) {
            return NextResponse.json(
                { error: 'Missing required parameters: school_id, class_name' },
                { status: 400 }
            )
        }

        // Verify school_id matches user's school
        if (schoolId !== profile.school_id) {
            return NextResponse.json({ error: 'Unauthorized school access' }, { status: 403 })
        }

        // Use admin client for fetching data
        const adminSupabase = getSupabaseAdmin()

        // Set default date range if not provided (last 30 days)
        const end = endDate ? new Date(endDate) : new Date()
        const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Fetch the class by name
        const { data: classData, error: classError } = await adminSupabase
            .from('classes')
            .select('id, class_name')
            .eq('class_name', className)
            .eq('school_id', schoolId)
            .single()

        if (classError || !classData) {
            console.log('Class not found:', className, classError)
            return NextResponse.json({
                students: [],
                dates: [],
                summary: { totalDays: 0, averageAttendance: 0 }
            })
        }

        console.log('Found class:', classData.id, classData.class_name)

        // Get student class assignments for this class
        const { data: assignments, error: assignmentError } = await adminSupabase
            .from('student_class_assignments')
            .select('student_id, class_id, is_primary')
            .eq('class_id', classData.id)
            .eq('school_id', schoolId)
            .eq('is_active', true)

        console.log('Class assignments:', assignments?.length || 0, 'students')

        if (!assignments || assignments.length === 0) {
            return NextResponse.json({
                students: [],
                dates: [],
                summary: { totalDays: 0, averageAttendance: 0 }
            })
        }

        // Get student profile info - note: student_id in assignments could be profile.id or user_id
        const studentIds = assignments.map((a: any) => a.student_id).filter(Boolean)

        // Try to find profiles by both id and user_id
        const { data: profilesByUserId } = await adminSupabase
            .from('profiles')
            .select('id, user_id, first_name, last_name')
            .in('user_id', studentIds)
            .eq('role', 'student')

        const { data: profilesById } = await adminSupabase
            .from('profiles')
            .select('id, user_id, first_name, last_name')
            .in('id', studentIds)
            .eq('role', 'student')

        // Merge profiles (avoiding duplicates)
        const profileMap = new Map()
        profilesByUserId?.forEach((p: any) => profileMap.set(p.id, p))
        profilesById?.forEach((p: any) => profileMap.set(p.id, p))
        const allProfiles = Array.from(profileMap.values())

        console.log('Found profiles:', allProfiles.length)

        if (allProfiles.length === 0) {
            return NextResponse.json({
                students: [],
                dates: [],
                summary: { totalDays: 0, averageAttendance: 0 }
            })
        }

        // Create ID mapping - map assignment student_id to profile
        const assignmentToProfile = new Map()
        assignments.forEach((a: any) => {
            // Check if student_id matches user_id or profile.id
            const profile = allProfiles.find((p: any) => p.user_id === a.student_id || p.id === a.student_id)
            if (profile) {
                assignmentToProfile.set(a.student_id, profile)
            }
        })

        // Get all possible IDs for attendance query (both profile.id and user_id)
        const allPossibleIds = new Set<string>()
        allProfiles.forEach((p: any) => {
            if (p.id) allPossibleIds.add(p.id)
            if (p.user_id) allPossibleIds.add(p.user_id)
        })
        const attendanceStudentIds = Array.from(allPossibleIds)

        console.log('Fetching attendance for', attendanceStudentIds.length, 'possible IDs')

        // Generate array of all dates in range
        const dates: string[] = []
        const currentDate = new Date(start)
        while (currentDate <= end) {
            dates.push(currentDate.toISOString().split('T')[0])
            currentDate.setDate(currentDate.getDate() + 1)
        }

        // Fetch attendance records for all students in date range
        const { data: attendanceRecords, error: attendanceError } = await adminSupabase
            .from('attendance')
            .select('student_id, date, status')
            .in('student_id', attendanceStudentIds)
            .gte('date', start.toISOString().split('T')[0])
            .lte('date', end.toISOString().split('T')[0])
            .eq('school_id', schoolId)
            .order('date', { ascending: true })

        console.log('Attendance records found:', attendanceRecords?.length || 0)

        // Build heatmap data structure using profiles
        const students = allProfiles.map((profile: any) => {
            const studentName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'
            const studentId = profile.id

            // Create attendance map for this student - check both id and user_id
            const attendanceMap: { [date: string]: string } = {}
            attendanceRecords?.forEach((record: any) => {
                if (record.student_id === profile.id || record.student_id === profile.user_id) {
                    attendanceMap[record.date] = record.status
                }
            })

            // Build attendance array with null for missing dates
            const attendance = dates.map(date => ({
                date,
                status: (attendanceMap[date] as 'present' | 'absent' | 'late' | null) || null
            }))

            return {
                id: studentId,
                name: studentName,
                attendance
            }
        })

        // Filter out "Unknown" students
        const validStudents = students.filter((s: any) => s.name !== 'Unknown' && s.name.trim() !== '')

        console.log('Valid students:', validStudents.length)

        // Calculate summary statistics
        const totalDays = dates.length
        let totalPresent = 0
        let totalRecords = 0

        validStudents.forEach((student: any) => {
            student.attendance.forEach((day: any) => {
                if (day.status) {
                    totalRecords++
                    if (day.status === 'present') totalPresent++
                }
            })
        })

        const averageAttendance = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0

        return NextResponse.json({
            students: validStudents,
            dates,
            summary: {
                totalDays,
                averageAttendance: Math.round(averageAttendance * 10) / 10
            }
        })

    } catch (error: any) {
        console.error('Heatmap API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch heatmap data', details: error?.message },
            { status: 500 }
        )
    }
}
