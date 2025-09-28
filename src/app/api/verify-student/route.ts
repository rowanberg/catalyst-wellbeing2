import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  return NextResponse.json({ message: 'Verify student API is working' })
}

export async function POST(request: NextRequest) {
  try {
    const { email, studentId } = await request.json()

    if (!email || !studentId) {
      return NextResponse.json({ error: 'Both email and student ID are required' }, { status: 400 })
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First get the user by email from auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      return NextResponse.json({ error: 'Error accessing user data' }, { status: 500 })
    }
    
    const user = authUser.users.find(u => u.email === email)
    if (!user) {
      return NextResponse.json({ error: 'No user found with this email address' }, { status: 404 })
    }

    // Get student profile with school info by user_id and profile ID
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
      console.error('Profile query error:', profileError)
      console.log('Query params - email:', email, 'studentId:', studentId)
      
      // Try to find by user_id only to see if student exists
      const { data: emailCheck } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, role')
        .eq('user_id', user.id)
        .eq('role', 'student')
        .single()
      
      if (emailCheck) {
        console.log('Student found by email but ID mismatch. Expected ID:', studentId, 'Actual ID:', emailCheck.id)
        return NextResponse.json({ 
          error: 'Student ID does not match the email address. Please check the student ID.',
          debug: {
            providedId: studentId,
            actualId: emailCheck.id
          }
        }, { status: 404 })
      }
      
      return NextResponse.json({ error: 'Student not found with the provided email and ID combination' }, { status: 404 })
    }

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
