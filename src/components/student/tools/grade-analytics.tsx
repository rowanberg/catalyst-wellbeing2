'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  Activity,
  Sparkles,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Info,
  Trophy,
  Lightbulb
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

export function GradeAnalytics({ onBack }: { onBack?: () => void }) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [subjectAnalytics, setSubjectAnalytics] = useState<SubjectAnalytics[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester' | 'year'>('month')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showPredictions, setShowPredictions] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

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

  // Optimized functions with useCallback
  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }, [])

  const getGradeColor = useCallback((percentage: number) => {
    if (percentage >= 90) return 'text-green-400'
    if (percentage >= 80) return 'text-blue-400'
    if (percentage >= 70) return 'text-yellow-400'
    if (percentage >= 60) return 'text-orange-400'
    return 'text-red-400'
  }, [])

  const getGradeLetter = useCallback((percentage: number) => {
    if (percentage >= 97) return 'A+'
    if (percentage >= 93) return 'A'
    if (percentage >= 90) return 'A-'
    if (percentage >= 87) return 'B+'
    if (percentage >= 83) return 'B'
    if (percentage >= 80) return 'B-'
    if (percentage >= 77) return 'C+'
    if (percentage >= 73) return 'C'
    if (percentage >= 70) return 'C-'
    if (percentage >= 67) return 'D+'
    if (percentage >= 65) return 'D'
    return 'F'
  }, [])

  // Memoized computed values
  const overallGPA = useMemo(() => {
    const totalPoints = subjectAnalytics.reduce((sum, subject) => sum + subject.currentGrade, 0)
    return subjectAnalytics.length > 0 ? (totalPoints / subjectAnalytics.length).toFixed(2) : '0.00'
  }, [subjectAnalytics])

  const recentGrades = useMemo(() => 
    grades.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [grades]
  )

  const improvingSubjects = useMemo(() => 
    subjectAnalytics.filter(subject => subject.trend === 'up').length,
    [subjectAnalytics]
  )

  const renderDashboard = () => (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column - Performance Overview */}
        <div className="lg:col-span-1 space-y-4">
          {/* GPA Card */}
          <motion.div
            className="p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/20 backdrop-blur-sm"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white/90 font-semibold flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span>Overall Performance</span>
              </h3>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                This {timeRange}
              </Badge>
            </div>
            <div className="text-center py-4">
              <div className="text-4xl lg:text-5xl font-bold text-white/90 mb-1">
                {overallGPA}
              </div>
              <p className="text-white/60 text-sm">Current GPA</p>
              <div className="flex items-center justify-center mt-3 space-x-1">
                {parseFloat(overallGPA) >= 3.5 ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={`text-sm ${parseFloat(overallGPA) >= 3.5 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(overallGPA) >= 3.5 ? '+0.3' : '-0.2'} from last {timeRange}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-2 bg-white/5 rounded-lg text-center">
                <p className="text-white/90 font-bold text-lg">{getGradeLetter(parseFloat(overallGPA) * 25)}</p>
                <p className="text-white/50 text-xs">Letter Grade</p>
              </div>
              <div className="p-2 bg-white/5 rounded-lg text-center">
                <p className="text-white/90 font-bold text-lg">{grades.length}</p>
                <p className="text-white/50 text-xs">Total Grades</p>
              </div>
            </div>
          </motion.div>

          {/* Subject Breakdown */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white/90 text-sm font-bold flex items-center justify-between">
                <span>Subject Performance</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCompareMode(!compareMode)}
                  className="text-xs text-white/60 hover:text-white"
                >
                  {compareMode ? 'Hide' : 'Compare'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {subjectAnalytics.slice(0, 5).map((subject, index) => (
                <motion.div
                  key={subject.subject}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedSubject(subject.subject)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/80 text-xs font-medium">{subject.subject}</span>
                    <div className="flex items-center space-x-1">
                      <span className={`text-sm font-bold ${getGradeColor(subject.currentGrade)}`}>
                        {subject.currentGrade}%
                      </span>
                      {subject.trend === 'up' ? (
                        <ChevronUp className="h-3 w-3 text-green-400" />
                      ) : subject.trend === 'down' ? (
                        <ChevronDown className="h-3 w-3 text-red-400" />
                      ) : null}
                    </div>
                  </div>
                  <Progress value={subject.currentGrade} className="h-1" />
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-400/20 rounded-2xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="h-4 w-4 text-purple-300" />
              <h3 className="text-white/90 font-semibold text-sm">AI Recommendations</h3>
            </div>
            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-white/80 text-xs mb-1">📈 Focus Area</p>
                <p className="text-white/60 text-xs">Improve Math by practicing 30min daily</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-white/80 text-xs mb-1">⚠️ At Risk</p>
                <p className="text-white/60 text-xs">English grade trending down - review essays</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <p className="text-white/80 text-xs mb-1">🎯 Goal</p>
                <p className="text-white/60 text-xs">Maintain 3.5+ GPA for honor roll</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Middle Column - Recent Grades & Timeline */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white/90 text-sm font-bold flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span>Recent Grades</span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="text-xs"
                >
                  {viewMode === 'grid' ? <BarChart3 className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentGrades.map((grade, index) => (
                <motion.div
                  key={grade.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={`text-xs px-2 py-0 ${
                          grade.type === 'test' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                          grade.type === 'quiz' ? 'bg-orange-500/20 text-orange-300 border-orange-400/30' :
                          grade.type === 'homework' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                          'bg-purple-500/20 text-purple-300 border-purple-400/30'
                        }`}>
                          {grade.type}
                        </Badge>
                        {grade.difficulty === 'hard' && (
                          <Zap className="h-3 w-3 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-white/90 font-medium text-sm truncate">{grade.assignment}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-white/60 text-xs">{grade.subject}</p>
                        <span className="text-white/40">•</span>
                        <p className="text-white/60 text-xs">{new Date(grade.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className={`font-bold text-lg ${getGradeColor(grade.percentage)}`}>
                        {grade.percentage}%
                      </p>
                      <p className="text-white/50 text-xs">{grade.score}/{grade.maxScore}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Analytics & Predictions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Grade Predictions */}
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-400/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white/90 font-semibold text-sm flex items-center space-x-2">
                <Brain className="h-4 w-4 text-green-400" />
                <span>Grade Predictions</span>
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPredictions(!showPredictions)}
                className="text-xs"
              >
                {showPredictions ? <Eye className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            {showPredictions && (
              <div className="space-y-2">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-xs">End of Semester GPA</span>
                    <span className="text-green-400 font-bold">3.8</span>
                  </div>
                  <Progress value={75} className="h-1" />
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-xs">Math Final Grade</span>
                    <span className="text-blue-400 font-bold">A-</span>
                  </div>
                  <Progress value={88} className="h-1" />
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/70 text-xs">Honor Roll Probability</span>
                    <span className="text-yellow-400 font-bold">92%</span>
                  </div>
                  <Progress value={92} className="h-1" />
                </div>
              </div>
            )}
          </Card>

          {/* Time Range Filter */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
            <h3 className="text-white/90 font-semibold text-sm mb-3">Time Range</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['week', 'month', 'semester', 'year'] as const).map((range) => (
                <Button
                  key={range}
                  size="sm"
                  variant={timeRange === range ? "default" : "outline"}
                  onClick={() => setTimeRange(range)}
                  className={`text-xs capitalize ${
                    timeRange === range 
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' 
                      : 'bg-white/5 text-white/60 border-white/20 hover:bg-white/10'
                  }`}
                >
                  {range}
                </Button>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
            <h3 className="text-white/90 font-semibold text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button className="w-full justify-start bg-white/5 hover:bg-white/10 border border-white/20 text-white/70 text-xs">
                <Download className="h-3 w-3 mr-2" />
                Export Report
              </Button>
              <Button className="w-full justify-start bg-white/5 hover:bg-white/10 border border-white/20 text-white/70 text-xs">
                <Calendar className="h-3 w-3 mr-2" />
                Schedule Review
              </Button>
              <Button className="w-full justify-start bg-white/5 hover:bg-white/10 border border-white/20 text-white/70 text-xs">
                <Settings className="h-3 w-3 mr-2" />
                Grade Settings
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full bg-gradient-to-br from-slate-900/50 via-purple-900/50 to-slate-900/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(147,51,234,0.1)_1px,transparent_0)] bg-[length:32px_32px]" />
      
      <div className="relative z-10 p-3 sm:p-4 lg:p-6 h-full overflow-y-auto">
        {/* Mobile Header */}
        <motion.div 
          className="flex items-center justify-between mb-4 lg:hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-400/30">
              <BarChart3 className="h-4 w-4 text-purple-300" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Analytics</h1>
              <p className="text-white/60 text-xs">GPA: {overallGPA}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              onClick={refreshData}
              size="sm"
              className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs px-2 py-1"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </motion.div>

        {/* Mobile/Tablet View */}
        <div className="lg:hidden">
          {/* Quick Stats */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="text-white text-xs font-medium">Overall</p>
                    <p className="text-white/60 text-xs">{overallGPA} GPA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-white text-xs font-medium">Improving</p>
                    <p className="text-white/60 text-xs">{improvingSubjects} subjects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-purple-400" />
                  <div>
                    <p className="text-white text-xs font-medium">Subjects</p>
                    <p className="text-white/60 text-xs">{subjectAnalytics.length} active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-yellow-400" />
                  <div>
                    <p className="text-white text-xs font-medium">Recent</p>
                    <p className="text-white/60 text-xs">{recentGrades.length} grades</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subject Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center space-x-2">
                  <PieChart className="h-4 w-4 text-purple-400" />
                  <span>Subject Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjectAnalytics.map((subject, index) => (
                  <motion.div
                    key={subject.subject}
                    className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedSubject(selectedSubject === subject.subject ? null : subject.subject)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm truncate">{subject.subject}</h4>
                        <p className="text-white/60 text-xs">{subject.assignments} assignments</p>
                      </div>
                      <div className="flex items-center space-x-3 ml-3">
                        <div className="text-right">
                          <p className={`font-bold text-sm ${getGradeColor(subject.currentGrade)}`}>
                            {getGradeLetter(subject.currentGrade)}
                          </p>
                          <p className="text-white/60 text-xs">{subject.currentGrade.toFixed(1)}%</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {subject.trend === 'up' ? (
                            <TrendingUp className="h-3 w-3 text-green-400" />
                          ) : subject.trend === 'down' ? (
                            <TrendingDown className="h-3 w-3 text-red-400" />
                          ) : (
                            <Activity className="h-3 w-3 text-gray-400" />
                          )}
                          <span className={`text-xs ${
                            subject.trend === 'up' ? 'text-green-400' : 
                            subject.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {subject.trendPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {selectedSubject === subject.subject && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-white/10"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-green-300 font-medium mb-1">Strengths:</p>
                              <ul className="text-white/60 space-y-1">
                                {subject.strengths.map((strength, i) => (
                                  <li key={i}>• {strength}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-orange-300 font-medium mb-1">Improvements:</p>
                              <ul className="text-white/60 space-y-1">
                                {subject.improvements.map((improvement, i) => (
                                  <li key={i}>• {improvement}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          {subject.nextAssignment && (
                            <div className="mt-3 p-2 bg-blue-500/10 rounded-lg border border-blue-400/20">
                              <p className="text-blue-300 text-xs font-medium">Next Assignment:</p>
                              <p className="text-white/80 text-xs">{subject.nextAssignment.name}</p>
                              <p className="text-white/60 text-xs">Due: {new Date(subject.nextAssignment.date).toLocaleDateString()}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Grades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span>Recent Grades</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentGrades.map((grade, index) => (
                  <motion.div
                    key={grade.id}
                    className="p-3 bg-white/5 rounded-xl border border-white/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={`text-xs ${
                            grade.type === 'test' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                            grade.type === 'quiz' ? 'bg-orange-500/20 text-orange-300 border-orange-400/30' :
                            grade.type === 'project' ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' :
                            grade.type === 'homework' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                            'bg-green-500/20 text-green-300 border-green-400/30'
                          }`}>
                            {grade.type}
                          </Badge>
                          <Badge className={`text-xs ${
                            grade.difficulty === 'hard' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                            grade.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                            'bg-green-500/20 text-green-300 border-green-400/30'
                          }`}>
                            {grade.difficulty}
                          </Badge>
                        </div>
                        <h4 className="text-white font-medium text-sm truncate">{grade.assignment}</h4>
                        <p className="text-white/60 text-xs">{grade.subject}</p>
                      </div>
                      
                      <div className="text-right ml-3">
                        <p className={`font-bold text-sm ${getGradeColor(grade.percentage)}`}>
                          {getGradeLetter(grade.percentage)}
                        </p>
                        <p className="text-white/60 text-xs">{grade.score}/{grade.maxScore}</p>
                        <p className="text-white/50 text-xs">{new Date(grade.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Desktop View - Show full dashboard */}
        <div className="hidden lg:block">
          {renderDashboard()}
        </div>
      </div>
    </div>
  )
}
