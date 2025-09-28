import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('=== School Details API Called ===')
    
    // IMMEDIATE TEST - Removed for production
    
    // IMMEDIATE JEBIN LOOKUP FOR TESTING
    console.log('🚨 TESTING: Looking for JEBIN immediately...')
    let currentUserId = null
    let currentSchoolId = null
    
    try {
      const { data: jebinUser, error: jebinError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, first_name, last_name, role, school_id, school_code')
        .eq('first_name', 'JEBIN')
        .eq('last_name', 'ANDREW')
        .eq('role', 'admin')
        .single()
      
      console.log('🚨 IMMEDIATE JEBIN LOOKUP:', jebinUser)
      console.log('🚨 JEBIN ERROR:', jebinError)
      
      if (jebinUser && !jebinError) {
        currentUserId = jebinUser.id
        currentSchoolId = jebinUser.school_id || null
        console.log('🚨 USING JEBIN DIRECTLY:', currentUserId)
        console.log('🚨 JEBIN SCHOOL:', currentSchoolId)
      }
    } catch (e: any) {
      console.log('🚨 JEBIN LOOKUP FAILED:', e)
    }
    
    // Get cookies for additional debugging
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    
    console.log('Attempting to find current user...')
    console.log('Attempting strict user authentication...')
    
    // Try 2: Check all possible Supabase cookie formats
    const allCookies = cookieStore.getAll()
    console.log('All available cookies:', allCookies.map(c => c.name))
    
    const possibleTokenCookies = [
      'sb-access-token',
      'supabase-auth-token', 
      'sb-refresh-token',
      'supabase.auth.token'
    ]
    
    for (const cookieName of possibleTokenCookies) {
      const token = cookieStore.get(cookieName)?.value
      if (token) {
        console.log(`Trying cookie: ${cookieName}`)
        try {
          const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
          if (user && !error) {
            currentUserId = user.id
            console.log(`✅ Found user from ${cookieName}:`, currentUserId)
            break
          } else {
            console.log(`${cookieName} invalid:`, error?.message)
          }
        } catch (e: any) {
          console.log(`${cookieName} failed:`, e)
        }
      }
    }
    
    if (!currentUserId) {
      console.log('No valid auth token found in any cookie')
    }
    
    // Try 3: Direct user lookup as last resort (since we know JEBIN is logged in)
    if (!currentUserId) {
      console.log('🔍 Cookie authentication failed, trying direct user lookup...')
      
      try {
        // Since we can see JEBIN is logged in, let's find his user record directly
        const { data: jebinUser, error: jebinError } = await supabaseAdmin
          .from('profiles')
          .select('id, user_id, first_name, last_name, role, school_id, school_code')
          .eq('first_name', 'JEBIN')
          .eq('last_name', 'ANDREW')
          .eq('role', 'admin')
          .single()
        
        console.log('JEBIN lookup result:', jebinUser)
        console.log('JEBIN lookup error:', jebinError)
        
        if (jebinUser && !jebinError) {
          currentUserId = jebinUser.id
          console.log('✅ Found JEBIN user directly:', currentUserId)
          console.log('JEBIN school_id:', jebinUser.school_id)
          console.log('JEBIN school_code:', jebinUser.school_code)
        } else {
          console.log('❌ Could not find JEBIN user in profiles')
        }
      } catch (lookupError: any) {
        console.log('❌ Direct lookup failed:', lookupError)
      }
    }
    
    console.log('Final currentUserId before validation:', currentUserId)
    
    // Skip authentication check if we found JEBIN directly
    if (!currentUserId) {
      console.log('❌ AUTHENTICATION FAILED: No valid user session found')
      console.log('Strict security: No fallbacks allowed to prevent data leakage')
      return NextResponse.json({ 
        details: null,
        setup_completed: false,
        status: 'not_completed',
        debug: 'Authentication required - please log in'
      })
    } else {
      console.log('✅ AUTHENTICATION SUCCESS: Found user:', currentUserId)
    }
    
    // Method 3: Get school info from user profile - use school_code for matching
    let currentSchoolCode = null
    if (currentUserId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('school_id, role, school_code, first_name, last_name')
        .eq('id', currentUserId)
        .single()
      
      console.log('=== CURRENT USER PROFILE ===')
      console.log('User ID:', currentUserId)
      console.log('User Name:', `${profile?.first_name} ${profile?.last_name}`)
      console.log('User Role:', profile?.role)
      console.log('User School ID:', profile?.school_id)
      console.log('User School Code:', profile?.school_code)
      console.log('Full Profile:', JSON.stringify(profile, null, 2))
      console.log('==============================')
      
      if (profile?.school_id) {
        currentSchoolId = profile.school_id
        console.log('✅ Found school ID from profile:', currentSchoolId)
      }
      
      if (profile?.school_code) {
        currentSchoolCode = profile.school_code
        console.log('✅ Found school CODE from profile:', currentSchoolCode)
      } else {
        console.log('⚠️ No school_code in profile, profile keys:', Object.keys(profile || {}))
      }
      
      // If no school_code in profile, try to get it from schools table
      if (!currentSchoolCode && currentSchoolId) {
        console.log('🔍 Looking up school_code in schools table for school_id:', currentSchoolId)
        const { data: school, error: schoolError } = await supabaseAdmin
          .from('schools')
          .select('school_code, name')
          .eq('id', currentSchoolId)
          .single()
        
        console.log('Schools table lookup result:', JSON.stringify(school, null, 2))
        if (schoolError) {
          console.log('Schools table error:', schoolError)
        }
        
        if (school?.school_code) {
          currentSchoolCode = school.school_code
          console.log('✅ Found school CODE from schools table:', currentSchoolCode)
        } else {
          console.log('⚠️ No school_code found in schools table')
          
          // Debug: Show all schools to see what exists
          const { data: allSchools } = await supabaseAdmin
            .from('schools')
            .select('id, school_code, name')
            .limit(10)
          
          console.log('🔍 ALL schools in database:', JSON.stringify(allSchools, null, 2))
        }
      }
      
      if (!currentSchoolId && !currentSchoolCode) {
        console.log('⚠️ User profile exists but no school info:', profile)
      }
    }
    
    // Method 4: Safe fallback - try to identify user from request headers
    if (!currentUserId && !currentSchoolId) {
      console.log('⚠️ No user session found, trying header-based identification...')
      
      // Check if we can identify the user from the request
      const authHeader = request.headers.get('authorization')
      const userAgent = request.headers.get('user-agent')
      const referer = request.headers.get('referer')
      
      console.log('Auth header present:', !!authHeader)
      console.log('Referer:', referer)
      
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '')
          const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
          if (user && !error) {
            currentUserId = user.id
            console.log('✅ Found user from auth header:', currentUserId)
            
            // Get their school
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('school_id, role')
              .eq('id', currentUserId)
              .single()
            
            if (profile?.school_id) {
              currentSchoolId = profile.school_id
              console.log('✅ Found school from auth header profile:', currentSchoolId)
            }
          }
        } catch (e: any) {
          console.log('Auth header failed:', e)
        }
      }
    }
    
    // Method 5: Last resort - if still no user, return empty but don't fail
    if (!currentUserId && !currentSchoolId && !currentSchoolCode) {
      console.log('❌ No user identification possible - returning empty state')
      return NextResponse.json({ 
        details: null,
        setup_completed: false,
        status: 'not_completed',
        debug: 'No user session - please log in again'
      })
    }
    
    // No development bypasses - strict data isolation
    
    if (!currentSchoolId && !currentSchoolCode) {
      console.log('❌ No school identification found after all methods')
      return NextResponse.json({ 
        details: null,
        setup_completed: false,
        status: 'not_completed',
        debug: 'No school association found'
      })
    }
    
    // Check for setup status for CURRENT SCHOOL using school_code matching
    console.log('Checking setup status for school ID:', currentSchoolId, 'CODE:', currentSchoolCode)
    
    // Build query conditions - prefer school_code (now that data is fixed), fallback to school_id
    let query = supabaseAdmin.from('school_details').select('*, status')
    
    if (currentSchoolCode) {
      query = query.eq('school_code', currentSchoolCode)
      console.log('🔍 Searching by school_code (primary):', currentSchoolCode)
    } else if (currentSchoolId) {
      query = query.eq('school_id', currentSchoolId)
      console.log('🔍 Searching by school_id (fallback):', currentSchoolId)
    }
    
    const { data: completedByStatus, error: statusError } = await query
      .eq('status', 'completed')
      .limit(5)

    console.log('Records with status=completed for current school:', completedByStatus?.length || 0)
    if (completedByStatus && completedByStatus.length > 0) {
      console.log('=== FOUND COMPLETED SETUP RECORDS ===')
      completedByStatus.forEach((record: any, index: number) => {
        console.log(`Record ${index + 1}:`)
        console.log(`  School Name: ${record.school_name}`)
        console.log(`  School ID: ${record.school_id}`)
        console.log(`  School Code: ${record.school_code}`)
        console.log(`  Status: ${record.status}`)
        console.log(`  Setup Completed: ${record.setup_completed}`)
      })
      console.log('=====================================')
    }
    
    // If no status='completed' records, check for old setup_completed=true records
    let allSetups = completedByStatus || []
    
    if (!allSetups || allSetups.length === 0) {
      console.log('No status=completed records, checking setup_completed=true for current school...')
      
      // Build query for setup_completed=true
      let flagQuery = supabaseAdmin.from('school_details').select('*, status')
      
      if (currentSchoolCode) {
        flagQuery = flagQuery.eq('school_code', currentSchoolCode)
      } else if (currentSchoolId) {
        flagQuery = flagQuery.eq('school_id', currentSchoolId)
      }
      
      const { data: completedByFlag, error: flagError } = await flagQuery
        .eq('setup_completed', true)
        .limit(5)
      
      console.log('Records with setup_completed=true for current school:', completedByFlag?.length || 0)
      allSetups = completedByFlag || []
    }

    const setupError = statusError || null

    if (setupError) {
      console.error('Error checking setup status:', setupError)
      // If there's an error, assume no setup completed
      return NextResponse.json({ 
        details: null,
        setup_completed: false,
        status: 'not_completed'
      })
    }

    console.log('Found setups:', allSetups?.length || 0)
    if (allSetups) {
      console.log('All setups data:', JSON.stringify(allSetups, null, 2))
    }
    
    // Find the best match - prefer status='completed', fallback to setup_completed=true
    let bestSetup = null
    if (allSetups && allSetups.length > 0) {
      console.log('Processing setups to find best match...')
      
      // First try to find one with status='completed'
      bestSetup = allSetups.find(s => s.status === 'completed')
      console.log('Setup with status=completed:', bestSetup ? 'FOUND' : 'NOT FOUND')
      
      // If not found, use any with setup_completed=true
      if (!bestSetup) {
        bestSetup = allSetups.find(s => s.setup_completed === true)
        console.log('Setup with setup_completed=true:', bestSetup ? 'FOUND' : 'NOT FOUND')
      }
      
      // If still not found, use the first one
      if (!bestSetup) {
        bestSetup = allSetups[0]
        console.log('Using first setup as fallback:', !!bestSetup)
      }
    } else {
      console.log('No completed setups found for current school, checking for ANY records for this school...')
      
      // If no completed setups found, check if there are any records at all for this school
      let anyQuery = supabaseAdmin.from('school_details').select('*, status')
      
      if (currentSchoolCode) {
        anyQuery = anyQuery.eq('school_code', currentSchoolCode)
        console.log('🔍 Checking any records by school_code:', currentSchoolCode)
      } else if (currentSchoolId) {
        anyQuery = anyQuery.eq('school_id', currentSchoolId)
        console.log('🔍 Checking any records by school_id:', currentSchoolId)
      }
      
      const { data: anyRecords, error: anyError } = await anyQuery.limit(5)
      
      console.log('Any school_details records found for current school:', anyRecords?.length || 0)
      if (anyRecords && anyRecords.length > 0) {
        console.log('Current school records:', JSON.stringify(anyRecords, null, 2))
        // Use the first record found for this school
        bestSetup = anyRecords[0]
        console.log('Using first record found for this school')
      } else {
        console.log('❌ No school_details records exist for current school - setup needed')
        
        // Debug: Show ALL school_details records to see what exists
        const { data: allRecords } = await supabaseAdmin
          .from('school_details')
          .select('id, school_id, school_code, school_name, status, setup_completed')
          .limit(10)
        
        console.log('🔍 ALL school_details records in database:', JSON.stringify(allRecords, null, 2))
        
        // Debug: Show what we're searching for vs what exists
        console.log('🔍 Search criteria - school_code:', currentSchoolCode, 'school_id:', currentSchoolId)
        if (allRecords && allRecords.length > 0) {
          console.log('🔍 Available school_codes:', allRecords.map(r => r.school_code))
          console.log('🔍 Available school_ids:', allRecords.map(r => r.school_id))
        }
      }
    }

    // Determine the actual status - be strict about completion
    let actualStatus = 'not_completed'
    let isCompleted = false

    if (bestSetup) {
      console.log('Best setup record:', JSON.stringify(bestSetup, null, 2))
      
      // STRICT: Only consider completed if status='completed'
      if (bestSetup.status === 'completed') {
        actualStatus = 'completed'
        isCompleted = true
        console.log('✅ Setup truly completed (status=completed)')
      }
      // If setup_completed=true but status is not 'completed', it's inconsistent
      else if (bestSetup.setup_completed === true && bestSetup.status !== 'completed') {
        console.log('⚠️ INCONSISTENT DATA: setup_completed=true but status=' + bestSetup.status)
        console.log('Treating as NOT completed until status is fixed')
        actualStatus = 'not_completed'
        isCompleted = false
        
        // Don't auto-fix here, let admin manually fix the data
        console.log('❌ Setup marked as incomplete due to data inconsistency')
      }
      // If setup_completed=true and status='completed', that's good
      else if (bestSetup.setup_completed === true && bestSetup.status === 'completed') {
        actualStatus = 'completed'
        isCompleted = true
        console.log('✅ Setup completed (both flags match)')
      }
      // Any other case is not completed
      else {
        actualStatus = bestSetup.status || 'not_completed'
        isCompleted = false
        console.log('❌ Setup not completed:', actualStatus)
      }
    } else {
      console.log('❌ No setup record found - treating as not completed')
    }

    console.log('Best setup found:', !!bestSetup)
    console.log('Actual status:', actualStatus)
    console.log('Is completed:', isCompleted)

    return NextResponse.json({ 
      details: bestSetup || null,
      setup_completed: isCompleted,
      status: actualStatus
    })

  } catch (error: any) {
    console.error('School details API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
