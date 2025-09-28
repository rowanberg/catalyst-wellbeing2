import crypto from 'crypto'

/**
 * School-specific encryption utilities for secure messaging
 * Each school has a unique encryption key for isolating their data
 */

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16
const SALT_LENGTH = 32
const ITERATIONS = 100000

/**
 * Generate a unique encryption key for a school
 */
export function generateSchoolEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Encrypt a message using school-specific encryption key
 */
export function encryptMessage(message: string, schoolKey: string): string {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Derive key from school key and salt
    const key = crypto.pbkdf2Sync(schoolKey, salt, ITERATIONS, 32, 'sha512')
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(message, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Combine salt + iv + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      Buffer.from(encrypted, 'hex')
    ])
    
    return combined.toString('base64')
  } catch (error: any) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt message')
  }
}

/**
 * Decrypt a message using school-specific encryption key
 */
export function decryptMessage(encryptedData: string, schoolKey: string): string {
  try {
    const combined = Buffer.from(encryptedData, 'base64')
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH)
    
    // Derive key from school key and salt
    const key = crypto.pbkdf2Sync(schoolKey, salt, ITERATIONS, 32, 'sha512')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error: any) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt message - invalid key or corrupted data')
  }
}

/**
 * Validate if a message can be decrypted with the given school key
 */
export function validateSchoolAccess(encryptedData: string, schoolKey: string): boolean {
  try {
    decryptMessage(encryptedData, schoolKey)
    return true
  } catch {
    return false
  }
}

/**
 * Generate a school code (human-readable identifier)
 */
export function generateSchoolCode(schoolName: string): string {
  const sanitized = schoolName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6)
  
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase()
  
  return `${sanitized}${randomSuffix}`
}
