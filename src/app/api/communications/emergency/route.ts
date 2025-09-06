import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

    const { incidentType, teacherId, reportedUserId, description } = await request.json();

    // Validate required fields
    if (!incidentType || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine severity based on incident type
    let severityLevel = 'medium';
    if (incidentType === 'safety_button') {
      severityLevel = 'critical';
    } else if (incidentType === 'content_violation') {
      severityLevel = 'high';
    }

    // Create emergency incident
    const { data: incident, error: incidentError } = await supabase
      .from('emergency_incidents')
      .insert({
        incident_type: incidentType,
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        severity_level: severityLevel,
        description: description,
        status: 'open',
        incident_data: {
          teacher_id: teacherId,
          timestamp: new Date().toISOString(),
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })
      .select()
      .single();

    if (incidentError) {
      console.error('Emergency incident creation error:', incidentError);
      return NextResponse.json({ error: 'Failed to create emergency incident' }, { status: 500 });
    }

    // Log the emergency event
    await supabase
      .from('communication_audit_logs')
      .insert({
        event_type: 'emergency_action',
        user_id: user.id,
        target_user_id: reportedUserId,
        event_data: {
          incident_id: incident.id,
          incident_type: incidentType,
          severity_level: severityLevel,
          description: description
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

    // For critical incidents (safety button), immediately notify admins
    if (incidentType === 'safety_button') {
      // In production, this would trigger real-time notifications
      // For now, we'll just log it
      console.log('CRITICAL SAFETY INCIDENT:', {
        incidentId: incident.id,
        reporterId: user.id,
        description: description,
        timestamp: new Date().toISOString()
      });

      // Archive any active conversations for the student
      if (profile.role === 'student') {
        await supabase
          .from('channel_participants')
          .update({ left_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .is('left_at', null);
      }
    }

    return NextResponse.json({
      success: true,
      incidentId: incident.id,
      message: 'Emergency incident created successfully'
    });

  } catch (error) {
    console.error('Emergency incident error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
