/**
 * 7-Layer Security System for Inter-Service Communication
 * Used for secure payment sync from landing page to main app
 * 
 * Security Layers:
 * 1. IP Whitelisting
 * 2. API Key Authentication
 * 3. JWT Token Validation
 * 4. HMAC Request Signing
 * 5. AES-256-GCM Encryption
 * 6. Timestamp Validation (Replay Attack Prevention)
 * 7. Rate Limiting (Application Layer)
 */

import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// ============================================
// ENVIRONMENT VARIABLES
// ============================================

const INTER_SERVICE_API_SECRET = process.env.INTER_SERVICE_API_SECRET || ''
const INTER_SERVICE_API_KEY_ID = process.env.INTER_SERVICE_API_KEY_ID || 'landing_page_v1'
const INTER_SERVICE_JWT_SECRET = process.env.INTER_SERVICE_JWT_SECRET || ''
const REQUEST_SIGNING_SECRET = process.env.REQUEST_SIGNING_SECRET || ''
const DATA_ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || ''
const ALLOWED_LANDING_PAGE_IPS = (process.env.ALLOWED_LANDING_PAGE_IPS || '').split(',').filter(Boolean)

// ============================================
// LAYER 1: IP WHITELISTING
// ============================================

export function validateIP(request: Request): { valid: boolean; ip?: string; error?: string } {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    const clientIP = cfConnectingIP || forwardedFor?.split(',')[0].trim() || realIP || 'unknown'
    
    // In development, allow localhost
    if (process.env.NODE_ENV === 'development') {
      if (clientIP === '::1' || clientIP === '127.0.0.1' || clientIP.startsWith('192.168.') || clientIP === 'unknown') {
        return { valid: true, ip: clientIP }
      }
    }
    
    // Check whitelist
    if (ALLOWED_LANDING_PAGE_IPS.length === 0) {
      return { valid: false, error: 'IP whitelist not configured', ip: clientIP }
    }
    
    const isAllowed = ALLOWED_LANDING_PAGE_IPS.includes(clientIP)
    
    if (!isAllowed) {
      return { valid: false, error: 'Unauthorized IP address', ip: clientIP }
    }
    
    return { valid: true, ip: clientIP }
  } catch (error) {
    return { valid: false, error: 'IP validation failed' }
  }
}

// ============================================
// LAYER 2: API KEY AUTHENTICATION
// ============================================

export function validateAPIKey(request: Request): { valid: boolean; error?: string } {
  try {
    const apiKey = request.headers.get('x-api-key')
    const apiKeyId = request.headers.get('x-api-key-id')
    
    if (!apiKey || !apiKeyId) {
      return { valid: false, error: 'Missing API key credentials' }
    }
    
    if (apiKeyId !== INTER_SERVICE_API_KEY_ID) {
      return { valid: false, error: 'Invalid API key ID' }
    }
    
    if (apiKey !== INTER_SERVICE_API_SECRET) {
      return { valid: false, error: 'Invalid API key' }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'API key validation failed' }
  }
}

// ============================================
// LAYER 3: JWT TOKEN VALIDATION
// ============================================

export function validateServiceToken(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    if (!token) {
      return { valid: false, error: 'Missing JWT token' }
    }
    
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '')
    
    if (!INTER_SERVICE_JWT_SECRET) {
      return { valid: false, error: 'JWT secret not configured' }
    }
    
    const decoded = jwt.verify(cleanToken, INTER_SERVICE_JWT_SECRET, {
      algorithms: ['HS256'],
      maxAge: '5m' // Token expires in 5 minutes
    })
    
    return { valid: true, payload: decoded }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' }
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' }
    }
    return { valid: false, error: 'Token validation failed' }
  }
}

// ============================================
// LAYER 4: HMAC REQUEST SIGNING
// ============================================

export function validateSignature(
  payload: string,
  timestamp: string,
  signature: string
): { valid: boolean; error?: string } {
  try {
    if (!signature || !timestamp) {
      return { valid: false, error: 'Missing signature or timestamp' }
    }
    
    // Check timestamp freshness (5-minute window)
    const requestTime = parseInt(timestamp)
    const currentTime = Math.floor(Date.now() / 1000)
    const timeDiff = Math.abs(currentTime - requestTime)
    
    if (timeDiff > 300) { // 5 minutes
      return { valid: false, error: 'Request timestamp expired' }
    }
    
    // Generate expected signature
    const message = `${timestamp}.${payload}`
    const expectedSignature = crypto
      .createHmac('sha256', REQUEST_SIGNING_SECRET)
      .update(message)
      .digest('hex')
    
    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false, error: 'Invalid request signature' }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Signature validation failed' }
  }
}

// ============================================
// LAYER 5: AES-256-GCM ENCRYPTION/DECRYPTION
// ============================================

export function encrypt(data: string): { encrypted: string; error?: string } {
  try {
    if (!DATA_ENCRYPTION_KEY || DATA_ENCRYPTION_KEY.length !== 64) {
      return { encrypted: '', error: 'Invalid encryption key' }
    }
    
    const key = Buffer.from(DATA_ENCRYPTION_KEY, 'hex')
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Format: iv:authTag:encrypted
    const result = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    
    return { encrypted: result }
  } catch (error) {
    return { encrypted: '', error: 'Encryption failed' }
  }
}

