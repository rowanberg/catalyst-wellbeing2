'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppSelector } from '@/lib/redux/hooks'
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
  FileSpreadsheet,
  Menu,
  X,
  ChevronRight,
  Settings,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

// Import the specialized components
import OMRScanningInterface from './OMRScanningInterface'
import RubricGradingInterface from './RubricGradingInterface'
import GradeExportSystem from './GradeExportSystem'
import BulkGradeOperations from './BulkGradeOperations'
import StudentGradeList from './StudentGradeList'

interface Student {
  id: string
  first_name: string
  last_name: string
  full_name?: string
  student_number?: string
  student_id?: string
  grade_level?: string
  class_name?: string
}

interface Assessment {
  id: string
  title: string
  type: 'quiz' | 'test' | 'assignment' | 'project' | 'exam'
  max_score: number
  pass_mark: number
  created_at: string
  class_id: string
  due_date?: string
  assessment_date?: string
  rubric?: RubricCriteria[]
}

interface TeacherClass {
  id: string
  class_name: string
  class_code: string
  subject: string
  grade_level: string
  total_students: number
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
  // Get teacher profile from Redux
  const { user, profile } = useAppSelector((state) => state.auth)
  
  const [activeMode, setActiveMode] = useState<'grid' | 'omr' | 'rubric' | 'digital' | 'bulk' | 'export'>('grid')
  const [students, setStudents] = useState<Student[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [grades, setGrades] = useState<{ [studentId: string]: Grade }>({})
  const [analytics, setAnalytics] = useState<GradeAnalytics | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState<Grade[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingAssessments, setLoadingAssessments] = useState(true)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssessmentDetails, setShowAssessmentDetails] = useState(false)
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    type: 'quiz' as 'quiz' | 'test' | 'assignment' | 'project' | 'exam',
    max_score: 100,
    pass_mark: 50,
    class_id: '',
    due_date: '',
    assessment_date: ''
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

