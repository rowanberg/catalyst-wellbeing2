import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('profilePicture') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an image.' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    // Create unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `profile-${user.id}-${Date.now()}.${fileExtension}`
    const filePath = `profile-pictures/${fileName}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath)

    // Update user profile with new image URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_picture_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      imageUrl: publicUrl,
      message: 'Profile picture updated successfully'
    })

  } catch (error: any) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current profile picture URL
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_picture_url')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.profile_picture_url) {
      return NextResponse.json({ error: 'No profile picture to delete' }, { status: 404 })
    }

    // Extract file path from URL
    const url = new URL(profile.profile_picture_url)
    const filePath = url.pathname.split('/').slice(-2).join('/') // Get last two segments

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('profile-pictures')
      .remove([filePath])

    if (deleteError) {
      console.error('Storage delete error:', deleteError)
    }

    // Update profile to remove image URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_picture_url: null })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile picture removed successfully'
    })

  } catch (error: any) {
    console.error('Profile picture delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
