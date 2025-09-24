'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Moon, Droplets, Calendar, TrendingUp, Sparkles } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { updateXP, updateGems } from '@/lib/redux/slices/authSlice'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'

interface HabitData {
  date: string
  sleep_hours: number
  water_glasses: number
}

export default function HabitsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [todayHabits, setTodayHabits] = useState<HabitData>({
    date: new Date().toISOString().split('T')[0],
    sleep_hours: 0,
    water_glasses: 0
  })
  const [weeklyData, setWeeklyData] = useState<HabitData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [celebrationMessages] = useState([
    "🌱 You're growing stronger every day! Amazing habits!",
    "💪 Your healthy choices are building a better you!",
    "✨ Consistency is your superpower! Keep it up!",
    "🌟 You're a habit hero! Your body thanks you!",
    "🌈 Building rainbows of health, one day at a time!",
    "🦋 You're transforming like a beautiful butterfly!"
  ])

  useEffect(() => {
    if (user) {
      fetchHabits()
    }
  }, [user])

  const fetchHabits = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/student/habits')
      if (response.ok) {
        const data = await response.json()
        setTodayHabits(data.todayHabits)
        setWeeklyData(data.weeklyData)
      }
    } catch (error: any) {
      console.error('Error fetching habits:', error)
    }
  }

  const updateHabits = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/student/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleep_hours: todayHabits.sleep_hours,
          water_glasses: todayHabits.water_glasses
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update Redux store with actual values from backend
        dispatch(updateXP(result.xpGained || 5))
        dispatch(updateGems(result.gemsGained || 1))
        
        // Show success animation
        setShowSuccess(true)
        
        // Hide success message after 3 seconds and refresh data
        setTimeout(() => {
          setShowSuccess(false)
          fetchHabits()
        }, 3000)
      } else {
        console.error('Failed to update habits')
      }
    } catch (error: any) {
      console.error('Error updating habits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStreakDays = () => {
    let streak = 0
    const sortedData = [...weeklyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    for (const day of sortedData) {
      if (day.sleep_hours >= 7 && day.water_glasses >= 6) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-1 sm:mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-2xl sm:text-3xl mr-2 sm:mr-3"
                >
                  🌱
                </motion.div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">Healthy Habits</h1>
              </div>
              <p className="text-purple-100 text-sm sm:text-base hidden sm:block">Build powerful habits that transform your life</p>
              <p className="text-purple-100 text-xs sm:hidden">Build healthy habits</p>
            </div>
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Today's Habits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-4 sm:mb-8 relative overflow-hidden shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-400 to-emerald-500 text-white p-4 z-10"
              >
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                    <span className="font-bold text-base sm:text-lg">🌱 Healthy Habits Hero! 🌱</span>
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="text-sm sm:text-base">
                    You earned <strong>+5 XP</strong> and <strong>+1 Gem</strong>!
                  </div>
                  <div className="text-xs sm:text-sm opacity-90">
                    {celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <CardHeader className={`px-4 sm:px-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg ${showSuccess ? 'pt-20' : ''}`}>
            <CardTitle className="flex items-center text-lg sm:text-xl text-purple-800">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mr-2"
              >
                📅
              </motion.div>
              Today's Habits
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-purple-600">Track your sleep and water intake to build healthy routines</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="sleep" className="text-sm sm:text-base">Hours of Sleep</Label>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  <Input
                    id="sleep"
                    type="number"
                    min="0"
                    max="24"
                    value={todayHabits.sleep_hours}
                    onChange={(e) => setTodayHabits(prev => ({
                      ...prev,
                      sleep_hours: parseInt(e.target.value) || 0
                    }))}
                    className="flex-1 text-sm sm:text-base"
                  />
                  <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">hours</span>
                </div>
                <p className="text-xs text-gray-500">Recommended: 8-10 hours for teens</p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="water" className="text-sm sm:text-base">Glasses of Water</Label>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <Input
                    id="water"
                    type="number"
                    min="0"
                    max="20"
                    value={todayHabits.water_glasses}
                    onChange={(e) => setTodayHabits(prev => ({
                      ...prev,
                      water_glasses: parseInt(e.target.value) || 0
                    }))}
                    className="flex-1 text-sm sm:text-base"
                  />
                  <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">glasses</span>
                </div>
                <p className="text-xs text-gray-500">Recommended: 6-8 glasses per day</p>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={updateHabits} 
                disabled={isLoading}
                className="w-full mt-4 sm:mt-6 text-sm sm:text-base bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Save Today's Habits</span>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs">+5 XP, +1 Gem</span>
                  </div>
                )}
              </Button>
            </motion.div>
          </CardContent>
          </Card>
        </motion.div>

        {/* Progress Overview */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </motion.div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-green-700">Current Streak</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-800">{getStreakDays()} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Moon className="h-8 w-8 text-purple-600" />
                  </motion.div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-700">Avg Sleep</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {weeklyData.length > 0 
                        ? Math.round(weeklyData.reduce((sum, day) => sum + (day.sleep_hours || 0), 0) / weeklyData.length * 10) / 10
                        : 0}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Droplets className="h-8 w-8 text-blue-600" />
                  </motion.div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-700">Avg Water</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {weeklyData.length > 0 
                        ? Math.round(weeklyData.reduce((sum, day) => sum + (day.water_glasses || 0), 0) / weeklyData.length * 10) / 10
                        : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Weekly History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg">
            <CardTitle className="flex items-center text-gray-800">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="mr-2"
              >
                📊
              </motion.div>
              Weekly History
            </CardTitle>
            <CardDescription className="text-gray-600">Your habit tracking progress over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyData.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No habit data yet. Start tracking today!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {weeklyData.map((day, index) => (
                  <motion.div 
                    key={day.date} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-semibold text-gray-800">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2 bg-purple-100 px-3 py-1 rounded-full">
                        <Moon className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">{day.sleep_hours || 0}h</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-full">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">{day.water_glasses || 0}</span>
                      </div>
                      <motion.div 
                        className="w-4 h-4 rounded-full shadow-sm" 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                          backgroundColor: (day.sleep_hours >= 7 && day.water_glasses >= 6) 
                            ? '#10b981' : '#ef4444'
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
          </Card>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="mt-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">💡</span>
                <h3 className="text-lg font-bold text-purple-800">Healthy Habit Tips</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <motion.div 
                  className="bg-white/50 p-4 rounded-xl border border-purple-100"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center mb-3">
                    <span className="text-lg mr-2">🌙</span>
                    <h4 className="font-bold text-purple-800">Better Sleep:</h4>
                  </div>
                  <ul className="space-y-2 text-purple-700">
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>Keep a consistent bedtime</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>Avoid screens 1 hour before bed</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>Create a relaxing bedtime routine</span>
                    </li>
                  </ul>
                </motion.div>
                <motion.div 
                  className="bg-white/50 p-4 rounded-xl border border-blue-100"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center mb-3">
                    <span className="text-lg mr-2">💧</span>
                    <h4 className="font-bold text-blue-800">Stay Hydrated:</h4>
                  </div>
                  <ul className="space-y-2 text-blue-700">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Drink water when you wake up</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Carry a water bottle</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Set reminders throughout the day</span>
                    </li>
                  </ul>
                </motion.div>
              </div>
              <div className="mt-6 p-4 bg-white/50 rounded-xl border border-purple-100">
                <p className="text-center text-purple-600 italic font-medium">
                  "We are what we repeatedly do. Excellence, then, is not an act, but a habit." - Aristotle
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
