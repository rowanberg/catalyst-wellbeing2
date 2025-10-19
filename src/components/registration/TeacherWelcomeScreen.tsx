'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Sparkles, Zap, Mail, AlertCircle, ArrowRight } from 'lucide-react'

interface TeacherWelcomeScreenProps {
  teacherName: string
  schoolName: string
  onComplete?: () => void
}

export default function TeacherWelcomeScreen({ 
  teacherName, 
  schoolName,
  onComplete 
}: TeacherWelcomeScreenProps) {
  const [scene, setScene] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [canSkip, setCanSkip] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const router = useRouter()

  // Detect screen size and motion preferences
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024)
    }
    
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(motionQuery.matches)
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    motionQuery.addEventListener('change', (e) => setPrefersReducedMotion(e.matches))
    
    return () => {
      window.removeEventListener('resize', checkScreenSize)
      motionQuery.removeEventListener('change', (e) => setPrefersReducedMotion(e.matches))
    }
  }, [])

  useEffect(() => {
    // Start animation after mount
    const startTimer = setTimeout(() => {
      setScene(1)
    }, 800)
    return () => clearTimeout(startTimer)
  }, [])

  useEffect(() => {
    if (scene === 0) return
    
    // Auto-advance scenes with proper reading time (reduced for mobile)
    const durations = isMobile ? {
      1: 3500, // Welcome message - 3.5 seconds on mobile
      2: 3000, // Innovation - 3 seconds
      3: 3000, // Collaboration - 3 seconds
      4: 3000, // Power of Insight - 3 seconds
      5: 3000, // Pride in Teaching - 3 seconds
      6: 4000  // Final scene - 4 seconds before enabling button
    } : {
      1: 4000, // Welcome message - 4 seconds on desktop
      2: 3500, // Innovation - 3.5 seconds
      3: 3500, // Collaboration - 3.5 seconds
      4: 3500, // Power of Insight - 3.5 seconds
      5: 3500, // Pride in Teaching - 3.5 seconds
      6: 5000  // Final scene - 5 seconds before enabling button
    }
    
    const timer = setTimeout(() => {
      if (scene < 6) {
        setScene(scene + 1)
      } else {
        setIsComplete(true)
        setCanSkip(true)
      }
    }, durations[scene as keyof typeof durations] || 3000)

    return () => clearTimeout(timer)
  }, [scene])

  // Trigger confetti on final scene
  useEffect(() => {
    if (scene === 6) {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now()
        if (timeLeft <= 0) return clearInterval(interval)

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#0078FF', '#FFD700', '#101820']
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#0078FF', '#FFD700', '#101820']
        })
      }, 250)
    }
  }, [scene])

  const handleContinue = () => {
    if (onComplete) {
      onComplete()
    } else {
      router.push('/teacher')
    }
  }

  // Custom easing curves for smooth animations
  const smoothEasing = [0.25, 0.1, 0.25, 1] as const
  const elasticEasing = [0.68, -0.55, 0.265, 1.55] as const
  const powerEasing = [0.21, 0.47, 0.32, 0.98] as const

  // Character-by-character animation helper
  const AnimatedText = ({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) => (
    <span className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.3,
            delay: delay + i * 0.03,
            ease: powerEasing
          }}
          style={{ display: 'inline-block', willChange: 'transform, opacity' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )

  return (
    <div 
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center"
      style={{
        willChange: 'transform',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden' as const
      }}
    >
      {/* Animated Background Particles - Optimized for performance */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0">
            {[...Array(isMobile ? 12 : 24)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
                style={{
                  willChange: 'transform',
                  transform: 'translate3d(0, 0, 0)'
                }}
                initial={{ 
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
                  opacity: 0.2 + Math.random() * 0.3
                }}
                animate={{ 
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                  y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{
                  duration: 25 + Math.random() * 15,
                  repeat: Infinity,
                  ease: "linear",
                  repeatType: "reverse"
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Content - Responsive padding and max-width with bottom spacing */}
      <div className={`relative z-10 mx-auto text-center ${
        isMobile ? 'max-w-sm px-4 pb-32' : isTablet ? 'max-w-2xl px-6 pb-36' : 'max-w-4xl px-8 pb-40'
      }`}
        style={{
          minHeight: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 160px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <AnimatePresence mode="wait">
          {/* Scene 1: Rise of the Educator */}
          {scene === 1 && (
            <motion.div
              key="scene1"
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ 
                duration: 0.8,
                ease: powerEasing,
                opacity: { duration: 0.6 },
                scale: { duration: 0.8, ease: smoothEasing }
              }}
              className={`space-y-8 ${
                isMobile ? 'max-h-[70vh]' : 'max-h-[75vh]'
              }`}
              style={{ 
                willChange: 'transform, opacity',
                overflow: 'hidden'
              }}
            >
              {/* Unique Icon: Rising Sun with Book - Responsive size */}
              <motion.div className={`relative mx-auto ${
                isMobile ? 'w-24 h-24' : isTablet ? 'w-28 h-28' : 'w-32 h-32'
              }`}>
                <svg viewBox="0 0 128 128" className="w-full h-full">
                  {/* Sun rays */}
                  <motion.g
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    {[...Array(8)].map((_, i) => (
                      <motion.rect
                        key={i}
                        x="62"
                        y="10"
                        width="4"
                        height="15"
                        fill="#FFD700"
                        transform={`rotate(${i * 45} 64 64)`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </motion.g>
                  {/* Book base */}
                  <motion.path
                    d="M40 60 L40 90 L64 100 L88 90 L88 60 L64 70 Z"
                    fill="#0078FF"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5 }}
                  />
                  {/* Book pages */}
                  <motion.path
                    d="M40 60 L64 70 L88 60"
                    stroke="#F8FAFF"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </svg>
              </motion.div>
              <motion.div
                className="overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <motion.h1
                  className={`font-bold relative ${
                    isMobile ? 'text-3xl' : isTablet ? 'text-4xl' : 'text-5xl'
                  }`}
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.8,
                    delay: 0.8,
                    ease: powerEasing
                  }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <span className="relative inline-block">
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent blur-lg opacity-70 animate-pulse" />
                    <span className="relative bg-gradient-to-r from-blue-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
                      <AnimatedText text="Welcome to CatalystWells" delay={1.2} />
                    </span>
                  </span>
                </motion.h1>
              </motion.div>
              <motion.div
                className="overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.3 }}
              >
                <motion.p
                  className={`text-gray-300 leading-relaxed relative ${
                    isMobile ? 'text-base' : isTablet ? 'text-lg' : 'text-xl'
                  }`}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.8,
                    delay: 2,
                    ease: powerEasing
                  }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <AnimatedText text="Empowering the Educators of Tomorrow" delay={2.5} />
                </motion.p>
              </motion.div>
            </motion.div>
          )}

          {/* Scene 2: Innovation Meets Education */}
          {scene === 2 && (
            <motion.div
              key="scene2"
              initial={{ opacity: 0, x: 60, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -40, rotateY: 10 }}
              transition={{ 
                duration: 0.7,
                ease: powerEasing,
                rotateY: { duration: 0.8, ease: smoothEasing }
              }}
              className={`space-y-8 ${
                isMobile ? 'max-h-[70vh]' : 'max-h-[75vh]'
              }`}
              style={{ 
                willChange: 'transform, opacity',
                transformStyle: 'preserve-3d',
                perspective: 1000,
                overflow: 'hidden'
              }}
            >
              {/* Unique Icon: Digital Brain with Graduation Cap - Responsive */}
              <motion.div className={`relative mx-auto ${
                isMobile ? 'w-24 h-24' : isTablet ? 'w-28 h-28' : 'w-32 h-32'
              }`}>
                <svg viewBox="0 0 128 128" className="w-full h-full">
                  {/* Circuit brain */}
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="30"
                    fill="none"
                    stroke="#0078FF"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5 }}
                  />
                  {/* Neural connections */}
                  {[...Array(6)].map((_, i) => (
                    <motion.circle
                      key={i}
                      cx={64 + Math.cos(i * 60 * Math.PI / 180) * 25}
                      cy={64 + Math.sin(i * 60 * Math.PI / 180) * 25}
                      r="4"
                      fill="#FFD700"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    />
                  ))}
                  {/* Graduation cap */}
                  <motion.path
                    d="M40 40 L64 30 L88 40 L64 50 Z"
                    fill="#101820"
                    stroke="#FFD700"
                    strokeWidth="2"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </svg>
              </motion.div>
              <motion.div className="space-y-2">
                {"Innovation Meets Education".split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    className={`inline-block font-bold text-white ${
                      isMobile ? 'text-2xl mr-2' : isTablet ? 'text-3xl mr-2' : 'text-4xl mr-3'
                    }`}
                    initial={{ y: 30, opacity: 0, filter: "blur(10px)", scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)", scale: 1 }}
                    transition={{ 
                      duration: 0.7,
                      delay: 0.8 + i * 0.12,
                      ease: elasticEasing,
                      filter: { duration: 0.5 }
                    }}
                    style={{ willChange: 'transform, opacity, filter' }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.div>
              <motion.p
                className={`text-gray-300 leading-relaxed mt-4 ${
                  isMobile ? 'text-base' : isTablet ? 'text-lg' : 'text-xl'
                }`}
                initial={{ y: 30, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.9,
                  delay: 1.5,
                  ease: smoothEasing
                }}
                style={{ willChange: 'transform, opacity' }}
              >
                Where innovation blends seamlessly with teaching excellence
              </motion.p>
            </motion.div>
          )}

          {/* Scene 3: Collaboration Beyond Walls */}
          {scene === 3 && (
            <motion.div
              key="scene3"
              initial={{ opacity: 0, scale: 0.7, rotateZ: -5 }}
              animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotateZ: 3 }}
              transition={{ 
                duration: 0.8,
                ease: smoothEasing,
                scale: { duration: 0.9, ease: elasticEasing }
              }}
              className={`space-y-8 ${
                isMobile ? 'max-h-[70vh]' : 'max-h-[75vh]'
              }`}
              style={{ 
                willChange: 'transform, opacity',
                overflow: 'hidden'
              }}
            >
              {/* Unique Icon: Connected Globe with People - Responsive */}
              <motion.div className={`relative mx-auto ${
                isMobile ? 'w-28 h-28' : isTablet ? 'w-32 h-32' : 'w-40 h-40'
              }`}>
                <svg viewBox="0 0 160 160" className="w-full h-full">
                  {/* Globe */}
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="50"
                    fill="none"
                    stroke="#0078FF"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5 }}
                  />
                  {/* Connection lines */}
                  <motion.path
                    d="M30 80 Q80 60 130 80"
                    stroke="#FFD700"
                    strokeWidth="1"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                  />
                  <motion.path
                    d="M80 30 Q100 80 80 130"
                    stroke="#FFD700"
                    strokeWidth="1"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                  {/* People nodes */}
                  {[
                    { x: 30, y: 80 },
                    { x: 130, y: 80 },
                    { x: 80, y: 30 },
                    { x: 80, y: 130 }
                  ].map((pos, i) => (
                    <motion.g key={i}>
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r="8"
                        fill="#101820"
                        stroke="#FFD700"
                        strokeWidth="2"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                      />
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y - 5}
                        r="3"
                        fill="#F8FAFF"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
                      />
                    </motion.g>
                  ))}
                </svg>
              </motion.div>
              <motion.h2 
                className="text-4xl font-bold text-white"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.8,
                  delay: 0.8,
                  ease: [0.21, 0.47, 0.32, 0.98]
                }}
              >
                Collaboration Beyond Walls
              </motion.h2>
              <motion.div className={`text-gray-300 leading-relaxed space-y-1 mt-4 ${
                isMobile ? 'text-base' : isTablet ? 'text-lg' : 'text-xl'
              }`}>
                {["Collaborate.", "Inspire.", "Lead globally with CatalystWells"].map((text, i) => (
                  <motion.span
                    key={i}
                    className="block"
                    initial={{ x: -40, opacity: 0, scale: 0.95 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.7,
                      delay: 1.4 + i * 0.18,
                      ease: powerEasing,
                      scale: { duration: 0.8, ease: elasticEasing }
                    }}
                    style={{ willChange: 'transform, opacity' }}
                  >
                    {text}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Scene 4: Power of Insight */}
          {scene === 4 && (
            <motion.div
              key="scene4"
              initial={{ opacity: 0, rotateY: -45, scale: 0.8 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: 45, scale: 0.9 }}
              transition={{ 
                duration: 0.9,
                ease: powerEasing,
                rotateY: { duration: 1, ease: smoothEasing }
              }}
              className={`space-y-8 ${
                isMobile ? 'max-h-[70vh]' : 'max-h-[75vh]'
              }`}
              style={{ 
                willChange: 'transform, opacity',
                transformStyle: 'preserve-3d',
                perspective: 1200,
                overflow: 'hidden'
              }}
            >
              {/* Unique Icon: Analytics Eye - Responsive */}
              <motion.div className={`relative mx-auto ${
                isMobile ? 'w-26 h-26' : isTablet ? 'w-30 h-30' : 'w-36 h-36'
              }`}>
                <svg viewBox="0 0 144 144" className="w-full h-full">
                  {/* Eye shape */}
                  <motion.path
                    d="M20 72 Q72 30 124 72 Q72 114 20 72"
                    fill="none"
                    stroke="#0078FF"
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5 }}
                  />
                  {/* Iris with data points */}
                  <motion.circle
                    cx="72"
                    cy="72"
                    r="25"
                    fill="#101820"
                    stroke="#FFD700"
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                  {/* Data visualization bars inside iris */}
                  {[15, 20, 12, 18, 22].map((height, i) => (
                    <motion.rect
                      key={i}
                      x={58 + i * 6}
                      y={72 - height / 2}
                      width="4"
                      height={height}
                      fill="#0078FF"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                    />
                  ))}
                  {/* Pupil */}
                  <motion.circle
                    cx="72"
                    cy="72"
                    r="8"
                    fill="#F8FAFF"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.5, delay: 1 }}
                  />
                </svg>
              </motion.div>
              <motion.h2 
                className={`font-bold text-white ${
                  isMobile ? 'text-2xl' : isTablet ? 'text-3xl' : 'text-4xl'
                }`}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ 
                  duration: 1,
                  delay: 0.8,
                  ease: [0.21, 0.47, 0.32, 0.98]
                }}
                style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
              >
                Power of Insight
              </motion.h2>
              <motion.p 
                className={`text-gray-300 leading-relaxed mt-4 ${
                  isMobile ? 'text-base' : isTablet ? 'text-lg' : 'text-xl'
                }`}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  duration: 0.8,
                  delay: 1.5,
                  ease: "easeOut"
                }}
              >
                Gain deep insights that shape brighter futures
              </motion.p>
            </motion.div>
          )}

          {/* Scene 5: Pride in Teaching */}
          {scene === 5 && (
            <motion.div
              key="scene5"
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 1.05 }}
              transition={{ 
                duration: 0.8,
                ease: smoothEasing,
                y: { duration: 0.9, ease: powerEasing }
              }}
              className={`space-y-8 ${
                isMobile ? 'max-h-[70vh]' : 'max-h-[75vh]'
              }`}
              style={{ 
                willChange: 'transform, opacity',
                overflow: 'hidden'
              }}
            >
              {/* Unique Icon: Heart with Growth Tree - Responsive */}
              <motion.div className={`relative mx-auto ${
                isMobile ? 'w-24 h-24' : isTablet ? 'w-28 h-28' : 'w-32 h-32'
              }`}>
                <svg viewBox="0 0 128 128" className="w-full h-full">
                  {/* Heart shape */}
                  <motion.path
                    d="M64 100 C20 60 20 30 40 30 C52 30 60 35 64 40 C68 35 76 30 88 30 C108 30 108 60 64 100"
                    fill="#FFD700"
                    initial={{ pathLength: 0, fill: "none", stroke: "#FFD700", strokeWidth: 2 }}
                    animate={{ pathLength: 1, fill: "#FFD700" }}
                    transition={{ duration: 1.5 }}
                  />
                  {/* Growth tree inside heart */}
                  <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }}>
                    {/* Trunk */}
                    <rect x="62" y="60" width="4" height="20" fill="#101820" />
                    {/* Branches */}
                    <motion.circle cx="64" cy="55" r="8" fill="#0078FF" 
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5, delay: 1 }}
                    />
                    <motion.circle cx="56" cy="58" r="6" fill="#0078FF"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5, delay: 1.1 }}
                    />
                    <motion.circle cx="72" cy="58" r="6" fill="#0078FF"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5, delay: 1.2 }}
                    />
                  </motion.g>
                </svg>
              </motion.div>
              <motion.h2 
                className={`font-bold text-white ${
                  isMobile ? 'text-2xl' : isTablet ? 'text-3xl' : 'text-4xl'
                }`}
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  duration: 1,
                  delay: 0.8,
                  ease: [0.21, 0.47, 0.32, 0.98]
                }}
              >
                Pride in Teaching
              </motion.h2>
              <motion.p 
                className={`text-gray-300 leading-relaxed mt-4 ${
                  isMobile ? 'text-base' : isTablet ? 'text-lg' : 'text-xl'
                }`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.8,
                  delay: 1.5,
                  ease: "easeOut"
                }}
              >
                Because your guidance inspires every learner's success
              </motion.p>
            </motion.div>
          )}

          {/* Scene 6: Professional Arrival */}
          {scene === 6 && (
            <motion.div
              key="scene6"
              initial={{ opacity: 0, scale: 0.6, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                duration: 1,
                type: "spring",
                stiffness: 120,
                damping: 18,
                mass: 0.8
              }}
              className="flex flex-col items-center justify-center"
              style={{ 
                willChange: 'transform, opacity',
                minHeight: isMobile ? '60vh' : '70vh'
              }}
            >
              {/* CatalystWells Animated Icon Reveal */}
              <motion.div className={`relative mx-auto ${
                isMobile ? 'w-40 h-40 mb-6' : isTablet ? 'w-48 h-48 mb-8' : 'w-56 h-56 mb-10'
              }`}>
                {/* Ambient Glow Formation */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(138,43,226,0.6) 0%, rgba(37,99,235,0.4) 40%, transparent 70%)',
                    filter: isMobile ? 'blur(20px)' : 'blur(30px)',
                    willChange: 'transform, opacity'
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.5, 1.2],
                    opacity: [0, 0.8, 0.6]
                  }}
                  transition={{ 
                    duration: isMobile ? 1.5 : 2,
                    ease: [0.43, 0.13, 0.23, 0.96]
                  }}
                />
                
                {/* Particle Convergence Effect - Reduced for mobile */}
                {!prefersReducedMotion && [...Array(isMobile ? 12 : 24)].map((_, i) => {
                  const totalParticles = isMobile ? 12 : 24
                  const angle = (i * 360 / totalParticles) * (Math.PI / 180)
                  const distance = isMobile ? 80 : 120
                  const startX = Math.cos(angle) * distance
                  const startY = Math.sin(angle) * distance
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full"
                      style={{
                        background: i % 2 === 0 ? '#8B5CF6' : '#3B82F6',
                        boxShadow: isMobile ? `0 0 4px ${i % 2 === 0 ? '#8B5CF6' : '#3B82F6'}` : `0 0 8px ${i % 2 === 0 ? '#8B5CF6' : '#3B82F6'}`,
                        left: '50%',
                        top: '50%',
                        x: '-50%',
                        y: '-50%',
                        willChange: 'transform, opacity'
                      }}
                      initial={{ 
                        x: startX,
                        y: startY,
                        scale: 0,
                        opacity: 0
                      }}
                      animate={{ 
                        x: 0,
                        y: 0,
                        scale: [0, isMobile ? 1.2 : 1.5, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: isMobile ? 1.5 : 2,
                        delay: i * (isMobile ? 0.05 : 0.03),
                        ease: [0.43, 0.13, 0.23, 0.96]
                      }}
                    />
                  )
                })}
                
                {/* Neural Network Background - Simplified for mobile */}
                {!prefersReducedMotion && (
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" style={{ opacity: isMobile ? 0.2 : 0.3 }}>
                    {[...Array(isMobile ? 3 : 6)].map((_, i) => {
                      const totalLines = isMobile ? 3 : 6
                      const multiplier = isMobile ? 120 : 60
                      const angle1 = (i * multiplier) * (Math.PI / 180)
                      const angle2 = ((i + 1) * multiplier) * (Math.PI / 180)
                      const x1 = 100 + Math.cos(angle1) * 70
                      const y1 = 100 + Math.sin(angle1) * 70
                      const x2 = 100 + Math.cos(angle2) * 70
                      const y2 = 100 + Math.sin(angle2) * 70
                      return (
                        <motion.line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="url(#neuralGradient)"
                          strokeWidth="1"
                          style={{ willChange: 'opacity' }}
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: [0, 0.6, 0.3] }}
                          transition={{ 
                            duration: isMobile ? 1.2 : 1.5,
                            delay: 0.5 + i * (isMobile ? 0.15 : 0.1)
                          }}
                        />
                      )
                    })}
                  </svg>
                )}
                
                <svg viewBox="0 0 200 200" className="w-full h-full relative z-10">
                  <defs>
                    <linearGradient id="electricGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="50%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                    <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.8" />
                    </linearGradient>
                    <filter id="neumorphicGlow">
                      <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                      <feOffset in="coloredBlur" dx="0" dy="2" result="offsetBlur"/>
                      <feMerge>
                        <feMergeNode in="offsetBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <radialGradient id="pulseGradient">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  {/* Light Stream Convergence for 'C' */}
                  <motion.path
                    d="M70 60 Q50 75 50 100 Q50 125 70 140 Q85 140 105 140"
                    fill="none"
                    stroke="url(#electricGradient)"
                    strokeWidth={isMobile ? "6" : "8"}
                    strokeLinecap="round"
                    filter={isMobile ? undefined : "url(#neumorphicGlow)"}
                    style={{ willChange: 'opacity' }}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ 
                      duration: isMobile ? 1.2 : 1.5,
                      delay: isMobile ? 0.8 : 1,
                      ease: [0.43, 0.13, 0.23, 0.96]
                    }}
                  />
                  
                  {/* Additional 'C' glow layer - Desktop only */}
                  {!isMobile && (
                    <motion.path
                      d="M70 60 Q50 75 50 100 Q50 125 70 140 Q85 140 105 140"
                      fill="none"
                      stroke="#C4B5FD"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.6"
                      style={{ willChange: 'opacity' }}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ 
                        duration: 1.5,
                        delay: 1.2,
                        ease: [0.43, 0.13, 0.23, 0.96]
                      }}
                    />
                  )}
                  
                  {/* Light Stream Convergence for 'W' */}
                  <motion.path
                    d="M95 60 L102 125 L110 75 L118 125 L125 60"
                    fill="none"
                    stroke="url(#electricGradient)"
                    strokeWidth={isMobile ? "5" : "7"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={isMobile ? undefined : "url(#neumorphicGlow)"}
                    style={{ willChange: 'opacity' }}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ 
                      duration: isMobile ? 1.2 : 1.5,
                      delay: isMobile ? 1.2 : 1.5,
                      ease: [0.43, 0.13, 0.23, 0.96]
                    }}
                  />
                  
                  {/* Additional 'W' glow layer - Desktop only */}
                  {!isMobile && (
                    <motion.path
                      d="M95 60 L102 125 L110 75 L118 125 L125 60"
                      fill="none"
                      stroke="#93C5FD"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.6"
                      style={{ willChange: 'opacity' }}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ 
                        duration: 1.5,
                        delay: 1.7,
                        ease: [0.43, 0.13, 0.23, 0.96]
                      }}
                    />
                  )}
                  
                  {/* Pulse Radial Effect */}
                  {!prefersReducedMotion && (
                    <motion.circle
                      cx="100"
                      cy="100"
                      r={isMobile ? "60" : "80"}
                      fill="url(#pulseGradient)"
                      style={{ willChange: 'transform, opacity' }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.5, 2],
                        opacity: [0.8, 0.4, 0]
                      }}
                      transition={{
                        duration: isMobile ? 1.5 : 2,
                        delay: isMobile ? 2 : 2.5,
                        repeat: Infinity,
                        repeatDelay: isMobile ? 1.5 : 2
                      }}
                    />
                  )}
                  
                  {/* Morphing Light Reflections - Reduced for mobile */}
                  {!prefersReducedMotion && [...Array(isMobile ? 4 : 8)].map((_, i) => {
                    const totalReflections = isMobile ? 4 : 8
                    const angle = (i * (360 / totalReflections)) * (Math.PI / 180)
                    const distance = isMobile ? 50 : 60
                    const x = 100 + Math.cos(angle) * distance
                    const y = 100 + Math.sin(angle) * distance
                    return (
                      <motion.circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={isMobile ? "2" : "3"}
                        fill="#E0E7FF"
                        style={{ willChange: 'transform, opacity' }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: [0, 1.5, 0],
                          opacity: [0, 0.9, 0]
                        }}
                        transition={{
                          duration: isMobile ? 1.2 : 1.5,
                          delay: (isMobile ? 1.5 : 2) + i * 0.1,
                          ease: 'easeOut'
                        }}
                      />
                    )
                  })}
                  
                  {/* 3D Particle Glow Trails - Desktop only for performance */}
                  {!isMobile && !prefersReducedMotion && [...Array(12)].map((_, i) => {
                    const angle = (i * 30) * (Math.PI / 180)
                    const startX = 100 + Math.cos(angle) * 90
                    const startY = 100 + Math.sin(angle) * 90
                    const endX = 100 + Math.cos(angle) * 50
                    const endY = 100 + Math.sin(angle) * 50
                    return (
                      <motion.line
                        key={i}
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={i % 2 === 0 ? '#8B5CF6' : '#3B82F6'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ willChange: 'opacity' }}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ 
                          pathLength: [0, 1, 0],
                          opacity: [0, 0.8, 0]
                        }}
                        transition={{
                          duration: 2,
                          delay: 0.5 + i * 0.05,
                          ease: [0.43, 0.13, 0.23, 0.96]
                        }}
                      />
                    )
                  })}
                </svg>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`space-y-4 w-full ${
                  isMobile ? 'px-4' : 'px-8'
                }`}
              >
                {/* Tagline Animation - Faster on mobile */}
                <motion.div
                  className={`text-center ${
                    isMobile ? 'mb-4' : 'mb-6'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: isMobile ? 3 : 4,
                    delay: isMobile ? 2 : 3,
                    times: [0, 0.1, 0.8, 1],
                    ease: [0.43, 0.13, 0.23, 0.96]
                  }}
                >
                  <p className={`font-light tracking-wider ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}
                    style={{
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      textShadow: '0 0 30px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    CatalystWells — Empowering Minds Through AI
                  </p>
                </motion.div>

                <motion.h2 
                  className={`font-bold relative text-center ${
                    isMobile ? 'text-2xl' : isTablet ? 'text-3xl' : 'text-4xl'
                  }`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    duration: 0.8,
                    delay: isMobile ? 2.5 : 3.5,
                    type: "spring",
                    stiffness: 100,
                    damping: 10
                  }}
                >
                  <span className="relative inline-block">
                    {/* Animated gradient shimmer background */}
                    <motion.span 
                      className="absolute inset-0 bg-gradient-to-r from-blue-400 via-yellow-400 to-blue-400 bg-clip-text text-transparent"
                      style={{ backgroundSize: '200% auto' }}
                      animate={{ backgroundPosition: ['0% center', '200% center'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      Welcome aboard, {teacherName}!
                    </motion.span>
                    {/* Glow effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent blur-xl opacity-50" />
                    {/* Main text */}
                    <span className="relative bg-gradient-to-r from-blue-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
                      Welcome aboard, {teacherName}!
                    </span>
                  </span>
                  {/* Sparkle icons */}
                  <motion.span
                    className="absolute -top-2 -right-2"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </motion.span>
                  <motion.span
                    className="absolute -bottom-2 -left-2"
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.7, type: 'spring' }}
                  >
                    <Zap className="w-5 h-5 text-blue-400" />
                  </motion.span>
                </motion.h2>
                <motion.p 
                  className={`text-gray-300 text-center ${
                    isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg'
                  }`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {schoolName}
                </motion.p>
                <motion.p 
                  className={`text-gray-400 text-center ${
                    isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-base'
                  }`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  Let's shape the future together
                </motion.p>
              </motion.div>

              {/* Email Verification Card */}
              <motion.div
                className={`flex justify-center ${
                  isMobile ? 'mt-6' : 'mt-8'
                } w-full px-4`}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="max-w-2xl w-full">
                  <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl">
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
                        <p className="text-gray-300 text-sm sm:text-base">
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
                      <p className="text-gray-400 text-xs mt-4">
                        Didn't receive the email? Check your spam folder or contact support.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar and Dots - Fixed positioning with backdrop */}
        <motion.div 
          className={`fixed left-1/2 transform -translate-x-1/2 flex flex-col items-center ${
            isMobile ? 'bottom-6 gap-2' : isTablet ? 'bottom-8 gap-3' : 'bottom-12 gap-4'
          }`}
          style={{
            zIndex: 50,
            pointerEvents: 'none'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Backdrop blur for better visibility */}
          <div 
            className="absolute inset-0 -mx-16 -my-8 backdrop-blur-md bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent rounded-3xl"
            style={{
              zIndex: -1,
              filter: 'blur(20px)'
            }}
          />
          {/* Progress Bar - Responsive width */}
          <div className={`h-1 bg-gray-700 rounded-full overflow-hidden ${
            isMobile ? 'w-48' : isTablet ? 'w-56' : 'w-64'
          }`}>
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-400 to-yellow-400 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(scene / 6) * 100}%` }}
              transition={{ 
                duration: 0.6,
                ease: smoothEasing,
                delay: 0.1
              }}
              style={{ willChange: 'width' }}
            />
          </div>
          
          {/* Progress Dots - Responsive spacing */}
          <div className={`flex ${
            isMobile ? 'gap-2' : 'gap-3'
          }`}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                className={`relative transition-colors duration-500`}
              >
                <motion.div
                  className={`rounded-full ${
                    isMobile ? 'w-2 h-2' : 'w-3 h-3'
                  } ${
                    scene >= i ? 'bg-blue-400' : 'bg-gray-600'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: scene === i ? 1.4 : 1 }}
                  transition={{ 
                    duration: 0.4,
                    ease: elasticEasing,
                    type: scene === i ? "spring" : "tween",
                    stiffness: 300,
                    damping: 15
                  }}
                  style={{ willChange: 'transform' }}
                />
                {scene === i && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-blue-400"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ 
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    style={{ willChange: 'transform, opacity' }}
                  />
                )}
              </motion.div>
            ))}
          </div>
          
          {/* Scene Label - Responsive text */}
          <motion.p 
            className={`text-gray-400 uppercase tracking-wider ${
              isMobile ? 'text-[10px]' : 'text-xs'
            }`}
            key={scene}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {scene === 1 && "Rise of the Educator"}
            {scene === 2 && "Innovation Meets Education"}
            {scene === 3 && "Collaboration Beyond Walls"}
            {scene === 4 && "Power of Insight"}
            {scene === 5 && "Pride in Teaching"}
            {scene === 6 && "Professional Arrival"}
          </motion.p>
        </motion.div>

        {/* Safe Area Spacer - Ensures no content overlaps with progress indicators */}
        <div className={`${isMobile ? 'h-28' : isTablet ? 'h-32' : 'h-36'}`} aria-hidden="true" />
      </div>
    </div>
  )
}
