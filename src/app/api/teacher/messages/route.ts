import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Parse query parameters
    const messageType = searchParams.get('message_type')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query for messages where teacher is sender or receiver
    let query = supabase
      .from('teacher_parent_messages')
      .select(`
        *,
        sender:sender_id(first_name, last_name, role),
        receiver:receiver_id(first_name, last_name, role)
      `)
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (messageType) {
      query = query.eq('message_type', messageType)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data: messages, error: messagesError } = await query

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Format messages with sender/receiver names
    const formattedMessages = messages?.map(message => ({
      ...message,
      sender_name: `${message.sender.first_name} ${message.sender.last_name}`,
      receiver_name: `${message.receiver.first_name} ${message.receiver.last_name}`
    })) || []

    return NextResponse.json({
      messages: formattedMessages,
      pagination: {
        limit,
        offset,
        hasMore: (messages?.length || 0) === limit
      }
    })

  } catch (error) {
    console.error('Unexpected error in messages API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      recipient_id,
      subject,
      content,
      message_type = 'direct',
      priority = 'medium'
    } = body

    // Validate required fields
    if (!recipient_id || !subject || !content) {
      return NextResponse.json({ 
        error: 'Missing required fields: recipient_id, subject, content' 
      }, { status: 400 })
    }

    // Validate recipient is a parent in the same school
    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', recipient_id)
      .single()

    if (recipientError || !recipient || recipient.role !== 'parent' || recipient.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'Invalid recipient or recipient not in your school' }, { status: 400 })
    }

    // Create message
    const messageData = {
      sender_id: profile.id,
      receiver_id: recipient_id,
      subject: subject.trim(),
      content: content.trim(),
      message_type,
      priority,
      school_id: profile.school_id,
      read_status: false
    }

    const { data: message, error: insertError } = await supabase
      .from('teacher_parent_messages')
      .insert(messageData)
      .select(`
        *,
        sender:sender_id(first_name, last_name, role),
        receiver:receiver_id(first_name, last_name, role)
      `)
      .single()

    if (insertError) {
      console.error('Error creating message:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Message sent successfully',
      data: message 
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
