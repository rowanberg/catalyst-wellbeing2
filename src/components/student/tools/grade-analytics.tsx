'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  BarChart3, 
  PieChart, 
  Calendar, 
  Target, 
  Award, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Star,
  Zap,
  Brain,
  Settings,
  Download,
  Filter,
  Eye,
  Activity
} from 'lucide-react'

interface Grade {
  id: string
  subject: string
  assignment: string
  score: number
  maxScore: number
  percentage: number
  date: string
  type: 'test' | 'quiz' | 'homework' | 'project' | 'participation'
  difficulty: 'easy' | 'medium' | 'hard'
  weight: number
}

interface SubjectAnalytics {
  subject: string
  currentGrade: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  assignments: number
  averageScore: number
  strengths: string[]
  improvements: string[]
  nextAssignment?: {
    name: string
    date: string
    type: string
  }
}

export function GradeAnalytics({ onBack }: { onBack: () => void }) {
  const [currentView, setCurrentView] = useState<'overview' | 'subjects' | 'trends' | 'predictions'>('overview')
  const [grades, setGrades] = useState<Grade[]>([])
  const [subjectAnalytics, setSubjectAnalytics] = useState<SubjectAnalytics[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester' | 'year'>('month')

  // Mock data for demonstration
  useEffect(() => {
    setGrades([
      {
        id: '1',
        subject: 'Mathematics',
        assignment: 'Algebra Quiz #3',
        score: 87,
        maxScore: 100,
        percentage: 87,
        date: '2025-09-25',
        type: 'quiz',
        difficulty: 'medium',
        weight: 0.15
      },
      {
        id: '2',
        subject: 'Science',
        assignment: 'Chemistry Lab Report',
        score: 92,
        maxScore: 100,
        percentage: 92,
        date: '2025-09-24',
        type: 'project',
        difficulty: 'hard',
        weight: 0.25
      },
      {
        id: '3',
        subject: 'English',
        assignment: 'Essay: Climate Change',
        score: 78,
        maxScore: 100,
        percentage: 78,
        date: '2025-09-23',
        type: 'project',
        difficulty: 'hard',
        weight: 0.30
      },
      {
        id: '4',
        subject: 'History',
        assignment: 'WWII Timeline Test',
        score: 95,
        maxScore: 100,
        percentage: 95,
        date: '2025-09-22',
        type: 'test',
        difficulty: 'medium',
        weight: 0.20
      },
      {
        id: '5',
        subject: 'Mathematics',
        assignment: 'Homework Set 12',
        score: 85,
        maxScore: 100,
        percentage: 85,
        date: '2025-09-21',
        type: 'homework',
        difficulty: 'easy',
        weight: 0.10
      }
    ])

    setSubjectAnalytics([
      {
        subject: 'Mathematics',
        currentGrade: 86.5,
        trend: 'up',
        trendPercentage: 3.2,
        assignments: 8,
        averageScore: 84.2,
        strengths: ['Problem Solving', 'Algebraic Thinking'],
        improvements: ['Geometry Concepts', 'Word Problems'],
        nextAssignment: {
          name: 'Midterm Exam',
          date: '2025-10-05',
          type: 'test'
        }
      },
      {
        subject: 'Science',
        currentGrade: 91.2,
        trend: 'up',
        trendPercentage: 5.8,
        assignments: 6,
        averageScore: 89.5,
        strengths: ['Lab Work', 'Scientific Method'],
        improvements: ['Theoretical Concepts', 'Data Analysis'],
        nextAssignment: {
          name: 'Physics Quiz',
          date: '2025-09-30',
          type: 'quiz'
        }
      },
      {
        subject: 'English',
        currentGrade: 82.1,
        trend: 'down',
        trendPercentage: -2.1,
        assignments: 7,
        averageScore: 81.8,
        strengths: ['Creative Writing', 'Reading Comprehension'],
        improvements: ['Grammar', 'Essay Structure'],
        nextAssignment: {
          name: 'Poetry Analysis',
          date: '2025-10-02',
          type: 'project'
        }
      },
      {
        subject: 'History',
        currentGrade: 93.4,
        trend: 'stable',
        trendPercentage: 0.5,
        assignments: 5,
        averageScore: 92.8,
        strengths: ['Historical Analysis', 'Research Skills'],
        improvements: ['Timeline Memorization', 'Map Skills']
      }
    ])
  }, [])

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400'
    if (percentage >= 80) return 'text-blue-400'
    if (percentage >= 70) return 'text-yellow-400'
    if (percentage >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const getGradeBadgeColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500/20 text-green-300 border-green-400/30'
    if (percentage >= 80) return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
    if (percentage >= 70) return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
    if (percentage >= 60) return 'bg-orange-500/20 text-orange-300 border-orange-400/30'
    return 'bg-red-500/20 text-red-300 border-red-400/30'
  }

  const getTrendIcon = (trend: string, percentage: number) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-400" />
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-400" />
    return <Activity className="h-4 w-4 text-gray-400" />
  }

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'test': return <BookOpen className="h-4 w-4 text-red-400" />
      case 'quiz': return <Zap className="h-4 w-4 text-yellow-400" />
      case 'homework': return <Clock className="h-4 w-4 text-blue-400" />
      case 'project': return <Star className="h-4 w-4 text-purple-400" />
      case 'participation': return <Award className="h-4 w-4 text-green-400" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const calculateOverallGPA = () => {
    const totalPoints = subjectAnalytics.reduce((sum, subject) => sum + subject.currentGrade, 0)
    return (totalPoints / subjectAnalytics.length).toFixed(2)
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-400/20 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <p className="text-white/90 font-bold text-lg">{calculateOverallGPA()}</p>
              <p className="text-white/60 text-xs">Overall GPA</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-300" />
            </div>
            <div>
              <p className="text-white/90 font-bold text-lg">{subjectAnalytics.filter(s => s.trend === 'up').length}</p>
              <p className="text-white/60 text-xs">Improving Subjects</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Award className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <p className="text-white/90 font-bold text-lg">{grades.length}</p>
              <p className="text-white/60 text-xs">Total Assignments</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Target className="h-5 w-5 text-yellow-300" />
            </div>
            <div>
              <p className="text-white/90 font-bold text-lg">{subjectAnalytics.filter(s => s.currentGrade >= 90).length}</p>
              <p className="text-white/60 text-xs">A Grades</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subject Performance */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white/90 text-lg font-bold flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-green-400" />
            <span>Subject Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjectAnalytics.map((subject) => (
            <motion.div
              key={subject.subject}
              className="p-4 rounded-xl bg-white/5 border border-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-all"
              whileHover={{ scale: 1.01, x: 4 }}
              onClick={() => setSelectedSubject(subject.subject)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <BookOpen className="h-4 w-4 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-white/90 font-medium text-sm">{subject.subject}</p>
                    <p className="text-white/60 text-xs">{subject.assignments} assignments</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(subject.trend, subject.trendPercentage)}
                    <span className={`text-xs font-medium ${
                      subject.trend === 'up' ? 'text-green-400' : 
                      subject.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {subject.trend === 'stable' ? '±' : ''}{Math.abs(subject.trendPercentage)}%
                    </span>
                  </div>
                  <Badge className={`text-sm font-bold ${getGradeBadgeColor(subject.currentGrade)}`}>
                    {subject.currentGrade.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                <motion.div
                  className={`h-2 rounded-full ${
                    subject.currentGrade >= 90 ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                    subject.currentGrade >= 80 ? 'bg-gradient-to-r from-blue-400 to-indigo-400' :
                    subject.currentGrade >= 70 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                    'bg-gradient-to-r from-red-400 to-pink-400'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${subject.currentGrade}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span className="text-white/60">Strengths: {subject.strengths.slice(0, 2).join(', ')}</span>
                  </div>
                </div>
                {subject.nextAssignment && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-blue-400" />
                    <span className="text-white/60">Next: {subject.nextAssignment.name}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Grades */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white/90 text-lg font-bold flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span>Recent Assignments</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {grades.slice(0, 5).map((grade) => (
            <motion.div
              key={grade.id}
              className="p-3 rounded-xl bg-white/5 border border-white/20 backdrop-blur-sm"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-500/20 rounded-lg">
                    {getAssignmentTypeIcon(grade.type)}
                  </div>
                  <div>
                    <p className="text-white/90 font-medium text-sm">{grade.assignment}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-white/60 text-xs">{grade.subject}</p>
                      <Badge className="bg-gray-500/20 text-gray-300 text-xs px-2 py-0 capitalize">
                        {grade.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${getGradeColor(grade.percentage)}`}>
                    {grade.score}/{grade.maxScore}
                  </p>
                  <p className="text-white/60 text-xs">{new Date(grade.date).toLocaleDateString()}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(147,51,234,0.15)_1px,transparent_0)] bg-[length:32px_32px]" />
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="ghost"
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-400/30">
                  <TrendingUp className="h-6 w-6 text-purple-300" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Grade Analytics</h1>
                  <p className="text-white/60 text-sm">Track your academic progress and performance</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            className="flex space-x-2 bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'subjects', label: 'Subjects', icon: BookOpen },
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'predictions', label: 'Predictions', icon: Brain }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all ${
                    currentView === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              )
            })}
          </motion.div>

          {/* Content */}
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'overview' && renderOverview()}
            {currentView === 'subjects' && (
              <div className="text-center py-12">
                <p className="text-white/60">Detailed Subject Analysis - Coming Soon</p>
              </div>
            )}
            {currentView === 'trends' && (
              <div className="text-center py-12">
                <p className="text-white/60">Performance Trends - Coming Soon</p>
              </div>
            )}
            {currentView === 'predictions' && (
              <div className="text-center py-12">
                <p className="text-white/60">AI Grade Predictions - Coming Soon</p>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
