import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
    }

    // Verify user has access to this channel
    const { data: participant, error: participantError } = await supabase
      .from('channel_participants')
      .select('permission_level')
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Access denied to this channel' }, { status: 403 });
    }

    // Get messages from the channel
    const { data: messages, error: messagesError } = await supabase
      .from('secure_messages')
      .select(`
        id,
        sender_id,
        content,
        encrypted_content,
        message_type,
        created_at,
        is_flagged,
        flagged_reason,
        profiles!sender_id (
          first_name,
          last_name,
          role
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      console.error('Messages fetch error:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Format messages for response
    const formattedMessages = messages?.map(message => ({
      id: message.id,
      senderId: message.sender_id,
      senderName: (message.profiles as any)?.first_name && (message.profiles as any)?.last_name 
        ? `${(message.profiles as any).first_name} ${(message.profiles as any).last_name}` 
        : 'Unknown User',
      senderRole: (message.profiles as any)?.role || 'unknown',
      content: message.content,
      encryptedContent: message.encrypted_content,
      messageType: message.message_type,
      timestamp: message.created_at,
      isFlagged: message.is_flagged,
      flaggedReason: message.flagged_reason,
      isFromCurrentUser: message.sender_id === user.id
    })) || [];

    return NextResponse.json({ 
      messages: formattedMessages.reverse(), // Return in chronological order
      hasMore: messages?.length === limit
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Get message details
    const { data: message, error: messageError } = await supabase
      .from('secure_messages')
      .select('sender_id, channel_id')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user can delete this message
    const canDelete = message.sender_id === user.id || profile?.role === 'admin';
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Not authorized to delete this message' }, { status: 403 });
    }

    // Soft delete the message
    const { error: deleteError } = await supabase
      .from('secure_messages')
      .update({ 
        content: '[Message deleted]',
        encrypted_content: null,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', messageId);

    if (deleteError) {
      console.error('Message delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }

    // Log the deletion
    await supabase
      .from('communication_audit_logs')
      .insert({
        event_type: 'message_deleted',
        user_id: user.id,
        channel_id: message.channel_id,
        event_data: {
          message_id: messageId,
          original_sender: message.sender_id,
          deleted_by_role: profile?.role
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
