'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ArrowDown, Check } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
  resistance?: number
  enabled?: boolean
  className?: string
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshComplete, setRefreshComplete] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const isDragging = useRef<boolean>(false)
  const lastScrollTop = useRef<number>(0)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return

    const container = containerRef.current
    if (!container) return

    // Only start if we're at the top of the scroll and pulling down
    const scrollTop = container.scrollTop || window.pageYOffset
    if (scrollTop > 10) return

    // Prevent accidental triggers during horizontal swipes
    const touch = e.touches[0]
    startY.current = touch.clientY
    isDragging.current = false // Don't start dragging immediately
    lastScrollTop.current = scrollTop
  }, [enabled, isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return

    const container = containerRef.current
    if (!container) return

    const touch = e.touches[0]
    currentY.current = touch.clientY
    const deltaY = currentY.current - startY.current
    const scrollTop = container.scrollTop || window.pageYOffset

    // Only start dragging if moving down significantly (prevents horizontal swipe conflicts)
    if (!isDragging.current && deltaY > 15 && scrollTop <= 10) {
      isDragging.current = true
    }

    if (!isDragging.current) return
    
    // If user scrolled down, cancel the pull
    if (scrollTop > lastScrollTop.current + 5) {
      isDragging.current = false
      setPullDistance(0)
      return
    }

    if (deltaY > 0 && scrollTop <= 5) {
      // Calculate pull distance with resistance
      const distance = Math.min(deltaY / resistance, threshold * 1.5)
      setPullDistance(distance)
      
      // Prevent default scroll behavior when pulling
      if (distance > 10) {
        e.preventDefault()
      }
    }
  }, [enabled, isRefreshing, resistance, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !isDragging.current || isRefreshing) return

    isDragging.current = false

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      
      try {
        await onRefresh()
        setRefreshComplete(true)
        
        // Show completion state briefly
        setTimeout(() => {
          setRefreshComplete(false)
          setPullDistance(0)
          setIsRefreshing(false)
        }, 500)
      } catch (error) {
        console.error('Refresh failed:', error)
        setPullDistance(0)
        setIsRefreshing(false)
      }
    } else {
      // Animate back to 0
      setPullDistance(0)
    }
  }, [enabled, isRefreshing, pullDistance, threshold, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    const options = { passive: false }

    container.addEventListener('touchstart', handleTouchStart, options)
    container.addEventListener('touchmove', handleTouchMove, options)
    container.addEventListener('touchend', handleTouchEnd, options)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  const pullProgress = Math.min(pullDistance / threshold, 1)
  const isTriggered = pullDistance >= threshold
  const showIndicator = pullDistance > 10

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ 
        transform: `translateY(${Math.min(pullDistance * 0.5, 40)}px)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50"
            style={{ 
              top: `${Math.max(-60, -60 + pullDistance * 0.5)}px`,
            }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-center">
              {refreshComplete ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-500"
                >
                  <Check className="h-5 w-5" />
                </motion.div>
              ) : isRefreshing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-blue-500"
                >
                  <RefreshCw className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ 
                    rotate: isTriggered ? 180 : 0,
                    scale: isTriggered ? 1.1 : 1
                  }}
                  transition={{ duration: 0.2 }}
                  className={`${isTriggered ? 'text-blue-500' : 'text-gray-400'}`}
                >
                  <ArrowDown className="h-5 w-5" />
                </motion.div>
              )}
            </div>
            
            {/* Progress ring */}
            <div className="absolute inset-0 -m-1">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="stroke-current text-gray-200 dark:text-gray-700"
                  strokeWidth="2"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`stroke-current transition-all duration-200 ${
                    isTriggered ? 'text-blue-500' : 'text-gray-400'
                  }`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${pullProgress * 100}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
            
            {/* Status text */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {refreshComplete ? 'Updated!' : 
                 isRefreshing ? 'Refreshing...' :
                 isTriggered ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  )
}

// Hook for easy integration
export const usePullToRefresh = (
  onRefresh: () => Promise<void>,
  options: {
    threshold?: number
    resistance?: number
    enabled?: boolean
  } = {}
) => {
  const {
    threshold = 80,
    resistance = 2.5,
    enabled = true
  } = options

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, isRefreshing])

  return {
    isRefreshing,
    handleRefresh,
    PullToRefreshWrapper: ({ children, className }: { children: React.ReactNode, className?: string }) => (
      <PullToRefresh
        onRefresh={handleRefresh}
        threshold={threshold}
        resistance={resistance}
        enabled={enabled}
        className={className}
      >
        {children}
      </PullToRefresh>
    )
  }
}

export default PullToRefresh
