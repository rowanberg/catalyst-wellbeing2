import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { id } = await params
    
    console.log('🔍 PATCH /api/admin/users/[id] - Starting with ID:', id)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role and get school_id
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!adminProfile.school_id) {
      return NextResponse.json({ error: 'Admin school not found' }, { status: 403 })
    }

    const updateData = await request.json()
    
    // Validate and sanitize the update data
    const allowedFields = ['first_name', 'last_name', 'email', 'role', 'grade_level', 'class_name', 'status']
    const sanitizedData: any = {}
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined && value !== null) {
        sanitizedData[key] = value
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Debug: Check what profiles exist in the database for this school
    const { data: schoolProfiles, error: debugError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, school_id')
      .eq('school_id', adminProfile.school_id)
    
    console.log('🔍 Debug - Profiles in admin school:', schoolProfiles)
    console.log('🔍 Debug - Looking for ID:', id)
    console.log('🔍 Debug - Admin school_id:', adminProfile.school_id)

    // Find the user by matching the ID from the frontend (which is the profile.id)
    const targetUser = schoolProfiles?.find(profile => profile.id === id)
    
    console.log('🔍 Found target user:', targetUser)

    if (!targetUser) {
      console.error('User not found in school profiles')
      return NextResponse.json({ 
        error: 'User not found', 
        details: `Could not find user with ID: ${id} in school ${adminProfile.school_id}`,
        debugInfo: { searchId: id, schoolId: adminProfile.school_id, availableProfiles: schoolProfiles?.map(p => p.id) }
      }, { status: 404 })
    }

    console.log('🔍 Target user found:', { 
      searchId: id, 
      foundUser: targetUser, 
      adminSchoolId: adminProfile.school_id,
      updateData: sanitizedData
    })

    // Update user profile using the correct ID
    const updateId = targetUser.id
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(sanitizedData)
      .eq('id', updateId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update user', 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
