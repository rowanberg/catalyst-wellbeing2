import { getSupabaseAdmin } from '@/lib/supabase/admin-client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const { parentId, studentId, studentEmail } = await request.json()

    // Validate input - both fields are required
    if (!parentId || !studentId || !studentEmail) {
      return NextResponse.json(
        { error: 'Parent ID, Student ID, and Student Email are all required' },
        { status: 400 }
      )
    }

    console.log('Link request:', { parentId, studentId, studentEmail })

    // Get parent profile to get user_id (parent_child_relationships uses user_id, not profile id)
    const { data: parentProfile, error: parentError } = await supabase
      .from('profiles')
      .select('id, user_id, email, role')
      .eq('id', parentId)
      .single()

    console.log('Parent profile lookup:', { 
      searchedId: parentId,
      found: parentProfile,
      error: parentError 
    })

    if (parentError || !parentProfile) {
      // Try to find ANY profile with this ID to debug
      const { data: anyProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', parentId)
        .single()
      
      console.log('Debug - any profile with this ID:', anyProfile)
      
      return NextResponse.json(
        { error: `Parent profile not found. Searched for ID: ${parentId}` },
        { status: 404 }
      )
    }

    // Find student profile by ID - profiles table uses 'id' field
    const { data: studentProfile, error: studentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single()

    console.log('Student profile by ID (all fields):', { studentProfile, studentError })

    if (studentError || !studentProfile) {
      return NextResponse.json(
        { error: 'Student not found with that ID' },
        { status: 404 }
      )
    }

    // Get the student's auth user to get email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(studentProfile.user_id)
    
    console.log('Student auth user:', { authUser, authError })

    const studentActualEmail = authUser?.user?.email || studentProfile.email

    // Verify email matches
    if (studentActualEmail && studentActualEmail !== studentEmail) {
      return NextResponse.json(
        { error: `Email mismatch. Student email is ${studentActualEmail}, you entered ${studentEmail}` },
        { status: 400 }
      )
    }

    // If no email found anywhere, just proceed with the link
    if (!studentActualEmail) {
      console.log('Warning: No email found for student, proceeding without email verification')
    }

    // Check if link already exists - use user_id for both parent and child
    const { data: existingLink } = await supabase
      .from('parent_child_relationships')
      .select('id')
      .eq('parent_id', parentProfile.user_id)
      .eq('child_id', studentProfile.user_id)
      .single()

    console.log('Existing link check:', { existingLink })

    if (existingLink) {
      return NextResponse.json(
        { error: 'This child is already linked to your account' },
        { status: 400 }
      )
    }

    // Create the parent-child relationship - use user_id for both parent and child
    const { error: linkError } = await supabase
      .from('parent_child_relationships')
      .insert({
        parent_id: parentProfile.user_id,
        child_id: studentProfile.user_id,
        school_id: studentProfile.school_id,
        created_at: new Date().toISOString()
      })

    if (linkError) {
      console.error('Error creating link:', linkError)
      return NextResponse.json(
        { error: 'Failed to link child' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Child linked successfully',
      student: {
        id: studentProfile.id,
        name: `${studentProfile.first_name} ${studentProfile.last_name}`,
        email: studentProfile.email
      }
    })

  } catch (error) {
    console.error('Error in link-child API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
