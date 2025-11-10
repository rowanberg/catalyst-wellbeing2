import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Fetch class shout-outs for student's class
export async function GET(request: Request) {
  try {
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get student profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can view class shout-outs' },
        { status: 403 }
      )
    }

    console.log(`🎓 Student: ${profile.first_name} ${profile.last_name}`)
    console.log(`🏫 Student's school_id: ${profile.school_id}`)

    // Fetch ALL public shout-outs from the school (last 60 days)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const { data: shoutOuts, error: shoutOutsError } = await supabase
      .from('student_shout_outs')
      .select(`
        id,
        student_id,
        teacher_id,
        category,
        message,
        badge,
        is_public,
        created_at
      `)
      .eq('school_id', profile.school_id)
      .eq('is_public', true)
      .gte('created_at', sixtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (shoutOutsError) {
      console.error('Shout-outs query error:', shoutOutsError)
      return NextResponse.json(
        { error: 'Failed to fetch shout-outs' },
        { status: 500 }
      )
    }

    console.log(`Found ${shoutOuts?.length || 0} shout-outs for school ${profile.school_id}`)
    
    // If no shout-outs found, check if ANY exist in the table
    if (!shoutOuts || shoutOuts.length === 0) {
      const { data: anyShoutOuts, count } = await supabase
        .from('student_shout_outs')
        .select('id', { count: 'exact' })
        .eq('school_id', profile.school_id)
        .limit(1)
      
      console.log(`Total shout-outs in school (any): ${count}`)
      
      const { data: publicCount, count: pubCount } = await supabase
        .from('student_shout_outs')
        .select('id', { count: 'exact' })
        .eq('school_id', profile.school_id)
        .eq('is_public', true)
        .limit(1)
      
      console.log(`Public shout-outs in school: ${pubCount}`)
      
      // Check what school_ids actually exist in shout-outs table
      const { data: allSchools } = await supabase
        .from('student_shout_outs')
        .select('school_id, is_public, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log(`📋 Recent shout-outs from ALL schools:`, allSchools)
      console.log(`🔍 Looking for school_id: ${profile.school_id}`)
    }

    // Get student and teacher names
    const studentIds = Array.from(new Set(shoutOuts?.map(s => s.student_id) || []))
    const teacherIds = Array.from(new Set(shoutOuts?.map(s => s.teacher_id) || []))

    // Fetch all student and teacher names
    console.log(`📝 Fetching names for ${studentIds.length} students and ${teacherIds.length} teachers`)
    
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', studentIds)

    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', teacherIds)

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError)
    }
    if (teachersError) {
      console.error('❌ Error fetching teachers:', teachersError)
    }

    console.log(`👥 Found ${students?.length || 0} student profiles`)
    console.log(`👨‍🏫 Found ${teachers?.length || 0} teacher profiles`)

    const studentMap = Object.fromEntries(
      students?.map(s => [s.id, `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown']) || []
    )
    
    const teacherMap = Object.fromEntries(
      teachers?.map(t => [t.id, `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Teacher']) || []
    )
    
    console.log(`📋 Student map:`, studentMap)
    console.log(`📋 Teacher map:`, teacherMap)

    // Transform shout-outs - show ALL school shout-outs
    const transformedShoutOuts = shoutOuts?.map(shoutOut => ({
        id: shoutOut.id,
        student_id: shoutOut.student_id,
        student_name: studentMap[shoutOut.student_id] || 'Student',
        category: shoutOut.category,
        message: shoutOut.message,
        badge: shoutOut.badge,
        teacher_name: teacherMap[shoutOut.teacher_id] || 'Teacher',
        is_public: shoutOut.is_public,
        created_at: shoutOut.created_at
      })) || []

    return NextResponse.json({
      success: true,
      shoutOuts: transformedShoutOuts
    })

  } catch (error) {
    console.error('Error fetching class shout-outs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
