'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  BookOpen,
  BarChart3,
  Users,
  Clock,
  Settings,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  Target,
  Award,
  Brain,
  Sparkles,
  Filter,
  Search,
  GraduationCap,
  CheckCircle,
  TrendingUp,
  FileText,
  Copy,
  Share2,
  MoreVertical,
  Archive,
  PieChart,
  LineChart,
  Activity,
  Zap,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  Database,
  School,
  Home,
  X,
  Menu,
  ChevronRight,
  Lightbulb,
  Rocket
} from 'lucide-react'
import { useAppSelector } from '@/lib/redux/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExamCard } from '@/components/examination/ExamCard'
import { ExamCreator } from '@/components/examination/ExamCreator'
import { ExamAnalytics } from '@/components/examination/ExamAnalytics'
import { TopLoader } from '@/components/ui/top-loader'

interface Exam {
  id: string
  title: string
  description?: string
  subject: string
  grade_level: string
  difficulty_level: 'easy' | 'medium' | 'hard' | 'expert'
  total_questions: number
  total_marks: number
  duration_minutes: number
  start_time?: string
  end_time?: string
  is_published: boolean
  exam_type: 'quiz' | 'test' | 'midterm' | 'final' | 'practice' | 'assignment'
  max_attempts: number
  student_count?: number
  completion_rate?: number
  average_score?: number
  created_at: string
}

