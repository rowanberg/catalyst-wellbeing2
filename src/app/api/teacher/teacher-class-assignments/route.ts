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
      // Try to get user from session like other APIs do
      const { createSupabaseServerClient } = await import('@/lib/supabase-server')
      
      const supabase = await createSupabaseServerClient()

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      teacherId = user.id
    }


    // Simple query first - get assignments
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('teacher_class_assignments')
      .select('id, class_id, is_primary_teacher, subject, assigned_at')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false })


    if (assignmentsError) {
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { classIds, primaryClassId, subject } = body

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return NextResponse.json(
        { error: 'Class IDs are required' },
        { status: 400 }
      )
    }

    // Get teacher ID from session
    const { createSupabaseServerClient } = await import('@/lib/supabase-server')
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const teacherId = user.id

    // Get teacher's school_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('school_id')
      .eq('user_id', teacherId)
      .single()

    if (!profile?.school_id) {
      return NextResponse.json(
        { error: 'Teacher school not found' },
        { status: 400 }
      )
    }

    // First, deactivate all existing assignments for this teacher
    await supabaseAdmin
      .from('teacher_class_assignments')
      .update({ is_active: false })
      .eq('teacher_id', teacherId)

    // Insert new assignments
    const assignments = classIds.map((classId: string) => ({
      teacher_id: teacherId,
      class_id: classId,
      school_id: profile.school_id,
      subject: subject || 'General',
      is_primary_teacher: classId === (primaryClassId || classIds[0]),
      is_active: true
    }))

    const { error: insertError } = await supabaseAdmin
      .from('teacher_class_assignments')
      .upsert(assignments, {
        onConflict: 'teacher_id,class_id',
        ignoreDuplicates: false
      })

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to save class assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Class assignments saved successfully'
    })

  } catch (error) {
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
