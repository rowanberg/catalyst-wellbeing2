import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let teacherId = searchParams.get('teacher_id')

    // If no teacher_id provided, try to get it from the authenticated session
    if (!teacherId) {
      console.log('🔍 No teacher_id parameter, trying to get from session...')
      
      // Try to get user from session like other APIs do
      const { createServerClient } = await import('@supabase/ssr')
      const { cookies } = await import('next/headers')
      
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

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Authentication failed:', authError)
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      teacherId = user.id
      console.log('✅ Got teacher_id from session:', teacherId)
    } else {
      console.log('✅ Got teacher_id from parameter:', teacherId)
    }


    // Simple query first - get assignments
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('teacher_class_assignments')
      .select('id, class_id, is_primary_teacher, subject, assigned_at')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false })


    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ 
        assignments: [],
        success: true,
        message: 'No class assignments found'
      })
    }

    // Get class IDs and fetch classes in bulk
    const classIds = assignments.map((a: any) => a.class_id)

    const { data: classes, error: classesError } = await supabaseAdmin
      .from('classes')
      .select(`
        id,
        class_name,
        class_code,
        subject,
        room_number,
        current_students,
        max_students,
        grade_level_id,
        grade_levels (
          grade_level
        )
      `)
      .in('id', classIds)


    // Combine assignments with class data
    const assignmentsWithClasses = assignments.map((assignment: any) => {
      const classData = classes?.find((c: any) => c.id === assignment.class_id)
      return {
        ...assignment,
        classes: classData || null
      }
    })


    return NextResponse.json({ 
      assignments: assignmentsWithClasses,
      success: true 
    })

  } catch (error) {
    console.error('Error in class-assignments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { teacher_id, class_id } = body

    if (!teacher_id || !class_id) {
      return NextResponse.json(
        { error: 'Teacher ID and Class ID are required' },
        { status: 400 }
      )
    }

    // Check if the assignment exists
    const { data: existingAssignment, error: checkError } = await supabaseAdmin
      .from('teacher_class_assignments')
      .select('id, is_primary_teacher')
      .eq('teacher_id', teacher_id)
      .eq('class_id', class_id)
      .eq('is_active', true)
      .single()

    if (checkError || !existingAssignment) {
      return NextResponse.json(
        { error: 'Class assignment not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabaseAdmin
      .from('teacher_class_assignments')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('teacher_id', teacher_id)
      .eq('class_id', class_id)

    if (deleteError) {
      console.error('Error deleting class assignment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove class assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Class assignment removed successfully'
    })

  } catch (error) {
    console.error('Error in DELETE class-assignments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
