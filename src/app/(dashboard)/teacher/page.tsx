'use client'

import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback, memo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimatedProgressBar } from '@/components/ui/animated-progress-bar'
import { detectDevicePerformance, getAnimationConfig } from '@/lib/utils/devicePerformance'
import { useDarkMode } from '@/contexts/DarkModeContext'
import { TopLoader } from '@/components/ui/top-loader'

// Dynamic imports for heavy components (lazy load on demand)
const GradeBasedStudentRoster = dynamic(() => import('@/components/teacher/GradeBasedStudentRoster'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
})
const ShoutOutsSystem = dynamic(() => import('@/components/teacher/shout-outs-system'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div></div>
})
const QuestBadgeCreator = dynamic(() => import('@/components/teacher/quest-badge-creator'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
})
const BlackMarkSystem = dynamic(() => import('@/components/teacher/BlackMarkSystem'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>
})
const InteractiveActivitiesSystem = dynamic(() => import('@/components/teacher/interactive-activities-system'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
})
const TeacherCommunityPage = dynamic(() => import('./community/page').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
})
const UpdateResultsSystem = dynamic(() => import('@/components/teacher/UpdateResultsSystem'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>
})
const ComprehensiveAnalytics = dynamic(() => import('@/components/teacher/ComprehensiveAnalytics'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div></div>
})
const TeacherStudentsPage = dynamic(() => import('./students/page').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
})
const TeacherAttendancePage = dynamic(() => import('./attendance/page').then(mod => ({ default: mod.default })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>
})
const IncidentManagement = dynamic(() => import('@/components/teacher/IncidentManagement').then(mod => ({ default: mod.IncidentManagement })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div></div>
})
const TeacherWellbeingTab = dynamic(() => import('@/components/teacher/TeacherWellbeingTab').then(mod => ({ default: mod.TeacherWellbeingTab })), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div></div>
})
import {
  Users,
  TrendingUp,
  Heart,
  AlertTriangle,
  Trophy,
  Target,
  MessageSquare,
  Calendar,
  Bell,
  Plus,
  Search,
  Filter,
  BarChart3,
  BookOpen,
  Star,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Megaphone,
  Brain,
  Activity,
  Smile,
  Frown,
  Meh,
  Play,
  Lightbulb,
  MessageCircle,
  Gamepad2,
  ArrowRight,
  Rocket,
  GraduationCap,
  Gem,
  HeartHandshake,
  School,
  Coffee,
  Settings,
  Shield,
  AlertCircle,
  FileText,
  Menu,
  X,
  MapPin,
  LayoutGrid,
  RefreshCw,
  CreditCard
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { ProfileDropdown } from '@/components/ui/profile-dropdown'
import { useAppSelector } from '@/lib/redux/hooks'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { fetchTeacherDashboard, teacherCache } from '@/lib/client/teacherCache'

interface StudentOverview {
  id: string
  first_name: string
  last_name: string
  xp: number
  level: number
  gems: number
  last_active: string
  current_mood?: string
  mood_updated_at?: string
  streak_days?: number
  grade_level: string
  class_name: string
}

interface ClassAnalytics {
  totalStudents: number
  averageXP: number
  activeToday: number
  helpRequests: number
  moodDistribution: {
    happy: number
    excited: number
    calm: number
    sad: number
    angry: number
    anxious: number
  }
  averageStreak: number
}

interface IncidentLog {
  id: string
  student_id: string
  teacher_id: string
  type: 'behavioral' | 'academic' | 'positive'
  description: string
  severity: 'low' | 'medium' | 'high'
  created_at: string
  student_name: string
}

interface ShoutOut {
  id: string
  student_id: string
  teacher_id: string
  message: string
  badge_type: string
  created_at: string
}

function TeacherDashboardContent() {
  const { user, profile } = useAppSelector((state) => state.auth)

  // Use the comprehensive dashboard from TeacherDashboardContentOld
  return <TeacherDashboardContentOld user={user} profile={profile} />
}

function TeacherDashboardContentOld({ user, profile }: { user: any, profile: any }) {
  // Device performance detection
  const devicePerf = useMemo(() => detectDevicePerformance(), [])
  const animConfig = useMemo(() => getAnimationConfig(devicePerf.mode), [devicePerf.mode])

  // Preload attendance page and data in background for instant navigation
  useEffect(() => {
    // Delay preload by 2 seconds to let initial dashboard load first
    const preloadTimer = setTimeout(async () => {
      console.log('🚀 Preloading attendance page in background...')

      // Load component and data in parallel
      const componentPromise = import('./attendance/page').then(() => {
        console.log('✅ Attendance page component preloaded')
      }).catch(err => {
        console.warn('⚠️ Failed to preload attendance page:', err)
      })

      // Prefetch API data
      const dataPromise = import('@/lib/prefetch/attendancePrefetch').then(({ prefetchAttendanceData }) => {
        if (user?.id) {
          return prefetchAttendanceData({
            userId: user.id,
            schoolId: profile?.school_id
          })
        }
        return Promise.resolve()
      }).catch(err => {
        console.warn('⚠️ Failed to prefetch attendance data:', err)
      })

      await Promise.all([componentPromise, dataPromise])
      console.log('✅ Attendance page fully preloaded (component + data)')
    }, 2000)

    return () => clearTimeout(preloadTimer)
  }, [user?.id, profile?.school_id])

  // Preload students page component in the background so navigation from sidebar feels instant
  useEffect(() => {
    const timer = setTimeout(() => {
      import('./students/page')
        .then(() => {
          console.log('✅ Teacher students page component preloaded')
        })
        .catch(err => {
          console.warn('⚠️ Failed to preload teacher students page:', err)
        })
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Conditional Motion wrapper - memoized for performance
  const ConditionalMotion = useMemo(() => {
    const Component = memo(({ children, ...props }: any) => {
      if (!animConfig.enableAnimations) {
        return <div {...(props.className ? { className: props.className } : {})}>{children}</div>
      }
      return <motion.div {...props}>{children}</motion.div>
    })
    Component.displayName = 'ConditionalMotion'
    return Component
  }, [animConfig.enableAnimations])

  const [students, setStudents] = useState<StudentOverview[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClassForTopic, setSelectedClassForTopic] = useState('')
  const [dailyTopic, setDailyTopic] = useState('')
  const [savingTopic, setSavingTopic] = useState(false)
  const [recentTopics, setRecentTopics] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<ClassAnalytics>({
    totalStudents: 0,
    averageXP: 0,
    activeToday: 0,
    helpRequests: 0,
    moodDistribution: {
      happy: 0,
      excited: 0,
      calm: 0,
      sad: 0,
      angry: 0,
      anxious: 0
    },
    averageStreak: 0
  })
  const [loading, setLoading] = useState(false)
  const [isDataFetching, setIsDataFetching] = useState(false) // Prevent concurrent API calls
  const fetchingRef = useRef(false) // More reliable concurrent call protection
  const [dataFetched, setDataFetched] = useState(false)
  const [activeTab, setActiveTab] = useState<'analytics' | 'overview' | 'roster' | 'attendance' | 'community' | 'incidents' | 'shoutouts' | 'interventions' | 'quests' | 'blackmarks' | 'activities' | 'settings' | 'results' | 'wellbeing'>('overview')
  const [isTabLoading, setIsTabLoading] = useState(false)
  const [notifications, setNotifications] = useState<Array<{ id: string, message: string, type: 'success' | 'error' | 'warning' | 'info' }>>([])
  const [realTimeData, setRealTimeData] = useState({
    newHelpRequests: 0,
    recentActivity: 0,
    completedQuests: 0
  })
  const [selectedStudent, setSelectedStudent] = useState<StudentOverview | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Real-time notifications can be connected to actual events via WebSocket or polling
  // Demo system removed - notifications should come from real API events

  const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  // Handle tab change with top loader
  const handleTabChange = (tab: typeof activeTab) => {
    setIsTabLoading(true)
    setActiveTab(tab)

    // Simulate brief loading for smooth transition
    setTimeout(() => {
      setIsTabLoading(false)
    }, 600)
  }

  // Load recent topics from API
  useEffect(() => {
    if (user?.id && dataFetched) {
      fetchRecentTopics()
    }
  }, [user?.id, dataFetched])

  const fetchRecentTopics = async () => {
    try {
      const response = await fetch('/api/teacher/daily-topics?days=7')
      if (response.ok) {
        const data = await response.json()
        setRecentTopics(data.topics?.slice(0, 5) || [])
      }
    } catch (error) {
      console.error('Error loading recent topics:', error)
    }
  }

  // Save daily topic (with automatic upsert - replaces existing topic for today)
  const saveDailyTopic = async () => {
    if (!selectedClassForTopic || !dailyTopic.trim()) {
      addNotification('Please select a class and enter a topic', 'warning')
      return
    }

    setSavingTopic(true)
    try {
      const selectedClass = classes.find(c => c.id === selectedClassForTopic)

      // Save to database (automatically replaces if topic exists for today)
      const response = await fetch('/api/teacher/daily-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_id: selectedClassForTopic,
          topic: dailyTopic.trim(),
          // topic_date defaults to today in API
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save topic')
      }

      addNotification(`Topic saved for ${selectedClass?.class_name || 'class'}! ${result.topic.created_at !== result.topic.updated_at ? '(Updated existing)' : ''}`, 'success')

      // Refresh recent topics from API
      await fetchRecentTopics()

      // Clear form
      setDailyTopic('')

    } catch (error: any) {
      console.error('Error saving topic:', error)
      addNotification(error.message || 'Failed to save topic', 'error')
    } finally {
      setSavingTopic(false)
    }
  }

  // Optimized data loading with aggressive client-side caching
  useEffect(() => {
    if (!user?.id || !profile?.user_id || dataFetched) return

    fetchClassData()
  }, [user?.id, profile?.user_id])

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, forcing dashboard to show')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [loading])

  const fetchClassData = async () => {
    if (!user || !profile) {
      console.log('Missing user or profile:', { user: !!user, profile: !!profile })
      setLoading(false)
      return
    }

    // Prevent concurrent API calls
    if (fetchingRef.current || isDataFetching) {
      console.log('⏭️ Skipping fetch - already in progress')
      return
    }

    try {
      fetchingRef.current = true
      setIsDataFetching(true)
      setLoading(true)

      const pageLoadStart = performance.now()

      // Use optimized client-side cache with stale-while-revalidate
      const combinedData = await fetchTeacherDashboard(user.id)

      const loadTime = Math.round(performance.now() - pageLoadStart)
      console.log(`📊 [Teacher Dashboard] Loaded in ${loadTime}ms`)

      // Set analytics data
      const analyticsData = combinedData.analytics || {
        totalStudents: 0,
        averageXP: 0,
        activeToday: 0,
        helpRequests: 0,
        moodDistribution: { happy: 0, excited: 0, calm: 0, sad: 0, angry: 0, anxious: 0 },
        averageStreak: 0
      }
      setAnalytics(analyticsData)

      // Set students data
      const studentsData = combinedData.students || []
      setStudents(studentsData)

      // Set classes data from cache
      const classesData = combinedData.classes || []
      setClasses(classesData)
      console.log('📚 [Classes Loaded]:', classesData.length, 'classes')

      setDataFetched(true)

    } catch (error: any) {
      console.error('❌ Error fetching class data:', error)
      // Set default analytics on error
      setAnalytics({
        totalStudents: 0,
        averageXP: 0,
        activeToday: 0,
        helpRequests: 0,
        moodDistribution: {
          happy: 0,
          excited: 0,
          calm: 0,
          sad: 0,
          angry: 0,
          anxious: 0
        },
        averageStreak: 0
      })
    } finally {
      fetchingRef.current = false
      setIsDataFetching(false)
      setLoading(false)
    }
  }

  // Memoized helper functions - MUST be before any early returns
  const getMoodIcon = useCallback((mood: string) => {
    switch (mood) {
      case 'happy': return <Smile className="h-4 w-4 text-yellow-500" />
      case 'excited': return <Zap className="h-4 w-4 text-orange-500" />
      case 'calm': return <Coffee className="h-4 w-4 text-blue-500" />
      case 'sad': return <Frown className="h-4 w-4 text-blue-600" />
      case 'angry': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'anxious': return <Brain className="h-4 w-4 text-purple-500" />
      default: return <Meh className="h-4 w-4 text-gray-400" />
    }
  }, [])

  // Memoized stat cards data
  const statCards = useMemo(() => [
    {
      icon: Users,
      label: 'My Students',
      value: analytics.totalStudents,
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      trend: '+12%',
      description: 'Assigned to my classes',
      iconBg: 'from-blue-500 to-indigo-500'
    },
    {
      icon: TrendingUp,
      label: 'Average XP',
      value: analytics.averageXP,
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
      trend: '+12%',
      description: 'Across all my classes',
      iconBg: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Heart,
      label: 'Active Today',
      value: analytics.activeToday,
      color: 'from-rose-600 to-pink-600',
      bgColor: 'from-rose-50 to-pink-50',
      trend: '+8%',
      description: 'Students online today',
      iconBg: 'from-rose-500 to-pink-500'
    },
    {
      icon: AlertTriangle,
      label: 'Help Requests',
      value: analytics.helpRequests,
      color: 'from-amber-600 to-orange-600',
      bgColor: 'from-amber-50 to-orange-50',
      trend: '-3%',
      description: 'From my students',
      iconBg: 'from-amber-500 to-orange-500'
    }
  ], [analytics])

  // Memoized quick actions
  const quickActions = useMemo(() => [
    {
      icon: Star,
      label: 'Send Shout-out',
      description: 'Recognize student achievements',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'from-amber-50 to-orange-50',
      iconColor: 'from-amber-400 to-orange-400',
      action: () => handleTabChange('shoutouts'),
      stats: '12 this week'
    },
    {
      icon: BarChart3,
      label: 'Update Results',
      description: 'Grade entry & analytics hub',
      color: 'from-emerald-600 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
      iconColor: 'from-emerald-500 to-teal-400',
      action: () => window.open('/teacher/update-results', '_blank'),
      stats: '5 pending'
    },
    {
      icon: Trophy,
      label: 'Create Quest',
      description: 'Design learning challenges',
      color: 'from-rose-500 to-pink-600',
      bgColor: 'from-rose-50 to-pink-50',
      iconColor: 'from-rose-400 to-pink-500',
      action: () => handleTabChange('quests'),
      stats: '5 active quests'
    },
    {
      icon: AlertTriangle,
      label: 'Black Marks',
      description: 'Manage disciplinary records',
      color: 'from-red-600 to-rose-600',
      bgColor: 'from-red-50 to-rose-50',
      iconColor: 'from-red-500 to-rose-500',
      action: () => handleTabChange('blackmarks'),
      stats: '2 pending'
    }
  ], [])

  // Skeleton loader component
  const SkeletonCard = memo(() => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 animate-pulse">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg sm:rounded-xl" />
        <div className="w-12 h-5 sm:w-16 sm:h-6 bg-gray-200 rounded-full" />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-200 rounded" />
        <div className="w-12 sm:w-16 h-6 sm:h-8 bg-gray-200 rounded" />
        <div className="w-24 sm:w-32 h-2.5 sm:h-3 bg-gray-200 rounded" />
      </div>
    </div>
  ))
  SkeletonCard.displayName = 'SkeletonCard'

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative min-h-screen flex overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5" />

        {/* Sidebar Skeleton - Desktop Only */}
        <div className="hidden lg:flex fixed lg:static inset-y-0 left-0 z-50 lg:z-20 w-64 bg-white/95 backdrop-blur-xl border-r border-white/20 shadow-2xl flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="w-28 h-5 bg-gray-200 rounded animate-pulse" />
                <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 px-4 py-3.5 rounded-xl animate-pulse">
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </nav>

          {/* User Profile Skeleton */}
          <div className="p-4 border-t border-gray-200/50">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          {/* Top Header Bar */}
          <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
            <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-5">
              <div className="flex items-center justify-between gap-3">
                {/* Mobile Menu Button */}
                <div className="lg:hidden w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />

                {/* Title */}
                <div className="space-y-1 sm:space-y-2 flex-1 lg:flex-none min-w-0">
                  <div className="w-32 sm:w-48 h-5 sm:h-7 bg-gray-200 rounded animate-pulse" />
                  <div className="w-24 sm:w-32 h-3 sm:h-4 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Right Side Actions */}
                <div className="hidden sm:flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 animate-pulse">
                    <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-lg sm:rounded-xl" />
                      <div className="w-12 h-5 sm:w-14 sm:h-5 lg:w-16 lg:h-6 bg-gray-200 rounded-full" />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
                      <div className="w-16 sm:w-20 lg:w-24 h-3 sm:h-3.5 lg:h-4 bg-gray-200 rounded" />
                      <div className="w-12 sm:w-14 lg:w-16 h-6 sm:h-7 lg:h-8 bg-gray-200 rounded" />
                      <div className="w-20 sm:w-24 lg:w-32 h-2.5 sm:h-3 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
                  <div className="w-32 sm:w-40 h-5 sm:h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="w-20 sm:w-24 h-8 sm:h-9 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-md hover:shadow-xl transition-all duration-300 animate-pulse">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-xl sm:rounded-2xl mb-3 sm:mb-4" />
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="w-24 sm:w-28 lg:w-32 h-4 sm:h-5 bg-gray-200 rounded" />
                        <div className="w-28 sm:w-32 lg:w-40 h-2.5 sm:h-3 bg-gray-200 rounded" />
                        <div className="w-16 sm:w-20 lg:w-24 h-3 sm:h-4 bg-gray-200 rounded mt-2 sm:mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Content Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
                    <div className="w-32 sm:w-40 h-5 sm:h-6 bg-gray-200 rounded" />
                    <div className="w-16 sm:w-20 h-7 sm:h-8 bg-gray-200 rounded-lg" />
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <div className="w-32 h-4 bg-gray-200 rounded" />
                          <div className="w-24 h-3 bg-gray-200 rounded" />
                        </div>
                        <div className="w-16 h-6 bg-gray-200 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-40 h-6 bg-gray-200 rounded" />
                    <div className="w-20 h-8 bg-gray-200 rounded-lg" />
                  </div>
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="w-32 h-4 bg-gray-200 rounded" />
                          <div className="w-24 h-3 bg-gray-200 rounded" />
                        </div>
                        <div className="w-16 h-6 bg-gray-200 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-900 relative h-screen flex overflow-hidden transition-colors duration-300">
      {/* Top Loader - Enterprise Style */}
      <TopLoader isLoading={isTabLoading} color="#3b82f6" height={3} speed={400} />

      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 dark:from-blue-900/5 dark:via-slate-900 dark:to-indigo-900/5" />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Professional Left Sidebar - Fixed */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed inset-y-0 left-0 z-50 lg:z-20 w-64 sm:w-72 lg:w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50 shadow-2xl flex flex-col transition-all duration-300 ease-in-out`}>
        {/* Sidebar Header - Premium Enterprise Design */}
        <div className="px-5 py-5 border-b border-gray-200/80 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            {/* Brand Identity */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl blur-sm opacity-30"></div>
                <div className="relative p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>Catalyst</h2>
                <p className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 uppercase" style={{ fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.05em' }}>Educator Portal</p>
              </div>
            </div>
            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </Button>
          </div>
        </div>

        {/* Navigation Menu - static, lightweight for performance */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1.5 sm:space-y-2 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: School, color: 'text-blue-600', bgColor: 'bg-blue-50' },
            { id: 'digital-id', label: 'Digital ID', icon: CreditCard, color: 'text-indigo-600', bgColor: 'bg-indigo-50', isLink: true, href: '/teacher/digital-id' },
            { id: 'roster', label: 'Students', icon: Users, color: 'text-emerald-600', bgColor: 'bg-emerald-50', isLink: true, href: '/teacher/students' },
            { id: 'attendance', label: 'Attendance', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', isLink: true, href: '/teacher/attendance' },
            { id: 'wellbeing', label: 'Wellbeing', icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50' },
            { id: 'seating', label: 'Seating', icon: LayoutGrid, color: 'text-blue-600', bgColor: 'bg-blue-50', isLink: true, href: '/teacher/seating' },
            { id: 'examinations', label: 'Examinations', icon: GraduationCap, color: 'text-indigo-600', bgColor: 'bg-indigo-50', isLink: true, href: '/teacher/examinations' },
            { id: 'community', label: 'Community', icon: Megaphone, color: 'text-indigo-600', bgColor: 'bg-indigo-50', isLink: true, href: '/teacher/community' },
            { id: 'ai-live', label: 'Ai Live', icon: Brain, color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50', isLink: true, href: '/teacher/ai-live' },
            { id: 'analytics', label: 'Analytics', icon: Activity, color: 'text-violet-600', bgColor: 'bg-violet-50' },
            { id: 'credits', label: 'Issue Credits', icon: Gem, color: 'text-purple-600', bgColor: 'bg-purple-50', isLink: true, href: '/teacher/issue-credits' },
            { id: 'shoutouts', label: 'Shout-outs', icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-50' },
            { id: 'activities', label: 'Activities', icon: Play, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
            { id: 'results', label: 'Update Results', icon: BarChart3, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
            { id: 'quests', label: 'Quests', icon: Trophy, color: 'text-rose-500', bgColor: 'bg-rose-50' },
            { id: 'blackmarks', label: 'Black Marks', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
            { id: 'incidents', label: 'Incidents', icon: Shield, color: 'text-slate-600', bgColor: 'bg-slate-50' }
          ].map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.isLink && item.href) {
                    // Special handling for Community, Students & Attendance: full screen on mobile, inline on desktop
                    if (item.id === 'community' || item.id === 'roster' || item.id === 'attendance') {
                      const isMobile = window.innerWidth < 1024 // lg breakpoint
                      if (isMobile) {
                        window.location.href = item.href
                      } else {
                        handleTabChange(item.id as any)
                        setSidebarOpen(false)
                      }
                    } else {
                      window.location.href = item.href
                    }
                  } else {
                    handleTabChange(item.id as any)
                    setSidebarOpen(false)
                  }
                }}
                className={`relative w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg border text-left text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-transparent text-gray-700 dark:text-slate-300 border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/60 hover:text-gray-900 dark:hover:text-white'}
                `}
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute inset-y-1 left-0 w-1 rounded-full bg-blue-600" aria-hidden="true" />
                )}
                <span className={`inline-flex items-center justify-center rounded-md p-1.5 text-sm
                  ${isActive ? `${item.bgColor} ${item.color}` : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300'}
                `}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200/50 dark:border-slate-600/50 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start space-x-2 py-2.5 sm:py-2 text-sm"
            onClick={() => {
              handleTabChange('settings')
              setSidebarOpen(false)
            }}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Button>
        </div>
      </div>

      {/* Real-time Notifications */}
      <div className="fixed top-20 right-2 sm:top-4 sm:right-4 z-50 max-w-xs sm:max-w-sm">
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`p-3 sm:p-4 rounded-xl shadow-xl mb-2 backdrop-blur-sm border ${notification.type === 'success'
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-400/20'
              : 'bg-gradient-to-r from-rose-500 to-red-500 text-white border-rose-400/20'
              }`}>
            <div className="flex items-start justify-between">
              <span className="text-sm sm:text-base pr-2">{notification.message}</span>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="text-white hover:text-gray-200 text-lg leading-none flex-shrink-0"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 lg:ml-64 min-w-0 h-screen overflow-hidden">
        {/* Premium Enterprise Header - Fixed */}
        <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700/80 shadow-sm sticky top-0 z-30 flex-shrink-0 transition-colors duration-300">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-2 hover:bg-slate-100 rounded-xl flex-shrink-0 transition-colors"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </Button>

                <div className="min-w-0 flex-1">
                  {/* Personalized Greeting */}
                  <div className="flex items-baseline gap-3 mb-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-slate-100 truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.03em' }}>
                      {(() => {
                        const hour = new Date().getHours()
                        const firstName = profile?.first_name || 'Educator'
                        const day = new Date().getDay()

                        // Early Morning (5 AM - 7 AM)
                        if (hour >= 5 && hour < 7) {
                          const greetings = [
                            `Early bird, ${firstName}!`,
                            `Rise and shine, ${firstName}!`,
                            `Starting strong, ${firstName}!`
                          ]
                          return greetings[day % greetings.length]
                        }

                        // Morning (7 AM - 12 PM)
                        if (hour >= 7 && hour < 12) {
                          const greetings = [
                            `Good morning, ${firstName}!`,
                            `Great morning, ${firstName}!`,
                            `Hello ${firstName}!`,
                            `Morning champion, ${firstName}!`
                          ]
                          return greetings[day % greetings.length]
                        }

                        // Afternoon (12 PM - 5 PM)
                        if (hour >= 12 && hour < 17) {
                          const greetings = [
                            `Good afternoon, ${firstName}!`,
                            `Hello ${firstName}!`,
                            `Great to see you, ${firstName}!`,
                            `Welcome back, ${firstName}!`
                          ]
                          return greetings[day % greetings.length]
                        }

                        // Evening (5 PM - 9 PM)
                        if (hour >= 17 && hour < 21) {
                          const greetings = [
                            `Good evening, ${firstName}!`,
                            `Evening, ${firstName}!`,
                            `Still going strong, ${firstName}!`,
                            `Wrapping up, ${firstName}?`
                          ]
                          return greetings[day % greetings.length]
                        }

                        // Night (9 PM - 5 AM)
                        const greetings = [
                          `Working late, ${firstName}?`,
                          `Night owl, ${firstName}!`,
                          `Burning the midnight oil, ${firstName}?`,
                          `Good night, ${firstName}!`
                        ]
                        return greetings[day % greetings.length]
                      })()}
                    </h1>
                    <span className="hidden sm:inline text-2xl" style={{ marginTop: '-2px' }}>
                      {(() => {
                        const hour = new Date().getHours()
                        if (hour >= 5 && hour < 7) return '🌅'
                        if (hour >= 7 && hour < 12) return '☀️'
                        if (hour >= 12 && hour < 17) return '👋'
                        if (hour >= 17 && hour < 21) return '🌙'
                        return '🌃'
                      })()}
                    </span>
                  </div>

                  {/* Date & Time Info */}
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 dark:text-slate-500" />
                      <span className="hidden sm:inline">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      <span className="sm:hidden">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:from-blue-950/50 dark:to-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800/50">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300" style={{ fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.02em' }}>Live Dashboard</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Real-time Stats Card */}
                <div className="hidden md:flex items-center gap-4 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition-colors duration-300">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                      <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-slate-400 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Active</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)' }}>{analytics.activeToday}</p>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-300 dark:bg-slate-600"></div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                      <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-slate-400 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>Requests</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)' }}>{analytics.helpRequests}</p>
                    </div>
                  </div>
                </div>

                <ProfileDropdown />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white/30 dark:from-slate-900/50 dark:via-slate-900/30 dark:to-slate-950/50 transition-colors duration-300">


          {/* Tab Content */}
          <div className="min-h-[300px] sm:min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <ConditionalMotion
                  key="overview"
                  initial={animConfig.enableAnimations ? { opacity: 0, y: 20 } : false}
                  animate={animConfig.enableAnimations ? { opacity: 1, y: 0 } : false}
                  exit={animConfig.enableAnimations ? { opacity: 0, y: -20 } : false}
                  transition={{ duration: animConfig.animationDuration }}
                  className="space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-5 lg:p-6"
                >
                  {/* Optimized Analytics Cards - Mobile 2x2 Layout */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {statCards.map((stat, index) => {
                      const Icon = stat.icon
                      return (
                        <ConditionalMotion
                          key={stat.label}
                          initial={animConfig.enableAnimations ? { opacity: 0, y: 20 } : false}
                          animate={animConfig.enableAnimations ? { opacity: 1, y: 0 } : false}
                          transition={{ delay: animConfig.enableAnimations ? index * 0.05 : 0, duration: animConfig.animationDuration }}
                        >
                          <Card className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-30 dark:opacity-20 group-hover:opacity-40 dark:group-hover:opacity-30 transition-opacity duration-300`} />
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300`} />
                            <CardContent className="p-3 sm:p-4 lg:p-6 relative z-10">
                              {/* Mobile 2x2 Optimized Layout */}
                              <div className="lg:hidden">
                                <div className="text-center space-y-2">
                                  <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-r ${stat.iconBg} text-white shadow-md flex items-center justify-center`}>
                                    <Icon className="h-5 w-5" />
                                  </div>

                                  <div>
                                    <p className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                                      {stat.value}
                                    </p>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{stat.label}</p>
                                    <p className="text-xs text-gray-600 dark:text-slate-500 truncate leading-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>{stat.description}</p>
                                  </div>

                                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${stat.trend.startsWith('+')
                                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'
                                    }`}>
                                    {stat.trend}
                                  </div>
                                </div>
                              </div>

                              {/* Desktop Layout */}
                              <div className="hidden lg:block">
                                <div className="flex items-start justify-between mb-3 sm:mb-4">
                                  <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${stat.iconBg} text-white shadow-md group-hover:shadow-lg transition-all duration-300`}>
                                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                  </div>
                                  <div className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${stat.trend.startsWith('+')
                                    ? 'bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-gradient-to-r from-rose-100 to-red-100 dark:from-rose-900/50 dark:to-red-900/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                    }`}>
                                    {stat.trend}
                                  </div>
                                </div>
                                <div className="space-y-1 sm:space-y-2">
                                  <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-slate-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>{stat.label}</p>
                                  <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                                    {stat.value}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-slate-500" style={{ fontFamily: 'var(--font-dm-sans)' }}>{stat.description}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </ConditionalMotion>
                      )
                    })}
                  </div>

                  {/* Optimized Quick Actions - Mobile 2x2 Layout */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 lg:gap-6">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon
                      return (
                        <motion.button
                          key={action.label}
                          onClick={action.action}
                          initial={animConfig.enableAnimations ? { opacity: 0, y: 20 } : false}
                          animate={animConfig.enableAnimations ? { opacity: 1, y: 0 } : false}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          whileHover={animConfig.enableAnimations ? { scale: 1.02 } : undefined}
                          whileTap={animConfig.enableAnimations ? { scale: 0.98 } : undefined}
                          className="p-3 sm:p-4 lg:p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-left group relative overflow-hidden"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${action.bgColor} opacity-50 dark:opacity-30 group-hover:opacity-70 dark:group-hover:opacity-50 transition-opacity duration-300`} />
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-3">
                              <div className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-r ${action.iconColor} text-white shadow-sm transition-shadow duration-200 group-hover:shadow-md`}>
                                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                              <div className="text-xs text-gray-600 dark:text-slate-400 font-semibold bg-gray-50/80 dark:bg-slate-700/80 px-2 py-1 rounded-full border border-gray-200 dark:border-slate-600" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                                {action.stats}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                                {action.label}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                                {action.description}
                              </p>
                            </div>
                            <div className="mt-2 sm:mt-3 flex items-center justify-end">
                              <ArrowRight className="h-4 w-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-200" />
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Today's Schedule & Daily Topics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Today's Classes Schedule */}
                    <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CardHeader className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600 pb-3 sm:pb-4 relative z-10">
                        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 sm:gap-3">
                          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-md flex-shrink-0">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-lg sm:text-xl font-bold truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>Today's Schedule</div>
                            <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 mt-0.5 truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 relative z-10">
                        <div className="space-y-3">
                          {[
                            { class: 'Mathematics Grade 10', time: '09:00 AM', room: 'Room 205', students: 28, status: 'completed', color: 'emerald' },
                            { class: 'Science Grade 9', time: '10:30 AM', room: 'Room 301', students: 25, status: 'current', color: 'blue' },
                            { class: 'Mathematics Grade 11', time: '01:00 PM', room: 'Room 205', students: 30, status: 'upcoming', color: 'amber' },
                            { class: 'Advanced Physics', time: '02:30 PM', room: 'Lab 402', students: 22, status: 'upcoming', color: 'purple' }
                          ].map((classItem, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`p-3 sm:p-4 rounded-xl border transition-all duration-300 ${classItem.status === 'current'
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 border-blue-200 dark:border-blue-600 shadow-md ring-2 ring-blue-100 dark:ring-blue-700/50'
                                : classItem.status === 'completed'
                                  ? 'bg-gray-50/50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-600 opacity-70'
                                  : 'bg-white dark:bg-slate-700/30 border-gray-200 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-md hover:bg-blue-50/30 dark:hover:bg-blue-900/20'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                    <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>{classItem.class}</h4>
                                    {classItem.status === 'current' && (
                                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blue-500 text-white text-[10px] sm:text-xs font-semibold rounded-full animate-pulse shadow-sm whitespace-nowrap">Live</span>
                                    )}
                                    {classItem.status === 'completed' && (
                                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1 sm:gap-1.5 font-medium">
                                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                                      {classItem.time}
                                    </span>
                                    <span className="hidden sm:block w-px h-4 bg-gray-300 dark:bg-slate-500"></span>
                                    <span className="flex items-center gap-1 sm:gap-1.5 font-medium">
                                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                                      {classItem.room}
                                    </span>
                                    <span className="hidden sm:block w-px h-4 bg-gray-300 dark:bg-slate-500"></span>
                                    <span className="flex items-center gap-1 sm:gap-1.5 font-medium">
                                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                                      <span className="hidden sm:inline">{classItem.students} students</span>
                                      <span className="sm:hidden">{classItem.students}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Daily Topics Card */}
                    <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CardHeader className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600 pb-3 sm:pb-4 relative z-10">
                        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 sm:gap-3">
                          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-md flex-shrink-0">
                            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-lg sm:text-xl font-bold truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>Daily Topics</div>
                            <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 mt-0.5 truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>Record what you taught today</div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 relative z-10">
                        <div className="space-y-4">
                          {/* Class Selector */}
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Select Class</label>
                            <select
                              value={selectedClassForTopic}
                              onChange={(e) => setSelectedClassForTopic(e.target.value)}
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-slate-700/80 border border-gray-300 dark:border-slate-500 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-700/50 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-slate-100 shadow-sm hover:border-gray-400 dark:hover:border-slate-400"
                            >
                              <option value="">Choose a class...</option>
                              {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                  {cls.class_name} - {cls.subject} {cls.room_number ? `(Room ${cls.room_number})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Topic Input */}
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Today's Topic</label>
                            <textarea
                              value={dailyTopic}
                              onChange={(e) => setDailyTopic(e.target.value)}
                              placeholder="What did you teach today? (e.g., Quadratic Equations, Newton's Laws, etc.)"
                              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-slate-700/80 border border-gray-300 dark:border-slate-500 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-700/50 transition-all duration-200 text-sm resize-none font-medium text-gray-700 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 shadow-sm hover:border-gray-400 dark:hover:border-slate-400"
                              rows={4}
                            />
                          </div>

                          {/* Save Button */}
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={saveDailyTopic}
                            disabled={savingTopic || !selectedClassForTopic || !dailyTopic.trim()}
                            className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-2.5 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingTopic ? (
                              <>
                                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                Save Topic
                              </>
                            )}
                          </motion.button>

                          {/* Recent Topics */}
                          <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-slate-600">
                            <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-slate-400" />
                              Recent Topics
                            </p>
                            <div className="space-y-2">
                              {recentTopics.length > 0 ? (
                                recentTopics.map((topic, index) => {
                                  const isToday = topic.topic_date === new Date().toISOString().split('T')[0]
                                  return (
                                    <div key={topic.id || index} className={`text-xs sm:text-sm text-gray-700 dark:text-slate-300 ${isToday ? 'bg-purple-100 dark:bg-purple-900/50' : 'bg-purple-50 dark:bg-purple-950/30'} px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg border ${isToday ? 'border-purple-200 dark:border-purple-700' : 'border-purple-100 dark:border-purple-800/50'}`}>
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <span className="font-bold text-purple-600 dark:text-purple-400">{topic.class_name}:</span> {topic.topic}
                                        </div>
                                        {isToday && (
                                          <span className="flex-shrink-0 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-200 dark:bg-purple-800 px-1.5 py-0.5 rounded">
                                            Today
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-500 mt-1">
                                        {new Date(topic.topic_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        {topic.subject && ` • ${topic.subject}`}
                                      </div>
                                    </div>
                                  )
                                })
                              ) : (
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 italic text-center py-2">
                                  No recent topics yet. Add your first topic above!
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                </ConditionalMotion>
              )}

              {activeTab === 'roster' && (
                <motion.div
                  key="roster"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  }>
                    <TeacherStudentsPage />
                  </Suspense>
                </motion.div>
              )}

              {activeTab === 'attendance' && (
                <motion.div
                  key="attendance"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  }>
                    <TeacherAttendancePage />
                  </Suspense>
                </motion.div>
              )}

              {activeTab === 'shoutouts' && (
                <motion.div
                  key="shoutouts"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 sm:p-5 lg:p-6"
                >
                  <ShoutOutsSystem />
                </motion.div>
              )}

              {activeTab === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 sm:p-5 lg:p-6"
                >
                  <UpdateResultsSystem />
                </motion.div>
              )}

              {activeTab === 'community' && (
                <motion.div
                  key="community"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <TeacherCommunityPage />
                </motion.div>
              )}

              {activeTab === 'interventions' && (
                <motion.div
                  key="interventions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 sm:p-5 lg:p-6"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white">
                          <Lightbulb className="h-6 w-6" />
                        </div>
                        Intervention Toolkit
                      </h2>
                      <p className="text-slate-600">Evidence-based activities to support student wellbeing and engagement</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { title: 'Mindfulness Activities', icon: Brain, color: 'from-purple-500 to-purple-600', description: 'Breathing exercises and meditation techniques' },
                        { title: 'Physical Movement', icon: Activity, color: 'from-green-500 to-green-600', description: 'Energy breaks and movement activities' },
                        { title: 'Social Skills', icon: Users, color: 'from-blue-500 to-blue-600', description: 'Communication and collaboration exercises' },
                        { title: 'Emotional Regulation', icon: Heart, color: 'from-pink-500 to-pink-600', description: 'Tools for managing emotions and stress' },
                        { title: 'Focus Enhancement', icon: Target, color: 'from-indigo-500 to-indigo-600', description: 'Attention and concentration activities' },
                        { title: 'Confidence Building', icon: Trophy, color: 'from-yellow-500 to-yellow-600', description: 'Self-esteem and achievement recognition' }
                      ].map((intervention, index) => {
                        const Icon = intervention.icon
                        return (
                          <motion.div
                            key={intervention.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, y: -5 }}
                            className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                          >
                            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${intervention.color} text-white mb-4`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">{intervention.title}</h3>
                            <p className="text-slate-600 text-sm mb-4">{intervention.description}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 hover:border-green-300 transition-all duration-200"
                              onClick={() => handleTabChange('activities')}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start Activity
                            </Button>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'quests' && (
                <motion.div
                  key="quests"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 sm:p-5 lg:p-6"
                >
                  <div>
                    <QuestBadgeCreator />
                  </div>
                </motion.div>
              )}

              {activeTab === 'blackmarks' && (
                <motion.div
                  key="blackmarks"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 sm:p-5 lg:p-6"
                >
                  <BlackMarkSystem />
                </motion.div>
              )}


              {activeTab === 'incidents' && (
                <motion.div
                  key="incidents"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 sm:p-5 lg:p-6"
                >
                  <IncidentManagement />
                </motion.div>
              )}


              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 sm:p-5 lg:p-6"
                >
                  <ComprehensiveAnalytics />
                </motion.div>
              )}

              {activeTab === 'wellbeing' && (
                <motion.div
                  key="wellbeing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="min-h-screen"
                >
                  <TeacherWellbeingTab />
                </motion.div>
              )}

              {activeTab === 'activities' && (
                <motion.div
                  key="activities"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 sm:p-5 lg:p-6"
                >
                  <div>
                    <InteractiveActivitiesSystem />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  )
}

export default function TeacherDashboard() {
  return (
    <UnifiedAuthGuard requiredRole="teacher">
      <TeacherDashboardContent />
    </UnifiedAuthGuard>
  )
}
