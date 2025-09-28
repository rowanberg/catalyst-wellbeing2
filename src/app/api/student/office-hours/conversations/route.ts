import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify student role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden - Student access required' }, { status: 403 })
    }

    // Get student's office hours conversations
    const { data: conversations, error: conversationsError } = await supabase
      .from('office_hours_conversations')
      .select(`
        id,
        teacher_id,
        status,
        created_at,
        updated_at,
        profiles!teacher_id (
          first_name,
          last_name
        )
      `)
      .eq('student_id', user.id)
      .order('updated_at', { ascending: false })

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    // Get last message and unread count for each conversation
    const conversationIds = conversations?.map(c => c.id) || []
    
    const { data: lastMessages, error: messagesError } = await supabase
      .from('office_hours_messages')
      .select('conversation_id, content, created_at, sender_type')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })

    if (messagesError) {
      console.error('Error fetching last messages:', messagesError)
    }

    // Get unread counts
    const { data: unreadCounts, error: unreadError } = await supabase
      .from('office_hours_messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .eq('sender_type', 'teacher')
      .eq('is_read', false)

    if (unreadError) {
      console.error('Error fetching unread counts:', unreadError)
    }

    // Format conversations data
    const formattedConversations = conversations?.map(conversation => {
      const lastMessage = lastMessages?.find(m => m.conversation_id === conversation.id)
      const unreadCount = unreadCounts?.filter(m => m.conversation_id === conversation.id).length || 0
      
      return {
        id: conversation.id,
        teacherId: conversation.teacher_id,
        teacherName: `${conversation.profiles?.[0]?.first_name || ''} ${conversation.profiles?.[0]?.last_name || ''}`.trim(),
        lastMessage: lastMessage?.content || '',
        lastMessageTime: lastMessage?.created_at ? 
          new Date(lastMessage.created_at).toLocaleString() : '',
        unreadCount,
        status: conversation.status
      }
    }) || []

    return NextResponse.json({ conversations: formattedConversations })

  } catch (error) {
    console.error('Unexpected error in office hours conversations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
