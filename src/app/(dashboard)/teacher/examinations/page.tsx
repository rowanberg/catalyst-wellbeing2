'use client'

import { useState, useEffect } from 'react'
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
  Database
} from 'lucide-react'
import { useAppSelector } from '@/lib/redux/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExamCard } from '@/components/examination/ExamCard'
import { ExamCreator } from '@/components/examination/ExamCreator'
import { ExamAnalytics } from '@/components/examination/ExamAnalytics'

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
    router.push(`/teacher-dashboard/examinations/${examId}/edit`)
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

  const getFilteredExams = () => {
    return exams.filter(exam => {
      const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSubject = selectedSubject === 'all' || exam.subject === selectedSubject
      const matchesStatus = selectedStatus === 'all' || 
                           (selectedStatus === 'published' && exam.is_published) ||
                           (selectedStatus === 'draft' && !exam.is_published)
      
      return matchesSearch && matchesSubject && matchesStatus
    })
  }

  const getUniqueSubjects = () => {
    const subjectSet = new Set(exams.map(exam => exam.subject))
    const subjects = Array.from(subjectSet)
    return subjects.filter(Boolean)
  }

  const [activeTab, setActiveTab] = useState('overview')

  // Show loading while auth is being checked
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div className="text-center">
          <motion.div
            className="relative w-16 h-16 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="absolute inset-0 border-4 border-blue-200 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 border-4 border-transparent border-t-blue-500 border-r-indigo-500 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </motion.div>
          </motion.div>
          <p className="text-gray-600 font-medium">Loading examination system...</p>
        </motion.div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sticky Professional Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 sm:space-x-4"
            >
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Examination System
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">Comprehensive assessment management and analytics</p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                onClick={() => {
                  setLoading(true)
                  fetchExams()
                  fetchTeacherStats()
                }}
                variant="outline" 
                size="sm" 
                className="bg-white/50 backdrop-blur-sm hover:bg-white/80 text-xs sm:text-sm"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button 
                onClick={() => setShowCreateModal(true)} 
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden xs:inline">Create Exam</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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

        {/* Professional Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-white border border-gray-200 shadow-lg rounded-xl p-2 mb-6 h-auto min-h-[48px] sm:min-h-[56px]">
            <TabsTrigger 
              value="overview" 
              className="text-xs sm:text-sm font-medium px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600 flex items-center justify-center whitespace-nowrap"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="exams"
              className="text-xs sm:text-sm font-medium px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600 flex items-center justify-center whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Exams
            </TabsTrigger>
            <TabsTrigger 
              value="questions"
              className="text-xs sm:text-sm font-medium px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600 flex items-center justify-center whitespace-nowrap"
            >
              <Database className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Question Bank</span>
              <span className="sm:hidden">Questions</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="text-xs sm:text-sm font-medium px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600 flex items-center justify-center whitespace-nowrap"
            >
              <PieChart className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="text-xs sm:text-sm font-medium px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600 flex items-center justify-center whitespace-nowrap"
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <Activity className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                  Dashboard Overview
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-6">
                  Comprehensive examination statistics and recent activity.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exams" className="space-y-4 sm:space-y-6">
            {/* Filters and Search */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search exams..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-300">
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
                    <SelectTrigger className="w-[140px] bg-white border-gray-300">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Exams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <AnimatePresence>
                {getFilteredExams().map((exam) => (
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
            {getFilteredExams().length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                  <CardContent className="p-8 sm:p-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                      {searchTerm || selectedSubject !== 'all' || selectedStatus !== 'all' 
                        ? 'No exams match your filters' 
                        : 'No exams created yet'}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base mb-6">
                      {searchTerm || selectedSubject !== 'all' || selectedStatus !== 'all'
                        ? 'Try adjusting your search criteria'
                        : 'Create your first examination to get started'}
                    </p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Exam
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <Database className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                  Question Bank
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mb-6">
                  Manage reusable questions and create question templates.
                </p>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Questions
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <PieChart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                  Performance Analytics
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Detailed insights into exam performance and student progress.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <Settings className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                  Examination Settings
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Configure default exam settings and preferences.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Exam Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-6xl max-h-[90vh] overflow-y-auto"
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
