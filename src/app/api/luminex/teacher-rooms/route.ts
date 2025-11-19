import { NextRequest, NextResponse } from 'next/server'
import { authenticateTeacher, isAuthError } from '@/lib/auth/api-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateTeacher(request)
    if (isAuthError(auth)) {
      if (auth.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      if (auth.status === 403) return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status })
    }

    const { supabase, userId } = auth
    const { includeDevices } = await request.json().catch(() => ({ includeDevices: false }))

    // Fetch teacher classes and room numbers
    const { data: assignments } = await supabase
      .from('teacher_class_assignments')
      .select('class_id')
      .eq('teacher_id', userId)
      .eq('is_active', true)

    const classIds = (assignments || []).map((a: any) => a.class_id)

    let classes: any[] = []
    if (classIds.length > 0) {
      const { data } = await supabase
        .from('classes')
        .select('id, class_name, room_number, subject')
        .in('id', classIds)
      classes = data || []
    }

    let devices: any[] | undefined
    if (includeDevices) {
      const { data } = await supabase
        .from('luminex_teacher_devices')
        .select('id, device_id, device_metadata, created_at')
        .eq('teacher_id', userId)
        .order('created_at', { ascending: false })
      devices = data || []
    }

    return NextResponse.json({
      rooms: classes.map((c) => ({
        id: c.id,
        name: c.class_name,
        room: c.room_number,
        subject: c.subject,
      })),
      devices
    })
  } catch (e: any) {
    console.error('[luminex/teacher-rooms] error', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
