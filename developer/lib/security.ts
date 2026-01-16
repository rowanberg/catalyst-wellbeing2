import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

// ============================================
// API KEY GENERATION & VALIDATION
// ============================================

/**
 * Generate a secure API key
 * Format: cwdev_live_<random-32-chars> or cwdev_test_<random-32-chars>
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): {
    key: string
    hash: string
    prefix: string
} {
    const randomPart = nanoid(32)
    const key = `cwdev_${environment}_${randomPart}`
    const hash = hashApiKey(key)
    const prefix = key.substring(0, 20) // First 20 chars for identification

    return { key, hash, prefix }
}

/**
 * Hash an API key using bcrypt
 */
export function hashApiKey(key: string): string {
    return bcrypt.hashSync(key, 10)
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
    return bcrypt.compareSync(key, hash)
}

// ============================================
// CLIENT SECRET GENERATION
// ============================================

/**
 * Generate OAuth client credentials
 */
export function generateClientCredentials(): {
    clientId: string
    clientSecret: string
    clientSecretHash: string
} {
    const clientId = `cw_app_${nanoid(24)}`
    const clientSecret = `cw_secret_${nanoid(48)}`
    const clientSecretHash = bcrypt.hashSync(clientSecret, 10)

    return { clientId, clientSecret, clientSecretHash }
}

/**
 * Verify client secret
 */
export function verifyClientSecret(secret: string, hash: string): boolean {
    return bcrypt.compareSync(secret, hash)
}

// ============================================
// WEBHOOK SECRET GENERATION
// ============================================

/**
 * Generate webhook secret for HMAC signatures
 */
export function generateWebhookSecret(): {
    secret: string
    hash: string
} {
    const secret = `whsec_${nanoid(32)}`
    const hash = bcrypt.hashSync(secret, 10)

    return { secret, hash }
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(
    payload: string,
    secret: string
): string {
    return crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    const expectedSignature = generateWebhookSignature(payload, secret)
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    )
}

// ============================================
// DATA ENCRYPTION
// ============================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-min-32-chars'
const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY.substring(0, 32)),
        iv
    )

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format')
    }

    const [ivHex, authTagHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY.substring(0, 32)),
        iv
    )

    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
}

/**
 * Generate SHA-256 hash
 */
export function sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
}

// ============================================
// TWO-FACTOR AUTHENTICATION
// ============================================

/**
 * Generate 2FA secret
 */
export function generate2FASecret(): string {
    return crypto.randomBytes(20).toString('hex')
}

/**
 * Generate TOTP code (Time-based One-Time Password)
 */
export function generateTOTP(secret: string): string {
    const time = Math.floor(Date.now() / 1000 / 30) // 30-second window
    const buffer = Buffer.alloc(8)
    buffer.writeBigInt64BE(BigInt(time))

    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'))
    hmac.update(buffer)
    const hash = hmac.digest()

    const offset = hash[hash.length - 1] & 0x0f
    const code = (
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff)
    ) % 1000000

    return code.toString().padStart(6, '0')
}

/**
 * Verify TOTP code
 */
export function verifyTOTP(secret: string, code: string): boolean {
    const currentCode = generateTOTP(secret)

    // Also check previous and next time windows for clock drift
    const time = Math.floor(Date.now() / 1000 / 30)
    const prevTime = time - 1
    const nextTime = time + 1

    const prevBuffer = Buffer.alloc(8)
    prevBuffer.writeBigInt64BE(BigInt(prevTime))
    const prevCode = generateTOTPFromBuffer(secret, prevBuffer)

    const nextBuffer = Buffer.alloc(8)
    nextBuffer.writeBigInt64BE(BigInt(nextTime))
    const nextCode = generateTOTPFromBuffer(secret, nextBuffer)

    return code === currentCode || code === prevCode || code === nextCode
}

function generateTOTPFromBuffer(secret: string, buffer: Buffer): string {
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'))
    hmac.update(buffer)
    const hash = hmac.digest()

    const offset = hash[hash.length - 1] & 0x0f
    const code = (
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff)
    ) % 1000000

    return code.toString().padStart(6, '0')
}

// ============================================
// RATE LIMITING
// ============================================

interface RateLimitStore {
    [key: string]: {
        count: number
        resetAt: number
    }
}

const rateLimitStore: RateLimitStore = {}

/**
 * Check rate limit
 */
export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const record = rateLimitStore[key]

    if (!record || record.resetAt < now) {
        // Create new window
        rateLimitStore[key] = {
            count: 1,
            resetAt: now + windowMs
        }

        return {
            allowed: true,
            remaining: limit - 1,
            resetAt: now + windowMs
        }
    }

    if (record.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: record.resetAt
        }
    }

    record.count++

    return {
        allowed: true,
        remaining: limit - record.count,
        resetAt: record.resetAt
    }
}

/**
 * Clean up expired rate limit records
 */
export function cleanupRateLimits(): void {
    const now = Date.now()
    Object.keys(rateLimitStore).forEach(key => {
        if (rateLimitStore[key].resetAt < now) {
            delete rateLimitStore[key]
        }
    })
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
    setInterval(cleanupRateLimits, 5 * 60 * 1000)
}

// ============================================
// INPUT VALIDATION & SANITIZATION
// ============================================

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
    try {
        const parsed = new URL(url)
        // Only allow http and https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Invalid protocol')
        }
        return parsed.toString()
    } catch {
        throw new Error('Invalid URL')
    }
}

/**
 * Validate redirect URI
 */
export function validateRedirectUri(uri: string, allowedUris: string[]): boolean {
    try {
        const sanitized = sanitizeUrl(uri)
        return allowedUris.some(allowed => {
            // Exact match or wildcard subdomain match
            if (allowed === sanitized) return true
            if (allowed.includes('*')) {
                const pattern = allowed.replace('*', '.*')
                return new RegExp(`^${pattern}$`).test(sanitized)
            }
            return false
        })
    } catch {
        return false
    }
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Validate scope format
 */
export function isValidScope(scope: string): boolean {
    const scopeRegex = /^[a-z_]+\.[a-z_]+$/
    return scopeRegex.test(scope)
}
