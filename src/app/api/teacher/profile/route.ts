import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/api-auth'

// Type for teacher extended info (optional table)
interface TeacherExtendedInfo {
  department?: string
  subject_specialization?: string
  education_level?: string
  years_experience?: number
  hire_date?: string
  bio?: string
  date_of_birth?: string
  address?: string
  profile_picture_url?: string
  certifications?: string[]
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

// Type for school data from join
interface SchoolData {
  id: string
  name: string
  school_code?: string
  logo_url?: string
  address?: string
  city?: string
  country?: string
}

export async function GET(req: NextRequest) {
  // Authenticate the request
  const authResult = await authenticateRequest(req, {
    allowedRoles: ['teacher', 'admin']
  })

  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  const { profile, supabase } = authResult

  try {
    // Fetch complete teacher profile with school details
    const { data: teacherProfile, error: profileError } = await supabase
      .from('profiles')
      .select(`
                id,
                user_id,
                first_name,
                last_name,
                avatar_url,
                role,
                school_id,
                created_at,
                updated_at,
                schools:school_id (
                    id,
                    name,
                    school_code,
                    logo_url,
                    address,
                    city,
                    country
                )
            `)
      .eq('user_id', profile.user_id)
      .single()

    if (profileError) {
      console.error('Error fetching teacher profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // Try to fetch extended teacher info from teacher_info table (graceful fallback)
    let teacherInfo: TeacherExtendedInfo | null = null
    try {
      const { data, error } = await supabase
        .from('teacher_info')
        .select('*')
        .eq('teacher_id', profile.user_id)
        .single()
      if (!error && data) {
        teacherInfo = data as TeacherExtendedInfo
      }
    } catch (err) {
      // Table might not exist yet, continue without it
      console.log('teacher_info table not available, using defaults')
    }

    // Get user email from auth
    const { data: userData } = await supabase.auth.getUser()
    const userEmail = userData?.user?.email

    // Handle schools join result - can be array or single object
    const schoolData = teacherProfile.schools as unknown
    let school: SchoolData | null = null
    if (schoolData) {
      if (Array.isArray(schoolData) && schoolData.length > 0) {
        school = schoolData[0] as SchoolData
      } else if (typeof schoolData === 'object') {
        school = schoolData as SchoolData
      }
    }

    // Format response - matching the fields expected by /teacher/profile page
    const formattedProfile = {
      id: teacherProfile.user_id || teacherProfile.id,
      first_name: teacherProfile.first_name,
      last_name: teacherProfile.last_name,
      email: userEmail,
      phone: teacherInfo?.emergency_contact_phone || null,
      address: teacherInfo?.address || null,
      bio: teacherInfo?.bio || null,
      profile_picture_url: teacherInfo?.profile_picture_url || teacherProfile.avatar_url,
      avatar_url: teacherProfile.avatar_url,
      date_of_birth: teacherInfo?.date_of_birth || null,
      hire_date: teacherInfo?.hire_date || teacherProfile.created_at,
      department: teacherInfo?.department || null,
      subject_specialization: teacherInfo?.subject_specialization || null,
      education_level: teacherInfo?.education_level || null,
      years_experience: teacherInfo?.years_experience || null,
      certifications: teacherInfo?.certifications || [],
      emergency_contact_name: teacherInfo?.emergency_contact_name || null,
      emergency_contact_phone: teacherInfo?.emergency_contact_phone || null,
      role: teacherProfile.role,
      school_id: teacherProfile.school_id,
      school: school ? {
        id: school.id,
        name: school.name,
        school_code: school.school_code,
        logo_url: school.logo_url,
        address: school.address,
        city: school.city,
        country: school.country
      } : null,
      created_at: teacherProfile.created_at,
      updated_at: teacherProfile.updated_at
    }

    return NextResponse.json({ profile: formattedProfile })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  // Authenticate the request
  const authResult = await authenticateRequest(req, {
    allowedRoles: ['teacher', 'admin']
  })

  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  const { profile, supabase } = authResult

  try {
    const body = await req.json()

    // Update basic profile fields in profiles table
    const profileUpdates: Record<string, any> = {}
    if (body.first_name !== undefined) profileUpdates.first_name = body.first_name
    if (body.last_name !== undefined) profileUpdates.last_name = body.last_name
    if (body.avatar_url !== undefined) profileUpdates.avatar_url = body.avatar_url

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('user_id', profile.user_id)

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError)
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        )
      }
    }

    // Try to update extended info in teacher_info table
    const extendedUpdates: Record<string, any> = {}
    const extendedFields = [
      'department', 'subject_specialization', 'education_level',
      'years_experience', 'hire_date', 'bio', 'date_of_birth',
      'address', 'profile_picture_url', 'emergency_contact_name',
      'emergency_contact_phone'
    ]

    for (const field of extendedFields) {
      if (body[field] !== undefined) {
        extendedUpdates[field] = body[field]
      }
    }

    if (Object.keys(extendedUpdates).length > 0) {
      try {
        // Try upsert - insert or update
        const { error: extendedError } = await supabase
          .from('teacher_info')
          .upsert({
            teacher_id: profile.user_id,
            school_id: profile.school_id,
            ...extendedUpdates
          }, {
            onConflict: 'teacher_id'
          })

        if (extendedError) {
          console.log('teacher_info update failed:', extendedError)
          // Continue anyway - the basic profile was updated
        }
      } catch (err) {
        console.log('teacher_info table not available')
      }
    }

    // Fetch and return updated profile
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select(`
                id,
                user_id,
                first_name,
                last_name,
                avatar_url,
                role,
                school_id,
                created_at,
                updated_at,
                schools:school_id (
                    id,
                    name,
                    school_code,
                    logo_url
                )
            `)
      .eq('user_id', profile.user_id)
      .single()

    // Get user email
    const { data: userData } = await supabase.auth.getUser()
    const userEmail = userData?.user?.email

    // Try to get extended info
    let teacherInfo: TeacherExtendedInfo | null = null
    try {
      const { data } = await supabase
        .from('teacher_info')
        .select('*')
        .eq('teacher_id', profile.user_id)
        .single()
      teacherInfo = data as TeacherExtendedInfo
    } catch (err) {
      // Ignore
    }

    // Handle schools join
    const schoolData = updatedProfile?.schools as unknown
    let school: SchoolData | null = null
    if (schoolData) {
      if (Array.isArray(schoolData) && schoolData.length > 0) {
        school = schoolData[0] as SchoolData
      } else if (typeof schoolData === 'object') {
        school = schoolData as SchoolData
      }
    }

    return NextResponse.json({
      profile: {
        id: updatedProfile?.user_id || updatedProfile?.id,
        first_name: updatedProfile?.first_name,
        last_name: updatedProfile?.last_name,
        email: userEmail,
        phone: teacherInfo?.emergency_contact_phone || null,
        address: teacherInfo?.address || null,
        bio: teacherInfo?.bio || null,
        profile_picture_url: teacherInfo?.profile_picture_url || updatedProfile?.avatar_url,
        avatar_url: updatedProfile?.avatar_url,
        date_of_birth: teacherInfo?.date_of_birth || null,
        hire_date: teacherInfo?.hire_date || updatedProfile?.created_at,
        department: teacherInfo?.department || null,
        subject_specialization: teacherInfo?.subject_specialization || null,
        education_level: teacherInfo?.education_level || null,
        years_experience: teacherInfo?.years_experience || null,
        emergency_contact_name: teacherInfo?.emergency_contact_name || null,
        emergency_contact_phone: teacherInfo?.emergency_contact_phone || null,
        role: updatedProfile?.role,
        school: school
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
