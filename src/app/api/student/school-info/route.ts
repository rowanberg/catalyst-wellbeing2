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
