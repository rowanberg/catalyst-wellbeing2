import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    console.log('🏫 Fetching teacher school information...')

    // Get user from session
    const authHeader = request.headers.get('authorization')
    const sessionToken = request.cookies.get('sb-access-token')?.value

    if (!authHeader && !sessionToken) {
      console.log('❌ No authorization found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client for user session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ User authentication failed:', userError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    console.log('👤 Authenticated user:', user.email)

    // Get teacher profile to find school_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .eq('role', 'teacher')
      .single()

    if (profileError || !profile) {
      console.log('❌ Teacher profile not found:', profileError)
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    if (!profile.school_id) {
      console.log('❌ No school associated with teacher')
      return NextResponse.json({ error: 'No school associated with teacher' }, { status: 404 })
    }

    console.log('🏫 Teacher school_id:', profile.school_id)

    // Fetch school basic information
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
      .single()

    if (schoolError) {
      console.log('❌ Error fetching school:', schoolError)
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Fetch detailed school information from school_details if available
    const { data: schoolDetails, error: detailsError } = await supabaseAdmin
      .from('school_details')
      .select('*')
      .eq('school_id', profile.school_id)
      .single()

    if (detailsError) {
      console.log('⚠️ School details not found, using basic school info:', detailsError)
    }

    // Get school statistics
    const [studentsResult, teachersResult, gradesResult] = await Promise.all([
      // Count total students
      supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('school_id', profile.school_id)
        .eq('role', 'student'),
      
      // Count total teachers
      supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('school_id', profile.school_id)
        .eq('role', 'teacher'),
      
      // Get available grade levels
      supabaseAdmin
        .from('grade_levels')
        .select('name')
        .eq('school_id', profile.school_id)
        .order('name')
    ])

    const totalStudents = studentsResult.count || 0
    const totalTeachers = teachersResult.count || 0
    const gradeNames = gradesResult.data?.map(g => g.name) || []

    console.log('📊 School statistics:', { totalStudents, totalTeachers, gradeNames })

    // Combine school information
    const schoolInfo = {
      // Basic school info
      id: school.id,
      name: school.name,
      address: school.address,
      city: school.city,
      state: school.state,
      postal_code: school.postal_code,
      phone: school.phone,
      email: school.email,
      website: school.website,
      school_type: school.school_type,
      established_year: school.established_year,
      
      // Detailed info from school_details if available
      principal_name: schoolDetails?.principal_name || school.principal_name,
      mission_statement: schoolDetails?.mission_statement,
      vision_statement: schoolDetails?.vision_statement,
      school_hours: schoolDetails?.school_hours || '8:00 AM - 3:30 PM',
      office_hours: schoolDetails?.office_hours || '7:30 AM - 4:30 PM',
      emergency_contact: schoolDetails?.emergency_contact,
      nurse_extension: schoolDetails?.nurse_extension,
      security_extension: schoolDetails?.security_extension,
      
      // Statistics
      total_students: totalStudents,
      total_teachers: totalTeachers,
      grade_levels: gradeNames,
      
      // Computed fields
      student_teacher_ratio: totalTeachers > 0 ? Math.round(totalStudents / totalTeachers) : 0,
      
      // Default values for missing fields
      core_values: schoolDetails?.core_values || ['Excellence', 'Integrity', 'Innovation', 'Collaboration', 'Respect'],
      achievements: [
        'Serving the community since ' + (school.established_year || 'establishment'),
        `${totalStudents} students enrolled`,
        `${totalTeachers} dedicated teachers`,
        'Committed to educational excellence'
      ],
      facilities: [
        'Classrooms',
        'Library',
        'Computer Lab',
        'Sports Facilities',
        'Cafeteria',
        'Administrative Offices'
      ]
    }

    console.log('✅ School information compiled successfully')

    return NextResponse.json({
      success: true,
      school: schoolInfo
    })

  } catch (error) {
    console.error('❌ Error in teacher school-info API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
