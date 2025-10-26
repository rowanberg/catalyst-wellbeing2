'use client'

import React, { useState, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, Smile, Frown, Meh, Angry, Laugh, Shield, AlertCircle, 
  Wind, Sparkles, Moon, Droplets, Brain, HelpCircle, ChevronRight,
  Activity, Clock, TrendingUp, Star, Send, MessageSquare
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
  const controls = useAnimation()

  // Prepare data before hooks
  const wellbeingData = data || {
    mood: { current: null, lockedDate: null },
    pet: { name: 'Whiskers', happiness: 50 },
    mindfulness: { sessionsToday: 0, totalSessions: 0 },
    safety: { quizCompleted: false, pledgeSigned: false }
  }

  const moodOptions = [
    { id: 'happy', emoji: '😊', label: 'Happy', color: 'from-yellow-100 to-orange-100' },
    { id: 'excited', emoji: '🤩', label: 'Excited', color: 'from-pink-100 to-purple-100' },
    { id: 'calm', emoji: '😌', label: 'Calm', color: 'from-blue-100 to-indigo-100' },
    { id: 'sad', emoji: '😢', label: 'Sad', color: 'from-gray-100 to-blue-100' },
    { id: 'angry', emoji: '😠', label: 'Angry', color: 'from-red-100 to-orange-100' },
    { id: 'anxious', emoji: '😰', label: 'Anxious', color: 'from-purple-100 to-pink-100' }
  ]

  // ALL HOOKS BEFORE CONDITIONAL RETURNS
  const handleMoodUpdate = useCallback(async (moodId: string) => {
    const today = new Date().toISOString().split('T')[0]
    
    // Check if mood is already locked for today
    if (wellbeingData.mood?.lockedDate === today) {
      alert('🌅 You\'ve already set your mood for today! Mood tracking resets tomorrow morning.')
      return
    }

    if (navigator.vibrate) {
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
        
        if (navigator.vibrate) {
          navigator.vibrate([10, 50, 10])
        }
        
        // Show success message
        alert('✅ Mood saved successfully! Your mood is now locked for today.')
        
        onRefresh()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update mood. Please try again.')
      }
    } catch (error) {
      console.error('Failed to update mood:', error)
      alert('Failed to update mood. Please try again.')
    }
  }, [wellbeingData.mood?.lockedDate, onRefresh])

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
        <div className="h-32 bg-gradient-to-r from-[#F08080] to-[#F4978E] rounded-3xl animate-pulse" />
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
    <div className="space-y-6 pb-8">
      {/* Header - Gradient Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#F08080] to-[#F4978E] rounded-2xl p-6 text-white shadow-xl"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Well-being Center
        </h1>
        <p className="text-white/90 text-sm sm:text-base">
          Take care of your mind and body 🌟
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
            <CardHeader className="bg-gradient-to-r from-[#FFDAB9]/30 to-[#FBC4AB]/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-[#F08080] to-[#F4978E] rounded-lg shadow-md">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {moodOptions.map((mood, index) => {
                  const isSelected = selectedMood === mood.id || wellbeingData.mood?.current === mood.id
                  const today = new Date().toISOString().split('T')[0]
                  const isLocked = moodLocked || wellbeingData.mood?.lockedDate === today
                  
                  return (
                    <motion.button
                      key={mood.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: isLocked ? 1 : 1.05, y: -2 }}
                      whileTap={{ scale: isLocked ? 1 : 0.95 }}
                      disabled={isLocked && !isSelected}
                      onClick={() => !isLocked && handleMoodUpdate(mood.id)}
                      className={cn(
                        "p-4 rounded-xl text-center transition-all min-h-[100px] flex flex-col justify-center",
                        isSelected
                          ? `bg-gradient-to-br ${mood.color} border-2 border-[#F8AD9D] shadow-lg`
                          : isLocked
                          ? "bg-slate-100 opacity-50 cursor-not-allowed"
                          : "bg-white border-2 border-slate-200 hover:border-[#F8AD9D] hover:shadow-md active:shadow-sm"
                      )}
                    >
                      <motion.div 
                        className="text-4xl mb-2"
                        animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        {mood.emoji}
                      </motion.div>
                      <div className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-white" : "text-slate-700"
                      )}>
                        {mood.label}
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs mt-1 font-semibold text-white"
                        >
                          ✓ {isLocked ? 'Logged' : 'Selected'}
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
              {wellbeingData.mood?.lockedDate === new Date().toISOString().split('T')[0] && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-slate-500 mt-4 bg-slate-50 p-2 rounded-lg"
                >
                  🌅 Mood tracking resets tomorrow morning
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
            <CardHeader className="bg-gradient-to-r from-[#FBC4AB]/30 to-[#F8AD9D]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-[#F4978E] to-[#F8AD9D] rounded-lg shadow-md">
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
                  className="bg-[#FFDAB9] hover:bg-[#FBC4AB] border-[#F8AD9D] text-[#F08080] hidden sm:flex"
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

      {/* Mindfulness Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
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
                      if (navigator.vibrate) navigator.vibrate(10)
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
