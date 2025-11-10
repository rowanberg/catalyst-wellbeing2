import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Fetch all incidents for admin's school
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get admin profile and verify role
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view all incidents' },
        { status: 403 }
      )
    }

    // Fetch all incidents for the admin's school
    const { data: incidents, error: incidentsError } = await supabase
      .from('incident_reports')
      .select(`
        id,
        incident_type,
        severity,
        description,
        location,
        incident_date,
        students_involved,
        student_name_text,
        class_id,
        class_name,
        status,
        created_at,
        updated_at,
        reported_by,
        school_id
      `)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })
      .limit(500)

    if (incidentsError) {
      return NextResponse.json(
        { error: 'Failed to fetch incidents' },
        { status: 500 }
      )
    }

    // Get all unique student IDs and teacher IDs
    const studentIds = Array.from(
      new Set(
        incidents?.flatMap(inc => inc.students_involved || []) || []
      )
    )

    const teacherIds = Array.from(
      new Set(
        incidents?.map(inc => inc.reported_by).filter(Boolean) || []
      )
    )

    // Fetch student names
    let studentMap: Record<string, any> = {}
    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('profiles')
        .select('id, full_name, first_name, grade_level')
        .in('id', studentIds)

      if (students) {
        studentMap = Object.fromEntries(
          students.map(s => [s.id, s])
        )
      }
    }

    // Fetch teacher names
    let teacherMap: Record<string, any> = {}
    if (teacherIds.length > 0) {
      const { data: teachers } = await supabase
        .from('profiles')
        .select('user_id, full_name, first_name')
        .in('user_id', teacherIds)

      if (teachers) {
        teacherMap = Object.fromEntries(
          teachers.map(t => [t.user_id, t])
        )
      }
    }

    // Transform incidents to match frontend interface
    const transformedIncidents = incidents?.map(incident => {
      const studentId = incident.students_involved?.[0]
      const student = studentId ? studentMap[studentId] : null
      const teacher = incident.reported_by ? teacherMap[incident.reported_by] : null
      
      // Use student profile name if available, otherwise use stored text name, or fallback
      const studentName = student?.full_name 
        || student?.first_name 
        || incident.student_name_text 
        || 'Unknown Student'

      const teacherName = teacher?.full_name || teacher?.first_name || 'Unknown Teacher'
      
      return {
        id: incident.id,
        student_id: studentId || '',
        teacher_id: incident.reported_by,
        teacher_name: teacherName,
        type: incident.incident_type,
        severity: incident.severity,
        description: incident.description,
        created_at: incident.created_at,
        student_name: studentName,
        student_grade: student?.grade_level,
        class_name: incident.class_name,
        resolution_status: incident.status === 'open' ? 'pending' 
          : incident.status === 'investigating' ? 'in_progress' 
          : 'resolved',
        location: incident.location,
        incident_date: incident.incident_date
      }
    }) || []

    const response = NextResponse.json({
      success: true,
      incidents: transformedIncidents,
      count: transformedIncidents.length
    })

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    
    return response

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
