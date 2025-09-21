import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Test 1: Check if we can connect to database
    const { data: testConnection, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    console.log('Database connection test:', { testConnection, connectionError })
    
    // Test 2: Look for the specific user profile
    const userId = '082f24d3-9f21-4330-8864-fe5c52316c0f'
    const { data: profileById, error: profileByIdError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    console.log('Profile by user_id:', { profileById, profileByIdError })
    
    // Test 3: Get all profiles to see what exists
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, role, school_id')
      .limit(10)
    
    console.log('All profiles:', { allProfiles, allProfilesError })
    
    // Test 4: Check auth user
    const authorization = request.headers.get('authorization')
    let authTest = null
    if (authorization) {
      const token = authorization.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      authTest = { user: user ? { id: user.id, email: user.email } : null, authError }
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        databaseConnection: { success: !connectionError, error: connectionError },
        profileLookup: { found: !!profileById, profile: profileById, error: profileByIdError },
        allProfiles: { count: allProfiles?.length || 0, profiles: allProfiles, error: allProfilesError },
        authTest
      }
    })
    
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
