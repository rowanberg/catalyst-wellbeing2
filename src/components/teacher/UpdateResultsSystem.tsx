'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Plus, 
  Save, 
  Upload, 
  Download, 
  Camera,
  Grid3X3,
  FileText,
  Mic,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  Wifi,
  WifiOff,
  Send,
  ArrowRight,
  Calculator,
  Zap,
  Star,
  Award,
  BookOpen,
  PenTool,
  Scan,
  MessageSquare,
  FileSpreadsheet
} from 'lucide-react'
import { toast } from 'sonner'

// Import the specialized components
import OMRScanningInterface from './OMRScanningInterface'
import RubricGradingInterface from './RubricGradingInterface'
import GradeExportSystem from './GradeExportSystem'
import BulkGradeOperations from './BulkGradeOperations'

interface Student {
  id: string
  first_name: string
  last_name: string
  full_name: string
  student_id: string
  grade_level: string
  class_name: string
}

interface Assessment {
  id: string
  title: string
  type: 'quiz' | 'test' | 'assignment' | 'project'
  max_score: number
  created_at: string
  class_id: string
  rubric?: RubricCriteria[]
}

interface RubricCriteria {
  id: string
  name: string
  max_points: number
  description: string
}

interface Grade {
  id: string
  student_id: string
  assessment_id: string
  score: number
  percentage: number
  letter_grade: string
  feedback?: string
  rubric_scores?: { [criteriaId: string]: number }
  created_at: string
  updated_at: string
}

interface GradeAnalytics {
  class_average: number
  highest_score: number
  lowest_score: number
  pass_rate: number
  item_analysis: { [questionId: string]: { correct_rate: number, difficulty: string } }
  grade_distribution: { [grade: string]: number }
}

