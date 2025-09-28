'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Shield, Plus, Sparkles } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { updateXP, updateGems } from '@/lib/redux/slices/authSlice'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const courageEntrySchema = z.object({
  content: z.string().min(10, 'Please write at least 10 characters about your brave moment'),
})

type CourageEntryForm = z.infer<typeof courageEntrySchema>

interface CourageEntry {
  id: string
  content: string
  created_at: string
}

export default function CourageLogPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [entries, setEntries] = useState<CourageEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [celebrationMessages] = useState([
    "💪 You're a true warrior! Your courage inspires others!",
    "🦸‍♀️ What a brave hero you are! Keep being amazing!",
    "🌟 Your bravery lights up the world!",
    "🔥 Courage like yours changes everything!",
    "⚡ You faced your fears like a champion!",
    "🎯 Bulls-eye! You hit courage right on target!"
  ])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourageEntryForm>({
    resolver: zodResolver(courageEntrySchema),
  })

  useEffect(() => {
    fetchEntries()
  }, [user])

  const fetchEntries = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/student/courage')
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error: any) {
      console.error('Error fetching courage entries:', error)
    }
  }

  const onSubmit = async (data: CourageEntryForm) => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/student/courage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: data.content
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update Redux store with actual values from backend
        dispatch(updateXP(result.xpGained || 15))
        dispatch(updateGems(result.gemsGained || 3))
        
        // Show success animation and keep form open for celebration
        setShowSuccess(true)
        
        // Clear form but keep it open for a moment
        reset()
        
        // Close form after showing success message
        setTimeout(() => {
          setShowSuccess(false)
          setShowForm(false)
          fetchEntries()
        }, 5000) // 5 seconds to show celebration
      } else {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        throw new Error(`Failed to save courage entry: ${response.status}`)
      }
    } catch (error: any) {
      console.error('Error saving courage entry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-1 sm:mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-2xl sm:text-3xl mr-2 sm:mr-3"
                >
                  🛡️
                </motion.div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">Courage Log</h1>
              </div>
              <p className="text-green-100 text-sm sm:text-base hidden sm:block">Record your brave moments and build unshakeable confidence</p>
              <p className="text-green-100 text-xs sm:hidden">Build courage & confidence</p>
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
        {/* Add Entry Button */}
        {!showForm && (
          <motion.div 
            className="mb-4 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105" onClick={() => setShowForm(true)}>
              <CardContent className="p-4 sm:p-6 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl sm:text-4xl mb-2 sm:mb-3"
                >
                  🦸‍♀️
                </motion.div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Ready to Share Your Courage?</h3>
                <p className="text-green-100 text-sm sm:text-base mb-3 sm:mb-4">Every brave moment deserves to be celebrated!</p>
                <Button 
                  size="lg" 
                  className="bg-white text-green-600 hover:bg-green-50 font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="hidden sm:inline">Add Courage Entry</span>
                  <span className="sm:hidden">Add Entry</span>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Entry Form */}
        {showForm && (
          <Card className="mb-4 sm:mb-8 relative overflow-hidden shadow-lg border-0 bg-gradient-to-br from-white via-green-50 to-emerald-50">
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 sm:p-4 z-10 rounded-t-lg"
                >
                  <div className="text-center space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                      <span className="font-bold text-sm sm:text-lg">🦸‍♀️ Incredible Courage! 🦸‍♂️</span>
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                    </div>
                    <div className="text-xs sm:text-base">
                      You earned <strong>+15 XP</strong> and <strong>+3 Gems</strong>!
                    </div>
                    <div className="text-xs opacity-90">
                      {celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <CardHeader className={`px-3 sm:px-6 ${showSuccess ? 'pt-16 sm:pt-20' : 'pt-4 sm:pt-6'}`}>
              <div className="text-center mb-3 sm:mb-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl sm:text-5xl mb-2"
                >
                  🛡️
                </motion.div>
              </div>
              <CardTitle className="flex items-center justify-center text-lg sm:text-xl text-center">
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                  Share Your Brave Moment
                </span>
              </CardTitle>
              <CardDescription className="text-center text-sm sm:text-base text-gray-600">
                Every act of courage, big or small, makes you stronger! 💪
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="content" className="text-sm sm:text-base font-semibold text-gray-700 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-green-600" />
                    Your Courage Story
                  </Label>
                  <div className="relative">
                    <textarea
                      id="content"
                      rows={4}
                      className="w-full px-3 sm:px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/80 backdrop-blur-sm text-sm sm:text-base resize-none"
                      placeholder="Today I was brave when I spoke up in class, helped someone who was being teased, tried something new that scared me..."
                      {...register('content')}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                      💭 Be specific!
                    </div>
                  </div>
                  {errors.content && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600 flex items-center"
                    >
                      <span className="mr-1">⚠️</span>
                      {errors.content.message}
                    </motion.p>
                  )}
                </div>

                {/* Courage Prompts */}
                <div className="bg-green-50 p-3 sm:p-4 rounded-xl border border-green-200">
                  <h4 className="text-sm sm:text-base font-semibold text-green-800 mb-2 flex items-center">
                    <span className="mr-2">💡</span>
                    Need inspiration? Courage can be...
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-green-700">
                    <div>• Speaking up for what's right</div>
                    <div>• Trying something new</div>
                    <div>• Helping someone in need</div>
                    <div>• Facing a fear</div>
                    <div>• Being yourself</div>
                    <div>• Asking for help</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full sm:flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 sm:py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                    size="lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Saving Your Courage...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Shield className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Save My Brave Moment</span>
                        <span className="sm:hidden">Save Courage</span>
                        <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">+15 XP, +3 💎</span>
                      </div>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false)
                      reset()
                    }}
                    className="w-full sm:w-auto border-2 border-gray-300 hover:border-gray-400 rounded-xl py-2 sm:py-3 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Entries List */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">🏆</span>
              Your Courage Journey
            </h2>
            <div className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
              {entries.length} brave {entries.length === 1 ? 'moment' : 'moments'}
            </div>
          </div>
          
          {entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-dashed border-green-300">
                <CardContent className="text-center py-8 sm:py-12 px-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-4xl sm:text-6xl mb-3 sm:mb-4"
                  >
                    🛡️
                  </motion.div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-2">Your Courage Story Starts Here!</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-md mx-auto">
                    Every hero has a beginning. Share your first brave moment and start building your courage collection!
                  </p>
                  <Button 
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Your First Brave Moment</span>
                    <span className="sm:hidden">Start Journey</span>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-r from-white to-green-50/30">
                    <CardContent className="p-3 sm:p-6">
                      <div className="flex items-start space-x-3">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 sm:p-3 rounded-full flex-shrink-0">
                          <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs sm:text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              Brave Moment #{entries.length - index}
                            </span>
                            <span className="text-xs text-gray-400">
                              +15 XP, +3 💎
                            </span>
                          </div>
                          <p className="text-sm sm:text-base text-gray-800 leading-relaxed mb-2 break-words">{entry.content}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs sm:text-sm text-gray-500 flex items-center">
                              <span className="mr-1">📅</span>
                              {formatDate(entry.created_at)}
                            </p>
                            <div className="flex items-center text-xs text-green-600">
                              <span className="mr-1">🎖️</span>
                              Courage Badge Earned
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Encouragement Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="mt-6 sm:mt-8 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-200 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="text-center space-y-3 sm:space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl sm:text-4xl"
                >
                  💪
                </motion.div>
                <h3 className="text-base sm:text-lg font-bold text-green-800 flex items-center justify-center">
                  <span className="mr-2">✨</span>
                  Remember: True Courage
                  <span className="ml-2">✨</span>
                </h3>
                <div className="bg-white/60 p-3 sm:p-4 rounded-xl border border-green-200">
                  <p className="text-sm sm:text-base text-green-700 leading-relaxed">
                    Courage isn't about being fearless - it's about doing what's right even when you feel scared. 
                    <span className="font-semibold">Every small act of bravery counts!</span> 🌟
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
                  <div className="bg-white/40 p-3 rounded-lg text-center">
                    <div className="text-lg sm:text-xl mb-1">🗣️</div>
                    <div className="text-xs sm:text-sm font-semibold text-green-800">Speaking Up</div>
                  </div>
                  <div className="bg-white/40 p-3 rounded-lg text-center">
                    <div className="text-lg sm:text-xl mb-1">🤝</div>
                    <div className="text-xs sm:text-sm font-semibold text-green-800">Helping Others</div>
                  </div>
                  <div className="bg-white/40 p-3 rounded-lg text-center">
                    <div className="text-lg sm:text-xl mb-1">🌱</div>
                    <div className="text-xs sm:text-sm font-semibold text-green-800">Trying New Things</div>
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
