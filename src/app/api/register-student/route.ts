import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { z } from 'zod'
import { invalidateClassRoster } from '@/lib/redis-rosters'

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

    // Increment current_users count for the school
    try {
      // First get current counts
      const { data: schoolCounts } = await supabaseAdmin
        .from('schools')
        .select('current_users, student_count')
        .eq('id', schoolData.id)
        .single()
      
      if (schoolCounts) {
        const { error: updateError } = await supabaseAdmin
          .from('schools')
          .update({ 
            current_users: (schoolCounts.current_users || 0) + 1,
            student_count: (schoolCounts.student_count || 0) + 1
          })
          .eq('id', schoolData.id)
        
        if (updateError) {
          console.error('Failed to update school user count:', updateError)
        } else {
          console.log(`✅ Incremented user count for school: ${schoolData.name}`)
        }
      }
    } catch (countError) {
      console.error('Error updating school user count:', countError)
      // Don't fail registration if count update fails
    }

    // Find the class this student is joining to invalidate its roster cache
    try {
      const { data: studentClass } = await supabaseAdmin
        .from('classes')
        .select('id')
        .eq('school_id', schoolData.id)
        .eq('grade_level_id', validatedData.grade)
        .limit(1)
        .maybeSingle()

      if (studentClass?.id) {
        // Invalidate the class roster cache for THIS SPECIFIC CLASS
        // This ensures teachers see the new student immediately on next load
        await invalidateClassRoster(studentClass.id, schoolData.id)
        console.log(`🗑️ [Registration] Invalidated roster for class: ${studentClass.id}`)
      }
    } catch (cacheError) {
      console.error('Failed to invalidate class roster cache:', cacheError)
      // Don't fail registration if cache invalidation fails
    }
    
    // Send verification email via Supabase Edge Function
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify?token=${authData.user.id}&type=email`
      
      // Call Supabase Edge Function with role-specific template
      const { data, error } = await supabaseAdmin.functions.invoke('send-email', {
        body: { 
          type: 'verification',
          to: validatedData.email,
          name: validatedData.firstName,
          role: 'student',
          url: verificationUrl,
          schoolName: schoolData?.name || undefined
        }
      })
      
      if (!error && data?.success) {
        console.log('✅ Student verification email sent:', validatedData.email)
      } else {
        console.error('❌ Failed to send verification email:', error || data?.error)
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
