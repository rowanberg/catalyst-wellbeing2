'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion'
import { Check, X, AlertCircle, Info, Loader2, Sparkles, Heart, Star } from 'lucide-react'

// Floating particles animation
export const FloatingParticles: React.FC<{
  count?: number
  colors?: string[]
  size?: number
  speed?: number
}> = ({ count = 20, colors = ['#3B82F6', '#8B5CF6', '#06B6D4'], size = 4, speed = 0.5 }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 2
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full opacity-60"
          style={{
            width: size,
            height: size,
            backgroundColor: particle.color,
            left: `${particle.x}%`,
            top: `${particle.y}%`
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, -10, 0],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Ripple effect for button clicks
export const RippleEffect: React.FC<{
  children: React.ReactNode
  className?: string
  disabled?: boolean
}> = ({ children, className = '', disabled = false }) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  const createRipple = (event: React.MouseEvent) => {
    if (disabled) return

    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const newRipple = {
      id: Date.now(),
      x,
      y
    }

    setRipples(prev => [...prev, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)
  }

  return (
    <button
      ref={buttonRef}
      className={`relative overflow-hidden ${className}`}
      onMouseDown={createRipple}
      disabled={disabled}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0
          }}
          animate={{
            width: 300,
            height: 300,
            opacity: [0.5, 0]
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut"
          }}
        />
      ))}
    </button>
  )
}

// Magnetic button effect
export const MagneticButton: React.FC<{
  children: React.ReactNode
  className?: string
  strength?: number
}> = ({ children, className = '', strength = 0.3 }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = (e.clientX - centerX) * strength
    const deltaY = (e.clientY - centerY) * strength

    setPosition({ x: deltaX, y: deltaY })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.div
      ref={buttonRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={position}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}

// Morphing loader
export const MorphingLoader: React.FC<{
  size?: number
  color?: string
}> = ({ size = 40, color = '#3B82F6' }) => {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        style={{
          width: size,
          height: size,
          borderTopColor: color,
          borderRightColor: `${color}80`
        }}
        animate={{
          borderRadius: ["50%", "25%", "50%", "25%", "50%"],
          rotate: [0, 90, 180, 270, 360]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="border-4 border-transparent"
      />
    </div>
  )
}

// Staggered list animation
export const StaggeredList: React.FC<{
  children: React.ReactNode[]
  staggerDelay?: number
  className?: string
}> = ({ children, staggerDelay = 0.1, className = '' }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{
            duration: 0.5,
            delay: index * staggerDelay,
            ease: "easeOut"
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}

// Toast notification system
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

const toastIcons = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info
}

const toastColors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-orange-500',
  info: 'bg-blue-500'
}

export const ToastContainer: React.FC<{
  toasts: Toast[]
  onRemove: (id: string) => void
}> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type]
          const colorClass = toastColors[toast.type]

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`${colorClass} text-white p-4 rounded-lg shadow-lg max-w-sm flex items-start gap-3`}
            >
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium">{toast.title}</h4>
                {toast.message && (
                  <p className="text-sm opacity-90 mt-1">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => onRemove(toast.id)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// Skeleton loader with shimmer effect
export const SkeletonLoader: React.FC<{
  className?: string
  lines?: number
  avatar?: boolean
}> = ({ className = '', lines = 3, avatar = false }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {avatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full bg-gray-300 dark:bg-gray-700 h-12 w-12"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-300 dark:bg-gray-700 rounded"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          ></div>
        ))}
      </div>
    </div>
  )
}

// Progress bar with animation
export const AnimatedProgressBar: React.FC<{
  progress: number
  className?: string
  color?: string
  showLabel?: boolean
}> = ({ progress, className = '', color = 'bg-blue-500', showLabel = false }) => {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress)
    }, 100)

    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{Math.round(displayProgress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

// Floating action button with micro-interactions
export const FloatingActionButton: React.FC<{
  onClick: () => void
  icon: React.ReactNode
  className?: string
  tooltip?: string
}> = ({ onClick, icon, className = '', tooltip }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative">
      <motion.button
        onClick={onClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors ${className}`}
      >
        <motion.div
          animate={{ rotate: isHovered ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isHovered && tooltip && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="fixed bottom-6 right-20 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Confetti explosion
export const ConfettiExplosion: React.FC<{
  trigger: boolean
  onComplete?: () => void
}> = ({ trigger, onComplete }) => {
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    y: number
    color: string
    rotation: number
    scale: number
  }>>([])

  useEffect(() => {
    if (trigger) {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5
      }))

      setParticles(newParticles)

      setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, 3000)
    }
  }, [trigger, onComplete])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: particle.color,
            left: particle.x,
            top: particle.y
          }}
          animate={{
            y: -window.innerHeight - 100,
            x: particle.x + (Math.random() - 0.5) * 200,
            rotate: particle.rotation + 720,
            scale: [particle.scale, particle.scale * 0.5, 0]
          }}
          transition={{
            duration: 3,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  )
}

// Pulse effect for notifications
export const PulseNotification: React.FC<{
  children: React.ReactNode
  active: boolean
  color?: string
}> = ({ children, active, color = 'bg-red-500' }) => {
  return (
    <div className="relative">
      {children}
      {active && (
        <motion.div
          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${color}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  )
}

const MicroInteractions = {
  FloatingParticles,
  RippleEffect,
  MagneticButton,
  MorphingLoader,
  StaggeredList,
  ToastContainer,
  SkeletonLoader,
  AnimatedProgressBar,
  FloatingActionButton,
  ConfettiExplosion,
  PulseNotification
}

export default MicroInteractions
