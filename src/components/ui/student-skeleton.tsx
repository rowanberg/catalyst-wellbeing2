'use client'

import { motion } from 'framer-motion'

interface StudentSkeletonProps {
  count?: number
  viewMode?: 'grid' | 'list'
}

export function StudentSkeleton({ count = 6, viewMode = 'grid' }: StudentSkeletonProps) {
  return (
    <div className={`grid gap-4 sm:gap-6 ${
      viewMode === 'grid' 
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4' 
        : 'grid-cols-1'
    }`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="border border-gray-200/50 bg-white/95 backdrop-blur-sm shadow-md rounded-lg overflow-hidden"
        >
          {/* Mobile Skeleton */}
          <div className="sm:hidden">
            <div className="bg-gradient-to-r from-gray-300 to-gray-400 p-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/30 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-white/30 rounded w-24 mb-1 animate-pulse"></div>
                    <div className="h-2 bg-white/20 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
                <div className="w-6 h-6 bg-white/30 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="p-3">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="h-4 bg-gray-200 rounded w-8 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-6 animate-pulse"></div>
                </div>
                <div className="text-center">
                  <div className="h-4 bg-gray-200 rounded w-8 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
                </div>
                <div className="text-center">
                  <div className="h-4 bg-gray-200 rounded w-8 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-10 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Skeleton */}
          <div className="hidden sm:block">
            <div className="bg-gradient-to-r from-gray-300 to-gray-400 p-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/30 rounded-2xl animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/30 rounded w-32 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-white/20 rounded w-40 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-white/20 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-8 h-8 bg-white/30 rounded-full mb-2 animate-pulse"></div>
                  <div className="h-3 bg-white/20 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-8 mx-auto mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

interface ModernLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function ModernLoadingSpinner({ size = 'md', text }: ModernLoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className={`${sizeClasses[size]} border-4 border-blue-200 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner spinning dot */}
        <motion.div
          className={`absolute top-0 left-0 ${sizeClasses[size]} border-4 border-transparent border-t-blue-600 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <motion.div
            className="w-2 h-2 bg-blue-600 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </div>
      
      {text && (
        <motion.p
          className="mt-4 text-sm text-gray-600 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}