export function decrypt(encryptedData: string): { decrypted: string; error?: string } {
  try {
    if (!DATA_ENCRYPTION_KEY || DATA_ENCRYPTION_KEY.length !== 64) {
      return { decrypted: '', error: 'Invalid encryption key' }
    }
    
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
      return { decrypted: '', error: 'Invalid encrypted data format' }
    }
    
    const [ivHex, authTagHex, encrypted] = parts
    
    const key = Buffer.from(DATA_ENCRYPTION_KEY, 'hex')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return { decrypted }
  } catch (error) {
    return { decrypted: '', error: 'Decryption failed - data may be corrupted or tampered' }
  }
}

// ============================================
// LAYER 6: TIMESTAMP VALIDATION
// ============================================

export function validateTimestamp(timestamp: string): { valid: boolean; error?: string } {
  try {
    const requestTime = parseInt(timestamp)
    
    if (isNaN(requestTime)) {
      return { valid: false, error: 'Invalid timestamp format' }
    }
    
    const currentTime = Math.floor(Date.now() / 1000)
    const timeDiff = Math.abs(currentTime - requestTime)
    
    // 5-minute window for replay attack prevention
    if (timeDiff > 300) {
      return { valid: false, error: 'Request timestamp expired - possible replay attack' }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Timestamp validation failed' }
  }
}

// ============================================
// COMBINED VALIDATION - ALL 7 LAYERS
// ============================================

export async function validateSecureRequest(request: Request): Promise<{
  valid: boolean
  error?: string
  metadata?: {
    ip: string
    timestamp: string
    service: string
  }
}> {
  try {
    // Layer 1: IP Whitelisting
    const ipCheck = validateIP(request)
    if (!ipCheck.valid) {
      return { valid: false, error: ipCheck.error || 'IP validation failed' }
    }
    
    // Layer 2: API Key Authentication
    const apiKeyCheck = validateAPIKey(request)
    if (!apiKeyCheck.valid) {
      return { valid: false, error: apiKeyCheck.error || 'API key validation failed' }
    }
    
    // Layer 3: JWT Token Validation
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return { valid: false, error: 'Missing authorization header' }
    }
    
    const tokenCheck = validateServiceToken(authHeader)
    if (!tokenCheck.valid) {
      return { valid: false, error: tokenCheck.error || 'Token validation failed' }
    }
    
    // Layer 4 & 6: HMAC Signature + Timestamp Validation
    const timestamp = request.headers.get('x-timestamp')
    const signature = request.headers.get('x-signature')
    
    if (!timestamp || !signature) {
      return { valid: false, error: 'Missing signature headers' }
    }
    
    // Validate timestamp first
    const timestampCheck = validateTimestamp(timestamp)
    if (!timestampCheck.valid) {
      return { valid: false, error: timestampCheck.error || 'Timestamp validation failed' }
    }
    
    // Get request body for signature validation
    const bodyText = await request.clone().text()
    
    const signatureCheck = validateSignature(bodyText, timestamp, signature)
    if (!signatureCheck.valid) {
      return { valid: false, error: signatureCheck.error || 'Signature validation failed' }
    }
    
    // Layer 5: Encryption validation happens in endpoint when decrypting data
    
    // Layer 7: Rate limiting handled at application/endpoint level
    
    return {
      valid: true,
      metadata: {
        ip: ipCheck.ip || 'unknown',
        timestamp,
        service: tokenCheck.payload?.service || 'unknown'
      }
    }
  } catch (error) {
    return { valid: false, error: 'Security validation failed' }
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function generateServiceToken(service: string = 'landing-page'): string {
  if (!INTER_SERVICE_JWT_SECRET) {
    throw new Error('JWT secret not configured')
  }
  
  const payload = {
    service,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes
  }
  
  return jwt.sign(payload, INTER_SERVICE_JWT_SECRET, { algorithm: 'HS256' })
}

export function generateRequestSignature(payload: string): {
  timestamp: string
  signature: string
} {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const message = `${timestamp}.${payload}`
  const signature = crypto
    .createHmac('sha256', REQUEST_SIGNING_SECRET)
    .update(message)
    .digest('hex')
  
  return { timestamp, signature }
}

export function hashPayload(payload: string): string {
  return crypto.createHash('sha256').update(payload).digest('hex')
}

// ============================================
// CONFIGURATION VALIDATION
// ============================================

export function validateSecurityConfig(): {
  valid: boolean
  missing: string[]
  warnings: string[]
} {
  const missing: string[] = []
  const warnings: string[] = []
  
  if (!INTER_SERVICE_API_SECRET) missing.push('INTER_SERVICE_API_SECRET')
  if (!INTER_SERVICE_JWT_SECRET) missing.push('INTER_SERVICE_JWT_SECRET')
  if (!REQUEST_SIGNING_SECRET) missing.push('REQUEST_SIGNING_SECRET')
  if (!DATA_ENCRYPTION_KEY) missing.push('DATA_ENCRYPTION_KEY')
  
  if (DATA_ENCRYPTION_KEY && DATA_ENCRYPTION_KEY.length !== 64) {
    warnings.push('DATA_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }
  
  if (ALLOWED_LANDING_PAGE_IPS.length === 0 && process.env.NODE_ENV === 'production') {
    warnings.push('ALLOWED_LANDING_PAGE_IPS not configured - IP whitelisting disabled')
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  }
}
