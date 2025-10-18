import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { class_id } = body

    if (!class_id) {
      return NextResponse.json(
        { error: 'Class ID is required' },
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

    // First, set all teacher's classes to non-primary
    await supabaseAdmin
      .from('teacher_class_assignments')
      .update({ is_primary_teacher: false })
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    // Then set the selected class as primary
    const { error: updateError } = await supabaseAdmin
      .from('teacher_class_assignments')
      .update({ is_primary_teacher: true })
      .eq('teacher_id', teacherId)
      .eq('class_id', class_id)
      .eq('is_active', true)

    if (updateError) {
      console.error('Error setting primary class:', updateError)
      return NextResponse.json(
        { error: 'Failed to set primary class' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Primary class updated successfully'
    })

  } catch (error) {
    console.error('Error in set-primary-class API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
