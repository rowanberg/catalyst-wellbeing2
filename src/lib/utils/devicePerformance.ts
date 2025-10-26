/**
 * Device Performance Auto-Tuning System
 * Detects device capabilities and sets appropriate performance mode
 */

export type PerformanceMode = 'high' | 'medium' | 'low'

export interface DeviceCapabilities {
  mode: PerformanceMode
  cpuCores: number
  memory: number
  isMobile: boolean
  isLowEnd: boolean
  reduceMotion: boolean
}

/**
 * Detect device capabilities and determine performance mode
 */
export function detectDevicePerformance(): DeviceCapabilities {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false

  // Detect mobile devices
  const isMobile = typeof window !== 'undefined'
    ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    : false

  // Get CPU cores (fallback to 4 if not available)
  const cpuCores = typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator
    ? navigator.hardwareConcurrency
    : 4

  // Estimate memory (GB) - deviceMemory is in GB
  const memory = typeof navigator !== 'undefined' && 'deviceMemory' in navigator
    ? (navigator as any).deviceMemory
    : 4

  // Determine if low-end device
  const isLowEnd = isMobile || cpuCores <= 2 || memory <= 2

  // Determine performance mode
  let mode: PerformanceMode = 'high'
  
  if (prefersReducedMotion) {
    mode = 'low'
  } else if (isLowEnd || cpuCores <= 4) {
    mode = 'medium'
  } else if (cpuCores >= 8 && memory >= 8) {
    mode = 'high'
  } else {
    mode = 'medium'
  }

  return {
    mode,
    cpuCores,
    memory,
    isMobile,
    isLowEnd,
    reduceMotion: prefersReducedMotion
  }
}

/**
 * Hook to get device performance capabilities
 */
export function useDevicePerformance(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      mode: 'medium',
      cpuCores: 4,
      memory: 4,
      isMobile: false,
      isLowEnd: false,
      reduceMotion: false
    }
  }

  return detectDevicePerformance()
}

/**
 * Get animation config based on performance mode
 */
export function getAnimationConfig(mode: PerformanceMode) {
  switch (mode) {
    case 'high':
      return {
        enableAnimations: true,
        enableParticles: true,
        animationDuration: 0.3,
        useSpringAnimations: true,
        maxAnimatedElements: 50
      }
    case 'medium':
      return {
        enableAnimations: true,
        enableParticles: false,
        animationDuration: 0.2,
        useSpringAnimations: false,
        maxAnimatedElements: 20
      }
    case 'low':
      return {
        enableAnimations: false,
        enableParticles: false,
        animationDuration: 0,
        useSpringAnimations: false,
        maxAnimatedElements: 0
      }
  }
}
