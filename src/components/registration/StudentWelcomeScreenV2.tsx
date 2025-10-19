'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { ChevronRight } from 'lucide-react'

interface StudentWelcomeScreenProps {
  studentName: string
  schoolName: string
  grade?: string
  className?: string
  onDashboard: () => void
  onExploreClassrooms: () => void
}

// Custom SVG Icons - Unique enterprise designs
const CustomIcons = {
  Knowledge: () => (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      <path d="M32 8L8 20L32 32L56 20L32 8Z" fill="url(#grad1)" opacity="0.8"/>
      <path d="M8 28V44L32 56L56 44V28" stroke="url(#grad2)" strokeWidth="2.5" fill="none"/>
      <circle cx="32" cy="32" r="4" fill="#fff" opacity="0.9"/>
      <defs>
        <linearGradient id="grad1" x1="8" y1="8" x2="56" y2="32">
          <stop offset="0%" stopColor="#6366F1"/>
          <stop offset="100%" stopColor="#8B5CF6"/>
        </linearGradient>
        <linearGradient id="grad2" x1="8" y1="28" x2="56" y2="56">
          <stop offset="0%" stopColor="#A78BFA"/>
          <stop offset="100%" stopColor="#C4B5FD"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  Growth: () => (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      <path d="M12 52L22 36L32 42L42 26L52 32" stroke="url(#growthGrad)" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="52" cy="32" r="5" fill="#10B981"/>
      <path d="M48 12L56 12L56 20" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
      <defs>
        <linearGradient id="growthGrad" x1="12" y1="52" x2="52" y2="32">
          <stop offset="0%" stopColor="#34D399"/>
          <stop offset="100%" stopColor="#10B981"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  Innovation: () => (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      <circle cx="32" cy="28" r="12" fill="url(#innovGrad)"/>
      <path d="M26 40L26 50M38 40L38 50M28 50L36 50" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 28L16 24M44 28L48 24M32 16L32 12" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="innovGrad" x1="20" y1="16" x2="44" y2="40">
          <stop offset="0%" stopColor="#FCD34D"/>
          <stop offset="100%" stopColor="#F59E0B"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  Achievement: () => (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      <path d="M32 8L36 24L52 24L40 34L44 50L32 40L20 50L24 34L12 24L28 24L32 8Z" fill="url(#achieveGrad)"/>
      <circle cx="32" cy="30" r="8" fill="#FBBF24" opacity="0.6"/>
      <defs>
        <linearGradient id="achieveGrad" x1="12" y1="8" x2="52" y2="50">
          <stop offset="0%" stopColor="#FCD34D"/>
          <stop offset="100%" stopColor="#F59E0B"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  Progress: () => (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      <circle cx="32" cy="32" r="20" stroke="#E0E7FF" strokeWidth="4"/>
      <circle cx="32" cy="32" r="20" stroke="url(#progGrad)" strokeWidth="4" strokeLinecap="round" strokeDasharray="125" strokeDashoffset="30"/>
      <path d="M32 20L32 32L40 40" stroke="#6366F1" strokeWidth="3" strokeLinecap="round"/>
      <defs>
        <linearGradient id="progGrad" x1="12" y1="12" x2="52" y2="52">
          <stop offset="0%" stopColor="#818CF8"/>
          <stop offset="100%" stopColor="#6366F1"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function StudentWelcomeScreen({
  studentName,
  schoolName,
  grade = '10',
  className = 'A',
  onDashboard,
  onExploreClassrooms
}: StudentWelcomeScreenProps) {
  const [stage, setStage] = useState(0)
  const [nameRevealed, setNameRevealed] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const prefersReducedMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const typewriterCompleted = useRef(false)

  // Animated gradient background
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
      { x: 0.2, y: 0.3, radius: 200, hue: 220, speed: 0.0004 },
      { x: 0.8, y: 0.7, radius: 250, hue: 270, speed: 0.0003 }
    ]

    let time = 0
    const animate = () => {
      ctx.fillStyle = 'rgba(248, 250, 252, 0.5)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      spheres.forEach(sphere => {
        const x = (Math.sin(time * sphere.speed) * 0.15 + sphere.x) * canvas.width
        const y = (Math.cos(time * sphere.speed * 0.8) * 0.15 + sphere.y) * canvas.height

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, sphere.radius)
        gradient.addColorStop(0, `hsla(${sphere.hue}, 75%, 65%, 0.12)`)
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
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [prefersReducedMotion])

  // Typewriter effect - runs only once
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
          setCursorVisible(false)
        }
      }, 70)
      return () => clearInterval(interval)
    }
    return undefined
  }, [stage, studentName])

  // Animation sequence
  useEffect(() => {
    const sequence = async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
      setStage(1) // Init
      await new Promise(resolve => setTimeout(resolve, 2000))
      setStage(2) // Name reveal
      await new Promise(resolve => setTimeout(resolve, 2500))
      setStage(3) // Celebration
      if (!prefersReducedMotion) triggerCelebration()
      await new Promise(resolve => setTimeout(resolve, 1500))
      setStage(4) // School card
      await new Promise(resolve => setTimeout(resolve, 1800))
      setStage(5) // CTAs
    }
    sequence()
  }, [prefersReducedMotion])

  const triggerCelebration = () => {
    const colors = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B']
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.5 },
      colors,
      gravity: 0.7,
      ticks: 350,
      scalar: 0.9
    })
    setTimeout(() => {
      confetti({ particleCount: 25, angle: 60, spread: 50, origin: { x: 0.1 }, colors })
      confetti({ particleCount: 25, angle: 120, spread: 50, origin: { x: 0.9 }, colors })
    }, 400)
  }

  const customIcons = [
    { Icon: CustomIcons.Knowledge, label: 'Learn', color: 'from-indigo-500 to-purple-600' },
    { Icon: CustomIcons.Growth, label: 'Grow', color: 'from-emerald-500 to-green-600' },
    { Icon: CustomIcons.Innovation, label: 'Create', color: 'from-amber-400 to-orange-500' },
    { Icon: CustomIcons.Achievement, label: 'Excel', color: 'from-yellow-400 to-amber-500' },
    { Icon: CustomIcons.Progress, label: 'Advance', color: 'from-blue-500 to-indigo-600' }
  ]

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {!prefersReducedMotion && <canvas ref={canvasRef} className="absolute inset-0 opacity-70" />}

      {/* Floating custom icons */}
      <AnimatePresence>
        {stage >= 3 && !prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {customIcons.map((item, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ 
                  left: `${10 + i * 18}%`,
                  top: '110%',
                  opacity: 0,
                  scale: 0.5
                }}
                animate={{ 
                  top: '-15%',
                  opacity: [0, 0.7, 0.7, 0],
                  scale: [0.5, 1, 1, 0.8],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 7 + i * 0.5,
                  delay: i * 0.3,
                  ease: 'easeOut'
                }}
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${item.color} p-3 sm:p-4 shadow-xl opacity-40`}>
                  <item.Icon />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8 sm:py-12">
        <div className="w-full max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Stage 1: Initialization */}
            {stage >= 1 && stage < 2 && (
              <motion.div
                key="init"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="text-center"
              >
                <motion.div className="relative w-28 h-28 sm:w-36 sm:h-36 mx-auto mb-6 sm:mb-8">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 blur-2xl opacity-40"
                    animate={{ scale: [1, 1.4, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="relative w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-2xl overflow-hidden"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20">
                      <CustomIcons.Progress />
                    </div>
                  </motion.div>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-base sm:text-lg md:text-xl text-slate-600 font-medium px-4"
                >
                  Preparing your learning environment...
                </motion.p>
              </motion.div>
            )}

            {/* Stage 2+: Name Reveal */}
            {stage >= 2 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6 sm:mb-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                  className="inline-block mb-4 sm:mb-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl blur-xl opacity-40 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl">
                      <div className="w-10 h-10 sm:w-14 sm:h-14">
                        <CustomIcons.Knowledge />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.h1 
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight px-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="text-slate-700">Welcome, </span>
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {nameRevealed}
                    {cursorVisible && <span className="animate-pulse">|</span>}
                  </span>
                  {typewriterCompleted.current && <span className="text-slate-700">!</span>}
                </motion.h1>
              </motion.div>
            )}

            {/* Stage 4: School Card */}
            {stage >= 4 && (
              <motion.div
                key="school"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8 px-4"
              >
                <div className="relative group max-w-2xl mx-auto">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl opacity-20 blur-lg group-hover:opacity-30 transition duration-700" />
                  
                  <motion.div 
                    className="relative bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 border border-white/60 shadow-2xl"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-15"
                      style={{
                        background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%)',
                        backgroundSize: '200% 200%'
                      }}
                      animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />

                    <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-xl">
                        <div className="w-12 h-12 sm:w-14 sm:h-14">
                          <CustomIcons.Achievement />
                        </div>
                      </div>

                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-3">{schoolName}</h3>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
                          <span className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-xl text-sm sm:text-base font-semibold shadow-sm">
                            Grade {grade}
                          </span>
                          <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-xl text-sm sm:text-base font-semibold shadow-sm">
                            Section {className}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Stage 5: CTAs */}
            {stage >= 5 && (
              <motion.div
                key="cta"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center px-4"
              >
                <motion.p 
                  className="text-base sm:text-lg md:text-xl text-slate-600 mb-6 sm:mb-8 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Your journey to excellence begins now.
                </motion.p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-xl mx-auto">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onDashboard}
                    className="group relative px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg shadow-xl hover:shadow-2xl transition-all min-h-[52px] sm:min-h-[56px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center justify-center gap-2">
                      Start Learning
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onExploreClassrooms}
                    className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl hover:border-purple-300 transition-all min-h-[52px] sm:min-h-[56px]"
                  >
                    Explore Classes
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
