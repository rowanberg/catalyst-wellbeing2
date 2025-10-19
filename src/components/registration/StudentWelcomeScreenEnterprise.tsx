'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { BookOpen, Star, GraduationCap, Rocket, Award, Sparkles, ArrowRight, Shield, Zap, Brain, Mail, AlertCircle } from 'lucide-react'
import confetti from 'canvas-confetti'

interface StudentWelcomeScreenProps {
  studentName: string
  schoolName: string
  grade?: string
  className?: string
  onDashboard: () => void
  onExploreClassrooms: () => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
}

// Custom Enterprise SVG Hexagon Logo
const HexagonLogo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <motion.path
      d="M50 10 L80 30 L80 70 L50 90 L20 70 L20 30 Z"
      fill="none"
      stroke="url(#hexGrad)"
      strokeWidth="3"
      filter="url(#glow)"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 2, ease: "easeInOut" }}
    />
    <motion.circle
      cx="50"
      cy="50"
      r="15"
      fill="url(#hexGrad)"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, duration: 0.5, type: "spring" }}
    />
    <motion.path
      d="M50 35 L50 50 L60 50"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 1.5, duration: 0.8 }}
    />
  </svg>
)

export default function StudentWelcomeScreenEnterprise({
  studentName,
  schoolName,
  grade = '10',
  className = 'A',
  onDashboard,
  onExploreClassrooms
}: StudentWelcomeScreenProps) {
  const [stage, setStage] = useState(0)
  const [nameRevealed, setNameRevealed] = useState('')
  const [progress, setProgress] = useState(0)
  const prefersReducedMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>()
  const typewriterCompleted = useRef(false)

  // Advanced particle system with connections (like SchoolRevealPro)
  useEffect(() => {
    if (prefersReducedMotion || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = []
      const particleCount = window.innerWidth < 768 ? 30 : 50
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: Math.random() * 100,
          maxLife: 100,
          size: Math.random() * 2.5 + 1,
          hue: Math.random() * 60 + 200 // Blue to purple
        })
      }
    }
    initParticles()

    const animate = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle, index) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life--

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        if (particle.life <= 0) {
          particlesRef.current[index] = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            life: particle.maxLife,
            maxLife: particle.maxLife,
            size: Math.random() * 2.5 + 1,
            hue: Math.random() * 60 + 200
          }
        }

        const opacity = particle.life / particle.maxLife
        ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${opacity * 0.6})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Draw connections between nearby particles
        particlesRef.current.forEach((other, otherIndex) => {
          if (otherIndex <= index) return
          const dx = particle.x - other.x
          const dy = particle.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 120) {
            ctx.strokeStyle = `hsla(${particle.hue}, 70%, 60%, ${(1 - dist / 120) * 0.15})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(other.x, other.y)
            ctx.stroke()
          }
        })
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [prefersReducedMotion])

  // Typewriter effect
  useEffect(() => {
    if (stage >= 2 && !typewriterCompleted.current) {
      let index = 0
      const interval = setInterval(() => {
        if (index <= studentName.length) {
          setNameRevealed(studentName.slice(0, index))
          index++
        } else {
          clearInterval(interval)
          typewriterCompleted.current = true
        }
      }, 60)
      return () => clearInterval(interval)
    }
    return undefined
  }, [stage, studentName])

  // Animation sequence
  useEffect(() => {
    const sequence = async () => {
      // Stage 1: Loading (2.5s)
      await new Promise(resolve => setTimeout(resolve, 300))
      setStage(1)
      
      // Progress bar animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 1
        })
      }, 22)

      await new Promise(resolve => setTimeout(resolve, 2500))
      setStage(2) // Name reveal
      
      await new Promise(resolve => setTimeout(resolve, 2500))
      setStage(3) // Celebration
      
      if (!prefersReducedMotion) {
        triggerCelebration()
      }

      await new Promise(resolve => setTimeout(resolve, 1800))
      setStage(4) // School card

      await new Promise(resolve => setTimeout(resolve, 1500))
      setStage(5) // CTAs
    }
    sequence()
  }, [prefersReducedMotion])

  const triggerCelebration = () => {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe']
    
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.5 },
      colors,
      gravity: 0.8,
      ticks: 350,
      scalar: 0.9
    })

    setTimeout(() => {
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors
      })
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors
      })
    }, 500)
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Canvas particle background */}
      {!prefersReducedMotion && (
        <canvas ref={canvasRef} className="absolute inset-0 opacity-80" />
      )}

      {/* Gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8 sm:py-12">
        <div className="w-full max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Stage 1: Loading */}
            {stage >= 1 && stage < 2 && (
              <motion.div
                key="init"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="text-center"
              >
                {/* Hexagon logo */}
                <motion.div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-8">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-600/30 rounded-full blur-2xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="relative w-full h-full">
                    <HexagonLogo />
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-base sm:text-lg text-slate-300 font-medium mb-6"
                >
                  Initializing your learning environment...
                </motion.p>

                {/* Progress bar */}
                <div className="max-w-md mx-auto">
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                      style={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <motion.p
                    className="text-xs text-slate-500 mt-2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {progress}% Complete
                  </motion.p>
                </div>
              </motion.div>
            )}

            {/* Stage 2+: Name Reveal */}
            {stage >= 2 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8 sm:mb-12"
              >
                {/* Glowing icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="inline-block mb-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-60 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 p-4 sm:p-5 rounded-2xl shadow-2xl border border-blue-500/20">
                      <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                  </div>
                </motion.div>

                {/* Name with typewriter */}
                <motion.h1 
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight px-4 mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="text-slate-200">Welcome, </span>
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {nameRevealed}
                    {!typewriterCompleted.current && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                      >
                        |
                      </motion.span>
                    )}
                  </span>
                  {typewriterCompleted.current && <span className="text-slate-200">!</span>}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-slate-400 text-sm sm:text-base mt-2"
                >
                  Get ready to unlock your full potential
                </motion.p>
              </motion.div>
            )}

            {/* Stage 4: School Card */}
            {stage >= 4 && (
              <motion.div
                key="school"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8 px-4"
              >
                <div className="relative group max-w-2xl mx-auto">
                  {/* Animated gradient border */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-30 blur group-hover:opacity-50 transition duration-1000" />
                  
                  {/* Glassmorphism card */}
                  <motion.div 
                    className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-700/50 shadow-2xl"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-20"
                      style={{
                        background: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                        backgroundSize: '200% 200%'
                      }}
                      animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />

                    <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      {/* School icon */}
                      <motion.div
                        className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-xl border border-blue-500/20"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                      >
                        <svg className="w-12 h-12 sm:w-14 sm:h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                      </motion.div>

                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">{schoolName}</h3>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
                          <motion.span 
                            className="px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-700/20 border border-blue-500/30 text-blue-300 rounded-xl text-sm sm:text-base font-semibold backdrop-blur-sm"
                            whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                          >
                            Grade {grade}
                          </motion.span>
                          <motion.span 
                            className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-700/20 border border-purple-500/30 text-purple-300 rounded-xl text-sm sm:text-base font-semibold backdrop-blur-sm"
                            whileHover={{ scale: 1.05, borderColor: 'rgba(168, 85, 247, 0.5)' }}
                          >
                            Section {className}
                          </motion.span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Stage 5: Email Verification Notice */}
            {stage >= 5 && (
              <motion.div
                key="verification"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center px-4"
              >
                <div className="max-w-2xl mx-auto">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl p-6 sm:p-8 border border-slate-700/50 shadow-2xl">
                    <div className="flex flex-col items-center text-center space-y-4">
                      {/* Email Icon */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 animate-pulse" />
                        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-4 shadow-xl">
                          <Mail className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      
                      {/* Verification Text */}
                      <div className="space-y-2">
                        <h3 className="text-xl sm:text-2xl font-bold text-white">
                          Verify Your Email
                        </h3>
                        <p className="text-slate-300 text-sm sm:text-base">
                          We've sent a verification email to your registered address. 
                          Please check your inbox and click the verification link.
                        </p>
                      </div>
                      
                      {/* Important Notice */}
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 w-full">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="text-left">
                            <p className="text-amber-300 text-xs sm:text-sm font-medium">
                              Important: Email verification required
                            </p>
                            <p className="text-amber-200/70 text-xs mt-1">
                              You must verify your email before you can sign in to your account.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Sign In Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.location.href = '/login'}
                        className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white font-bold shadow-2xl transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Go to Sign In
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </motion.button>
                      
                      {/* Help Text */}
                      <p className="text-slate-400 text-xs mt-4">
                        Didn't receive the email? Check your spam folder or contact support.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
