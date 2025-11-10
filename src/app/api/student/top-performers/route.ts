import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Fetch top performers from student's class
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
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can view top performers' },
        { status: 403 }
      )
    }

    // Get student's class
    const { data: studentClass } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', profile.id)
      .single()

    if (!studentClass) {
      return NextResponse.json({
        success: true,
        topPerformers: []
      })
    }

    // Get all students in the same class with their XP and gems
    const { data: classStudents } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', studentClass.class_id)

    if (!classStudents || classStudents.length === 0) {
      return NextResponse.json({
        success: true,
        topPerformers: []
      })
    }

    const studentIds = classStudents.map(cs => cs.student_id)

    // Fetch student profiles with XP and gems
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, last_name, xp, gems')
      .in('id', studentIds)
      .order('xp', { ascending: false })
      .limit(10)

    if (studentsError) {
      return NextResponse.json(
        { error: 'Failed to fetch top performers' },
        { status: 500 }
      )
    }

    // Get achievement counts for these students
    const { data: achievements } = await supabase
      .from('student_achievements')
      .select('student_id')
      .in('student_id', students?.map(s => s.id) || [])

    const achievementCounts = achievements?.reduce((acc, a) => {
      acc[a.student_id] = (acc[a.student_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Transform to match interface
    const topPerformers = students?.map(student => ({
      id: student.id,
      name: student.full_name || `${student.first_name} ${student.last_name}` || 'Student',
      xp: student.xp || 0,
      gems: student.gems || 0,
      achievement_count: achievementCounts[student.id] || 0
    })) || []

    return NextResponse.json({
      success: true,
      topPerformers
    })

  } catch (error) {
    console.error('Error fetching top performers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
