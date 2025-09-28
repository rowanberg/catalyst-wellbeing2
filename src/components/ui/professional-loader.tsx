'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { GraduationCap, School, BookOpen } from 'lucide-react'

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
    sm: { spinner: 'w-6 h-6', text: 'text-sm', icon: 'w-3 h-3' },
    md: { spinner: 'w-8 h-8', text: 'text-base', icon: 'w-4 h-4' },
    lg: { spinner: 'w-12 h-12', text: 'text-lg', icon: 'w-6 h-6' }
  }

  const currentSize = sizeClasses[size]

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center justify-center gap-3', className)}>
        <div className="relative">
          <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', currentSize.spinner)} />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className={cn('text-blue-600', currentSize.icon)} />
          </div>
        </div>
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
        {/* Logo with bouncing dots */}
        <div className="flex flex-col items-center gap-3">
          <motion.div
            className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full p-2 shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <GraduationCap className={cn('text-white', currentSize.icon)} />
          </motion.div>
          
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
        
        {/* Inner pulse background */}
        <motion.div
          className={cn('absolute inset-2 bg-blue-100 rounded-full', currentSize.spinner)}
          animate={{ scale: [0.8, 1, 0.8], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Center Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full p-1.5 shadow-lg"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <School className={cn('text-white', currentSize.icon)} />
          </motion.div>
        </div>
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
