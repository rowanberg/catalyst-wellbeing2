'use client'

import React, { useState, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { MoodHistoryTracker } from '@/components/student/MoodHistoryTracker'
import {
  Heart, Smile, Frown, Meh, Angry, Laugh, Shield, AlertCircle,
  Wind, Sparkles, Moon, Droplets, Brain, HelpCircle, ChevronRight,
  Activity, Clock, TrendingUp, Star, Send, MessageSquare, Lock, CheckCircle2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface WellbeingTabProps {
  data: any
  loading: boolean
  error: string | null
  onRefresh: () => void
  profile: any
}

const moods = [
  { id: 'amazing', emoji: '😄', label: 'Amazing', color: 'from-green-400 to-emerald-500', icon: Laugh },
  { id: 'good', emoji: '😊', label: 'Good', color: 'from-blue-400 to-cyan-500', icon: Smile },
  { id: 'okay', emoji: '😐', label: 'Okay', color: 'from-yellow-400 to-amber-500', icon: Meh },
  { id: 'sad', emoji: '😢', label: 'Sad', color: 'from-orange-400 to-red-500', icon: Frown },
  { id: 'stressed', emoji: '😰', label: 'Stressed', color: 'from-red-400 to-pink-500', icon: Angry },
]

export function WellbeingTab({ data, loading, error, onRefresh, profile }: WellbeingTabProps) {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [moodLocked, setMoodLocked] = useState(false)
  const [petAnimation, setPetAnimation] = useState('idle')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState({ title: '', description: '', type: 'success' as 'success' | 'error' | 'warning' })
  const [showConfetti, setShowConfetti] = useState(false)
  const [greeting, setGreeting] = useState({ title: 'Your Well-being Matters 💙', message: 'You\'re amazing just as you are. Let\'s take care of your heart and mind together 🌟' })
  const controls = useAnimation()

  // Prepare data before hooks
  const wellbeingData = data || {
    mood: { current: null, lockedDate: null },
    pet: { name: 'Whiskers', happiness: 50 },
    mindfulness: { sessionsToday: 0, totalSessions: 0 },
    safety: { quizCompleted: false, pledgeSigned: false }
  }

  const moodOptions = [
    { id: 'happy', emoji: '😊', label: 'Happy', color: '#10b981, #14b8a6' },
    { id: 'excited', emoji: '🤩', label: 'Excited', color: '#f97316, #ec4899' },
    { id: 'calm', emoji: '😌', label: 'Calm', color: '#0ea5e9, #3b82f6' },
    { id: 'sad', emoji: '😢', label: 'Sad', color: '#6366f1, #8b5cf6' },
    { id: 'angry', emoji: '😠', label: 'Angry', color: '#ef4444, #dc2626' },
    { id: 'anxious', emoji: '😰', label: 'Anxious', color: '#8b5cf6, #ec4899' }
  ]

  // Function to get mood-specific greeting
  const getMoodGreeting = useCallback((moodId: string) => {
    const firstName = profile?.full_name?.split(' ')[0] || 'friend'

    const moodGreetings: Record<string, { title: string, message: string }> = {
      happy: {
        title: 'Wonderful to See You Happy! 😊',
        message: `That's amazing, ${firstName}! Your joy is contagious. Keep spreading that positive energy! Remember, happiness grows when shared. 🌟✨`
      },
      excited: {
        title: 'Your Energy is Electric! 🤩',
        message: `Wow, ${firstName}! That excitement is absolutely incredible! Channel that energy into something amazing today. The world needs your enthusiasm! ⚡🎉`
      },
      calm: {
        title: 'Peace Looks Good on You 😌',
        message: `Beautiful, ${firstName}. Inner calm is a superpower. Take this moment to breathe, reflect, and appreciate the peace you've found. 🧘‍♀️💙`
      },
      sad: {
        title: 'We\'re Here for You 😢',
        message: `${firstName}, it's okay to feel sad. You're brave for acknowledging it. Remember, this feeling is temporary, and you're never alone. We're here to support you. 💙🫂`
      },
      angry: {
        title: 'Your Feelings Are Valid 😠',
        message: `${firstName}, it's okay to feel angry. Let's find healthy ways to process this. Take some deep breaths, and remember you're in control. We're here to help. 🌊💪`
      },
      anxious: {
        title: 'You\'re Safe and Supported 😰',
        message: `${firstName}, anxiety can be overwhelming, but you're stronger than you think. Let's work through this together. Try some breathing exercises - you've got this! 🌈🤗`
      }
    }

    return moodGreetings[moodId] || {
      title: 'Thank You for Sharing! 💙',
      message: `${firstName}, we appreciate you checking in with us. Your well-being matters! 🌟`
    }
  }, [profile])

  // Set time-reactive greeting (persists for session)
  useEffect(() => {
    const hour = new Date().getHours()
    const firstName = profile?.full_name?.split(' ')[0] || 'friend'

    // Check if we have a stored mood greeting first
    const storedMoodGreeting = sessionStorage.getItem('wellbeing-mood-greeting')
    if (storedMoodGreeting) {
      setGreeting(JSON.parse(storedMoodGreeting))
      return
    }

    const greetings = {
      morning: [
        { title: 'Good Morning, Sunshine! ☀️', message: `Hey ${firstName}! You're starting a new day full of possibilities. Let's make it amazing together! 🌟` },
        { title: 'Rise & Shine! 🌅', message: `Morning, ${firstName}! You're capable of incredible things today. Let's take care of your beautiful mind! 💙` },
        { title: 'Fresh Start! 🌸', message: `Good morning, ${firstName}! Every day is a chance to be your best self. We're here to support you! ✨` },
        { title: 'New Day, New You! 🦋', message: `Hey ${firstName}! Your feelings matter, and so do you. Let's make today wonderful! 🌈` }
      ],
      afternoon: [
        { title: 'You\'re Doing Great! 🌟', message: `Hey ${firstName}! Halfway through the day and you're doing amazing. Keep being awesome! 💪` },
        { title: 'Keep Shining! ✨', message: `Hi ${firstName}! Remember, you're braver than you believe and stronger than you seem. We believe in you! 💙` },
        { title: 'You Matter! 💙', message: `Afternoon, ${firstName}! Your well-being is important to us. Let's check in on how you're feeling! 🌸` },
        { title: 'Stay Strong! 🌈', message: `Hey ${firstName}! You're making progress every single day. We're proud of you! ⭐` }
      ],
      evening: [
        { title: 'You Did Amazing! 🌙', message: `Evening, ${firstName}! Take a moment to appreciate everything you accomplished today. You're incredible! ✨` },
        { title: 'Wind Down Time! 🌆', message: `Hi ${firstName}! It's okay to rest now. You've earned it. Let's reflect on your day together! 💙` },
        { title: 'You\'re Enough! 💫', message: `Good evening, ${firstName}! Remember, you're perfect just as you are. Let's take care of your heart! 🌟` },
        { title: 'Proud of You! 🌸', message: `Hey ${firstName}! Another day of growth and learning. You should be proud of yourself! 🦋` }
      ]
    }

    let timeOfDay: 'morning' | 'afternoon' | 'evening'
    if (hour < 12) {
      timeOfDay = 'morning'
    } else if (hour < 17) {
      timeOfDay = 'afternoon'
    } else {
      timeOfDay = 'evening'
    }

    // Check if we have a stored greeting for this time period
    const storedGreeting = sessionStorage.getItem('wellbeing-greeting')
    const storedTimePeriod = sessionStorage.getItem('wellbeing-time-period')

    if (storedGreeting && storedTimePeriod === timeOfDay) {
      // Use stored greeting if same time period
      setGreeting(JSON.parse(storedGreeting))
    } else {
      // Pick new random greeting and store it
      const greetingOptions = greetings[timeOfDay]
      const randomGreeting = greetingOptions[Math.floor(Math.random() * greetingOptions.length)]
      setGreeting(randomGreeting)
      sessionStorage.setItem('wellbeing-greeting', JSON.stringify(randomGreeting))
      sessionStorage.setItem('wellbeing-time-period', timeOfDay)
    }
  }, [profile])

  // Helper function to show toast
  const showToastMessage = useCallback((title: string, description: string, type: 'success' | 'error' | 'warning') => {
    setToastMessage({ title, description, type })
    setShowToast(true)
    setTimeout(() => setShowToast(false), 4000)
  }, [])

  // ALL HOOKS BEFORE CONDITIONAL RETURNS
  const handleMoodUpdate = useCallback(async (moodId: string) => {
    const today = new Date().toISOString().split('T')[0]

    // Check if mood is already locked for today
    if (wellbeingData.mood?.lockedDate === today) {
      const firstName = profile?.full_name?.split(' ')[0] || 'there'
      showToastMessage(
        '🌅 Already Logged!',
        `Hey ${firstName}, you've already shared your mood today. See you tomorrow! 💫`,
        'warning'
      )
      return
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10)
    }

    try {
      const response = await fetch('/api/student/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: moodId })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Mood update result:', result)

        setSelectedMood(moodId)
        setMoodLocked(true) // Lock all moods immediately

        // Update greeting with mood-specific message
        const moodGreeting = getMoodGreeting(moodId)
        setGreeting(moodGreeting)
        sessionStorage.setItem('wellbeing-mood-greeting', JSON.stringify(moodGreeting))
        // Clear time-based greeting
        sessionStorage.removeItem('wellbeing-greeting')
        sessionStorage.removeItem('wellbeing-time-period')

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([10, 50, 10])
        }

        // Show celebration confetti
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)

        // Show success toast with personalized message
        const moodLabel = moodOptions.find(m => m.id === moodId)?.label || 'Mood'
        const firstName = profile?.full_name?.split(' ')[0] || 'there'
        const encouragingPhrases = [
          `Great job checking in, ${firstName}! 🌟`,
          `Thanks for sharing, ${firstName}! 💙`,
          `Awesome, ${firstName}! Keep tracking your feelings! 🎯`,
          `Proud of you for sharing, ${firstName}! ✨`
        ]
        const randomPhrase = encouragingPhrases[Math.floor(Math.random() * encouragingPhrases.length)]
        showToastMessage(
          '✅ Mood Logged!',
          `You're feeling ${moodLabel.toLowerCase()} today. ${randomPhrase}`,
          'success'
        )

        onRefresh()
      } else {
        const errorData = await response.json()
        showToastMessage(
          '❌ Oops!',
          errorData.error || 'Failed to save mood. Please try again.',
          'error'
        )
      }
    } catch (error) {
      console.error('Failed to update mood:', error)
      showToastMessage(
        '❌ Connection Error',
        'Could not save mood. Check your internet connection.',
        'error'
      )
    }
  }, [wellbeingData.mood?.lockedDate, onRefresh, moodOptions, showToastMessage, getMoodGreeting, profile])

  const handlePetInteraction = useCallback(() => {
    setPetAnimation('happy')
    controls.start({
      scale: [1, 1.15, 1],
      rotate: [0, -10, 10, -10, 0],
      transition: { duration: 0.6 }
    })

    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10])
    }

    setTimeout(() => setPetAnimation('idle'), 1000)
  }, [controls])

  // NOW SAFE FOR CONDITIONAL RETURNS
  if (loading && !data) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-32 rounded-3xl animate-pulse" style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }} />
        <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={onRefresh}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8 relative">
      {/* Toast Notification - Mobile-optimized */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:max-w-md mx-auto px-2"
          >
            <div
              className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl overflow-hidden"
              style={toastMessage.type === 'success' ? {
                background: 'linear-gradient(135deg, #10b981, #14b8a6)'
              } : toastMessage.type === 'warning' ? {
                background: 'linear-gradient(135deg, #f59e0b, #f97316)'
              } : {
                background: 'linear-gradient(135deg, #ef4444, #dc2626)'
              }}
            >
              {/* Decorative glow effect */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

              <div className="relative flex items-start gap-2.5 sm:gap-3">
                <motion.div
                  className="text-2xl sm:text-3xl flex-shrink-0"
                  animate={toastMessage.type === 'success' ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {toastMessage.type === 'success' && '🎉'}
                  {toastMessage.type === 'error' && '⚠️'}
                  {toastMessage.type === 'warning' && '💭'}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base mb-0.5 text-white truncate" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                    {toastMessage.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/95 leading-snug" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                    {toastMessage.description}
                  </p>
                </div>
                <button
                  onClick={() => setShowToast(false)}
                  className="text-white/70 hover:text-white transition-colors p-0.5 sm:p-1 hover:bg-white/10 rounded-lg flex-shrink-0"
                >
                  <span className="text-lg sm:text-xl leading-none">×</span>
                </button>
              </div>

              {/* Progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-0.5 sm:h-1 bg-white/30"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Gradient Hero with Time-Reactive Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 text-white shadow-xl"
        style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {greeting.title}
        </h1>
        <p className="text-white/95 text-sm sm:text-base leading-relaxed">
          {greeting.message}
        </p>
      </motion.div>

      {/* Desktop: 2-column grid, Mobile: stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Mood Tracker - Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden h-full">
            <CardHeader style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-highlight) 30%, transparent), color-mix(in srgb, var(--theme-tertiary) 30%, transparent))' }}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg shadow-md" style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))' }}>
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">How are you feeling?</CardTitle>
                  {wellbeingData.mood?.current && (
                    <p className="text-sm text-slate-600 mt-0.5">
                      Current: {wellbeingData.mood.current}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Confetti Effect */}
              <AnimatePresence>
                {showConfetti && (
                  <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{
                          y: '50%',
                          x: `${50 + (Math.random() - 0.5) * 20}%`,
                          opacity: 1,
                          scale: 1
                        }}
                        animate={{
                          y: '-20%',
                          x: `${50 + (Math.random() - 0.5) * 100}%`,
                          opacity: 0,
                          scale: 0,
                          rotate: Math.random() * 360
                        }}
                        transition={{
                          duration: 2 + Math.random(),
                          ease: 'easeOut'
                        }}
                        className="absolute"
                        style={{
                          left: `${Math.random() * 100}%`,
                          fontSize: '24px'
                        }}
                      >
                        {['🎉', '✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 5)]}
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {moodOptions.map((mood, index) => {
                  const isSelected = selectedMood === mood.id || wellbeingData.mood?.current === mood.id
                  const today = new Date().toISOString().split('T')[0]
                  const isLocked = moodLocked || wellbeingData.mood?.lockedDate === today

                  return (
                    <button
                      key={mood.id}
                      disabled={isLocked && !isSelected}
                      onClick={() => !isLocked && handleMoodUpdate(mood.id)}
                      className={cn(
                        "relative p-3 rounded-xl text-center transition-all duration-200 h-[105px] flex flex-col justify-center items-center touch-manipulation",
                        isSelected
                          ? "shadow-lg ring-2 ring-offset-1"
                          : isLocked
                            ? "bg-slate-50 cursor-not-allowed opacity-40"
                            : "bg-white border-2 border-slate-200 hover:shadow-md hover:border-slate-300 active:shadow-sm"
                      )}
                      style={isSelected ? {
                        background: `linear-gradient(135deg, ${mood.color})`,
                        borderWidth: '0px',
                        borderColor: 'transparent'
                      } : {}}
                    >
                      {/* Lock Icon for Locked Non-Selected Cards */}
                      {isLocked && !isSelected && (
                        <div className="absolute top-1.5 right-1.5">
                          <Lock className="h-3 w-3 text-slate-400" />
                        </div>
                      )}

                      {/* Emoji - static */}
                      <div className="text-4xl mb-1.5">
                        {mood.emoji}
                      </div>

                      {/* Label */}
                      <div
                        className={cn(
                          "text-sm font-extrabold",
                          isSelected ? "text-white" : "text-slate-700"
                        )}
                        style={isSelected ? { textShadow: '0 2px 4px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.6)' } : {}}
                      >
                        {mood.label}
                      </div>

                      {/* Selected Badge */}
                      {isSelected && (
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 text-[10px] font-extrabold text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap"
                          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>Today</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {wellbeingData.mood?.lockedDate === new Date().toISOString().split('T')[0] && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-xs text-slate-500 mt-3 bg-slate-50 px-3 py-1.5 rounded-lg"
                >
                  🌅 Resets tomorrow morning
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Virtual Pet - Right Column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden h-full">
            <CardHeader style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-tertiary) 30%, transparent), color-mix(in srgb, var(--theme-accent) 30%, transparent))' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg shadow-md" style={{ background: 'linear-gradient(to bottom right, var(--theme-secondary), var(--theme-accent))' }}>
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{wellbeingData.pet?.name || 'Your Pet'}</CardTitle>
                    <p className="text-sm text-slate-600 mt-0.5">
                      Virtual companion
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/student/pet')}
                  className="hidden sm:flex"
                  style={{ backgroundColor: 'var(--theme-highlight)', borderColor: 'var(--theme-accent)', color: 'var(--theme-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--theme-highlight)'}
                >
                  Care
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center">
                <motion.div
                  className="text-8xl mb-4 inline-block cursor-pointer select-none"
                  animate={controls}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePetInteraction}
                >
                  🐱
                </motion.div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-slate-700 mb-2">
                    <span className="font-medium">Happiness Level</span>
                    <span className="font-bold text-amber-600">
                      {wellbeingData.pet?.happiness || 0}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={wellbeingData.pet?.happiness || 0} className="h-3" />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${wellbeingData.pet?.happiness || 0}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="absolute top-0 left-0 h-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-2 font-medium">
                    {wellbeingData.pet?.happiness >= 90 && "🌟 Super Happy!"}
                    {wellbeingData.pet?.happiness >= 70 && wellbeingData.pet?.happiness < 90 && "😊 Very Happy"}
                    {wellbeingData.pet?.happiness >= 50 && wellbeingData.pet?.happiness < 70 && "🙂 Content"}
                    {wellbeingData.pet?.happiness < 50 && "😔 Needs attention"}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-100">
                  <p className="text-sm text-slate-700">
                    Tap {wellbeingData.pet?.name} to interact! Complete quests to keep them happy.
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/student/pet')}
                  className="w-full mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white sm:hidden"
                >
                  Care for Pet
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mood History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <MoodHistoryTracker className="mb-6" />
      </motion.div>

      {/* Mindfulness Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-md">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Mindfulness Activities</CardTitle>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {wellbeingData.mindfulness?.sessionsToday || 0} sessions today
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className="w-full justify-start h-auto p-4 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-2 border-blue-200 hover:border-blue-300 text-slate-800 shadow-sm hover:shadow-md transition-all"
                  variant="outline"
                  onClick={() => router.push('/student/breathing')}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Wind className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm">Breathing</p>
                      <p className="text-xs text-slate-600 mt-0.5">Calm your mind</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-blue-400" />
                  </div>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className="w-full justify-start h-auto p-4 bg-gradient-to-br from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 border-2 border-pink-200 hover:border-pink-300 text-slate-800 shadow-sm hover:shadow-md transition-all"
                  variant="outline"
                  onClick={() => router.push('/student/affirmations')}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Sparkles className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm">Affirmations</p>
                      <p className="text-xs text-slate-600 mt-0.5">Boost confidence</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-pink-400" />
                  </div>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className="w-full justify-start h-auto p-4 bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border-2 border-amber-200 hover:border-amber-300 text-slate-800 shadow-sm hover:shadow-md transition-all"
                  variant="outline"
                  onClick={() => router.push('/student/gratitude')}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Heart className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm">Gratitude</p>
                      <p className="text-xs text-slate-600 mt-0.5">Appreciate life</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-amber-400" />
                  </div>
                </Button>
              </motion.div>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    {wellbeingData.mindfulness?.sessionsToday || 0}
                  </div>
                  <p className="text-xs text-slate-600">Today</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600 mb-1">
                    {wellbeingData.mindfulness?.totalSessions || 0}
                  </div>
                  <p className="text-xs text-slate-600">All Time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Desktop: 2 columns for Digital Safety and Help, Mobile: stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Digital Safety */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden h-full">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg shadow-md">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Digital Safety</CardTitle>
                  <p className="text-sm text-slate-600 mt-0.5">Stay safe online</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-white rounded-xl border-2 border-cyan-200 hover:border-cyan-300 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => router.push('/student/digital-citizenship')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-cyan-100 rounded-lg">
                        <Shield className="h-5 w-5 text-cyan-600" />
                      </div>
                      <h4 className="font-semibold text-slate-800">Safety Quiz</h4>
                    </div>
                    {wellbeingData.safety?.quizCompleted && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">✓ Done</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    Test your knowledge about online safety
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cyan-600 font-medium">
                      {wellbeingData.safety?.quizCompleted ? 'Retake Quiz' : 'Start Quiz'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-cyan-400" />
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 bg-white rounded-xl border-2 border-pink-200 hover:border-pink-300 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => router.push('/student/anti-bullying')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Heart className="h-5 w-5 text-pink-600" />
                      </div>
                      <h4 className="font-semibold text-slate-800">Kindness Pledge</h4>
                    </div>
                    {wellbeingData.safety?.pledgeSigned && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">✓ Signed</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    Stand against bullying and spread kindness
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-pink-600 font-medium">
                      {wellbeingData.safety?.pledgeSigned ? 'View Pledge' : 'Take Pledge'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-pink-400" />
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help & Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden h-full">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg shadow-md">
                  <HelpCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                  <p className="text-sm text-slate-600 mt-0.5">We're here for you</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-slate-600 text-sm">
                  If you're feeling overwhelmed or need support, reach out anytime.
                </p>

                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all h-12"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
                      router.push('/student/help')
                    }}
                  >
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Request Help from Teacher
                  </Button>
                </motion.div>

                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-xs text-red-700 text-center font-medium">
                    🔒 Your request will be sent privately and immediately
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500 text-center mb-2">Quick Resources</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => router.push('/student/breathing')}
                    >
                      🌬️ Breathe
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => router.push('/student/affirmations')}
                    >
                      ✨ Affirm
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// Skeleton loader for Wellbeing tab
function WellbeingTabSkeleton() {
  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
        </div>

        {/* Cards skeleton */}
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
