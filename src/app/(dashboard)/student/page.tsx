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
  Heart, Star, Zap, Target, Brain, HelpCircle, X, AlertTriangle, MessageCircle, Trophy, Crown,
  Sparkles, Shield, Wind, Droplets, Moon, AlertCircle, BookOpen, Calendar, TrendingUp, 
  GraduationCap, BarChart3, Clock, Award, ChevronRight, Bell, User, MapPin, Phone
} from 'lucide-react'
import { MessagingNavButton } from '@/components/ui/messaging-nav-button'
import { AdvancedSettingsDropdown } from '@/components/ui/advanced-settings-dropdown-fixed'

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

// Enhanced FloatingCard component with better animations and styling
const FloatingCard = ({ children, className = "", delay = 0 }: { 
  children: React.ReactNode
  className?: string
  delay?: number 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ 
      duration: 0.6, 
      delay,
      type: "spring",
      stiffness: 120,
      damping: 20
    }}
    whileHover={{ 
      y: -4,
      scale: 1.02,
      transition: { duration: 0.3, ease: "easeOut" }
    }}
    className={`bg-white/90 backdrop-blur-xl rounded-3xl p-5 sm:p-7 shadow-xl border border-white/30 hover:shadow-2xl hover:border-white/50 transition-all duration-500 relative overflow-hidden ${className}`}
  >
    {/* Subtle gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
    <div className="relative z-10">
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

interface TestResult {
  id: number
  subject: string
  score: number
  maxScore: number
  date: string
  grade: string
}

interface UpcomingExam {
  id: number
  subject: string
  date: string
  time: string
  type: string
}

interface SubjectPerformance {
  subject: string
  average: number
  trend: 'up' | 'down' | 'stable'
  color: string
}

interface AcademicData {
  recentTests: TestResult[]
  upcomingExams: UpcomingExam[]
  subjectPerformance: SubjectPerformance[]
  overallGPA: number
  loading: boolean
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

interface Announcement {
  id: number
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
  created_at: string
  author?: string
}

interface Poll {
  id: string
  title: string
  description: string
  type: string
  endDate?: string
  hasResponded: boolean
  allowMultipleResponses: boolean
  questions: {
    id: string
    text: string
    type: string
    options: any[]
    required: boolean
  }[]
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

  // Academic performance state
  const [academicData, setAcademicData] = useState<AcademicData>({
    recentTests: [],
    upcomingExams: [],
    subjectPerformance: [],
    overallGPA: 0,
    loading: true
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

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  
  // Polls state
  const [polls, setPolls] = useState<Poll[]>([])
  const [showPollModal, setShowPollModal] = useState(false)
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [pollResponses, setPollResponses] = useState<{[key: string]: any}>({})

  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [helpRequest, setHelpRequest] = useState({
    urgency: 'low',
    message: ''
  })

  // Fetch polls data
  const fetchPolls = useCallback(async () => {
    try {
      // Get the current session from Supabase client
      const { supabase } = await import('@/lib/supabaseClient')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        console.log('No active session for polls fetch')
        return
      }

      const response = await fetch('/api/polls', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Student polls API response:', data)
        console.log('Number of polls for student:', data.polls?.length || 0)
        console.log('Setting polls state with:', data.polls)
        setPolls(data.polls || [])
      } else {
        console.error('Failed to fetch polls:', response.status)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('Error fetching polls:', error)
    }
  }, [])

  // Handle poll response
  const handlePollResponse = (poll: Poll) => {
    setSelectedPoll(poll)
    setShowPollModal(true)
  }

  // Submit poll response
  const submitPollResponse = async () => {
    if (!selectedPoll) return

    try {
      const answers = Object.entries(pollResponses).map(([questionId, value]) => ({
        questionId,
        value
      }))

      const response = await fetch('/api/polls/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          pollId: selectedPoll.id,
          answers
        })
      })

      if (response.ok) {
        addToast({ title: 'Success', description: 'Poll response submitted successfully!', type: 'success' })
        setShowPollModal(false)
        setSelectedPoll(null)
        setPollResponses({})
        // Refresh polls to update hasResponded status
        fetchPolls()
      } else {
        const error = await response.json()
        addToast({ title: 'Error', description: error.error || 'Failed to submit response', type: 'error' })
      }
    } catch (error) {
      console.error('Error submitting poll response:', error)
      addToast({ title: 'Error', description: 'Failed to submit response', type: 'error' })
    }
  }

  // Fetch announcements data with specific school_id
  const fetchAnnouncementsWithSchoolId = useCallback(async (schoolId: string) => {
    try {
      console.log('Fetching announcements for school_id:', schoolId)
      const response = await fetch(`/api/admin/announcements?school_id=${schoolId}&audience=students`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      console.log('Announcements response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Announcements API response:', data)
        console.log('Setting announcements state with:', data.announcements)
        console.log('Number of announcements:', data.announcements?.length || 0)
        setAnnouncements(data.announcements || [])
      } else {
        console.error('Failed to fetch announcements:', response.status, await response.text())
        setAnnouncements([])
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
      setAnnouncements([])
    }
  }, [])

  // Fetch announcements data using profile state
  const fetchAnnouncements = useCallback(async () => {
    if (!profile?.school_id) {
      console.log('No school_id available, skipping announcements fetch')
      console.log('Current profile:', profile)
      return
    }
    console.log('Fetching announcements with school_id from profile:', profile.school_id)
    await fetchAnnouncementsWithSchoolId(profile.school_id)
  }, [profile?.school_id, fetchAnnouncementsWithSchoolId])

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/dashboard', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Dashboard API response:', data)
        console.log('Profile data:', data.profile)
        console.log('School data:', data.profile?.school)
        console.log('Profile school_id:', data.profile?.school_id)
        console.log('Profile school_code:', data.profile?.school_code)
        
        // Set profile and stats from API response
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
        setAcademicData({
          recentTests: data.academic?.recentTests || [],
          upcomingExams: data.academic?.upcomingExams || [],
          subjectPerformance: data.academic?.subjectPerformance || [],
          overallGPA: data.academic?.overallGPA || 0,
          loading: false
        })
        
        // Fetch announcements and polls after profile is set
        if (data.profile?.school_id) {
          console.log('Profile has school_id, fetching announcements and polls...')
          // Call fetchAnnouncements with the new profile data directly
          await fetchAnnouncementsWithSchoolId(data.profile.school_id)
          // Fetch polls for the student
          await fetchPolls()
        } else if (data.profile?.school_code) {
          console.log('No school_id but has school_code, trying with school_code...')
          // Fallback: try to fetch announcements using school_code
          try {
            const response = await fetch(`/api/admin/announcements?school_code=${data.profile.school_code}&audience=students`, {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            })
            if (response.ok) {
              const announcementData = await response.json()
              setAnnouncements(announcementData.announcements || [])
            }
          } catch (error) {
            console.error('Failed to fetch announcements with school_code:', error)
          }
        } else {
          console.log('No school_id or school_code in profile, cannot fetch announcements')
        }
      }
    } catch (error) {
      // Fallback to Redux profile and mock data on error
      setProfile(reduxProfile)
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
      // Mock academic data
      setAcademicData({
        recentTests: [
          { id: 1, subject: 'Mathematics', score: 92, maxScore: 100, date: '2024-09-05', grade: 'A' },
          { id: 2, subject: 'Science', score: 88, maxScore: 100, date: '2024-09-03', grade: 'B+' },
          { id: 3, subject: 'English', score: 95, maxScore: 100, date: '2024-09-01', grade: 'A+' }
        ],
        upcomingExams: [
          { id: 1, subject: 'History', date: '2024-09-15', time: '10:00 AM', type: 'Mid-term' },
          { id: 2, subject: 'Geography', date: '2024-09-18', time: '2:00 PM', type: 'Quiz' }
        ],
        subjectPerformance: [
          { subject: 'Mathematics', average: 89, trend: 'up', color: 'blue' },
          { subject: 'Science', average: 85, trend: 'up', color: 'green' },
          { subject: 'English', average: 92, trend: 'stable', color: 'purple' },
          { subject: 'History', average: 78, trend: 'down', color: 'orange' }
        ],
        overallGPA: 3.7,
        loading: false
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}></div>
      </div>
      
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl relative z-10">

        {/* Student Profile Card - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <FloatingCard className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-2xl border-0">
            {/* Mobile Layout */}
            <div className="block sm:hidden">
              <div className="flex items-center justify-between mb-4">
                {/* Avatar and Basic Info */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm border-2 border-white/40 shadow-lg overflow-hidden">
                      {profile?.profile_picture_url ? (
                        <img
                          src={profile.profile_picture_url}
                          alt={`${profile?.first_name || 'Student'}'s profile`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : '👤'}</span>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs">
                      👑
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold truncate">
                      {profile?.first_name && profile?.last_name 
                        ? `${profile.first_name} ${profile.last_name}` 
                        : 'Welcome, Student!'}
                    </h1>
                    {profile?.school?.name && (
                      <p className="text-sm text-white/80 font-medium truncate">
                        🏫 {profile.school.name}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Chat and Settings Icons */}
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => router.push('/student/messaging')}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 p-2 h-10 w-10"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                  <AdvancedSettingsDropdown 
                    profile={profile}
                    onProfileUpdate={(updates: any) => {
                      setProfile((prev: any) => ({ ...prev, ...updates }))
                    }}
                  />
                </div>
              </div>
              
              {/* Grade and Class Info */}
              <div className="flex items-center justify-center space-x-6 mb-4">
                {profile?.grade_level && (
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">📚</span>
                    <span className="font-medium text-sm">Grade {profile.grade_level}</span>
                  </div>
                )}
                {profile?.class_name && (
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">🚪</span>
                    <span className="font-medium text-sm">{profile.class_name}</span>
                  </div>
                )}
              </div>
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center bg-white/10 rounded-lg p-3">
                  <div className="text-xl font-bold">{stats.level}</div>
                  <div className="text-xs text-white/80">Level</div>
                </div>
                <div className="text-center bg-white/10 rounded-lg p-3">
                  <div className="text-xl font-bold">{stats.streakDays}</div>
                  <div className="text-xs text-white/80">Streak</div>
                </div>
                <div className="text-center bg-white/10 rounded-lg p-3">
                  <div className="text-xl font-bold">{stats.totalQuestsCompleted}</div>
                  <div className="text-xs text-white/80">Quests</div>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center space-y-0 space-x-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center text-3xl sm:text-4xl backdrop-blur-sm border-3 border-white/40 shadow-lg overflow-hidden">
                  {profile?.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt={`${profile?.first_name || 'Student'}'s profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : '👤'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm sm:text-lg">
                  👑
                </div>
              </div>
              
              {/* Student Info */}
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}` 
                    : 'Welcome, Student!'}
                  {profile?.school?.name && (
                    <span className="block text-lg sm:text-xl text-white/80 font-medium mt-1">
                      🏫 {profile.school.name}
                    </span>
                  )}
                </h1>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-white/90 text-sm sm:text-base">
                  {profile?.grade_level && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="text-sm sm:text-lg">📚</span>
                      <span className="font-medium">Grade {profile.grade_level}</span>
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
              
              {/* Stats and Controls */}
              <div className="flex items-center space-x-4 lg:space-x-6">
                <MessagingNavButton userRole="student" variant="ghost" className="text-white hover:bg-white/20" />
                <AdvancedSettingsDropdown 
                  profile={profile}
                  onProfileUpdate={(updates: any) => {
                    setProfile((prev: any) => ({ ...prev, ...updates }))
                  }}
                />
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

        {/* School Updates Section - Combined Polls and Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <FloatingCard className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">School Updates</h3>
                  <p className="text-sm text-gray-600">Polls, announcements, and important news</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Render Polls (only non-completed ones) */}
              {polls.filter(poll => !poll.hasResponded).slice(0, 2).map((poll) => (
                <div key={`poll-${poll.id}`} className="bg-white/80 rounded-lg p-4 hover:bg-white/90 transition-colors border border-purple-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded text-white text-xs font-bold px-2">
                          POLL
                        </div>
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <h4 className="font-semibold text-gray-800 truncate">{poll.title}</h4>
                        <Badge variant="purple" className="text-xs">New</Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{poll.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {poll.questions?.length || 0} question{(poll.questions?.length || 0) !== 1 ? 's' : ''}
                          </span>
                          {poll.endDate && (
                            <span className="text-xs text-gray-500">
                              • Ends {new Date(poll.endDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <Button
                          onClick={() => handlePollResponse(poll)}
                          size="sm"
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs px-3 py-1"
                        >
                          Respond
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Render Announcements (fill remaining slots up to 2 total) */}
              {(() => {
                const availablePolls = polls.filter(poll => !poll.hasResponded).length;
                const remainingSlots = Math.max(0, 2 - availablePolls);
                return announcements.slice(0, remainingSlots).map((announcement) => (
                  <div key={`announcement-${announcement.id}`} className="bg-white/80 rounded-lg p-4 hover:bg-white/90 transition-colors border border-blue-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded text-white text-xs font-bold px-2">
                            NEWS
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            announcement.priority === 'high' ? 'bg-red-500' : 
                            announcement.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <h4 className="font-semibold text-gray-800 truncate">{announcement.title}</h4>
                          <Badge variant={
                            announcement.priority === 'high' ? "destructive" : 
                            announcement.priority === 'medium' ? "warning" : "success"
                          } className="text-xs">
                            {announcement.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {new Date(announcement.created_at).toLocaleDateString()}
                            </span>
                            {announcement.author && (
                              <span className="text-xs text-gray-500">
                                • by {announcement.author}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              })()}

              {/* View All Button */}
              {(polls.filter(poll => !poll.hasResponded).length > 0 || announcements.length > 0) && (
                <div className="pt-3 border-t border-gray-200">
                  <Button
                    onClick={() => router.push('/student/announcements')}
                    variant="outline"
                    className="w-full bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-pink-100 hover:border-purple-300 transition-all duration-300"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View All Updates
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Empty State */}
              {polls.length === 0 && announcements.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No updates at this time</p>
                  <p className="text-xs text-gray-400 mt-1">Check back later for polls and announcements</p>
                </div>
              )}
            </div>
          </FloatingCard>
        </motion.div>

        {/* Daily Inspiration & Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mb-6 sm:mb-8"
        >
          <FloatingCard className="bg-gradient-to-r from-emerald-400/10 via-teal-400/10 to-cyan-400/10 border-emerald-200/50 backdrop-blur-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              {/* Daily Inspiration Section */}
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg animate-pulse">
                  🌟
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
                    Daily Inspiration
                  </h3>
                  <p className="text-sm text-gray-700 font-medium max-w-md leading-relaxed">
                    {[
                      "Every small step counts towards your big dreams! Keep moving forward! 🚀",
                      "You're braver than you believe and stronger than you seem! Show the world! 💪",
                      "Today is a perfect day to learn something new! Embrace curiosity! 📚",
                      "Your kindness creates ripples of joy everywhere you go! Spread love! 🌊",
                      "Believe in yourself - you're absolutely amazing just as you are! ✨",
                      "Every challenge is a chance to grow stronger and wiser! Face it boldly! 🌱",
                      "Your unique talents make the world a brighter place! Shine on! 🌞"
                    ][new Date().getDay()]}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    <span className="text-xs text-emerald-600 font-medium">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => router.push('/student/black-marks')}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-red-200 text-red-700 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  My Black Marks
                </Button>
                <Button
                  onClick={() => router.push('/student/messaging')}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 text-blue-700 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Messages
                </Button>
                <Button
                  onClick={() => router.push('/student/achievements')}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-200 text-purple-700 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Badges
                </Button>
                <Button
                  onClick={() => router.push('/student/leaderboard')}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border-yellow-200 text-yellow-700 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Leaderboard
                </Button>
              </div>
            </div>
          </FloatingCard>
        </motion.div>

        {/* Weekly Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4 sm:mb-6"
        >
          <FloatingCard className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Weekly Progress</h3>
                  <p className="text-sm text-gray-600">Keep up the amazing work!</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 sm:space-x-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-indigo-600">{stats.weeklyXP || 180}</div>
                  <div className="text-xs text-gray-500">Weekly XP</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">#{stats.rank || 12}</div>
                  <div className="text-xs text-gray-500">Class Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-pink-600">{quests.streakData.current || stats.streakDays}</div>
                  <div className="text-xs text-gray-500">Day Streak</div>
                </div>
              </div>
            </div>
          </FloatingCard>
        </motion.div>

        {/* Academic Performance Overview */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-6"
        >
          <FloatingCard className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Academic Performance</h3>
                  <p className="text-sm text-gray-600">Your learning journey</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{(academicData.overallGPA || 0).toFixed(1)}</div>
                <div className="text-xs text-gray-500">Overall GPA</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {academicData.subjectPerformance && academicData.subjectPerformance.length > 0 ? (
                academicData.subjectPerformance.map((subject, index) => (
                  <div key={subject.subject} className="bg-white/80 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm text-gray-800">{subject.subject}</h4>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        subject.trend === 'up' ? 'bg-green-100 text-green-700' :
                        subject.trend === 'down' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {subject.trend === 'up' ? '↗️' : subject.trend === 'down' ? '↘️' : '➡️'}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-800 mb-1">{subject.average}%</div>
                    <Progress value={subject.average} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-6 text-gray-500">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No academic data available yet</p>
                </div>
              )}
            </div>
          </FloatingCard>
        </motion.div>

        {/* Recent Test Results & Upcoming Exams */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Test Results */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <FloatingCard className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-800">Recent Results</h3>
                </div>
                <Button
                  onClick={() => router.push('/student/grades')}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-green-100 hover:bg-green-200 border-green-300"
                >
                  View All
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {academicData.recentTests && academicData.recentTests.length > 0 ? (
                  academicData.recentTests.slice(0, 3).map((test) => (
                    <div key={test.id} className="bg-white/80 rounded-lg p-3 hover:bg-white/90 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            test.score >= 90 ? 'bg-green-500' :
                            test.score >= 80 ? 'bg-blue-500' :
                            test.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            {test.grade}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-800">{test.subject}</div>
                            <div className="text-xs text-gray-500">{new Date(test.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-800">{test.score}/{test.maxScore}</div>
                          <div className="text-xs text-gray-500">{((test.score / test.maxScore) * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                      <Progress value={(test.score / test.maxScore) * 100} className="h-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent test results</p>
                  </div>
                )}
              </div>
            </FloatingCard>
          </motion.div>

          {/* Upcoming Exams */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <FloatingCard className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-800">Upcoming Exams</h3>
                </div>
                <Button
                  onClick={() => router.push('/student/calendar')}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-orange-100 hover:bg-orange-200 border-orange-300"
                >
                  Full Calendar
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {academicData.upcomingExams.map((exam) => (
                  <div key={exam.id} className="bg-white/80 rounded-lg p-3 hover:bg-white/90 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gray-800">{exam.subject}</div>
                          <div className="text-xs text-gray-500">{exam.type}</div>
                          <div className="text-xs text-orange-600 font-medium">
                            {new Date(exam.date).toLocaleDateString()} at {exam.time}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => router.push(`/student/exam-prep/${exam.id}`)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Prepare
                      </Button>
                    </div>
                  </div>
                ))}
                
                {academicData.upcomingExams.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming exams</p>
                  </div>
                )}
              </div>
            </FloatingCard>
          </motion.div>
        </div>

        {/* Performance Analytics & Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6"
        >
          <FloatingCard className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-purple-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Performance Analytics</h3>
                  <p className="text-sm text-gray-600">Track your academic progress</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push('/student/study-plan/dashboard')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  size="sm"
                >
                  <Brain className="w-4 h-4 mr-1" />
                  Study Plans
                </Button>
                <Button
                  onClick={() => router.push('/student/analytics')}
                  variant="outline"
                  size="sm"
                  className="bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-700"
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Analytics
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Grade Distribution */}
              <div className="bg-white/80 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Award className="w-4 h-4 mr-2 text-purple-600" />
                  Grade Distribution
                </h4>
                <div className="space-y-2">
                  {[
                    { grade: 'A+', count: 3, color: 'bg-green-500' },
                    { grade: 'A', count: 5, color: 'bg-blue-500' },
                    { grade: 'B+', count: 2, color: 'bg-yellow-500' },
                    { grade: 'B', count: 1, color: 'bg-orange-500' }
                  ].map((item) => (
                    <div key={item.grade} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm font-medium text-gray-700">{item.grade}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${(item.count / 11) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-6">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Streak */}
              <div className="bg-white/80 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-purple-600" />
                  Study Consistency
                </h4>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">12</div>
                  <div className="text-sm text-gray-600 mb-3">Days Study Streak</div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 14 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-sm ${
                          i < 12 ? 'bg-purple-400' : 'bg-gray-200'
                        }`}
                        title={`Day ${i + 1}`}
                      ></div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Last 2 weeks</div>
                </div>
              </div>

              {/* Improvement Areas */}
              <div className="bg-white/80 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                  Focus Areas
                </h4>
                <div className="space-y-3">
                  {[
                    { subject: 'History', improvement: '+5%', color: 'text-green-600' },
                    { subject: 'Geography', improvement: '+3%', color: 'text-green-600' },
                    { subject: 'Physics', improvement: '-2%', color: 'text-red-600' }
                  ].map((item) => (
                    <div key={item.subject} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.subject}</span>
                      <span className={`text-sm font-medium ${item.color}`}>
                        {item.improvement}
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => router.push('/student/study-plan')}
                  className="w-full mt-3 bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300"
                  variant="outline"
                  size="sm"
                >
                  Create Study Plan
                </Button>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-purple-200">
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">89%</div>
                <div className="text-xs text-gray-500">Avg Score</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">15</div>
                <div className="text-xs text-gray-500">Tests Taken</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">8</div>
                <div className="text-xs text-gray-500">Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">92%</div>
                <div className="text-xs text-gray-500">Attendance</div>
              </div>
            </div>
          </FloatingCard>
        </motion.div>

        {/* Enhanced Achievement Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-10">
          <FloatingCard delay={0.1} className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-200/50 hover:border-amber-300/70">
            <div className="text-center">
              <motion.div 
                className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                key={`xp-icon-${stats.xp}`}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                ⭐
              </motion.div>
              <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-1">
                {stats.xp}
              </div>
              <div className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Experience Points</div>
            </div>
          </FloatingCard>

          <FloatingCard delay={0.2} className="bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 border-pink-200/50 hover:border-pink-300/70">
            <div className="text-center">
              <motion.div 
                className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                key={`gems-icon-${stats.gems}`}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.5 }}
                whileHover={{ scale: 1.15, rotate: -5 }}
              >
                💎
              </motion.div>
              <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-1">
                {stats.gems}
              </div>
              <div className="text-xs text-pink-700 font-semibold uppercase tracking-wide">Mind Gems</div>
            </div>
          </FloatingCard>

          <FloatingCard delay={0.3} className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-200/50 hover:border-emerald-300/70">
            <div className="text-center">
              <motion.div 
                className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                key={`level-icon-${stats.level}`}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 1 }}
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                🏆
              </motion.div>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
                Level {stats.level}
              </div>
              <div className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Current Level</div>
            </div>
          </FloatingCard>

          <FloatingCard delay={0.4} className="bg-gradient-to-br from-green-100 to-green-200 border-green-300">
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-xl sm:text-2xl font-bold text-green-700">{stats.totalQuestsCompleted}</p>
              <p className="text-xs sm:text-sm text-green-600">Quests</p>
            </div>
          </FloatingCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
          {/* Daily Quests */}
          <div className="lg:col-span-2">
            <FloatingCard delay={0.5} className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">🎯</div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Today's Adventures</h2>
                </div>
                <Badge variant="purple" className="text-sm sm:text-lg px-2 sm:px-4 py-1 sm:py-2">
                  {quests.progress.completed}/{quests.progress.total} Done
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
                      <div className="text-lg font-bold text-green-700">
                        🌟 All Adventures Complete! 🌟
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Added to your treasure chest!</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
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
                      className={`p-2 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        Boolean(quests.status[questType as keyof QuestStatus])
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
                        <div className={`p-1 sm:p-3 rounded-full text-lg sm:text-2xl ${
                          Boolean(quests.status[questType as keyof QuestStatus])
                            ? 'bg-green-100'
                            : 'bg-purple-100'
                        }`}>
                          {questEmojis[questType as keyof typeof questEmojis]}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xs sm:text-lg text-gray-800">
                            {questTitles[questType as keyof typeof questTitles]}
                          </h3>
                          {Boolean(quests.status[questType as keyof QuestStatus]) && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="mt-2"
                            >
                              <span className="text-xs sm:text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                🎉 Completed!
                              </span>
                            </motion.div>
                          )}
                          <p className="text-xs text-gray-600 mt-1 hidden sm:block">
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
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">How are you feeling?</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-3">
                {Object.entries(moodEmojis).map(([moodType, emoji]) => {
                  const isSelected = mood.current === moodType
                  const isLocked = mood.current && mood.current !== ''
                  
                  return (
                    <motion.button
                      key={moodType}
                      whileHover={{ scale: isLocked && !isSelected ? 1 : 1.05 }}
                      whileTap={{ scale: isLocked && !isSelected ? 1 : 0.95 }}
                      disabled={Boolean(isLocked && !isSelected)}
                      className={`p-1 sm:p-4 rounded-xl text-center transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-br from-purple-200 to-pink-200 border-2 border-purple-400 shadow-lg'
                          : isLocked
                          ? 'bg-gray-100 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                          : 'bg-white border-2 border-gray-200 hover:border-purple-300 hover:shadow-md'
                      }`}
                      onClick={() => !isLocked && handleMoodUpdate(moodType)}
                    >
                      <div className="text-xl sm:text-3xl mb-1 sm:mb-2">{emoji}</div>
                      <div className="text-xs sm:text-sm font-semibold capitalize text-gray-700">{moodType}</div>
                      {isSelected && (
                        <div className="text-xs text-purple-600 mt-1 flex items-center justify-center gap-1">
                          🔒 Locked for today
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </FloatingCard>

            {/* Virtual Pet */}
            <FloatingCard delay={0.7} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">🐾</div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">Meet {stats.petName}!</h3>
                </div>
                <Button
                  onClick={() => router.push('/student/pet')}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-yellow-100 hover:bg-yellow-200 border-yellow-300"
                >
                  Care for Pet
                </Button>
              </div>
              <div className="text-center">
                <motion.div 
                  className="text-5xl sm:text-8xl mb-2 sm:mb-4 inline-block cursor-pointer"
                  animate={{ 
                    scale: stats.petHappiness > 80 ? [1, 1.1, 1] : 1,
                    rotate: stats.petHappiness > 90 ? [0, 5, -5, 0] : 0
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Pet interaction - small happiness boost
                    setStats(prev => ({
                      ...prev,
                      petHappiness: Math.min(prev.petHappiness + 1, 100)
                    }))
                    addToast({
                      title: "Pet Interaction",
                      description: `${stats.petName} loves your attention! +1 happiness`,
                      type: "success"
                    })
                  }}
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
                  <p className="text-xs text-gray-500 mt-1">
                    Click on {stats.petName} to give some love!
                  </p>
                </div>
              </div>
            </FloatingCard>

            {/* Mindfulness */}
            <FloatingCard delay={0.8} className="bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl">🧘</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Mindfulness</h3>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <Button
                  className="w-full justify-start bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 border-blue-200 text-gray-800 text-xs sm:text-base py-1 sm:py-3"
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
                  className="w-full justify-start bg-gradient-to-r from-pink-100 to-rose-100 hover:from-pink-200 hover:to-rose-200 border-pink-200 text-gray-800 text-xs sm:text-base py-1 sm:py-3"
                  variant="outline"
                  onClick={() => router.push('/student/affirmations')}
                >
                  <div className="text-base sm:text-lg mr-2 sm:mr-3">💖</div>
                  <div className="text-left">
                    <div className="font-semibold text-sm sm:text-base">Positive Affirmation</div>
                    <div className="text-xs text-gray-600 hidden sm:block">Boost confidence</div>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start bg-gradient-to-r from-yellow-100 to-amber-100 hover:from-yellow-200 hover:to-amber-200 border-yellow-200 text-gray-800 text-xs sm:text-base py-1 sm:py-3"
                  variant="outline"
                  onClick={() => router.push('/student/gratitude')}
                >
                  <div className="text-base sm:text-lg mr-2 sm:mr-3">✨</div>
                  <div className="text-left">
                    <div className="font-semibold text-sm sm:text-base">Gratitude Moment</div>
                    <div className="text-xs text-gray-600 hidden sm:block">Appreciate life</div>
                  </div>
                </Button>
              </div>
            </FloatingCard>

            {/* Digital Citizenship & Safety */}
            <FloatingCard delay={0.85} className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl">🛡️</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Digital Safety</h3>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <Button
                  className="w-full justify-start bg-gradient-to-r from-cyan-100 to-blue-100 hover:from-cyan-200 hover:to-blue-200 border-cyan-200 text-gray-800 text-xs sm:text-base py-1 sm:py-3"
                  variant="outline"
                  onClick={() => router.push('/student/digital-citizenship')}
                >
                  <div className="text-base sm:text-lg mr-2 sm:mr-3">🎓</div>
                  <div className="text-left">
                    <div className="font-semibold text-sm sm:text-base">Safety Quiz</div>
                    <div className="text-xs text-gray-600 hidden sm:block">Earn safety badges</div>
                  </div>
                </Button>
                <Button
                  className="w-full justify-start bg-gradient-to-r from-emerald-100 to-green-100 hover:from-emerald-200 hover:to-green-200 border-emerald-200 text-gray-800 text-xs sm:text-base py-1 sm:py-3"
                  variant="outline"
                  onClick={() => router.push('/student/anti-bullying')}
                >
                  <div className="text-base sm:text-lg mr-2 sm:mr-3">🤝</div>
                  <div className="text-left">
                    <div className="font-semibold text-sm sm:text-base">Kindness Pledge</div>
                    <div className="text-xs text-gray-600 hidden sm:block">Stand against bullying</div>
                  </div>
                </Button>
              </div>
            </FloatingCard>

            {/* Help Request */}
            <FloatingCard delay={0.9} className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl">🆘</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Need Help?</h3>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold text-sm sm:text-base py-2 sm:py-3"
                onClick={() => router.push('/student/help')}
              >
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
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

      {/* Poll Response Modal */}
      {showPollModal && selectedPoll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedPoll.title}</h2>
                  <p className="text-gray-600 mt-1">{selectedPoll.description}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPollModal(false)
                    setSelectedPoll(null)
                    setPollResponses({})
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {selectedPoll.questions.map((question, index) => (
                  <div key={question.id} className="border-b pb-4 last:border-b-0">
                    <h3 className="font-semibold text-gray-800 mb-3">
                      {index + 1}. {question.text}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>

                    {(question.type === 'multiple_choice' || question.type === 'single_choice') && (
                      <div className="space-y-3">
                        {question.options.map((option: string, optionIndex: number) => (
                          <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
                            <input
                              type={question.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                              name={`question-${question.id}`}
                              value={option}
                              checked={
                                question.type === 'multiple_choice' 
                                  ? (pollResponses[question.id] || []).includes(option)
                                  : pollResponses[question.id] === option
                              }
                              onChange={(e) => {
                                if (question.type === 'multiple_choice') {
                                  const currentSelections = pollResponses[question.id] || []
                                  const newSelections = e.target.checked
                                    ? [...currentSelections, option]
                                    : currentSelections.filter((item: string) => item !== option)
                                  setPollResponses(prev => ({
                                    ...prev,
                                    [question.id]: newSelections
                                  }))
                                } else {
                                  setPollResponses(prev => ({
                                    ...prev,
                                    [question.id]: e.target.value
                                  }))
                                }
                              }}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className="text-gray-700 font-medium">{option}</span>
                          </label>
                        ))}
                        {question.type === 'multiple_choice' && (
                          <p className="text-sm text-gray-500 mt-2">
                            ✓ You can select multiple options
                          </p>
                        )}
                      </div>
                    )}

                    {question.type === 'yes_no' && (
                      <div className="space-y-3">
                        {['Yes', 'No'].map((option) => (
                          <label key={option} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option}
                              checked={pollResponses[question.id] === option}
                              onChange={(e) => setPollResponses(prev => ({
                                ...prev,
                                [question.id]: e.target.value
                              }))}
                              className="w-4 h-4 text-purple-600"
                            />
                            <span className="text-gray-700 font-medium">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'text' && (
                      <textarea
                        value={pollResponses[question.id] || ''}
                        onChange={(e) => setPollResponses(prev => ({
                          ...prev,
                          [question.id]: e.target.value
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Enter your response..."
                      />
                    )}

                    {question.type === 'rating' && (
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setPollResponses(prev => ({
                              ...prev,
                              [question.id]: rating.toString()
                            }))}
                            className={`w-10 h-10 rounded-full border-2 font-semibold transition-colors ${
                              pollResponses[question.id] === rating.toString()
                                ? 'bg-purple-500 text-white border-purple-500'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-purple-300'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 mt-6 pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowPollModal(false)
                    setSelectedPoll(null)
                    setPollResponses({})
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitPollResponse}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                  disabled={selectedPoll.questions.some(q => 
                    q.required && !pollResponses[q.id]
                  )}
                >
                  Submit Response
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Student Footer */}
      <footer className="mt-12 bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.3) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12">
          {/* School Information Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <GraduationCap className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                Student of {profile?.school?.name || 'Your School'}
              </h3>
              <p className="text-white/80 text-sm sm:text-base">
                Your educational journey continues here
              </p>
            </motion.div>
          </div>

          {/* School Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* School Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                  <MapPin className="w-5 h-5 text-blue-300" />
                </div>
                <h4 className="font-semibold text-white">School Address</h4>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                {profile?.school?.address || "123 Education Street, Learning City, LC 12345"}
              </p>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                  <Phone className="w-5 h-5 text-green-300" />
                </div>
                <h4 className="font-semibold text-white">Contact Info</h4>
              </div>
              <div className="space-y-2 text-sm text-white/80">
                <p>📞 {profile?.school?.phone || "(555) 123-4567"}</p>
                <p>📧 {profile?.school?.email || "info@school.edu"}</p>
              </div>
            </motion.div>

            {/* School Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg mr-3">
                  <Clock className="w-5 h-5 text-yellow-300" />
                </div>
                <h4 className="font-semibold text-white">School Hours</h4>
              </div>
              <div className="space-y-1 text-sm text-white/80">
                <p>Monday - Friday</p>
                <p className="font-medium">8:00 AM - 3:30 PM</p>
                <p className="text-xs text-white/60">Office: 7:30 AM - 4:00 PM</p>
              </div>
            </motion.div>

            {/* Emergency Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-red-500/20 rounded-lg mr-3">
                  <AlertTriangle className="w-5 h-5 text-red-300" />
                </div>
                <h4 className="font-semibold text-white">Emergency</h4>
              </div>
              <div className="space-y-1 text-sm text-white/80">
                <p>🚨 Emergency: 911</p>
                <p>🏥 School Nurse: Ext. 123</p>
                <p>👮 Security: Ext. 456</p>
              </div>
            </motion.div>
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8"
          >
            <h4 className="text-lg font-semibold text-white mb-4 text-center">Quick Links</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { icon: BookOpen, label: 'Library', href: '/student/library' },
                { icon: Calendar, label: 'Schedule', href: '/student/schedule' },
                { icon: Trophy, label: 'Achievements', href: '/student/achievements' },
                { icon: HelpCircle, label: 'Help Center', href: '/student/help' },
                { icon: MessageCircle, label: 'Support', href: '/student/messaging' },
                { icon: Bell, label: 'Notifications', href: '/student/announcements' }
              ].map((link, index) => (
                <motion.button
                  key={link.label}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/40"
                  onClick={() => window.location.href = link.href}
                >
                  <link.icon className="w-5 h-5 text-white mb-2" />
                  <span className="text-xs text-white/90 font-medium">{link.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Footer Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="border-t border-white/20 pt-6 text-center"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-semibold">Catalyst Wellbeing</span>
              </div>
              
              <div className="text-sm text-white/60">
                <p>© 2024 {profile?.school?.name || 'Your School'}. All rights reserved.</p>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-white/80">
                <button className="hover:text-white transition-colors">Privacy Policy</button>
                <span>•</span>
                <button className="hover:text-white transition-colors">Terms of Use</button>
                <span>•</span>
                <button className="hover:text-white transition-colors">Support</button>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-white/50">
              <p>Need help? Contact your teacher or visit the Help Center for assistance.</p>
            </div>
          </motion.div>
        </div>
      </footer>
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
