import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, isAuthError } from '@/lib/auth/api-auth'
import { validateHmacSignature, verifyTimestampWindow } from '@/lib/luminex/security'

export async function POST(request: NextRequest) {
  try {
    // Allow admin/teacher to verify signatures for debugging
    const auth = await authenticateRequest(request, { allowedRoles: ['admin', 'super_admin', 'teacher'] })
    if (isAuthError(auth)) {
      if (auth.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      if (auth.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return NextResponse.json({ error: auth.error || 'Authentication failed' }, { status: auth.status })
    }

    const body = await request.json().catch(() => ({}))
    const { payload, signature } = body as { payload?: Record<string, any>; signature?: string }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'payload is required' }, { status: 400 })
    }
    if (!signature || typeof signature !== 'string') {
      return NextResponse.json({ error: 'signature is required' }, { status: 400 })
    }

    // Optional timestamp check
    const ts = payload.timestamp
    const tsOk = typeof ts === 'string' ? verifyTimestampWindow(ts) : true

    const valid = validateHmacSignature(payload, signature)

    return NextResponse.json({ valid, timestampValid: tsOk })
  } catch (e: any) {
    console.error('[luminex/hmac-verify] error', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
