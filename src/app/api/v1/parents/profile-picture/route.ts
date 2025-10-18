import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { parentId, imageData } = body

    if (!parentId || !imageData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the user owns this parent profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, user_id, avatar_url')
      .eq('id', parentId)
      .eq('role', 'parent')
      .single()

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - Not your profile' },
        { status: 403 }
      )
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Generate unique filename
    const fileExt = 'jpg'
    const fileName = `${parentId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    // Create admin client for storage operations
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Delete old profile picture if exists
    if (profile.avatar_url && profile.avatar_url.includes('supabase')) {
      try {
        const urlParts = profile.avatar_url.split('/')
        const oldFileName = urlParts[urlParts.length - 1]
        if (oldFileName && oldFileName !== fileName) {
          await supabaseAdmin.storage
            .from('avatars')
            .remove([oldFileName])
        }
      } catch (deleteError) {
        console.log('Note: Could not delete old avatar (may not exist):', deleteError)
      }
    }

    // Upload to Supabase Storage using admin client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Storage upload error details:', {
        message: uploadError.message,
        error: uploadError,
        filePath,
        bufferSize: buffer.length
      })
      return NextResponse.json(
        { error: `Storage error: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath)

    console.log('✅ Image uploaded successfully to:', publicUrl)

    // Update the profile with new avatar URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', parentId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile picture' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        avatar_url: updatedProfile.avatar_url
      }
    })

  } catch (error) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
