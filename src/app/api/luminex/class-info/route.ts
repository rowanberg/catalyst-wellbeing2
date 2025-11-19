import { NextRequest, NextResponse } from 'next/server'
import { authenticateTeacher, isAuthError } from '@/lib/auth/api-auth'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateTeacher(request)
    if (isAuthError(auth)) {
      if (auth.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      if (auth.status === 403) return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status })
    }

    const { supabase, userId } = auth
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get active class assignments for the teacher
    const { data: assignments, error: aErr } = await supabase
      .from('teacher_class_assignments')
      .select('class_id, is_primary_teacher')
      .eq('teacher_id', userId)
      .eq('is_active', true)

    if (aErr) {
      console.error('[luminex/class-info] assignments error', aErr)
      return NextResponse.json({ error: 'Failed to fetch teacher assignments' }, { status: 500 })
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ classes: [] })
    }

    const classIds = assignments.map(a => a.class_id)

    // Fetch classes metadata
    const { data: classes, error: cErr } = await supabaseAdmin
      .from('classes')
      .select('id, class_name, subject, grade_level_id, room_number')
      .in('id', classIds)

    if (cErr) {
      console.error('[luminex/class-info] classes error', cErr)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    // Map grade levels if available
    let gradeLevels: any[] = []
    const gradeLevelIds = (classes || [])
      .map(c => c.grade_level_id)
      .filter(Boolean)

    if (gradeLevelIds.length > 0) {
      const { data: grades } = await supabaseAdmin
        .from('grade_levels')
        .select('id, grade_level')
        .in('id', gradeLevelIds)
      gradeLevels = grades || []
    }

    const items = (classes || []).map(c => ({
      id: c.id,
      class_name: c.class_name,
      subject: c.subject,
      grade_level: gradeLevels.find(g => g.id === (c as any).grade_level_id)?.grade_level,
      room_number: (c as any).room_number
    }))

    return NextResponse.json({ classes: items })
  } catch (e: any) {
    console.error('[luminex/class-info] error', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
