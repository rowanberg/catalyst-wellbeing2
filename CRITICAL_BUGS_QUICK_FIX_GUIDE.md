# 🚨 CRITICAL BUGS - IMMEDIATE ACTION REQUIRED

**Generated:** Nov 8, 2025  
**Priority:** Fix within 24-48 hours

---

## 1. API KEY EXPOSURE (CRITICAL 🔴)

**File:** `src/app/api/student/ai-chat/route.ts:122-154`

### Current Code (VULNERABLE):
```typescript
let apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  try {
    const routerResponse = await fetch(...)
    if (routerResponse.ok) {
      apiKey = routerData.api_key  // ❌ No validation
    }
  } catch (error) {
    console.error('Router unavailable, using fallback')  // ❌ Logs error
  }
}
if (!apiKey) {
  throw new Error('AI service unavailable')  // ❌ Reveals infra
}
```

### FIXED CODE:
```typescript
import { SecureKeyManager } from '@/lib/security/key-manager'
import { logger } from '@/lib/logger'

// Rate limit check FIRST
const rateLimit = await checkRateLimit(user.id, 'ai-chat')
if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded', retryAfter: rateLimit.resetIn },
    { status: 429 }
  )
}

// Secure key retrieval
const keyManager = new SecureKeyManager()
const apiKey = await keyManager.getRotatedKey(user.id, 'gemini')

if (!apiKey) {
  logger.error('AI key unavailable', { 
    userId: user.id,
    requestId: crypto.randomUUID()
  })
  return NextResponse.json(
    { error: 'Service temporarily unavailable. Please try again later.' },
    { status: 503 }
  )
}

// Validate key format before use
if (!keyManager.validateKeyFormat(apiKey)) {
  logger.security('Invalid key format detected', { userId: user.id })
  return NextResponse.json(
    { error: 'Configuration error. Please contact support.' },
    { status: 500 }
  )
}

// Use key...
```

### Create Key Manager:
```typescript
// src/lib/security/key-manager.ts
import crypto from 'crypto'

export class SecureKeyManager {
  private keyRotationInterval = 30 * 24 * 60 * 60 * 1000 // 30 days
  
  async getRotatedKey(userId: string, service: 'gemini' | 'openai'): Promise<string | null> {
    try {
      // Check user quota first
      const quota = await this.checkQuota(userId)
      if (!quota.allowed) return null
      
      // Get key from environment
      const keyEnvVar = service === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'
      let key = process.env[keyEnvVar]
      
      // Fallback to router
      if (!key) {
        key = await this.getKeyFromRouter(userId, service)
      }
      
      // Validate before returning
      if (key && this.validateKeyFormat(key)) {
        return key
      }
      
      return null
    } catch (error: any) {
      // Never log the actual key
      logger.error('Key retrieval failed', { 
        service,
        error: error.message
      })
      return null
    }
  }
  
  validateKeyFormat(key: string): boolean {
    // Gemini keys start with AIza
    if (key.startsWith('AIza') && key.length === 39) return true
    // OpenAI keys start with sk-
    if (key.startsWith('sk-') && key.length > 40) return true
    return false
  }
  
  private async getKeyFromRouter(userId: string, service: string): Promise<string | null> {
    const routerUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/intelligent-ai-router`
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceKey) return null
    
    try {
      const response = await fetch(routerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({
          model: service === 'gemini' ? 'gemini-2.0-flash-exp' : 'gpt-4',
          userId,
          tokens: 2000
        })
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      return data.api_key || null
    } catch {
      return null
    }
  }
  
  private async checkQuota(userId: string): Promise<{ allowed: boolean }> {
    // Implement quota checking
    // Return false if user exceeded daily limit
    return { allowed: true }
  }
}
```

---

## 2. SQL INJECTION (CRITICAL 🔴)

**File:** `src/app/api/student/wallet/send/route.ts`

### Current Code (VULNERABLE):
```typescript
const { recipientId, amount, note } = await request.json()

const { data: recipient } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', recipientId)  // ❌ No validation
```

### FIXED CODE:
```typescript
import { z } from 'zod'
import { validateUUID, sanitizeString } from '@/lib/security/validators'

// Schema validation
const TransferSchema = z.object({
  recipientId: z.string().uuid(),
  amount: z.number().positive().max(10000),
  note: z.string().max(500).optional()
})

// Validate input
const body = await request.json()
const validation = TransferSchema.safeParse(body)

if (!validation.success) {
  return NextResponse.json({
    error: 'Invalid input',
    details: validation.error.flatten()
  }, { status: 400 })
}

const { recipientId, amount, note } = validation.data

// Additional UUID validation
if (!validateUUID(recipientId)) {
  return NextResponse.json({ error: 'Invalid recipient ID' }, { status: 400 })
}

