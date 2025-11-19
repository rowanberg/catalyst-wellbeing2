import crypto from 'crypto'

export function canonicalize(obj: any): string {
  // Stable JSON stringify: sort keys recursively
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return `[${obj.map(canonicalize).join(',')}]`
  const keys = Object.keys(obj).sort()
  const parts = keys.map(k => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
  return `{${parts.join(',')}}`
}

export function createHmacSignature(payload: Record<string, any>, secret = process.env.LUMINEX_HMAC_SECRET || ''): string {
  if (!secret) throw new Error('Luminex HMAC secret not configured')
  const canonical = canonicalize(payload)
  return crypto.createHmac('sha256', secret).update(canonical).digest('hex')
}

export function validateHmacSignature(payload: Record<string, any>, signature: string, secret = process.env.LUMINEX_HMAC_SECRET || ''): boolean {
  const expected = createHmacSignature(payload, secret)
  return constantTimeCompare(expected, signature)
}

export function generateTimestamp(): string {
  return new Date().toISOString()
}

export function verifyTimestampWindow(isoTimestamp: string, windowMs = 5 * 60 * 1000): boolean {
  const ts = Date.parse(isoTimestamp)
  if (Number.isNaN(ts)) return false
  const now = Date.now()
  return Math.abs(now - ts) <= windowMs
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  // Use timingSafeEqual
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  try {
    return crypto.timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}
