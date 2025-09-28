import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
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
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Get user's profile to verify they are an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    console.log('Profile data:', profile)
    console.log('Profile error:', profileError)

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Profile not found. Please ensure you have a valid admin profile.' }, { status: 404 })
    }

    if (profile.role !== 'admin') {
      console.error('User role is not admin:', profile.role)
      return NextResponse.json({ error: `Access denied. Admin role required. Current role: ${profile.role}` }, { status: 403 })
    }

    // Get all students from the same school_id using admin client to bypass RLS
    console.log('Querying students with school_id:', profile.school_id)
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        xp,
        gems,
        level,
        created_at
      `)
      .eq('school_id', profile.school_id)
      .eq('role', 'student')
      .order('last_name', { ascending: true })
    
    console.log('Students query error:', studentsError)
    console.log('Raw students data:', students)

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    console.log('Students found:', students?.length || 0)
    console.log('Admin school_id:', profile.school_id)
    console.log('Student data:', students?.map(s => ({ name: `${s.first_name} ${s.last_name}`, id: s.id })))

    // Transform the data to match expected format
    const formattedStudents = students?.map((student: any) => ({
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      grade: 'N/A',
      class: 'Unassigned',
      totalXP: student.xp || 0,
      level: student.level || 1,
      completedQuests: Math.floor((student.xp || 0) / 50), // Estimate based on XP
      streak: 0,
      mood: 'neutral',
      wellbeingStatus: 'managing',
      gems: student.gems || 0,
      joinedDate: student.created_at,
      subjects: [
        { name: 'Mathematics', progress: 75 + Math.floor(Math.random() * 25), grade: 'B+' },
        { name: 'Science', progress: 70 + Math.floor(Math.random() * 30), grade: 'B' },
        { name: 'English', progress: 80 + Math.floor(Math.random() * 20), grade: 'A-' },
        { name: 'Social Studies', progress: 65 + Math.floor(Math.random() * 35), grade: 'B+' }
      ]
    })) || []

    return NextResponse.json({
      students: formattedStudents,
      total: formattedStudents.length,
      grades: [],
      classes: [],
      schoolId: profile.school_id
    })

  } catch (error) {
    console.error('Error in admin students API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to convert progress percentage to letter grade
function getGradeFromProgress(progress: number): string {
  if (progress >= 95) return 'A+'
  if (progress >= 90) return 'A'
  if (progress >= 85) return 'A-'
  if (progress >= 80) return 'B+'
  if (progress >= 75) return 'B'
  if (progress >= 70) return 'B-'
  if (progress >= 65) return 'C+'
  if (progress >= 60) return 'C'
  return 'C-'
}
