/**
 * Utility functions for parsing and validating names
 */

/**
 * Safely parse a full name into first and last name components
 * Handles edge cases like single names, multiple names, etc.
 * 
 * @param fullName - The full name string to parse
 * @returns Object with firstName and lastName
 */
export function parseFullName(fullName: string | null | undefined): {
  firstName: string
  lastName: string
} {
  // Default fallback
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' }
  }

  // Trim and normalize whitespace
  const normalized = fullName.trim().replace(/\s+/g, ' ')
  
  if (!normalized) {
    return { firstName: '', lastName: '' }
  }

  // Split on space
  const parts = normalized.split(' ')
  
  if (parts.length === 0) {
    return { firstName: '', lastName: '' }
  }
  
  if (parts.length === 1) {
    // Single name - use as first name, empty last name
    return { firstName: parts[0], lastName: '' }
  }
  
  // Multiple parts - first part is firstName, rest is lastName
  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')
  
  return { firstName, lastName }
}

/**
 * Validate if a name is acceptable
 * 
 * @param name - Name to validate
 * @returns true if valid, false otherwise
 */
export function isValidName(name: string | null | undefined): boolean {
  if (!name || typeof name !== 'string') {
    return false
  }
  
  const trimmed = name.trim()
  
  // Must be at least 1 character
  if (trimmed.length === 0) {
    return false
  }
  
  // Must be less than 100 characters (reasonable limit)
  if (trimmed.length > 100) {
    return false
  }
  
  // Allow letters, spaces, hyphens, apostrophes, and common diacritics
  // This supports most international names
  const namePattern = /^[a-zA-Z\u00C0-\u017F\s'-]+$/
  
  return namePattern.test(trimmed)
}

/**
 * Get display name from first and last name
 * 
 * @param firstName - First name
 * @param lastName - Last name (optional)
 * @returns Formatted display name
 */
export function getDisplayName(firstName: string, lastName?: string): string {
  const parts = [firstName, lastName].filter(Boolean)
  return parts.join(' ').trim() || 'User'
}

/**
 * Get initials from a full name
 * 
 * @param fullName - Full name
 * @returns Initials (1-2 characters)
 */
export function getInitials(fullName: string | null | undefined): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'U'
  }
  
  const { firstName, lastName } = parseFullName(fullName)
  
  if (!firstName) {
    return 'U'
  }
  
  if (!lastName) {
    return firstName.charAt(0).toUpperCase()
  }
  
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
}
