'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Home, Heart, Plus, Send, Sparkles, Star, Calendar } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { updateXP, updateGems } from '@/lib/redux/slices/authSlice'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { ClientWrapper } from '@/components/providers/ClientWrapper'

interface KindnessData {
  count: number
  last_updated: string
}

interface KindnessEntry {
  id: string
  description: string
  created_at: string
}

export default function KindnessCounterPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [kindnessCount, setKindnessCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [kindnessDescription, setKindnessDescription] = useState('')
  const [recentEntries, setRecentEntries] = useState<KindnessEntry[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetchKindnessData()
  }, [user])

  const fetchKindnessData = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/student/kindness')
      if (response.ok) {
        const data = await response.json()
        setKindnessCount(data.count || 0)
        setRecentEntries(data.recent_entries || [])
        
        // Calculate today's count from recent entries
        const today = new Date().toDateString()
        const todayEntries = data.recent_entries?.filter((entry: KindnessEntry) => 
          new Date(entry.created_at).toDateString() === today
        ) || []
        setTodayCount(todayEntries.length)
      }
    } catch (error: any) {
      console.error('Error fetching kindness data:', error)
    }
  }

  const submitKindnessAct = async () => {
    if (!user || !kindnessDescription.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/student/kindness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: kindnessDescription.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        throw new Error(`Failed to submit kindness act: ${response.status} - ${errorData}`)
      }

      const data = await response.json()
      
      // Update local state
      setKindnessCount(prev => prev + 1)
      setTodayCount(prev => prev + 1)
      setKindnessDescription('')
      
      // Add new entry to recent entries
      const newEntry: KindnessEntry = {
        id: data.entry_id || Date.now().toString(),
        description: kindnessDescription.trim(),
        created_at: new Date().toISOString()
      }
      setRecentEntries(prev => [newEntry, ...prev.slice(0, 4)])
      
      // Award XP and gems with actual backend values
      dispatch(updateXP(data.xpGained || 15))
      dispatch(updateGems(data.gemsGained || 3))
      
      // Show success animation
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
    } catch (error: any) {
      console.error('Error submitting kindness act:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const kindnessIdeas = [
    "Helped a classmate with homework",
    "Said something nice to someone",
    "Picked up litter",
    "Shared your lunch",
    "Listened to a friend who was sad",
    "Held the door open for someone",
    "Complimented someone's work",
    "Helped carry something heavy",
    "Said 'please' and 'thank you'",
    "Smiled at someone new"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Kindness Counter</h1>
              <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Track your acts of kindness and spread positivity</p>
              <p className="text-xs text-gray-600 sm:hidden">Track kindness acts</p>
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
        {/* Counter Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-8">
          <Card className="text-center">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center justify-center text-base sm:text-lg">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-pink-500" />
                <span className="hidden sm:inline">Total Kindness Acts</span>
                <span className="sm:hidden">Total Acts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-4xl sm:text-6xl font-bold text-pink-600 mb-2 sm:mb-4">{kindnessCount}</div>
              <p className="text-sm sm:text-base text-gray-600">Acts of kindness performed</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Today's Kindness</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-4xl sm:text-6xl font-bold text-rose-600 mb-2 sm:mb-4">{todayCount}</div>
              <p className="text-sm sm:text-base text-gray-600">Kind acts today</p>
            </CardContent>
          </Card>
        </div>

        {/* Kindness Entry Form */}
        <Card className="mb-4 sm:mb-8 relative overflow-hidden">
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-400 to-emerald-500 text-white p-3 z-10"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-semibold">Amazing! +15 XP, +3 Gems earned!</span>
                  <Sparkles className="h-5 w-5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl flex items-center">
              <Heart className="h-5 w-5 mr-2 text-pink-500" />
              Share Your Act of Kindness
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Tell us about the kind thing you did today! Each act earns you 15 XP and 3 Gems.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">What kind act did you do?</label>
              <Textarea
                value={kindnessDescription}
                onChange={(e) => setKindnessDescription(e.target.value)}
                placeholder="I helped my friend with homework..."
                className="min-h-[80px] resize-none text-sm sm:text-base"
                maxLength={200}
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Share the details of your kindness</span>
                <span>{kindnessDescription.length}/200</span>
              </div>
            </div>
            
            <ClientWrapper>
              <Button 
                onClick={submitKindnessAct}
                disabled={isLoading || !kindnessDescription.trim()}
                size="lg"
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>Submit Kindness Act</span>
                    <Badge className="bg-white/20 text-white border-white/30 ml-2">
                      +15 XP, +3 Gems
                    </Badge>
                  </div>
                )}
              </Button>
            </ClientWrapper>
          </CardContent>
        </Card>

        {/* Recent Kindness Acts */}
        {recentEntries.length > 0 && (
          <Card className="mb-4 sm:mb-8">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Your Recent Acts of Kindness
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Your latest kind deeds that made the world a better place
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-3">
                {recentEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-100"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                        <Heart className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
                        {entry.description}
                      </p>
                      <div className="flex items-center mt-2 space-x-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                        <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                          +15 XP, +3 Gems
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kindness Ideas */}
        <Card className="mb-4 sm:mb-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Kindness Ideas</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Need inspiration? Here are some ways to be kind today:
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <ClientWrapper>
                {kindnessIdeas.map((idea, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-100 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => setKindnessDescription(idea)}
                  >
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{idea}</span>
                  </motion.div>
                ))}
              </ClientWrapper>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-700 text-center">
                💡 Tap any idea above to use it as your kindness description!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Progress Milestones */}
        <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200 mb-4 sm:mb-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-pink-800 text-lg sm:text-xl">Kindness Milestones</CardTitle>
            <CardDescription className="text-pink-700 text-sm sm:text-base">
              Track your progress and celebrate achievements!
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[10, 25, 50, 100].map((milestone) => (
                <motion.div 
                  key={milestone} 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                    kindnessCount >= milestone 
                      ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {kindnessCount >= milestone ? (
                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-pink-800">{milestone}</div>
                  <div className="text-xs sm:text-sm text-pink-600">
                    {kindnessCount >= milestone ? '🎉 Achieved!' : `${milestone - kindnessCount} to go`}
                  </div>
                  {kindnessCount >= milestone && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-1"
                    >
                      <Badge className="bg-pink-500 text-white text-xs">
                        Unlocked!
                      </Badge>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Encouragement */}
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center space-y-4">
              <div className="text-4xl sm:text-5xl">💖</div>
              <h3 className="text-base sm:text-lg font-semibold text-rose-800">
                "No act of kindness, no matter how small, is ever wasted."
              </h3>
              <p className="text-sm sm:text-base text-rose-700 italic">
                - Aesop
              </p>
              <div className="bg-white/50 rounded-lg p-3 sm:p-4 mt-4">
                <p className="text-sm sm:text-base text-rose-600 leading-relaxed">
                  Every kind act creates a ripple effect of positivity. Keep spreading kindness and making the world a better place, one act at a time!
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                  💝 Kindness Matters
                </Badge>
                <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                  🌟 You Make a Difference
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
