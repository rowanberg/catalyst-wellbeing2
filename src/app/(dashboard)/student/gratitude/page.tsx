'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Home, Smile, Plus, Send, Sparkles, Heart, Calendar, Star } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { updateXP, updateGems } from '@/lib/redux/slices/authSlice'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const gratitudeEntrySchema = z.object({
  content: z.string().min(10, 'Please write at least 10 characters about what you\'re grateful for').max(300, 'Please keep your gratitude entry under 300 characters'),
})

type GratitudeEntryForm = z.infer<typeof gratitudeEntrySchema>

interface GratitudeEntry {
  id: string
  content: string
  created_at: string
}

export default function GratitudeJournalPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [entries, setEntries] = useState<GratitudeEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [gratitudeText, setGratitudeText] = useState('')
  const [celebrationMessages] = useState([
    "🌟 You're amazing! Keep spreading positivity!",
    "💫 Your grateful heart makes a difference!",
    "🎈 What a wonderful way to brighten your day!",
    "🌈 Your positivity is contagious!",
    "⭐ You're building great habits!",
    "🦋 Beautiful thoughts create beautiful days!"
  ])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GratitudeEntryForm>({
    resolver: zodResolver(gratitudeEntrySchema),
  })

  const watchedContent = watch('content', '')

  useEffect(() => {
    fetchEntries()
  }, [user])

  const fetchEntries = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/student/gratitude')
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error: any) {
      console.error('Error fetching gratitude entries:', error)
    }
  }

  const onSubmit = async (data: GratitudeEntryForm) => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/student/gratitude', {
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
        setGratitudeText('')
        
        // Close form after showing success message
        setTimeout(() => {
          setShowSuccess(false)
          setShowForm(false)
          fetchEntries()
        }, 5000) // 5 seconds to show celebration
      } else {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        throw new Error(`Failed to save gratitude entry: ${response.status}`)
      }
    } catch (error: any) {
      console.error('Error saving gratitude entry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const gratitudePrompts = [
    "Something that made me smile today...",
    "A person I'm thankful for...",
    "A place that brings me peace...",
    "Something I learned recently...",
    "A memory that makes me happy...",
    "Something about my body I appreciate...",
    "A skill or talent I have...",
    "Something in nature I find beautiful...",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Gratitude Journal</h1>
              <p className="text-sm sm:text-base text-gray-600 hidden sm:block">Focus on the positive and cultivate thankfulness</p>
              <p className="text-xs text-gray-600 sm:hidden">Cultivate thankfulness</p>
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
        {/* Add Entry Button */}
        {!showForm && (
          <div className="mb-4 sm:mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ClientWrapper>
                <Button 
                  onClick={() => setShowForm(true)} 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="text-sm sm:text-base">Add Gratitude Entry</span>
                  <Badge className="bg-white/20 text-white border-white/30 ml-2 text-xs">
                    +15 XP, +3 Gems
                  </Badge>
                </Button>
              </ClientWrapper>
            </motion.div>
          </div>
        )}

        {/* Entry Form */}
        {showForm && (
          <Card className="mb-4 sm:mb-8 relative overflow-hidden">
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
                      <span className="font-bold text-base sm:text-lg">🎉 Fantastic Work! 🎉</span>
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
            
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl flex items-center">
                <Heart className="h-5 w-5 mr-2 text-yellow-600" />
                What are you grateful for today?
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Take a moment to reflect on the positive things in your life. Each entry earns you 15 XP and 3 Gems!
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-medium text-gray-700">I'm grateful for...</Label>
                  <Textarea
                    id="content"
                    className="min-h-[100px] resize-none text-sm sm:text-base"
                    placeholder="Today I'm grateful for my family because they always support me..."
                    maxLength={300}
                    {...register('content', {
                      onChange: (e) => setGratitudeText(e.target.value)
                    })}
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Share what brings joy to your heart</span>
                    <span>{watchedContent.length}/300</span>
                  </div>
                  {errors.content && (
                    <p className="text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <ClientWrapper>
                    <Button 
                      type="submit" 
                      disabled={isLoading || !watchedContent.trim()}
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                    >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Send className="h-4 w-4" />
                        <span>Save Gratitude</span>
                        <Badge className="bg-white/20 text-white border-white/30 ml-2">
                          +15 XP, +3 Gems
                        </Badge>
                      </div>
                    )}
                    </Button>
                  </ClientWrapper>
                  <ClientWrapper>
                    <Button 
                      type="button" 
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setShowForm(false)
                        setGratitudeText('')
                        reset()
                      }}
                    >
                      Cancel
                    </Button>
                  </ClientWrapper>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Gratitude Prompts */}
        <Card className="mb-4 sm:mb-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Need Inspiration?
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Tap any prompt below to get started with your gratitude entry
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {gratitudePrompts.map((prompt, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg cursor-pointer hover:shadow-sm transition-all border border-yellow-100 hover:border-yellow-200"
                  onClick={() => {
                    setShowForm(true)
                    setGratitudeText(prompt + ' ')
                    // Use setValue from react-hook-form to update the form field
                    setValue('content', prompt + ' ')
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Smile className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mb-2" />
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{prompt}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-700 text-center">
                💡 Tap any prompt above to start writing your gratitude entry!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
            <Heart className="h-5 w-5 mr-2 text-yellow-500" />
            Your Gratitude Journey
          </h2>
          
          {entries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Smile className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No entries yet</h3>
                <p className="text-gray-500 mb-4">
                  Start your gratitude practice by writing your first entry!
                </p>
                <ClientWrapper>
                  <Button onClick={() => setShowForm(true)} className="bg-yellow-500 hover:bg-yellow-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Write Your First Entry
                  </Button>
                </ClientWrapper>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                            <Smile className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base text-gray-800 leading-relaxed mb-3">{entry.content}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(entry.created_at)}</span>
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                              +15 XP, +3 Gems
                            </Badge>
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

        {/* Benefits Section */}
        <Card className="mt-6 sm:mt-8 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center space-y-4">
              <div className="text-4xl sm:text-5xl">🙏</div>
              <h3 className="text-base sm:text-lg font-semibold text-yellow-800">
                Benefits of Gratitude Practice
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm sm:text-base text-yellow-700">
                <div className="bg-white/50 rounded-lg p-3 sm:p-4">
                  <div className="font-semibold mb-2 text-yellow-800">😴 Better Sleep</div>
                  <div>Gratitude helps calm your mind before bed</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3 sm:p-4">
                  <div className="font-semibold mb-2 text-yellow-800">😊 Improved Mood</div>
                  <div>Focusing on positives boosts happiness</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3 sm:p-4">
                  <div className="font-semibold mb-2 text-yellow-800">🤝 Stronger Relationships</div>
                  <div>Appreciating others deepens connections</div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                  💛 Practice Daily
                </Badge>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                  ✨ Feel the Difference
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
