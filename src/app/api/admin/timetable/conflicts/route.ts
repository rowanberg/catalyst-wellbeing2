import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/timetable/conflicts - Detect conflicts for a potential entry
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { teacherId, dayOfWeek, timeSlotId, roomNumber, excludeEntryId } = body

    if (!dayOfWeek || !timeSlotId) {
      return NextResponse.json({ error: 'dayOfWeek and timeSlotId are required' }, { status: 400 })
    }

    const conflicts: any[] = []

    // Check teacher conflicts
    if (teacherId) {
      const { data: teacherConflicts, error: teacherError } = await supabase
        .rpc('detect_teacher_conflicts', {
          p_teacher_id: teacherId,
          p_day_of_week: dayOfWeek,
          p_time_slot_id: timeSlotId,
          p_exclude_entry_id: excludeEntryId || null
        })

      if (teacherError) {
        console.error('Error checking teacher conflicts:', teacherError)
      } else if (teacherConflicts && teacherConflicts.length > 0) {
        conflicts.push(...teacherConflicts.map((c: any) => ({
          type: 'teacher',
          message: c.conflict_message
        })))
      }
    }

    // Check room conflicts
    if (roomNumber) {
      const { data: roomConflicts, error: roomError } = await supabase
        .rpc('detect_room_conflicts', {
          p_school_id: profile.school_id,
          p_room_number: roomNumber,
          p_day_of_week: dayOfWeek,
          p_time_slot_id: timeSlotId,
          p_exclude_entry_id: excludeEntryId || null
        })

      if (roomError) {
        console.error('Error checking room conflicts:', roomError)
      } else if (roomConflicts && roomConflicts.length > 0) {
        conflicts.push(...roomConflicts.map((c: any) => ({
          type: 'room',
          message: c.conflict_message
        })))
      }
    }

    return NextResponse.json({ 
      hasConflicts: conflicts.length > 0,
      conflicts 
    })
  } catch (error) {
    console.error('Error in conflicts POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
