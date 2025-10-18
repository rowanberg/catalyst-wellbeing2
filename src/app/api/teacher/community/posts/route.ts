import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'

// GET - Fetch posts for a class
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')
    const teacherId = searchParams.get('teacher_id')

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Verify teacher has access to this class
    const { data: teacherClass, error: accessError } = await supabase
      .from('teacher_class_assignments')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('class_id', classId)
      .single()

    if (accessError || !teacherClass) {
      return NextResponse.json({ error: 'Access denied to this class' }, { status: 403 })
    }

    // Fetch posts for the class
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        media_urls,
        is_pinned,
        created_at,
        teacher_id,
        profiles!community_posts_teacher_id_fkey (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('class_id', classId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    // Fetch reaction counts for each post
    const postIds = posts?.map(p => p.id) || []
    const { data: reactions } = await supabase
      .from('post_reactions')
      .select('post_id, user_id')
      .in('post_id', postIds)

    // Format the response
    const formattedPosts = posts?.map(post => {
      const postReactions = reactions?.filter(r => r.post_id === post.id) || []
      const hasReacted = postReactions.some(r => r.user_id === teacherId)
      
      // Handle profiles - it might be array or object depending on query
      const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
      
      // Extract first image from media_urls if exists
      const mediaUrls = post.media_urls || []
      const firstImage = Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls[0]?.url : null
      
      return {
        id: post.id,
        content: post.content,
        image_url: firstImage,
        is_pinned: post.is_pinned,
        created_at: post.created_at,
        teacher_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Teacher',
        teacher_avatar: profile?.avatar_url || null,
        reactions_count: postReactions.length,
        has_reacted: hasReacted
      }
    }) || []

    return NextResponse.json({ posts: formattedPosts })
  } catch (error) {
    console.error('Error in GET /api/teacher/community/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { classId, content, imageData, teacherId, title } = body

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    if (!classId || !content?.trim()) {
      return NextResponse.json({ error: 'Class ID and content are required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Get school_id from the class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('school_id')
      .eq('id', classId)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Verify teacher has access to this class
    const { data: teacherClass, error: accessError } = await supabase
      .from('teacher_class_assignments')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('class_id', classId)
      .single()

    if (accessError || !teacherClass) {
      return NextResponse.json({ error: 'Access denied to this class' }, { status: 403 })
    }

    // Verify user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('user_id', teacherId)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can create posts' }, { status: 403 })
    }

    // Use the profile ID for the post
    const profileId = profile.id

    let imageUrl: string | null = null

    // Upload image if provided
    if (imageData) {
      try {

        // Convert base64 to buffer
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')

        // Generate unique filename
        const fileExt = imageData.match(/data:image\/(\w+);/)?.[1] || 'jpg'
        const fileName = `post-${teacherId}-${Date.now()}.${fileExt}`
        const filePath = `community/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, buffer, {
            contentType: `image/${fileExt}`,
            upsert: false
          })

        if (uploadError) {
          console.error('Image upload error:', uploadError)
          return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        imageUrl = publicUrl
      } catch (uploadError) {
        console.error('Image processing error:', uploadError)
        return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
      }
    }

    // Prepare media_urls array
    const mediaUrls = imageUrl ? [{ type: 'image', url: imageUrl }] : []

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .insert({
        teacher_id: profileId,
        school_id: classData.school_id,
        class_id: classId,
        title: title || content.substring(0, 100),
        content: content.trim(),
        media_urls: mediaUrls,
        post_type: 'announcement',
        is_pinned: false
      })
      .select()
      .single()

    if (postError) {
      console.error('Error creating post:', postError)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      post: {
        ...post,
        reactions_count: 0,
        has_reacted: false
      }
    })
  } catch (error) {
    console.error('Error in POST /api/teacher/community/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
