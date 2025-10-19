'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { 
  ArrowRight, 
  Shield, 
  Globe, 
  Heart, 
  TrendingUp,
  Users,
  BookOpen,
  BarChart3,
  Calendar,
  FileText,
  Sparkles,
  Network,
  School,
  Mail,
  AlertCircle
} from 'lucide-react'

interface ParentWelcomeScreenProps {
  parentName: string
  schoolName: string
  childrenCount?: number
  onDashboard: () => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  hue: number
  life: number
}

// Custom Enterprise Emblem Logo
const CatalystEmblem = ({ animate = false }: { animate?: boolean }) => (
  <svg viewBox="0 0 120 120" className="w-full h-full">
    <defs>
      <linearGradient id="emblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1F51FF" />
        <stop offset="100%" stopColor="#0A1931" />
      </linearGradient>
      <filter id="emblemGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    {/* Outer Hexagon */}
    <motion.path
      d="M60 15 L95 35 L95 85 L60 105 L25 85 L25 35 Z"
      fill="none"
      stroke="url(#emblemGrad)"
      strokeWidth="2"
      filter="url(#emblemGlow)"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={animate ? { pathLength: 1, opacity: 1 } : {}}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    />
    
    {/* Inner Circle */}
    <motion.circle
      cx="60"
      cy="60"
      r="25"
      fill="url(#emblemGrad)"
      opacity="0.2"
      initial={{ scale: 0 }}
      animate={animate ? { scale: 1 } : {}}
      transition={{ delay: 0.8, duration: 0.6, type: "spring" }}
    />
    
    {/* Center Icon - Family Symbol */}
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={animate ? { scale: 1, opacity: 1 } : {}}
      transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
    >
      <circle cx="50" cy="50" r="8" fill="#1F51FF" />
      <circle cx="70" cy="50" r="8" fill="#1F51FF" />
      <circle cx="60" cy="65" r="6" fill="#F5C542" />
    </motion.g>
  </svg>
)

