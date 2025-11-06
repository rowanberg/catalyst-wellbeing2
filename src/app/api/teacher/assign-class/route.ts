import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { invalidateTeacherAssignments } from '@/lib/redis-teachers'
import { invalidateAttendanceCache } from '@/lib/prefetch/attendancePrefetch'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { teacher_id, class_id, assign } = await request.json()

    if (!teacher_id || !class_id) {
      return NextResponse.json(
        { error: 'Teacher ID and Class ID are required' },
        { status: 400 }
      )
    }

    if (assign) {
      // Check if assignment already exists to avoid duplicates
      const { data: existingAssignment } = await supabaseAdmin
        .from('teacher_class_assignments')
        .select('id')
        .eq('teacher_id', teacher_id)
        .eq('class_id', class_id)
        .single()

      if (existingAssignment) {
        return NextResponse.json({ 
          success: true,
          message: 'Teacher is already assigned to this class'
        })
      }

      // Assign teacher to class
      const { error: assignError } = await supabaseAdmin
        .from('teacher_class_assignments')
        .insert({
          teacher_id,
          class_id,
          is_primary_teacher: false, // Default to false, can be updated later
          assigned_at: new Date().toISOString()
        })

      if (assignError) {
        console.error('Error assigning teacher to class:', assignError)
        return NextResponse.json(
          { error: 'Failed to assign teacher to class' },
          { status: 500 }
        )
      }

      // Invalidate caches after successful assignment
      console.log(`✅ Teacher ${teacher_id} assigned to class ${class_id}`)
      await invalidateTeacherAssignments(teacher_id)
      invalidateAttendanceCache(`class-assignments:${teacher_id}`)

    } else {
      // Remove teacher from class
      const { error: removeError } = await supabaseAdmin
        .from('teacher_class_assignments')
        .delete()
        .eq('teacher_id', teacher_id)
        .eq('class_id', class_id)

      if (removeError) {
        console.error('Error removing teacher from class:', removeError)
        return NextResponse.json(
          { error: 'Failed to remove teacher from class' },
          { status: 500 }
        )
      }

      // Invalidate caches after successful removal
      console.log(`✅ Teacher ${teacher_id} removed from class ${class_id}`)
      await invalidateTeacherAssignments(teacher_id)
      invalidateAttendanceCache(`class-assignments:${teacher_id}`)

    }

    return NextResponse.json({ 
      success: true,
      message: assign ? 'Teacher assigned to class successfully' : 'Teacher removed from class successfully'
    })

  } catch (error) {
    console.error('Error in teacher class assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
