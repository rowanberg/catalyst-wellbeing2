import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify student role and get school
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden - Student access required' }, { status: 403 })
    }

    // Get teachers from the same school with their office hours
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        subject,
        profile_picture_url
      `)
      .eq('role', 'teacher')
      .eq('school_id', profile.school_id)

    if (teachersError) {
      console.error('Error fetching teachers:', teachersError)
      return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
    }

    // Get office hours for teachers
    const teacherIds = teachers?.map(t => t.id) || []
    const { data: officeHours, error: officeHoursError } = await supabase
      .from('teacher_office_hours')
      .select('*')
      .in('teacher_id', teacherIds)

    if (officeHoursError) {
      console.error('Error fetching office hours:', officeHoursError)
    }

    // Format teacher data with office hours
    const formattedTeachers = teachers?.map(teacher => {
      const teacherOfficeHours = officeHours?.filter(oh => oh.teacher_id === teacher.id) || []
      
      return {
        id: teacher.id,
        name: `${teacher.first_name} ${teacher.last_name}`,
        subject: teacher.subject || 'General',
        avatar: teacher.profile_picture_url,
        officeHours: teacherOfficeHours.map(oh => ({
          day: oh.day_of_week,
          startTime: oh.start_time,
          endTime: oh.end_time
        }))
      }
    }) || []

    return NextResponse.json({ teachers: formattedTeachers })

  } catch (error: any) {
    console.error('Unexpected error in office hours teachers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
