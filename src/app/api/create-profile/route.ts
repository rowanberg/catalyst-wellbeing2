import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { userId, firstName, lastName, role, schoolCode, email, password, gradeLevel, className } = await request.json()

    let user: { id: string } | null = null
    let shouldCreateUser = false

    // Check if we need to create the user (for regular signups)
    if (email && password) {
      // Create user with admin client - send confirmation email
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // Send confirmation email instead of auto-confirming
      })

      if (authError) {
        console.error('User creation error:', authError)
        return NextResponse.json(
          { message: `Failed to create user: ${authError.message}` },
          { status: 500 }
        )
      }

      user = authData.user
      shouldCreateUser = true

      // Send confirmation email after user creation
      try {
        const confirmationResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
        
        if (confirmationResponse.ok) {
          console.log('✅ Confirmation email sent to:', email)
        } else {
          console.error('❌ Failed to send confirmation email to:', email)
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
        // Don't fail registration if email sending fails
      }
    } else {
      // Use provided userId (for admin-created users)
      user = { id: userId }
    }

    if (!user) {
      return NextResponse.json(
        { message: 'Failed to get user information' },
        { status: 400 }
      )
    }

    // Get the school ID from the school code
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('school_code', schoolCode)
      .single()

    if (schoolError || !school) {
      console.error('School lookup error:', schoolError)
      return NextResponse.json(
        { message: 'Invalid school code' },
        { status: 400 }
      )
    }

    // Create the user profile
    const profileData: any = {
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      role,
      school_id: school.id,
      school_code: schoolCode,
      xp: 0,
      gems: 0,
      level: 1,
    }

    // Add student-specific fields if provided
    if (gradeLevel) {
      profileData.grade_level = gradeLevel
    }
    if (className) {
      profileData.class_name = className
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { message: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    // If this is a student with a selected class, assign them to the class
    if (role === 'student' && className && gradeLevel) {
      try {
        // className now contains the class ID (UUID) from the frontend
        const classId = className;
        
        // Verify the class exists and belongs to the school
        const { data: classData, error: classError } = await supabaseAdmin
          .from('classes')
          .select('id, class_name')
          .eq('school_id', school.id)
          .eq('id', classId)
          .single()

        if (classError) {
          console.error('Class lookup error:', classError)
          // Don't fail the entire registration if class assignment fails
          console.warn(`Warning: Could not find class with ID "${classId}" for student ${firstName} ${lastName}`)
        } else if (classData) {
          // Create student class assignment
          console.log(`📝 Creating class assignment for student ${firstName} ${lastName}:`, {
            student_id: user.id,
            class_id: classData.id,
            school_id: school.id,
            class_name: classData.class_name
          })
          
          const { error: assignmentError } = await supabaseAdmin
            .from('student_class_assignments')
            .insert({
              student_id: user.id,
              class_id: classData.id,
              school_id: school.id,
              is_active: true,
              assigned_at: new Date().toISOString()
            })

          if (assignmentError) {
            console.error('❌ Student class assignment error:', assignmentError)
            console.error('Assignment error details:', {
              code: assignmentError.code,
              message: assignmentError.message,
              details: assignmentError.details
            })
            // Don't fail the entire registration if class assignment fails
            console.warn(`⚠️ Warning: Could not assign student ${firstName} ${lastName} to class "${classData.class_name}"`)
          } else {
            console.log(`✅ Successfully assigned student ${firstName} ${lastName} to class "${classData.class_name}"`)
            
            // Update the class student count
            const { data: countData } = await supabaseAdmin
              .from('student_class_assignments')
              .select('student_id', { count: 'exact' })
              .eq('class_id', classData.id)
              .eq('is_active', true)
            
            if (countData) {
              await supabaseAdmin
                .from('classes')
                .update({ current_students: countData.length })
                .eq('id', classData.id)
              
              console.log(`📊 Updated class "${classData.class_name}" student count to ${countData.length}`)
            }
          }
        }
      } catch (classAssignmentError) {
        console.error('Error during class assignment:', classAssignmentError)
        // Continue with successful profile creation even if class assignment fails
      }
    }

    return NextResponse.json({ 
      user: shouldCreateUser ? user : null, 
      profile,
      message: 'Profile created successfully'
    })
  } catch (error) {
    console.error('Create profile API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
