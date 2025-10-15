/**
 * Secure File Upload Validation
 * Validates files using magic numbers (file signatures) to prevent MIME type spoofing
 */

interface FileSignature {
  mime: string
  signatures: number[][]
  maxSize: number
  extensions: string[]
}

/**
 * Known file signatures (magic numbers)
 * https://en.wikipedia.org/wiki/List_of_file_signatures
 */
const FILE_SIGNATURES: FileSignature[] = [
  {
    mime: 'image/jpeg',
    signatures: [
      [0xFF, 0xD8, 0xFF, 0xE0],
      [0xFF, 0xD8, 0xFF, 0xE1],
      [0xFF, 0xD8, 0xFF, 0xE2],
      [0xFF, 0xD8, 0xFF, 0xE3],
      [0xFF, 0xD8, 0xFF, 0xDB]
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    extensions: ['jpg', 'jpeg']
  },
  {
    mime: 'image/png',
    signatures: [
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    extensions: ['png']
  },
  {
    mime: 'image/webp',
    signatures: [
      [0x52, 0x49, 0x46, 0x46] // "RIFF"
    ],
    maxSize: 5 * 1024 * 1024, // 5MB
    extensions: ['webp']
  },
  {
    mime: 'application/pdf',
    signatures: [
      [0x25, 0x50, 0x44, 0x46] // "%PDF"
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: ['pdf']
  },
  {
    mime: 'application/msword',
    signatures: [
      [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: ['doc']
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    signatures: [
      [0x50, 0x4B, 0x03, 0x04] // ZIP signature (DOCX is a ZIP)
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: ['docx']
  }
]

/**
 * Validates file based on magic numbers (file signature)
 */
export async function validateFileBySignature(file: File): Promise<{
  valid: boolean
  error?: string
  detectedMime?: string
}> {
  try {
    // Read first 12 bytes (enough for most signatures)
    const arrayBuffer = await file.slice(0, 12).arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    
    // Check against known signatures
    for (const fileType of FILE_SIGNATURES) {
      for (const signature of fileType.signatures) {
        if (matchesSignature(bytes, signature)) {
          // Validate file size
          if (file.size > fileType.maxSize) {
            return {
              valid: false,
              error: `File too large. Maximum size is ${fileType.maxSize / 1024 / 1024}MB`
            }
          }
          
          // Validate extension
          const extension = file.name.split('.').pop()?.toLowerCase() || ''
          if (!fileType.extensions.includes(extension)) {
            return {
              valid: false,
              error: `File extension .${extension} does not match file type ${fileType.mime}`
            }
          }
          
          // Additional validation for WEBP
          if (fileType.mime === 'image/webp') {
            const webpCheck = await validateWebP(arrayBuffer)
            if (!webpCheck) {
              return {
                valid: false,
                error: 'Invalid WebP file format'
              }
            }
          }
          
          return {
            valid: true,
            detectedMime: fileType.mime
          }
        }
      }
    }
    
    return {
      valid: false,
      error: 'Unsupported file type or corrupted file'
    }
    
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate file'
    }
  }
}

/**
 * Checks if byte array matches signature
 */
function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) {
    return false
  }
  
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) {
      return false
    }
  }
  
  return true
}

/**
 * Additional validation for WebP format
 */
async function validateWebP(buffer: ArrayBuffer): Promise<boolean> {
  const bytes = new Uint8Array(buffer)
  
  // Check for "WEBP" at offset 8
  if (bytes.length >= 12) {
    return (
      bytes[8] === 0x57 && // W
      bytes[9] === 0x45 && // E
      bytes[10] === 0x42 && // B
      bytes[11] === 0x50    // P
    )
  }
  
  return false
}

/**
 * Validates filename for security
 */
export function validateFilename(filename: string): {
  valid: boolean
  error?: string
  sanitized?: string
} {
  // Check for path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      valid: false,
      error: 'Filename contains invalid characters'
    }
  }
  
  // Check for null bytes
  if (filename.includes('\0')) {
    return {
      valid: false,
      error: 'Filename contains null bytes'
    }
  }
  
  // Check length
  if (filename.length > 255) {
    return {
      valid: false,
      error: 'Filename too long (max 255 characters)'
    }
  }
  
  // Sanitize filename
  const sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .trim()
  
  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Invalid filename'
    }
  }
  
  return {
    valid: true,
    sanitized
  }
}

/**
 * Comprehensive file validation
 */
export async function validateUploadedFile(
  file: File,
  options?: {
    allowedTypes?: string[]
    maxSize?: number
  }
): Promise<{
  valid: boolean
  error?: string
  sanitizedFilename?: string
  detectedMime?: string
}> {
  // Validate filename
  const filenameCheck = validateFilename(file.name)
  if (!filenameCheck.valid) {
    return filenameCheck
  }
  
  // Validate file signature
  const signatureCheck = await validateFileBySignature(file)
  if (!signatureCheck.valid) {
    return signatureCheck
  }
  
  // Check if mime type is allowed
  if (options?.allowedTypes && options.allowedTypes.length > 0) {
    if (!options.allowedTypes.includes(signatureCheck.detectedMime!)) {
      return {
        valid: false,
        error: `File type ${signatureCheck.detectedMime} is not allowed`
      }
    }
  }
  
  // Check custom max size
  if (options?.maxSize && file.size > options.maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${options.maxSize / 1024 / 1024}MB`
    }
  }
  
  return {
    valid: true,
    sanitizedFilename: filenameCheck.sanitized,
    detectedMime: signatureCheck.detectedMime
  }
}

/**
 * Generates secure random filename
 */
export function generateSecureFilename(originalFilename: string, userId: string): string {
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'bin'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  
  return `${userId}_${timestamp}_${random}.${extension}`
}
