'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Heart, Sparkles, RefreshCw, Star } from 'lucide-react'
import { useAppDispatch } from '@/lib/redux/hooks'
import { updateXP, updateGems } from '@/lib/redux/slices/authSlice'
import { ClientWrapper } from '@/components/providers/ClientWrapper'

const affirmations = [
  // Self-Confidence & Self-Worth (15)
  "I am brave and can handle anything that comes my way.",
  "I am unique and special just as I am.",
  "I am capable of amazing things.",
  "I believe in myself and my abilities.",
  "I am confident and courageous.",
  "I am worthy of respect and kindness.",
  "I trust myself to make good decisions.",
  "I am proud of who I am becoming.",
  "I embrace my uniqueness and individuality.",
  "I am enough, just as I am.",
  "I have unlimited potential within me.",
  "I am powerful beyond measure.",
  "I trust my inner wisdom and intuition.",
  "I am deserving of all good things.",
  "I stand tall and proud of my achievements.",

  // Kindness & Compassion (10)
  "I am kind to myself and others.",
  "I am a good friend and people enjoy being around me.",
  "I spread kindness wherever I go.",
  "I treat myself with love and compassion.",
  "I am patient and understanding with myself.",
  "I forgive myself for my mistakes and learn from them.",
  "I choose to see the best in others.",
  "My heart is full of love and compassion.",
  "I am gentle with myself on tough days.",
  "I give myself permission to be imperfect.",

  // Growth & Learning (12)
  "I am learning and growing every day.",
  "I am proud of my efforts and progress.",
  "I can overcome challenges with patience and practice.",
  "Every mistake is a chance to learn and grow.",
  "I embrace new challenges with excitement.",
  "I am constantly improving and evolving.",
  "I learn something valuable from every experience.",
  "My potential is limitless and ever-growing.",
  "I am open to new ideas and perspectives.",
  "I celebrate my progress, no matter how small.",
  "I am becoming a better version of myself each day.",
  "I am curious and love to discover new things.",

  // Positivity & Happiness (10)
  "I choose to be positive and happy.",
  "I choose to see the good in every situation.",
  "I radiate positivity and joy wherever I go.",
  "I focus on what I can control and let go of what I can't.",
  "I attract positive energy and good vibes.",
  "I create my own happiness from within.",
  "I find joy in the simple things around me.",
  "My positive attitude creates positive outcomes.",
  "I am surrounded by love and positivity.",
  "I choose happiness and peace of mind.",

  // Strength & Resilience (10)
  "I am strong and resilient.",
  "I bounce back from setbacks stronger than before.",
  "I have the strength to face any challenge.",
  "I am tougher than any obstacle in my path.",
  "I rise above negativity with grace.",
  "I am unshakeable in my core beliefs.",
  "I turn difficulties into opportunities.",
  "I am a warrior, not a worrier.",
  "My strength comes from within.",
  "I persevere through challenges with determination.",

  // Gratitude & Appreciation (8)
  "I am grateful for all the good things in my life.",
  "I appreciate the love and support around me.",
  "I am thankful for my unique talents and gifts.",
  "I recognize and celebrate my daily blessings.",
  "I am grateful for the lessons life teaches me.",
  "I appreciate my body and all it does for me.",
  "I am thankful for this moment and this day.",
  "I count my blessings instead of my worries.",

  // Creativity & Expression (6)
  "I am creative and full of great ideas.",
  "My imagination knows no bounds.",
  "I express myself freely and authentically.",
  "I am an artist painting my own life canvas.",
  "My creativity flows naturally and effortlessly.",
  "I bring my unique vision to everything I create.",

  // Purpose & Impact (7)
  "I am loved and I matter.",
  "I can make a positive difference in the world.",
  "I am a valuable member of my family and community.",
  "My presence makes a difference in the world.",
  "I have important gifts to share with others.",
  "I inspire others by being my authentic self.",
  "The world is a better place because I am in it."
]

