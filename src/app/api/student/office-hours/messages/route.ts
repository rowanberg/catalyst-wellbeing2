import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is part of this conversation
    const { data: conversation, error: convError } = await supabase
      .from('office_hours_conversations')
      .select('student_id, teacher_id, status')
      .eq('id', conversationId)
      .eq('student_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
    }

    // Get messages for this conversation
    const { data: messages, error: messagesError } = await supabase
      .from('office_hours_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Mark teacher messages as read
    await supabase
      .from('office_hours_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'teacher')
      .eq('is_read', false)

    // Format messages
    const formattedMessages = messages?.map(message => ({
      id: message.id,
      content: message.content,
      timestamp: message.created_at,
      sender: message.sender_type === 'student' ? 'student' : 'teacher',
      status: message.is_read ? 'read' : 'sent',
      isModerated: message.is_moderated || false
    })) || []

    return NextResponse.json({ messages: formattedMessages })

  } catch (error) {
    console.error('Unexpected error in office hours messages API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
