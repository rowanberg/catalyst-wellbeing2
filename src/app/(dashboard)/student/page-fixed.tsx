'use client'

import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { Heart, Target, Trophy, Sparkles, Brain, Shield, Smile, Gem, Wind, Droplets, Moon, CheckCircle, HelpCircle, Award, Star, TrendingUp, School, Calendar, MapPin, Phone, User, Crown, Zap, BookOpen, Users, Activity } from 'lucide-react'
import Link from 'next/link'

// Progress Component
const Progress = ({ value = 0, className = "" }: { value?: number; className?: string }) => (
  <div className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
    <div
      className="h-full w-full flex-1 bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
)

// Badge Component
const Badge = ({ variant = "default", className = "", children }: { variant?: "default" | "secondary" | "outline"; className?: string; children: React.ReactNode }) => {
  const variants = {
    default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
    outline: "text-gray-900 border-gray-300"
  }
  
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}

// Define interfaces for type safety
interface DashboardStats {
  level: number
  xp: number
  gems: number
  streakDays: number
  totalQuestsCompleted: number
  petHappiness: number
  petName: string
}

interface QuestData {
  status: Record<string, boolean>
  progress: {
    completed: number
    total: number
    percentage: number
  }
  data: Array<{
    quest_type: string
    completed: boolean
    xp_earned: number
    gems_earned: number
  }>
}