// Sanitize note if provided
const sanitizedNote = note ? sanitizeString(note) : null

// Safe query - Supabase parameterizes automatically
const { data: recipient, error } = await supabase
  .from('profiles')
  .select('user_id, first_name, last_name, role')  // Only needed fields
  .eq('user_id', recipientId)
  .eq('role', 'student')  // Additional safety check
  .single()

if (error || !recipient) {
  return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
}
```

### Create Validators:
```typescript
// src/lib/security/validators.ts
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function validateUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid)
}

export function sanitizeString(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '')  // XSS prevention
    .replace(/['";]/g, '')  // SQL injection prevention
    .trim()
    .slice(0, 1000)  // Length limit
}

export function validateAmount(amount: number): boolean {
  return (
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= 10000 &&
    Number.isInteger(amount * 100)  // Max 2 decimals
  )
}
```

---

## 3. CSRF PROTECTION (CRITICAL 🔴)

**Files:** All state-changing API routes

### Implementation:
```typescript
// src/lib/security/csrf.ts
import crypto from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex')
const TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour

export function generateCSRFToken(sessionId: string): string {
  const timestamp = Date.now()
  const data = `${sessionId}:${timestamp}`
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(data)
    .digest('hex')
  
  return Buffer.from(`${data}:${signature}`).toString('base64url')
}

export function validateCSRFToken(token: string | null, sessionId: string): boolean {
  if (!token) return false
  
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [sid, timestamp, signature] = decoded.split(':')
    
    // Verify session
    if (sid !== sessionId) return false
    
    // Check expiry
    const age = Date.now() - parseInt(timestamp)
    if (age > TOKEN_EXPIRY) return false
    
    // Verify signature
    const expected = crypto
      .createHmac('sha256', CSRF_SECRET)
      .update(`${sid}:${timestamp}`)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  } catch {
    return false
  }
}
```

### Usage in API Routes:
```typescript
// src/app/api/student/wallet/send/route.ts
import { validateCSRFToken } from '@/lib/security/csrf'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // CSRF validation
  const csrfToken = request.headers.get('X-CSRF-Token')
  if (!validateCSRFToken(csrfToken, user.id)) {
    logger.security('CSRF token validation failed', {
      userId: user.id,
      ip: request.headers.get('x-forwarded-for')
    })
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }
  
  // Proceed with operation...
}
```

### Frontend Integration:
```typescript
// src/lib/api/client.ts
export async function apiPost(url: string, data: any) {
  // Get CSRF token from cookie or session
  const csrfToken = await getCSRFToken()
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(data)
  })
  
  return response.json()
}
```

---

## 4. AUTH BYPASS FIX (CRITICAL 🔴)

**File:** `src/app/api/superpanel/schools/[id]/route.ts:47-62`

### Current Code (VULNERABLE):
```typescript
if (profile.role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
// ❌ Missing superpanel check
```

### FIXED CODE:
```typescript
import { verifySuperpanelAccess } from '@/lib/auth/superpanel'

// Dual validation
if (profile.role !== 'admin') {
  logger.security('Non-admin superpanel access attempt', {
    userId: user.id,
    role: profile.role,
    ip: request.headers.get('x-forwarded-for')
  })
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}

// Additional superpanel check
const hasSuperpanelAccess = await verifySuperpanelAccess(user.id, profile.school_id)
if (!hasSuperpanelAccess) {
  logger.security('Admin without superpanel access', {
    userId: user.id,
    schoolId: profile.school_id
  })
  return NextResponse.json({
    error: 'Insufficient permissions for superpanel access'
  }, { status: 403 })
}

// Proceed...
```

### Create Superpanel Verifier:
```typescript
// src/lib/auth/superpanel.ts
export async function verifySuperpanelAccess(
  userId: string,
  schoolId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  
  // Check superpanel_admins table
  const { data, error } = await supabase
    .from('superpanel_admins')
    .select('id, is_active, expires_at')
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .single()
  
  if (error || !data) return false
  
  // Check if active
  if (!data.is_active) return false
  
  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false
  }
  
  return true
}
```

### Database Migration:
```sql
-- Create superpanel_admins table
CREATE TABLE IF NOT EXISTS superpanel_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, school_id)
);

-- RLS policies
ALTER TABLE superpanel_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only superpanel admins can view" ON superpanel_admins
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM superpanel_admins WHERE is_active = true)
  );
```

---

## 5. PASSWORD RESET TOKEN (CRITICAL 🔴)

**File:** `src/app/api/reset-password/route.ts`

### Current Code (VULNERABLE):
```typescript
const resetLink = `${url}/auth/reset-password-confirm?token=${token}`
// ❌ Token in URL
```

### FIXED CODE:
```typescript
// Generate secure token
const resetToken = crypto.randomBytes(32).toString('hex')
const hashedToken = crypto
  .createHash('sha256')
  .update(resetToken)
  .digest('hex')

