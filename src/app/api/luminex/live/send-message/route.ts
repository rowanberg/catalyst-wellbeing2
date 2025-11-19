import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, isAuthError } from '@/lib/auth/api-auth'
import { createHmacSignature, generateTimestamp } from '@/lib/luminex/security'

const LUMINEX_BASE = process.env.LUMINEX_WORKER_URL || 'https://luminexlive.app'

export async function POST(request: NextRequest) {
  try {
    // Allow students (asking), teachers (testing), admins (debug)
    const auth = await authenticateRequest(request, { allowedRoles: ['student', 'teacher', 'admin', 'super_admin'] })
    if (isAuthError(auth)) {
      if (auth.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      if (auth.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status })
    }

    const { profile, userId } = auth

    const body = await request.json().catch(() => ({}))
    const { classId, message, studentId, studentName } = body as {
      classId?: string
      message?: string
      studentId?: string
      studentName?: string
    }

    if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

    const payload = {
      classId,
      message,
      studentId: studentId || (profile.role === 'student' ? profile.user_id : undefined),
      studentName: studentName || (profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : undefined),
      userRole: profile.role,
      timestamp: generateTimestamp(),
    }

    const signature = createHmacSignature(payload)

    const res = await fetch(`${LUMINEX_BASE}/api/live/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, signature })
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to relay message' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[luminex/live/send-message] error', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
