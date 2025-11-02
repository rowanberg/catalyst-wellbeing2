/**
 * Safe storage utilities with error handling
 * Handles private browsing mode, quota exceeded, and other storage errors
 */

/**
 * Safely get an item from sessionStorage
 * @param key - Storage key
 * @returns The stored value or null if error/not found
 */
export function getSessionItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch (error) {
    // Silent fail - may be private browsing or storage disabled
    return null
  }
}

/**
 * Safely set an item in sessionStorage
 * @param key - Storage key
 * @param value - Value to store
 * @returns true if successful, false otherwise
 */
export function setSessionItem(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value)
    return true
  } catch (error) {
    // May be quota exceeded or private browsing
    return false
  }
}

/**
 * Safely remove an item from sessionStorage
 * @param key - Storage key
 * @returns true if successful, false otherwise
 */
export function removeSessionItem(key: string): boolean {
  try {
    sessionStorage.removeItem(key)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Safely get and parse JSON from sessionStorage
 * @param key - Storage key
 * @returns Parsed object or null if error/not found
 */
export function getSessionJSON<T>(key: string): T | null {
  try {
    const item = sessionStorage.getItem(key)
    if (!item) return null
    return JSON.parse(item) as T
  } catch (error) {
    return null
  }
}

/**
 * Safely stringify and set JSON in sessionStorage
 * @param key - Storage key
 * @param value - Object to store
 * @returns true if successful, false otherwise
 */
export function setSessionJSON<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value)
    sessionStorage.setItem(key, serialized)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Safely get an item from localStorage
 * @param key - Storage key
 * @returns The stored value or null if error/not found
 */
export function getLocalItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    return null
  }
}

/**
 * Safely set an item in localStorage
 * @param key - Storage key
 * @param value - Value to store
 * @returns true if successful, false otherwise
 */
export function setLocalItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Safely remove an item from localStorage
 * @param key - Storage key
 * @returns true if successful, false otherwise
 */
export function removeLocalItem(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Safely get and parse JSON from localStorage
 * @param key - Storage key
 * @returns Parsed object or null if error/not found
 */
export function getLocalJSON<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null
    return JSON.parse(item) as T
  } catch (error) {
    return null
  }
}

/**
 * Safely stringify and set JSON in localStorage
 * @param key - Storage key
 * @param value - Object to store
 * @returns true if successful, false otherwise
 */
export function setLocalJSON<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value)
    localStorage.setItem(key, serialized)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Check if storage is available
 * @param type - 'sessionStorage' or 'localStorage'
 * @returns true if available and working
 */
export function isStorageAvailable(type: 'sessionStorage' | 'localStorage'): boolean {
  try {
    const storage = type === 'sessionStorage' ? sessionStorage : localStorage
    const testKey = '__storage_test__'
    storage.setItem(testKey, 'test')
    storage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}
