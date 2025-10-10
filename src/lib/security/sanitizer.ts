/**
 * HTML Sanitization Service
 * Prevents XSS attacks by sanitizing user-generated content
 */

// List of allowed HTML tags
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
  'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
]

// List of allowed attributes for specific tags
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'width', 'height'],
  'span': ['class'],
  'div': ['class'],
  'code': ['class'],
  'pre': ['class']
}

// List of allowed URL schemes
const ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel']

// Regex patterns for dangerous content
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
  /data:text\/html/gi,
  /vbscript:/gi,
  /file:/gi,
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
  /<form/gi,
  /<input/gi,
  /<textarea/gi,
  /<select/gi,
  /<button/gi,
  /eval\(/gi,
  /expression\(/gi,
  /import\s+/gi,
  /document\./gi,
  /window\./gi,
  /alert\(/gi,
  /prompt\(/gi,
  /confirm\(/gi
]

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  let sanitized = input
  
  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }
  
  // Parse and rebuild HTML with only allowed tags and attributes
  sanitized = sanitizeWithAllowlist(sanitized)
  
  // Encode special characters that could be interpreted as HTML
  sanitized = encodeSpecialChars(sanitized)
  
  return sanitized.trim()
}

/**
 * Sanitize with allowlist approach
 */
function sanitizeWithAllowlist(html: string): string {
  // This is a simplified version - in production, use DOMPurify or similar
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // Remove all scripts
  const scripts = doc.querySelectorAll('script')
  scripts.forEach(script => script.remove())
  
  // Remove all style tags
  const styles = doc.querySelectorAll('style')
  styles.forEach(style => style.remove())
  
  // Clean all elements
  const allElements = doc.querySelectorAll('*')
  allElements.forEach(element => {
    const tagName = element.tagName.toLowerCase()
    
    // Remove element if not in allowed list
    if (!ALLOWED_TAGS.includes(tagName)) {
      element.remove()
      return
    }
    
    // Clean attributes
    const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || []
    const attributes = Array.from(element.attributes)
    
    attributes.forEach(attr => {
      // Remove if not allowed
      if (!allowedAttrs.includes(attr.name)) {
        element.removeAttribute(attr.name)
        return
      }
      
      // Sanitize href and src attributes
      if (attr.name === 'href' || attr.name === 'src') {
        const url = attr.value
        if (!isValidURL(url)) {
          element.removeAttribute(attr.name)
        }
      }
    })
  })
  
  return doc.body.innerHTML
}

/**
 * Validate URL for href and src attributes
 */
function isValidURL(url: string): boolean {
  if (!url) return false
  
  // Allow relative URLs
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return true
  }
  
  // Check for allowed schemes
  try {
    const urlObj = new URL(url)
    return ALLOWED_SCHEMES.includes(urlObj.protocol.replace(':', ''))
  } catch {
    return false
  }
}

/**
 * Encode special HTML characters
 */
function encodeSpecialChars(text: string): string {
  const replacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }
  
  // Only encode characters outside of valid HTML tags
  const tagRegex = /<[^>]+>/g
  const tags: string[] = []
  let match
  
  // Store valid tags
  while ((match = tagRegex.exec(text)) !== null) {
    tags.push(match[0])
  }
  
  // Replace tags with placeholders
  let result = text
  tags.forEach((tag, index) => {
    result = result.replace(tag, `__TAG_${index}__`)
  })
  
  // Encode special characters
  for (const [char, encoded] of Object.entries(replacements)) {
    result = result.replace(new RegExp(char, 'g'), encoded)
  }
  
  // Restore tags
  tags.forEach((tag, index) => {
    result = result.replace(`__TAG_${index}__`, tag)
  })
  
  return result
}

/**
 * Sanitize user input for display
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Sanitize JSON data
 */
export function sanitizeJSON(data: any): any {
  if (typeof data === 'string') {
    return sanitizeText(data)
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeJSON)
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {}
    for (const key in data) {
      // Sanitize the key itself
      const safeKey = sanitizeText(key)
      sanitized[safeKey] = sanitizeJSON(data[key])
    }
    return sanitized
  }
  
  return data
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return ''
  }
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const sanitized = email.trim().toLowerCase()
  
  if (!emailRegex.test(sanitized)) {
    return ''
  }
  
  return sanitized
}

/**
 * Sanitize file names
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return ''
  }
  
  // Remove any path traversal attempts
  return fileName
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255) // Limit length
}

/**
 * Content Security Policy header generator
 */
export function generateCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net", // Remove unsafe-eval in production
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ')
}

/**
 * Create safe HTML content object for React
 * Use this with dangerouslySetInnerHTML when absolutely necessary
 */
export function createSafeHTML(content: string): { __html: string } {
  const sanitized = sanitizeHTML(content)
  return { __html: sanitized }
}

/**
 * Validate if content is safe to render
 */
export function isHTMLSafe(content: string): boolean {
  const original = content
  const sanitized = sanitizeHTML(content)
  // If content changes after sanitization, it contained unsafe elements
  return original === sanitized
}
