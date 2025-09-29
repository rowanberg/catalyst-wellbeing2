import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Create Supabase client with cookie-based auth
async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
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
}

export async function GET(request: NextRequest) {
  try {
    console.log('🏫 Fetching teacher school information...')

    const supabase = await createSupabaseServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ User authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('👤 Authenticated user:', user.email)

    // Get teacher profile to find school_id
    const { data: profile, error: profileError } = await supabase
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

    // Fetch school basic information (without .single() first to avoid PGRST116)
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
    
    console.log('🔍 School query result:', { schoolData, schoolError, school_id: profile.school_id })
    
    const school = schoolData?.[0] || null

    if (schoolError || !school) {
      console.log('❌ Error fetching school or school not found:', schoolError)
      console.log('❌ School data received:', schoolData)
      console.log('❌ School object:', school)
      if (schoolError) {
        console.log('❌ School error details:', JSON.stringify(schoolError))
      }
      
      // Use fallback if school doesn't exist or has error
      if (!school || schoolError?.code === 'PGRST116') {
        console.log('⚠️ School record not found, providing fallback data')
        
        const fallbackSchoolInfo = {
          id: profile.school_id,
          name: 'School Information Not Available',
          address: 'Address not configured',
          city: 'City',
          state: 'State',
          postal_code: '00000',
          phone: 'Phone not available',
          email: 'Email not configured',
          website: 'Website not available',
          school_type: 'Not specified',
          established_year: new Date().getFullYear(),
          principal_name: 'Principal name not set',
          mission_statement: 'School information is not configured. Please contact your administrator to set up school details in the admin dashboard.',
          vision_statement: 'School vision statement not configured.',
          school_hours: '8:00 AM - 3:30 PM',
          office_hours: '7:30 AM - 4:30 PM',
          emergency_contact: 'Emergency contact not configured',
          nurse_extension: '123',
          security_extension: '456',
          total_students: 0,
          total_teachers: 0,
          grade_levels: ['Please configure school information'],
          student_teacher_ratio: 0,
          core_values: ['Please contact administrator to configure school information'],
          achievements: ['School information needs to be configured'],
          facilities: ['Please contact administrator to configure school details']
        }

        return NextResponse.json({
          success: true,
          school: fallbackSchoolInfo,
          message: 'School information not configured. Please contact your administrator.'
        })
      }
      
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    console.log('✅ School record found:', school)

    // Fetch detailed school information from school_details (primary source)
    const { data: schoolDetailsData, error: detailsError } = await supabase
      .from('school_details')
      .select('*')
      .eq('school_id', profile.school_id)
    
    console.log('🔍 School details query result:', { 
      schoolDetailsData, 
      detailsError, 
      school_id: profile.school_id,
      dataLength: schoolDetailsData?.length,
      hasData: !!schoolDetailsData?.[0]
    })
    
    const schoolDetails = schoolDetailsData?.[0] || null

    if (detailsError) {
      console.log('⚠️ Error fetching school details:', detailsError)
      console.log('⚠️ School details error details:', JSON.stringify(detailsError))
    }
    
    if (schoolDetails) {
      console.log('✅ School details found with keys:', Object.keys(schoolDetails))
      console.log('✅ School details sample data:', {
        school_name: schoolDetails.school_name,
        principal_name: schoolDetails.principal_name,
        address: schoolDetails.address,
        city: schoolDetails.city,
        setup_completed: schoolDetails.setup_completed
      })
    } else {
      console.log('⚠️ No school details configured, using basic school info')
      console.log('⚠️ School details data received:', schoolDetailsData)
      console.log('⚠️ This means either:')
      console.log('   1. No school_details record exists for this school_id')
      console.log('   2. RLS policy is blocking access to school_details')
      console.log('   3. school_details table does not exist')
    }

    // Get school statistics with error handling
    let totalStudents = 0
    let totalTeachers = 0
    let gradeNames: string[] = []

    try {
      const [studentsResult, teachersResult, gradesResult] = await Promise.all([
        // Count total students
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('school_id', profile.school_id)
          .eq('role', 'student'),
        
        // Count total teachers
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('school_id', profile.school_id)
          .eq('role', 'teacher'),
        
        // Get available grade levels
        supabase
          .from('grade_levels')
          .select('name')
          .eq('school_id', profile.school_id)
          .order('name')
      ])

      totalStudents = studentsResult.count || 0
      totalTeachers = teachersResult.count || 0
      gradeNames = gradesResult.data?.map((g: any) => g.name) || []
      
      if (studentsResult.error) console.log('⚠️ Error counting students:', studentsResult.error)
      if (teachersResult.error) console.log('⚠️ Error counting teachers:', teachersResult.error)
      if (gradesResult.error) console.log('⚠️ Error fetching grades:', gradesResult.error)
      
    } catch (statsError) {
      console.log('⚠️ Error fetching school statistics:', statsError)
      // Use default values if statistics queries fail
    }

    console.log('📊 School statistics:', { totalStudents, totalTeachers, gradeNames })

    // Combine school information prioritizing school_details table with correct column names
    const schoolInfo = {
      // Basic info - prioritize school_details, fallback to schools table
      id: school.id,
      name: schoolDetails?.school_name || school.name || 'School Name Not Set',
      address: schoolDetails?.street_address || school.address || 'Address not configured',
      city: schoolDetails?.city || 'City not specified',
      state: schoolDetails?.state_province || 'State not specified',
      postal_code: schoolDetails?.postal_code || '00000',
      phone: schoolDetails?.primary_phone || school.phone || 'Phone not available',
      email: schoolDetails?.primary_email || school.email || 'Email not configured',
      website: schoolDetails?.website_url || school.website || 'Website not available',
      school_type: schoolDetails?.school_type || 'Not specified',
      established_year: schoolDetails?.established_year || new Date().getFullYear(),
      
      // Detailed info from school_details using correct column names
      principal_name: schoolDetails?.principal_name || 'Principal name not set',
      mission_statement: schoolDetails?.school_mission || 'School mission statement not configured. Please contact your administrator to set up school information.',
      vision_statement: schoolDetails?.school_vision || 'School vision statement not configured.',
      school_hours: schoolDetails?.school_start_time && schoolDetails?.school_end_time 
        ? `${schoolDetails.school_start_time} - ${schoolDetails.school_end_time}`
        : '8:00 AM - 3:30 PM',
      office_hours: schoolDetails?.office_start_time && schoolDetails?.office_end_time
        ? `${schoolDetails.office_start_time} - ${schoolDetails.office_end_time}`
        : '7:30 AM - 4:30 PM',
      emergency_contact: schoolDetails?.emergency_contact_name && schoolDetails?.emergency_contact_phone
        ? `${schoolDetails.emergency_contact_name}: ${schoolDetails.emergency_contact_phone}`
        : 'Emergency contact not configured',
      nurse_extension: schoolDetails?.school_nurse_extension || '123',
      security_extension: schoolDetails?.security_extension || '456',
      
      // Additional info from schools table
      school_code: school.school_code || 'Not set',
      timezone: school.timezone || schoolDetails?.timezone || 'Not configured',
      academic_year_start: school.academic_year_start || null,
      academic_year_end: school.academic_year_end || null,
      
      // Statistics - use actual numbers from school_details
      total_students: parseInt(schoolDetails?.total_students) || totalStudents,
      total_teachers: parseInt(schoolDetails?.total_teachers) || totalTeachers,
      grade_levels: schoolDetails?.grade_levels_offered || gradeNames.length > 0 ? gradeNames : ['K-12'],
      
      // Computed fields
      student_teacher_ratio: (parseInt(schoolDetails?.total_teachers) || totalTeachers) > 0 
        ? Math.round((parseInt(schoolDetails?.total_students) || totalStudents) / (parseInt(schoolDetails?.total_teachers) || totalTeachers)) 
        : 0,
      
      // Enhanced info from school_details with proper field mapping
      core_values: ['Excellence', 'Integrity', 'Innovation', 'Collaboration', 'Respect'], // Default values as core_values not in schema
      achievements: [
        `Serving the community since ${schoolDetails?.established_year || 'establishment'}`,
        `${parseInt(schoolDetails?.total_students) || totalStudents} students enrolled`,
        `${parseInt(schoolDetails?.total_teachers) || totalTeachers} dedicated teachers`,
        'Committed to educational excellence',
        schoolDetails?.school_motto ? `School Motto: ${schoolDetails.school_motto}` : null
      ].filter(Boolean),
      facilities: [
        schoolDetails?.has_library ? 'Library' : null,
        schoolDetails?.has_gymnasium ? 'Gymnasium' : null,
        schoolDetails?.has_cafeteria ? 'Cafeteria' : null,
        schoolDetails?.has_computer_lab ? 'Computer Lab' : null,
        schoolDetails?.has_science_lab ? 'Science Lab' : null,
        schoolDetails?.has_art_room ? 'Art Room' : null,
        schoolDetails?.has_music_room ? 'Music Room' : null,
        'Classrooms',
        'Administrative Offices'
      ].filter(Boolean),
      
      // Additional school details
      school_motto: schoolDetails?.school_motto || null,
      district_name: schoolDetails?.district_name || null,
      accreditation_body: schoolDetails?.accreditation_body || null,
      special_programs: schoolDetails?.special_programs || null,
      extracurricular_activities: schoolDetails?.extracurricular_activities || null,
      bus_service_available: schoolDetails?.bus_service_available || false,
      
      // Setup status
      setup_completed: schoolDetails?.setup_completed || false,
      setup_completed_at: schoolDetails?.setup_completed_at || null
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
