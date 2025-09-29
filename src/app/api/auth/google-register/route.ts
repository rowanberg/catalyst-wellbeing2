import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      schoolId,
      firstName,
      lastName,
      email,
      password,
      role,
      gradeLevel,
      className,
      avatarUrl,
      selectedGrades,
      children
    } = await request.json()

    console.log('🔄 Processing Google OAuth registration for:', email)

    // Update user password in Supabase Auth for additional security
    if (password) {
      try {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: password }
        )
        
        if (passwordError) {
          console.warn('⚠️ Failed to set password for Google user:', passwordError)
        } else {
          console.log('✅ Password set for Google OAuth user')
        }
      } catch (error) {
        console.warn('⚠️ Error setting password for Google user:', error)
      }
    }

    // Verify school exists
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, name')
      .eq('school_code', schoolId)
      .single()

    if (schoolError || !school) {
      console.error('❌ School verification failed:', schoolError)
      return NextResponse.json(
        { error: 'Invalid school ID' },
        { status: 400 }
      )
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        role: role,
        school_id: school.id,
        avatar_url: avatarUrl,
        grade_level: gradeLevel,
        class_name: className,
        xp: 0,
        gems: 0,
        level: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    console.log('✅ Profile created successfully for Google user')

    // Handle role-specific setup
    if (role === 'teacher' && selectedGrades && selectedGrades.length > 0) {
      console.log('🔄 Setting up teacher grade assignments...')
      
      // Assign teacher to grade levels
      for (const gradeId of selectedGrades) {
        try {
          await supabase
            .from('teacher_class_assignments')
            .insert({
              teacher_id: userId,
              grade_level_id: gradeId,
              school_id: school.id,
              is_primary_teacher: selectedGrades.indexOf(gradeId) === 0,
              created_at: new Date().toISOString()
            })
        } catch (error) {
          console.warn('⚠️ Failed to assign grade level:', gradeId, error)
        }
      }
    }

    if (role === 'parent' && children && children.length > 0) {
      console.log('🔄 Setting up parent-child relationships...')
      
      // Create parent-child relationships
      for (const child of children) {
        if (child.verified) {
          try {
            await supabase
              .from('parent_child_relationships')
              .insert({
                parent_id: userId,
                child_email: child.email,
                child_name: child.name,
                school_id: school.id,
                verified: true,
                created_at: new Date().toISOString()
              })
          } catch (error) {
            console.warn('⚠️ Failed to create parent-child relationship:', child.email, error)
          }
        }
      }
    }

    // Clear Google OAuth data from session storage (this will be handled on client side)
    
    return NextResponse.json({
      success: true,
      user: { id: userId, email },
      profile: profile,
      message: 'Google OAuth registration completed successfully'
    })

  } catch (error: any) {
    console.error('❌ Google OAuth registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
