import { NextRequest, NextResponse } from 'next/server'
import { authenticateTeacher, isAuthError } from '@/lib/auth/api-auth'
import { createClient } from '@supabase/supabase-js'
import { createHmacSignature, generateTimestamp } from '@/lib/luminex/security'

const LUMINEX_BASE = process.env.LUMINEX_WORKER_URL || 'https://luminexlive.app'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateTeacher(request)
    if (isAuthError(auth)) {
      if (auth.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      if (auth.status === 403) return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status })
    }

    const { supabase, userId, profile } = auth

    const body = await request.json().catch(() => ({}))
    const { sessionId, classId } = body as { sessionId?: string; classId?: string }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }
    if (!classId || typeof classId !== 'string') {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 })
    }

    // Replay protection: ensure this sessionId hasn't been used recently by this teacher
    const { data: existingNonce } = await supabaseAdmin
      .from('luminex_security_nonces')
      .select('id')
      .eq('nonce', sessionId)
      .eq('teacher_id', userId)
      .maybeSingle()

    if (existingNonce) {
      await supabaseAdmin.from('luminex_security_logs').insert({
        teacher_id: userId,
        event_type: 'REPLAY_BLOCKED',
        details: { sessionId, classId },
        severity: 'warning'
      })
      return NextResponse.json({ error: 'Replay detected for this session' }, { status: 409 })
    }

    // Insert nonce to block replays going forward
    await supabaseAdmin.from('luminex_security_nonces').insert({
      nonce: sessionId,
      teacher_id: userId
    })

    // Validate teacher owns the class and belongs to same school
    const { data: assignment, error: asgErr } = await supabase
      .from('teacher_class_assignments')
      .select('class_id, is_active')
      .eq('teacher_id', userId)
      .eq('class_id', classId)
      .eq('is_active', true)
      .maybeSingle()

    if (asgErr || !assignment) {
      await supabaseAdmin.from('luminex_activation_logs').insert({
        teacher_id: userId,
        session_id: sessionId,
        event_type: 'CLASS_OWNERSHIP_DENIED',
        details: { classId },
        status: 'denied'
      })
      return NextResponse.json({ error: 'Teacher does not own the selected class' }, { status: 403 })
    }

    const { data: cls, error: classErr } = await supabase
      .from('classes')
      .select('id, class_name, subject, room_number, grade_level_id, school_id')
      .eq('id', classId)
      .single()

    if (classErr || !cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (cls.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'Class does not belong to your school' }, { status: 403 })
    }

    // Build teacher profile details
    const teacherProfile = {
      id: profile.id,
      user_id: profile.user_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: auth.email,
    }

    const classDetails = {
      id: cls.id,
      name: cls.class_name,
      room_number: (cls as any).room_number,
      subject: cls.subject,
    }

    // Subject meta if available
    const subjectDetails = { subject: cls.subject }

    const payloadToSign = {
      sessionId,
      teacherId: userId,
      classId: cls.id,
      schoolId: profile.school_id,
      subjectDetails,
      timestamp: generateTimestamp(),
    }

    const signature = createHmacSignature(payloadToSign)

    // Call Luminex Worker to validate and activate
    const luminexRes = await fetch(`${LUMINEX_BASE}/api/validate-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        teacherProfile,
        classDetails,
        subjectDetails,
        schoolId: profile.school_id,
        signature,
        validatedAt: payloadToSign.timestamp,
      })
    })

    const luminexData = await luminexRes.json().catch(() => ({}))

    await supabaseAdmin.from('luminex_activation_logs').insert({
      teacher_id: userId,
      session_id: sessionId,
      event_type: 'SESSION_ACTIVATION_ATTEMPT',
      details: { classId: cls.id, workerResponse: luminexData },
      status: luminexRes.ok ? 'success' : 'failed'
    })

    if (!luminexRes.ok) {
      return NextResponse.json({ error: luminexData?.error || 'Luminex validation failed' }, { status: 502 })
    }

    return NextResponse.json({ success: true, message: 'Luminex Live activated.' })
  } catch (e: any) {
    console.error('[luminex/activate-session] error', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
