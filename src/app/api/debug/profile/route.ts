import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
    }
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    // Also check by id field (in case the column name is different)
    const { data: profileById, error: profileByIdError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    
    // Get all profiles to see the structure
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id, user_id, role, first_name, last_name, school_id')
      .limit(5)
    
    const debugInfo = {
      userId,
      profileByUserId: profile,
      profileByUserIdError: profileError?.message,
      profileById: profileById,
      profileByIdError: profileByIdError?.message,
      sampleProfiles: allProfiles,
      allProfilesError: allProfilesError?.message
    }
    
    console.log('Profile Debug Info:', debugInfo)
    
    return NextResponse.json(debugInfo)
  } catch (error: any) {
    console.error('Profile Debug API Error:', error)
    return NextResponse.json({ error: 'Debug failed', details: error.message }, { status: 500 })
  }
}
