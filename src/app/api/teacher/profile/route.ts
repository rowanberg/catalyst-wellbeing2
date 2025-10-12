import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'


// GET - Get teacher profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      console.error('User ID:', user.id)
      return NextResponse.json({ 
        error: 'Profile not found', 
        details: profileError.message,
        userId: user.id 
      }, { status: 404 })
    }

    // Check if user is a teacher
    if (profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied. Teacher role required.' }, { status: 403 })
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Error in teacher profile GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update teacher profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current profile to verify teacher role
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (currentProfileError || currentProfile?.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied. Teacher role required.' }, { status: 403 })
    }

    // Get the updated profile data from request body
    const profileData = await request.json()

    // Remove any fields that shouldn't be updated directly
    const {
      id,
      user_id,
      role,
      school_id,
      created_at,
      updated_at,
      ...updateData
    } = profileData

    // Update the profile with all provided fields
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      console.error('Update data:', updateData)
      return NextResponse.json({ 
        error: 'Failed to update profile', 
        details: updateError.message,
        code: updateError.code 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      profile: updatedProfile 
    })

  } catch (error) {
    console.error('Error in teacher profile PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