  const fetchStudents = useCallback(async (classId: string) => {
    if (!user || !profile) {
      console.error('No user or profile found')
      return
    }

    try {
      setLoadingStudents(true)
      console.log('🔄 Fetching students for class:', classId)
      const response = await fetch(`/api/teacher/students?school_id=${profile.school_id}&class_id=${classId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Students loaded:', data.students?.length || 0, 'students')
        setStudents(data.students || [])
      } else {
        console.error('❌ Failed to fetch students:', response.status)
        setStudents([])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }, [user, profile])

  const fetchAssessments = async () => {
    try {
      setLoadingAssessments(true)
      const response = await fetch('/api/teacher/assessments')
      if (response.ok) {
        const data = await response.json()
        setAssessments(data.assessments || [])
      } else {
        toast.error('Failed to load assessments')
      }
    } catch (error) {
      console.error('Error fetching assessments:', error)
      toast.error('Failed to load assessments')
    } finally {
      setLoadingAssessments(false)
    }
  }

  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/teacher/assessments?id=${assessmentToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAssessments(assessments.filter(a => a.id !== assessmentToDelete.id))
        if (selectedAssessment?.id === assessmentToDelete.id) {
          setSelectedAssessment(null)
        }
        toast.success('Assessment deleted successfully')
        setShowDeleteDialog(false)
        setAssessmentToDelete(null)
      } else {
        const error = await response.json()
        toast.error('Failed to delete assessment: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting assessment:', error)
      toast.error('Failed to delete assessment. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  // Fetch teacher's assigned classes
  const fetchTeacherClasses = useCallback(async () => {
    try {
      setLoadingClasses(true)
      
      // Get teacher ID from Redux state - use user.id directly
      if (!user) {
        console.warn('⚠️ User not yet loaded in Redux state - skipping class fetch')
        setLoadingClasses(false)
        return
      }
      
      const teacherId = user.id
      
      console.log('🔄 Fetching teacher classes for:', teacherId)
      
      const response = await fetch(`/api/teacher/assigned-classes?teacher_id=${teacherId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Classes loaded:', data.classes?.length || 0, 'classes')
        console.log('📋 Class data:', data.classes)
        setTeacherClasses(data.classes || [])
        
        // Cache classes in localStorage for offline access
        localStorage.setItem('teacher_classes_cache', JSON.stringify(data.classes || []))
        
        if (!data.classes || data.classes.length === 0) {
          toast.error('No classes found. Please ensure you have assigned classes.')
        } else {
          console.log('✨ Successfully loaded', data.classes.length, 'classes')
        }
      } else {
        console.error('❌ API Error:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
        
        // Try to use cached data
        const cached = localStorage.getItem('teacher_classes_cache')
        if (cached) {
          setTeacherClasses(JSON.parse(cached))
          toast.info('Using cached class data (API error)')
        } else {
          toast.error(`Failed to load classes: ${errorData.message || response.statusText}`)
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching teacher classes:', error)
      
      // Try to use cached data
      const cached = localStorage.getItem('teacher_classes_cache')
      if (cached) {
        setTeacherClasses(JSON.parse(cached))
        toast.info('Using cached class data (network error)')
      } else {
        toast.error(`Failed to load classes: ${error.message || 'Network error'}`)
      }
    } finally {
      setLoadingClasses(false)
    }
  }, [user])

  // Preload teacher classes when user logs in
  useEffect(() => {
    if (user) {
      fetchTeacherClasses()
    }
  }, [user, fetchTeacherClasses])

  // Fetch existing grades for selected assessment
  const fetchExistingGrades = useCallback(async (assessmentId: string) => {
    try {
      const response = await fetch(`/api/teacher/assessment-grades?assessment_id=${assessmentId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Existing grades loaded:', data.grades?.length || 0)
        
        // Convert grades array to object keyed by student_id
        const gradesMap: { [studentId: string]: Grade } = {}
        data.grades?.forEach((grade: any) => {
          gradesMap[grade.student_id] = grade
        })
        
        setGrades(gradesMap)
      }
    } catch (error) {
      console.error('Error fetching existing grades:', error)
    }
  }, [])

  // Fetch students and grades when an assessment is selected
  useEffect(() => {
    if (selectedAssessment && selectedAssessment.class_id) {
      console.log('📚 Assessment selected, fetching students for class:', selectedAssessment.class_id)
      fetchStudents(selectedAssessment.class_id)
      // Fetch existing grades for this assessment
      fetchExistingGrades(selectedAssessment.id)
    } else {
      // Clear students and grades when no assessment is selected
      setStudents([])
      setGrades({})
    }
  }, [selectedAssessment, fetchStudents, fetchExistingGrades])

  const handleGradeChange = useCallback((studentId: string, grade: Grade) => {
    setGrades(prev => ({ ...prev, [studentId]: grade }))
  }, [])

  const handleSaveGrades = useCallback(async () => {
    if (!selectedAssessment) return

    setLoading(true)
    let successCount = 0
    let errorCount = 0
    
    for (const [studentId, grade] of Object.entries(grades)) {
      if (isOnline) {
        try {
          const response = await fetch('/api/teacher/assessment-grades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(grade)
          })
          
          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
          // Store for offline sync
          setPendingSync(prev => [...prev, grade])
        }
      } else {
        // Store for offline sync
        setPendingSync(prev => [...prev, grade])
        toast.warning('Grades saved offline - will sync when online')
      }
    }
    
    setLoading(false)
    
    if (successCount > 0) {
      toast.success(`${successCount} grade(s) saved successfully!`)
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} grade(s) failed to save`)
    }
  }, [selectedAssessment, grades, isOnline])

  const applyToAll = (score: number) => {
    if (!selectedAssessment) return
    
    const percentage = (score / selectedAssessment.max_score) * 100
    const letterGrade = calculateLetterGrade(percentage)
    
    students.forEach(student => {
      const grade: Grade = {
        id: `temp_${Date.now()}_${student.id}`,
        student_id: student.id,
        assessment_id: selectedAssessment.id,
        score,
        percentage,
        letter_grade: letterGrade,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      handleGradeChange(student.id, grade)
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
      <div className="w-full mx-auto p-2 sm:p-4 lg:p-3 xl:p-4 space-y-3 sm:space-y-4 lg:space-y-3">

      {/* Assessment Selection - only show when no assessment is selected */}
      {!selectedAssessment && (
      <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-xl sm:rounded-2xl overflow-hidden">
        <CardHeader className="p-3 sm:p-4 lg:p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl text-white">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            </div>
            Assessment Portfolio
          </CardTitle>
          <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">Choose an assessment to begin grading</p>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          {loadingAssessments ? (
            // Loading Skeleton
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 min-h-[120px] sm:min-h-[140px] lg:min-h-[160px] animate-pulse">
                  <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                    <div className="h-4 sm:h-5 bg-slate-300 rounded w-3/4"></div>
                    <div className="h-5 sm:h-6 bg-slate-300 rounded w-12 sm:w-16"></div>
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="h-3 sm:h-4 bg-slate-300 rounded w-1/2"></div>
                    <div className="h-3 sm:h-4 bg-slate-300 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-4">
            {assessments.map(assessment => (
              <motion.div
                key={assessment.id}
                whileHover={{ scale: 1.02 }}
                className="group relative p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white to-slate-50 hover:from-emerald-50 hover:to-teal-50 border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setAssessmentToDelete(assessment)
                    setShowDeleteDialog(true)
                  }}
                  className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-lg bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm hover:shadow-md"
                  title="Delete assessment"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 hover:text-red-600 transition-colors" />
                </button>

                {/* Assessment Card Content */}
                <button
                  onClick={() => setSelectedAssessment(assessment)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2 pr-8">
                    <h3 className="font-bold text-sm sm:text-base lg:text-lg text-slate-800 group-hover:text-emerald-700 flex-1 line-clamp-2 transition-colors">{assessment.title}</h3>
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
                      {assessment.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full"></div>
                      <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium">Max: {assessment.max_score} pts</p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Created {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(assessment.created_at))}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
            
            {/* Create New Assessment Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowCreateModal(true)
                if (user) {
                  fetchTeacherClasses() // Load classes when modal opens (only if user is authenticated)
                }
              }}
              className="group p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-gradient-to-br from-slate-50 to-gray-100 hover:from-emerald-50 hover:to-teal-50 transition-all duration-300 flex flex-col items-center justify-center text-slate-600 hover:text-emerald-600 min-h-[120px] sm:min-h-[140px] lg:min-h-[160px] transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl text-white mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
              </div>
              <span className="font-bold text-sm sm:text-base lg:text-lg text-slate-800 group-hover:text-emerald-700 transition-colors">Create New Assessment</span>
              <span className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Build your next evaluation</span>
            </motion.button>
          </div>
          )}
        </CardContent>
      </Card>
      )}

      {selectedAssessment && (
        <>
          {/* Mobile Navigation Buttons */}
          <div className="lg:hidden mb-3">
            <div className="grid grid-cols-2 gap-2">
              {/* Back Button */}
              <Button
                onClick={() => {
                  setSelectedAssessment(null)
                  setGrades({})
                  setActiveMode('grid')
                }}
                variant="outline"
                className="flex items-center justify-center gap-2 p-3 border-2 border-slate-300 hover:border-blue-400 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                <span className="font-medium">Back</span>
              </Button>
              
              {/* Grading Method Button */}
              <Button
                onClick={() => setMobileMenuOpen(true)}
                variant="outline"
                className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-gradient-to-r from-slate-50 to-gray-100 hover:from-emerald-50 hover:to-teal-50"
              >
                <Menu className="h-4 w-4" />
                <span className="font-medium">Method</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Layout with Sidebar */}
          <div className="flex gap-3 lg:gap-4 xl:gap-5">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 rounded-xl overflow-hidden sticky top-4">
                <CardHeader className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-200/30">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent flex items-center gap-2">
                      <Settings className="h-5 w-5 text-emerald-600" />
                      Grading Methods
                    </CardTitle>
                    <Button
                      onClick={() => {
                        setSelectedAssessment(null)
                        setGrades({})
                        setActiveMode('grid')
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 px-2 py-1 h-8 border-slate-300 hover:border-blue-400 bg-white/70 hover:bg-blue-50"
                    >
                      <ArrowRight className="h-3 w-3 rotate-180" />
                      <span className="text-xs font-medium">Back</span>
                    </Button>
                  </div>
                  <CardDescription className="text-sm text-slate-600">
                    Choose your preferred grading approach
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Quick Entry Section */}
                  <div className="p-4 border-b border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Quick Entry
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveMode('grid')}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          activeMode === 'grid' 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm' 
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
                            <Grid3X3 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">Grid Entry</div>
                            <div className="text-xs text-slate-500">Excel-like spreadsheet</div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveMode('bulk')}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          activeMode === 'bulk' 
                            ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 shadow-sm' 
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg text-white">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">Bulk Operations</div>
                            <div className="text-xs text-slate-500">Mass grade updates</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Advanced Methods Section */}
                  <div className="p-4 border-b border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Advanced Methods
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveMode('omr')}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          activeMode === 'omr' 
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-sm' 
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg text-white">
                            <Scan className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">OMR Scanning</div>
                            <div className="text-xs text-slate-500">Upload bubble sheets</div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveMode('rubric')}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          activeMode === 'rubric' 
                            ? 'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 shadow-sm' 
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg text-white">
                            <Target className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">Rubric Grading</div>
                            <div className="text-xs text-slate-500">Criteria-based scoring</div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveMode('digital')}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          activeMode === 'digital' 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm' 
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg text-white">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">Digital Review</div>
                            <div className="text-xs text-slate-500">Annotation tools</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Export & Analytics Section */}
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                      Export & Analytics
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveMode('export')}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          activeMode === 'export' 
                            ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 shadow-sm' 
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg text-white">
                            <Download className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">Export Results</div>
                            <div className="text-xs text-slate-500">Download reports</div>
                          </div>
                        </div>
                      </button>
                      <Button
                        onClick={generateAnalytics}
                        disabled={loading}
                        variant="outline"
                        className="w-full justify-start gap-3 p-3 h-auto border-2 border-dashed border-emerald-300 hover:border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100"
                      >
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg text-white">
                          <BarChart3 className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-slate-800">View Analytics</div>
                          <div className="text-xs text-slate-500">Performance insights</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as any)}>
                {/* Assessment Overview Header */}
                <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 rounded-xl overflow-hidden mb-3 lg:mb-4">
                  <CardHeader className="p-3 sm:p-4 lg:p-4 xl:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-200/30">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Assessment Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
                            {selectedAssessment.title}
                          </h1>
                          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 px-2 py-1 text-xs font-medium">
                            {selectedAssessment.type.toUpperCase()}
                          </Badge>
                        </div>
                        
                        {/* Assessment Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                          {/* Max Score */}
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                            <span className="truncate">
                              <strong className="text-emerald-600">{selectedAssessment.max_score}</strong> points
                            </span>
                          </div>
                          
                          {/* Student Count */}
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Users className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                            <span className="truncate">
                              <strong className="text-blue-600">
                                {(() => {
                                  const classInfo = teacherClasses.find(c => c.id === selectedAssessment.class_id)
                                  return classInfo?.total_students || students.length || 0
                                })()}
                              </strong> students
                            </span>
                          </div>
                          
                          {/* Class Name */}
                          {selectedAssessment.class_id && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <BookOpen className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                              <span className="truncate">
                                {teacherClasses.find(c => c.id === selectedAssessment.class_id)?.class_name || 'Class'}
                              </span>
                            </div>
                          )}
                          
                          {/* Due Date */}
                          {selectedAssessment.due_date && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Calendar className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                              <span className="truncate">
                                Due: <strong className="text-orange-600">
                                  {new Date(selectedAssessment.due_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </strong>
                              </span>
                            </div>
                          )}
                          
                          {/* Created Date */}
                          {selectedAssessment.created_at && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate text-xs">
                                Created {new Date(selectedAssessment.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Current Method Info */}
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="flex items-center gap-2 px-3 py-2 bg-white/70 rounded-lg border border-emerald-200/50">
                          <div className={`p-1.5 rounded-md bg-gradient-to-br text-white ${
                            activeMode === 'grid' ? 'from-blue-500 to-indigo-600' :
                            activeMode === 'omr' ? 'from-purple-500 to-pink-600' :
                            activeMode === 'rubric' ? 'from-orange-500 to-red-600' :
                            activeMode === 'digital' ? 'from-green-500 to-emerald-600' :
                            activeMode === 'bulk' ? 'from-teal-500 to-cyan-600' :
                            'from-slate-500 to-gray-600'
                          }`}>
                            {activeMode === 'grid' && <Grid3X3 className="h-4 w-4" />}
                            {activeMode === 'omr' && <Scan className="h-4 w-4" />}
                            {activeMode === 'rubric' && <Target className="h-4 w-4" />}
                            {activeMode === 'digital' && <FileText className="h-4 w-4" />}
                            {activeMode === 'bulk' && <Users className="h-4 w-4" />}
                            {activeMode === 'export' && <Download className="h-4 w-4" />}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-slate-800 text-sm">
                              {activeMode === 'grid' && 'Grid Entry'}
                              {activeMode === 'omr' && 'OMR Scanning'}
                              {activeMode === 'rubric' && 'Rubric Grading'}
                              {activeMode === 'digital' && 'Digital Review'}
                              {activeMode === 'bulk' && 'Bulk Operations'}
                              {activeMode === 'export' && 'Export Results'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {activeMode === 'grid' && 'Spreadsheet interface'}
                              {activeMode === 'omr' && 'Bubble sheet processing'}
                              {activeMode === 'rubric' && 'Criteria-based scoring'}
                              {activeMode === 'digital' && 'Annotation tools'}
                              {activeMode === 'bulk' && 'Mass grade updates'}
                              {activeMode === 'export' && 'Download reports'}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={generateAnalytics}
                          disabled={loading}
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 px-3 py-2"
                        >
                          <BarChart3 className="h-4 w-4 mr-1.5" />
                          <span className="hidden sm:inline">Analytics</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Expandable Assessment Details */}
                  <AnimatePresence>
                    {showAssessmentDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t border-emerald-200/30"
                      >
                        <CardContent className="p-3 sm:p-4 lg:p-5 bg-gradient-to-r from-emerald-50/50 via-teal-50/50 to-cyan-50/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Class Details */}
                            {selectedAssessment.class_id && (() => {
                              const classInfo = teacherClasses.find(c => c.id === selectedAssessment.class_id)
                              return classInfo ? (
                                <div className="bg-white/80 rounded-lg p-3 border border-purple-200/50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="h-4 w-4 text-purple-600" />
                                    <h4 className="font-semibold text-slate-800 text-sm">Class Information</h4>
                                  </div>
                                  <div className="space-y-1.5 text-sm text-slate-600">
                                    <div><strong>Name:</strong> {classInfo.class_name}</div>
                                    <div><strong>Subject:</strong> {classInfo.subject}</div>
                                    <div><strong>Grade:</strong> {classInfo.grade_level}</div>
                                    <div><strong>Students:</strong> {classInfo.total_students}</div>
                                  </div>
                                </div>
                              ) : null
                            })()}
                            
                            {/* Timeline */}
                            <div className="bg-white/80 rounded-lg p-3 border border-blue-200/50">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <h4 className="font-semibold text-slate-800 text-sm">Timeline</h4>
                              </div>
                              <div className="space-y-1.5 text-sm text-slate-600">
                                {selectedAssessment.created_at && (
                                  <div>
                                    <strong>Created:</strong>{' '}
                                    {new Date(selectedAssessment.created_at).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                )}
                                {selectedAssessment.due_date && (
                                  <div>
                                    <strong>Due Date:</strong>{' '}
                                    {new Date(selectedAssessment.due_date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}{' '}
                                    at{' '}
                                    {new Date(selectedAssessment.due_date).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </div>
                                )}
                                {selectedAssessment.due_date && (
                                  <div className={`font-medium ${
                                    new Date(selectedAssessment.due_date) < new Date() 
                                      ? 'text-red-600' 
                                      : 'text-emerald-600'
                                  }`}>
                                    {new Date(selectedAssessment.due_date) < new Date() 
                                      ? '⚠️ Past Due' 
                                      : '✓ Active'}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Assessment Stats */}
                            <div className="bg-white/80 rounded-lg p-3 border border-emerald-200/50">
                              <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="h-4 w-4 text-emerald-600" />
                                <h4 className="font-semibold text-slate-800 text-sm">Quick Stats</h4>
                              </div>
                              <div className="space-y-1.5 text-sm text-slate-600">
                                <div>
                                  <strong>Enrolled Students:</strong>{' '}
                                  {(() => {
                                    const classInfo = teacherClasses.find(c => c.id === selectedAssessment.class_id)
                                    return classInfo?.total_students || students.length || 0
                                  })()}
                                </div>
                                <div><strong>Max Score:</strong> {selectedAssessment.max_score} points</div>
                                <div><strong>Type:</strong> {selectedAssessment.type.charAt(0).toUpperCase() + selectedAssessment.type.slice(1)}</div>
                                <div><strong>Assessment ID:</strong> <span className="text-xs font-mono">{selectedAssessment.id.slice(0, 8)}...</span></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Toggle Details Button */}
                  <div className="flex justify-center -mt-3 mb-2">
                    <Button
                      onClick={() => setShowAssessmentDetails(!showAssessmentDetails)}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                      {showAssessmentDetails ? (
                        <>
                          <ChevronRight className="h-3 w-3 mr-1 rotate-90 transition-transform" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-3 w-3 mr-1 -rotate-90 transition-transform" />
                          Show More Details
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Tab Content Area */}
                <div className="space-y-3 lg:space-y-4">
                  <TabsContent value="grid" className="space-y-3 lg:space-y-4">
                    <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl shadow-lg">
                      <CardHeader className="p-3 lg:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200/30">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Grid3X3 className="h-5 w-5 text-blue-600" />
                          Grid Entry Mode
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-600 mt-1">
                          Excel-like spreadsheet interface for quick grade entry
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 lg:p-4 xl:p-5">
                        <StudentGradeList
                          students={students}
                          assessment={selectedAssessment}
                          grades={grades}
                          onGradeChange={handleGradeChange}
                          onSaveGrades={handleSaveGrades}
                          loading={loadingStudents}
                          mode="grid"
                          showFeedback={false}
                          showAnalytics={true}
                        />
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
                        {/* OMR Upload Section */}
                        <div className="mb-6 text-center py-6 bg-purple-50 rounded-xl border-2 border-dashed border-purple-300">
                          <div className="p-4 bg-purple-100 rounded-2xl inline-block mb-4">
                            <Scan className="h-8 w-8 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload OMR Sheets</h3>
                          <p className="text-sm text-slate-600 mb-4">
                            Upload scanned OMR sheets for automatic processing
                          </p>
                          <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0">
                            <Upload className="h-4 w-4 mr-2" />
                            Select OMR Files
                          </Button>
                        </div>
                        
                        {/* Student List for Manual Entry */}
                        <div className="mt-6">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Or Enter Scores Manually:</h4>
                          <StudentGradeList
                            students={students}
                            assessment={selectedAssessment}
                            grades={grades}
                            onGradeChange={handleGradeChange}
                            onSaveGrades={handleSaveGrades}
                            loading={loadingStudents}
                            mode="compact"
                            showFeedback={false}
                            showAnalytics={false}
                          />
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
                        {/* Rubric Creation Section */}
                        <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-slate-700">Rubric Criteria</h4>
                            <Button size="sm" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0">
                              <Plus className="h-3 w-3 mr-1" />
                              Add Criteria
                            </Button>
                          </div>
                          <p className="text-sm text-slate-600">
                            Create rubric criteria to evaluate students consistently
                          </p>
                        </div>
                        
                        {/* Student List with Rubric Grading */}
                        <StudentGradeList
                          students={students}
                          assessment={selectedAssessment}
                          grades={grades}
                          onGradeChange={handleGradeChange}
                          onSaveGrades={handleSaveGrades}
                          loading={loadingStudents}
                          mode="list"
                          showFeedback={true}
                          showAnalytics={false}
                        />
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
                        {/* Digital Submission Options */}
                        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Button variant="outline" className="justify-start gap-2">
                            <Eye className="h-4 w-4" />
                            View Submissions
                          </Button>
                          <Button variant="outline" className="justify-start gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Add Comments
                          </Button>
                          <Button variant="outline" className="justify-start gap-2">
                            <PenTool className="h-4 w-4" />
                            Annotate
                          </Button>
                        </div>
                        
                        {/* Student List with Feedback */}
                        <StudentGradeList
                          students={students}
                          assessment={selectedAssessment}
                          grades={grades}
                          onGradeChange={handleGradeChange}
                          onSaveGrades={handleSaveGrades}
                          loading={loadingStudents}
                          mode="list"
                          showFeedback={true}
                          showAnalytics={true}
                        />
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
                        {/* Bulk Actions */}
                        <div className="mb-6 p-4 bg-teal-50 rounded-xl border border-teal-200">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h4>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              onClick={() => applyToAll(selectedAssessment?.max_score || 100)}
                              size="sm" 
                              variant="outline"
                              className="border-teal-300 hover:bg-teal-50"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Full Score to All
                            </Button>
                            <Button 
                              onClick={() => applyToAll((selectedAssessment?.max_score || 100) * 0.8)}
                              size="sm" 
                              variant="outline"
                              className="border-teal-300 hover:bg-teal-50"
                            >
                              <Star className="h-3 w-3 mr-1" />
                              80% to All
                            </Button>
                            <Button 
                              onClick={() => applyToAll((selectedAssessment?.max_score || 100) * 0.7)}
                              size="sm" 
                              variant="outline"
                              className="border-teal-300 hover:bg-teal-50"
                            >
                              <TrendingUp className="h-3 w-3 mr-1" />
                              70% to All
                            </Button>
                            <Button 
                              onClick={() => setGrades({})}
                              size="sm" 
                              variant="outline"
                              className="border-red-300 hover:bg-red-50 text-red-600"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Clear All
                            </Button>
                          </div>
                        </div>
                        
                        {/* Student List */}
                        <StudentGradeList
                          students={students}
                          assessment={selectedAssessment}
                          grades={grades}
                          onGradeChange={handleGradeChange}
                          onSaveGrades={handleSaveGrades}
                          loading={loadingStudents}
                          mode="list"
                          showFeedback={false}
                          showAnalytics={true}
                        />
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
                        {/* Export Options */}
                        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Export Options</h4>
                          <div className="flex flex-wrap gap-2">
                            <Button className="bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white border-0">
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              Export to Excel
                            </Button>
                            <Button variant="outline" className="border-slate-300 hover:bg-slate-50">
                              <FileText className="h-4 w-4 mr-2" />
                              Export to PDF
                            </Button>
                            <Button variant="outline" className="border-slate-300 hover:bg-slate-50">
                              <Download className="h-4 w-4 mr-2" />
                              Export to CSV
                            </Button>
                            <Button 
                              onClick={generateAnalytics}
                              variant="outline" 
                              className="border-emerald-300 hover:bg-emerald-50 text-emerald-700"
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Generate Report
                            </Button>
                          </div>
                        </div>
                        
                        {/* Grade Preview for Export */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Grade Preview:</h4>
                          <StudentGradeList
                            students={students}
                            assessment={selectedAssessment}
                            grades={grades}
                            onGradeChange={handleGradeChange}
                            onSaveGrades={handleSaveGrades}
                            loading={loadingStudents}
                            mode="compact"
                            showFeedback={false}
                            showAnalytics={true}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          {/* Mobile Bottom Sheet for Grading Methods */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 flex items-end justify-center z-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  className="bg-white rounded-t-2xl shadow-2xl w-full max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">Choose Grading Method</h3>
                    <Button
                      onClick={() => setMobileMenuOpen(false)}
                      variant="ghost"
                      size="sm"
                      className="p-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="p-4">
                    {/* Quick Entry Section */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Quick Entry
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => {
                            setActiveMode('grid')
                            setMobileMenuOpen(false)
                          }}
                          className={`text-left p-4 rounded-xl transition-all ${
                            activeMode === 'grid' 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200' 
                              : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
                              <Grid3X3 className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">Grid Entry</div>
                              <div className="text-sm text-slate-500">Excel-like spreadsheet for quick grading</div>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMode('bulk')
                            setMobileMenuOpen(false)
                          }}
                          className={`text-left p-4 rounded-xl transition-all ${
                            activeMode === 'bulk' 
                              ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200' 
                              : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg text-white">
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">Bulk Operations</div>
                              <div className="text-sm text-slate-500">Apply grades to multiple students</div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Advanced Methods Section */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Advanced Methods
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => {
                            setActiveMode('omr')
                            setMobileMenuOpen(false)
                          }}
                          className={`text-left p-4 rounded-xl transition-all ${
                            activeMode === 'omr' 
                              ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200' 
                              : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg text-white">
                              <Scan className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">OMR Scanning</div>
                              <div className="text-sm text-slate-500">Upload and process bubble sheets</div>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMode('rubric')
                            setMobileMenuOpen(false)
                          }}
                          className={`text-left p-4 rounded-xl transition-all ${
                            activeMode === 'rubric' 
                              ? 'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200' 
                              : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg text-white">
                              <Target className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">Rubric Grading</div>
                              <div className="text-sm text-slate-500">Detailed criteria-based scoring</div>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMode('digital')
                            setMobileMenuOpen(false)
                          }}
                          className={`text-left p-4 rounded-xl transition-all ${
                            activeMode === 'digital' 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' 
                              : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg text-white">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">Digital Review</div>
                              <div className="text-sm text-slate-500">Review with annotation tools</div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Export & Analytics Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                        Export & Analytics
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => {
                            setActiveMode('export')
                            setMobileMenuOpen(false)
                          }}
                          className={`text-left p-4 rounded-xl transition-all ${
                            activeMode === 'export' 
                              ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200' 
                              : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg text-white">
                              <Download className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">Export Results</div>
                              <div className="text-sm text-slate-500">Download grades and reports</div>
                            </div>
                          </div>
                        </button>
                        <Button
                          onClick={() => {
                            generateAnalytics()
                            setMobileMenuOpen(false)
                          }}
                          disabled={loading}
                          variant="outline"
                          className="justify-start gap-3 p-4 h-auto border-2 border-dashed border-emerald-300 hover:border-emerald-400 bg-gradient-to-r from-emerald-50 to-teal-50"
                        >
                          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg text-white">
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-slate-800">View Analytics</div>
                            <div className="text-sm text-slate-500">Performance insights and trends</div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
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
              className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl max-w-md w-full p-3 sm:p-4 lg:p-5 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Create New Assessment</h2>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
                    <option value="exam">Exam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newAssessment.class_id}
                    onChange={(e) => setNewAssessment({ ...newAssessment, class_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select a class...</option>
                    {loadingClasses ? (
                      <option disabled>Loading classes...</option>
                    ) : (
                      teacherClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.class_name} - {cls.subject} (Grade {cls.grade_level}) - {cls.total_students} students
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Assessment Date & Time <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">When will this assessment take place?</p>
                  
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const tomorrow = new Date()
                        tomorrow.setDate(tomorrow.getDate() + 1)
                        tomorrow.setHours(9, 0, 0, 0)
                        setNewAssessment({ ...newAssessment, assessment_date: tomorrow.toISOString().slice(0, 16) })
                      }}
                      className="text-xs h-7 px-2"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Tomorrow
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const nextWeek = new Date()
                        nextWeek.setDate(nextWeek.getDate() + 7)
                        nextWeek.setHours(9, 0, 0, 0)
                        setNewAssessment({ ...newAssessment, assessment_date: nextWeek.toISOString().slice(0, 16) })
                      }}
                      className="text-xs h-7 px-2"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Next Week
                    </Button>
                    {newAssessment.assessment_date && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setNewAssessment({ ...newAssessment, assessment_date: '' })}
                        className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  {/* Date & Time Input */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={newAssessment.assessment_date ? newAssessment.assessment_date.split('T')[0] : ''}
                        onChange={(e) => {
                          const time = newAssessment.assessment_date?.split('T')[1] || '09:00'
                          setNewAssessment({ ...newAssessment, assessment_date: e.target.value ? `${e.target.value}T${time}` : '' })
                        }}
                        className="w-full"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="time"
                        value={newAssessment.assessment_date ? newAssessment.assessment_date.split('T')[1] : '09:00'}
                        onChange={(e) => {
                          const date = newAssessment.assessment_date?.split('T')[0] || new Date().toISOString().split('T')[0]
                          setNewAssessment({ ...newAssessment, assessment_date: `${date}T${e.target.value}` })
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Preview */}
                  {newAssessment.assessment_date && (
                    <div className="mt-2 text-xs text-gray-600 bg-emerald-50 border border-emerald-200 rounded-md p-2 flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-emerald-600" />
                      <span>
                        Assessment: {new Date(newAssessment.assessment_date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })} at {new Date(newAssessment.assessment_date).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Submission Due Date (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">For assignments/projects with submission deadlines</p>
                  
                  {/* Date & Time Input */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={newAssessment.due_date ? newAssessment.due_date.split('T')[0] : ''}
                        onChange={(e) => {
                          const time = newAssessment.due_date?.split('T')[1] || '23:59'
                          setNewAssessment({ ...newAssessment, due_date: e.target.value ? `${e.target.value}T${time}` : '' })
                        }}
                        className="w-full"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="time"
                        value={newAssessment.due_date ? newAssessment.due_date.split('T')[1] : '23:59'}
                        onChange={(e) => {
                          const date = newAssessment.due_date?.split('T')[0] || new Date().toISOString().split('T')[0]
                          setNewAssessment({ ...newAssessment, due_date: `${date}T${e.target.value}` })
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {newAssessment.due_date && (
                    <div className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-2 flex items-center gap-2">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <span>
                        Due: {new Date(newAssessment.due_date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })} at {new Date(newAssessment.due_date).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Max Score
                  </label>
                  <Input
                    type="number"
                    value={newAssessment.max_score}
                    onChange={(e) => setNewAssessment({ ...newAssessment, max_score: parseInt(e.target.value) || 100 })}
                    placeholder="100"
                    className="w-full"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Pass Mark <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={newAssessment.pass_mark}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      if (value <= newAssessment.max_score) {
                        setNewAssessment({ ...newAssessment, pass_mark: value })
                      }
                    }}
                    placeholder="50"
                    className="w-full"
                    min="0"
                    max={newAssessment.max_score}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum score required to pass (max: {newAssessment.max_score})
                  </p>
                </div>

                <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-5">
                  <Button
                    onClick={async () => {
                      if (!newAssessment.title) {
                        toast.error('Please enter an assessment title')
                        return
                      }
                      
                      if (!newAssessment.class_id) {
                        toast.error('Please select a class')
                        return
                      }
                      
                      if (!newAssessment.assessment_date) {
                        toast.error('Please set an assessment date')
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
                          setNewAssessment({ title: '', type: 'quiz', max_score: 100, pass_mark: 50, class_id: '', due_date: '', assessment_date: '' })
                          toast.success('Assessment created successfully!')
                        } else {
                          const error = await response.json()
                          toast.error('Failed to create assessment: ' + (error.error || 'Unknown error'))
                        }
                      } catch (error) {
                        console.error('Error creating assessment:', error)
                        toast.error('Failed to create assessment. Please try again.')
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
                      setNewAssessment({ title: '', type: 'quiz', max_score: 100, pass_mark: 50, class_id: '', due_date: '', assessment_date: '' })
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

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && assessmentToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !deleting && setShowDeleteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Assessment?</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Are you sure you want to delete <span className="font-semibold">"{assessmentToDelete.title}"</span>?
                  </p>
                  <p className="text-sm text-red-600">
                    This action cannot be undone. All associated grades and student data will be permanently removed.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteAssessment}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteDialog(false)
                    setAssessmentToDelete(null)
                  }}
                  disabled={deleting}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}
