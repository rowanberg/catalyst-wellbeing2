import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Function to clean up messages older than 1 month
async function cleanupOldMessages() {
  try {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    const { data: deletedMessages, error } = await supabaseAdmin
      .from('family_messages')
      .delete()
      .lt('created_at', oneMonthAgo.toISOString())
    
    if (error) {
      console.error('Error cleaning up old messages:', error)
    } else {
      console.log(`Cleaned up messages older than ${oneMonthAgo.toISOString()}`)
    }
  } catch (error: any) {
    console.error('Error in cleanup function:', error)
  }
}

export async function GET(request: NextRequest) {
  console.log('Family messaging API GET called')
  
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    
    // Create Supabase client with cookies
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    console.log('Supabase client created')

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check:', { hasUser: !!user, authError })

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    console.log('User ID:', userId)
    
    // If conversation_id is provided, fetch messages for that conversation
    if (conversationId) {
      console.log('Fetching messages for conversation:', conversationId)
      
      // Get user profile with minimal data
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      
      // Optimized query - only fetch recent messages (last 7 days for better performance)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data: messages, error: messagesError } = await supabaseAdmin
        .from('family_messages')
        .select('id, message_text, sender_id, receiver_id, created_at, is_read')
        .eq('conversation_id', conversationId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(100) // Limit to last 100 messages for performance

      if (messagesError) {
        console.error('Error fetching messages:', messagesError)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
      }

      console.log('Found messages:', messages?.length || 0)
      
      // Set cache headers for better performance
      const response = NextResponse.json({ messages: messages || [] })
      response.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=10')
      return response
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, role, school_id')
      .eq('user_id', user.id)
      .single()

    console.log('Profile query result:', { profile, profileError })

    if (profileError || !profile) {
      console.log('Profile not found or error:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Fetch family conversations and children/parents based on user role
    let conversations: any[] = []
    let children: any[] = []
    let parents: any[] = []
    
    console.log('User role:', profile.role)
    
    if (profile.role === 'parent') {
      console.log('Fetching children for parent profile ID:', profile.id)
      
      // Get all children linked to this parent
      const { data: childRelationships, error: childrenError } = await supabaseAdmin
        .from('parent_child_relationships')
        .select(`
          id,
          child_id,
          profiles:child_id (
            id,
            first_name,
            last_name,
            grade_level
          )
        `)
        .eq('parent_id', profile.id)

      console.log('Children query result:', { childRelationships, childrenError })

      if (childrenError) {
        console.error('Error fetching children:', childrenError)
        return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
      }

      children = childRelationships?.map((rel: any) => ({
        id: rel.profiles?.id,
        name: `${rel.profiles?.first_name || ''} ${rel.profiles?.last_name || ''}`.trim(),
        grade: rel.profiles?.grade_level || 'N/A',
        relationshipId: rel.id
      })) || []

      console.log('Transformed children array:', children)

      // Get existing conversations with children
      const { data: parentConversations, error: conversationsError } = await supabaseAdmin
        .from('family_conversations')
        .select(`
          id,
          child_id,
          created_at,
          updated_at,
          profiles:child_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('parent_id', profile.id)

      console.log('Parent conversations query result:', { parentConversations, conversationsError })

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError)
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
      }

      conversations = parentConversations?.map((conv: any) => ({
        id: conv.id,
        participantId: conv.profiles?.id,
        participantName: `${conv.profiles?.first_name || ''} ${conv.profiles?.last_name || ''}`.trim(),
        participantRole: 'student',
        lastMessage: null,
        unreadCount: 0,
        updatedAt: conv.updated_at
      })) || []

      console.log('Transformed parent conversations:', conversations)

    } else if (profile.role === 'student') {
      // Get all parents linked to this student
      console.log('Fetching parents for student profile ID:', profile.id)
      
      const { data: parentRelationships, error: parentsError } = await supabaseAdmin
        .from('parent_child_relationships')
        .select(`
          id,
          parent_id,
          profiles:parent_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('child_id', profile.id)

      console.log('Parent relationships query result:', { parentRelationships, parentsError })

      if (parentsError) {
        console.error('Error fetching parents:', parentsError)
        return NextResponse.json({ error: 'Failed to fetch parents' }, { status: 500 })
      }

      parents = parentRelationships?.map((rel: any) => ({
        id: rel.profiles?.id,
        name: `${rel.profiles?.first_name || ''} ${rel.profiles?.last_name || ''}`.trim(),
        email: 'N/A', // Email field doesn't exist in profiles table
        relationshipId: rel.id
      })) || []

      console.log('Transformed parents array:', parents)

      // Get existing conversations with parents
      const { data: studentConversations, error: conversationsError } = await supabaseAdmin
        .from('family_conversations')
        .select(`
          id,
          parent_id,
          created_at,
          updated_at,
          profiles:parent_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('child_id', profile.id)

      console.log('Student conversations query result:', { studentConversations, conversationsError })

      if (conversationsError) {
        console.error('Error fetching student conversations:', conversationsError)
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
      }

      conversations = studentConversations?.map((conv: any) => ({
        id: conv.id,
        participantId: conv.profiles?.id,
        participantName: `${conv.profiles?.first_name || ''} ${conv.profiles?.last_name || ''}`.trim(),
        participantRole: 'parent',
        lastMessage: null,
        unreadCount: 0,
        updatedAt: conv.updated_at
      })) || []

      console.log('Transformed student conversations:', conversations)
    }

    console.log('Final API response:', { 
      conversations: conversations.length,
      children: children.length,
      parents: parents.length,
      userRole: profile.role
    })

    return NextResponse.json({ 
      conversations,
      children,
      parents,
      userRole: profile.role
    })

  } catch (error: any) {
    console.error('Error in family messaging GET:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with cookies for authentication
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { participantId, participantRole, messageText, messageType = 'text' } = body

    // Handle conversation creation (when clicking "Message" button)
    if (participantId && participantRole && !messageText) {
      // Determine parent and child IDs based on roles
      let parentId, childId
      
      if (profile.role === 'parent' && participantRole === 'student') {
        parentId = profile.id
        childId = participantId
      } else if (profile.role === 'student' && participantRole === 'parent') {
        childId = profile.id
        parentId = participantId
      } else {
        return NextResponse.json({ error: 'Invalid role combination' }, { status: 403 })
      }

      // Verify parent-child relationship exists
      const { data: relationship, error: relationshipError } = await supabaseAdmin
        .from('parent_child_relationships')
        .select('id')
        .eq('parent_id', parentId)
        .eq('child_id', childId)
        .single()

      if (relationshipError || !relationship) {
        return NextResponse.json({ error: 'No parent-child relationship found' }, { status: 403 })
      }

      // Create or get conversation
      const { data: conversationData, error: conversationError } = await supabaseAdmin
        .rpc('create_family_conversation_if_not_exists', {
          p_parent_id: parentId,
          p_child_id: childId
        })

      if (conversationError) {
        return NextResponse.json({ error: conversationError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        conversationId: conversationData,
        success: true 
      })
    }

    // Handle message sending - support both old and new formats
    const { receiverId, participantId: msgParticipantId, conversationId: msgConversationId } = body
    
    console.log('POST request body:', body)
    
    if (!messageText) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 })
    }
    
    // Support both receiverId (old format) and participantId (new format)
    const targetReceiverId = receiverId || msgParticipantId
    
    if (!targetReceiverId) {
      return NextResponse.json({ error: 'Receiver ID or Participant ID is required' }, { status: 400 })
    }

    // Determine parent and child IDs based on roles
    let parentId, childId
    
    if (profile.role === 'parent') {
      parentId = profile.id
      childId = targetReceiverId
    } else if (profile.role === 'student') {
      childId = profile.id
      parentId = targetReceiverId
    } else {
      return NextResponse.json({ error: 'Invalid user role for family messaging' }, { status: 403 })
    }

    // Verify parent-child relationship exists
    const { data: relationship, error: relationshipError } = await supabaseAdmin
      .from('parent_child_relationships')
      .select('id')
      .eq('parent_id', parentId)
      .eq('child_id', childId)
      .single()

    if (relationshipError || !relationship) {
      return NextResponse.json({ error: 'No parent-child relationship found' }, { status: 403 })
    }

    // Use provided conversationId or create/get conversation
    let finalConversationId = msgConversationId
    
    if (!finalConversationId) {
      const { data: conversationData, error: conversationError } = await supabaseAdmin
        .rpc('create_family_conversation_if_not_exists', {
          p_parent_id: parentId,
          p_child_id: childId
        })

      if (conversationError) {
        return NextResponse.json({ error: conversationError.message }, { status: 500 })
      }

      finalConversationId = conversationData
    }

    // Insert the message with minimal data for speed
    const { data: message, error: messageError } = await supabaseAdmin
      .from('family_messages')
      .insert({
        conversation_id: finalConversationId,
        sender_id: profile.id,
        receiver_id: targetReceiverId,
        message_text: messageText,
        message_type: messageType
      })
      .select('id, message_text, message_type, is_read, created_at, sender_id, receiver_id')
      .single()

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 500 })
    }

    // Update conversation timestamp asynchronously (don't wait)
    void (async () => {
      try {
        await supabaseAdmin
          .from('family_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', finalConversationId)
        console.log('Conversation timestamp updated')
      } catch (err: any) {
        console.error('Failed to update conversation timestamp:', err)
      }
    })()

    // Return immediately without waiting for cleanup
    const response = NextResponse.json({ message, conversationId: finalConversationId })
    
    // Run cleanup asynchronously (don't block response)
    cleanupOldMessages().catch((err: any) => console.error('Cleanup failed:', err))
    
    return response
  } catch (error: any) {
    console.error('Family messaging POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = supabaseAdmin
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { messageIds } = body

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: 'Invalid message IDs' }, { status: 400 })
    }

    // Mark messages as read
    const { error: updateError } = await supabase
      .from('family_messages')
      .update({ is_read: true })
      .in('id', messageIds)
      .eq('receiver_id', profile.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Family messaging PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