export default function UpdateResultsSystem() {
  const [activeMode, setActiveMode] = useState<'grid' | 'omr' | 'rubric' | 'digital' | 'bulk' | 'export'>('grid')
  const [students, setStudents] = useState<Student[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [grades, setGrades] = useState<{ [studentId: string]: Grade }>({})
  const [analytics, setAnalytics] = useState<GradeAnalytics | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState<Grade[]>([])
  const [loading, setLoading] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    type: 'quiz' as 'quiz' | 'test' | 'assignment' | 'project',
    max_score: 100
  })

  // Quick feedback templates
  const feedbackTemplates = [
    "Excellent work! Keep it up!",
    "Great improvement from last time",
    "Good effort, but needs more practice",
    "Please see me for extra help",
    "Outstanding understanding of the concept",
    "Check your work for calculation errors",
    "Well organized and clearly presented",
    "Needs more detail in explanations"
  ]

  // Grade calculation helper
  const calculateLetterGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  // Fetch assessments on mount (students are loaded per-assessment)
  useEffect(() => {
    // Don't fetch students on mount - they're loaded when an assessment is selected
    fetchAssessments()
    
    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
    }
  }

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/teacher/assessments')
      if (response.ok) {
        const data = await response.json()
        setAssessments(data.assessments || [])
      }
    } catch (error) {
      console.error('Error fetching assessments:', error)
      toast.error('Failed to load assessments')
    }
  }

  const saveGrade = useCallback(async (studentId: string, score: number, feedback?: string) => {
    if (!selectedAssessment) return

    const percentage = (score / selectedAssessment.max_score) * 100
    const letterGrade = calculateLetterGrade(percentage)
    
    const grade: Grade = {
      id: `temp_${Date.now()}_${studentId}`,
      student_id: studentId,
      assessment_id: selectedAssessment.id,
      score,
      percentage,
      letter_grade: letterGrade,
      feedback,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Update local state immediately
    setGrades(prev => ({ ...prev, [studentId]: grade }))

    if (isOnline) {
      try {
        const response = await fetch('/api/teacher/assessment-grades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(grade)
        })
        
        if (response.ok) {
          const savedGrade = await response.json()
          setGrades(prev => ({ ...prev, [studentId]: savedGrade }))
          toast.success('Grade saved successfully')
        } else {
          throw new Error('Failed to save grade')
        }
      } catch (error) {
        // Store for offline sync
        setPendingSync(prev => [...prev, grade])
        toast.warning('Grade saved offline - will sync when online')
      }
    } else {
      // Store for offline sync
      setPendingSync(prev => [...prev, grade])
      toast.warning('Grade saved offline - will sync when online')
    }
  }, [selectedAssessment, isOnline])

  const applyToAll = (score: number) => {
    if (!selectedAssessment) return
    
    students.forEach(student => {
      saveGrade(student.id, score)
    })
    toast.success(`Applied score ${score} to all students`)
  }

  const generateAnalytics = useCallback(async () => {
    if (!selectedAssessment) return

    setLoading(true)
    try {
      const response = await fetch(`/api/teacher/analytics/assessment/${selectedAssessment.id}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
        setShowAnalytics(true)
      }
    } catch (error) {
      console.error('Error generating analytics:', error)
      toast.error('Failed to generate analytics')
    } finally {
      setLoading(false)
    }
  }, [selectedAssessment])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Header with Status Indicators */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8">
        <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-wrap">
          {/* Back Button - shown when assessment is selected */}
          {selectedAssessment && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAssessment(null)
                setGrades({})
                setActiveMode('grid')
              }}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
            >
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 rotate-180" />
              <span className="hidden sm:inline">Back to Assessments</span>
              <span className="sm:hidden">Back</span>
            </Button>
          )}
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl lg:rounded-2xl text-white shadow-lg">
                <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              </div>
              <span className="truncate">{selectedAssessment ? selectedAssessment.title : 'Grade Entry Hub'}</span>
            </h1>
            <p className="text-xs sm:text-base lg:text-lg text-slate-600 mt-2 lg:mt-3 truncate font-medium">
              {selectedAssessment 
                ? `${selectedAssessment.type.toUpperCase()} • Maximum Score: ${selectedAssessment.max_score} points` 
                : 'Professional grade management with advanced analytics'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Online Status */}
          <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
            isOnline 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {isOnline ? <Wifi className="h-3 w-3 sm:h-4 sm:w-4" /> : <WifiOff className="h-3 w-3 sm:h-4 sm:w-4" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          
          {/* Pending Sync Indicator */}
          {pendingSync.length > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs px-2 py-0.5">
              <span className="hidden sm:inline">{pendingSync.length} pending sync</span>
              <span className="sm:hidden">{pendingSync.length}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Assessment Selection - only show when no assessment is selected */}
      {!selectedAssessment && (
      <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
        <CardHeader className="p-6 lg:p-8 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
          <CardTitle className="flex items-center gap-3 text-xl lg:text-2xl font-bold text-slate-800">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
              <BookOpen className="h-5 w-5 lg:h-6 lg:w-6" />
            </div>
            Assessment Portfolio
          </CardTitle>
          <p className="text-slate-600 mt-2 lg:text-lg">Choose an assessment to begin grading</p>
        </CardHeader>
        <CardContent className="p-6 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {assessments.map(assessment => (
              <motion.button
                key={assessment.id}
                onClick={() => setSelectedAssessment(assessment)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group text-left p-4 lg:p-6 rounded-2xl bg-gradient-to-br from-white to-slate-50 hover:from-emerald-50 hover:to-teal-50 border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4 gap-3">
                  <h3 className="font-bold text-base lg:text-lg text-slate-800 group-hover:text-emerald-700 flex-1 line-clamp-2 transition-colors">{assessment.title}</h3>
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 text-xs font-medium px-2 py-1 rounded-lg">
                    {assessment.type.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <p className="text-sm lg:text-base text-slate-600 font-medium">Maximum Score: {assessment.max_score} points</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm text-slate-500">
                      Created {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(assessment.created_at))}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
            
            {/* Create New Assessment Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="group p-4 lg:p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-gradient-to-br from-slate-50 to-gray-100 hover:from-emerald-50 hover:to-teal-50 transition-all duration-300 flex flex-col items-center justify-center text-slate-600 hover:text-emerald-600 min-h-[140px] lg:min-h-[160px] transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white mb-3 group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
              <span className="font-bold text-base lg:text-lg text-slate-800 group-hover:text-emerald-700 transition-colors">Create New Assessment</span>
              <span className="text-sm text-slate-500 mt-1">Build your next evaluation</span>
            </motion.button>
          </div>
        </CardContent>
      </Card>
      )}

      {selectedAssessment && (
        <>
          {/* Assessment Overview Card */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
            <CardHeader className="p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-200/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent mb-2">
                    Grading Interface
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base lg:text-lg text-slate-600 font-medium">
                    Efficient grade entry with real-time analytics and feedback tools
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 px-3 py-1.5 text-sm font-medium">
                    {selectedAssessment.type.toUpperCase()}
                  </Badge>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm text-slate-500">Max Score</p>
                    <p className="text-lg sm:text-xl font-bold text-emerald-600">{selectedAssessment.max_score}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as any)}>
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3">Choose Input Method</h3>
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-2 bg-slate-100/50 p-1 rounded-2xl">
                    <TabsTrigger value="grid" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
                        <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="text-xs sm:text-sm font-medium block">Grid</span>
                        <span className="text-xs text-slate-500 hidden lg:block">Spreadsheet</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="omr" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg text-white">
                        <Scan className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="text-xs sm:text-sm font-medium block">Scan</span>
                        <span className="text-xs text-slate-500 hidden lg:block">OMR</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="rubric" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg text-white">
                        <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="text-xs sm:text-sm font-medium block">Rubric</span>
                        <span className="text-xs text-slate-500 hidden lg:block">Criteria</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="digital" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg text-white">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="text-xs sm:text-sm font-medium block">Digital</span>
                        <span className="text-xs text-slate-500 hidden lg:block">Review</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="bulk" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg text-white">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="text-xs sm:text-sm font-medium block">Bulk</span>
                        <span className="text-xs text-slate-500 hidden lg:block">Entry</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="export" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg text-white">
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="text-xs sm:text-sm font-medium block">Export</span>
                        <span className="text-xs text-slate-500 hidden lg:block">Data</span>
                      </div>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Grading Content Area */}
                <div className="mt-6 lg:mt-8">
                  <TabsContent value="grid" className="space-y-4 sm:space-y-6">
                    <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl shadow-lg">
                      <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl border-b border-slate-200/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                              <Grid3X3 className="h-5 w-5 text-blue-600" />
                              Spreadsheet Grid Entry
                            </CardTitle>
                            <CardDescription className="text-sm sm:text-base text-slate-600 mt-1">
                              Fast grade entry with Excel-like interface
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={generateAnalytics}
                              disabled={loading}
                              size="sm"
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analytics
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        {students.length === 0 ? (
                          <div className="text-center py-8 sm:py-12">
                            <div className="p-4 bg-slate-100 rounded-2xl inline-block mb-4">
                              <Users className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">No Students Found</h3>
                            <p className="text-sm sm:text-base text-slate-600 mb-4">
                              Students will appear here when you select an assessment with enrolled students.
                            </p>
                            <Button 
                              onClick={() => window.location.reload()} 
                              variant="outline"
                              className="border-slate-300 hover:bg-slate-50"
                            >
                              Refresh Page
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                              <strong>{students.length}</strong> students enrolled • 
                              <strong className="ml-2">{selectedAssessment.max_score}</strong> max points
                            </div>
                            <div className="grid gap-3 sm:gap-4">
                              {students.map((student, index) => (
                                <motion.div
                                  key={student.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="p-3 sm:p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-slate-800 truncate">
                                        {student.full_name}
                                      </h4>
                                      <p className="text-sm text-slate-500">
                                        Student ID: {student.student_id || 'N/A'}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          placeholder="Score"
                                          min="0"
                                          max={selectedAssessment.max_score}
                                          value={grades[student.id]?.score || ''}
                                          onChange={(e) => saveGrade(student.id, parseFloat(e.target.value) || 0)}
                                          className="w-20 sm:w-24 text-center"
                                        />
                                        <span className="text-sm text-slate-500">
                                          / {selectedAssessment.max_score}
                                        </span>
                                      </div>
                                      <div className="text-sm font-medium">
                                        {grades[student.id]?.score ? 
                                          `${Math.round((grades[student.id].score / selectedAssessment.max_score) * 100)}%` 
                                          : '—'
                                        }
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="omr" className="space-y-4 sm:space-y-6">
                    <Card className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-2xl shadow-lg">
                      <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl border-b border-purple-200/50">
                        <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                          <Scan className="h-5 w-5 text-purple-600" />
                          OMR Sheet Scanner
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base text-slate-600 mt-1">
                          Upload and process OMR answer sheets automatically
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <div className="text-center py-8 sm:py-12">
                          <div className="p-4 bg-purple-100 rounded-2xl inline-block mb-4">
                            <Scan className="h-8 w-8 sm:h-12 sm:w-12 text-purple-600" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">OMR Scanner</h3>
                          <p className="text-sm sm:text-base text-slate-600 mb-4">
                            Upload OMR sheets for automatic grade processing
                          </p>
                          <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload OMR Sheets
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="rubric" className="space-y-4 sm:space-y-6">
                    <Card className="bg-gradient-to-br from-white to-orange-50 border border-orange-200 rounded-2xl shadow-lg">
                      <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-t-2xl border-b border-orange-200/50">
                        <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                          <Target className="h-5 w-5 text-orange-600" />
                          Rubric-Based Grading
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base text-slate-600 mt-1">
                          Grade using predefined criteria and standards
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <div className="text-center py-8 sm:py-12">
                          <div className="p-4 bg-orange-100 rounded-2xl inline-block mb-4">
                            <Target className="h-8 w-8 sm:h-12 sm:w-12 text-orange-600" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Rubric Grading</h3>
                          <p className="text-sm sm:text-base text-slate-600 mb-4">
                            Create and use rubrics for consistent evaluation
                          </p>
                          <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Rubric
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="digital" className="space-y-4 sm:space-y-6">
                    <Card className="bg-gradient-to-br from-white to-green-50 border border-green-200 rounded-2xl shadow-lg">
                      <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl border-b border-green-200/50">
                        <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-green-600" />
                          Digital Review Interface
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base text-slate-600 mt-1">
                          Review and grade digital submissions with annotations
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <div className="text-center py-8 sm:py-12">
                          <div className="p-4 bg-green-100 rounded-2xl inline-block mb-4">
                            <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-green-600" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Digital Review</h3>
                          <p className="text-sm sm:text-base text-slate-600 mb-4">
                            Grade digital submissions with rich feedback tools
                          </p>
                          <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0">
                            <Eye className="h-4 w-4 mr-2" />
                            View Submissions
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="bulk" className="space-y-4 sm:space-y-6">
                    <Card className="bg-gradient-to-br from-white to-teal-50 border border-teal-200 rounded-2xl shadow-lg">
                      <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-t-2xl border-b border-teal-200/50">
                        <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                          <Users className="h-5 w-5 text-teal-600" />
                          Bulk Operations
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base text-slate-600 mt-1">
                          Apply grades and feedback to multiple students at once
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <div className="text-center py-8 sm:py-12">
                          <div className="p-4 bg-teal-100 rounded-2xl inline-block mb-4">
                            <Users className="h-8 w-8 sm:h-12 sm:w-12 text-teal-600" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Bulk Operations</h3>
                          <p className="text-sm sm:text-base text-slate-600 mb-4">
                            Efficiently manage grades for multiple students
                          </p>
                          <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white border-0">
                            <Zap className="h-4 w-4 mr-2" />
                            Bulk Actions
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="export" className="space-y-4 sm:space-y-6">
                    <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl shadow-lg">
                      <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-2xl border-b border-slate-200/50">
                        <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                          <Download className="h-5 w-5 text-slate-600" />
                          Export & Reports
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base text-slate-600 mt-1">
                          Export grades and generate comprehensive reports
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <div className="text-center py-8 sm:py-12">
                          <div className="p-4 bg-slate-100 rounded-2xl inline-block mb-4">
                            <Download className="h-8 w-8 sm:h-12 sm:w-12 text-slate-600" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">Export Data</h3>
                          <p className="text-sm sm:text-base text-slate-600 mb-4">
                            Download grades in various formats for record keeping
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                            <Button className="bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white border-0">
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              Export Excel
                            </Button>
                            <Button variant="outline" className="border-slate-300 hover:bg-slate-50">
                              <FileText className="h-4 w-4 mr-2" />
                              Export PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Assessment Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Create New Assessment</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Title
                  </label>
                  <Input
                    value={newAssessment.title}
                    onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                    placeholder="e.g., Math Quiz 1"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={newAssessment.type}
                    onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="quiz">Quiz</option>
                    <option value="test">Test</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Score
                  </label>
                  <Input
                    type="number"
                    value={newAssessment.max_score}
                    onChange={(e) => setNewAssessment({ ...newAssessment, max_score: parseInt(e.target.value) || 100 })}
                    placeholder="100"
                    className="w-full"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={async () => {
                      if (!newAssessment.title) {
                        alert('Please enter an assessment title')
                        return
                      }
                      
                      try {
                        setLoading(true)
                        const response = await fetch('/api/teacher/assessments', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newAssessment)
                        })
                        
                        if (response.ok) {
                          const data = await response.json()
                          setAssessments([...assessments, data.assessment])
                          setShowCreateModal(false)
                          setNewAssessment({ title: '', type: 'quiz', max_score: 100 })
                          alert('Assessment created successfully!')
                        } else {
                          const error = await response.json()
                          alert('Failed to create assessment: ' + (error.error || 'Unknown error'))
                        }
                      } catch (error) {
                        console.error('Error creating assessment:', error)
                        alert('Failed to create assessment. Please try again.')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Creating...' : 'Create'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewAssessment({ title: '', type: 'quiz', max_score: 100 })
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}
