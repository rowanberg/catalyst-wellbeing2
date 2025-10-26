import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  return NextResponse.json({ message: 'Verify student API is working' })
}

export async function POST(request: NextRequest) {
  try {
    const { email, studentId } = await request.json()
    console.log('[verify-student] Request:', { email, studentId })

    if (!email || !studentId) {
      return NextResponse.json({ error: 'Both email and student ID are required' }, { status: 400 })
    }

    // Verify environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[verify-student] NEXT_PUBLIC_SUPABASE_URL not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[verify-student] SUPABASE_SERVICE_ROLE_KEY not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // First get the user by email from auth
    console.log('[verify-student] Searching for user with email:', email)
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('[verify-student] Auth error:', authError)
      return NextResponse.json({ error: 'Error accessing user data', details: authError.message }, { status: 500 })
    }
    
    const user = authUser.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      console.log('[verify-student] No auth user found with email:', email)
      
      // Check if profile exists directly by email in profiles table
      console.log('[verify-student] Checking if profile exists directly in database...')
      const { data: directProfile, error: directError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, email, first_name, last_name, role, school_id')
        .eq('email', email)
        .eq('id', studentId)
        .eq('role', 'student')
        .single()
      
      if (directProfile) {
        console.error('[verify-student] CRITICAL: Profile exists but auth user missing!')
        console.error('[verify-student] Profile:', directProfile)
        
        // Allow parent to link but with warning that student can't login
        // Get school info
        const { data: school } = await supabaseAdmin
          .from('schools')
          .select('name, school_code')
          .eq('id', directProfile.school_id)
          .single()
        
        return NextResponse.json({
          student: {
            id: directProfile.id,
            name: `${directProfile.first_name} ${directProfile.last_name}`,
            email: email,
            school: school?.name || 'Unknown School',
            schoolCode: school?.school_code || ''
          },
          warning: 'Student profile exists but cannot login. Contact school admin to recreate account.',
          orphanedProfile: true
        })
      }
      
      console.log('[verify-student] No profile found either')
      return NextResponse.json({ error: 'No user found with this email address' }, { status: 404 })
    }
    
    console.log('[verify-student] Found user:', user.id)

    // Get student profile with school info by user_id and profile ID
    console.log('[verify-student] Searching for profile with user_id:', user.id, 'and profile id:', studentId)
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        role,
        user_id,
        school_id,
        schools!profiles_school_id_fkey (
          name,
          school_code
        )
      `)
      .eq('user_id', user.id)
      .eq('id', studentId)
      .eq('role', 'student')
      .single()

    if (profileError || !profile) {
      console.error('[verify-student] Profile query error:', profileError)
      console.log('[verify-student] Query params - email:', email, 'studentId:', studentId)
      
      // Try to find by user_id only to see if student exists
      const { data: emailCheck, error: emailCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, role, first_name, last_name')
        .eq('user_id', user.id)
        .eq('role', 'student')
        .single()
      
      console.log('[verify-student] Email check result:', emailCheck)
      console.log('[verify-student] Email check error:', emailCheckError)
      
      if (emailCheck) {
        console.log('[verify-student] Student found by email but ID mismatch. Expected ID:', studentId, 'Actual ID:', emailCheck.id)
        return NextResponse.json({ 
          error: `Student ID mismatch. The correct ID for ${emailCheck.first_name} ${emailCheck.last_name} is ${emailCheck.id}`,
          correctId: emailCheck.id
        }, { status: 404 })
      }
      
      console.log('[verify-student] No student profile found for this user')
      return NextResponse.json({ error: 'No student profile found for this email address' }, { status: 404 })
    }
    
    console.log('[verify-student] Student verified successfully:', profile.id)

    // Return student details for verification
    return NextResponse.json({
      student: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        email: email,
        school: (profile.schools as any)?.name || 'Unknown School',
        schoolCode: (profile.schools as any)?.school_code || ''
      }
    })

  } catch (error: any) {
    console.error('=== CRITICAL ERROR in verify-student API ===')
    console.error('Error type:', typeof error)
    console.error('Error object:', error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
