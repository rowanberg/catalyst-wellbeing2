import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/security/enhanced-rate-limiter'
import { validateUploadedFile, generateSecureFilename } from '@/lib/security/file-validation'
import { handleSecureError } from '@/lib/security/error-handler'
import sharp from 'sharp'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

// Maximum file size in bytes (2MB for better performance)
const MAX_FILE_SIZE = 2 * 1024 * 1024

// Allowed file types (validated by magic numbers)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  return rateLimiters.fileUpload(request, async () => {
    const requestId = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`
    let buffer: Buffer | null = null
    
    try {
      const auth = await authenticateStudent(request)
      
      if (isAuthError(auth)) {
        if (auth.status === 401) {
          return NextResponse.json({ 
            error: 'Authentication required',
            code: 'UNAUTHORIZED' 
          }, { status: 401 })
        }
        
        if (auth.status === 403) {
          return NextResponse.json({ 
            error: 'Student access required',
            code: 'FORBIDDEN' 
          }, { status: 403 })
        }
        
        return NextResponse.json({ 
          error: auth.error || 'Authentication failed',
          code: 'AUTH_ERROR' 
        }, { status: auth.status })
      }
      
      const { supabase, userId } = auth

      // Get form data
      const formData = await request.formData()
      const file = formData.get('profilePicture') as File
      
      if (!file) {
        return NextResponse.json({ 
          error: 'No file provided',
          code: 'MISSING_FILE' 
        }, { status: 400 })
      }

      // Comprehensive file validation with magic number checking
      const validation = await validateUploadedFile(file, {
        allowedTypes: ALLOWED_TYPES,
        maxSize: MAX_FILE_SIZE
      })
      
      if (!validation.valid) {
        console.warn(`[${requestId}] File validation failed: ${validation.error}`)
        return NextResponse.json({ 
          error: validation.error,
          code: 'INVALID_FILE'
        }, { status: 400 })
      }

      // Generate secure filename
      const fileName = generateSecureFilename(validation.sanitizedFilename!, userId)
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
        
        buffer = optimizedBuffer
      } catch (imageError) {
        console.error(`[${requestId}] Image optimization failed:`, imageError)
        throw new Error('Failed to process image')
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '3600' // Cache for 1 hour
        })
      
      buffer = null

      if (uploadError) {
        console.error(`[${requestId}] Storage upload error:`, uploadError)
        return NextResponse.json({ 
          error: 'Failed to upload image',
          code: 'UPLOAD_FAILED'
        }, { status: 500 })
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath)

      // Update user profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId) // Use user_id for proper authorization

      if (updateError) {
        console.error(`[${requestId}] Profile update error:`, updateError)
        
        // Try to delete the uploaded image if profile update fails (cleanup)
        try {
          await supabase.storage
            .from('profile-pictures')
            .remove([filePath])
        } catch (deleteError) {
          console.error(`[${requestId}] Failed to cleanup:`, deleteError)
        }
        
        return NextResponse.json({ 
          error: 'Failed to update profile',
          code: 'UPDATE_FAILED'
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        imageUrl: publicUrl,
        message: 'Profile picture updated successfully'
      })

    } catch (error: any) {
      // Ensure buffer is cleared on error
      if (buffer) {
        buffer = null
      }
      
      return handleSecureError(error, 'ProfilePictureUpload', requestId)
    } finally {
      // Always clear buffer to prevent memory leaks
      if (buffer) {
        buffer = null
      }
    }
  })
}

export async function DELETE(request: NextRequest) {
  const requestId = `delete-${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      if (auth.status === 401) {
        return NextResponse.json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        }, { status: 401 })
      }
      
      if (auth.status === 403) {
        return NextResponse.json({ 
          error: 'Student access required',
          code: 'FORBIDDEN' 
        }, { status: 403 })
      }
      
      return NextResponse.json({ 
        error: auth.error || 'Authentication failed',
        code: 'AUTH_ERROR' 
      }, { status: auth.status })
    }
    
    const { supabase, userId } = auth

    // Get current profile picture URL
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_picture_url')
      .eq('user_id', userId) // Use user_id for proper authorization
      .single()

    if (profileError || !profile?.profile_picture_url) {
      return NextResponse.json({ 
        error: 'No profile picture to delete',
        code: 'NOT_FOUND' 
      }, { status: 404 })
    }

    // Extract file path from URL
    const url = new URL(profile.profile_picture_url)
    const filePath = url.pathname.split('/').slice(-2).join('/') // Get last two segments

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('profile-pictures')
      .remove([filePath])

    if (deleteError) {
      console.error(`[${requestId}] Storage delete error:`, deleteError)
    }

    // Update profile to remove image URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        profile_picture_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId) // Use user_id for proper authorization

    if (updateError) {
      console.error(`[${requestId}] Profile update error:`, updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile',
        code: 'UPDATE_FAILED' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile picture removed successfully'
    })

  } catch (error: any) {
    return handleSecureError(error, 'ProfilePictureDelete', requestId)
  }
}
