'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  Award,
  AlertTriangle,
  Download,
  Filter,
  Calendar,
  Eye,
  Brain,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ExamAnalyticsProps {
  examId: string
  examTitle: string
}

interface AnalyticsData {
  overview: {
    total_students: number
    completed_attempts: number
    average_score: number
    pass_rate: number
    average_time: number
  }
  performance_distribution: Array<{
    grade: string
    count: number
    percentage: number
  }>
  question_analytics: Array<{
    question_id: string
    question_text: string
    correct_rate: number
    average_time: number
    difficulty_index: number
  }>
  time_analytics: {
    fastest_completion: number
    slowest_completion: number
    average_per_question: number
  }
  student_performance: Array<{
    student_id: string
    student_name: string
    score: number
    percentage: number
    time_taken: number
    attempt_number: number
    flagged_activities: number
  }>
}

export function ExamAnalytics({ examId, examTitle }: ExamAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState('overview')
  const [timeFilter, setTimeFilter] = useState('all')

  useEffect(() => {
    fetchAnalytics()
  }, [examId, timeFilter])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/examination/analytics/${examId}?timeFilter=${timeFilter}`)
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetch(`/api/examination/export/${examId}?format=${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${examTitle}_analytics.${format}`
      a.click()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400'
    if (percentage >= 75) return 'text-blue-400'
    if (percentage >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getDifficultyColor = (index: number) => {
    if (index >= 0.8) return 'bg-red-500/20 text-red-300'
    if (index >= 0.6) return 'bg-yellow-500/20 text-yellow-300'
    return 'bg-green-500/20 text-green-300'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p>Failed to load analytics data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Exam Analytics</h1>
            <p className="text-slate-400">{examTitle}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => exportReport('pdf')}
              variant="outline"
              className="bg-slate-800/50 border-slate-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            
            <Button
              onClick={() => exportReport('csv')}
              variant="outline"
              className="bg-slate-800/50 border-slate-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'questions', label: 'Questions', icon: Brain },
            { id: 'students', label: 'Students', icon: Users }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={selectedView === id ? 'default' : 'outline'}
              onClick={() => setSelectedView(id)}
              className={selectedView === id 
                ? 'bg-blue-500 text-white' 
                : 'bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50'
              }
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>

        {/* Overview */}
        {selectedView === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Students</p>
                      <p className="text-2xl font-bold text-white">{analytics.overview.total_students}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Completion Rate</p>
                      <p className="text-2xl font-bold text-white">
                        {Math.round((analytics.overview.completed_attempts / analytics.overview.total_students) * 100)}%
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Average Score</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(analytics.overview.average_score)}`}>
                        {analytics.overview.average_score.toFixed(1)}%
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Pass Rate</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(analytics.overview.pass_rate)}`}>
                        {analytics.overview.pass_rate.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Distribution */}
            <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.performance_distribution.map((grade) => (
                    <div key={grade.grade} className="flex items-center gap-4">
                      <div className="w-12 text-center">
                        <Badge variant="outline" className="bg-slate-700/50 text-white">
                          {grade.grade}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <Progress value={grade.percentage} className="h-3" />
                      </div>
                      <div className="w-20 text-right text-slate-300">
                        {grade.count} ({grade.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Questions Analysis */}
        {selectedView === 'questions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Question Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.question_analytics.map((question, index) => (
                    <div key={question.question_id} className="border border-slate-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">Question {index + 1}</h4>
                          <p className="text-slate-300 text-sm line-clamp-2">{question.question_text}</p>
                        </div>
                        <Badge className={getDifficultyColor(question.difficulty_index)}>
                          {question.difficulty_index >= 0.8 ? 'Hard' : 
                           question.difficulty_index >= 0.6 ? 'Medium' : 'Easy'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Correct Rate:</span>
                          <span className={`ml-2 font-medium ${getPerformanceColor(question.correct_rate * 100)}`}>
                            {(question.correct_rate * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Avg Time:</span>
                          <span className="ml-2 font-medium text-white">
                            {formatTime(question.average_time)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Difficulty:</span>
                          <span className="ml-2 font-medium text-white">
                            {(question.difficulty_index * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Progress value={question.correct_rate * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Student Performance */}
        {selectedView === 'students' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Individual Student Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left text-slate-300 py-3 px-4">Student</th>
                        <th className="text-left text-slate-300 py-3 px-4">Score</th>
                        <th className="text-left text-slate-300 py-3 px-4">Percentage</th>
                        <th className="text-left text-slate-300 py-3 px-4">Time Taken</th>
                        <th className="text-left text-slate-300 py-3 px-4">Attempt</th>
                        <th className="text-left text-slate-300 py-3 px-4">Flags</th>
                        <th className="text-left text-slate-300 py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.student_performance.map((student) => (
                        <tr key={student.student_id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                          <td className="py-3 px-4 text-white">{student.student_name}</td>
                          <td className="py-3 px-4 text-white">{student.score}</td>
                          <td className={`py-3 px-4 font-medium ${getPerformanceColor(student.percentage)}`}>
                            {student.percentage.toFixed(1)}%
                          </td>
                          <td className="py-3 px-4 text-slate-300">{formatTime(student.time_taken)}</td>
                          <td className="py-3 px-4 text-slate-300">{student.attempt_number}</td>
                          <td className="py-3 px-4">
                            {student.flagged_activities > 0 ? (
                              <Badge variant="destructive" className="bg-red-500/20 text-red-300">
                                {student.flagged_activities} flags
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
                                Clean
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Performance Insights */}
        {selectedView === 'performance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Time Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fastest Completion:</span>
                    <span className="text-green-400 font-medium">
                      {formatTime(analytics.time_analytics.fastest_completion)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Slowest Completion:</span>
                    <span className="text-red-400 font-medium">
                      {formatTime(analytics.time_analytics.slowest_completion)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Average per Question:</span>
                    <span className="text-blue-400 font-medium">
                      {formatTime(analytics.time_analytics.average_per_question)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2" />
                    <div>
                      <p className="text-white text-sm">
                        {analytics.overview.pass_rate > 80 ? 'Excellent' : 
                         analytics.overview.pass_rate > 60 ? 'Good' : 'Needs Improvement'} overall performance
                      </p>
                      <p className="text-slate-400 text-xs">Based on {analytics.overview.pass_rate.toFixed(1)}% pass rate</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2" />
                    <div>
                      <p className="text-white text-sm">
                        Average completion time: {formatTime(analytics.overview.average_time)}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {analytics.overview.average_time < 1800 ? 'Students finished quickly' : 'Students used most of the time'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
