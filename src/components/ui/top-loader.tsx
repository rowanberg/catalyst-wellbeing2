'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TopLoaderProps {
  isLoading: boolean
  color?: string
  height?: number
  speed?: number
}

export function TopLoader({ 
  isLoading, 
  color = '#3b82f6', // blue-500
  height = 3,
  speed = 500 
}: TopLoaderProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isLoading) {
      setProgress(0)
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          
          // Slow down as we approach 90%
          const increment = prev < 30 ? 10 : prev < 60 ? 5 : 2
          return Math.min(prev + increment, 90)
        })
      }, speed)

      return () => clearInterval(interval)
    } else {
      // Complete the progress bar quickly when loading is done
      setProgress(100)
      
      // Reset after animation completes
      const timeout = setTimeout(() => {
        setProgress(0)
      }, 400)
      
      return () => clearTimeout(timeout)
    }
  }, [isLoading, speed])

  return (
    <AnimatePresence>
      {(isLoading || progress === 100) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999]"
          style={{ height: `${height}px` }}
        >
          <motion.div
            className="h-full shadow-lg"
            style={{
              background: `linear-gradient(90deg, ${color}, ${color}dd)`,
              boxShadow: `0 0 10px ${color}80, 0 0 5px ${color}60`
            }}
            initial={{ width: '0%' }}
            animate={{ 
              width: `${progress}%`,
              transition: {
                duration: progress === 100 ? 0.3 : 0.5,
                ease: progress === 100 ? 'easeOut' : 'easeInOut'
              }
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Simplified variant with pulsing animation
export function PulsingTopLoader({ isLoading }: { isLoading: boolean }) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 bg-[length:200%_100%]"
          style={{
            animation: 'shimmer 2s infinite',
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
          }}
        />
      )}
    </AnimatePresence>
  )
}
