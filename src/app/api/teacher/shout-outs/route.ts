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

    // Get user profile to verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Get shout-outs from the teacher's school
    const { data: shoutOuts, error: shoutOutsError } = await supabase
      .from('student_shout_outs')
      .select(`
        id,
        student_id,
        category,
        message,
        is_public,
        badge,
        reactions,
        created_at,
        student:student_id!inner (
          first_name,
          last_name
        ),
        teacher:teacher_id!inner (
          first_name,
          last_name
        )
      `)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (shoutOutsError) {
      console.error('Error fetching shout-outs:', shoutOutsError)
      return NextResponse.json({ error: 'Failed to fetch shout-outs' }, { status: 500 })
    }

    // Format shout-outs data
    const formattedShoutOuts = shoutOuts?.map(shoutOut => ({
      id: shoutOut.id,
      studentId: shoutOut.student_id,
      studentName: `${(shoutOut.student as any).first_name} ${(shoutOut.student as any).last_name}`,
      teacherName: `${(shoutOut.teacher as any).first_name} ${(shoutOut.teacher as any).last_name}`,
      category: shoutOut.category,
      message: shoutOut.message,
      isPublic: shoutOut.is_public,
      badge: shoutOut.badge,
      reactions: shoutOut.reactions || 0,
      createdAt: shoutOut.created_at
    })) || []

    return NextResponse.json({ shoutOuts: formattedShoutOuts })

  } catch (error: any) {
    console.error('Unexpected error in shout-outs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
