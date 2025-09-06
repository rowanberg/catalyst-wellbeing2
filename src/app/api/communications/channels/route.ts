import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PermissionValidator } from '@/lib/encryption';

export async function GET(request: NextRequest) {
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

    // Get channels user participates in
    const { data: channels, error: channelsError } = await supabase
      .from('conversation_channels')
      .select(`
        *,
        channel_participants!inner(
          user_id,
          role,
          permission_level,
          joined_at,
          left_at
        )
      `)
      .eq('channel_participants.user_id', user.id)
      .is('channel_participants.left_at', null)
      .eq('is_active', true);

    if (channelsError) {
      console.error('Channels fetch error:', channelsError);
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }

    return NextResponse.json({ channels: channels || [] });

  } catch (error) {
    console.error('Get channels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { channelType, participantIds, isEncrypted = false } = await request.json();

    // Validate channel type
    if (!['direct', 'class_announcement', 'emergency'].includes(channelType)) {
      return NextResponse.json({ error: 'Invalid channel type' }, { status: 400 });
    }

    // Validate permissions based on user role
    if (profile.role === 'student' && channelType !== 'direct') {
      return NextResponse.json({ error: 'Students can only create direct channels' }, { status: 403 });
    }

    // Create conversation channel
    const { data: channel, error: channelError } = await supabase
      .from('conversation_channels')
      .insert({
        channel_type: channelType,
        school_id: profile.school_id,
        created_by: user.id,
        is_encrypted: isEncrypted,
        metadata: {
          created_at: new Date().toISOString(),
          creator_role: profile.role
        }
      })
      .select()
      .single();

    if (channelError) {
      console.error('Channel creation error:', channelError);
      return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
    }

    // Add creator as participant
    const participants = [
      {
        channel_id: channel.id,
        user_id: user.id,
        role: profile.role,
        permission_level: 'moderator'
      }
    ];

    // Add other participants
    if (participantIds && participantIds.length > 0) {
      for (const participantId of participantIds) {
        // Get participant profile to determine role and permissions
        const { data: participantProfile } = await supabase
          .from('profiles')
          .select('role, school_id')
          .eq('id', participantId)
          .single();

        if (participantProfile && participantProfile.school_id === profile.school_id) {
          // Determine permission level based on role and channel type
          let permissionLevel = 'read_write';
          if (channelType === 'class_announcement' && participantProfile.role === 'parent') {
            permissionLevel = 'read_only';
          }

          participants.push({
            channel_id: channel.id,
            user_id: participantId,
            role: participantProfile.role,
            permission_level: permissionLevel
          });
        }
      }
    }

    // Insert all participants
    const { error: participantsError } = await supabase
      .from('channel_participants')
      .insert(participants);

    if (participantsError) {
      console.error('Participants insert error:', participantsError);
      // Clean up channel if participants failed
      await supabase
        .from('conversation_channels')
        .delete()
        .eq('id', channel.id);
      
      return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 });
    }

    // Log channel creation
    await supabase
      .from('communication_audit_logs')
      .insert({
        event_type: 'channel_created',
        user_id: user.id,
        channel_id: channel.id,
        event_data: {
          channel_type: channelType,
          participant_count: participants.length,
          is_encrypted: isEncrypted
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        type: channelType,
        isEncrypted: isEncrypted,
        participantCount: participants.length
      }
    });

  } catch (error) {
    console.error('Create channel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
