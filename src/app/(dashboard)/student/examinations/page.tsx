'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
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
  Timer,
  CheckCircle2,
  AlertCircle,
  Star,
  Medal
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


  const handleStartExam = (examId: string) => {
    router.push(`/student/examinations/${examId}`)
  }

  const handleViewResults = (examId: string) => {
    router.push(`/student/examinations/${examId}/results`)
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


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-xl">Loading your examinations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">

      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl relative z-10">
        <div className="max-w-full mx-auto px-6 py-6">
          {/* Student Info Card - Full Width */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">Examinations</h1>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Class:</span>
                    <span className="text-white font-semibold">{profile?.class_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">School:</span>
                    <span className="text-white font-semibold">{profile?.school?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex relative z-10 min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800/90 backdrop-blur-xl border-r border-slate-700/50 p-4">
          <nav className="space-y-2">
            <button
              onClick={() => router.push('/student/examinations')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500/20 border border-blue-500/30 text-white hover:bg-blue-500/30 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Examinations</span>
            </button>
            <button
              onClick={() => router.push('/student/leaderboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-all"
            >
              <Medal className="w-5 h-5" />
              <span className="font-medium">Leaderboard</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 px-6 py-8">

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
          {getFilteredExams().map((exam) => {
            const status = examStatuses[exam.id]
            return (
              <ExamCard
                key={exam.id}
                exam={exam}
                userRole="student"
                studentStatus={status?.status}
                studentScore={status?.score}
                studentAttempts={status?.attempts || 0}
                onStart={() => handleStartExam(exam.id)}
                onView={() => handleViewResults(exam.id)}
              />
            )
          })}
          </div>

          {/* Empty state */}
          {getFilteredExams().length === 0 && (
          <div className="text-center py-16">
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
          </div>
          )}

          {/* Motivational footer */}
          {getFilteredExams().length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-8">
              <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Keep Going, Champion!</h3>
              <p className="text-slate-300">
                Every exam is a step closer to mastering your subjects. You've got this! 🌟
              </p>
            </div>
          </div>
          )}
        </div>
      </main>
    </div>
  )
}
