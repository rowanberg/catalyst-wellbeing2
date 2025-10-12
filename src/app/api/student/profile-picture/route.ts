import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/security/rateLimiter'
import sharp from 'sharp' // For image optimization

// Maximum file size in bytes (2MB for better performance)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    let buffer: Buffer | null = null;
    
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
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ 
          error: 'Invalid file type. Allowed formats: JPEG, PNG, WebP, GIF' 
        }, { status: 400 })
      }

      // Validate file size (2MB max for better performance)
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: 'File too large. Maximum size is 2MB.' 
        }, { status: 400 })
      }

    // Create unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `profile-${user.id}-${Date.now()}.${fileExtension}`
    const filePath = `profile-pictures/${fileName}`

      // Convert file to buffer and optimize image
      const bytes = await file.arrayBuffer()
      buffer = Buffer.from(bytes)
      
      // Optimize image using sharp (resize and compress)
      try {
        const optimizedBuffer = await sharp(buffer)
          .resize(400, 400, { 
            fit: 'cover',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toBuffer()
        
        // Replace original buffer with optimized one
        buffer = optimizedBuffer
      } catch (imageError) {
        console.error('Image optimization failed, using original:', imageError)
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, buffer, {
          contentType: 'image/jpeg', // Always save as JPEG after optimization
          upsert: true
        })
      
      // Clear buffer reference immediately after upload
      buffer = null

      if (uploadError) {
        console.error('Storage upload error')
        return NextResponse.json({ 
          error: 'Failed to upload image. Please try again.' 
        }, { status: 500 })
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
        console.error('Profile update error')
        
        // Try to delete the uploaded image if profile update fails
        try {
          await supabase.storage
            .from('profile-pictures')
            .remove([filePath])
        } catch (deleteError) {
          console.error('Failed to cleanup uploaded image')
        }
        
        return NextResponse.json({ 
          error: 'Failed to update profile. Please try again.' 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        imageUrl: publicUrl,
        message: 'Profile picture updated successfully'
      })

    } catch (error: any) {
      console.error('Profile picture upload error')
      
      // Ensure buffer is cleared on error
      if (buffer) {
        buffer = null
      }
      
      // Never expose internal error details to client
      return NextResponse.json({ 
        error: 'Failed to process image upload. Please try again.',
        code: 'UPLOAD_ERROR'
      }, { status: 500 })
    } finally {
      // Always clear buffer to prevent memory leaks
      if (buffer) {
        buffer = null
      }
      
      // Force garbage collection hint (Node.js will decide when to actually run GC)
      if (global.gc) {
        global.gc()
      }
    }
  }, 'upload');
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
