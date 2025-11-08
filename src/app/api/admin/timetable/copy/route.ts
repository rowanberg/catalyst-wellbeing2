import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/timetable/copy - Copy timetable from one class to another
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

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { sourceClassId, targetClassId } = body

    if (!sourceClassId || !targetClassId) {
      return NextResponse.json({ error: 'sourceClassId and targetClassId are required' }, { status: 400 })
    }

    if (sourceClassId === targetClassId) {
      return NextResponse.json({ error: 'Source and target classes must be different' }, { status: 400 })
    }

    // Use the database function to copy timetable
    const { data: copiedCount, error: copyError } = await supabase
      .rpc('copy_timetable_to_class', {
        p_source_class_id: sourceClassId,
        p_target_class_id: targetClassId,
        p_school_id: profile.school_id,
        p_created_by: user.id
      })

    if (copyError) {
      console.error('Error copying timetable:', copyError)
      return NextResponse.json({ error: 'Failed to copy timetable' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      copiedCount,
      message: `Successfully copied ${copiedCount} entries`
    })
  } catch (error) {
    console.error('Error in copy POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
