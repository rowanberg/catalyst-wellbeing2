'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Building2, Copy, Check, ArrowRight, Award, Star, Shield, TrendingUp, Sparkle, Mail, AlertCircle } from 'lucide-react'
import confetti from 'canvas-confetti'

interface SchoolRevealProProps {
  schoolName: string
  schoolId: string
  location?: string
  onDashboard: () => void
  onInviteTeachers: () => void
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

export default function SchoolRevealPro({
  schoolName,
  schoolId,
  location = 'Global',
  onDashboard,
  onInviteTeachers
}: SchoolRevealProProps) {
  const [stage, setStage] = useState(0)
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState(0)
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>()

  // Canvas particle system
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
      for (let i = 0; i < 50; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: Math.random() * 100,
          maxLife: 100,
          size: Math.random() * 3 + 1,
          hue: Math.random() * 60 + 200 // Blue to purple range
        })
      }
    }
    initParticles()

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle, index) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life--

        if (particle.life <= 0) {
          particlesRef.current[index] = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            life: particle.maxLife,
            maxLife: particle.maxLife,
            size: Math.random() * 3 + 1,
            hue: Math.random() * 60 + 200
          }
        }

        const opacity = particle.life / particle.maxLife
        ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${opacity * 0.6})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Draw connections
        particlesRef.current.forEach((other, otherIndex) => {
          if (otherIndex <= index) return
          const dx = particle.x - other.x
          const dy = particle.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 150) {
            ctx.strokeStyle = `hsla(${particle.hue}, 70%, 60%, ${(1 - dist / 150) * 0.2})`
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [prefersReducedMotion])

  // Animation stages with smooth progress - Extended to 10+ seconds for premium feel
  useEffect(() => {
    const runAnimation = async () => {
      // Stage 1: Initial load with slower progress (3s)
      await new Promise(resolve => setTimeout(resolve, 500))
      setStage(1)
      
      // Slower progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 1 // Slower increment (was 2)
        })
      }, 25) // Slower interval for smoother animation
      
      // Stage 2: Icon sequence - Let each icon breathe (3s)
      await new Promise(resolve => setTimeout(resolve, 3000))
      setStage(2)
      
      // Stage 3: Welcome reveal - Hold longer (2s)
      await new Promise(resolve => setTimeout(resolve, 2500))
      setStage(3)
      
      // Stage 4: Details card - Let user read (1.5s)
      await new Promise(resolve => setTimeout(resolve, 1800))
      setStage(4)
      
      // Stage 5: Actions - Final breathe (1s)
      await new Promise(resolve => setTimeout(resolve, 1200))
      setStage(5)
      
      // Trigger confetti
      if (!prefersReducedMotion) {
        triggerEnterpriseConfetti()
      }
    }
    
    runAnimation()
  }, [prefersReducedMotion])

  const triggerEnterpriseConfetti = () => {
    const duration = 3500 // Extended confetti duration
    const animationEnd = Date.now() + duration

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe']
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe']
      })
    }, 180) // Slightly slower burst rate
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(schoolId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const iconVariants = [
    { icon: Shield, label: 'Secure', color: 'from-blue-400 to-cyan-400', delay: 0 },
    { icon: TrendingUp, label: 'Growth', color: 'from-purple-400 to-pink-400', delay: 0.4 },
    { icon: Award, label: 'Excellence', color: 'from-amber-400 to-orange-400', delay: 0.8 },
    { icon: Sparkle, label: 'Innovation', color: 'from-emerald-400 to-teal-400', delay: 1.2 }
  ]

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    >
      {/* Canvas background */}
      {!prefersReducedMotion && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 opacity-40"
          style={{ mixBlendMode: 'screen' }}
        />
      )}

      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #667eea 0%, transparent 70%)' }}
          animate={{
            x: ['-10%', '110%'],
            y: ['10%', '90%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #764ba2 0%, transparent 70%)' }}
          animate={{
            x: ['110%', '-10%'],
            y: ['90%', '10%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {/* Stage 1: Loading with progress */}
          {stage >= 0 && stage < 2 && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-md w-full"
            >
              {/* Hexagon logo animation */}
              <motion.div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                  <motion.polygon
                    points="50 5, 90 27.5, 90 72.5, 50 95, 10 72.5, 10 27.5"
                    fill="none"
                    stroke="url(#hexGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0, rotate: 0 }}
                    animate={{ 
                      pathLength: [0, 1, 1],
                      rotate: 360,
                    }}
                    transition={{
                      pathLength: { duration: 2, ease: "easeInOut" },
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" }
                    }}
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="15"
                    fill="url(#hexGradient)"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  />
                </svg>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 px-2"
              >
                Initializing Your Platform
              </motion.h2>

              {/* Progress bar */}
              <div className="w-full bg-slate-800/50 rounded-full h-1.5 sm:h-2 mb-2 sm:mb-3 overflow-hidden backdrop-blur-xl">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-400 text-xs sm:text-sm px-2"
              >
                Setting up your secure environment...
              </motion.p>
            </motion.div>
          )}

          {/* Stage 2: Icon sequence animation */}
          {stage >= 2 && stage < 3 && (
            <motion.div
              key="icons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex gap-4 sm:gap-8 md:gap-12 items-center justify-center px-4"
            >
              {iconVariants.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, rotate: -180 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    rotate: 0,
                  }}
                  transition={{
                    delay: item.delay,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 200
                  }}
                  className="relative group flex-shrink-0"
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-2xl`}>
                    <item.icon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: item.delay + 0.3 }}
                    className="text-slate-300 text-[10px] sm:text-xs md:text-sm mt-2 sm:mt-3 text-center font-medium"
                  >
                    {item.label}
                  </motion.p>
                  
                  {/* Connecting line */}
                  {index < iconVariants.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: item.delay + 0.4, duration: 0.4 }}
                      className="absolute top-6 sm:top-8 md:top-10 left-full w-4 sm:w-8 md:w-12 h-0.5 bg-gradient-to-r from-slate-600 to-transparent origin-left hidden sm:block"
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Stage 3: Welcome reveal */}
          {stage >= 3 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="text-center mb-6 sm:mb-8 md:mb-12 px-4"
            >
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mb-4 sm:mb-6 relative"
                animate={{
                  rotateY: [0, 360],
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut"
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl blur-xl opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
                  <Building2 className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
                </div>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight"
              >
                Welcome Aboard
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg sm:text-xl md:text-2xl text-slate-300 font-light"
              >
                Your institution is ready
              </motion.p>
            </motion.div>
          )}

          {/* Stage 4: School details card */}
          {stage >= 4 && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-xl mx-auto mb-6 sm:mb-8 px-4"
            >
              <div className="relative group">
                {/* Animated border */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-tilt" />
                
                <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 border border-slate-800 shadow-2xl">
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-30"
                    style={{
                      background: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                      backgroundSize: '200% 100%'
                    }}
                    animate={{
                      backgroundPosition: ['200% 0', '-200% 0']
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
                        Institution ID
                      </h3>
                      <div className="flex gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4 md:space-y-5">
                      <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50">
                        <p className="text-[10px] sm:text-xs text-slate-400 mb-1.5 sm:mb-2 uppercase tracking-wider">Institution Name</p>
                        <p className="text-sm sm:text-base md:text-lg font-bold text-white break-words">{schoolName}</p>
                      </div>
                      
                      <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50">
                        <p className="text-[10px] sm:text-xs text-slate-400 mb-1.5 sm:mb-2 uppercase tracking-wider">Access Code</p>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <code className="text-base sm:text-lg md:text-xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-wider break-all flex-1">
                            {schoolId}
                          </code>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={copyToClipboard}
                            className="p-2 sm:p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 active:bg-slate-600/70 transition-colors border border-slate-600 flex-shrink-0 touch-manipulation"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-300" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50">
                        <p className="text-[10px] sm:text-xs text-slate-400 mb-1.5 sm:mb-2 uppercase tracking-wider">Location</p>
                        <p className="text-sm sm:text-base md:text-lg font-semibold text-slate-200 break-words">{location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stage 5: Email Verification Notice */}
          {stage >= 5 && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-xl mx-auto px-4"
            >
              {/* Verification Card */}
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
                    <p className="text-slate-300 text-sm sm:text-base max-w-md">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        @keyframes tilt {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(1deg); }
          75% { transform: rotate(-1deg); }
        }
        .animate-tilt {
          animation: tilt 10s infinite linear;
        }
      `}</style>
    </div>
  )
}
