'use client'

import { motion } from 'framer-motion'
import { UserCheck, Users, Calendar, BarChart3, GraduationCap } from 'lucide-react'

interface AttendanceLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  variant?: 'default' | 'minimal' | 'detailed'
}

export function AttendanceLoader({ 
  size = 'md', 
  text = 'Loading attendance...', 
  variant = 'default' 
}: AttendanceLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center space-x-3">
        <motion.div
          className={`${sizeClasses[size]} relative`}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
          <div className="absolute inset-2 flex items-center justify-center">
            <UserCheck className={`${iconSizes[size]} text-blue-600`} />
          </div>
        </motion.div>
        {text && <span className="text-sm text-gray-600">{text}</span>}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-8">
        {/* Main Logo Animation */}
        <div className="relative">
          {/* Outer Ring */}
          <motion.div
            className="w-24 h-24 rounded-full border-4 border-blue-200"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Inner Ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-4 border-emerald-200"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </motion.div>
          </div>
        </div>

        {/* Floating Icons */}
        <div className="relative w-32 h-16">
          <motion.div
            className="absolute top-0 left-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
            animate={{ 
              y: [0, -10, 0],
              x: [0, 10, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 0 }}
          >
            <Users className="w-4 h-4 text-blue-600" />
          </motion.div>
          
          <motion.div
            className="absolute top-0 right-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center"
            animate={{ 
              y: [0, -10, 0],
              x: [0, -10, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </motion.div>
          
          <motion.div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center"
            animate={{ 
              y: [0, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          >
            <Calendar className="w-4 h-4 text-purple-600" />
          </motion.div>
          
          <motion.div
            className="absolute bottom-0 right-1/4 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center"
            animate={{ 
              y: [0, 10, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
          >
            <BarChart3 className="w-4 h-4 text-orange-600" />
          </motion.div>
        </div>

        {/* Text and Progress */}
        <div className="text-center space-y-3">
          <motion.h3 
            className="text-lg font-semibold text-gray-800"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {text}
          </motion.h3>
          
          <div className="flex items-center justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.2 
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Modern Logo Design */}
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className={`${sizeClasses[size]} rounded-full border-4 border-blue-200`}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner counter-rotating ring */}
        <motion.div
          className={`absolute inset-1 rounded-full border-4 border-emerald-200`}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Center icon with pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full p-2 shadow-lg"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <UserCheck className={`${iconSizes[size]} text-white`} />
          </motion.div>
        </div>
        
        {/* Pulsing glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 opacity-20`}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {/* Text with typing animation */}
      {text && (
        <div className="text-center">
          <motion.p 
            className="text-sm font-medium text-gray-700"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {text}
          </motion.p>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center space-x-1 mt-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                animate={{ 
                  y: [0, -4, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  delay: i * 0.15 
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Full page loader for initial page load
export function AttendancePageLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-blue-300/10 rounded-full blur-xl"
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-24 h-24 bg-emerald-300/10 rounded-full blur-xl"
          animate={{ 
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Main Loader */}
      <motion.div
        className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AttendanceLoader 
          size="lg" 
          text="Loading Teacher Attendance System" 
          variant="detailed" 
        />
      </motion.div>
    </div>
  )
}