function StudentDashboardContent() {
  const dispatch = useAppDispatch()
  const { user, profile, isLoading: authLoading } = useAppSelector((state) => state.auth)
  const { addToast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [quests, setQuests] = useState<QuestData>({
    status: {},
    progress: { completed: 0, total: 6, percentage: 0 },
    data: []
  })
  const [mood, setMood] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    level: 1,
    xp: 0,
    gems: 0,
    streakDays: 0,
    totalQuestsCompleted: 0,
    petHappiness: 75,
    petName: 'Whiskers'
  })

  // Mock data for development
  const mockProfile = {
    id: 'mock-id',
    first_name: 'Student',
    last_name: 'User',
    school: { name: 'Demo School' },
    role: 'student'
  }

  const mockDashboardData = {
    profile: mockProfile,
    stats: {
      level: 3,
      xp: 1250,
      gems: 85,
      streakDays: 7,
      totalQuestsCompleted: 42,
      petHappiness: 85,
      petName: 'Whiskers'
    },
    quests: {
      status: {
        gratitude: true,
        kindness: false,
        courage: true,
        breathing: false,
        water: true,
        sleep: false
      },
      progress: { completed: 3, total: 6, percentage: 50 },
      data: [
        { quest_type: 'gratitude', completed: true, xp_earned: 50, gems_earned: 10 },
        { quest_type: 'kindness', completed: false, xp_earned: 0, gems_earned: 0 },
        { quest_type: 'courage', completed: true, xp_earned: 50, gems_earned: 10 },
        { quest_type: 'breathing', completed: false, xp_earned: 0, gems_earned: 0 },
        { quest_type: 'water', completed: true, xp_earned: 30, gems_earned: 5 },
        { quest_type: 'sleep', completed: false, xp_earned: 0, gems_earned: 0 }
      ]
    },
    mood: { mood: 'happy', mood_emoji: '😊' }
  }

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/dashboard')
      
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
        setStats(data.stats || mockDashboardData.stats)
        setQuests(data.quests || mockDashboardData.quests)
        setMood(data.mood || mockDashboardData.mood)
      } else {
        // Use mock data as fallback
        setDashboardData(mockDashboardData)
        setStats(mockDashboardData.stats)
        setQuests(mockDashboardData.quests)
        setMood(mockDashboardData.mood)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Use mock data as fallback
      setDashboardData(mockDashboardData)
      setStats(mockDashboardData.stats)
      setQuests(mockDashboardData.quests)
      setMood(mockDashboardData.mood)
    } finally {
      setLoading(false)
    }
  }

  // Handle quest completion
  const handleQuestToggle = async (questType: string) => {
    try {
      const response = await fetch('/api/student/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quest_type: questType })
      })

      if (response.ok) {
        const result = await response.json()
        addToast({
          type: 'success',
          title: 'Quest Completed! 🎉',
          description: `You earned ${result.xp_earned} XP and ${result.gems_earned} gems!`
        })
        fetchDashboardData() // Refresh data
      }
    } catch (error) {
      console.error('Error completing quest:', error)
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to complete quest. Please try again.'
      })
    }
  }

  // Handle mindfulness session
  const handleMindfulnessSession = async (sessionType: string) => {
    try {
      const response = await fetch('/api/student/mindfulness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_type: sessionType })
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Mindfulness Complete! 🧘',
          description: 'Great job taking time for mindfulness!'
        })
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Error completing mindfulness session:', error)
    }
  }

  // Handle help request
  const handleHelpRequest = async () => {
    try {
      const response = await fetch('/api/student/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urgency: 'medium', message: 'Student requested help from dashboard' })
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Help Request Sent! 🆘',
          description: 'A teacher will be with you shortly.'
        })
      }
    } catch (error) {
      console.error('Error sending help request:', error)
    }
  }

  useEffect(() => {
    if (user && !profile) {
      dispatch(fetchProfile(user.id))
    }
    fetchDashboardData()
  }, [user, profile, dispatch])

  // Show loading state
  if (loading || authLoading) {
    return <PageLoader />
  }

  // Get student profile - either from Redux or dashboard data
  const studentProfile = dashboardData?.profile || mockProfile
  
  // Use real profile data if available, otherwise use dashboard profile
  const displayProfile = profile || studentProfile

  if (!displayProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              We couldn't load your profile. Please try logging in again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/login'} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .animate-bounce-gentle { animation: float 3s ease-in-out infinite; }
      `}</style>
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Profile Card */}
        <Card className="card-hover bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {displayProfile.first_name} {displayProfile.last_name}
                  </h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center text-gray-600">
                      <School className="w-4 h-4 mr-2" />
                      <span>{displayProfile.school?.name || 'School Name'}</span>
                    </div>
                    <Badge variant="secondary">
                      Level {stats.level}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="flex items-center text-blue-600 font-semibold">
                      <Zap className="w-5 h-5 mr-1" />
                      {stats.xp} XP
                    </div>
                    <p className="text-sm text-gray-500">Experience</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center text-purple-600 font-semibold">
                      <Gem className="w-5 h-5 mr-1" />
                      {stats.gems} Gems
                    </div>
                    <p className="text-sm text-gray-500">Mind Gems</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center text-orange-600 font-semibold">
                      <Trophy className="w-5 h-5 mr-1" />
                      {stats.streakDays} Days
                    </div>
                    <p className="text-sm text-gray-500">Streak</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Today's Progress */}
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Today's Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Daily Quests</span>
                    <span>{quests.progress.completed}/{quests.progress.total}</span>
                  </div>
                  <Progress value={quests.progress.percentage} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.xp}</div>
                    <div className="text-xs text-gray-500">XP Today</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{stats.gems}</div>
                    <div className="text-xs text-gray-500">Gems</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mood Check */}
            <Card className="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smile className="w-5 h-5 text-yellow-600" />
                  How are you feeling?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl mb-2">{mood?.mood_emoji || '😊'}</div>
                  <p className="text-sm text-gray-600 capitalize">{mood?.mood || 'Happy'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Virtual Pet */}
            <Card className="bg-gradient-to-br from-purple-400/20 to-pink-500/20 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5 text-purple-600" />
                  {stats.petName} 🐱
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-6xl animate-bounce-gentle">🐱</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-700">Happiness</span>
                    <span className="font-semibold text-purple-800">{stats.petHappiness}%</span>
                  </div>
                  <Progress value={stats.petHappiness} className="h-2" />
                  <p className="text-xs text-purple-600">
                    Complete quests to make {stats.petName} happier!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quests */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'gratitude', icon: Heart, title: 'Gratitude Journal', description: 'Write 3 things you\'re grateful for' },
                { key: 'kindness', icon: Sparkles, title: 'Kindness Counter', description: 'Perform an act of kindness' },
                { key: 'courage', icon: Shield, title: 'Courage Log', description: 'Share something brave you did' },
                { key: 'breathing', icon: Wind, title: 'Breathing Exercise', description: 'Take 5 deep, calming breaths' },
                { key: 'water', icon: Droplets, title: 'Water Tracker', description: 'Drink 8 glasses of water' },
                { key: 'sleep', icon: Moon, title: 'Sleep Tracker', description: 'Get 8+ hours of sleep' }
              ].map((quest) => {
                const isCompleted = quests.status[quest.key] || false
                const IconComponent = quest.icon
                return (
                  <button
                    key={quest.key}
                    onClick={() => handleQuestToggle(quest.key)}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 text-left ${
                      isCompleted ? 'bg-green-500/30 border-green-400 shadow-lg' : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <IconComponent className={`w-8 h-8 ${isCompleted ? 'text-green-400' : 'text-white'} animate-bounce-gentle`} />
                      {isCompleted && <CheckCircle className="w-6 h-6 text-green-400 animate-bounce-gentle" />}
                    </div>
                    <h3 className={`font-bold mb-2 ${isCompleted ? 'text-green-100' : 'text-white'}`}>{quest.title}</h3>
                    <p className={`text-sm ${isCompleted ? 'text-green-200' : 'text-white/70'}`}>{quest.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mindfulness & Help */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="card-hover bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-3">
                <Brain className="w-6 h-6 text-teal-400" />
                Mindfulness Missions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => handleMindfulnessSession('breathing')} className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                <Wind className="w-4 h-4 mr-2" /> Guided Breathing
              </Button>
              <Button onClick={() => handleMindfulnessSession('affirmation')} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                <Sparkles className="w-4 h-4 mr-2" /> Surprise Me!
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-red-400" />
                Need Support? 🆘
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleHelpRequest} className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white">
                Request Help Now
              </Button>
              <Button onClick={() => addToast({ type: 'success', title: 'Quiz Started! 🎯', description: 'Complete the quiz to earn your Digital Citizen badge!' })} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
                <Award className="w-4 h-4 mr-2" /> Safety Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  return <StudentDashboardContent />
}
