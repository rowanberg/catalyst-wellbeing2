'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PulseNotificationProps {
  children: ReactNode
  isActive?: boolean
  color?: 'red' | 'orange' | 'blue' | 'green' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PulseNotification({ 
  children, 
  isActive = true, 
  color = 'red',
  size = 'md',
  className = ''
}: PulseNotificationProps) {
  const colorClasses = {
    red: 'bg-red-500 shadow-red-500/50',
    orange: 'bg-orange-500 shadow-orange-500/50',
    blue: 'bg-blue-500 shadow-blue-500/50',
    green: 'bg-green-500 shadow-green-500/50',
    purple: 'bg-purple-500 shadow-purple-500/50'
  }

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  if (!isActive) return <>{children}</>

  return (
    <div className={`relative ${className}`}>
      {children}
      <motion.div
        className={`absolute -top-1 -right-1 rounded-full ${colorClasses[color]} ${sizeClasses[size]}`}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className={`absolute -top-1 -right-1 rounded-full ${colorClasses[color]} ${sizeClasses[size]} opacity-30`}
        animate={{
          scale: [1, 2, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2
        }}
      />
    </div>
  )
}
