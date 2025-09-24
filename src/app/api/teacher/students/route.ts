import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')
    const classId = searchParams.get('class_id')

    console.log('🔍 Students API called with:', { schoolId, classId })

    if (!schoolId || !classId) {
      return NextResponse.json(
        { message: 'School ID and Class ID are required' },
        { status: 400 }
      )
    }

    // Get students through student_class_assignments table
    const { data: classAssignments, error: assignmentError } = await supabaseAdmin
      .from('student_class_assignments')
      .select(`
        student_id,
        profiles!inner(*)
      `)
      .eq('class_id', classId)
      .eq('is_active', true)
    
    if (assignmentError) {
      console.error('❌ Class assignments query failed:', assignmentError.message)
      return NextResponse.json({
        students: [],
        total: 0,
        error: 'Failed to fetch class assignments'
      })
    }

    if (!classAssignments || classAssignments.length === 0) {
      console.log('⚠️ No students assigned to this class')
      return NextResponse.json({
        students: [],
        total: 0
      })
    }

    console.log('✅ Found', classAssignments.length, 'class assignments')
    console.log('📋 Raw assignments:', classAssignments)

    // Get student IDs to fetch emails separately
    const studentIds = classAssignments.map(assignment => assignment.student_id).filter(Boolean)
    
    // Fetch emails from users table using student IDs
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .in('id', studentIds)
    
    if (usersError) {
      console.error('⚠️ Failed to fetch user emails:', usersError.message)
    }
    
    console.log('📧 User emails fetched:', usersData)

    // Create a map of user ID to email for quick lookup
    const emailMap = new Map()
    if (usersData) {
      usersData.forEach(user => {
        emailMap.set(user.id, user.email)
      })
    }

    const students = classAssignments.map(assignment => {
      const profile = Array.isArray(assignment.profiles) ? assignment.profiles[0] : assignment.profiles
      const email = emailMap.get(assignment.student_id) || profile?.email
      
      return {
        id: profile?.id || assignment.student_id,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        email: email, // Get email from users table lookup
        student_number: profile?.student_number,
        role: profile?.role,
        school_id: profile?.school_id
      }
    }).filter(student => student.id) // Only include students with valid IDs

    console.log('📊 Final processed students:', students.length, students)

    return NextResponse.json({
      students: students,
      total: students.length
    })

  } catch (error: any) {
    console.error('❌ Error fetching students:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
