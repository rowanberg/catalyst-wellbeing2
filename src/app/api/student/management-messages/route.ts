import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify student role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }

    // Get management messages for this student
    const { data: messages, error: messagesError } = await supabase
      .from('management_messages')
      .select(`
        id,
        sender_id,
        subject,
        content,
        message_type,
        sender_name,
        sender_role,
        is_read,
        created_at,
        updated_at
      `)
      .eq('recipient_id', user.id)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (messagesError) {
      console.error('Error fetching management messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Get WhatsApp configuration for the student
    const { data: whatsappConfig } = await supabase
      .from('student_whatsapp_config')
      .select('phone_number, whatsapp_link, is_enabled')
      .eq('student_id', user.id)
      .single()

    // Format messages for frontend
    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      senderName: msg.sender_name,
      senderRole: msg.sender_role,
      subject: msg.subject,
      content: msg.content,
      messageType: msg.message_type,
      isRead: msg.is_read,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
      timeAgo: getTimeAgo(msg.created_at)
    }))

    return NextResponse.json({
      messages: formattedMessages,
      whatsappConfig: whatsappConfig ? {
        phoneNumber: whatsappConfig.phone_number,
        whatsappLink: whatsappConfig.whatsapp_link,
        isEnabled: whatsappConfig.is_enabled
      } : null,
      unreadCount: formattedMessages.filter(msg => !msg.isRead).length
    })

  } catch (error) {
    console.error('Management messages API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messageId, isRead } = body

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    // Mark message as read/unread
    const { error: updateError } = await supabase
      .from('management_messages')
      .update({ 
        is_read: isRead,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('recipient_id', user.id)

    if (updateError) {
      console.error('Error updating message status:', updateError)
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Message updated successfully' })

  } catch (error) {
    console.error('Update message API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate time ago
function getTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  } else {
    return date.toLocaleDateString()
  }
}