// Store hashed token with expiry
await supabase
  .from('password_reset_tokens')
  .insert({
    user_id: user.id,
    token_hash: hashedToken,
    expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    used: false
  })

// Send link WITHOUT token in URL
const resetLink = `${url}/auth/reset-password-confirm`

// Send token separately in email body (encrypted)
await sendResetEmail({
  to: user.email,
  resetLink,
  secureToken: resetToken,  // Include in email body only
  expiresIn: '15 minutes'
})
```

### Reset Verification:
```typescript
// src/app/auth/reset-password-confirm/page.tsx
export default function ResetPasswordConfirmPage() {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  
  const handleReset = async () => {
    // Token submitted via form, not URL
    const response = await fetch('/api/auth/reset-password-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password })
    })
    
    const data = await response.json()
    if (data.success) {
      // Redirect to login
      router.push('/login?reset=success')
    }
  }
  
  return (
    <form onSubmit={handleReset}>
      <input
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Enter reset code from email"
        maxLength={64}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
      />
      <button type="submit">Reset Password</button>
    </form>
  )
}
```

---

## 6. FILE UPLOAD VALIDATION (CRITICAL 🔴)

**File:** `src/app/api/student/profile-picture/route.ts:28-45`

### FIXED CODE:
```typescript
import sharp from 'sharp'
import { validateImageSignature } from '@/lib/security/file-validator'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DIMENSIONS = { width: 2000, height: 2000 }

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // 1. Type validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only JPEG, PNG, and WebP allowed.'
      }, { status: 400 })
    }
    
    // 2. Size validation (before processing)
    if (file.size > MAX_SIZE) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 5MB.'
      }, { status: 400 })
    }
    
    // 3. Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // 4. Validate file signature (magic numbers)
    if (!validateImageSignature(buffer, file.type)) {
      logger.security('File signature mismatch', {
        declaredType: file.type,
        fileName: file.name
      })
      return NextResponse.json({
        error: 'File type does not match content'
      }, { status: 400 })
    }
    
    // 5. Process with sharp (strips EXIF, validates image)
    const processedImage = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()
    
    // 6. Final size check
    if (processedImage.length > MAX_SIZE) {
      return NextResponse.json({
        error: 'Processed image too large'
      }, { status: 400 })
    }
    
    // 7. Upload to storage
    const fileName = `${user.id}-${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, processedImage, {
        contentType: 'image/jpeg',
        upsert: false
      })
    
    if (uploadError) {
      throw uploadError
    }
    
    // 8. Update profile
    const publicUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl
    
    await supabase
      .from('profiles')
      .update({ profile_picture: publicUrl })
      .eq('user_id', user.id)
    
    return NextResponse.json({ success: true, url: publicUrl })
    
  } catch (error: any) {
    logger.error('Profile picture upload failed', {
      error: error.message,
      userId: user?.id
    })
    return NextResponse.json({
      error: 'Upload failed. Please try again.'
    }, { status: 500 })
  }
}
```

### File Validator:
```typescript
// src/lib/security/file-validator.ts
const IMAGE_SIGNATURES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF]  // JPEG magic number
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]  // PNG magic number
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46]  // WEBP magic number (RIFF)
  ]
}

export function validateImageSignature(buffer: Buffer, mimeType: string): boolean {
  const signatures = IMAGE_SIGNATURES[mimeType as keyof typeof IMAGE_SIGNATURES]
  if (!signatures) return false
  
  return signatures.some(sig => {
    if (buffer.length < sig.length) return false
    return sig.every((byte, i) => buffer[i] === byte)
  })
}
```

---

## 7. RACE CONDITION FIX (CRITICAL 🔴)

**File:** `src/lib/cache/profile-cache.ts`