export default function TeacherExaminations() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading } = useAppSelector((state) => state.auth)
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedExamForAnalytics, setSelectedExamForAnalytics] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isTabLoading, setIsTabLoading] = useState(false)
  const [teacherStats, setTeacherStats] = useState({
    total_exams: 0,
    active_exams: 0,
    total_students: 0,
    average_completion_rate: 0,
    total_questions_created: 0,
    ai_questions_generated: 0
  })

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) {
      console.log('Auth still loading, waiting...')
      return
    }

    // Now check authentication after loading is complete
    if (!user || !profile) {
      console.log('No user/profile found, redirecting to login')
      router.push('/login')
      return
    }

    if (profile.role !== 'teacher') {
      console.log('User is not a teacher, redirecting')
      router.push('/login')
      return
    }

    console.log('Teacher examinations page loaded for user:', user.id)
    fetchExams()
    fetchTeacherStats()
  }, [user, profile, authLoading, router])

  // Add a separate effect to refetch when user changes
  useEffect(() => {
    if (user?.id) {
      console.log('User ID changed, refetching exams')
      fetchExams()
    }
  }, [user?.id])

  const fetchExams = async () => {
    try {
      // Include teacher ID in query params as workaround for session issues
      const url = user?.id
        ? `/api/teacher/examinations?teacherId=${user.id}`
        : '/api/teacher/examinations'

      console.log('Fetching from URL:', url)
      const response = await fetch(url, {
        credentials: 'include'
      })
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      console.log('Fetched exams:', data.exams?.length || 0, 'exams')
      if (data.exams && data.exams.length > 0) {
        console.log('First exam:', data.exams[0])
      }
      setExams(data.exams || [])

      // Debug logging
      console.log('===== EXAM DEBUG INFO =====')
      console.log('Total exams set:', data.exams?.length || 0)
      console.log('Exams array:', data.exams)
      console.log('===========================')
    } catch (error) {
      console.error('Failed to fetch exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeacherStats = async () => {
    try {
      const response = await fetch('/api/teacher/exam-stats', {
        credentials: 'include'
      })
      const data = await response.json()
      setTeacherStats(data.stats || teacherStats)
    } catch (error) {
      console.error('Failed to fetch teacher stats:', error)
    }
  }

  const handleCreateExam = async (examData: any) => {
    try {
      // Check if user is authenticated before making request
      if (!user) {
        console.error('No user found, redirecting to login')
        router.push('/login')
        return
      }

      // Validate exam data
      if (!examData || typeof examData !== 'object') {
        console.error('Invalid exam data:', examData)
        alert('Invalid exam data provided')
        return
      }

      console.log('Creating exam with data:', examData)
      console.log('Creating exam with user:', { userId: user.id, role: user.role })
      console.log('User session info:', {
        hasUser: !!user,
        userRole: user.role,
        cookies: document.cookie.substring(0, 200) + '...'
      })

      const response = await fetch('/api/teacher/examinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...examData,
          userId: user.id // Include user ID as workaround for session issue
        })
      })

      if (response.ok) {
        setShowCreateModal(false)
        fetchExams()
        fetchTeacherStats()
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }

        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
          url: response.url
        })

        if (response.status === 401) {
          console.error('Authentication failed, redirecting to login')
          router.push('/login')
        } else {
          // Show user-friendly error message
          alert(`Failed to create exam: ${errorData.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Failed to create exam:', error)
    }
  }

  const handleEditExam = (examId: string) => {
    router.push(`/teacher/examinations/${examId}/edit`)
  }

  const handleViewAnalytics = (examId: string) => {
    setSelectedExamForAnalytics(examId)
  }

  const handleDeleteExam = async (examId: string) => {
    if (confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/teacher/examinations/${examId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          fetchExams()
          fetchTeacherStats()
        }
      } catch (error) {
        console.error('Failed to delete exam:', error)
      }
    }
  }

  // Memoized filtered exams for performance
  const filteredExams = useMemo(() => {
    const filtered = exams.filter(exam => {
      const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSubject = selectedSubject === 'all' || exam.subject === selectedSubject
      const matchesStatus = selectedStatus === 'all' ||
        (selectedStatus === 'published' && exam.is_published) ||
        (selectedStatus === 'draft' && !exam.is_published)

      return matchesSearch && matchesSubject && matchesStatus
    })

    console.log('===== FILTERED EXAMS =====')
    console.log('Total exams:', exams.length)
    console.log('Filtered exams:', filtered.length)
    console.log('Search term:', searchTerm)
    console.log('Selected subject:', selectedSubject)
    console.log('Selected status:', selectedStatus)
    console.log('==========================')

    return filtered
  }, [exams, searchTerm, selectedSubject, selectedStatus])

  const getUniqueSubjects = () => {
    const subjectSet = new Set(exams.map(exam => exam.subject))
    const subjects = Array.from(subjectSet)
    return subjects.filter(Boolean)
  }

  const [activeTab, setActiveTab] = useState('exams')

  // Handle tab change with top loader
  const handleTabChange = (tab: string) => {
    setIsTabLoading(true)
    setActiveTab(tab)

    // Simulate brief loading for smooth transition
    setTimeout(() => {
      setIsTabLoading(false)
    }, 400)
  }

  // Show loading while auth is being checked
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-0 -left-10 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-0 -right-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-xl"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <div className="space-y-2 flex-1">
                <motion.div
                  className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-64"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: "200% 100%"
                  }}
                />
                <motion.div
                  className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-96"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 0.1
                  }}
                  style={{
                    backgroundSize: "200% 100%"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6">
            {[...Array(6)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative overflow-hidden rounded-xl bg-white p-4 sm:p-6 shadow-xl"
              >
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: index * 0.1
                  }}
                />

                <div className="relative space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-8 bg-gray-300 rounded w-12" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Content Cards Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="relative overflow-hidden rounded-xl bg-white p-6 shadow-xl"
              >
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: index * 0.15
                  }}
                />

                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                    <div className="h-3 bg-gray-200 rounded w-4/6" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Loading Message with Icon */}
          <motion.div
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white/95 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border border-gray-200 flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </motion.div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Loading examination system</span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-blue-600"
                >
                  ...
                </motion.span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (selectedExamForAnalytics) {
    const exam = exams.find(e => e.id === selectedExamForAnalytics)
    return (
      <ExamAnalytics
        examId={selectedExamForAnalytics}
        examTitle={exam?.title || 'Exam Analytics'}
      />
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
                <h2 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>Examinations</h2>
                <p className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 uppercase" style={{ fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.05em' }}>Assessment Hub</p>
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

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1.5 sm:space-y-2 overflow-y-auto">
          <motion.button
            onClick={() => router.push('/teacher')}
            whileHover={{ scale: 1.01, x: 3 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center space-x-3 px-3 sm:px-4 py-3 rounded-xl transition-all duration-200 text-left group relative overflow-hidden hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <Home className="h-5 w-5 text-gray-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Back to Dashboard</span>
            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-slate-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>

          <div className="h-px bg-gray-200 dark:bg-slate-700 my-4"></div>

          {[
            { id: 'overview', label: 'Overview', icon: BarChart3, color: 'text-blue-600', bgColor: 'bg-blue-50' },
            { id: 'exams', label: 'All Exams', icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
            { id: 'questions', label: 'Question Bank', icon: Database, color: 'text-purple-600', bgColor: 'bg-purple-50' },
            { id: 'analytics', label: 'Analytics', icon: PieChart, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
            { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-600', bgColor: 'bg-slate-50' }
          ].map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  handleTabChange(item.id)
                  setSidebarOpen(false)
                }}
                whileHover={{ scale: 1.01, x: 3 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-3 rounded-xl transition-all duration-200 text-left group relative overflow-hidden ${isActive
                  ? `bg-white dark:bg-slate-700 ${item.color} shadow-sm border border-gray-200 dark:border-slate-600`
                  : `text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700`
                  }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? item.bgColor : 'bg-gray-100 dark:bg-slate-700'} transition-all duration-200 group-hover:scale-110`}>
                  <Icon className={`h-4 w-4 ${isActive ? item.color : 'text-gray-500 dark:text-slate-400'}`} />
                </div>
                <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`} style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-y-2 left-0 w-1 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </nav>

        {/* Quick Stats Footer */}
        <div className="p-4 border-t border-gray-200/50 dark:border-slate-700/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-slate-900/50">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{teacherStats.total_exams}</div>
              <div className="text-[10px] text-gray-600 dark:text-slate-400 uppercase" style={{ fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.05em' }}>Exams</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{teacherStats.active_exams}</div>
              <div className="text-[10px] text-gray-600 dark:text-slate-400 uppercase" style={{ fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.05em' }}>Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 lg:ml-64">
        {/* Enterprise Header Bar */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5 text-gray-600 dark:text-slate-400" />
              </Button>

              {/* Page Title */}
              <div className="flex-1 lg:flex-none">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                  Examination System
                </h1>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5 hidden sm:block" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  Comprehensive assessment management and analytics
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  onClick={() => {
                    setLoading(true)
                    fetchExams()
                    fetchTeacherStats()
                  }}
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Create Exam</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">

            {/* Enhanced Statistics - Gradient Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Exams</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{teacherStats.total_exams}</p>
                      </div>
                      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs sm:text-sm font-medium">Active</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{teacherStats.active_exams}</p>
                      </div>
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-xs sm:text-sm font-medium">Students</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{teacherStats.total_students}</p>
                      </div>
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-xl">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-xs sm:text-sm font-medium">Completion</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{teacherStats.average_completion_rate.toFixed(0)}%</p>
                      </div>
                      <Award className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-xl">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-indigo-100 text-xs sm:text-sm font-medium">Questions</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{teacherStats.total_questions_created}</p>
                      </div>
                      <Brain className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-indigo-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-0 shadow-xl">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-pink-100 text-xs sm:text-sm font-medium">AI Generated</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{teacherStats.ai_questions_generated}</p>
                      </div>
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-pink-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Content Area - Controlled by Sidebar Navigation */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Welcome Message */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex-shrink-0">
                          <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
                            Welcome to Your Assessment Hub
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3">
                            Create engaging examinations, track student performance, and gain valuable insights - all in one place.
                          </p>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI-Powered Questions
                            </Badge>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Instant Analytics
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                              <Users className="h-3 w-3 mr-1" />
                              Student Insights
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200 active:scale-95 group"
                      onClick={() => handleTabChange('exams')}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2.5 sm:p-3 bg-blue-50 rounded-lg sm:rounded-xl group-hover:bg-blue-100 transition-colors flex-shrink-0">
                            <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-0.5 sm:mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>Create New Exam</h4>
                            <p className="text-xs text-gray-600 truncate">Start with AI or from scratch</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-emerald-200 active:scale-95 group"
                      onClick={() => handleTabChange('questions')}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-lg sm:rounded-xl group-hover:bg-emerald-100 transition-colors flex-shrink-0">
                            <Database className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-0.5 sm:mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>Question Bank</h4>
                            <p className="text-xs text-gray-600 truncate">Reusable question library</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-200 active:scale-95 group"
                      onClick={() => handleTabChange('analytics')}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2.5 sm:p-3 bg-purple-50 rounded-lg sm:rounded-xl group-hover:bg-purple-100 transition-colors flex-shrink-0">
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-0.5 sm:mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>View Analytics</h4>
                            <p className="text-xs text-gray-600 truncate">Performance insights</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity & Tips */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Exams */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          <Clock className="h-5 w-5 text-blue-600" />
                          Recent Exams
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {exams.length > 0 ? (
                          <div className="space-y-3">
                            {exams.slice(0, 3).map((exam) => (
                              <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => handleTabChange('exams')}>
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${exam.is_published ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                    <BookOpen className={`h-4 w-4 ${exam.is_published ? 'text-green-600' : 'text-yellow-600'}`} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm text-gray-900">{exam.title}</p>
                                    <p className="text-xs text-gray-500">{exam.subject} • {exam.total_questions} questions</p>
                                  </div>
                                </div>
                                <Badge variant={exam.is_published ? "default" : "secondary"} className="text-xs">
                                  {exam.is_published ? 'Published' : 'Draft'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 mb-3">No exams created yet</p>
                            <Button size="sm" onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Your First Exam
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Pro Tips */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          <Lightbulb className="h-5 w-5 text-yellow-500" />
                          Pro Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">Use AI Question Generation</p>
                            <p className="text-xs text-gray-600">Save hours by letting AI create quality questions based on your topics</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">Build a Question Bank</p>
                            <p className="text-xs text-gray-600">Create reusable questions to quickly assemble future exams</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">Check Analytics Regularly</p>
                            <p className="text-xs text-gray-600">Monitor student performance to identify learning gaps early</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {activeTab === 'exams' && (
                <motion.div
                  key="exams"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Filters and Search - Sticky */}
                  <div className="sticky top-0 z-10 pb-3 sm:pb-4">
                    <Card className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg">
                      <CardContent className="p-3 sm:p-4 lg:p-6">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
                          <div className="flex-1 w-full sm:min-w-[200px]">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              <Input
                                placeholder="Search exams..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 sm:h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 sm:gap-3">
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                              <SelectTrigger className="flex-1 sm:w-[180px] h-11 sm:h-10 bg-white border-gray-300 text-base sm:text-sm">
                                <SelectValue placeholder="All Subjects" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {getUniqueSubjects().map(subject => (
                                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                              <SelectTrigger className="flex-1 sm:w-[140px] h-11 sm:h-10 bg-white border-gray-300 text-base sm:text-sm">
                                <SelectValue placeholder="All Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Exams Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    <AnimatePresence>
                      {filteredExams.map((exam) => (
                        <motion.div
                          key={exam.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ExamCard
                            exam={exam}
                            userRole="teacher"
                            onEdit={() => handleEditExam(exam.id)}
                            onAnalytics={() => handleViewAnalytics(exam.id)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Empty state */}
                  {filteredExams.length === 0 && !loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="py-8"
                    >
                      <Card className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-blue-200 shadow-xl">
                        <CardContent className="p-8 sm:p-12">
                          {searchTerm || selectedSubject !== 'all' || selectedStatus !== 'all' ? (
                            // Filtered empty state
                            <>
                              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                <Search className="w-10 h-10 text-blue-600" />
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                                No Exams Found
                              </h3>
                              <p className="text-gray-600 text-sm sm:text-base mb-6 max-w-md mx-auto">
                                We couldn't find any exams matching your search criteria. Try adjusting your filters or search term.
                              </p>
                              <div className="flex flex-wrap gap-3 justify-center">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSearchTerm('')
                                    setSelectedSubject('all')
                                    setSelectedStatus('all')
                                  }}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Clear Filters
                                </Button>
                                <Button
                                  onClick={() => setShowCreateModal(true)}
                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Create New Exam
                                </Button>
                              </div>
                            </>
                          ) : (
                            // First-time empty state with guidance
                            <>
                              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                              </div>
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 px-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
                                Let's Create Your First Exam!
                              </h3>
                              <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                                Start assessing your students with our powerful examination tools. You can create exams manually or use AI to generate questions instantly.
                              </p>

                              {/* Quick Start Steps */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
                                <div className="text-center">
                                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-xl font-bold text-blue-600">1</span>
                                  </div>
                                  <h4 className="font-semibold text-sm text-gray-900 mb-2">Set Up Details</h4>
                                  <p className="text-xs text-gray-600">Add title, subject, and duration</p>
                                </div>
                                <div className="text-center">
                                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <span className="text-xl font-bold text-emerald-600">2</span>
                                  </div>
                                  <h4 className="font-semibold text-sm text-gray-900 mb-2">Add Questions</h4>
                                  <p className="text-xs text-gray-600">Create manually or use AI</p>
                                </div>
                                <div className="text-center">
                                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                                    <span className="text-xl font-bold text-purple-600">3</span>
                                  </div>
                                  <h4 className="font-semibold text-sm text-gray-900 mb-2">Publish & Share</h4>
                                  <p className="text-xs text-gray-600">Make it available to students</p>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center px-4">
                                <Button
                                  onClick={() => setShowCreateModal(true)}
                                  size="lg"
                                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg min-h-[48px]"
                                >
                                  <Sparkles className="w-5 h-5 mr-2" />
                                  <span className="truncate">Create Your First Exam</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="lg"
                                  onClick={() => handleTabChange('questions')}
                                  className="w-full sm:w-auto min-h-[48px]"
                                >
                                  <Database className="w-5 h-5 mr-2" />
                                  <span className="truncate">Explore Question Bank</span>
                                </Button>
                              </div>

                              {/* Feature Highlights */}
                              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 px-4">
                                <p className="text-xs text-gray-500 mb-4 uppercase tracking-wide font-semibold">What You Can Do</p>
                                <div className="flex flex-wrap gap-3 justify-center">
                                  <Badge className="bg-white border border-blue-200 text-blue-700 hover:bg-blue-50">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    AI Question Generator
                                  </Badge>
                                  <Badge className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                    <Target className="h-3 w-3 mr-1" />
                                    Multiple Choice & Essay
                                  </Badge>
                                  <Badge className="bg-white border border-purple-200 text-purple-700 hover:bg-purple-50">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Instant Analytics
                                  </Badge>
                                  <Badge className="bg-white border border-orange-200 text-orange-700 hover:bg-orange-50">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Timed Exams
                                  </Badge>
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {activeTab === 'questions' && (
                <motion.div
                  key="questions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-xl">
                    <CardContent className="p-8 sm:p-12">
                      <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                          <Database className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          Question Bank
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
                          Build a library of reusable questions to save time and maintain consistency across your exams.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900">Create Questions</h4>
                          </div>
                          <p className="text-sm text-gray-600">Build questions you can reuse in multiple exams</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Copy className="h-5 w-5 text-purple-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900">Organize by Topic</h4>
                          </div>
                          <p className="text-sm text-gray-600">Categorize questions by subject and difficulty</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              <Zap className="h-5 w-5 text-emerald-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900">Quick Assembly</h4>
                          </div>
                          <p className="text-sm text-gray-600">Drag and drop questions into new exams</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg" size="lg">
                          <Plus className="w-5 h-5 mr-2" />
                          Start Building Question Bank
                        </Button>
                        <p className="text-xs text-gray-500 mt-4">Coming Soon: Import questions from CSV or existing exams</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-xl">
                    <CardContent className="p-8 sm:p-12">
                      <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          <PieChart className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          Performance Analytics
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
                          Track student performance, identify learning gaps, and make data-driven decisions to improve outcomes.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                          <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                          <h4 className="text-2xl font-bold text-gray-900 mb-1">{teacherStats.average_completion_rate.toFixed(0)}%</h4>
                          <p className="text-xs text-gray-600">Completion Rate</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                          <Users className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                          <h4 className="text-2xl font-bold text-gray-900 mb-1">{teacherStats.total_students}</h4>
                          <p className="text-xs text-gray-600">Total Students</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                          <Award className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                          <h4 className="text-2xl font-bold text-gray-900 mb-1">{teacherStats.total_questions_created}</h4>
                          <p className="text-xs text-gray-600">Questions Created</p>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                          <Sparkles className="h-8 w-8 text-pink-600 mx-auto mb-3" />
                          <h4 className="text-2xl font-bold text-gray-900 mb-1">{teacherStats.ai_questions_generated}</h4>
                          <p className="text-xs text-gray-600">AI Generated</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-4">Available Analytics</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-gray-700">Per-exam performance reports</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-gray-700">Question difficulty analysis</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-gray-700">Student comparison charts</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-gray-700">Time-based trends</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-gray-200 shadow-xl">
                    <CardContent className="p-8 sm:p-12">
                      <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg">
                          <Settings className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          Examination Settings
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
                          Configure default settings and preferences to streamline your exam creation process.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-2">
                          <CardContent className="p-6">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Clock className="h-5 w-5 text-blue-600" />
                              Default Settings
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Default Duration</span>
                                <span className="font-medium">60 minutes</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Default Marks</span>
                                <span className="font-medium">100 points</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Passing Grade</span>
                                <span className="font-medium">60%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-2">
                          <CardContent className="p-6">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-purple-600" />
                              AI Preferences
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Question Style</span>
                                <span className="font-medium">Balanced</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Difficulty Mix</span>
                                <span className="font-medium">Auto</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Language</span>
                                <span className="font-medium">English</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">Settings management coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>

      {/* Create Exam Modal - Mobile Optimized */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] overflow-y-auto sm:rounded-2xl shadow-2xl"
            >
              <ExamCreator
                onSave={handleCreateExam}
                onCancel={() => setShowCreateModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
