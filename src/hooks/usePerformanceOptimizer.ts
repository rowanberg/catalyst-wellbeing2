import { useState, useEffect, useMemo } from 'react'

export interface DeviceCapabilities {
  isMobile: boolean
  isLowEndDevice: boolean
  deviceMemory: number | undefined
  hardwareConcurrency: number
  connectionSpeed: 'slow' | 'medium' | 'fast'
  prefersReducedMotion: boolean
}

export interface PerformanceSettings {
  enableAnimations: boolean
  enableParticles: boolean
  enableSyntaxHighlighting: boolean
  enableCodeFormatting: boolean
  maxMessagesInView: number
  imageQuality: 'low' | 'medium' | 'high'
  lazyLoadThreshold: number
  debounceDelay: number
}

/**
 * Auto-detect device capabilities and optimize performance settings
 * Mobile optimizations:
 * - Reduce animations and visual effects
 * - Limit concurrent operations
 * - Lazy load components
 * - Reduce syntax highlighting complexity
 * - Optimize memory usage
 */
export function usePerformanceOptimizer(): {
  capabilities: DeviceCapabilities
  settings: PerformanceSettings
  isOptimized: boolean
} {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isMobile: false,
    isLowEndDevice: false,
    deviceMemory: undefined,
    hardwareConcurrency: 4,
    connectionSpeed: 'medium',
    prefersReducedMotion: false,
  })

  useEffect(() => {
    // Detect device capabilities
    const detectCapabilities = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
      
      // Device memory (if available)
      const deviceMemory = (navigator as any).deviceMemory || undefined
      
      // CPU cores
      const hardwareConcurrency = navigator.hardwareConcurrency || 4
      
      // Network speed
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      let connectionSpeed: 'slow' | 'medium' | 'fast' = 'medium'
      
      if (connection) {
        const effectiveType = connection.effectiveType
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          connectionSpeed = 'slow'
        } else if (effectiveType === '4g') {
          connectionSpeed = 'fast'
        }
      }
      
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      
      // Determine if low-end device
      const isLowEndDevice = 
        isMobile && (
          (deviceMemory && deviceMemory < 4) || 
          hardwareConcurrency < 4 ||
          connectionSpeed === 'slow'
        )

      setCapabilities({
        isMobile,
        isLowEndDevice,
        deviceMemory,
        hardwareConcurrency,
        connectionSpeed,
        prefersReducedMotion,
      })
    }

    detectCapabilities()

    // Re-detect on resize
    const handleResize = () => {
      detectCapabilities()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate optimized settings based on capabilities
  const settings = useMemo<PerformanceSettings>(() => {
    const { isMobile, isLowEndDevice, connectionSpeed, prefersReducedMotion } = capabilities

    // High-end desktop: Full features
    if (!isMobile && !isLowEndDevice) {
      return {
        enableAnimations: !prefersReducedMotion,
        enableParticles: !prefersReducedMotion,
        enableSyntaxHighlighting: true,
        enableCodeFormatting: true,
        maxMessagesInView: 50,
        imageQuality: 'high',
        lazyLoadThreshold: 1000,
        debounceDelay: 150,
      }
    }

    // Mobile - medium performance
    if (isMobile && !isLowEndDevice) {
      return {
        enableAnimations: !prefersReducedMotion,
        enableParticles: false, // Disable particles on all mobile
        enableSyntaxHighlighting: true,
        enableCodeFormatting: true,
        maxMessagesInView: 30,
        imageQuality: 'medium',
        lazyLoadThreshold: 500,
        debounceDelay: 300,
      }
    }

    // Low-end device: Maximum optimization
    return {
      enableAnimations: false,
      enableParticles: false,
      enableSyntaxHighlighting: connectionSpeed !== 'slow', // Disable on slow connections
      enableCodeFormatting: false,
      maxMessagesInView: 20,
      imageQuality: 'low',
      lazyLoadThreshold: 300,
      debounceDelay: 500,
    }
  }, [capabilities])

  const isOptimized = capabilities.isMobile || capabilities.isLowEndDevice

  return {
    capabilities,
    settings,
    isOptimized,
  }
}

/**
 * Performance monitoring hook
 * Tracks frame rate and adjusts settings dynamically
 */
export function usePerformanceMonitor() {
  const [fps, setFps] = useState(60)
  const [isThrottling, setIsThrottling] = useState(false)

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationFrameId: number

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      // Calculate FPS every second
      if (currentTime >= lastTime + 1000) {
        const currentFps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        setFps(currentFps)
        
        // Detect throttling (< 30 FPS consistently)
        setIsThrottling(currentFps < 30)
        
        frameCount = 0
        lastTime = currentTime
      }

      animationFrameId = requestAnimationFrame(measureFPS)
    }

    animationFrameId = requestAnimationFrame(measureFPS)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  return {
    fps,
    isThrottling,
    isPerformant: fps >= 55,
  }
}
