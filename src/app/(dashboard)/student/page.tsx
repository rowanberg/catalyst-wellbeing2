'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAppSelector } from '@/lib/redux/hooks'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { AuthGuard } from '@/components/auth/auth-guard'
import { 
  CheckCircle, Star, Zap, Heart, Wind, Sparkles, AlertCircle, Shield, Droplets, Moon
} from 'lucide-react'
import { MessagingNavButton } from '@/components/ui/messaging-nav-button'

// Enhanced Progress Component with animations
const Progress = ({ value = 0, className = "", animated = true }: { 
  value?: number
  className?: string
  animated?: boolean 
}) => (
  <div className={`relative h-4 w-full overflow-hidden rounded-full bg-gradient-to-r from-gray-200 to-gray-300 shadow-inner ${className}`}>
    <motion.div
      className={`h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg ${animated ? 'animate-pulse' : ''}`}
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(value || 0, 100)}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
    />
  </div>
)

// Enhanced Badge Component
const Badge = ({ children, variant = "default", className = "" }: { 
  children: React.ReactNode
  variant?: string
  className?: string 
}) => {
  const variants = {
    default: "bg-blue-100 text-blue-800 border-blue-200",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    error: "bg-red-100 text-red-800 border-red-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    pink: "bg-pink-100 text-pink-800 border-pink-200"
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant as keyof typeof variants] || variants.default} ${className}`}>
      {children}
    </span>
  )
}

// Floating Card Component with motion
const FloatingCard = ({ children, delay = 0, className = "" }: { 
  children: React.ReactNode
  delay?: number
  className?: string 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ scale: 1.02, y: -2 }}
    className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 ${className}`}
  >
    <div className="p-6">
      {children}
    </div>
  </motion.div>
)

// TypeScript interfaces
interface DashboardStats {
  level: number
  xp: number
  gems: number
  streakDays: number
  totalQuestsCompleted: number
  petHappiness: number
  petName: string
  weeklyXP: number
  monthlyXP: number
  rank: number
  nextLevelXP: number
}

interface QuestStatus {
  gratitude: boolean
  kindness: boolean
  courage: boolean
  breathing: boolean
  water: boolean
  sleep: boolean
}

interface QuestData {
  status: QuestStatus
  progress: {
    completed: number
    total: number
    percentage: number
  }
  streakData: {
    current: number
    best: number
    lastCompleted: string
  }
}

interface MoodData {
  current: string
  energy: number
  stress: number
  lastUpdated: string
}

