import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with fallback for build time
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  
  return createClient(supabaseUrl, supabaseKey)
}

const supabaseAdmin = createSupabaseAdmin()

export async function POST(request: NextRequest) {
  try {
    console.log('=== School Setup API Called ===')
    
    // Check if we have real Supabase credentials
    const hasRealCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
      process.env.SUPABASE_SERVICE_ROLE_KEY && 
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-key'
    
    if (!hasRealCredentials) {
      return NextResponse.json({ 
        error: 'Service configuration required',
        details: 'Please configure Supabase credentials'
      }, { status: 503 })
    }
    
    // Get the user from the request body (temporary solution)
    const body = await request.json()
    console.log('Request body keys:', Object.keys(body))
    const userId = body.userId
    console.log('User ID:', userId)
    
    if (!userId) {
      console.log('No user ID provided')
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    // Try to get user profile first
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role, id')
      .eq('id', userId)
      .single()

    let schoolId = null
    let userRole = null

    if (profile && !profileError) {
      schoolId = profile.school_id
      userRole = profile.role
    }

    // If no profile or missing school_id, try multiple approaches to find user's school
    if (!schoolId) {
      console.log('Profile not found or missing school_id, trying alternative lookups...')
      
      // Try 1: Check if user is admin_user_id in schools table
      const { data: school1, error: schoolError1 } = await supabaseAdmin
        .from('schools')
        .select('id, name')
        .eq('admin_user_id', userId)
        .single()

      if (school1 && !schoolError1) {
        schoolId = school1.id
        userRole = 'admin'
        console.log('Found school via admin_user_id:', school1.name, schoolId)
      }

      // Try 2: Check if user is associated via email in schools table
      if (!schoolId) {
        // Get user's email first
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
        
        if (authUser?.user?.email && !authError) {
          const { data: school2, error: schoolError2 } = await supabaseAdmin
            .from('schools')
            .select('id, name')
            .eq('email', authUser.user.email)
            .single()

          if (school2 && !schoolError2) {
            schoolId = school2.id
            userRole = 'admin'
            console.log('Found school via email match:', school2.name, schoolId)
          }
        }
      }

      // No fallbacks - strict user-school association required
      if (!schoolId) {
        console.log('❌ CRITICAL: No school association found for user')
        console.log('Strict security: User must have proper school association')
        return NextResponse.json({ 
          error: 'No school association found for user',
          details: 'User must be properly associated with a school'
        }, { status: 403 })
      }
    }

    // If we found a school but no profile, create/update the profile
    if (schoolId && (!profile || !profile.school_id)) {
      console.log('Creating/updating profile for user:', userId, 'with school:', schoolId)
      const { error: profileUpsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          school_id: schoolId,
          role: 'admin'
        }, {
          onConflict: 'id'
        })

      if (profileUpsertError) {
        console.error('Error creating/updating profile:', profileUpsertError)
      } else {
        console.log('Profile created/updated successfully')
      }
    }

    // If still no school_id, return error
    if (!schoolId) {
      console.error('No school association found for user:', userId)
      return NextResponse.json({ 
        error: 'User is not associated with a school. Please contact support.',
        debug: { profileError: profileError?.message, userId }
      }, { status: 404 })
    }

    // Check if user has admin permissions (default to admin if found via schools table)
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Remove userId from setupData before processing
    const { userId: _, ...setupData } = body
    console.log('Setup data fields count:', Object.keys(setupData).length)

    // Prepare school details data
    console.log('Preparing school details data for school_id:', schoolId)
    const schoolDetailsData = {
      school_id: schoolId,
      // Basic Information
      school_name: setupData.school_name,
      school_code: setupData.school_name ? setupData.school_name.replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0, 10) : 'SCHOOL',
      principal_name: setupData.principal_name,
      school_type: setupData.school_type,
      established_year: setupData.established_year || null,
      
      // Contact Information
      primary_email: setupData.primary_email,
      secondary_email: setupData.secondary_email || null,
      primary_phone: setupData.primary_phone,
      secondary_phone: setupData.secondary_phone || null,
      fax_number: setupData.fax_number || null,
      website_url: setupData.website_url || null,
      
      // Address
      street_address: setupData.street_address,
      city: setupData.city,
      state_province: setupData.state_province,
      postal_code: setupData.postal_code,
      country: setupData.country || 'United States',
      
      // School Hours & Schedule
      school_start_time: setupData.school_start_time,
      school_end_time: setupData.school_end_time,
      office_start_time: setupData.office_start_time,
      office_end_time: setupData.office_end_time,
      lunch_start_time: setupData.lunch_start_time || null,
      lunch_end_time: setupData.lunch_end_time || null,
      
      // Operating Days
      operates_monday: setupData.operates_monday || false,
      operates_tuesday: setupData.operates_tuesday || false,
      operates_wednesday: setupData.operates_wednesday || false,
      operates_thursday: setupData.operates_thursday || false,
      operates_friday: setupData.operates_friday || false,
      operates_saturday: setupData.operates_saturday || false,
      operates_sunday: setupData.operates_sunday || false,
      
      // Academic Information
      academic_year_start: setupData.academic_year_start || null,
      academic_year_end: setupData.academic_year_end || null,
      total_students: setupData.total_students || 0,
      total_teachers: setupData.total_teachers || 0,
      total_staff: setupData.total_staff || 0,
      grade_levels_offered: setupData.grade_levels_offered ? 
        setupData.grade_levels_offered.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
      
      // Emergency Contacts
      emergency_contact_name: setupData.emergency_contact_name,
      emergency_contact_phone: setupData.emergency_contact_phone,
      police_contact: setupData.police_contact || null,
      fire_department_contact: setupData.fire_department_contact || null,
      hospital_contact: setupData.hospital_contact || null,
      school_nurse_extension: setupData.school_nurse_extension || '123',
      security_extension: setupData.security_extension || '456',
      
      // School Culture
      school_motto: setupData.school_motto || null,
      school_mission: setupData.school_mission || null,
      school_vision: setupData.school_vision || null,
      accreditation_body: setupData.accreditation_body || null,
      district_name: setupData.district_name || null,
      
      // Social Media
      facebook_url: setupData.facebook_url || null,
      twitter_url: setupData.twitter_url || null,
      instagram_url: setupData.instagram_url || null,
      linkedin_url: setupData.linkedin_url || null,
      
      // Programs & Activities
      special_programs: setupData.special_programs ? 
        setupData.special_programs.split('\n').map((s: string) => s.trim()).filter(Boolean) : null,
      extracurricular_activities: setupData.extracurricular_activities ? 
        setupData.extracurricular_activities.split('\n').map((s: string) => s.trim()).filter(Boolean) : null,
      sports_programs: setupData.sports_programs ? 
        setupData.sports_programs.split('\n').map((s: string) => s.trim()).filter(Boolean) : null,
      
      // Transportation
      bus_service_available: setupData.bus_service_available || false,
      pickup_zones: setupData.pickup_zones ? 
        setupData.pickup_zones.split('\n').map((s: string) => s.trim()).filter(Boolean) : null,
      
      // Facilities
      has_library: setupData.has_library || false,
      has_gymnasium: setupData.has_gymnasium || false,
      has_cafeteria: setupData.has_cafeteria || false,
      has_computer_lab: setupData.has_computer_lab || false,
      has_science_lab: setupData.has_science_lab || false,
      has_art_room: setupData.has_art_room || false,
      has_music_room: setupData.has_music_room || false,
      
      // Setup tracking
      setup_completed: true,
      setup_completed_at: new Date().toISOString(),
      setup_completed_by: userId,
      status: 'completed'
    }

    // Upsert school details
    console.log('Starting database upsert...')
    const { data: schoolDetails, error: upsertError } = await supabaseAdmin
      .from('school_details')
      .upsert(schoolDetailsData, { 
        onConflict: 'school_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting school details:', upsertError)
      console.error('Upsert error details:', JSON.stringify(upsertError, null, 2))
      return NextResponse.json({ 
        error: 'Failed to save school details',
        details: upsertError.message,
        code: upsertError.code
      }, { status: 500 })
    }

    console.log('Database upsert successful')

    // Also update the main schools table with basic info
    const { error: schoolUpdateError } = await supabaseAdmin
      .from('schools')
      .update({
        name: setupData.school_name,
        principal_name: setupData.principal_name,
        email: setupData.primary_email,
        phone: setupData.primary_phone,
        address: setupData.street_address
      })
      .eq('id', schoolId)

    if (schoolUpdateError) {
      console.error('Error updating schools table:', schoolUpdateError)
      // Don't fail the request if this update fails, as the main data is saved
    }

    return NextResponse.json({ 
      success: true,
      details: schoolDetails,
      message: 'School setup completed successfully'
    })

  } catch (error: any) {
    console.error('School setup API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : 'No stack') : undefined
    }, { status: 500 })
  }
}
