import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let query = supabase
      .from('parent_consent_records')
      .select(`
        *,
        student:profiles!student_id(full_name, email),
        parent:profiles!parent_id(full_name, email)
      `);

    // Filter based on user role
    if (profile.role === 'parent') {
      query = query.eq('parent_id', user.id);
    } else if (profile.role === 'admin' || profile.role === 'teacher') {
      // Admins and teachers can see all consent records for their school
      query = query.eq('school_id', profile.school_id);
      
      if (studentId) {
        query = query.eq('student_id', studentId);
      }
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: consents, error: consentsError } = await query;

    if (consentsError) {
      console.error('Consents fetch error:', consentsError);
      return NextResponse.json({ error: 'Failed to fetch consent records' }, { status: 500 });
    }

    return NextResponse.json({ consents: consents || [] });

  } catch (error) {
    console.error('Get consent records error:', error);
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
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can provide consent' }, { status: 403 });
    }

    const { studentId, consentType, consentGiven, restrictions = [] } = await request.json();

    // Validate required fields
    if (!studentId || !consentType || typeof consentGiven !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the student belongs to this parent
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('id, parent_id')
      .eq('id', studentId)
      .eq('role', 'student')
      .single();

    if (!studentProfile || studentProfile.parent_id !== user.id) {
      return NextResponse.json({ error: 'Student not found or not associated with this parent' }, { status: 404 });
    }

    // Check if consent record already exists
    const { data: existingConsent } = await supabase
      .from('parent_consent_records')
      .select('id')
      .eq('student_id', studentId)
      .eq('parent_id', user.id)
      .eq('consent_type', consentType)
      .single();

    if (existingConsent) {
      // Update existing consent
      const { data: updatedConsent, error: updateError } = await supabase
        .from('parent_consent_records')
        .update({
          consent_given: consentGiven,
          restrictions: restrictions,
          updated_at: new Date().toISOString(),
          consent_metadata: {
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', existingConsent.id)
        .select()
        .single();

      if (updateError) {
        console.error('Consent update error:', updateError);
        return NextResponse.json({ error: 'Failed to update consent' }, { status: 500 });
      }

      // Log the consent update
      await supabase
        .from('communication_audit_logs')
        .insert({
          event_type: 'consent_updated',
          user_id: user.id,
          target_user_id: studentId,
          event_data: {
            consent_id: existingConsent.id,
            consent_type: consentType,
            consent_given: consentGiven,
            restrictions: restrictions
          },
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        });

      return NextResponse.json({
        success: true,
        consent: updatedConsent,
        message: 'Consent updated successfully'
      });
    } else {
      // Create new consent record
      const { data: newConsent, error: createError } = await supabase
        .from('parent_consent_records')
        .insert({
          student_id: studentId,
          parent_id: user.id,
          school_id: profile.school_id,
          consent_type: consentType,
          consent_given: consentGiven,
          restrictions: restrictions,
          consent_metadata: {
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('Consent creation error:', createError);
        return NextResponse.json({ error: 'Failed to create consent record' }, { status: 500 });
      }

      // Log the consent creation
      await supabase
        .from('communication_audit_logs')
        .insert({
          event_type: 'consent_created',
          user_id: user.id,
          target_user_id: studentId,
          event_data: {
            consent_id: newConsent.id,
            consent_type: consentType,
            consent_given: consentGiven,
            restrictions: restrictions
          },
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        });

      return NextResponse.json({
        success: true,
        consent: newConsent,
        message: 'Consent recorded successfully'
      });
    }

  } catch (error) {
    console.error('Create/update consent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);
    const consentId = searchParams.get('consentId');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!consentId) {
      return NextResponse.json({ error: 'Consent ID is required' }, { status: 400 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Get consent record
    const { data: consent, error: consentError } = await supabase
      .from('parent_consent_records')
      .select('parent_id, student_id, consent_type')
      .eq('id', consentId)
      .single();

    if (consentError || !consent) {
      return NextResponse.json({ error: 'Consent record not found' }, { status: 404 });
    }

    // Check if user can revoke this consent
    const canRevoke = consent.parent_id === user.id || profile?.role === 'admin';
    
    if (!canRevoke) {
      return NextResponse.json({ error: 'Not authorized to revoke this consent' }, { status: 403 });
    }

    // Revoke consent (soft delete)
    const { error: revokeError } = await supabase
      .from('parent_consent_records')
      .update({ 
        consent_given: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', consentId);

    if (revokeError) {
      console.error('Consent revoke error:', revokeError);
      return NextResponse.json({ error: 'Failed to revoke consent' }, { status: 500 });
    }

    // Log the consent revocation
    await supabase
      .from('communication_audit_logs')
      .insert({
        event_type: 'consent_revoked',
        user_id: user.id,
        target_user_id: consent.student_id,
        event_data: {
          consent_id: consentId,
          consent_type: consent.consent_type,
          revoked_by_role: profile?.role
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      });

    return NextResponse.json({ success: true, message: 'Consent revoked successfully' });

  } catch (error) {
    console.error('Revoke consent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
