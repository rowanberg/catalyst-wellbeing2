'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Users, 
  BookOpen, 
  Trophy, 
  Calendar,
  Play,
  Eye,
  Settings,
  BarChart3,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Timer,
  Target,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ExamCardProps {
  exam: {
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
    student_count?: number
    completion_rate?: number
    average_score?: number
  }
  userRole: 'student' | 'teacher' | 'admin'
  onStart?: () => void
  onView?: () => void
  onEdit?: () => void
  onAnalytics?: () => void
  studentStatus?: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  studentScore?: number
  studentAttempts?: number
}

export function ExamCard({ 
  exam, 
  userRole, 
  onStart, 
  onView, 
  onEdit, 
  onAnalytics,
  studentStatus,
  studentScore,
  studentAttempts = 0
}: ExamCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'from-green-400 to-emerald-500'
      case 'medium': return 'from-yellow-400 to-orange-500'
      case 'hard': return 'from-red-400 to-pink-500'
      case 'expert': return 'from-purple-400 to-indigo-500'
      default: return 'from-blue-400 to-cyan-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <BookOpen className="w-4 h-4" />
      case 'test': return <Target className="w-4 h-4" />
      case 'midterm': return <Trophy className="w-4 h-4" />
      case 'final': return <Trophy className="w-4 h-4" />
      case 'practice': return <Play className="w-4 h-4" />
      case 'assignment': return <CheckCircle2 className="w-4 h-4" />
      default: return <BookOpen className="w-4 h-4" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'overdue': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  }

  const isAvailable = () => {
    if (!exam.start_time) return exam.is_published
    const now = new Date()
    const startTime = new Date(exam.start_time)
    const endTime = exam.end_time ? new Date(exam.end_time) : null
    
    return exam.is_published && now >= startTime && (!endTime || now <= endTime)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      {/* Floating particles effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  x: Math.random() * 300, 
                  y: Math.random() * 200,
                  scale: 0 
                }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  scale: [0, 1, 0],
                  y: [null, -20]
                }}
                transition={{ 
                  duration: 2, 
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="absolute w-1 h-1 bg-blue-400 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
        {/* Glassmorphic overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        
        {/* Difficulty indicator */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getDifficultyColor(exam.difficulty_level)}`} />

        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getTypeIcon(exam.exam_type)}
                <Badge variant="outline" className="text-xs bg-slate-800/50 border-slate-600">
                  {exam.exam_type.toUpperCase()}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getDifficultyColor(exam.difficulty_level)} border-0`}>
                  {exam.difficulty_level}
                </Badge>
              </div>
              
              <CardTitle className="text-lg font-semibold text-white mb-1 line-clamp-2">
                {exam.title}
              </CardTitle>
              
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {exam.subject}
                </span>
                <span>Grade {exam.grade_level}</span>
              </div>
            </div>

            {/* Status indicator */}
            {userRole === 'student' && studentStatus && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(studentStatus)}`}
              >
                {studentStatus === 'completed' && studentScore !== undefined ? 
                  `${studentScore}%` : 
                  studentStatus.replace('_', ' ').toUpperCase()
                }
              </motion.div>
            )}

            {/* Availability indicator */}
            {userRole !== 'student' && (
              <div className="flex items-center gap-1">
                {isAvailable() ? (
                  <Unlock className="w-4 h-4 text-green-400" />
                ) : (
                  <Lock className="w-4 h-4 text-red-400" />
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Exam details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <Target className="w-4 h-4 text-blue-400" />
              <span>{exam.total_questions} Questions</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>{exam.total_marks} Marks</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Timer className="w-4 h-4 text-purple-400" />
              <span>{formatDuration(exam.duration_minutes)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{exam.max_attempts} Attempt{exam.max_attempts !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Schedule info */}
          {exam.start_time && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/30 rounded-lg p-2">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(exam.start_time).toLocaleDateString()} at{' '}
                {new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* Student progress */}
          {userRole === 'student' && studentAttempts > 0 && (
            <div className="text-xs text-slate-400">
              Attempts: {studentAttempts}/{exam.max_attempts}
            </div>
          )}

          {/* Teacher/Admin stats */}
          {(userRole === 'teacher' || userRole === 'admin') && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {exam.student_count !== undefined && (
                <div className="text-slate-400">
                  <Users className="w-3 h-3 inline mr-1" />
                  {exam.student_count} students
                </div>
              )}
              {exam.completion_rate !== undefined && (
                <div className="text-slate-400">
                  <BarChart3 className="w-3 h-3 inline mr-1" />
                  {exam.completion_rate}% completed
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {userRole === 'student' && (
              <>
                {studentStatus === 'completed' ? (
                  <Button
                    onClick={onView}
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 text-white"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Results
                  </Button>
                ) : isAvailable() && studentAttempts < exam.max_attempts ? (
                  <Button
                    onClick={onStart}
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {studentStatus === 'in_progress' ? 'Continue' : 'Start Exam'}
                  </Button>
                ) : (
                  <Button
                    disabled
                    size="sm"
                    className="flex-1 bg-slate-700/50 text-slate-400"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {studentAttempts >= exam.max_attempts ? 'No Attempts Left' : 'Not Available'}
                  </Button>
                )}
              </>
            )}

            {userRole === 'teacher' && (
              <>
                <Button
                  onClick={onEdit}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800/50 border-slate-600 hover:bg-slate-700/50 text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={onAnalytics}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </>
            )}

            {userRole === 'admin' && (
              <Button
                onClick={onView}
                size="sm"
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
              >
                <Eye className="w-4 h-4 mr-2" />
                Monitor
              </Button>
            )}
          </div>
        </CardContent>

        {/* Glow effect on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Sparkle effect for completed exams */}
        {userRole === 'student' && studentStatus === 'completed' && studentScore && studentScore >= 90 && (
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute top-2 right-2"
          >
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}
