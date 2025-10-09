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
  Search
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
  const { user, profile } = useAppSelector((state) => state.auth)
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
    if (!user) {
      router.push('/login')
      return
    }
    
    if (user.role !== 'teacher') {
      router.push('/login')
      return
    }

    console.log('Teacher examinations page loaded for user:', user.id)
    fetchExams()
    fetchTeacherStats()
  }, [user, router])
  
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-xl">Loading examination dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight 
            }}
            animate={{ 
              opacity: [0, 0.6, 0], 
              y: [null, -50],
              scale: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 4 + 3, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            className="absolute w-1 h-1 bg-indigo-400 rounded-full"
          />
        ))}
      </div>

      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-white hover:bg-slate-700/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl"
                  >
                    <BookOpen className="w-8 h-8 text-white" />
                  </motion.div>
                  Examination Center
                </h1>
                <p className="text-slate-400 mt-1">Create, manage, and analyze student assessments</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  console.log('Manual refresh triggered')
                  setLoading(true)
                  fetchExams()
                  fetchTeacherStats()
                }}
                variant="outline"
                className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Exam
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Total Exams</p>
                  <p className="text-xl font-bold text-white">{teacherStats.total_exams}</p>
                </div>
                <BookOpen className="w-6 h-6 text-indigo-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Active</p>
                  <p className="text-xl font-bold text-green-400">{teacherStats.active_exams}</p>
                </div>
                <Target className="w-6 h-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Students</p>
                  <p className="text-xl font-bold text-blue-400">{teacherStats.total_students}</p>
                </div>
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Completion</p>
                  <p className="text-xl font-bold text-yellow-400">{teacherStats.average_completion_rate.toFixed(0)}%</p>
                </div>
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Questions</p>
                  <p className="text-xl font-bold text-purple-400">{teacherStats.total_questions_created}</p>
                </div>
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">AI Generated</p>
                  <p className="text-xl font-bold text-pink-400">{teacherStats.ai_questions_generated}</p>
                </div>
                <Sparkles className="w-6 h-6 text-pink-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
          
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-600 text-white">
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
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-600 text-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Debug Info */}
        {!loading && (
          <div className="mb-4 p-4 bg-slate-800/50 rounded-lg text-xs text-slate-400">
            <p>Debug: Total exams: {exams.length}, User ID: {user?.id}, Loading: {loading ? 'Yes' : 'No'}</p>
          </div>
        )}

        {/* Empty state */}
        {getFilteredExams().length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || selectedSubject !== 'all' || selectedStatus !== 'all' 
                ? 'No exams match your filters' 
                : 'No exams created yet'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || selectedSubject !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Create your first examination to get started. Click the Refresh button to check for new exams.'}
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Exam
            </Button>
          </motion.div>
        )}
      </main>

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
