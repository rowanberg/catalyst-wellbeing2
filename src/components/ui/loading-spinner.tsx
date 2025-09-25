'use client'

import { cn } from '@/lib/utils'
import { School } from 'lucide-react'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: { container: 'w-8 h-8', icon: 'w-3 h-3', dots: 'w-1 h-1' },
    md: { container: 'w-12 h-12', icon: 'w-4 h-4', dots: 'w-1.5 h-1.5' },
    lg: { container: 'w-16 h-16', icon: 'w-6 h-6', dots: 'w-2 h-2' }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <motion.div
        className={cn('relative mx-auto', currentSize.container)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 border-2 border-blue-200 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner spinning dots */}
        <motion.div
          className="absolute inset-1 border-2 border-transparent border-t-blue-500 border-r-purple-500 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        {/* Center logo */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <School className={cn('text-blue-600', currentSize.icon)} />
        </motion.div>
      </motion.div>
      
      {text && (
        <motion.p 
          className="text-slate-600 font-medium text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {text}
        </motion.p>
      )}
      
      <motion.div
        className="flex justify-center space-x-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn('bg-blue-400 rounded-full', currentSize.dots)}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  )
}

export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}
