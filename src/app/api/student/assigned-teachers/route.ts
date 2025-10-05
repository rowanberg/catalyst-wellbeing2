import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json(
        { message: 'Student ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching assigned teachers for student:', studentId)

    // Get student's class assignments
    const { data: studentClasses, error: classError } = await supabaseAdmin
      .from('student_class_assignments')
      .select('class_id')
      .eq('student_id', studentId)

    if (classError) {
      console.error('Error fetching student classes:', classError)
      return NextResponse.json({ teachers: [] })
    }

    if (!studentClasses || studentClasses.length === 0) {
      console.log('No classes assigned to student')
      return NextResponse.json({ teachers: [] })
    }

    const classIds = studentClasses.map(sc => sc.class_id)
    console.log('Student assigned to classes:', classIds)

    // Get teachers assigned to those classes with additional validation
    const { data: teacherAssignments, error: teacherError } = await supabaseAdmin
      .from('teacher_class_assignments')
      .select(`
        teacher_id,
        class_id,
        is_primary_teacher,
        assigned_at,
        profiles:teacher_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          role,
          updated_at,
          school_id
        ),
        classes:class_id (
          id,
          class_name,
          subject,
          school_id,
          grade_level_id,
          grade_levels (
            grade_level,
            grade_name
          )
        )
      `)
      .in('class_id', classIds)
      .not('profiles', 'is', null) // Ensure teacher profile exists
      .eq('profiles.role', 'teacher') // Ensure it's actually a teacher

    if (teacherError) {
      console.error('Error fetching teacher assignments:', teacherError)
      return NextResponse.json({ teachers: [] })
    }

    console.log('Found teacher assignments:', teacherAssignments?.length || 0)

    if (!teacherAssignments || teacherAssignments.length === 0) {
      console.log('No teachers found for student classes')
      return NextResponse.json({ teachers: [] })
    }

    // Process and deduplicate teachers (a teacher might teach multiple classes)
    const teacherMap = new Map()
    
    teacherAssignments?.forEach((assignment: any) => {
      if (!assignment.profiles) {
        console.warn('Teacher assignment missing profile:', assignment)
        return
      }
      
      const teacherId = assignment.profiles.id
      const teacher = assignment.profiles
      const classInfo = assignment.classes
      
      // Validate teacher and class data
      if (!teacher.id || teacher.role !== 'teacher') {
        console.warn('Invalid teacher data:', teacher)
        return
      }
      
      if (!classInfo?.id) {
        console.warn('Invalid class data:', classInfo)
        return
      }
      
      console.log(`Processing teacher ${teacher.first_name} ${teacher.last_name} for class ${classInfo.class_name}`)
      
      if (teacherMap.has(teacherId)) {
        // Add this class to existing teacher
        const existingTeacher = teacherMap.get(teacherId)
        existingTeacher.classes.push({
          class_id: classInfo.id,
          class_name: classInfo.class_name || 'Unknown Class',
          subject: classInfo.subject || 'General',
          grade_level: classInfo.grade_levels?.grade_level || classInfo.grade_level_id || 'K',
          grade_name: classInfo.grade_levels?.grade_name || 'Kindergarten',
          is_primary: assignment.is_primary_teacher,
          assigned_at: assignment.assigned_at
        })
      } else {
        // Add new teacher
        teacherMap.set(teacherId, {
          id: teacher.id,
          name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Unknown Teacher',
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          email: teacher.email,
          phone: teacher.phone,
          school_id: teacher.school_id,
          isOnline: isRecentlyActive(teacher.updated_at),
          lastSeen: getLastSeenText(teacher.updated_at),
          classes: [{
            class_id: classInfo.id,
            class_name: classInfo.class_name || 'Unknown Class',
            subject: classInfo.subject || 'General',
            grade_level: classInfo.grade_levels?.grade_level || classInfo.grade_level_id || 'K',
            grade_name: classInfo.grade_levels?.grade_name || 'Kindergarten',
            is_primary: assignment.is_primary_teacher,
            assigned_at: assignment.assigned_at
          }]
        })
      }
    })

    // Convert map to array and format for frontend
    const teachers = Array.from(teacherMap.values()).map((teacher: any) => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      subject: teacher.classes.length === 1 
        ? teacher.classes[0].subject 
        : `${teacher.classes.length} subjects`,
      avatar: '', // Will be generated from initials in frontend
      isOnline: teacher.isOnline,
      lastSeen: teacher.lastSeen,
      classes: teacher.classes,
      primarySubject: teacher.classes.find((c: any) => c.is_primary)?.subject || teacher.classes[0]?.subject
    }))

    console.log('Processed teachers:', teachers.length)

    return NextResponse.json({ teachers })

  } catch (error) {
    console.error('Error fetching student assigned teachers:', error)
    return NextResponse.json({ teachers: [] })
  }
}

// Helper function to determine if user was recently active (within last 30 minutes)
function isRecentlyActive(updatedAt: string): boolean {
  if (!updatedAt) return false
  const lastUpdate = new Date(updatedAt)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
  return lastUpdate > thirtyMinutesAgo
}

// Helper function to get human-readable last seen text
function getLastSeenText(updatedAt: string): string {
  if (!updatedAt) return 'Never'
  
  const lastUpdate = new Date(updatedAt)
  const now = new Date()
  const diffMs = now.getTime() - lastUpdate.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return 'Over a week ago'
}