export default function ParentWelcomeScreen({
  parentName,
  schoolName,
  childrenCount = 1,
  onDashboard
}: ParentWelcomeScreenProps) {
  const [scene, setScene] = useState(0)
  const [loading, setLoading] = useState(true)
  const prefersReducedMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>()

  // 3D-like Particle System
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

    // Initialize particles for network effect
    const initParticles = () => {
      particlesRef.current = []
      const count = window.innerWidth < 768 ? 40 : 80
      
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          hue: 220 + Math.random() * 40, // Blue spectrum
          life: 100
        })
      }
    }
    initParticles()

    const animate = () => {
      // Gradient background fade based on scene
      const alpha = scene === 0 ? 0.02 : 0.03
      ctx.fillStyle = `rgba(10, 25, 49, ${alpha})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw and update particles
      particlesRef.current.forEach((particle, index) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life -= 0.5

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Reset dead particles
        if (particle.life <= 0) {
          particle.life = 100
          particle.x = Math.random() * canvas.width
          particle.y = Math.random() * canvas.height
        }

        const opacity = (particle.life / 100) * 0.8
        
        // Draw particle
        ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${opacity})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Draw connections (network effect in scene 2)
        if (scene === 2) {
          particlesRef.current.forEach((other, otherIndex) => {
            if (otherIndex <= index) return
            const dx = particle.x - other.x
            const dy = particle.y - other.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < 100) {
              ctx.strokeStyle = `hsla(${particle.hue}, 70%, 60%, ${(1 - dist / 100) * 0.2})`
              ctx.lineWidth = 0.5
              ctx.beginPath()
              ctx.moveTo(particle.x, particle.y)
              ctx.lineTo(other.x, other.y)
              ctx.stroke()
            }
          })
        }
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [prefersReducedMotion, scene])

  // Scene progression with improved timing
  useEffect(() => {
    const progression = async () => {
      // Initial loading
      await new Promise(resolve => setTimeout(resolve, 500))
      setLoading(false)
      setScene(1) // Ignition
      
      await new Promise(resolve => setTimeout(resolve, 3000)) // Increased from 2000
      setScene(2) // Global Network
      
      await new Promise(resolve => setTimeout(resolve, 3000)) // Increased from 2000
      setScene(3) // Data Dashboard
      
      await new Promise(resolve => setTimeout(resolve, 2500)) // Increased from 1800
      setScene(4) // Family Connection
      
      await new Promise(resolve => setTimeout(resolve, 2500)) // Increased from 1800
      setScene(5) // School Reveal
      
      await new Promise(resolve => setTimeout(resolve, 4000)) // Increased from 2000 for better readability
      setScene(6) // Interactive Arrival
      
      // Delayed celebration for better impact
      setTimeout(() => {
        if (!prefersReducedMotion) {
          triggerCelebration()
        }
      }, 500)
    }
    progression()
  }, [prefersReducedMotion])

  const triggerCelebration = () => {
    const colors = ['#1F51FF', '#0A1931', '#F5C542', '#4AEDC4']
    
    // Center burst
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.5 },
      colors,
      gravity: 0.9,
      ticks: 400,
      scalar: 1.1
    })

    // Side bursts
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.5 },
        colors
      })
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.5 },
        colors
      })
    }, 300)
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-[#0A1931] via-[#1F51FF]/20 to-[#F4F7FC]">
      {/* Canvas Background */}
      {!prefersReducedMotion && (
        <canvas ref={canvasRef} className="absolute inset-0 opacity-60" />
      )}

      {/* Gradient Orbs - Responsive Sizing */}
      <div className="absolute top-5 sm:top-10 left-5 sm:left-10 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-blue-500/20 rounded-full blur-2xl sm:blur-3xl animate-pulse" />
      <div className="absolute bottom-5 sm:bottom-10 right-5 sm:right-10 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-purple-500/20 rounded-full blur-2xl sm:blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-cyan-500/10 rounded-full blur-2xl sm:blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-8 py-6 sm:py-8">
        <AnimatePresence mode="wait" initial={false}>
          {/* Scene 1: Ignition */}
          {scene === 1 && (
            <motion.div
              key="ignition"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              transition={{ 
                duration: 0.8,
                ease: [0.43, 0.13, 0.23, 0.96]
              }}
              className="text-center max-w-4xl w-full">
              <motion.div 
                className="w-24 h-24 sm:w-32 md:w-48 sm:h-32 md:h-48 mx-auto mb-6 sm:mb-8"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
              >
                <CatalystEmblem animate={true} />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-semibold text-white mb-3 sm:mb-4 px-4"
              >
                Welcome to CatalystWells
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 px-4"
              >
                Where families and schools grow together
              </motion.p>
            </motion.div>
          )}

          {/* Scene 2: Global Network */}
          {scene === 2 && (
            <motion.div
              key="network"
              initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
              transition={{ 
                duration: 0.7,
                ease: [0.6, 0.01, 0.05, 0.95]
              }}
              className="text-center max-w-4xl w-full">
              <motion.div
                className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 mx-auto mb-6 sm:mb-8"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 text-blue-400" />
                </div>
                
                {/* Orbiting Nodes */}
                {[0, 72, 144, 216, 288].map((angle, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(100px) rotate(-${angle}deg)`
                    }}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                  />
                ))}
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-3 sm:mb-4 px-4"
              >
                Trusted by Schools. Empowered by Parents.
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-base sm:text-lg md:text-xl text-blue-100 px-4"
              >
                Connected Worldwide
              </motion.p>
            </motion.div>
          )}

          {/* Scene 3: Data Dashboard */}
          {scene === 3 && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.9, rotateX: 10, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, rotateX: -10, filter: "blur(10px)" }}
              transition={{ 
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1]
              }}
              style={{ perspective: 1000 }}
              className="w-full max-w-6xl px-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {[
                  { icon: Calendar, label: 'Attendance', color: 'from-blue-500 to-cyan-600' },
                  { icon: TrendingUp, label: 'Performance', color: 'from-purple-500 to-pink-600' },
                  { icon: Users, label: 'Community', color: 'from-green-500 to-emerald-600' },
                  { icon: FileText, label: 'Reports', color: 'from-orange-500 to-amber-600' }
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: index * 0.15,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ scale: 1.05 }}
                    className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-r opacity-20 blur-xl group-hover:opacity-40 transition-opacity rounded-2xl sm:rounded-3xl"
                      style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
                    />
                    <div className="relative bg-white/10 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl hover:border-white/40 transition-all">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br ${item.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto shadow-lg`}>
                        <item.icon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                      </div>
                      <p className="text-white font-semibold text-xs sm:text-sm md:text-base text-center">{item.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-center text-lg sm:text-xl md:text-2xl text-white mt-6 sm:mt-8 font-medium px-4">
                Insightful dashboards that bring learning to life
              </motion.p>
            </motion.div>
          )}

          {/* Scene 4: Family Connection */}
          {scene === 4 && (
            <motion.div
              key="family"
              initial={{ opacity: 0, scale: 0.85, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(12px)" }}
              transition={{ 
                duration: 0.9,
                ease: [0.65, 0, 0.35, 1]
              }}
              className="text-center max-w-4xl w-full px-4">
              <motion.div
                className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 mx-auto mb-6 sm:mb-8"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full opacity-20 blur-2xl" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <Heart className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 text-white" />
                </div>
                
                {/* Floating hearts */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      top: `${20 + i * 15}%`,
                      left: `${10 + i * 20}%`
                    }}
                    animate={{ 
                      y: [-10, -30, -10],
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{ 
                      duration: 3 + i,
                      repeat: Infinity,
                      delay: i * 0.5
                    }}
                  >
                    <Heart className="w-6 h-6 text-pink-300" fill="currentColor" />
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Because every child's progress
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-lg sm:text-xl md:text-2xl text-blue-100">
                begins with your trust
              </motion.p>
            </motion.div>
          )}

          {/* Scene 5: School Reveal */}
          {scene === 5 && (
            <motion.div
              key="school"
              initial={{ opacity: 0, scale: 0.8, y: 40, filter: "blur(15px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.1, y: -40, filter: "blur(15px)" }}
              transition={{ 
                duration: 0.9,
                ease: [0.87, 0, 0.13, 1]
              }}
              className="text-center max-w-4xl w-full px-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="inline-block mb-6 sm:mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-yellow-400 to-amber-600 p-5 sm:p-6 md:p-8 rounded-3xl shadow-2xl">
                    <School className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white" />
                  </div>
                </div>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-2xl sm:text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4">
                {schoolName}
              </motion.h2>
              
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="h-1 w-24 sm:w-32 md:w-48 bg-gradient-to-r from-yellow-400 to-amber-500 mx-auto mb-3 sm:mb-4"
              />
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="text-base sm:text-lg md:text-xl text-white">
                Your {childrenCount === 1 ? "child's" : "children's"} journey begins with
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="text-lg sm:text-xl md:text-2xl text-blue-100 font-semibold">
                CatalystWells and {schoolName}
              </motion.p>
            </motion.div>
          )}

          {/* Scene 6: Interactive Arrival */}
          {scene === 6 && (
            <motion.div
              key="arrival"
              initial={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
              transition={{ 
                duration: 1,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="text-center max-w-4xl w-full px-4">
              <motion.div 
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto mb-6 sm:mb-8"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
              >
                <CatalystEmblem animate={false} />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2">
                Welcome aboard,
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-xl sm:text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-6 sm:mb-8">
                {parentName}!
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-base sm:text-lg md:text-xl text-blue-100 mb-8 sm:mb-12">
                Your CatalystWells journey starts now
              </motion.p>
              
              {/* Email Verification Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="w-full max-w-2xl mx-auto"
              >
                <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl">
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Email Icon */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-30 animate-pulse" />
                      <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-4 shadow-xl">
                        <Mail className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Verification Text */}
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-white">
                        Verify Your Email
                      </h3>
                      <p className="text-blue-100 text-sm sm:text-base">
                        We've sent a verification email to your registered address. 
                        Please check your inbox and click the verification link.
                      </p>
                    </div>
                    
                    {/* Important Notice */}
                    <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg p-3 w-full">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-amber-200 text-xs sm:text-sm font-medium">
                            Important: Email verification required
                          </p>
                          <p className="text-amber-100/70 text-xs mt-1">
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
                    <p className="text-blue-100/60 text-xs mt-4">
                      Didn't receive the email? Check your spam folder or contact support.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
