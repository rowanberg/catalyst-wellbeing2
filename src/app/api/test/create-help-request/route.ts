import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE TEST HELP REQUEST API START ===')
    
    // Get admin's session
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
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

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile to find their school
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        role, 
        school_id,
        schools!profiles_school_id_fkey (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!adminProfile.school_id) {
      return NextResponse.json({ error: 'Admin not associated with a school' }, { status: 400 })
    }

    // Find a student in the same school to create help request from
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name')
      .eq('school_id', adminProfile.school_id)
      .eq('role', 'student')
      .limit(1)

    if (studentsError || !students || students.length === 0) {
      // Create a test student profile if none exists
      const testStudentId = crypto.randomUUID()
      
      const { error: insertStudentError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: testStudentId,
          first_name: 'Test',
          last_name: 'Student',
          role: 'student',
          school_id: adminProfile.school_id,
          grade_level: '5th Grade',
          class_name: 'Test Class'
        })

      if (insertStudentError) {
        console.error('Error creating test student:', insertStudentError)
        return NextResponse.json({ 
          error: 'Failed to create test student',
          details: insertStudentError.message 
        }, { status: 500 })
      }

      // Create test help request
      const { data: helpRequest, error: helpRequestError } = await supabaseAdmin
        .from('help_requests')
        .insert({
          student_id: testStudentId,
          school_id: adminProfile.school_id,
          message: 'This is a test help request created for debugging purposes.',
          urgency: 'medium',
          status: 'pending'
        })
        .select()

      if (helpRequestError) {
        console.error('Error creating test help request:', helpRequestError)
        return NextResponse.json({ 
          error: 'Failed to create test help request',
          details: helpRequestError.message 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Created test student and help request',
        data: {
          studentId: testStudentId,
          helpRequest: helpRequest?.[0],
          schoolId: adminProfile.school_id,
          schoolName: (adminProfile.schools as any)?.name
        }
      })
    } else {
      // Use existing student
      const student = students[0]
      
      const { data: helpRequest, error: helpRequestError } = await supabaseAdmin
        .from('help_requests')
        .insert({
          student_id: student.user_id,
          school_id: adminProfile.school_id,
          message: `Test help request from ${student.first_name} ${student.last_name} - created for debugging purposes.`,
          urgency: 'high',
          status: 'pending'
        })
        .select()

      if (helpRequestError) {
        console.error('Error creating help request:', helpRequestError)
        return NextResponse.json({ 
          error: 'Failed to create help request',
          details: helpRequestError.message 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Created test help request',
        data: {
          studentId: student.user_id,
          studentName: `${student.first_name} ${student.last_name}`,
          helpRequest: helpRequest?.[0],
          schoolId: adminProfile.school_id,
          schoolName: (adminProfile.schools as any)?.name
        }
      })
    }

  } catch (error) {
    console.error('Create test help request error:', error)
    return NextResponse.json({
      error: 'Failed to create test help request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
