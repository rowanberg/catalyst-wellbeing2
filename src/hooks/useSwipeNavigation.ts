'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface SwipeNavigationOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  minSwipeDistance?: number
  maxSwipeTime?: number
  preventScroll?: boolean
  enabled?: boolean
}

interface TouchPosition {
  x: number
  y: number
  time: number
}

export const useSwipeNavigation = (options: SwipeNavigationOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    preventScroll = false,
    enabled = true
  } = options

  const [isSwipeActive, setIsSwipeActive] = useState(false)
  const touchStart = useRef<TouchPosition | null>(null)
  const touchEnd = useRef<TouchPosition | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return

    const touch = e.touches[0]
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    touchEnd.current = null
    setIsSwipeActive(false) // Don't activate immediately
  }, [enabled])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStart.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    // Only activate swipe if horizontal movement is significant
    if (!isSwipeActive && absDeltaX > 20 && absDeltaX > absDeltaY * 1.5) {
      setIsSwipeActive(true)
    }

    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    // Prevent scroll only during active horizontal swipes
    if (isSwipeActive && absDeltaX > absDeltaY) {
      e.preventDefault()
    }
  }, [enabled, isSwipeActive])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStart.current || !touchEnd.current) {
      setIsSwipeActive(false)
      return
    }

    const deltaX = touchEnd.current.x - touchStart.current.x
    const deltaY = touchEnd.current.y - touchStart.current.y
    const deltaTime = touchEnd.current.time - touchStart.current.time

    // Check if it's a valid swipe
    const distance = Math.abs(deltaX)
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)
    const isValidDistance = distance >= minSwipeDistance
    const isValidTime = deltaTime <= maxSwipeTime

    if (isHorizontalSwipe && isValidDistance && isValidTime) {
      if (deltaX > 0) {
        // Swipe right
        onSwipeRight?.()
      } else {
        // Swipe left
        onSwipeLeft?.()
      }
    }

    // Reset
    touchStart.current = null
    touchEnd.current = null
    setIsSwipeActive(false)

    if (preventScroll) {
      e.preventDefault()
    }
  }, [enabled, minSwipeDistance, maxSwipeTime, onSwipeLeft, onSwipeRight, preventScroll])

  const handleTouchCancel = useCallback(() => {
    touchStart.current = null
    touchEnd.current = null
    setIsSwipeActive(false)
  }, [])

  // Attach event listeners
  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    const options = { passive: !preventScroll }

    element.addEventListener('touchstart', handleTouchStart, options)
    element.addEventListener('touchmove', handleTouchMove, options)
    element.addEventListener('touchend', handleTouchEnd, options)
    element.addEventListener('touchcancel', handleTouchCancel, options)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, preventScroll])

  return {
    elementRef,
    isSwipeActive
  }
}

// Hook for tab navigation specifically
export const useTabSwipeNavigation = (
  tabs: string[],
  activeTab: string,
  onTabChange: (tab: string) => void,
  enabled: boolean = true
) => {
  const currentIndex = tabs.indexOf(activeTab)

  const handleSwipeLeft = useCallback(() => {
    if (currentIndex < tabs.length - 1) {
      onTabChange(tabs[currentIndex + 1])
    }
  }, [currentIndex, tabs, onTabChange])

  const handleSwipeRight = useCallback(() => {
    if (currentIndex > 0) {
      onTabChange(tabs[currentIndex - 1])
    }
  }, [currentIndex, tabs, onTabChange])

  const swipeNavigation = useSwipeNavigation({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    minSwipeDistance: 75,
    maxSwipeTime: 400,
    preventScroll: true,
    enabled
  })

  return {
    ...swipeNavigation,
    canSwipeLeft: currentIndex < tabs.length - 1,
    canSwipeRight: currentIndex > 0,
    currentIndex
  }
}

// Hook for pull-to-refresh functionality
export const usePullToRefresh = (
  onRefresh: () => Promise<void> | void,
  options: {
    threshold?: number
    enabled?: boolean
    resistance?: number
  } = {}
) => {
  const {
    threshold = 80,
    enabled = true,
    resistance = 2.5
  } = options

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const elementRef = useRef<HTMLElement | null>(null)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing) return

    const element = elementRef.current
    if (!element || element.scrollTop > 0) return

    startY.current = e.touches[0].clientY
    isDragging.current = true
  }, [enabled, isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isDragging.current || isRefreshing) return

    const element = elementRef.current
    if (!element || element.scrollTop > 0) {
      isDragging.current = false
      setPullDistance(0)
      return
    }

    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current

    if (deltaY > 0) {
      const distance = Math.min(deltaY / resistance, threshold * 1.5)
      setPullDistance(distance)
      
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
      } finally {
        setIsRefreshing(false)
      }
    }

    setPullDistance(0)
  }, [enabled, isRefreshing, pullDistance, threshold, onRefresh])

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    elementRef,
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1)
  }
}
