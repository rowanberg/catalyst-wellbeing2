'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import dynamic from 'next/dynamic'
import confetti from 'canvas-confetti'
import { 
  BookOpen,
  Sparkles,
  GraduationCap,
  Rocket,
  Star,
  ChevronRight,
  School,
  Compass
} from 'lucide-react'

// Lazy load Lottie
const Lottie = dynamic(() => import('lottie-react'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50" />
})

interface StudentWelcomeScreenProps {
  studentName: string
  schoolName: string
  grade?: string
  className?: string
  schoolLogo?: string
  onDashboard: () => void
  onExploreClassrooms: () => void
}

interface FloatingParticle {
  id: number
  x: number
  y: number
  icon: any
  duration: number
  delay: number
}

export default function StudentWelcomeScreen({
  studentName,
  schoolName,
  grade = '10th',
  className = 'A',
  schoolLogo,
  onDashboard,
  onExploreClassrooms
}: StudentWelcomeScreenProps) {
  const [stage, setStage] = useState(0)
  const [nameRevealed, setNameRevealed] = useState('')
  const [particles, setParticles] = useState<FloatingParticle[]>([])
  const prefersReducedMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  // Animated background with moving gradient spheres
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

    const spheres = [
      { x: 0.2, y: 0.3, radius: 150, hue: 220, speed: 0.0005 },
      { x: 0.8, y: 0.7, radius: 200, hue: 280, speed: 0.0003 },
      { x: 0.5, y: 0.9, radius: 120, hue: 180, speed: 0.0007 }
    ]

    let time = 0
    const animate = () => {
      ctx.fillStyle = 'rgba(248, 250, 252, 0.4)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      spheres.forEach(sphere => {
        const x = (Math.sin(time * sphere.speed) * 0.1 + sphere.x) * canvas.width
        const y = (Math.cos(time * sphere.speed * 0.7) * 0.1 + sphere.y) * canvas.height

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, sphere.radius)
        gradient.addColorStop(0, `hsla(${sphere.hue}, 70%, 60%, 0.15)`)
        gradient.addColorStop(0.5, `hsla(${sphere.hue}, 70%, 60%, 0.08)`)
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      })

      time++
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

  // Typewriter effect for name reveal - runs only once
  useEffect(() => {
    if (stage >= 2 && nameRevealed !== studentName) {
      let index = 0
      const interval = setInterval(() => {
        if (index <= studentName.length) {
          setNameRevealed(studentName.slice(0, index))
          index++
        } else {
          clearInterval(interval)
        }
      }, 80)
      return () => clearInterval(interval)
    }
    return undefined
  }, [stage])

  // Generate floating particles
  useEffect(() => {
    if (stage >= 3 && !prefersReducedMotion) {
      const icons = [BookOpen, Sparkles, Star, GraduationCap, Rocket]
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: 100 + Math.random() * 20,
        icon: icons[Math.floor(Math.random() * icons.length)],
        duration: 8 + Math.random() * 4,
        delay: Math.random() * 2
      }))
      setParticles(newParticles)
    }
  }, [stage, prefersReducedMotion])

  // Orchestrated animation sequence
  useEffect(() => {
    const sequence = async () => {
      // Stage 1: Initialization Glow (2s)
      await new Promise(resolve => setTimeout(resolve, 500))
      setStage(1)

      // Stage 2: Name Reveal (3s)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setStage(2)

      // Stage 3: Visual Celebration (2s)
      await new Promise(resolve => setTimeout(resolve, 3000))
      setStage(3)
      
      if (!prefersReducedMotion) {
        triggerCelebration()
      }

      // Stage 4: School Identity (2s)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setStage(4)

      // Stage 5: Next Steps (1s)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setStage(5)
    }

    sequence()
  }, [prefersReducedMotion])

  const triggerCelebration = () => {
    const colors = ['#4A7CFF', '#A86EFF', '#6DF2B0', '#FFD700']
    
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.4 },
      colors,
      gravity: 0.8,
      ticks: 300,
      shapes: ['circle', 'square'],
      scalar: 0.8
    })

    // Delayed second burst
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
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated background canvas */}
      {!prefersReducedMotion && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 opacity-60"
        />
      )}

      {/* Floating particles */}
      <AnimatePresence>
        {stage >= 3 && !prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((particle) => {
              const Icon = particle.icon
              return (
                <motion.div
                  key={particle.id}
                  className="absolute"
                  initial={{ 
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                    opacity: 0,
                    scale: 0
                  }}
                  animate={{ 
                    top: '-10%',
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1, 1, 0.8],
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: particle.duration,
                    delay: particle.delay,
                    ease: 'easeOut'
                  }}
                >
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400/40" />
                </motion.div>
              )
            })}
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Stage 1: Initialization Glow */}
            {stage >= 1 && stage < 2 && (
              <motion.div
                key="init"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                {/* Animated orb */}
                <motion.div className="relative w-32 h-32 mx-auto mb-8">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 blur-2xl opacity-50"
                    animate={{
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.div
                    className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl"
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Sparkles className="w-12 h-12 text-white" />
                  </motion.div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg sm:text-xl text-slate-600 font-medium"
                >
                  Preparing your learning space...
                </motion.p>
              </motion.div>
            )}

            {/* Stage 2: Personal Reveal */}
            {stage >= 2 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  className="inline-block mb-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-50 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 text-white p-3 sm:p-4 rounded-2xl shadow-2xl">
                      <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12" />
                    </div>
                  </div>
                </motion.div>

                <motion.h1 
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="text-slate-700">Welcome, </span>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {nameRevealed}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                    >
                      |
                    </motion.span>
                  </span>
                  <span className="text-slate-700">!</span>
                </motion.h1>
              </motion.div>
            )}

            {/* Stage 4: School Identity Card */}
            {stage >= 4 && (
              <motion.div
                key="school"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <div className="relative group">
                  {/* Shimmer effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-30 blur group-hover:opacity-50 transition duration-1000" />
                  
                  <motion.div 
                    className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/50 shadow-2xl"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {/* Shimmer overlay */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.7) 50%, transparent 60%)',
                        backgroundSize: '200% 200%'
                      }}
                      animate={{
                        backgroundPosition: ['200% 0%', '-200% 0%']
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />

                    <div className="flex items-center gap-4 sm:gap-6">
                      {schoolLogo ? (
                        <img src={schoolLogo} alt={schoolName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover" />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                          <School className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{schoolName}</h3>
                        <div className="flex flex-wrap gap-2 sm:gap-3 mt-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            Grade {grade}
                          </span>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            Class {className}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Stage 5: Motivational Message & CTAs */}
            {stage >= 5 && (
              <motion.div
                key="cta"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <motion.p 
                  className="text-lg sm:text-xl text-slate-600 mb-8 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Your journey to growth begins here.
                </motion.p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onDashboard}
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center justify-center gap-2">
                      <Rocket className="w-5 h-5" />
                      Go to Dashboard
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onExploreClassrooms}
                    className="group relative px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl hover:border-purple-400 transition-all duration-300"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Compass className="w-5 h-5" />
                      Explore Classrooms
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  )
}
