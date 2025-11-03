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
const ParentCommunicationSystem = dynamic(() => import('@/components/teacher/parent-communication-system'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>
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
  X
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
  const [activeTab, setActiveTab] = useState<'analytics' | 'overview' | 'roster' | 'community' | 'incidents' | 'shoutouts' | 'interventions' | 'quests' | 'blackmarks' | 'activities' | 'communication' | 'settings' | 'results'>('overview')
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'warning' | 'info'}>>([])
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
      action: () => setActiveTab('shoutouts'),
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
      action: () => setActiveTab('quests'),
      stats: '5 active quests'
    },
    { 
      icon: AlertTriangle, 
      label: 'Black Marks', 
      description: 'Manage disciplinary records', 
      color: 'from-red-600 to-rose-600',
      bgColor: 'from-red-50 to-rose-50',
      iconColor: 'from-red-500 to-rose-500',
      action: () => setActiveTab('blackmarks'),
      stats: '2 pending'
    }
  ], [])

  // Skeleton loader component
  const SkeletonCard = memo(() => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        <div className="w-16 h-6 bg-gray-200 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="w-24 h-4 bg-gray-200 rounded" />
        <div className="w-16 h-8 bg-gray-200 rounded" />
        <div className="w-32 h-3 bg-gray-200 rounded" />
      </div>
    </div>
  ))
  SkeletonCard.displayName = 'SkeletonCard'

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
        {/* Header Skeleton */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 h-64 animate-pulse">
              <div className="w-40 h-6 bg-gray-200 rounded mb-4" />
              <div className="space-y-3">
                <div className="w-full h-4 bg-gray-200 rounded" />
                <div className="w-full h-4 bg-gray-200 rounded" />
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 h-64 animate-pulse">
              <div className="w-40 h-6 bg-gray-200 rounded mb-4" />
              <div className="space-y-3">
                <div className="w-full h-4 bg-gray-200 rounded" />
                <div className="w-full h-4 bg-gray-200 rounded" />
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative min-h-screen flex overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5" />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Professional Left Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 lg:z-20 w-64 sm:w-72 lg:w-64 bg-white/95 backdrop-blur-xl border-r border-white/20 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out`}>
        {/* Sidebar Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Teacher Hub</h2>
                <p className="text-xs sm:text-sm text-gray-600">Dashboard</p>
              </div>
            </div>
            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1.5 sm:space-y-2 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: School, color: 'text-blue-600', bgColor: 'bg-blue-50' },
            { id: 'roster', label: 'Students', icon: Users, color: 'text-emerald-600', bgColor: 'bg-emerald-50', isLink: true, href: '/teacher/students' },
            { id: 'attendance', label: 'Attendance', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', isLink: true, href: '/teacher/attendance' },
            { id: 'community', label: 'Community', icon: Megaphone, color: 'text-indigo-600', bgColor: 'bg-indigo-50', isLink: true, href: '/teacher/community' },
            { id: 'analytics', label: 'Analytics', icon: Activity, color: 'text-violet-600', bgColor: 'bg-violet-50' },
            { id: 'credits', label: 'Issue Credits', icon: Gem, color: 'text-purple-600', bgColor: 'bg-purple-50', isLink: true, href: '/teacher/issue-credits' },
            { id: 'shoutouts', label: 'Shout-outs', icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-50' },
            { id: 'activities', label: 'Activities', icon: Play, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
            { id: 'communication', label: 'Parent Hub', icon: MessageSquare, color: 'text-sky-600', bgColor: 'bg-sky-50' },
            { id: 'results', label: 'Update Results', icon: BarChart3, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
            { id: 'quests', label: 'Quests', icon: Trophy, color: 'text-rose-500', bgColor: 'bg-rose-50' },
            { id: 'blackmarks', label: 'Black Marks', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
            { id: 'incidents', label: 'Incidents', icon: Shield, color: 'text-slate-600', bgColor: 'bg-slate-50' }
          ].map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  if (item.isLink && item.href) {
                    // Special handling for Community: full screen on mobile, inline on desktop
                    if (item.id === 'community') {
                      const isMobile = window.innerWidth < 1024 // lg breakpoint
                      if (isMobile) {
                        window.location.href = item.href
                      } else {
                        setActiveTab(item.id as any)
                        setSidebarOpen(false)
                      }
                    } else {
                      window.location.href = item.href
                    }
                  } else {
                    setActiveTab(item.id as any)
                    setSidebarOpen(false)
                  }
                }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl transition-all duration-300 text-left group relative overflow-hidden ${
                  isActive
                    ? `${item.bgColor} ${item.color} shadow-lg border border-white/50`
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                }`}
              >
                <Icon className={`h-5 w-5 sm:h-5 sm:w-5 transition-colors flex-shrink-0 ${
                  isActive ? item.color : 'text-gray-500 group-hover:text-gray-700'
                }`} />
                <span className={`font-medium transition-colors text-sm sm:text-base ${
                  isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarItem"
                    className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-l-full"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            )
          })}
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200/50 space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start space-x-2 py-2.5 sm:py-2 text-sm"
            onClick={() => {
              setActiveTab('settings')
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
            className={`p-3 sm:p-4 rounded-xl shadow-xl mb-2 backdrop-blur-sm border ${
              notification.type === 'success' 
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
      <div className="flex-1 flex flex-col relative z-10 lg:ml-0 min-w-0 overflow-hidden">
        {/* Enhanced Header with Time-Based Greeting */}
        <header className="bg-gradient-to-r from-white via-blue-50/30 to-white border-b border-gray-200 shadow-sm relative z-30">
          <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </Button>
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
                    {(() => {
                      const hour = new Date().getHours()
                      const firstName = profile?.first_name || 'Teacher'
                      if (hour < 12) return `Good Morning, ${firstName}! ☀️`
                      if (hour < 17) return `Good Afternoon, ${firstName}! 🌤️`
                      return `Good Evening, ${firstName}! 🌙`
                    })()}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium flex items-center gap-2">
                    <span className="hidden sm:inline">Ready to inspire young minds today</span>
                    <span className="sm:hidden">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="hidden sm:inline text-gray-400">•</span>
                    <span className="hidden sm:inline">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Compact Stats - Mobile & Desktop */}
                <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-gray-700">{analytics.activeToday}</span>
                    <span className="text-xs text-gray-600">active</span>
                  </div>
                  <div className="w-px h-4 bg-blue-300"></div>
                  <div className="flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-sm font-semibold text-gray-700">{analytics.helpRequests}</span>
                    <span className="text-xs text-gray-600">requests</span>
                  </div>
                </div>
                
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-5 lg:p-6 overflow-auto bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/50">


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
                className="space-y-4 sm:space-y-6 lg:space-y-8"
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
                      <Card className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-700 overflow-hidden relative group">
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-50 group-hover:opacity-70 transition-opacity duration-500`} />
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                        <CardContent className="p-3 sm:p-4 lg:p-6 relative z-10">
                          {/* Mobile 2x2 Optimized Layout */}
                          <div className="lg:hidden">
                            <div className="text-center space-y-2">
                              <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-r ${stat.iconBg} text-white shadow-lg flex items-center justify-center`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              
                              <div>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                  {stat.value}
                                </p>
                                <p className="text-xs font-semibold text-gray-700 truncate">{stat.label}</p>
                                <p className="text-xs text-gray-500 truncate leading-tight">{stat.description}</p>
                              </div>
                              
                              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                                stat.trend.startsWith('+') 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-rose-100 text-rose-700'
                              }`}>
                                {stat.trend}
                              </div>
                            </div>
                          </div>
                          
                          {/* Desktop Layout */}
                          <div className="hidden lg:block">
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                              <div className={`p-2 sm:p-3 rounded-2xl bg-gradient-to-r ${stat.iconBg} text-white shadow-lg group-hover:shadow-2xl transition-all duration-300`}>
                                <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                                  stat.trend.startsWith('+') 
                                    ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200' 
                                    : 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 border border-rose-200'
                                }`}>
                                {stat.trend}
                              </div>
                            </div>
                            <div className="space-y-1 sm:space-y-2">
                              <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</p>
                              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {stat.value}
                              </p>
                              <p className="text-xs text-gray-500">{stat.description}</p>
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
                      className="p-3 sm:p-4 lg:p-6 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-left group relative overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.bgColor} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-r ${action.iconColor} text-white shadow-md transition-shadow duration-200 group-hover:shadow-lg`}>
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="text-xs text-gray-600 font-medium bg-white/80 px-2 py-1 rounded-full border border-gray-200">
                            {action.stats}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                            {action.label}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {action.description}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-3 flex items-center justify-end">
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Recent Activity & Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <Card className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-700 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                  <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-lg pb-3 sm:pb-4 relative z-10">
                    <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                      <motion.div 
                        className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
                      </motion.div>
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 relative z-10">
                    <div className="space-y-4">
                      {[
                        { type: 'quest', student: 'Emma Wilson', action: 'completed Math Quest', time: '2 min ago', color: 'text-emerald-600', bgColor: 'from-emerald-50 to-green-50', icon: Trophy },
                        { type: 'help', student: 'James Chen', action: 'requested help with Science', time: '5 min ago', color: 'text-amber-600', bgColor: 'from-amber-50 to-orange-50', icon: AlertCircle },
                        { type: 'shoutout', student: 'Sarah Davis', action: 'received Leadership badge', time: '10 min ago', color: 'text-yellow-600', bgColor: 'from-yellow-50 to-amber-50', icon: Star },
                        { type: 'mood', student: 'Alex Johnson', action: 'updated mood to excited', time: '15 min ago', color: 'text-blue-600', bgColor: 'from-blue-50 to-indigo-50', icon: Heart }
                      ].map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm border border-white/30 hover:shadow-lg transition-all duration-300 group"
                        >
                          <motion.div 
                            className={`p-2 rounded-lg bg-gradient-to-r ${activity.bgColor} border border-white/50`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.2 }}
                          >
                            <activity.icon className={`h-4 w-4 ${activity.color}`} />
                          </motion.div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-gray-800 transition-colors">
                              <span className={`font-semibold ${activity.color}`}>{activity.student}</span> {activity.action}
                            </p>
                            <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">{activity.time}</p>
                          </div>
                          <div className="w-1 h-8 bg-gradient-to-b from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-700 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                  <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-lg pb-4 relative z-10">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-purple-800 bg-clip-text text-transparent flex items-center gap-3">
                      <motion.div 
                        className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white shadow-lg"
                        whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Brain className="h-6 w-6" />
                      </motion.div>
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 relative z-10">
                    <div className="space-y-4">
                      <motion.div 
                        className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-start space-x-3">
                          <motion.div 
                            className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full shadow-lg"
                            whileHover={{ scale: 1.1, rotate: 360 }}
                            transition={{ duration: 0.4 }}
                          >
                            <TrendingUp className="h-4 w-4 text-white" />
                          </motion.div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-emerald-800 group-hover:text-emerald-900 transition-colors">Positive Trend Detected</h4>
                            <p className="text-sm text-emerald-700 group-hover:text-emerald-800 transition-colors">Math engagement up 23% this week across your classes.</p>
                            <div className="mt-2 h-1 bg-emerald-100 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: "75%" }}
                                transition={{ delay: 0.5, duration: 1 }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      
                      <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                        <div className="flex items-start space-x-3">
                          <div className="p-1 bg-yellow-500 rounded-full">
                            <AlertCircle className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-yellow-800">Attention Needed</h4>
                            <p className="text-sm text-yellow-700">3 students may need extra support</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="flex items-start space-x-3">
                          <div className="p-1 bg-blue-500 rounded-full">
                            <Lightbulb className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800">Suggestion</h4>
                            <p className="text-sm text-blue-700">Consider group activities for collaboration</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Class Overview Chart */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg pb-4">
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    Class Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                      <div className="text-3xl font-bold text-blue-600 mb-2">85%</div>
                      <div className="text-sm font-medium text-blue-800">Average Completion Rate</div>
                      <div className="mt-2 h-2 bg-blue-200 rounded-full">
                        <div className="h-full w-4/5 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                      <div className="text-3xl font-bold text-green-600 mb-2">92%</div>
                      <div className="text-sm font-medium text-green-800">Positive Mood Rating</div>
                      <div className="mt-2 h-2 bg-green-200 rounded-full">
                        <div className="h-full w-11/12 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
                      <div className="text-3xl font-bold text-purple-600 mb-2">78%</div>
                      <div className="text-sm font-medium text-purple-800">Participation Rate</div>
                      <div className="mt-2 h-1 bg-purple-200 rounded-full">
                        <div className="h-full w-3/4 bg-purple-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </ConditionalMotion>
            )}

            {activeTab === 'roster' && (
              <motion.div
                key="roster"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white">
                      <Users className="h-6 w-6" />
                    </div>
                    Student Roster
                  </h2>
                  <p className="text-slate-600">Manage and view your students by grade level</p>
                </div>
                <GradeBasedStudentRoster />
              </div>
              </motion.div>
            )}

            {activeTab === 'shoutouts' && (
              <motion.div
                key="shoutouts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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
                className="space-y-4 sm:space-y-8"
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
                className="space-y-4 sm:space-y-8"
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
                className="space-y-4 sm:space-y-8"
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
                          onClick={() => setActiveTab('activities')}
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
                className="space-y-4 sm:space-y-8"
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
                className="space-y-4 sm:space-y-8"
              >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl text-white">
                      <Shield className="h-6 w-6" />
                    </div>
                    Incident Logging System
                  </h2>
                  <p className="text-slate-600">Secure and private incident documentation for administrative purposes</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    { title: 'Behavioral Incidents', icon: AlertTriangle, color: 'from-red-500 to-red-600', count: '0' },
                    { title: 'Academic Concerns', icon: BookOpen, color: 'from-blue-500 to-blue-600', count: '0' },
                    { title: 'Positive Notes', icon: Star, color: 'from-green-500 to-green-600', count: '0' }
                  ].map((category, index) => {
                    const Icon = category.icon
                    return (
                      <motion.div
                        key={category.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg border border-gray-100"
                      >
                        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${category.color} text-white mb-4`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">{category.title}</h3>
                        <div className="text-3xl font-bold text-slate-700 mb-2">{category.count}</div>
                        <p className="text-slate-500 text-sm">This month</p>
                      </motion.div>
                    )
                  })}
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100 text-center">
                  <div className="inline-flex p-4 bg-blue-500 rounded-full text-white mb-4">
                    <FileText className="h-8 w-8" />
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-500 rounded-lg text-white">
                        <Bell className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">Automated Notifications</h3>
                    </div>
                    <p className="text-slate-600 mb-4">Set up automatic updates for attendance and progress</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Open Notifications
                    </Button>
                  </div>
                </div>
              </div>
              </motion.div>
            )}


          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ComprehensiveAnalytics />
            </motion.div>
          )}

          {activeTab === 'communication' && (
            <motion.div
              key="communication"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ParentCommunicationSystem />
            </motion.div>
          )}

          {activeTab === 'activities' && (
            <motion.div
              key="activities"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
