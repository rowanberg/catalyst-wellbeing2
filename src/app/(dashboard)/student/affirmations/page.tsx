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
  "I am brave and can handle anything that comes my way.",
  "I am kind to myself and others.",
  "I am learning and growing every day.",
  "I am unique and special just as I am.",
  "I am capable of amazing things.",
  "I choose to be positive and happy.",
  "I am a good friend and people enjoy being around me.",
  "I am strong and resilient.",
  "I believe in myself and my abilities.",
  "I am grateful for all the good things in my life.",
  "I am creative and full of great ideas.",
  "I am loved and I matter.",
  "I can make a positive difference in the world.",
  "I am confident and courageous.",
  "I choose to see the good in every situation.",
  "I am proud of my efforts and progress.",
  "I am worthy of respect and kindness.",
  "I can overcome challenges with patience and practice.",
  "I am a valuable member of my family and community.",
  "I radiate positivity and joy wherever I go."
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
      const response = await fetch('/api/student/affirmations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCompleted: true })
      })

      if (response.ok) {
        const data = await response.json()
        setSessionCount(data.sessionsCompleted)
        
        // Update Redux store with actual values from backend
        dispatch(updateXP(data.xpGained || 15))
        dispatch(updateGems(data.gemsGained || 3))
        
        // Show success animation
        setShowSuccess(true)
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
          
          if (data.sessionsCompleted >= 3) {
            setCompletedToday(true)
          }
        }, 3000)
      }
    } catch (error) {
      console.error('Error completing affirmation session:', error)
      // Fallback to local state update
      setSessionCount(prev => prev + 1)
      dispatch(updateXP(15))
      dispatch(updateGems(3))
      
      if (sessionCount >= 2) {
        setCompletedToday(true)
      }
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
                <ClientWrapper>
                  <Button onClick={() => router.push('/student')} className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                  <Button onClick={() => setCompletedToday(false)} variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Practice More
                  </Button>
                </ClientWrapper>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Positive Affirmations</h1>
              <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Build confidence and self-love with daily affirmations</p>
              <p className="text-xs text-gray-600 sm:hidden">Daily confidence building</p>
            </div>
            <ClientWrapper>
              <Button onClick={() => router.push('/student')} variant="outline" size="sm" className="ml-3">
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
        {/* Progress */}
        <Card className="mb-4 sm:mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-purple-800">Today's Progress</h3>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <span className="text-sm sm:text-base text-purple-700 font-medium">{sessionCount}/3 Sessions</span>
              </div>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2 sm:h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 sm:h-3 rounded-full transition-all duration-500"
                style={{ width: `${(sessionCount / 3) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Affirmation Card */}
        <motion.div
          key={affirmationIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg relative overflow-hidden">
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
            
            <CardHeader className={`text-center px-4 sm:px-6 ${showSuccess ? 'pt-20' : ''}`}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl sm:text-4xl mb-3 sm:mb-4"
              >
                💖
              </motion.div>
              <CardTitle className="text-lg sm:text-xl text-purple-800">Your Affirmation</CardTitle>
              <CardDescription className="text-sm sm:text-base">Take a deep breath and repeat this to yourself</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4 sm:space-y-6 px-4 sm:px-6">
              <motion.div
                className="min-h-[80px] sm:min-h-[100px] flex items-center justify-center px-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: isRevealed ? 1 : 0.3 }}
              >
                <p className="text-lg sm:text-2xl font-semibold text-gray-800 leading-relaxed max-w-2xl">
                  {isRevealed ? currentAffirmation : "Click 'Reveal Affirmation' to see your positive message"}
                </p>
              </motion.div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <ClientWrapper>
                  {!isRevealed ? (
                    <Button onClick={revealAffirmation} size="lg" className="bg-purple-500 hover:bg-purple-600 w-full sm:w-auto">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="text-sm sm:text-base">Reveal Affirmation</span>
                    </Button>
                  ) : (
                    <>
                      <Button onClick={completeSession} size="lg" className="bg-green-500 hover:bg-green-600 w-full sm:w-auto">
                        <Heart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        <span className="text-sm sm:text-base">I Believe This! (+15 XP, +3 Gems)</span>
                      </Button>
                      <Button onClick={getNewAffirmation} size="lg" variant="outline" className="w-full sm:w-auto">
                        <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        <span className="text-sm sm:text-base">New Affirmation</span>
                      </Button>
                    </>
                  )}
                </ClientWrapper>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Affirmation Categories */}
        <Card className="mb-4 sm:mb-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Affirmation Categories</CardTitle>
            <CardDescription className="text-sm sm:text-base">Different types of positive thoughts to explore</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {affirmationCategories.map((category, index) => (
                <motion.div
                  key={category.name}
                  whileHover={{ scale: 1.05 }}
                  className={`p-3 sm:p-4 rounded-lg bg-gradient-to-br ${category.color} border-2 border-transparent hover:border-purple-300 cursor-pointer transition-all`}
                >
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{category.emoji}</div>
                    <div className="font-semibold text-gray-800 text-sm sm:text-base">{category.name}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips for Affirmations */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">How to Use Affirmations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-800 mb-3">Tips for Success:</h4>
                <ul className="space-y-2 text-blue-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Say it out loud with confidence</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Look in a mirror while saying it</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Repeat it 3 times slowly</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Really feel the words as you say them</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-3">Why Affirmations Work:</h4>
                <ul className="space-y-2 text-blue-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>They help rewire your brain for positivity</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>They boost self-confidence and self-esteem</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>They help you focus on your strengths</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>They create a more positive mindset</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
