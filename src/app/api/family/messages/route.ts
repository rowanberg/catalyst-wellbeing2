import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('family_conversations')
      .select('parent_id, child_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const hasAccess = conversation.parent_id === profile.id || conversation.child_id === profile.id
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('family_messages')
      .select(`
        id,
        message_text,
        message_type,
        is_read,
        created_at,
        sender_id,
        receiver_id,
        sender:profiles!family_messages_sender_id_fkey (
          id,
          first_name,
          last_name,
          role
        ),
        receiver:profiles!family_messages_receiver_id_fkey (
          id,
          first_name,
          last_name,
          role
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Error fetching messages' }, { status: 500 })
    }

    const formattedMessages = messages?.map((msg: any) => ({
      id: msg.id,
      text: msg.message_text,
      type: msg.message_type,
      isRead: msg.is_read,
      createdAt: msg.created_at,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      senderName: `${msg.sender.first_name} ${msg.sender.last_name}`,
      senderRole: msg.sender.role,
      receiverName: `${msg.receiver.first_name} ${msg.receiver.last_name}`,
      receiverRole: msg.receiver.role,
      isFromCurrentUser: msg.sender_id === profile.id
    })) || []

    return NextResponse.json({ messages: formattedMessages })

  } catch (error) {
    console.error('Error in family messages API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, message, receiverId } = await request.json()

    if (!conversationId || !message || !receiverId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('family_conversations')
      .select('parent_id, child_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const hasAccess = conversation.parent_id === profile.id || conversation.child_id === profile.id
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Send message
    const { data: newMessage, error: messageError } = await supabase
      .from('family_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        receiver_id: receiverId,
        message_text: message,
        message_type: 'text'
      })
      .select(`
        id,
        message_text,
        message_type,
        is_read,
        created_at,
        sender_id,
        receiver_id
      `)
      .single()

    if (messageError) {
      console.error('Error sending message:', messageError)
      return NextResponse.json({ error: 'Error sending message' }, { status: 500 })
    }

    // Update conversation timestamp
    await supabase
      .from('family_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return NextResponse.json({ 
      message: {
        id: newMessage.id,
        text: newMessage.message_text,
        type: newMessage.message_type,
        isRead: newMessage.is_read,
        createdAt: newMessage.created_at,
        senderId: newMessage.sender_id,
        receiverId: newMessage.receiver_id,
        isFromCurrentUser: true
      }
    })

  } catch (error) {
    console.error('Error in send family message API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
