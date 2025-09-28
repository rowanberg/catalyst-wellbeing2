'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedProgressBarProps {
  value: number
  max: number
  className?: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  showPercentage?: boolean
  animated?: boolean
}

export function AnimatedProgressBar({ 
  value, 
  max, 
  className = '', 
  color = 'blue',
  showPercentage = false,
  animated = true
}: AnimatedProgressBarProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const percentage = Math.min((value / max) * 100, 100)

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(percentage), 100)
      return () => clearTimeout(timer)
    } else {
      setDisplayValue(percentage)
    }
  }, [percentage, animated])

  const colorClasses = {
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    purple: 'from-purple-400 to-purple-600',
    orange: 'from-orange-400 to-orange-600',
    red: 'from-red-400 to-red-600'
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${displayValue}%` }}
          transition={{ 
            duration: animated ? 1.5 : 0, 
            ease: "easeOut",
            delay: animated ? 0.2 : 0
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: animated ? 1.7 : 0
            }}
          />
        </motion.div>
      </div>
      {showPercentage && (
        <motion.div
          className="absolute right-0 top-4 text-sm font-medium text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animated ? 1 : 0 }}
        >
          {Math.round(displayValue)}%
        </motion.div>
      )}
    </div>
  )
}
