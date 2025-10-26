/**
 * Haptic Feedback Utility for Mobile Interactions
 * Provides tactile feedback for better user experience on mobile devices
 */

// Check if the browser supports the Vibration API (runtime check)
const supportsVibration = () => typeof navigator !== 'undefined' && 'vibrate' in navigator

// Haptic feedback patterns (in milliseconds)
export const HapticPatterns: Record<string, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  error: [20, 100, 20, 100, 20],
  warning: [15, 75, 15],
  selection: 5,
  impact: 15,
  notification: [10, 50, 10, 50, 10],
  double: [10, 50, 10],
  triple: [10, 50, 10, 50, 10],
}

export type HapticType = keyof typeof HapticPatterns

/**
 * Trigger haptic feedback
 * @param type - The type of haptic feedback to trigger
 * @param force - Force the vibration even if user has disabled it (use sparingly)
 */
export const triggerHaptic = (type: HapticType = 'light', force: boolean = false): void => {
  // Check if vibration is supported
  if (!supportsVibration()) return

  // Check user preferences (can be extended to check localStorage settings)
  const userPreference = getUserHapticPreference()
  if (!userPreference && !force) return

  try {
    const pattern = HapticPatterns[type]
    navigator.vibrate(pattern)
  } catch (error) {
    console.warn('Haptic feedback failed:', error)
  }
}

/**
 * Get user's haptic feedback preference
 * Can be extended to check localStorage or user settings
 */
const getUserHapticPreference = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check localStorage for user preference
  const stored = localStorage.getItem('haptic-enabled')
  if (stored !== null) {
    return stored === 'true'
  }
  
  // Default to enabled on mobile devices
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

/**
 * Set user's haptic feedback preference
 */
export const setHapticPreference = (enabled: boolean): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('haptic-enabled', enabled.toString())
}

/**
 * React hook for haptic feedback
 */
export const useHaptic = () => {
  const haptic = (type: HapticType = 'light') => {
    triggerHaptic(type)
  }

  return { haptic, triggerHaptic }
}

/**
 * Haptic feedback for common UI interactions
 */
export const HapticFeedback = {
  // Button interactions
  buttonPress: () => triggerHaptic('light'),
  buttonRelease: () => triggerHaptic('selection'),
  
  // Navigation
  tabSwitch: () => triggerHaptic('selection'),
  pageTransition: () => triggerHaptic('light'),
  
  // Feedback
  success: () => triggerHaptic('success'),
  error: () => triggerHaptic('error'),
  warning: () => triggerHaptic('warning'),
  
  // Interactions
  toggle: () => triggerHaptic('medium'),
  select: () => triggerHaptic('selection'),
  delete: () => triggerHaptic('heavy'),
  refresh: () => triggerHaptic('medium'),
  
  // Notifications
  notification: () => triggerHaptic('notification'),
  alert: () => triggerHaptic('double'),
  
  // Gestures
  swipe: () => triggerHaptic('light'),
  longPress: () => triggerHaptic('heavy'),
  drag: () => triggerHaptic('selection'),
}

export default HapticFeedback
