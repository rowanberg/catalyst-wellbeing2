'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Pause, RotateCcw, Home, Sparkles } from 'lucide-react'
import { useAppDispatch } from '@/lib/redux/hooks'
import { updateXP, updateGems } from '@/lib/redux/slices/authSlice'
import { motion, AnimatePresence } from 'framer-motion'
import { ClientWrapper } from '@/components/providers/ClientWrapper'

export default function BreathingExercise() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [seconds, setSeconds] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [celebrationMessages] = useState([
    "🧘‍♀️ You're a mindfulness master! So peaceful!",
    "🌸 Your calm energy is beautiful!",
    "☁️ You found your inner peace like a cloud in the sky!",
    "🦋 Light as a butterfly, calm as the breeze!",
    "🌊 You flow like peaceful water!",
    "✨ Your mindful spirit shines bright!"
  ])

  const phaseDurations = {
    inhale: 4,
    hold: 4,
    exhale: 6
  }

  const totalCycles = 5

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && !isCompleted) {
      interval = setInterval(() => {
        setSeconds(seconds => {
          const nextSecond = seconds + 1
          const currentPhaseDuration = phaseDurations[phase]

          if (nextSecond >= currentPhaseDuration) {
            // Move to next phase
            if (phase === 'inhale') {
              setPhase('hold')
            } else if (phase === 'hold') {
              setPhase('exhale')
            } else if (phase === 'exhale') {
              setPhase('inhale')
              setCycle(prev => {
                const nextCycle = prev + 1
                if (nextCycle >= totalCycles) {
                  setIsCompleted(true)
                  setIsActive(false)
                  // Save session to backend and award XP/gems
                  saveBreathingSession(totalCycles)
                }
                return nextCycle
              })
            }
            return 0
          }
          return nextSecond
        })
      }, 1000)
    } else if (!isActive) {
      if (interval) clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, phase, isCompleted, dispatch])

  const handleStart = () => {
    setIsActive(true)
  }

  const handlePause = () => {
    setIsActive(false)
  }

  const handleReset = () => {
    setIsActive(false)
    setPhase('inhale')
    setSeconds(0)
    setCycle(0)
    setIsCompleted(false)
    setShowSuccess(false)
  }

  const saveBreathingSession = async (cyclesCompleted: number) => {
    try {
      const response = await fetch('/api/student/breathing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cycles_completed: cyclesCompleted
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update Redux store with actual values from backend
        dispatch(updateXP(result.xpGained || 10))
        dispatch(updateGems(result.gemsGained || 2))
        
        // Show success animation
        setShowSuccess(true)
      } else {
        const errorText = await response.text()
        console.error('Failed to save breathing session:', response.status, errorText)
        // Fallback to local rewards
        dispatch(updateXP(10))
        dispatch(updateGems(2))
        setShowSuccess(true) // Still show success for user experience
      }
    } catch (error: any) {
      console.error('Error saving breathing session:', error)
      // Fallback to local rewards
      dispatch(updateXP(10))
      dispatch(updateGems(2))
      setShowSuccess(true) // Still show success for user experience
    }
  }

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In'
      case 'hold':
        return 'Hold'
      case 'exhale':
        return 'Breathe Out'
    }
  }

  const getCircleScale = () => {
    const progress = seconds / phaseDurations[phase]
    if (phase === 'inhale') {
      return 0.5 + (progress * 0.5) // Scale from 0.5 to 1
    } else if (phase === 'exhale') {
      return 1 - (progress * 0.5) // Scale from 1 to 0.5
    }
    return 1 // Hold phase stays at full scale
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center relative overflow-hidden">
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 z-10"
              >
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                    <span className="font-bold text-base sm:text-lg">🧘‍♀️ Mindful Master! 🧘‍♂️</span>
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="text-sm sm:text-base">
                    You earned <strong>+10 XP</strong> and <strong>+2 Gems</strong>!
                  </div>
                  <div className="text-xs sm:text-sm opacity-90">
                    {celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <CardHeader className={showSuccess ? "pt-20" : ""}>
            <CardTitle className="text-2xl text-green-600">Well Done!</CardTitle>
            <CardDescription>You've completed your breathing exercise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-6xl">🌟</div>
            <div className="space-y-2">
              <p className="text-lg font-semibold">Rewards Earned:</p>
              <div className="flex justify-center space-x-4">
                <div className="bg-blue-100 px-3 py-1 rounded-full">
                  <span className="text-blue-600 font-medium">+10 XP</span>
                </div>
                <div className="bg-purple-100 px-3 py-1 rounded-full">
                  <span className="text-purple-600 font-medium">+2 Gems</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <ClientWrapper>
                <Button onClick={() => router.push('/student')} className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button onClick={handleReset} variant="outline" className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Do Another Session
                </Button>
              </ClientWrapper>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-1 sm:mb-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="text-2xl sm:text-3xl mr-2 sm:mr-3"
                >
                  🧘‍♀️
                </motion.div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">Mindful Breathing</h1>
              </div>
              <p className="text-blue-100 text-sm sm:text-base hidden sm:block">Find your inner peace through guided breathing exercises</p>
              <p className="text-blue-100 text-xs sm:hidden">Find inner peace</p>
            </div>
            <ClientWrapper>
              <Button 
                onClick={() => router.push('/student')} 
                variant="outline"
                className="ml-3 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm rounded-xl"
                size="sm"
              >
                <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Home</span>
              </Button>
            </ClientWrapper>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center min-h-[calc(100vh-200px)]"
        >
          <Card className="w-full max-w-lg shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center px-4 sm:px-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="text-lg sm:text-xl flex items-center justify-center text-blue-800">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  🌸
                </motion.div>
                4-4-6 Breathing Pattern
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-blue-600">
                Inhale for 4 seconds, hold for 4 seconds, exhale for 6 seconds
              </CardDescription>
            </CardHeader>
          <CardContent className="text-center space-y-6 sm:space-y-8 px-4 sm:px-6">
            {/* Progress */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-center">
                <div className="text-sm sm:text-base font-semibold text-blue-800 mb-2">
                  Cycle {cycle + 1} of {totalCycles}
                </div>
                <div className="flex justify-center space-x-1 mb-3">
                  {Array.from({ length: totalCycles }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                        i < cycle ? 'bg-blue-500' : i === cycle ? 'bg-blue-300 animate-pulse' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="w-full bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full h-3 sm:h-4 overflow-hidden">
                  <motion.div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: `${((cycle) / totalCycles) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Breathing Circle */}
            <div className="flex items-center justify-center relative">
              {/* Outer glow ring */}
              <motion.div
                className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: phaseDurations[phase],
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(99, 102, 241, 0.1) 70%, transparent 100%)'
                }}
              />
              
              {/* Main breathing circle */}
              <motion.div 
                className="w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold relative overflow-hidden"
                animate={{
                  scale: getCircleScale()
                }}
                transition={{
                  duration: 1,
                  ease: "easeInOut"
                }}
                style={{
                  boxShadow: '0 0 40px rgba(59, 130, 246, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Sparkle effects */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                      style={{
                        top: '20%',
                        left: '50%',
                        transformOrigin: '0 80px',
                        transform: `rotate(${i * 60}deg)`
                      }}
                    />
                  ))}
                </motion.div>
                
                <div className="text-center z-10 relative">
                  <motion.div 
                    className="text-lg sm:text-2xl font-bold mb-1"
                    key={phase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {getPhaseInstruction()}
                  </motion.div>
                  <motion.div 
                    className="text-2xl sm:text-3xl font-bold"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {phaseDurations[phase] - seconds}
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Instructions */}
            <motion.div 
              className="space-y-3 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                <motion.p 
                  className="text-lg sm:text-xl font-bold text-blue-800 mb-2"
                  key={phase}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {getPhaseInstruction()}
                </motion.p>
                <p className="text-sm sm:text-base text-blue-600">
                  Follow the expanding circle and breathe naturally
                </p>
              </div>
            </motion.div>

            {/* Controls */}
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <ClientWrapper>
                {!isActive ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={handleStart} 
                      size="lg" 
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
                    >
                      <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="text-sm sm:text-base font-semibold">Start Breathing</span>
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={handlePause} 
                      size="lg" 
                      variant="outline" 
                      className="w-full sm:w-auto border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <Pause className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="text-sm sm:text-base">Pause</span>
                    </Button>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={handleReset} 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="text-sm sm:text-base">Reset</span>
                  </Button>
                </motion.div>
              </ClientWrapper>
            </motion.div>

            {/* Tips */}
            <motion.div 
              className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5 rounded-xl border border-blue-100 text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center mb-3">
                <span className="text-lg mr-2">💡</span>
                <h4 className="font-bold text-blue-800 text-sm sm:text-base">Mindfulness Tips:</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 text-xs mt-1">🪑</span>
                  <span className="text-xs sm:text-sm text-blue-700">Sit comfortably</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 text-xs mt-1">👁️</span>
                  <span className="text-xs sm:text-sm text-blue-700">Close your eyes</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 text-xs mt-1">🧠</span>
                  <span className="text-xs sm:text-sm text-blue-700">Let thoughts pass</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 text-xs mt-1">👃</span>
                  <span className="text-xs sm:text-sm text-blue-700">Breathe through nose</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-white/50 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-600 text-center italic">
                  "Peace comes from within. Do not seek it without." - Buddha
                </p>
              </div>
            </motion.div>
          </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