const StudentDashboardContent = () => {
  const router = useRouter()
  const { profile: reduxProfile } = useAppSelector((state) => state.auth)
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  
  // State for dashboard components
  const [stats, setStats] = useState<DashboardStats>({
    level: 1,
    xp: 0,
    gems: 0,
    streakDays: 0,
    totalQuestsCompleted: 0,
    petHappiness: 50,
    petName: "Whiskers",
    weeklyXP: 0,
    monthlyXP: 0,
    rank: 0,
    nextLevelXP: 100
  })
  
  const [quests, setQuests] = useState<QuestData>({
    status: {
      gratitude: false,
      kindness: false,
      courage: false,
      breathing: false,
      water: false,
      sleep: false
    },
    progress: {
      completed: 0,
      total: 6,
      percentage: 0
    },
    streakData: {
      current: 0,
      best: 0,
      lastCompleted: ""
    }
  })
  
  const [mood, setMood] = useState<MoodData>({
    current: '',
    energy: 50,
    stress: 30,
    lastUpdated: ''
  })

  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [helpRequest, setHelpRequest] = useState({
    urgency: 'low',
    message: ''
  })

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/dashboard')
      if (response.ok) {
        const data = await response.json()
        
        // Set profile data from API response
        setProfile(data.profile)
        
        setStats({
          ...data.stats,
          weeklyXP: data.stats.weeklyXP || 0,
          monthlyXP: data.stats.monthlyXP || 0,
          rank: data.stats.rank || 0,
          nextLevelXP: data.stats.nextLevelXP || 100
        })
        setQuests({
          ...data.quests,
          streakData: data.quests.streakData || { current: 0, best: 0, lastCompleted: "" }
        })
        setMood(data.mood)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Use fallback profile from Redux if API fails
      setProfile(reduxProfile)
      // Use mock data as fallback
      setStats({
        level: 3,
        xp: 250,
        gems: 45,
        streakDays: 7,
        totalQuestsCompleted: 23,
        petHappiness: 85,
        petName: "Whiskers",
        weeklyXP: 180,
        monthlyXP: 750,
        rank: 12,
        nextLevelXP: 300
      })
    } finally {
      setLoading(false)
    }
  }, [reduxProfile])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Quest toggle handler
  const handleQuestToggle = async (questType: keyof QuestStatus) => {
    try {
      const response = await fetch('/api/student/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questType, completed: !quests.status[questType] })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Quest API response:', data) // Debug log
        const isCompleting = !quests.status[questType]
        
        // Update quest status
        setQuests(prev => ({
          ...prev,
          status: { ...prev.status, [questType]: isCompleting },
          progress: {
            ...prev.progress,
            completed: isCompleting 
              ? prev.progress.completed + 1 
              : prev.progress.completed - 1
          }
        }))
        
        // Define quest rewards for frontend calculations
        const questRewards = {
          gratitude: { xp: 15, gems: 3 },
          kindness: { xp: 20, gems: 4 },
          courage: { xp: 25, gems: 5 },
          breathing: { xp: 10, gems: 2 },
          water: { xp: 8, gems: 2 },
          sleep: { xp: 12, gems: 3 }
        }
        
        const reward = questRewards[questType as keyof typeof questRewards] || { xp: 10, gems: 2 }
        
        if (isCompleting) {
          console.log('Completing quest with rewards:', reward) // Debug log
          
          setStats(prev => {
            const newXP = prev.xp + reward.xp
            const newGems = prev.gems + reward.gems
            const newLevel = Math.floor(newXP / 100) + 1
            
            return {
              ...prev, 
              xp: newXP, 
              gems: newGems,
              level: newLevel,
              totalQuestsCompleted: prev.totalQuestsCompleted + 1,
              petHappiness: Math.min(100, prev.petHappiness + 5)
            }
          })
          
          addToast({
            title: `🎉 ${questType.charAt(0).toUpperCase() + questType.slice(1)} Quest Complete!`,
            description: `Amazing work! You earned ${reward.xp} XP and ${reward.gems} gems! 💎`,
            type: "success"
          })
        } else {
          // Handle uncompleting quest
          console.log('Uncompleting quest, removing rewards:', reward) // Debug log
          
          setStats(prev => {
            const newXP = Math.max(0, prev.xp - reward.xp)
            const newGems = Math.max(0, prev.gems - reward.gems)
            const newLevel = Math.floor(newXP / 100) + 1
            
            return {
              ...prev, 
              xp: newXP, 
              gems: newGems,
              level: newLevel,
              totalQuestsCompleted: Math.max(0, prev.totalQuestsCompleted - 1),
              petHappiness: Math.max(0, prev.petHappiness - 5)
            }
          })
          
          addToast({
            title: "Quest Uncompleted",
            description: `Removed ${reward.xp} XP and ${reward.gems} gems.`,
            type: "info"
          })
        }
        
        // Update quest progress percentage
        setQuests(prev => ({
          ...prev,
          progress: {
            ...prev.progress,
            percentage: Math.round(((prev.progress.completed) / prev.progress.total) * 100)
          }
        }))
        
        // Refresh dashboard data to ensure consistency
        setTimeout(() => {
          fetchDashboardData()
        }, 1000)
      } else {
        console.error('Quest API error:', response.status, await response.text())
        addToast({
          title: "Error",
          description: "Failed to update quest. Please try again.",
          type: "error"
        })
      }
    } catch (error) {
      console.error('Error updating quest:', error)
    }
  }

  // Mood update handler
  const handleMoodUpdate = async (newMood: string) => {
    try {
      const response = await fetch('/api/student/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: newMood })
      })
      
      if (response.ok) {
        setMood(prev => ({ ...prev, current: newMood, lastUpdated: new Date().toISOString() }))
        addToast({
          title: "Mood Updated!",
          description: "Thanks for sharing how you're feeling today.",
          type: "success"
        })
      }
    } catch (error) {
      console.error('Error updating mood:', error)
    }
  }

  // Mindfulness session handler
  const handleMindfulnessSession = async (sessionType: string) => {
    try {
      const response = await fetch('/api/student/mindfulness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionType })
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(prev => ({ 
          ...prev, 
          xp: prev.xp + (data.xpGained || 15), 
          petHappiness: Math.min(100, prev.petHappiness + 5) 
        }))
        addToast({
          title: "Mindfulness Complete!",
          description: `Great job! You earned ${data.xpGained || 15} XP.`,
          type: "success"
        })
      }
    } catch (error) {
      console.error('Error completing mindfulness session:', error)
    }
  }

  // Help request handler
  const handleHelpRequest = async (urgency: string, message: string) => {
    try {
      const response = await fetch('/api/student/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urgency, message })
      })
      
      if (response.ok) {
        addToast({
          title: "Help Request Sent",
          description: "A teacher will be with you shortly.",
          type: "success"
        })
      }
    } catch (error) {
      console.error('Error sending help request:', error)
    }
  }

  // Help modal submit handler
  const handleHelpSubmit = async () => {
    if (!helpRequest.message.trim()) {
      addToast({
        title: "Message Required",
        description: "Please tell us what you need help with.",
        type: "error"
      })
      return
    }

    await handleHelpRequest(helpRequest.urgency, helpRequest.message)
    setShowHelpModal(false)
    setHelpRequest({ urgency: 'low', message: '' })
  }

  if (loading) {
    return <PageLoader />
  }

  const moodEmojis = {
    happy: "😊",
    excited: "🤩", 
    calm: "😌",
    sad: "😢",
    angry: "😠",
    anxious: "😰"
  }

  const questIcons = {
    gratitude: <Heart className="w-5 h-5" />,
    kindness: <Sparkles className="w-5 h-5" />,
    courage: <Shield className="w-5 h-5" />,
    breathing: <Wind className="w-5 h-5" />,
    water: <Droplets className="w-5 h-5" />,
    sleep: <Moon className="w-5 h-5" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Student Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <FloatingCard className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl sm:text-4xl backdrop-blur-sm border-2 border-white/30">
                  {profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : '👤'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm sm:text-lg">
                  👑
                </div>
              </div>
              
              {/* Student Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}` 
                    : 'Welcome, Student!'}
                </h1>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 text-white/90 text-sm sm:text-base">
                  {profile?.school?.name && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="text-sm sm:text-lg">🏫</span>
                      <span className="font-medium truncate max-w-[120px] sm:max-w-none">{profile.school.name}</span>
                    </div>
                  )}
                  {profile?.grade_level && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="text-sm sm:text-lg">📚</span>
                      <span className="font-medium">{profile.grade_level}</span>
                    </div>
                  )}
                  {profile?.class_name && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="text-sm sm:text-lg">🚪</span>
                      <span className="font-medium">{profile.class_name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Stats and Messaging */}
              <div className="flex sm:hidden items-center justify-center space-x-4 w-full">
                <MessagingNavButton userRole="student" variant="ghost" className="text-white hover:bg-white/20" />
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.level}</div>
                  <div className="text-xs text-white/80">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.streakDays}</div>
                  <div className="text-xs text-white/80">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.totalQuestsCompleted}</div>
                  <div className="text-xs text-white/80">Quests</div>
                </div>
              </div>
              <div className="hidden sm:flex lg:flex items-center space-x-4 lg:space-x-6">
                <MessagingNavButton userRole="student" variant="ghost" className="text-white hover:bg-white/20" />
                <div className="text-center">
                  <div className="text-xl lg:text-2xl font-bold">{stats.level}</div>
                  <div className="text-xs lg:text-sm text-white/80">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-xl lg:text-2xl font-bold">{stats.streakDays}</div>
                  <div className="text-xs lg:text-sm text-white/80">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-xl lg:text-2xl font-bold">{stats.totalQuestsCompleted}</div>
                  <div className="text-xs lg:text-sm text-white/80">Quests Done</div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 sm:mt-6">
              <div className="flex justify-between text-xs sm:text-sm text-white/90 mb-2">
                <span>Progress to Level {stats.level + 1}</span>
                <span>{stats.xp} / {stats.nextLevelXP} XP</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 sm:h-3">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 sm:h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((stats.xp / stats.nextLevelXP) * 100, 100)}%` }}
                />
              </div>
            </div>
          </FloatingCard>
        </motion.div>

        {/* Fun Achievement Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <FloatingCard delay={0.1} className="bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300">
            <div className="text-center">
              <motion.div 
                className="text-4xl mb-2"
                key={stats.xp}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                ⭐
              </motion.div>
              <motion.p 
                className="text-2xl font-bold text-yellow-700"
                key={stats.xp}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
              >
                {stats.xp}
              </motion.p>
              <p className="text-sm text-yellow-600">Experience Points</p>
            </div>
          </FloatingCard>

          <FloatingCard delay={0.2} className="bg-gradient-to-br from-pink-100 to-pink-200 border-pink-300">
            <div className="text-center">
              <motion.div 
                className="text-4xl mb-2"
                key={stats.gems}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                💎
              </motion.div>
              <motion.p 
                className="text-2xl font-bold text-pink-700"
                key={stats.gems}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
              >
                {stats.gems}
              </motion.p>
              <p className="text-sm text-pink-600">Mind Gems</p>
            </div>
          </FloatingCard>

          <FloatingCard delay={0.3} className="bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300">
            <div className="text-center">
              <div className="text-4xl mb-2">🔥</div>
              <p className="text-2xl font-bold text-orange-700">{stats.streakDays}</p>
              <p className="text-sm text-orange-600">Day Streak</p>
            </div>
          </FloatingCard>

          <FloatingCard delay={0.4} className="bg-gradient-to-br from-green-100 to-green-200 border-green-300">
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-2xl font-bold text-green-700">{stats.totalQuestsCompleted}</p>
              <p className="text-sm text-green-600">Quests Complete</p>
            </div>
          </FloatingCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Daily Quests */}
          <div className="lg:col-span-2">
            <FloatingCard delay={0.5} className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">🎯</div>
                  <h2 className="text-2xl font-bold text-gray-800">Today's Adventures</h2>
                </div>
                <Badge variant="purple" className="text-lg px-4 py-2">
                  {quests.progress.completed}/{quests.progress.total} Complete
                </Badge>
              </div>
              
              {/* Completion Celebration */}
              {quests.progress.completed === quests.progress.total && quests.progress.total > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-gradient-to-r from-yellow-100 via-green-100 to-blue-100 rounded-xl border-2 border-green-300"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎉✨🏆</div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">Amazing Work, Champion!</h3>
                    <p className="text-green-700 mb-3">
                      You've completed all your adventures for today! You're absolutely incredible! 🌟
                    </p>
                    <div className="bg-white/80 rounded-lg p-3 inline-block">
                      <div className="flex items-center justify-center space-x-4 text-sm font-bold">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-600">⭐</span>
                          <span className="text-yellow-700">
                            +{Object.entries(quests.status).reduce((total, [questType, completed]) => {
                              if (completed) {
                                const rewards = {
                                  gratitude: 15, kindness: 20, courage: 25,
                                  breathing: 10, water: 8, sleep: 12
                                }
                                return total + (rewards[questType as keyof typeof rewards] || 10)
                              }
                              return total
                            }, 0)} XP
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-pink-600">💎</span>
                          <span className="text-pink-700">
                            +{Object.entries(quests.status).reduce((total, [questType, completed]) => {
                              if (completed) {
                                const rewards = {
                                  gratitude: 3, kindness: 4, courage: 5,
                                  breathing: 2, water: 2, sleep: 3
                                }
                                return total + (rewards[questType as keyof typeof rewards] || 2)
                              }
                              return total
                            }, 0)} Gems
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Added to your treasure chest!</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{quests.progress.percentage}%</span>
                </div>
                <Progress value={quests.progress.percentage} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {Object.entries(questIcons).map(([questType, icon]) => {
                  const questEmojis = {
                    gratitude: '🙏',
                    kindness: '💝',
                    courage: '🦸',
                    breathing: '🌬️',
                    water: '💧',
                    sleep: '😴'
                  }
                  
                  const questTitles = {
                    gratitude: 'Gratitude Journal',
                    kindness: 'Acts of Kindness',
                    courage: 'Courage Challenge',
                    breathing: 'Mindful Breathing',
                    water: 'Hydration Hero',
                    sleep: 'Sleep Champion'
                  }
                  
                  return (
                    <motion.div
                      key={questType}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        quests.status[questType as keyof QuestStatus]
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-lg'
                          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-purple-300 hover:shadow-md'
                      }`}
                      onClick={() => {
                        // Navigate to specific quest page
                        if (questType === 'gratitude') {
                          router.push('/student/gratitude')
                        } else if (questType === 'kindness') {
                          router.push('/student/kindness')
                        } else if (questType === 'courage') {
                          router.push('/student/courage-log')
                        } else if (questType === 'breathing') {
                          router.push('/student/breathing')
                        } else if (questType === 'water' || questType === 'sleep') {
                          router.push('/student/habits')
                        } else {
                          handleQuestToggle(questType as keyof QuestStatus)
                        }
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 sm:p-3 rounded-full text-xl sm:text-2xl ${
                          quests.status[questType as keyof QuestStatus]
                            ? 'bg-green-100'
                            : 'bg-purple-100'
                        }`}>
                          {questEmojis[questType as keyof typeof questEmojis]}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm sm:text-lg text-gray-800">
                            {questTitles[questType as keyof typeof questTitles]}
                          </h3>
                          {quests.status[questType as keyof QuestStatus] && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex flex-col space-y-2 mt-2"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full animate-pulse">
                                  ✅ Quest Complete!
                                </span>
                                <div className="flex items-center space-x-1 text-xs">
                                  <span className="text-yellow-600">⭐</span>
                                  <span className="font-bold text-yellow-700">
                                    +{(() => {
                                      const rewards = {
                                        gratitude: 15, kindness: 20, courage: 25,
                                        breathing: 10, water: 8, sleep: 12
                                      }
                                      return rewards[questType as keyof typeof rewards] || 10
                                    })()} XP
                                  </span>
                                  <span className="text-pink-600">💎</span>
                                  <span className="font-bold text-pink-700">
                                    +{(() => {
                                      const rewards = {
                                        gratitude: 3, kindness: 4, courage: 5,
                                        breathing: 2, water: 2, sleep: 3
                                      }
                                      return rewards[questType as keyof typeof rewards] || 2
                                    })()} Gems
                                  </span>
                                </div>
                              </div>
                              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-2 rounded-lg border border-green-200">
                                <p className="text-xs text-green-700 font-medium">
                                  🎉 Awesome job! Points added to your wallet!
                                </p>
                              </div>
                            </motion.div>
                          )}
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            {questType === 'gratitude' && 'Write 3 things you\'re grateful for today'}
                            {questType === 'kindness' && 'Do one act of kindness for someone'}
                            {questType === 'courage' && 'Share something brave you did'}
                            {questType === 'breathing' && 'Complete a breathing exercise'}
                            {questType === 'water' && 'Drink 8 glasses of water'}
                            {questType === 'sleep' && 'Get 8+ hours of sleep'}
                          </p>
                        </div>
                        <div className={`text-3xl ${
                          quests.status[questType as keyof QuestStatus] ? 'animate-bounce' : ''
                        }`}>
                          {quests.status[questType as keyof QuestStatus] ? '✅' : '⭐'}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </FloatingCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Mood Tracker */}
            <FloatingCard delay={0.6} className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl">😊</div>
                <h3 className="text-xl font-bold text-gray-800">How are you feeling today?</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-3">
                {Object.entries(moodEmojis).map(([moodType, emoji]) => (
                  <motion.button
                    key={moodType}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 sm:p-4 rounded-xl text-center transition-all duration-300 ${
                      mood.current === moodType
                        ? 'bg-gradient-to-br from-purple-200 to-pink-200 border-2 border-purple-400 shadow-lg'
                        : 'bg-white border-2 border-gray-200 hover:border-purple-300 hover:shadow-md'
                    }`}
                    onClick={() => handleMoodUpdate(moodType)}
                  >
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{emoji}</div>
                    <div className="text-xs sm:text-sm font-semibold capitalize text-gray-700">{moodType}</div>
                    {mood.current === moodType && (
                      <div className="text-xs text-purple-600 mt-1">Selected ✨</div>
                    )}
                  </motion.button>
                ))}
              </div>
            </FloatingCard>

            {/* Virtual Pet */}
            <FloatingCard delay={0.7} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl">🐾</div>
                <h3 className="text-xl font-bold text-gray-800">Meet {stats.petName}!</h3>
              </div>
              <div className="text-center">
                <motion.div 
                  className="text-6xl sm:text-8xl mb-3 sm:mb-4 inline-block"
                  animate={{ 
                    scale: stats.petHappiness > 80 ? [1, 1.1, 1] : 1,
                    rotate: stats.petHappiness > 90 ? [0, 5, -5, 0] : 0
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🐱
                </motion.div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Happiness Level</span>
                    <span className="font-bold text-orange-600">{stats.petHappiness}%</span>
                  </div>
                  <Progress value={stats.petHappiness} className="h-4" />
                  <div className="mt-2 text-xs text-gray-600">
                    {stats.petHappiness >= 90 && "🌟 Super Happy!"}
                    {stats.petHappiness >= 70 && stats.petHappiness < 90 && "😊 Very Happy"}
                    {stats.petHappiness >= 50 && stats.petHappiness < 70 && "🙂 Content"}
                    {stats.petHappiness < 50 && "😔 Needs attention"}
                  </div>
                </div>
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-sm text-gray-700 font-medium">
                    Complete daily quests to keep {stats.petName} happy and healthy! 🎯
                  </p>
                </div>
              </div>
            </FloatingCard>

            {/* Mindfulness */}
            <FloatingCard delay={0.8} className="bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl">🧘</div>
                <h3 className="text-xl font-bold text-gray-800">Mindfulness Corner</h3>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <Button
                  className="w-full justify-start bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 border-blue-200 text-gray-800 text-sm sm:text-base py-2 sm:py-3"
                  variant="outline"
                  onClick={() => router.push('/student/breathing')}
                >
                  <div className="text-base sm:text-lg mr-2 sm:mr-3">🌬️</div>
                  <div className="text-left">
                    <div className="font-semibold text-sm sm:text-base">Breathing Exercise</div>
                    <div className="text-xs text-gray-600 hidden sm:block">Calm your mind</div>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start bg-gradient-to-r from-pink-100 to-rose-100 hover:from-pink-200 hover:to-rose-200 border-pink-200 text-gray-800"
                  variant="outline"
                  onClick={() => router.push('/student/affirmations')}
                >
                  <div className="text-lg mr-3">💖</div>
                  <div className="text-left">
                    <div className="font-semibold">Positive Affirmation</div>
                    <div className="text-xs text-gray-600">Boost confidence</div>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start bg-gradient-to-r from-yellow-100 to-amber-100 hover:from-yellow-200 hover:to-amber-200 border-yellow-200 text-gray-800"
                  variant="outline"
                  onClick={() => router.push('/student/gratitude')}
                >
                  <div className="text-lg mr-3">✨</div>
                  <div className="text-left">
                    <div className="font-semibold">Gratitude Moment</div>
                    <div className="text-xs text-gray-600">Appreciate life</div>
                  </div>
                </Button>
              </div>
            </FloatingCard>

            {/* Help Request */}
            <FloatingCard delay={0.9} className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl">🆘</div>
                <h3 className="text-xl font-bold text-gray-800">Need Help?</h3>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold"
                onClick={() => router.push('/student/help')}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Request Help
              </Button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                We're here to support you! 💙
              </p>
            </FloatingCard>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Request Help</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">How urgent is this?</label>
                <select
                  value={helpRequest.urgency}
                  onChange={(e) => setHelpRequest(prev => ({ ...prev, urgency: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="low">Low - Can wait</option>
                  <option value="medium">Medium - Today would be good</option>
                  <option value="high">High - Need help soon</option>
                  <option value="urgent">Urgent - Need help now</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">What do you need help with?</label>
                <textarea
                  value={helpRequest.message}
                  onChange={(e) => setHelpRequest(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full p-2 border rounded-lg h-24"
                  placeholder="Tell us what's going on..."
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowHelpModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleHelpSubmit}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Send Help Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  return (
    <AuthGuard requiredRole="student">
      <StudentDashboardContent />
    </AuthGuard>
  )
}