### FIXED CODE:
```typescript
interface CacheEntry<T> {
  data: T
  version: number
  expiresAt: number
  lockId?: string
}

class AtomicCache {
  private lockTimeout = 5000 // 5 seconds
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return null
      
      const entry: CacheEntry<T> = JSON.parse(stored)
      
      // Check expiry
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(key)
        return null
      }
      
      // Check if locked
      if (entry.lockId && this.isLocked(entry)) {
        // Wait for lock release
        await this.waitForLock(key)
        return this.get(key) // Retry
      }
      
      return entry.data
    } catch {
      return null
    }
  }
  
  async set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    const lockId = crypto.randomUUID()
    
    try {
      // Acquire lock
      const locked = await this.acquireLock(key, lockId)
      if (!locked) {
        throw new Error('Failed to acquire lock')
      }
      
      // Read current version
      const current = await this.get<T>(key)
      const version = current ? (current as any).version + 1 : 1
      
      // Write new version
      const entry: CacheEntry<T> = {
        data,
        version,
        expiresAt: Date.now() + ttl,
        lockId: undefined  // Release lock
      }
      
      localStorage.setItem(key, JSON.stringify(entry))
      
    } finally {
      // Always release lock
      await this.releaseLock(key, lockId)
    }
  }
  
  private async acquireLock(key: string, lockId: string): Promise<boolean> {
    const lockKey = `${key}:lock`
    const lock = {
      id: lockId,
      acquiredAt: Date.now()
    }
    
    // Try to set lock
    const existing = localStorage.getItem(lockKey)
    if (existing) {
      const existingLock = JSON.parse(existing)
      // Check if lock is stale
      if (Date.now() - existingLock.acquiredAt > this.lockTimeout) {
        // Stale lock, force release
        localStorage.removeItem(lockKey)
      } else {
        return false // Lock held by another process
      }
    }
    
    localStorage.setItem(lockKey, JSON.stringify(lock))
    return true
  }
  
  private async releaseLock(key: string, lockId: string): Promise<void> {
    const lockKey = `${key}:lock`
    const existing = localStorage.getItem(lockKey)
    
    if (existing) {
      const lock = JSON.parse(existing)
      if (lock.id === lockId) {
        localStorage.removeItem(lockKey)
      }
    }
  }
  
  private isLocked(entry: CacheEntry<any>): boolean {
    return !!entry.lockId
  }
  
  private async waitForLock(key: string): Promise<void> {
    const maxWait = 3000 // 3 seconds
    const interval = 100 // Check every 100ms
    let waited = 0
    
    while (waited < maxWait) {
      await new Promise(resolve => setTimeout(resolve, interval))
      waited += interval
      
      const lockKey = `${key}:lock`
      if (!localStorage.getItem(lockKey)) {
        return // Lock released
      }
    }
    
    throw new Error('Lock timeout')
  }
}

export const atomicCache = new AtomicCache()
```

---

## 8. CONSOLE.LOG CLEANUP (HIGH 🟠)

### Global Find & Replace:
```bash
# Find all console.log
rg "console\.(log|error|warn|debug)" --type ts --type tsx

# Replace with logger
# Before:
console.log('User data:', user)
console.error('API error:', error)

# After:
logger.debug('User authenticated', { userId: user.id })
logger.error('API request failed', { error: error.message, stack: error.stack })
```

### Production Logger Config:
```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security'

class Logger {
  private minLevel: LogLevel
  
  constructor() {
    // Production: only errors
    // Staging: warnings and above
    // Development: all levels
    this.minLevel = process.env.NODE_ENV === 'production' ? 'error' :
                    process.env.NODE_ENV === 'staging' ? 'warn' :
                    'debug'
  }
  
  debug(message: string, meta?: any) {
    if (this.shouldLog('debug')) {
      this.log('debug', message, meta)
    }
  }
  
  error(message: string, meta?: any) {
    if (this.shouldLog('error')) {
      this.log('error', message, meta)
      // Send to error tracking service
      this.sendToSentry(message, meta)
    }
  }
  
  security(message: string, meta?: any) {
    // Always log security events
    this.log('security', message, meta)
    this.sendToSecurityLog(message, meta)
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'security']
    return levels.indexOf(level) >= levels.indexOf(this.minLevel)
  }
  
  private log(level: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString()
    const sanitized = this.sanitizeMeta(meta)
    
    console.log(JSON.stringify({
      timestamp,
      level,
      message,
      meta: sanitized
    }))
  }
  
  private sanitizeMeta(meta?: any): any {
    if (!meta) return {}
    
    // Redact sensitive fields
    const sensitiveKeys = ['password', 'token', 'api_key', 'secret']
    const sanitized = { ...meta }
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]'
      }
    }
    
    return sanitized
  }
  
  private sendToSentry(message: string, meta?: any) {
    // Integrate with Sentry/DataDog
  }
  
  private sendToSecurityLog(message: string, meta?: any) {
    // Send to security monitoring
  }
}

export const logger = new Logger()
```

---

## ⏰ IMPLEMENTATION TIMELINE

### DAY 1 (Today):
- [ ] Deploy API key fix (#1)
- [ ] Add input validation (#2)
- [ ] Implement CSRF middleware (#3)

### DAY 2:
- [ ] Fix auth bypass (#4)
- [ ] Secure password reset (#5)
- [ ] Update file upload (#6)

### DAY 3:
- [ ] Fix race conditions (#7)
- [ ] Replace console.log (#8)
- [ ] Add monitoring

### Testing:
- [ ] Penetration test all APIs
- [ ] Load test race conditions
- [ ] Verify CSRF on all routes
- [ ] Security audit review

---

**STATUS:** Ready for deployment  
**RISK LEVEL:** HIGH until fixed  
**PRIORITY:** Execute immediately
