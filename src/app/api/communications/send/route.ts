import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { SecureMessageEncryption, ContentAnalysisEngine, PermissionValidator } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { channelId, content, recipientId, messageType = 'text' } = await request.json();

    // Validate required fields
    if (!channelId || !content || !recipientId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check permissions
    const canSend = await PermissionValidator.canSendMessage(
      user.id, 
      channelId, 
      profile.role
    );

    if (!canSend) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Verify channel participation
    const { data: participation } = await supabase
      .from('channel_participants')
      .select('*')
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
      .eq('permission_level', 'read_write')
      .is('left_at', null)
      .single();

    if (!participation) {
      return NextResponse.json({ error: 'Not authorized for this channel' }, { status: 403 });
    }

    // Get recipient's public key for encryption
    const { data: recipientKey } = await supabase
      .from('user_encryption_keys')
      .select('public_key')
      .eq('user_id', recipientId)
      .single();

    // Analyze content for safety
    const contentAnalysis = ContentAnalysisEngine.analyzeContent(content);
    
    let messageData: any = {
      channel_id: channelId,
      sender_id: user.id,
      message_type: messageType,
      content_score: contentAnalysis.safetyScore,
      sentiment_score: contentAnalysis.sentimentScore,
      flagged_keywords: contentAnalysis.flaggedKeywords,
      is_flagged: contentAnalysis.riskLevel === 'high' || contentAnalysis.riskLevel === 'critical',
      is_emergency: messageType === 'emergency'
    };

    // Handle encryption based on channel type and recipient
    if (recipientKey && messageType !== 'emergency') {
      try {
        // Get sender's private key (in production, this would be securely stored/retrieved)
        const senderPublicKey = await SecureMessageEncryption.importPublicKey(recipientKey.public_key);
        
        // For demo purposes, we'll store plain content for moderation
        // In production, only encrypted content would be stored for E2EE messages
        messageData.plain_content = content;
        messageData.is_encrypted = false; // Set to true when full E2EE is implemented
      } catch (encryptionError) {
        console.error('Encryption error:', encryptionError);
        // Fall back to plain text with moderation
        messageData.plain_content = content;
        messageData.is_encrypted = false;
      }
    } else {
      // Store as plain text for moderation
      messageData.plain_content = content;
      messageData.is_encrypted = false;
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('secure_messages')
      .insert(messageData)
      .select()
      .single();

    if (messageError) {
      console.error('Message insert error:', messageError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Create message recipients
    const { error: recipientError } = await supabase
      .from('message_recipients')
      .insert({
        message_id: message.id,
        recipient_id: recipientId,
        delivered_at: new Date().toISOString()
      });

    if (recipientError) {
      console.error('Recipient insert error:', recipientError);
    }

    // Handle high-risk content
    if (contentAnalysis.riskLevel === 'critical') {
      // Create emergency incident
      await supabase
        .from('emergency_incidents')
        .insert({
          incident_type: 'content_violation',
          reporter_id: user.id,
          reported_user_id: user.id,
          severity_level: 'critical',
          description: `Critical content detected: ${contentAnalysis.flaggedKeywords.join(', ')}`,
          status: 'open'
        });

      // Notify admins immediately
      // In production, this would trigger real-time notifications
    }

    // Log the communication event
    await supabase
      .from('communication_audit_logs')
      .insert({
        event_type: 'message_sent',
        user_id: user.id,
        target_user_id: recipientId,
        channel_id: channelId,
        message_id: message.id,
        event_data: {
          content_analysis: contentAnalysis,
          message_type: messageType,
          is_encrypted: messageData.is_encrypted
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

    return NextResponse.json({
      success: true,
      messageId: message.id,
      contentAnalysis: {
        safetyScore: contentAnalysis.safetyScore,
        suggestions: contentAnalysis.suggestions,
        riskLevel: contentAnalysis.riskLevel
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
