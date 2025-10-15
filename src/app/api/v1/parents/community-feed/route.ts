/**
 * Parent Community Feed API
 * GET /api/v1/parents/community-feed?student_id={student_id}&page={page_number}
 */
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponse } from '@/lib/api/response'
import { validateQueryParams, ParentCommunityFeedQuerySchema } from '@/lib/validations/api-schemas'
import { handleSecureError, AuthorizationError } from '@/lib/security/error-handler'
import { rateLimiters } from '@/lib/security/enhanced-rate-limiter'

export async function GET(request: NextRequest) {
  return rateLimiters.apiGeneral(request, async () => {
    const requestId = `feed-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    try {
      // Validate query parameters
      const { searchParams } = new URL(request.url)
      const params = Object.fromEntries(searchParams.entries())
      const { student_id, limit, offset, post_type } = validateQueryParams(
        ParentCommunityFeedQuerySchema, 
        params
      )

      // Use user-context client for RLS enforcement
      const supabase = await createClient()
      
      // Verify authentication - check session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error(`[${requestId}] No valid session found:`, sessionError?.message || 'Session is null')
        return ApiResponse.unauthorized('Authentication required')
      }
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error(`[${requestId}] Auth error:`, authError?.message || 'User is null')
        return ApiResponse.unauthorized('Authentication required')
      }
      
      // Get parent's profile
      const { data: parentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, school_id')
        .eq('user_id', user.id)
        .single()
      
      if (profileError || !parentProfile || parentProfile.role !== 'parent') {
        throw new AuthorizationError('Only parents can access this endpoint')
      }
      
      // Get student's user_id from their profile_id
      const { data: studentUserData, error: studentProfileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', student_id)
        .single()
      
      if (studentProfileError || !studentUserData) {
        console.warn(`[${requestId}] Student profile not found: ${student_id}`)
        throw new AuthorizationError('Student not found')
      }

      // CRITICAL: Verify parent-child relationship (using user_ids, not profile_ids)
      const { data: relationship, error: relationshipError } = await supabase
        .from('parent_child_relationships')
        .select('id')
        .eq('parent_id', user.id)  // parent's user_id
        .eq('child_id', studentUserData.user_id)  // child's user_id
        .single()
      
      if (relationshipError || !relationship) {
        console.warn(`[${requestId}] Unauthorized feed access by user ${user.id} to student ${student_id}`)
        throw new AuthorizationError('You do not have permission to view this student\'s feed')
      }

      // Authorization verified - proceed with data fetching
      // Get student data
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('school_id, user_id')
        .eq('id', student_id)
        .single()

      if (!studentProfile) {
        return ApiResponse.notFound('Student not found')
      }

      const schoolId = studentProfile.school_id

    // Fetch school information for welcome message
    let schoolInfo: { id: string; name: string; logo_url: string | null } | null = null
    if (schoolId) {
      const { data: school } = await supabase
        .from('schools')
        .select('id, name, logo_url')
        .eq('id', schoolId)
        .single()
      
      schoolInfo = school || null
    }

    // Fetch student's classes with full details including teachers
    const { data: studentClasses } = await supabase
      .from('student_class_assignments')
      .select(`
        class_id,
        classes:classes(
          id,
          name,
          grade_level,
          subject,
          teacher_id,
          teacher:profiles!teacher_id(
            first_name,
            last_name
          )
        )
      `)
      .eq('student_id', student_id)
      .eq('is_active', true)

    const classIds = studentClasses?.map(c => c.class_id) || []
    
    // Format class info with teachers - properly type the Supabase response
    const classesInfo = studentClasses?.map(sc => {
      const classData = sc.classes as any
      const teacherData = classData?.teacher ? (Array.isArray(classData.teacher) ? classData.teacher[0] : classData.teacher) : null
      
      return {
        id: classData?.id,
        name: classData?.name,
        gradeLevel: classData?.grade_level,
        subject: classData?.subject,
        teacher: teacherData ? {
          name: `${teacherData.first_name} ${teacherData.last_name}`
        } : null
      }
    }).filter(c => c.id) || []
    
    // If no classes found, still need to show all_parents posts
    const hasClasses = classIds.length > 0

    // Fetch community posts
    let postsQuery = supabase
      .from('community_posts')
      .select(`
        id,
        title,
        content,
        post_type,
        visibility,
        is_pinned,
        created_at,
        media_urls,
        teacher_id,
        teacher:profiles!teacher_id(
          id,
          first_name,
          last_name,
          avatar_url
        ),
        reactions:post_reactions(
          reaction,
          parent_id
        ),
        views:post_views(
          parent_id,
          viewed_at
        )
      `, { count: 'exact' })
    
    // Build visibility filter based on whether student has classes
    if (hasClasses) {
      postsQuery = postsQuery.or(`visibility.eq.all_parents,and(visibility.eq.class_parents,class_id.in.(${classIds.join(',')}))`)
    } else {
      // Student has no classes, only show all_parents posts
      postsQuery = postsQuery.eq('visibility', 'all_parents')
    }

    // Filter out any database welcome posts (if column exists from migration)
    // We now show welcome in UI, not database
    try {
      postsQuery = postsQuery.eq('is_school_welcome_post', false)
    } catch (error) {
      // Column doesn't exist, ignore
    }

      // Apply post type filter if specified
      if (post_type) {
        postsQuery = postsQuery.eq('post_type', post_type)
      }

      const { data: posts, count } = await postsQuery
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset ?? 0, (offset ?? 0) + (limit ?? 20) - 1)

    // Helper function to process a post
    const processPost = (post: any) => {
      const reactionCounts = post.reactions?.reduce((acc: any, r: any) => {
        acc[r.reaction] = (acc[r.reaction] || 0) + 1
        return acc
      }, {})

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        media: post.media_urls || [],
        type: post.post_type,
        isPinned: post.is_pinned,
        createdAt: post.created_at,
        teacher: {
          id: post.teacher.id,
          name: `${post.teacher.first_name} ${post.teacher.last_name}`,
          avatar: post.teacher.avatar_url
        },
        reactions: reactionCounts || {},
        totalReactions: post.reactions?.length || 0,
        isViewed: post.views?.some((v: any) => v.parent_id === student_id) || false
      }
    }

    // Process posts
    const processedPosts = posts?.map(processPost) || []

      return ApiResponse.success({
        posts: processedPosts,
        school: schoolInfo,
        classes: classesInfo,
        pagination: {
          offset: offset ?? 0,
          limit: limit ?? 20,
          totalCount: count || 0,
          hasMore: ((offset ?? 0) + (limit ?? 20)) < (count || 0)
        }
      })

    } catch (error: any) {
      return handleSecureError(error, 'ParentCommunityFeed', requestId)
    }
  })
}

// POST endpoint for reactions (with authorization)
export async function POST(request: NextRequest) {
  return rateLimiters.apiGeneral(request, async () => {
    const requestId = `reaction-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    try {
      const supabase = await createClient()
      
      // Verify authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return ApiResponse.unauthorized('Authentication required')
      }
      
      const body = await request.json()
      const { postId, reaction } = body

      if (!postId || !reaction) {
        return ApiResponse.badRequest('Missing required fields')
      }

      const validReactions = ['like', 'love', 'celebrate', 'thanks', 'interesting']
      if (!validReactions.includes(reaction)) {
        return ApiResponse.badRequest('Invalid reaction type')
      }
      
      // Get parent profile
      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!parentProfile) {
        return ApiResponse.unauthorized('Parent profile not found')
      }

      // Upsert reaction (RLS will enforce parent can only react to posts they have access to)
      const { data, error } = await supabase
        .from('post_reactions')
        .upsert(
          { 
            post_id: postId,
            parent_id: parentProfile.id,
            reaction 
          },
          { 
            onConflict: 'post_id,parent_id'
          }
        )
        .select()
        .single()

      if (error) {
        console.error(`[${requestId}] Reaction error:`, error)
        return ApiResponse.error('Failed to add reaction', 500)
      }

      // Mark post as viewed
      await supabase
        .from('post_views')
        .upsert(
          {
            post_id: postId,
            parent_id: parentProfile.id,
            viewed_at: new Date().toISOString()
          },
          {
            onConflict: 'post_id,parent_id'
          }
        )

      return ApiResponse.success(data)

    } catch (error: any) {
      return handleSecureError(error, 'PostReaction', requestId)
    }
  })
}