export default function AffirmationsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [currentAffirmation, setCurrentAffirmation] = useState('')
  const [affirmationIndex, setAffirmationIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [completedToday, setCompletedToday] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [celebrationMessages] = useState([
    "🌟 You're absolutely radiant! Your positive energy is contagious!",
    "💫 You're a shining star! Keep believing in yourself!",
    "🌈 Your self-love creates beautiful rainbows in the world!",
    "🦋 You're as beautiful as a butterfly spreading joy!",
    "🌸 Your confidence blooms like the most beautiful flower!",
    "✨ You sparkle with inner strength and beauty!"
  ])

  useEffect(() => {
    // Set initial affirmation
    setCurrentAffirmation(affirmations[0])
    
    // Fetch today's progress
    fetchTodayProgress()
  }, [])

  const fetchTodayProgress = async () => {
    try {
      const response = await fetch('/api/student/affirmations')
      if (response.ok) {
        const data = await response.json()
        setSessionCount(data.sessionsCompleted)
        if (data.sessionsCompleted >= 3) {
          setCompletedToday(true)
        }
      }
    } catch (error) {
      console.error('Error fetching affirmation progress:', error)
    }
  }

  const getNewAffirmation = () => {
    const newIndex = Math.floor(Math.random() * affirmations.length)
    setAffirmationIndex(newIndex)
    setCurrentAffirmation(affirmations[newIndex])
    setIsRevealed(false)
  }

  const revealAffirmation = () => {
    setIsRevealed(true)
  }

  const completeSession = async () => {
    try {
      console.log('[Affirmations Frontend] Starting completeSession...')
      
      const response = await fetch('/api/student/affirmations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCompleted: true })
      })

      console.log('[Affirmations Frontend] Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[Affirmations Frontend] Response data:', data)
        
        setSessionCount(data.sessionsCompleted)
        
        // Update Redux store with actual values from backend
        const xpGained = data.xpGained || 15
        const gemsGained = data.gemsGained || 3
        
        console.log('[Affirmations Frontend] Dispatching updates:', { xpGained, gemsGained })
        dispatch(updateXP(xpGained))
        dispatch(updateGems(gemsGained))
        
        // Show success animation
        setShowSuccess(true)
        console.log('[Affirmations Frontend] ✅ Success animation shown')
        
        // Show warning if wallet update failed
        if (data.warning) {
          console.warn('[Affirmations Frontend] Warning:', data.warning)
          alert(data.warning)
        }
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
          
          if (data.sessionsCompleted >= 3) {
            setCompletedToday(true)
          }
        }, 3000)
      } else {
        const errorData = await response.json()
        console.error('[Affirmations Frontend] API error:', errorData)
        alert(`Failed to record session: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('[Affirmations Frontend] Error completing affirmation session:', error)
      alert('Network error: Could not connect to server. Please try again.')
      
      // Fallback to local state update
      setSessionCount(prev => prev + 1)
      dispatch(updateXP(15))
      dispatch(updateGems(3))
      
      // Show success animation even on error (local fallback)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        if (sessionCount >= 2) {
          setCompletedToday(true)
        }
      }, 3000)
    }
  }

  const affirmationCategories = [
    { name: "Self-Confidence", emoji: "💪", color: "from-blue-100 to-blue-200" },
    { name: "Kindness", emoji: "💖", color: "from-pink-100 to-pink-200" },
    { name: "Growth", emoji: "🌱", color: "from-green-100 to-green-200" },
    { name: "Courage", emoji: "🦁", color: "from-yellow-100 to-yellow-200" },
    { name: "Gratitude", emoji: "🙏", color: "from-purple-100 to-purple-200" },
    { name: "Joy", emoji: "😊", color: "from-orange-100 to-orange-200" }
  ]

  // Render completed state
  if (completedToday) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="w-full max-w-md">
            <CardHeader>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🌟
              </motion.div>
              <CardTitle className="text-2xl text-purple-600">Amazing Work!</CardTitle>
              <CardDescription>You've completed your daily affirmations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg">
                <p className="text-purple-800 font-semibold">Today's Rewards:</p>
                <div className="flex justify-center space-x-4 mt-2">
                  <div className="bg-blue-100 px-3 py-1 rounded-full">
                    <span className="text-blue-600 font-medium">+45 XP</span>
                  </div>
                  <div className="bg-purple-100 px-3 py-1 rounded-full">
                    <span className="text-purple-600 font-medium">+9 Gems</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Button onClick={() => router.push('/student')} className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button onClick={() => setCompletedToday(false)} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Practice More
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Render main affirmations interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100">
      {/* Header - Enhanced with better mobile padding */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-sm shadow-md border-b sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ✨ Positive Affirmations
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">
                Build confidence and self-love with daily affirmations
              </p>
              <p className="text-xs text-gray-500 mt-1 sm:hidden">Daily confidence building • {sessionCount}/3 sessions</p>
            </div>
            <Button 
              onClick={() => router.push('/student')} 
              variant="outline" 
              size="sm" 
              className="ml-3 hover:scale-105 transition-transform shadow-sm"
            >
              <Home className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Progress - Enhanced with animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 sm:mb-10 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 border-2 border-purple-200 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-bl-full" />
            <CardContent className="pt-6 pb-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Star className="h-6 w-6 text-yellow-500" fill="currentColor" />
                  </motion.div>
                  <h3 className="text-lg sm:text-xl font-bold text-purple-900">Today's Progress</h3>
                </div>
                <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-2xl sm:text-3xl font-bold text-purple-700">{sessionCount}</span>
                  <span className="text-sm text-purple-600">of 3 sessions</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-purple-200/50 rounded-full h-4 shadow-inner">
                  <motion.div 
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 h-4 rounded-full shadow-lg relative overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: `${(sessionCount / 3) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </motion.div>
                </div>
                <p className="text-xs sm:text-sm text-purple-600 mt-2 text-center font-medium">
                  {sessionCount === 0 && "Start your journey to positivity! 🌱"}
                  {sessionCount === 1 && "Great start! Keep going! 🌟"}
                  {sessionCount === 2 && "Almost there! One more to go! 🎯"}
                  {sessionCount >= 3 && "Mission complete! You're amazing! 🎉"}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Affirmation Card - Enhanced */}
        <motion.div
          key={affirmationIndex}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-6 sm:mb-10"
        >
          <Card className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 border-2 border-purple-200 shadow-2xl relative overflow-hidden backdrop-blur-sm">
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 z-10"
                >
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <Sparkles className="h-5 w-5 animate-pulse" />
                      <span className="font-bold text-base sm:text-lg">🌟 Self-Love Champion! 🌟</span>
                      <Sparkles className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="text-sm sm:text-base">
                      You earned <strong>+15 XP</strong> and <strong>+3 Gems</strong>!
                    </div>
                    <div className="text-xs sm:text-sm opacity-90">
                      {celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <CardHeader className={`text-center px-4 sm:px-8 ${showSuccess ? 'pt-24' : 'pt-8'}`}>
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-5xl sm:text-6xl mb-4 sm:mb-6 filter drop-shadow-lg"
              >
                💖
              </motion.div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Your Daily Affirmation
              </CardTitle>
              <CardDescription className="text-sm sm:text-lg text-gray-600 font-medium">
                Take a deep breath, relax, and embrace this positive message 🌟
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6 sm:space-y-8 px-4 sm:px-8 pb-8">
              <motion.div
                className="min-h-[120px] sm:min-h-[140px] flex items-center justify-center px-4 py-6 rounded-2xl relative"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: isRevealed ? 1 : 0.4,
                  scale: isRevealed ? 1 : 0.95
                }}
                transition={{ duration: 0.3 }}
                style={{
                  background: isRevealed 
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)'
                    : 'transparent'
                }}
              >
                {!isRevealed && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl blur-xl"
                  />
                )}
                <p className="text-xl sm:text-3xl font-bold text-gray-800 leading-relaxed max-w-3xl relative z-10 px-2">
                  {isRevealed ? (
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      "{currentAffirmation}"
                    </motion.span>
                  ) : (
                    <span className="text-base sm:text-xl text-gray-500 italic">
                      ✨ Click 'Reveal Affirmation' to discover your positive message ✨
                    </span>
                  )}
                </p>
              </motion.div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                {!isRevealed ? (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto"
                  >
                    <Button 
                      onClick={revealAffirmation} 
                      size="lg" 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all py-6 sm:py-7 px-8"
                    >
                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2 animate-pulse" />
                      Reveal Affirmation
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto"
                    >
                      <Button 
                        onClick={completeSession} 
                        size="lg" 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 w-full sm:w-auto text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all py-6 sm:py-7 px-6"
                      >
                        <Heart className="h-5 w-5 sm:h-6 sm:w-6 mr-2" fill="currentColor" />
                        <span className="hidden sm:inline">I Believe This! (+15 XP, +3 Gems)</span>
                        <span className="sm:hidden">Believe! (+15 XP)</span>
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto"
                    >
                      <Button 
                        onClick={getNewAffirmation} 
                        size="lg" 
                        variant="outline" 
                        className="w-full sm:w-auto border-2 border-purple-300 hover:bg-purple-50 text-base sm:text-lg font-semibold py-6 sm:py-7 px-6"
                      >
                        <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                        New Affirmation
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Affirmation Categories - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6 sm:mb-10 border-2 border-purple-100 shadow-lg overflow-hidden">
            <CardHeader className="px-4 sm:px-8 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-xl sm:text-2xl font-bold text-purple-900 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Affirmation Categories
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-700 mt-2">
                Explore different types of positive thoughts and messages ✨
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-8 py-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                {affirmationCategories.map((category, index) => (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                    whileHover={{ scale: 1.08, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-4 sm:p-6 rounded-2xl bg-gradient-to-br ${category.color} border-2 border-white shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 relative overflow-hidden group`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="text-center relative z-10">
                      <motion.div 
                        className="text-3xl sm:text-4xl mb-2 sm:mb-3"
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                      >
                        {category.emoji}
                      </motion.div>
                      <div className="font-bold text-gray-800 text-sm sm:text-base">{category.name}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips for Affirmations - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-lg overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <CardHeader className="px-4 sm:px-8 pt-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-blue-900 flex items-center gap-2">
                <Heart className="h-6 w-6 text-blue-600" fill="currentColor" />
                How to Use Affirmations
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-700 mt-2">
                Master the art of positive self-talk with these proven techniques
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/60 backdrop-blur-sm p-5 sm:p-6 rounded-2xl shadow-md border border-blue-100"
                >
                  <h4 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
                    <span className="text-2xl">💡</span>
                    Tips for Success
                  </h4>
                  <ul className="space-y-3 text-blue-800">
                    <motion.li 
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-blue-50/50 transition-colors"
                    >
                      <span className="text-blue-600 text-xl font-bold">🗣️</span>
                      <span className="text-sm sm:text-base">Say it out loud with confidence and conviction</span>
                    </motion.li>
                    <motion.li 
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-blue-50/50 transition-colors"
                    >
                      <span className="text-blue-600 text-xl font-bold">🪞</span>
                      <span className="text-sm sm:text-base">Look in a mirror while saying it to yourself</span>
                    </motion.li>
                    <motion.li 
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-blue-50/50 transition-colors"
                    >
                      <span className="text-blue-600 text-xl font-bold">🔄</span>
                      <span className="text-sm sm:text-base">Repeat it 3 times slowly and mindfully</span>
                    </motion.li>
                    <motion.li 
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-blue-50/50 transition-colors"
                    >
                      <span className="text-blue-600 text-xl font-bold">❤️</span>
                      <span className="text-sm sm:text-base">Really feel the words and believe in them</span>
                    </motion.li>
                    <motion.li 
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-blue-50/50 transition-colors"
                    >
                      <span className="text-blue-600 text-xl font-bold">🌅</span>
                      <span className="text-sm sm:text-base">Practice daily, especially in the morning</span>
                    </motion.li>
                  </ul>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/60 backdrop-blur-sm p-5 sm:p-6 rounded-2xl shadow-md border border-purple-100"
                >
                  <h4 className="font-bold text-purple-900 mb-4 text-lg flex items-center gap-2">
                    <span className="text-2xl">🧠</span>
                    Why Affirmations Work
                  </h4>
                  <ul className="space-y-3 text-purple-800">
                    <motion.li 
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-purple-50/50 transition-colors"
                    >
                      <span className="text-purple-600 text-xl font-bold">🔮</span>
                      <span className="text-sm sm:text-base">Rewire your brain for positive thinking patterns</span>
                    </motion.li>
                    <motion.li 
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-purple-50/50 transition-colors"
                    >
                      <span className="text-purple-600 text-xl font-bold">💪</span>
                      <span className="text-sm sm:text-base">Boost self-confidence and self-esteem daily</span>
                    </motion.li>
                    <motion.li 
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-purple-50/50 transition-colors"
                    >
                      <span className="text-purple-600 text-xl font-bold">🎯</span>
                      <span className="text-sm sm:text-base">Help you focus on your unique strengths</span>
                    </motion.li>
                    <motion.li 
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-purple-50/50 transition-colors"
                    >
                      <span className="text-purple-600 text-xl font-bold">🌈</span>
                      <span className="text-sm sm:text-base">Create a more optimistic and joyful mindset</span>
                    </motion.li>
                    <motion.li 
                      whileHover={{ x: 5 }}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-purple-50/50 transition-colors"
                    >
                      <span className="text-purple-600 text-xl font-bold">✨</span>
                      <span className="text-sm sm:text-base">Reduce stress and increase emotional resilience</span>
                    </motion.li>
                  </ul>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
