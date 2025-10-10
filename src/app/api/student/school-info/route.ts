import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Student School Info API Called ===')
    
    // Use proper SSR authentication
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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ No user session found:', authError?.message)
      return NextResponse.json({ 
        error: 'Authentication required',
        schoolInfo: null
      }, { status: 401 })
    }
    
    console.log('✅ User authenticated:', user.id)
    
    // Get user's profile to find school
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('school_id, school_code, role')
      .eq('user_id', user.id)
      .single()
    
    if (!profile?.school_id) {
      console.log('❌ No school association found for user')
      return NextResponse.json({ 
        error: 'No school association found',
        schoolInfo: null
      }, { status: 404 })
    }
    
    console.log('User school_id:', profile.school_id)
    
    // Get school details from school_details table (comprehensive data)
    const { data: schoolDetails } = await supabaseAdmin
      .from('school_details')
      .select(`
        school_name,
        principal_name,
        primary_email,
        secondary_email,
        primary_phone,
        secondary_phone,
        street_address,
        city,
        state_province,
        postal_code,
        country,
        school_start_time,
        school_end_time,
        office_start_time,
        office_end_time,
        emergency_contact_name,
        emergency_contact_phone,
        police_contact,
        fire_department_contact,
        hospital_contact,
        school_nurse_extension,
        security_extension,
        school_motto,
        school_mission,
        website_url,
        operates_monday,
        operates_tuesday,
        operates_wednesday,
        operates_thursday,
        operates_friday,
        operates_saturday,
        operates_sunday
      `)
      .eq('school_id', profile.school_id)
      .eq('status', 'completed')
      .single()
    
    // Fallback to basic school info if detailed setup not completed
    if (!schoolDetails) {
      console.log('No completed school details found, using basic school info')
      const { data: basicSchool } = await supabaseAdmin
        .from('schools')
        .select('name, address, phone, email')
        .eq('id', profile.school_id)
        .single()
      
      if (basicSchool) {
        return NextResponse.json({
          schoolInfo: {
            name: basicSchool.name,
            address: basicSchool.address,
            phone: basicSchool.phone,
            email: basicSchool.email,
            // Default values for missing data
            schoolHours: {
              start: '08:00',
              end: '15:30',
              officeStart: '07:30',
              officeEnd: '16:00'
            },
            emergency: {
              general: '911',
              nurse: 'Ext. 123',
              security: 'Ext. 456'
            },
            isComplete: false
          }
        })
      }
    }
    
    if (schoolDetails) {
      // Format the comprehensive school data
      const formattedAddress = [
        schoolDetails.street_address,
        schoolDetails.city,
        schoolDetails.state_province,
        schoolDetails.postal_code,
        schoolDetails.country
      ].filter(Boolean).join(', ')
      
      // Format operating days
      const operatingDays: string[] = []
      if (schoolDetails.operates_monday) operatingDays.push('Monday')
      if (schoolDetails.operates_tuesday) operatingDays.push('Tuesday')
      if (schoolDetails.operates_wednesday) operatingDays.push('Wednesday')
      if (schoolDetails.operates_thursday) operatingDays.push('Thursday')
      if (schoolDetails.operates_friday) operatingDays.push('Friday')
      if (schoolDetails.operates_saturday) operatingDays.push('Saturday')
      if (schoolDetails.operates_sunday) operatingDays.push('Sunday')
      
      return NextResponse.json({
        schoolInfo: {
          name: schoolDetails.school_name,
          principal: schoolDetails.principal_name,
          address: formattedAddress,
          email: schoolDetails.primary_email,
          secondaryEmail: schoolDetails.secondary_email,
          phone: schoolDetails.primary_phone,
          secondaryPhone: schoolDetails.secondary_phone,
          website: schoolDetails.website_url,
          motto: schoolDetails.school_motto,
          mission: schoolDetails.school_mission,
          schoolHours: {
            start: schoolDetails.school_start_time,
            end: schoolDetails.school_end_time,
            officeStart: schoolDetails.office_start_time,
            officeEnd: schoolDetails.office_end_time,
            operatingDays: operatingDays
          },
          emergency: {
            general: schoolDetails.police_contact || '911',
            fire: schoolDetails.fire_department_contact || '911',
            hospital: schoolDetails.hospital_contact || '108',
            nurse: `Ext. ${schoolDetails.school_nurse_extension || '123'}`,
            security: `Ext. ${schoolDetails.security_extension || '456'}`,
            contact: schoolDetails.emergency_contact_name,
            contactPhone: schoolDetails.emergency_contact_phone
          },
          isComplete: true
        }
      })
    }
    
    // No school data found
    return NextResponse.json({ 
      error: 'School information not found',
      schoolInfo: null
    }, { status: 404 })
    
  } catch (error: any) {
    console.error('School info API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch school information',
      schoolInfo: null
    }, { status: 500 })
  }
}
