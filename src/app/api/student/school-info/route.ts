import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Student School Info API Called ===')
    
    // Authenticate student via shared helper (with caching)
    const auth = await authenticateStudent(request)

    if (isAuthError(auth)) {
      return NextResponse.json({
        error: auth.status === 401 ? 'Authentication required' : auth.error,
        schoolInfo: null
      }, { status: auth.status })
    }

    const { userId } = auth
    console.log('✅ User authenticated:', userId)
    
    // Get user's profile to find school
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('school_id, school_code, role')
      .eq('user_id', userId)
      .single()
    
    if (!profile?.school_id) {
      console.log('❌ No school association found for user')
      return NextResponse.json({ 
        error: 'No school association found',
        schoolInfo: null
      }, { status: 404 })
    }
    
    console.log('User school_id:', profile.school_id)
    
    // Get school details - only essential fields for dashboard
    const { data: schoolDetails } = await supabaseAdmin
      .from('school_details')
      .select(`
        school_name,
        street_address,
        city,
        primary_phone,
        primary_email,
        school_start_time,
        school_end_time
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
      // Format minimal school data for dashboard
      const formattedAddress = [
        schoolDetails.street_address,
        schoolDetails.city
      ].filter(Boolean).join(', ')
      
      return NextResponse.json({
        schoolInfo: {
          name: schoolDetails.school_name,
          address: formattedAddress,
          phone: schoolDetails.primary_phone,
          email: schoolDetails.primary_email,
          schoolHours: {
            start: schoolDetails.school_start_time,
            end: schoolDetails.school_end_time
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
