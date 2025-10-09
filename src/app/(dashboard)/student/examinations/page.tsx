'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  BookOpen, 
  Clock, 
  Trophy, 
  Target,
  Play,
  Eye,
  Calendar,
  Award,
  Sparkles,
  Brain,
  Zap,
  Timer,
  CheckCircle2,
  AlertCircle,
  Star,
  Gem
} from 'lucide-react'
import { useAppSelector } from '@/lib/redux/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ExamCard } from '@/components/examination/ExamCard'

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
  teacher_name?: string
}

interface StudentExamStatus {
  exam_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  score?: number
  attempts: number
  last_attempt?: string
}

export default function StudentExaminations() {
  const router = useRouter()
  const { user, profile } = useAppSelector((state) => state.auth)
  const [exams, setExams] = useState<Exam[]>([])
  const [examStatuses, setExamStatuses] = useState<Record<string, StudentExamStatus>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [studentStats, setStudentStats] = useState({
    total_exams: 0,
    completed_exams: 0,
    average_score: 0,
    total_xp_earned: 0,
    badges_earned: 0,
    current_streak: 0
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (user.role !== 'student') {
      router.push('/login')
      return
    }

    fetchExams()
    fetchStudentStats()
  }, [user, router])

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/student/examinations', {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setExams(data.exams || [])
      setExamStatuses(data.statuses || {})
    } catch (error) {
      console.error('Failed to fetch exams:', error)
      // Set mock data for development
      setExams([])
      setExamStatuses({})
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentStats = async () => {
    try {
      const response = await fetch('/api/student/exam-stats', {
        credentials: 'include'
      })
      const data = await response.json()
      setStudentStats(data.stats || studentStats)
    } catch (error) {
      console.error('Failed to fetch student stats:', error)
    }
  }

  const handleStartExam = (examId: string) => {
    router.push(`/student-dashboard/examinations/${examId}`)
  }

  const handleViewResults = (examId: string) => {
    router.push(`/student-dashboard/examinations/${examId}/results`)
  }

  const getFilteredExams = () => {
    switch (selectedCategory) {
      case 'upcoming':
        return exams.filter(exam => {
          const status = examStatuses[exam.id]
          return !status || status.status === 'not_started'
        })
      case 'completed':
        return exams.filter(exam => {
          const status = examStatuses[exam.id]
          return status && status.status === 'completed'
        })
      case 'practice':
        return exams.filter(exam => exam.exam_type === 'practice')
      default:
        return exams
    }
  }

  const getCompletionPercentage = () => {
    if (studentStats.total_exams === 0) return 0
    return (studentStats.completed_exams / studentStats.total_exams) * 100
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-xl">Loading your examinations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Floating particles background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight 
            }}
            animate={{ 
              opacity: [0, 1, 0], 
              y: [null, -100],
              scale: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
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
                    className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl"
                  >
                    <BookOpen className="w-8 h-8 text-white" />
                  </motion.div>
                  Examinations
                </h1>
                <p className="text-slate-400 mt-1">Test your knowledge and earn rewards</p>
              </div>
            </div>

            {/* Student level and XP */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-bold">{studentStats.total_xp_earned} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300">{studentStats.badges_earned} badges</span>
                </div>
              </div>
              
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{profile?.level || 1}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Exams</p>
                  <p className="text-2xl font-bold text-white">{studentStats.total_exams}</p>
                </div>
                <Target className="w-8 h-8 text-blue-400" />
              </div>
              <div className="mt-4">
                <Progress value={getCompletionPercentage()} className="h-2" />
                <p className="text-xs text-slate-400 mt-1">
                  {studentStats.completed_exams} completed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Average Score</p>
                  <p className="text-2xl font-bold text-green-400">
                    {studentStats.average_score.toFixed(1)}%
                  </p>
                </div>
                <Award className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Current Streak</p>
                  <p className="text-2xl font-bold text-yellow-400">{studentStats.current_streak}</p>
                </div>
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">XP Earned</p>
                  <p className="text-2xl font-bold text-purple-400">{studentStats.total_xp_earned}</p>
                </div>
                <Gem className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All Exams', icon: BookOpen },
            { id: 'upcoming', label: 'Upcoming', icon: Calendar },
            { id: 'completed', label: 'Completed', icon: CheckCircle2 },
            { id: 'practice', label: 'Practice', icon: Brain }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={selectedCategory === id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(id)}
              className={`flex items-center gap-2 whitespace-nowrap ${
                selectedCategory === id 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {getFilteredExams().map((exam) => {
              const status = examStatuses[exam.id]
              return (
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
                    userRole="student"
                    studentStatus={status?.status}
                    studentScore={status?.score}
                    studentAttempts={status?.attempts || 0}
                    onStart={() => handleStartExam(exam.id)}
                    onView={() => handleViewResults(exam.id)}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {getFilteredExams().length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {selectedCategory === 'all' ? 'No exams available' :
               selectedCategory === 'upcoming' ? 'No upcoming exams' :
               selectedCategory === 'completed' ? 'No completed exams' :
               'No practice exams available'}
            </h3>
            <p className="text-slate-400 mb-6">
              {selectedCategory === 'all' ? 'Check back later for new examinations' :
               selectedCategory === 'upcoming' ? 'All caught up! Great job staying on top of your studies.' :
               selectedCategory === 'completed' ? 'Complete some exams to see your results here' :
               'Practice exams will appear here when available'}
            </p>
            {selectedCategory !== 'all' && (
              <Button
                onClick={() => setSelectedCategory('all')}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                View All Exams
              </Button>
            )}
          </motion.div>
        )}

        {/* Motivational footer */}
        {getFilteredExams().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-8">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Keep Going, Champion!</h3>
              <p className="text-slate-300">
                Every exam is a step closer to mastering your subjects. You've got this! 🌟
              </p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
