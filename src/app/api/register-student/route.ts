import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { z } from 'zod'

const studentSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  schoolId: z.string(),
  grade: z.string(),
  className: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = studentSchema.parse(body)
    
    // Check if school exists
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('id, name')
      .eq('school_code', validatedData.schoolId.toUpperCase())
      .single()
    
    if (schoolError || !schoolData) {
      return NextResponse.json(
        { message: 'Invalid school ID. Please check with your school administrator.' },
        { status: 400 }
      )
    }
    
    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUser?.users?.some((user: any) => user.email === validatedData.email)
    
    if (emailExists) {
      return NextResponse.json(
        { message: 'An account with this email already exists.' },
        { status: 400 }
      )
    }
    
    // Create student user account (without automatic email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: false, // Don't send Supabase email, we'll use SendGrid
      user_metadata: {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        role: 'student',
        grade: validatedData.grade,
        class: validatedData.className
      }
    })
    
    if (authError) {
      console.error('Auth creation error:', authError)
      return NextResponse.json(
        { message: authError.message },
        { status: 400 }
      )
    }
    
    if (!authData.user) {
      return NextResponse.json(
        { message: 'Failed to create user account' },
        { status: 400 }
      )
    }
    
    // Create student profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: validatedData.email, // Store email in profiles for easy lookups
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        role: 'student',
        school_id: schoolData.id,
        xp: 0,
        gems: 0,
        level: 1,
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Try to delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { message: 'Failed to create student profile. Please try again.' },
        { status: 500 }
      )
    }
    
    // Create student-specific record
    const { error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        user_id: authData.user.id,
        profile_id: profileData.id,
        school_id: schoolData.id,
        grade: validatedData.grade,
        class: validatedData.className || 'A',
        enrollment_status: 'active',
        enrollment_date: new Date().toISOString()
      })
    
    if (studentError) {
      console.error('Student record creation error:', studentError)
      // Don't fail the registration, student record can be created later
    }
    
    // Send verification email via SendGrid
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify?token=${authData.user.id}&type=email`
      
      const emailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-verification-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: validatedData.email,
            firstName: validatedData.firstName,
            verificationUrl
          })
        }
      )
      
      if (emailResponse.ok) {
        console.log('✅ Verification email sent via SendGrid to student:', validatedData.email)
      } else {
        console.error('❌ Failed to send verification email to student:', validatedData.email)
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError)
      // Don't fail registration if email sending fails
    }
    
    console.log('Student registration completed:', {
      userId: authData.user.id,
      profileId: profileData.id,
      schoolId: schoolData.id,
      schoolName: schoolData.name
    })
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful!',
      schoolName: schoolData.name,
      userId: authData.user.id
    })
    
  } catch (error) {
    console.error('Student registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
