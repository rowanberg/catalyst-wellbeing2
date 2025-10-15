/**
 * Teacher Create Post API
 * POST /api/teacher/create-post
 * Handles post creation with multi-class support and media attachments
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const content = formData.get('content') as string
    const teacherId = formData.get('teacherId') as string
    const classesJson = formData.get('classes') as string
    
    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    if (!content && !formData.get('attachment_0')) {
      return NextResponse.json(
        { success: false, error: 'Content or attachments required' },
        { status: 400 }
      )
    }

    const selectedClasses = classesJson ? JSON.parse(classesJson) : []
    
    if (selectedClasses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one class must be selected' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Get teacher profile info
    const { data: teacherProfile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('user_id', teacherId)
      .single()

    if (!teacherProfile) {
      return NextResponse.json(
        { success: false, error: 'Teacher profile not found' },
        { status: 404 }
      )
    }

    // Process attachments and upload to storage
    const mediaAttachments: Array<{
      type: 'image' | 'video' | 'document' | 'voice'
      url: string
      thumbnail?: string
      name?: string
    }> = []

    let attachmentIndex = 0
    while (formData.get(`attachment_${attachmentIndex}`)) {
      const file = formData.get(`attachment_${attachmentIndex}`) as File
      const fileType = formData.get(`attachment_${attachmentIndex}_type`) as string
      
      if (file) {
        // Upload to Supabase Storage
        const fileName = `${Date.now()}_${file.name}`
        const filePath = `community-posts/${teacherId}/${fileName}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('community-media')
          .upload(filePath, file)

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('community-media')
            .getPublicUrl(filePath)

          mediaAttachments.push({
            type: fileType as any,
            url: publicUrl,
            name: file.name
          })
        }
      }
      
      attachmentIndex++
    }

    // Create post in database
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .insert({
        teacher_id: teacherProfile.id,
        content: content || '',
        media: mediaAttachments,
        type: 'update',
        is_pinned: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (postError) {
      console.error('Error creating post:', postError)
      return NextResponse.json(
        { success: false, error: 'Failed to create post' },
        { status: 500 }
      )
    }

    // Associate post with selected classes
    const classAssociations = selectedClasses.map((classId: string) => ({
      post_id: post.id,
      class_id: classId
    }))

    const { error: assocError } = await supabase
      .from('post_class_associations')
      .insert(classAssociations)

    if (assocError) {
      console.error('Error creating class associations:', assocError)
      // Continue anyway - post is created, just associations failed
    }

    return NextResponse.json({
      success: true,
      data: {
        postId: post.id,
        message: 'Post created successfully'
      }
    })

  } catch (error: any) {
    console.error('Create post API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
