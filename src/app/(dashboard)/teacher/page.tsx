'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimatedProgressBar } from '@/components/ui/animated-progress-bar'
import { FloatingParticles } from '@/components/ui/floating-particles'
import GradeBasedStudentRoster from '@/components/teacher/GradeBasedStudentRoster'
import ShoutOutsSystem from '@/components/teacher/shout-outs-system'
import QuestBadgeCreator from '@/components/teacher/quest-badge-creator'
import BlackMarkSystem from '@/components/teacher/BlackMarkSystem'
import ParentCommunicationSystem from '@/components/teacher/parent-communication-system'
import InteractiveActivitiesSystem from '@/components/teacher/interactive-activities-system'
import UpdateResultsSystem from '@/components/teacher/UpdateResultsSystem'
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
import { MessagingNavButton } from '@/components/ui/messaging-nav-button'
import { ProfileDropdown } from '@/components/ui/profile-dropdown'
import { useAppSelector } from '@/lib/redux/hooks'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'

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
  const [loading, setLoading] = useState(true)
  const [isDataFetching, setIsDataFetching] = useState(false) // Prevent concurrent API calls
  const fetchingRef = useRef(false) // More reliable concurrent call protection
  const [activeTab, setActiveTab] = useState<'analytics' | 'overview' | 'roster' | 'incidents' | 'shoutouts' | 'interventions' | 'quests' | 'messaging' | 'blackmarks' | 'activities' | 'communication' | 'settings' | 'results'>('overview')
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'warning' | 'info'}>>([])
  const [realTimeData, setRealTimeData] = useState({
    newHelpRequests: 0,
    recentActivity: 0,
    completedQuests: 0
  })
  const [selectedStudent, setSelectedStudent] = useState<StudentOverview | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Only set up interval after initial load
    if (!user || !profile) return

    const interval = setInterval(() => {
      // Simulate real-time events without fetching data
      const randomEvents = [
        { type: 'help_request', message: 'New help request from student' },
        { type: 'quest_completed', message: 'Student completed a quest!' },
        { type: 'mood_update', message: 'Student mood updated' }
      ]
      
      if (Math.random() > 0.8) { // Reduced to 20% chance
        const event = randomEvents[Math.floor(Math.random() * randomEvents.length)]
        const notificationType = event.type === 'help_request' ? 'warning' : 'info'
        addNotification(event.message, notificationType)
        
        // Update real-time counters
        setRealTimeData(prev => ({
          ...prev,
          newHelpRequests: event.type === 'help_request' ? prev.newHelpRequests + 1 : prev.newHelpRequests,
          completedQuests: event.type === 'quest_completed' ? prev.completedQuests + 1 : prev.completedQuests,
          recentActivity: prev.recentActivity + 1
        }))
      }
    }, 30000) // Increased to 30 seconds

    return () => clearInterval(interval)
  }, [user, profile])

  const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  useEffect(() => {
    console.log('🔄 Teacher dashboard useEffect triggered')
    console.log('   - user exists:', !!user, 'user.id:', user?.id)
    console.log('   - profile exists:', !!profile, 'profile.user_id:', profile?.user_id)
    console.log('   - fetchingRef.current:', fetchingRef.current)
    console.log('   - isDataFetching:', isDataFetching)
    
    if (user && profile && user.id && profile.user_id) {
      console.log('✅ Conditions met, calling fetchClassData...')
      fetchClassData()
    } else {
      // If no user or profile, stop loading
      console.log('❌ Conditions not met, stopping loading')
      setLoading(false)
    }
  }, [user?.id, profile?.user_id]) // Use stable IDs instead of full objects

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

    // Prevent concurrent API calls using ref for immediate check
    if (fetchingRef.current) {
      console.log('Data fetch already in progress (ref check), skipping...')
      return
    }

    // Double check with state as well
    if (isDataFetching) {
      console.log('Data fetch already in progress (state check), skipping...')
      return
    }

    try {
      fetchingRef.current = true // Set ref guard immediately
      setIsDataFetching(true) // Set state guard
      setLoading(true)
      console.log('Fetching teacher analytics for user:', user.id)
      
      // Use combined API for better performance (single request instead of two)
      console.log('Fetching combined dashboard data for user ID:', user.id)
      const response = await fetch(`/api/teacher/dashboard-combined?teacher_id=${user.id}`)
      
      console.log('Combined API response status:', response.status)
      
      if (response.ok) {
        const combinedData = await response.json()
        console.log('Combined dashboard data received:', combinedData)
        
        // Set analytics data
        setAnalytics(combinedData.analytics || {
          totalStudents: 0,
          averageXP: 0,
          activeToday: 0,
          helpRequests: 0,
          moodDistribution: { happy: 0, excited: 0, calm: 0, sad: 0, angry: 0, anxious: 0 },
          averageStreak: 0
        })
        
        // Set students data
        setStudents(combinedData.students || [])
      } else {
        console.error('Failed to fetch teacher analytics:', response.status)
        const errorText = await response.text()
        console.error('Analytics API error response:', errorText)
        // Set default analytics if API fails
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
      }

    } catch (error: any) {
      console.error('Error fetching class data:', error)
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
      console.log('Setting loading to false')
      fetchingRef.current = false // Clear ref guard
      setIsDataFetching(false) // Clear state guard
      setLoading(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="relative w-16 h-16 mx-auto mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="absolute inset-0 border-4 border-blue-200 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </motion.div>
          </motion.div>
          <motion.p 
            className="text-slate-600 font-medium text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading your dashboard...
          </motion.p>
          <motion.div
            className="flex justify-center mt-3 space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    )
  }

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy': return <Smile className="h-4 w-4 text-yellow-500" />
      case 'excited': return <Zap className="h-4 w-4 text-orange-500" />
      case 'calm': return <Coffee className="h-4 w-4 text-blue-500" />
      case 'sad': return <Frown className="h-4 w-4 text-blue-600" />
      case 'angry': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'anxious': return <Brain className="h-4 w-4 text-purple-500" />
      default: return <Meh className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative min-h-screen flex overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5" />
      <FloatingParticles count={20} className="fixed inset-0 z-0" />
      
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
            { id: 'analytics', label: 'Analytics', icon: Activity, color: 'text-violet-600', bgColor: 'bg-violet-50' },
            { id: 'credits', label: 'Issue Credits', icon: Gem, color: 'text-purple-600', bgColor: 'bg-purple-50', isLink: true, href: '/teacher/issue-credits' },
            { id: 'shoutouts', label: 'Shout-outs', icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-50' },
            { id: 'activities', label: 'Activities', icon: Play, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
            { id: 'communication', label: 'Parent Hub', icon: MessageSquare, color: 'text-sky-600', bgColor: 'bg-sky-50' },
            { id: 'results', label: 'Update Results', icon: BarChart3, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
            { id: 'quests', label: 'Quests', icon: Trophy, color: 'text-rose-500', bgColor: 'bg-rose-50' },
            { id: 'blackmarks', label: 'Black Marks', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
            { id: 'messaging', label: 'Messages', icon: MessageCircle, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
            { id: 'incidents', label: 'Incidents', icon: Shield, color: 'text-slate-600', bgColor: 'bg-slate-50' }
          ].map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  if (item.isLink && item.href) {
                    window.location.href = item.href
                  } else {
                    setActiveTab(item.id as any)
                  }
                  // Close sidebar on mobile after selection
                  setSidebarOpen(false)
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
          {/* Mobile Messaging Button */}
          <div className="sm:hidden">
            <MessagingNavButton userRole="teacher" variant="outline" compact />
          </div>
          
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
        {/* Professional Header */}
        <header className="bg-gradient-to-r from-slate-50 via-gray-50 to-blue-50 backdrop-blur-2xl border-b border-gray-300/60 shadow-sm relative z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-2.5 hover:bg-gray-100 rounded-xl flex-shrink-0 transition-colors"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
                </Button>
                
                <div className="min-w-0 flex-1">
                  <motion.h1 
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <span className="hidden sm:inline">Welcome back, {profile?.first_name || 'Teacher'}</span>
                    <span className="sm:hidden">Welcome, {profile?.first_name || 'Teacher'}</span>
                  </motion.h1>
                  <motion.div 
                    className="text-sm sm:text-base text-gray-600 flex items-center gap-2 mt-1"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="hidden sm:inline font-medium">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="sm:hidden font-medium">
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </motion.div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                {/* Mobile Stats Badge */}
                <div className="flex sm:hidden items-center space-x-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-200/50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-700">{analytics.activeToday}</span>
                </div>
                
                {/* Desktop Stats */}
                <div className="hidden md:flex items-center space-x-5 px-4 py-2.5 bg-gray-50/80 rounded-xl border border-gray-200/80 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-700">{analytics.activeToday} Active</span>
                  </div>
                  <div className="w-px h-5 bg-gray-300"></div>
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-semibold text-gray-700">{analytics.helpRequests}</span>
                  </div>
                </div>
                
                <div className="hidden sm:block">
                  <MessagingNavButton userRole="teacher" />
                </div>
                
                {/* Professional Profile Dropdown */}
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-5 lg:p-6 overflow-auto bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/50">


          {/* Tab Content */}
          <div className="min-h-[300px] sm:min-h-[400px]">
          <AnimatePresence>
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 sm:space-y-6 lg:space-y-8"
              >
                {/* Enhanced Analytics Cards - Mobile 2x2 Layout */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {[
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
                ].map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.03, y: -4 }}
                      className="group"
                    >
                      <Card className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-700 overflow-hidden relative group">
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-50 group-hover:opacity-70 transition-opacity duration-500`} />
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                        <CardContent className="p-3 sm:p-4 lg:p-6 relative z-10">
                          {/* Mobile 2x2 Optimized Layout */}
                          <div className="lg:hidden">
                            <div className="text-center space-y-2">
                              <motion.div 
                                className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-r ${stat.iconBg} text-white shadow-lg flex items-center justify-center`}
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Icon className="h-5 w-5" />
                              </motion.div>
                              
                              <div>
                                <motion.p 
                                  className="text-xl sm:text-2xl font-bold text-gray-900"
                                  key={stat.value}
                                  initial={{ scale: 1.1, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ type: "spring", bounce: 0.3 }}
                                >
                                  {stat.value}
                                </motion.p>
                                <p className="text-xs font-semibold text-gray-700 truncate">{stat.label}</p>
                                <p className="text-xs text-gray-500 truncate leading-tight">{stat.description}</p>
                              </div>
                              
                              <motion.div 
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                                  stat.trend.startsWith('+') 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : stat.trend.startsWith('-')
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 + 0.2 }}
                              >
                                {stat.trend}
                              </motion.div>
                            </div>
                          </div>
                          
                          {/* Desktop Layout */}
                          <div className="hidden lg:block">
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                              <motion.div 
                                className={`p-2 sm:p-3 rounded-2xl bg-gradient-to-r ${stat.iconBg} text-white shadow-lg group-hover:shadow-2xl transition-all duration-300`}
                                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                              >
                                <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                              </motion.div>
                              <motion.div 
                                className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                                  stat.trend.startsWith('+') 
                                    ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200' 
                                    : 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 border border-rose-200'
                                }`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 + 0.3 }}
                              >
                                {stat.trend}
                              </motion.div>
                            </div>
                            <div className="space-y-1 sm:space-y-2">
                              <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</p>
                              <motion.p 
                                className="text-2xl sm:text-3xl font-bold text-gray-900"
                                key={stat.value}
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", bounce: 0.4 }}
                              >
                                {stat.value}
                              </motion.p>
                              <p className="text-xs text-gray-500">{stat.description}</p>
                            </div>
                            <div className="mt-3 sm:mt-4 h-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
                              <motion.div 
                                className={`h-full bg-gradient-to-r ${stat.iconBg} rounded-full shadow-sm relative`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(stat.value * 2, 100)}%` }}
                                transition={{ delay: index * 0.2, duration: 1.5, ease: "easeOut" }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-full" />
                              </motion.div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>

              {/* Enhanced Quick Actions - Mobile 2x2 Layout */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 lg:gap-6">
                {[
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
                ].map((action, index) => {
                  const Icon = action.icon
                  return (
                    <motion.button
                      key={action.label}
                      onClick={action.action}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      className="p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl hover:shadow-2xl sm:hover:shadow-3xl transition-all duration-700 text-left group relative overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.bgColor} opacity-60 group-hover:opacity-80 transition-opacity duration-500`} />
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-15 transition-opacity duration-500`} />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <motion.div 
                            className={`p-2 sm:p-3 rounded-2xl bg-gradient-to-r ${action.iconColor} text-white shadow-lg group-hover:shadow-2xl transition-all duration-300`}
                            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                          >
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                          </motion.div>
                          <motion.div 
                            className="text-xs text-gray-600 font-medium bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/30"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.5 }}
                          >
                            {action.stats}
                          </motion.div>
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                            {action.label}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                            {action.description}
                          </p>
                        </div>
                        <div className="mt-3 sm:mt-4 flex items-center justify-between">
                          <div className="h-1 flex-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden mr-3">
                            <motion.div 
                              className={`h-full bg-gradient-to-r ${action.iconColor} rounded-full`}
                              initial={{ width: 0 }}
                              animate={{ width: "75%" }}
                              transition={{ delay: index * 0.2 + 0.8, duration: 1 }}
                            />
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
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
                      <div className="mt-2 h-2 bg-purple-200 rounded-full">
                        <div className="h-full w-3/4 bg-purple-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
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
                className="space-y-4 sm:space-y-8"
              >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    Disciplinary Management
                  </h2>
                  <p className="text-slate-600">Track and manage student disciplinary actions with remedial support</p>
                </div>
                <BlackMarkSystem />
              </div>
              </motion.div>
            )}

            {activeTab === 'messaging' && (
              <motion.div
                key="messaging"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 sm:space-y-8"
              >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl text-white">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    Parent Communication Hub
                  </h2>
                  <p className="text-slate-600">Secure messaging and communication tools for parent engagement</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500 rounded-lg text-white">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Direct Messaging</h3>
                      </div>
                      <p className="text-slate-600 mb-4">Send secure messages directly to parents and guardians</p>
                      <Button 
                        variant="outline" 
                        className="w-full hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all duration-200"
                        onClick={() => setActiveTab('communication')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Open Messaging
                      </Button>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500 rounded-lg text-white">
                          <Megaphone className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Class Announcements</h3>
                      </div>
                      <p className="text-slate-600 mb-4">Broadcast important updates to all parents</p>
                      <Button 
                        variant="outline" 
                        className="w-full hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-300 transition-all duration-200"
                        onClick={() => setActiveTab('communication')}
                      >
                        <Megaphone className="h-4 w-4 mr-2" />
                        Open Announcements
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500 rounded-lg text-white">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Meeting Scheduler</h3>
                      </div>
                      <p className="text-slate-600 mb-4">Schedule parent-teacher conferences and meetings</p>
                      <Button 
                        variant="outline" 
                        className="w-full hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-300 transition-all duration-200"
                        onClick={() => setActiveTab('communication')}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Open Scheduler
                      </Button>
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
              </div>
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
                    transition={{ delay: 0.2 }}
                  >
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
                      <BarChart3 className="h-8 w-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">
                      Class Analytics Dashboard
                    </h2>
                    <motion.p 
                      className="text-lg text-slate-600 max-w-2xl mx-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      Comprehensive insights into your students' progress, engagement, and well-being patterns
                    </motion.p>
                  </motion.div>
                )
              })}

                {/* Key Metrics Cards */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.9 },
                    show: { opacity: 1, y: 0, scale: 1 }
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <motion.p 
                            className="text-blue-100 text-sm font-medium"
                            initial={{ opacity: 0.7 }}
                            animate={{ opacity: 1 }}
                          >
                            Total Students
                          </motion.p>
                          <motion.span 
                            className="text-3xl font-bold"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.5 }}
                          >
                            {analytics.totalStudents || 28}
                          </motion.span>
                          <div className="text-xs text-blue-200 mt-1">
                            +2 this week
                          </div>
                        </div>
                        <motion.div
                          animate={{ 
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3
                          }}
                        >
                          <Users className="h-8 w-8 text-blue-200" />
                        </motion.div>
                      </div>
                      <motion.div
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-white/30 to-white/10"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.9 },
                    show: { opacity: 1, y: 0, scale: 1 }
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <motion.p 
                            className="text-green-100 text-sm font-medium"
                            initial={{ opacity: 0.7 }}
                            animate={{ opacity: 1 }}
                          >
                            Average XP
                          </motion.p>
                          <motion.span 
                            className="text-3xl font-bold"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.6 }}
                          >
                            {Math.round(analytics.averageXP) || 1247}
                          </motion.span>
                          <div className="text-xs text-green-200 mt-1">
                            +15% this week
                          </div>
                        </div>
                        <motion.div
                          animate={{ 
                            rotateZ: [0, 15, -15, 0],
                            scale: [1, 1.2, 1]
                          }}
                          transition={{ 
                            duration: 2.5,
                            repeat: Infinity,
                            repeatDelay: 2
                          }}
                        >
                          <Trophy className="h-8 w-8 text-green-200" />
                        </motion.div>
                      </div>
                      <motion.div
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-white/30 to-white/10"
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 1.5, delay: 0.7 }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.9 },
                    show: { opacity: 1, y: 0, scale: 1 }
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <motion.p 
                            className="text-purple-100 text-sm font-medium"
                            initial={{ opacity: 0.7 }}
                            animate={{ opacity: 1 }}
                          >
                            Engagement Rate
                          </motion.p>
                          <motion.span 
                            className="text-3xl font-bold"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.7 }}
                          >
                            92%
                          </motion.span>
                          <div className="text-xs text-purple-200 mt-1">
                            +8% this week
                          </div>
                        </div>
                        <motion.div
                          animate={{ 
                            rotate: [0, 360],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 3,
                            repeat: Infinity,
                            repeatDelay: 1
                          }}
                        >
                          <Heart className="h-8 w-8 text-purple-200" />
                        </motion.div>
                      </div>
                      <motion.div
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-white/30 to-white/10"
                        initial={{ width: 0 }}
                        animate={{ width: "92%" }}
                        transition={{ duration: 1.5, delay: 0.8 }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.9 },
                    show: { opacity: 1, y: 0, scale: 1 }
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <motion.p 
                            className="text-orange-100 text-sm font-medium"
                            initial={{ opacity: 0.7 }}
                            animate={{ opacity: 1 }}
                          >
                            Quests Completed
                          </motion.p>
                          <motion.span 
                            className="text-3xl font-bold"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.8 }}
                          >
                            156
                          </motion.span>
                          <div className="text-xs text-orange-200 mt-1">
                            +23 this week
                          </div>
                        </div>
                        <motion.div
                          animate={{ 
                            y: [0, -5, 0],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1.5
                          }}
                        >
                          <Target className="h-8 w-8 text-orange-200" />
                        </motion.div>
                      </div>
                      <motion.div
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-white/30 to-white/10"
                        initial={{ width: 0 }}
                        animate={{ width: "78%" }}
                        transition={{ duration: 1.5, delay: 0.9 }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
                </motion.div>

                {/* Advanced Analytics Charts */}
                <div className="space-y-12">
                  {/* First Row - Mood Trends Chart */}
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg pb-6">
                      <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
                          <TrendingUp className="h-7 w-7" />
                        </div>
                        Weekly Mood Trends
                      </CardTitle>
                    </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {[
                        { day: 'Monday', mood: 'Happy', percentage: 85, color: 'bg-green-500' },
                        { day: 'Tuesday', mood: 'Excited', percentage: 92, color: 'bg-yellow-500' },
                        { day: 'Wednesday', mood: 'Focused', percentage: 78, color: 'bg-blue-500' },
                        { day: 'Thursday', mood: 'Creative', percentage: 88, color: 'bg-purple-500' },
                        { day: 'Friday', mood: 'Energetic', percentage: 95, color: 'bg-orange-500' }
                      ].map((item, index) => (
                        <motion.div
                          key={item.day}
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-6"
                        >
                          <div className="w-24 text-sm font-medium text-slate-700">{item.day}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-slate-600">{item.mood}</span>
                              <span className="text-sm font-semibold text-slate-800">{item.percentage}%</span>
                            </div>
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden mt-2">
                              <motion.div
                                className={`h-full ${item.color} rounded-full`}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                  </Card>

                  {/* Second Row - Performance Distribution */}
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg pb-6">
                      <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white">
                          <BarChart3 className="h-7 w-7" />
                        </div>
                        Performance Distribution
                      </CardTitle>
                    </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-8">
                      {[
                        { level: 'Excellent (90-100%)', count: 8, color: 'bg-green-500', percentage: 29 },
                        { level: 'Good (80-89%)', count: 12, color: 'bg-blue-500', percentage: 43 },
                        { level: 'Average (70-79%)', count: 6, color: 'bg-yellow-500', percentage: 21 },
                        { level: 'Needs Support (<70%)', count: 2, color: 'bg-red-500', percentage: 7 }
                      ].map((item, index) => (
                        <motion.div
                          key={item.level}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.15 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">{item.level}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-slate-600">{item.count} students</span>
                              <span className="text-sm font-semibold text-slate-800">{item.percentage}%</span>
                            </div>
                          </div>
                          <div className="h-5 bg-gray-200 rounded-full overflow-hidden mt-2">
                            <motion.div
                              className={`h-full ${item.color} rounded-full flex items-center justify-end pr-2`}
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ duration: 1.2, delay: index * 0.15 + 0.3 }}
                            >
                              <span className="text-xs font-bold text-white">{item.count}</span>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                  </Card>
                </div>
              </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'communication' && (
            <motion.div
              key="communication"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header Section */}
              <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <MessageCircle className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">Parent Communication Hub</h2>
                      <p className="text-white/90">Connect, engage, and collaborate with families</p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-2xl font-bold">24</div>
                      <div className="text-sm text-white/80">Active Conversations</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-2xl font-bold">89%</div>
                      <div className="text-sm text-white/80">Response Rate</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-sm text-white/80">Meetings Scheduled</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Communication Tools */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Primary Communication Features */}
                <div className="space-y-6">
                  {/* Direct Messaging */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">Direct Messaging</h3>
                        <p className="text-gray-600">Secure one-on-one conversations</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Unread messages</span>
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">3</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Average response time</span>
                        <span className="text-green-600 font-medium">2.4 hours</span>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Open Messages
                      </Button>
                    </div>
                  </motion.div>

                  {/* Class Announcements */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white">
                        <Megaphone className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">Class Announcements</h3>
                        <p className="text-gray-600">Broadcast to all families</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-800">Last announcement</div>
                        <div className="text-sm text-gray-600">Field trip permission forms due Friday</div>
                        <div className="text-xs text-gray-500 mt-1">2 days ago</div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                        <Megaphone className="h-4 w-4 mr-2" />
                        Create Announcement
                      </Button>
                    </div>
                  </motion.div>
                </div>

                {/* Secondary Features */}
                <div className="space-y-6">
                  {/* Meeting Scheduler */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">Meeting Scheduler</h3>
                        <p className="text-gray-600">Parent-teacher conferences</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Upcoming meetings</span>
                        <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">5</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-800">Next meeting</div>
                        <div className="text-sm text-gray-600">Sarah Johnson - Tomorrow 3:30 PM</div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                        <Calendar className="h-4 w-4 mr-2" />
                        Manage Schedule
                      </Button>
                    </div>
                  </motion.div>

                  {/* Progress Reports */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">Progress Reports</h3>
                        <p className="text-gray-600">Share student achievements</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Reports sent this month</span>
                        <span className="text-amber-600 font-medium">28</span>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Generate Reports
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Additional Tools */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Additional Communication Tools</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Bell className="h-6 w-6 text-orange-500" />
                    <span className="text-sm font-medium">Notifications</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-500" />
                    <span className="text-sm font-medium">Documents</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Users className="h-6 w-6 text-green-500" />
                    <span className="text-sm font-medium">Family Directory</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('incidents')}
                  >
                    <Shield className="h-6 w-6 text-gray-500" />
                    <span className="text-sm font-medium">Incident Reports</span>
                  </Button>
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
              className="space-y-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Enhanced Mood Distribution Chart */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-500 relative overflow-hidden">
                  <FloatingParticles count={8} className="opacity-30" />
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Heart className="h-5 w-5 text-pink-600" />
                      </motion.div>
                      Class Mood Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="h-64 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg flex items-center justify-center border border-gray-200">
                        <div className="text-center">
                          <Heart className="h-12 w-12 text-pink-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Mood Distribution</h3>
                          <p className="text-gray-600">Chart visualization coming soon</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(analytics.moodDistribution).map(([mood, count], index) => (
                          <motion.div 
                            key={mood} 
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, x: 5 }}
                          >
                            <div className="flex items-center gap-3">
                              <motion.div 
                                className={`w-4 h-4 rounded-full ${
                                  mood === 'happy' ? 'bg-yellow-400' :
                                  mood === 'excited' ? 'bg-orange-400' :
                                  mood === 'calm' ? 'bg-blue-400' :
                                  mood === 'sad' ? 'bg-gray-400' :
                                  mood === 'angry' ? 'bg-red-400' :
                                  'bg-purple-400'
                                }`}
                                animate={{ 
                                  boxShadow: [`0 0 0 0 ${
                                    mood === 'happy' ? 'rgba(251, 191, 36, 0.4)' :
                                    mood === 'excited' ? 'rgba(251, 146, 60, 0.4)' :
                                    mood === 'calm' ? 'rgba(96, 165, 250, 0.4)' :
                                    mood === 'sad' ? 'rgba(156, 163, 175, 0.4)' :
                                    mood === 'angry' ? 'rgba(248, 113, 113, 0.4)' :
                                    'rgba(167, 139, 250, 0.4)'
                                  }`, `0 0 0 8px ${
                                    mood === 'happy' ? 'rgba(251, 191, 36, 0)' :
                                    mood === 'excited' ? 'rgba(251, 146, 60, 0)' :
                                    mood === 'calm' ? 'rgba(96, 165, 250, 0)' :
                                    mood === 'sad' ? 'rgba(156, 163, 175, 0)' :
                                    mood === 'angry' ? 'rgba(248, 113, 113, 0)' :
                                    'rgba(167, 139, 250, 0)'
                                  }`]
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              />
                              <span className="text-sm font-medium capitalize text-slate-700">{mood}</span>
                            </div>
                            <motion.span 
                              className="text-sm font-bold text-slate-600 bg-gray-100 px-2 py-1 rounded-full"
                              key={count}
                              initial={{ scale: 1.2 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {count}
                            </motion.span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-700">
                      <Activity className="h-5 w-5 mr-2" />
                      Class Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Active Students Today</span>
                        <span className="font-bold text-lg">{analytics.activeToday}/{analytics.totalStudents}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(analytics.activeToday / analytics.totalStudents) * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-700">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Support Needed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {analytics.helpRequests}
                      </div>
                      <p className="text-slate-600">Pending Help Requests</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
