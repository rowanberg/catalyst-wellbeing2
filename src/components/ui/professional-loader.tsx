'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ProfessionalLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  variant?: 'default' | 'minimal' | 'dots'
}

export function ProfessionalLoader({ 
  size = 'md', 
  className, 
  text,
  variant = 'default'
}: ProfessionalLoaderProps) {
  const sizeClasses = {
    sm: { spinner: 'w-6 h-6', text: 'text-sm' },
    md: { spinner: 'w-8 h-8', text: 'text-base' },
    lg: { spinner: 'w-12 h-12', text: 'text-lg' }
  }

  const currentSize = sizeClasses[size]

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center justify-center gap-3', className)}>
        <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', currentSize.spinner)} />
        {text && (
          <span className={cn('text-gray-600 font-medium', currentSize.text)}>
            {text}
          </span>
        )}
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-blue-600 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        {text && (
          <motion.p 
            className={cn('text-gray-600 font-medium', currentSize.text)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {text}
          </motion.p>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <motion.div
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer ring */}
        <div className={cn('animate-spin rounded-full border-4 border-gray-200', currentSize.spinner)}>
          <div className="rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600" />
        </div>
        
        {/* Inner pulse */}
        <motion.div
          className={cn('absolute inset-2 bg-blue-100 rounded-full', currentSize.spinner)}
          animate={{ scale: [0.8, 1, 0.8], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      
      {text && (
        <motion.p 
          className={cn('text-gray-700 font-medium text-center', currentSize.text)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

export function FullPageLoader({ 
  text = 'Loading...', 
  variant = 'default' 
}: { 
  text?: string
  variant?: 'default' | 'minimal' | 'dots'
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
        <ProfessionalLoader size="lg" text={text} variant={variant} />
      </div>
    </div>
  )
}
