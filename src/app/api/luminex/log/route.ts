import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, isAuthError } from '@/lib/auth/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Allow teacher and admin to log; students/parents forbidden
    const auth = await authenticateRequest(request, { allowedRoles: ['teacher', 'admin', 'super_admin'] })
    if (isAuthError(auth)) {
      if (auth.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      if (auth.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status })
    }

    const { role, userId } = auth

    const body = await request.json().catch(() => ({}))
    const { eventType, details, severity, sessionId, channel } = body as {
      eventType?: string
      details?: any
      severity?: 'info' | 'warning' | 'error'
      sessionId?: string
      channel?: 'activation' | 'security'
    }

    if (!eventType) return NextResponse.json({ error: 'eventType required' }, { status: 400 })

    if (channel === 'security') {
      await supabaseAdmin.from('luminex_security_logs').insert({
        teacher_id: role === 'teacher' ? userId : null,
        event_type: eventType,
        details: details || null,
        severity: severity || 'info'
      })
      return NextResponse.json({ success: true })
    }

    await supabaseAdmin.from('luminex_activation_logs').insert({
      teacher_id: role === 'teacher' ? userId : null,
      session_id: sessionId || null,
      event_type: eventType,
      details: details || null,
      status: severity === 'error' ? 'failed' : 'success'
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[luminex/log] error', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
