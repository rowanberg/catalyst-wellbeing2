'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { useTeacherData } from '@/hooks/useTeacherData'
import { StudentSkeleton, ModernLoadingSpinner } from '@/components/ui/student-skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfessionalLoader } from '@/components/ui/professional-loader'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ClientOnly } from '@/components/ui/ClientOnly'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  Users, 
  GraduationCap, 
  Star, 
  Zap, 
  Heart, 
  TrendingUp, 
  Mail, 
  Phone, 
  User,
  Award,
  Target,
  Calendar,
  Eye,
  UserCheck,
  BookOpen,
  Activity,
  ChevronRight,
  ArrowLeft,
  Search,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  SortAsc,
  SortDesc,
  Download,
  MessageSquare,
  Bell,
  Settings,
  RefreshCw,
  BarChart3,
  PieChart,
  Clock,
  MapPin,
  Smartphone,
  Trash2,
  X,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Minus,
  Plus,
  Home,
  School,
  Briefcase,
  UserPlus,
  FileText,
  Camera,
  Video,
  Headphones,
  Palette,
  Gamepad2,
  Music,
  Book,
  Calculator,
  Beaker,
  Microscope,
  Globe2,
  Languages,
  Dumbbell,
  Paintbrush
} from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  grade: string
  xpPoints: number
  level: number
  streakDays: number
  mood: string
  wellbeingStatus: string
  parents: Array<{
    id: string
    name: string
    email: string
    phone: string
    relationship: string
  }>
}

interface TeacherClass {
  class_id: string
  class_name: string
  grade_level: string
  subject: string
  student_count: number
  is_primary: boolean
}

const moodEmojis: Record<string, string> = {
  'happy': '😊',
  'excited': '🤩',
  'calm': '😌',
  'neutral': '😐',
  'tired': '😴',
  'sad': '😢',
  'anxious': '😰',
  'frustrated': '😤'
}

const wellbeingColors: Record<string, string> = {
  'thriving': 'bg-green-500',
  'doing-well': 'bg-blue-500',
  'managing': 'bg-yellow-500',
  'struggling': 'bg-orange-500',
  'needs-support': 'bg-red-500'
}

// Student Setup Component
function StudentSetupComponent() {
  const [gradeLevels, setGradeLevels] = useState<any[]>([])
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentAssignments, setCurrentAssignments] = useState<any[]>([])

  // Load grade levels
  useEffect(() => {
    const loadGradeLevels = async () => {
      try {
        const response = await fetch('/api/teacher/grade-levels')
        if (response.ok) {
          const data = await response.json()
          setGradeLevels(data.gradeLevels || [])
        }
      } catch (error: any) {
        console.error('Error loading grade levels:', error)
      } finally {
        setLoading(false)
      }
    }

    loadGradeLevels()
  }, [])

  // Load current assignments
  useEffect(() => {
    const loadCurrentAssignments = async () => {
      try {
        const response = await fetch('/api/teacher/class-assignments')
        if (response.ok) {
          const data = await response.json()
          setCurrentAssignments(data.assignments || [])
        }
      } catch (error: any) {
        console.error('Error loading current assignments:', error)
      }
    }

    loadCurrentAssignments()
  }, [])

  // Load classes when grade is selected
  useEffect(() => {
    if (!selectedGrade) return

    const loadClasses = async () => {
      setLoadingClasses(true)
      try {
        const response = await fetch(`/api/teacher/classes/${selectedGrade}`)
        if (response.ok) {
          const data = await response.json()
          setClasses(data.classes || [])
          // Pre-select already assigned classes
          const assignedClasses = data.classes
            .filter((cls: any) => cls.is_assigned)
            .map((cls: any) => cls.id)
          setSelectedClasses(assignedClasses)
        }
      } catch (error: any) {
        console.error('Error loading classes:', error)
      } finally {
        setLoadingClasses(false)
      }
    }

    loadClasses()
  }, [selectedGrade])

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

  const handleSaveAssignments = async () => {
    if (selectedClasses.length === 0) {
      alert('Please select at least one class')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/teacher/class-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classIds: selectedClasses,
          subject: 'General'
        })
      })

      if (response.ok) {
        alert('Class assignments updated successfully!')
        // Reload current assignments
        const assignmentsResponse = await fetch('/api/teacher/class-assignments')
        if (assignmentsResponse.ok) {
          const data = await assignmentsResponse.json()
          setCurrentAssignments(data.assignments || [])
        }
      } else {
        alert('Failed to update assignments')
      }
    } catch (error: any) {
      console.error('Error saving assignments:', error)
      alert('Error saving assignments')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ProfessionalLoader size="md" text="Loading setup..." variant="default" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Assignments */}
      {currentAssignments.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <UserCheck className="h-5 w-5" />
              Your Current Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-white p-3 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Grade {assignment.classes.grade_levels.grade_level} - {assignment.classes.class_name}
                      </h4>
                      <p className="text-sm text-gray-600">{assignment.classes.subject}</p>
                      <p className="text-xs text-gray-500">
                        {assignment.classes.current_students} students • Room {assignment.classes.room_number}
                      </p>
                    </div>
                    {assignment.is_primary_teacher && (
                      <Badge className="bg-blue-500 text-white text-xs">Primary</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grade Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Step 1: Select Grade Level
          </CardTitle>
          <CardDescription>
            Choose a grade level to see available classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <ClientWrapper>
              {gradeLevels.map((grade) => (
                <Button
                  key={grade.id}
                  variant={selectedGrade === grade.grade_level ? 'default' : 'outline'}
                  className={`h-16 flex flex-col items-center justify-center ${
                    selectedGrade === grade.grade_level 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'hover:bg-blue-50'
                  }`}
                  onClick={() => setSelectedGrade(grade.grade_level)}
                >
                  <BookOpen className="h-4 w-4 mb-1" />
                  <span className="text-sm font-medium">Grade {grade.grade_level}</span>
                  <span className="text-xs opacity-75">{grade.grade_name}</span>
                </Button>
              ))}
            </ClientWrapper>
          </div>
        </CardContent>
      </Card>

      {/* Class Selection */}
      {selectedGrade && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Step 2: Select Your Classes for Grade {gradeLevels.find(g => g.grade_level === selectedGrade)?.grade_level || selectedGrade}
            </CardTitle>
            <CardDescription>
              Choose the classes you teach in this grade level
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingClasses && (
              <div className="flex items-center justify-center py-8">
                <ProfessionalLoader size="sm" text="Loading classes..." variant="minimal" />
              </div>
            )}
            {classes.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedClasses.includes(cls.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleClassToggle(cls.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{cls.class_name}</h4>
                            {cls.class_code && (
                              <Badge variant="secondary" className="text-xs">
                                {cls.class_code}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{cls.subject}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{cls.current_students}/{cls.max_students} students</span>
                            {cls.room_number && <span>Room {cls.room_number}</span>}
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedClasses.includes(cls.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedClasses.includes(cls.id) && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedClasses.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {selectedClasses.length} class{selectedClasses.length !== 1 ? 'es' : ''} selected
                      </div>
                      <Button 
                        onClick={handleSaveAssignments}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saving ? (
                          <>
                            <ProfessionalLoader size="sm" variant="minimal" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Save Class Assignments
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Available</h3>
                <p className="text-gray-600">
                  No classes found for Grade {gradeLevels.find(g => g.grade_level === selectedGrade)?.grade_level || selectedGrade}. Contact your administrator.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

type ViewType = 'assigned-classes' | 'grades' | 'classes' | 'students'

export default function TeacherStudentsPage() {
  const router = useRouter()
  
  // Local state for UI interactions
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentView, setCurrentView] = useState<ViewType>('assigned-classes')
  const [sortBy, setSortBy] = useState<'name' | 'xp' | 'level' | 'streak'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [assigningClass, setAssigningClass] = useState<string | null>(null)
  const [showManageMode, setShowManageMode] = useState(false)
  const [deletingClass, setDeletingClass] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const { user } = useAppSelector((state) => state.auth)

  // Use the new efficient data management hook
  const {
    data: { assignedClasses, grades, classes, students, analytics },
    loading,
    studentsLoading,
    error,
    refreshData,
    setClassId,
    loadStudentsForClass,
    clearCache
  } = useTeacherData({
    includeStudents: false, // We'll load students separately for better performance
    classId: selectedClass,
    autoRefresh: false
  })

  // Debug student modal data
  useEffect(() => {
    if (students.length > 0) {
      console.log('🔍 Student modal debug:', { 
        studentsCount: students.length, 
        selectedClass, 
        classesCount: classes.length, 
        assignedClassesCount: assignedClasses.length,
        sampleStudent: students[0]
      })
    }
  }, [students, selectedClass, classes.length, assignedClasses.length])

  // Set initial view based on data
  useEffect(() => {
    if (!loading) {
      if (assignedClasses.length > 0) {
        setCurrentView('assigned-classes')
      } else if (grades.length > 0) {
        setCurrentView('grades')
      }
    }
  }, [loading, assignedClasses.length, grades.length])

  // Helper functions - memoized for performance
  const handleClassSelect = useCallback(async (classId: string) => {
    setSelectedClass(classId)
    setCurrentView('students')
    // Immediately load students for better UX
    await loadStudentsForClass(classId)
  }, [loadStudentsForClass])

  const handleAddMoreClasses = useCallback(() => {
    setCurrentView('grades')
  }, [])

  // Filter and sort students

  const filteredAndSortedStudents = students
    .filter(student => {
      const name = `${student.first_name || ''} ${student.last_name || ''}`.trim()
      const email = student.email || ''
      const searchLower = searchTerm.toLowerCase()
      
      const matchesSearch = name.toLowerCase().includes(searchLower) ||
                           email.toLowerCase().includes(searchLower)
      
      const matchesFilter = filterStatus === 'all' || 
                           student.wellbeing_status === filterStatus
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase()
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase()
          break
        case 'xp':
          aValue = a.xp || 0
          bValue = b.xp || 0
          break
        case 'level':
          aValue = a.level || 0
          bValue = b.level || 0
          break
        case 'streak':
          aValue = a.streak_days || 0
          bValue = b.streak_days || 0
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  // Helper function to get selected grade object
  const getSelectedGradeObject = () => {
    return grades.find(grade => grade.id === selectedGrade)
  }

  // Navigation handlers
  const handleGradeSelect = (gradeId: string) => {
    setSelectedGrade(gradeId)
    setSelectedClass('')
    setCurrentView('classes')
  }

  const handleBackToAssignedClasses = () => {
    setCurrentView('assigned-classes')
    setSelectedGrade('')
    setSelectedClass('')
    setClassId('')
  }

  const handleBackToGrades = () => {
    setCurrentView('grades')
    setSelectedGrade('')
    setSelectedClass('')
    setClassId('')
  }

  const handleBackToClasses = () => {
    setCurrentView('classes')
    setSelectedClass('')
    setClassId('')
  }

  // Delete class assignment function
  const handleDeleteClassAssignment = async (classId: string) => {
    if (!user?.id) return
    
    setDeletingClass(classId)
    try {
      const response = await fetch(`/api/teacher/class-assignments`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacher_id: user.id,
          class_id: classId
        })
      })

      if (response.ok) {
        // Refresh data to get updated assigned classes
        await refreshData()
        setShowDeleteConfirm(null)
        console.log('Class assignment removed successfully')
      } else {
        const errorData = await response.json()
        console.error('Failed to remove class assignment:', errorData.error)
      }
    } catch (error) {
      console.error('Error removing class assignment:', error)
    } finally {
      setDeletingClass(null)
    }
  }

  // Toggle manage mode
  const handleToggleManageMode = () => {
    setShowManageMode(!showManageMode)
    setShowDeleteConfirm(null)
  }

  const handleAssignTeacherToClass = async (classId: string, isAssigned: boolean) => {
    if (!user?.id) return
    
    setAssigningClass(classId)
    
    try {
      const response = await fetch('/api/teacher/assign-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacher_id: user.id,
          class_id: classId,
          assign: !isAssigned // Toggle assignment
        })
      })

      if (response.ok) {
        // Refresh data to get updated assignments
        await refreshData()
      } else {
        console.error('Failed to assign teacher to class')
      }
    } catch (error) {
      console.error('Error assigning teacher to class:', error)
    } finally {
      setAssigningClass(null)
    }
  }

  if (loading) {
    return (
      <ClientOnly fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <ProfessionalLoader size="md" />
            </motion.div>
            <motion.div 
              className="mt-4 space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold text-gray-800">Loading Your Classes</h3>
              <p className="text-sm text-gray-600">Fetching your assigned classes and student data...</p>
              <div className="flex items-center justify-center space-x-1 mt-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </ClientOnly>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Navigation Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          {/* Mobile Navigation Row */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between mb-2">
              {/* Mobile Back Button */}
              {currentView !== 'assigned-classes' && currentView !== 'grades' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={
                    currentView === 'students' ? handleBackToClasses : 
                    currentView === 'classes' ? handleBackToGrades :
                    handleBackToAssignedClasses
                  }
                  className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-blue-600" />
                </Button>
              )}
              
              {/* Mobile Current Page Title */}
              <div className="flex-1 min-w-0 mx-2">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {currentView === 'assigned-classes' && 'My Classes'}
                  {currentView === 'grades' && 'All Grades'}
                  {currentView === 'classes' && `Grade ${grades.find(g => g.id === selectedGrade)?.grade_level || selectedGrade}`}
                  {currentView === 'students' && (
                    classes.find(c => c.id === selectedClass)?.class_name || 
                    classes.find(c => c.id === selectedClass)?.name || 
                    `Class ${classes.find(c => c.id === selectedClass)?.class_code || selectedClass?.substring(0, 8) || 'Unknown'}`
                  )}
                </h1>
                {currentView === 'students' && (
                  <p className="text-xs text-gray-500 truncate">
                    Grade {grades.find(g => g.id === selectedGrade)?.grade_level || selectedGrade} • {filteredAndSortedStudents.length} students
                  </p>
                )}
              </div>
              
              {/* Mobile Quick Actions */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Refresh"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="More options"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation Row */}
          <div className="hidden sm:flex items-center justify-between mb-3">
            {/* Interactive Breadcrumb Navigation */}
            <div className="flex items-center space-x-1">
              {currentView !== 'assigned-classes' && currentView !== 'grades' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={
                    currentView === 'students' ? handleBackToClasses : 
                    currentView === 'classes' ? handleBackToGrades :
                    handleBackToAssignedClasses
                  }
                  className="p-2 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-blue-600" />
                </Button>
              )}
              
              {/* Clickable Breadcrumb Items */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToAssignedClasses}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'assigned-classes' 
                      ? 'bg-green-100 text-green-700 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <UserCheck className="h-4 w-4 mr-1.5" />
                  My Classes
                </Button>

                {(currentView === 'grades' || currentView === 'classes' || currentView === 'students') && (
                  <>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToGrades}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        currentView === 'grades' 
                          ? 'bg-blue-100 text-blue-700 shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <GraduationCap className="h-4 w-4 mr-1.5" />
                      All Grades
                    </Button>
                  </>
                )}
                
                {selectedGrade && (
                  <>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToClasses}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        currentView === 'classes' 
                          ? 'bg-purple-100 text-purple-700 shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <BookOpen className="h-4 w-4 mr-1.5" />
                      Grade {grades.find(g => g.id === selectedGrade)?.grade_level || selectedGrade}
                    </Button>
                  </>
                )}
                
                {selectedClass && (
                  <>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <div className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 shadow-sm">
                      <Users className="h-4 w-4 mr-1.5 inline" />
                      {(() => {
                        const currentClass = classes.find(c => c.id === selectedClass) || assignedClasses.find(c => c.id === selectedClass)
                        return currentClass?.class_name || 
                               currentClass?.name || 
                               `Class ${currentClass?.class_code || selectedClass?.substring(0, 8) || 'Unknown'}`
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Desktop Quick Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Export Data"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Controls for Students View */}
          {currentView === 'students' && (
            <>
              {/* Mobile Controls */}
              <div className="sm:hidden space-y-3">
                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 rounded-full hover:bg-gray-200"
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {/* Mobile Filters Row */}
                <div className="flex items-center space-x-2">
                  {/* Mobile Filter */}
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="flex-1 rounded-xl border-gray-200 bg-white/80 backdrop-blur-sm">
                      <Filter className="h-4 w-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="thriving">🌟 Thriving</SelectItem>
                      <SelectItem value="good">😊 Doing Well</SelectItem>
                      <SelectItem value="managing">😐 Managing</SelectItem>
                      <SelectItem value="needs_support">😟 Needs Support</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Mobile Sort */}
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="flex-1 rounded-xl border-gray-200 bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="xp">XP Points</SelectItem>
                      <SelectItem value="level">Level</SelectItem>
                      <SelectItem value="streak">Streak</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Mobile Sort Order & View Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2.5 rounded-xl hover:bg-gray-100 border border-gray-200 bg-white/80"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="p-2.5 rounded-xl hover:bg-gray-100 border border-gray-200 bg-white/80"
                    title={`Switch to ${viewMode === 'grid' ? 'List' : 'Grid'} view`}
                  >
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {/* Desktop Controls */}
              <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Search and Filters */}
                <div className="flex items-center space-x-3 flex-1">
                  {/* Enhanced Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by name, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 rounded-full hover:bg-gray-200"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Wellbeing Filter */}
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40 rounded-xl border-gray-200 bg-white/80 backdrop-blur-sm">
                      <Filter className="h-4 w-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="thriving">🌟 Thriving</SelectItem>
                      <SelectItem value="good">😊 Doing Well</SelectItem>
                      <SelectItem value="managing">😐 Managing</SelectItem>
                      <SelectItem value="needs_support">😟 Needs Support</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort Controls */}
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-32 rounded-xl border-gray-200 bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="xp">XP Points</SelectItem>
                      <SelectItem value="level">Level</SelectItem>
                      <SelectItem value="streak">Streak</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 rounded-xl hover:bg-gray-100"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>

                {/* View Controls */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-gray-100 rounded-xl p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === 'grid' 
                          ? 'bg-white shadow-sm text-blue-600' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === 'list' 
                          ? 'bg-white shadow-sm text-blue-600' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 py-6 sm:px-6">
        <AnimatePresence>
          {currentView === 'assigned-classes' && (
            <motion.div
              key="assigned-classes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <UserCheck className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                          My Assigned Classes
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Active Classes</span>
                          </div>
                          <span>•</span>
                          <span>{assignedClasses.length} class{assignedClasses.length !== 1 ? 'es' : ''} assigned</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          {assignedClasses.reduce((total, cls) => total + (cls.total_students || cls.current_students || 0), 0)} Total Students
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          {new Set(assignedClasses.map(cls => cls.grade_level)).size} Grade Levels
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={handleToggleManageMode}
                      className={`px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
                        showManageMode 
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' 
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {showManageMode ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Cancel</span>
                          <span className="sm:hidden">Cancel</span>
                        </>
                      ) : (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Manage</span>
                          <span className="sm:hidden">Settings</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleAddMoreClasses}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add More Classes</span>
                      <span className="sm:hidden">Add Classes</span>
                    </Button>
                  </div>
                </div>

                {/* Show error state */}
                {error && (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Classes</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button
                    onClick={() => refreshData()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )}

              {/* Enhanced loading state with skeleton cards */}
              {loading && !error && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center space-y-4"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full mx-auto"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 w-12 h-12 border-2 border-green-300 rounded-full mx-auto opacity-30"
                        />
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-2"
                      >
                        <h3 className="text-lg font-semibold text-gray-700">Loading Your Classes</h3>
                        <p className="text-sm text-gray-500">Fetching your assigned classes and student details...</p>
                      </motion.div>
                    </motion.div>
                  </div>
                  
                  {/* Simplified skeleton */}
                  <div className="space-y-3">
                    {[1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                          </div>
                          <div className="flex gap-4">
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show assigned classes with enhanced animations */}
              {!loading && !error && assignedClasses.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6 mt-8"
                >

                  {/* Desktop List View */}
                  <div className="hidden md:block">
                    <div className="space-y-3">
                      {assignedClasses.map((cls, index) => (
                        <motion.div
                          key={cls.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ 
                            delay: index * 0.05, 
                            duration: 0.3
                          }}
                          className="group"
                        >
                          <Card 
                            className={`transition-all duration-300 hover:shadow-lg border border-gray-200 bg-white hover:bg-gray-50 overflow-hidden ${
                              !showManageMode ? 'cursor-pointer' : ''
                            }`}
                            onClick={!showManageMode ? () => {
                              // Show immediate loading feedback
                              setCurrentView('students')
                              handleClassSelect(cls.id)
                            } : () => {}}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                {/* Left: Class Info */}
                                <div className="flex items-center gap-4">
                                  {/* Class Avatar */}
                                  <div className="relative">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                                      {cls.class_code || cls.class_name.charAt(cls.class_name.length - 1)}
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-800 shadow-sm border border-white">
                                      {cls.grade_level || cls.grade_name?.replace('Grade ', '') || 'K'}
                                    </div>
                                  </div>
                                  
                                  {/* Class Details */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <h3 className="font-semibold text-lg text-gray-900 truncate">
                                        {cls.class_name || cls.name || `Class ${cls.class_code || cls.id?.substring(0, 8) || 'Unknown'}`}
                                      </h3>
                                      <Badge className={`text-xs font-medium ${cls.is_primary_teacher ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {cls.is_primary_teacher ? 'Primary' : 'Assigned'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">{cls.grade_name || `Grade ${cls.grade_level || 'Unknown'}`}</p>
                                    <p className="text-xs text-gray-500 mt-1">{cls.subject || 'General Education'}</p>
                                  </div>
                                </div>

                                {/* Right: Stats or Delete Button */}
                                <div className="flex items-center gap-6">
                                  {!showManageMode ? (
                                    <>
                                      <div className="text-center">
                                        <div className="flex items-center gap-1 text-gray-600">
                                          <Users className="h-4 w-4" />
                                          <span className="font-semibold">{cls.total_students || cls.current_students || 0}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">Students</div>
                                      </div>
                                      
                                      <div className="text-center">
                                        <div className="flex items-center gap-1 text-gray-600">
                                          <MapPin className="h-4 w-4" />
                                          <span className="font-semibold">{cls.room_number || '--'}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">Room</div>
                                      </div>

                                      {/* Desktop Action Buttons */}
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 px-3 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            // Handle quick message
                                          }}
                                        >
                                          <MessageSquare className="h-3 w-3 mr-1" />
                                          Message
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            window.location.href = '/teacher/attendance'
                                          }}
                                        >
                                          <UserCheck className="h-3 w-3 mr-1" />
                                          Attendance
                                        </Button>
                                      </div>

                                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      {showDeleteConfirm === cls.id ? (
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-gray-600">Remove class?</span>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setShowDeleteConfirm(null)
                                            }}
                                            className="h-8 px-3 text-gray-600 hover:text-gray-800"
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDeleteClassAssignment(cls.id)
                                            }}
                                            disabled={deletingClass === cls.id}
                                            className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white"
                                          >
                                            {deletingClass === cls.id ? (
                                              <RefreshCw className="h-3 w-3 animate-spin" />
                                            ) : (
                                              'Remove'
                                            )}
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setShowDeleteConfirm(cls.id)
                                          }}
                                          className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                        >
                                          <Trash2 className="h-4 w-4 mr-1" />
                                          Remove
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {assignedClasses.map((cls, index) => (
                        <motion.div
                          key={cls.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: index * 0.1, 
                            duration: 0.4
                          }}
                          className="group"
                        >
                        <Card 
                          className={`transition-all duration-500 hover:shadow-2xl border-0 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 backdrop-blur-lg shadow-xl hover:shadow-green-200/50 overflow-hidden relative ${
                            !showManageMode ? 'cursor-pointer' : ''
                          }`}
                          onClick={!showManageMode ? () => {
                            // Show immediate loading feedback
                            setCurrentView('students')
                            handleClassSelect(cls.id)
                          } : () => {}}
                        >
                        {/* Premium Header with Gradient */}
                        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 via-emerald-600/90 to-teal-600/90"></div>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                          
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Enhanced Class Avatar */}
                              <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/20 group-hover:scale-110 transition-transform duration-300">
                                  {cls.class_code || cls.class_name.charAt(cls.class_name.length - 1)}
                                </div>
                                {/* Grade Level Badge */}
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-800 shadow-md border-2 border-white">
                                  {cls.grade_level || cls.grade_name?.replace('Grade ', '') || 'K'}
                                </div>
                              </div>
                              
                              {/* Class Info */}
                              <div className="text-white min-w-0 flex-1">
                                <h3 className="font-bold text-lg mb-1 group-hover:text-green-100 transition-colors truncate">
                                  {cls.class_name || cls.name || `Class ${cls.class_code || cls.id?.substring(0, 8) || 'Unknown'}`}
                                </h3>
                                <p className="text-green-100 text-sm opacity-90 truncate">{cls.grade_name || `Grade ${cls.grade_level || 'Unknown'}`}</p>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex flex-col items-end">
                              <Badge className="bg-white/20 text-white border border-white/30 backdrop-blur-sm text-xs font-medium mb-2">
                                {cls.is_primary_teacher ? 'Primary' : 'Assigned'}
                              </Badge>
                              <div className="text-right">
                                <div className="text-xs text-green-100 opacity-75">Grade</div>
                                <div className="text-sm font-semibold text-white">{cls.grade_level || cls.grade_name?.replace('Grade ', '') || 'K'}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Card Body */}
                        <CardContent className="p-5">
                          {/* Student Statistics */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100">
                              <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Users className="h-5 w-5 text-white" />
                              </div>
                              <div className="font-bold text-lg text-gray-900">{cls.total_students || cls.current_students || 0}</div>
                              <div className="text-xs text-gray-500 font-medium">Students</div>
                              <div className="text-xs text-green-600 mt-1">
                                Max: {cls.max_students || 'N/A'}
                              </div>
                            </div>
                            
                            <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                              <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <MapPin className="h-5 w-5 text-white" />
                              </div>
                              <div className="font-bold text-lg text-gray-900">
                                {cls.room_number || '--'}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">Room</div>
                              <div className="text-xs text-blue-600 mt-1">Location</div>
                            </div>
                          </div>

                          {/* Class Details */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Schedule</span>
                              </div>
                              <span className="text-sm text-gray-600">Daily</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Last Active</span>
                              </div>
                              <span className="text-sm text-gray-600">Today</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                            {!showManageMode ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 h-9 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Handle quick message
                                  }}
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Message
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 h-9 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.location.href = '/teacher/attendance'
                                  }}
                                >
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Attendance
                                </Button>
                              </>
                            ) : (
                              <div className="w-full">
                                {showDeleteConfirm === cls.id ? (
                                  <div className="space-y-2">
                                    <p className="text-sm text-center text-gray-600">Remove this class assignment?</p>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setShowDeleteConfirm(null)
                                        }}
                                        className="flex-1 h-9 text-xs text-gray-600 hover:text-gray-800"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteClassAssignment(cls.id)
                                        }}
                                        disabled={deletingClass === cls.id}
                                        className="flex-1 h-9 text-xs bg-red-600 hover:bg-red-700 text-white"
                                      >
                                        {deletingClass === cls.id ? (
                                          <RefreshCw className="h-3 w-3 animate-spin" />
                                        ) : (
                                          'Remove'
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowDeleteConfirm(cls.id)
                                    }}
                                    className="w-full h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remove Class Assignment
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* View Students Indicator */}
                          {!showManageMode && (
                            <div className="flex items-center justify-center mt-4 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2 text-green-600 group-hover:text-green-700 transition-colors">
                                <Eye className="h-4 w-4" />
                                <span className="text-sm font-medium">View Students</span>
                                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          )}
                        </CardContent>
                        </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  className="text-center py-12 mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    You haven't been assigned to any classes yet. Contact your administrator or browse available classes to get started.
                  </p>
                  
                  {/* Loading indicator for initial data fetch */}
                  {loading && (
                    <motion.div 
                      className="flex items-center justify-center space-x-2 mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-500">Checking for class assignments...</span>
                    </motion.div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <Button
                      onClick={handleAddMoreClasses}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Browse All Classes
                    </Button>
                    <Button
                      onClick={refreshData}
                      variant="outline"
                      className="px-6 py-3 rounded-xl border-gray-300 hover:border-gray-400 transition-all duration-300"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </motion.div>
              )}
              </div>
            </motion.div>
          )}

          {currentView === 'grades' && (
            <motion.div
              key="grades"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Select Grade Level
                  </h1>
                  <p className="text-gray-600">
                    Choose a grade to view classes and students
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {grades.map((grade, index) => (
                  <motion.div
                    key={grade.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-blue-300 bg-white/70 backdrop-blur-sm"
                      onClick={() => handleGradeSelect(grade.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {grade.grade_level}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Grade {grade.grade_level}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">{grade.grade_name}</p>
                        <div className="flex items-center justify-center text-blue-600">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'classes' && (
            <motion.div
              key="classes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    SELECT OR ASSIGN YOUR CLASSES OF GRADE {getSelectedGradeObject()?.grade_level || 'Unknown'}
                  </h1>
                  <p className="text-gray-600">
                    Select a class to view students or assign yourself to new classes
                  </p>
                </div>

                {loading ? (
                <div className="flex items-center justify-center py-12">
                  <ProfessionalLoader size="md" text="Loading classes..." />
                </div>
              ) : classes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((cls, index) => (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-2 hover:border-purple-300 bg-white/70 backdrop-blur-sm"
                        onClick={() => handleClassSelect(cls.id)}
                      >
                        <CardContent className="p-6">
                          {/* Assignment Button in Top Right */}
                          <div className="absolute top-3 right-3 z-10">
                            <Button
                              variant={cls.is_assigned ? "default" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAssignTeacherToClass(cls.id, cls.is_assigned)
                              }}
                              disabled={assigningClass === cls.id}
                              className={`h-8 px-3 text-xs transition-all duration-200 ${
                                cls.is_assigned 
                                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                                  : 'bg-white hover:bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-300'
                              }`}
                              title={cls.is_assigned ? 'Remove from my classes' : 'Add to my classes'}
                            >
                              {assigningClass === cls.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : cls.is_assigned ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  My Class
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Assign
                                </>
                              )}
                            </Button>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                              {cls.class_code || (cls.class_name || cls.name || cls.id)?.charAt((cls.class_name || cls.name || cls.id)?.length - 1) || 'C'}
                            </div>
                            {cls.class_code && (
                              <Badge variant="secondary" className="text-xs">
                                {cls.class_code}
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {cls.class_name || cls.name || `Class ${cls.class_code || cls.id?.substring(0, 8) || 'Unknown'}`}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">{cls.subject || 'General'}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {cls.current_students}/{cls.max_students}
                              </div>
                              {cls.room_number && (
                                <div className="flex items-center">
                                  <BookOpen className="h-4 w-4 mr-1" />
                                  Room {cls.room_number}
                                </div>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Available</h3>
                  <p className="text-gray-600">
                    No classes found for Grade {getSelectedGradeObject()?.grade_level || 'Unknown'}. Contact your administrator.
                  </p>
                </div>
              )}
              </div>
            </motion.div>
          )}

          {currentView === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {(() => {
                      // First check in classes array (from grades/classes flow)
                      const classFromClasses = classes.find(c => c.id === selectedClass)
                      if (classFromClasses) {
                        return `${classFromClasses.class_name || classFromClasses.name || `Class ${classFromClasses.class_code || 'Unknown'}`} Students`
                      }
                      
                      // Then check in assignedClasses array (from assigned classes flow)
                      const classFromAssigned = assignedClasses.find(c => c.id === selectedClass)
                      if (classFromAssigned) {
                        return `${classFromAssigned.class_name || classFromAssigned.name || `Class ${classFromAssigned.class_code || 'Unknown'}`} Students`
                      }
                      
                      // Fallback
                      return `Class ${selectedClass?.substring(0, 8) || 'Unknown'} Students`
                    })()}
                  </h1>
                  <p className="text-gray-600">
                    Grade {(() => {
                      // First try to get grade from selected grade object
                      const gradeFromSelected = getSelectedGradeObject()?.grade_level
                      if (gradeFromSelected) return gradeFromSelected
                      
                      // Then try to get grade from classes array
                      const classFromClasses = classes.find(c => c.id === selectedClass)
                      if (classFromClasses?.grade_level) return classFromClasses.grade_level
                      
                      // Then try to get grade from assignedClasses array
                      const classFromAssigned = assignedClasses.find(c => c.id === selectedClass)
                      if (classFromAssigned?.grade_level) return classFromAssigned.grade_level
                      if (classFromAssigned?.grade_name) return classFromAssigned.grade_name.replace('Grade ', '')
                      
                      return 'Unknown'
                    })()} • {filteredAndSortedStudents.length} student{filteredAndSortedStudents.length !== 1 ? 's' : ''}
                    {searchTerm && ` matching "${searchTerm}"`}
                  </p>
                </div>

                {studentsLoading ? (
                <div className="space-y-6">
                  <ModernLoadingSpinner size="md" text="Loading students..." />
                  <StudentSkeleton count={6} viewMode={viewMode} />
                </div>
              ) : filteredAndSortedStudents.length > 0 ? (
                <div className={`grid gap-4 sm:gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {filteredAndSortedStudents.map((student: any, index: number) => (
                    <motion.div
                      key={student.id || `student-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Dialog>
                        <DialogTrigger asChild>
                          <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] border border-gray-200/50 bg-white/95 backdrop-blur-sm shadow-md hover:shadow-blue-200/30 overflow-hidden ${
                            viewMode === 'list' ? 'p-0' : ''
                          }`}>
                            <CardContent className="p-0">
                              {/* Compact Mobile Layout */}
                              <div className="sm:hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="relative">
                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                          {(student.first_name || student.last_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                                          student.wellbeing_status === 'thriving' ? 'bg-green-400' :
                                          student.wellbeing_status === 'good' ? 'bg-blue-400' :
                                          student.wellbeing_status === 'managing' ? 'bg-yellow-400' :
                                          student.wellbeing_status === 'needs_support' ? 'bg-orange-400' :
                                          'bg-gray-400'
                                        }`}></div>
                                      </div>
                                      <div className="text-white min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm truncate">
                                          {`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student'}
                                        </h3>
                                        <p className="text-blue-100 text-xs opacity-90 truncate">{student.email || 'No email'}</p>
                                      </div>
                                    </div>
                                    <div className="text-lg">{moodEmojis[student.current_mood] || '😐'}</div>
                                  </div>
                                </div>
                                
                                {/* Mobile Stats */}
                                <div className="p-3">
                                  <div className="flex justify-between items-center text-center">
                                    <div>
                                      <div className="text-sm font-bold text-gray-900">{student.xp || 0}</div>
                                      <div className="text-xs text-gray-500">XP</div>
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-gray-900">{student.level || 1}</div>
                                      <div className="text-xs text-gray-500">Level</div>
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-gray-900">{student.streak_days || 0}</div>
                                      <div className="text-xs text-gray-500">Streak</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Desktop Layout */}
                              <div className="hidden sm:block">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="relative">
                                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                          {(student.first_name || student.last_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-lg ${
                                          student.wellbeing_status === 'thriving' ? 'bg-green-500' :
                                          student.wellbeing_status === 'good' ? 'bg-blue-500' :
                                          student.wellbeing_status === 'managing' ? 'bg-yellow-500' :
                                          student.wellbeing_status === 'needs_support' ? 'bg-orange-500' :
                                          'bg-gray-400'
                                        }`}>
                                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                                        </div>
                                      </div>
                                      <div className="text-white min-w-0 flex-1">
                                        <h3 className="font-bold text-lg mb-1 truncate">
                                          {`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student'}
                                        </h3>
                                        <p className="text-blue-100 text-base opacity-90 truncate mb-1">{student.email || 'No email'}</p>
                                        <div className="flex items-center gap-2">
                                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            student.wellbeing_status === 'thriving' ? 'bg-green-500/20 text-green-100' :
                                            student.wellbeing_status === 'good' ? 'bg-blue-500/20 text-blue-100' :
                                            student.wellbeing_status === 'managing' ? 'bg-yellow-500/20 text-yellow-100' :
                                            student.wellbeing_status === 'needs_support' ? 'bg-orange-500/20 text-orange-100' :
                                            'bg-gray-500/20 text-gray-100'
                                          }`}>
                                            {student.wellbeing_status?.replace('_', ' ') || 'Managing'}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-3xl mb-2">{moodEmojis[student.current_mood] || '😐'}</div>
                                      <p className="text-sm text-blue-100 capitalize opacity-90 font-medium">{student.current_mood || 'neutral'}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Desktop Stats */}
                                <div className="p-5">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <Zap className="h-6 w-6 text-white" />
                                      </div>
                                      <div className="font-bold text-lg text-gray-900">{student.xp || 0}</div>
                                      <div className="text-sm text-gray-500 font-medium">XP Points</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <Star className="h-6 w-6 text-white" />
                                      </div>
                                      <div className="font-bold text-lg text-gray-900">{student.level || 1}</div>
                                      <div className="text-sm text-gray-500 font-medium">Level</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <TrendingUp className="h-6 w-6 text-white" />
                                      </div>
                                      <div className="font-bold text-lg text-gray-900">{student.streak_days || 0}</div>
                                      <div className="text-sm text-gray-500 font-medium">Day Streak</div>
                                    </div>
                                  </div>
                                  
                                  {/* Additional Info Row */}
                                  <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Users className="h-4 w-4" />
                                        <span>Student ID: {student.student_number || 'N/A'}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-gray-500">
                                        <Eye className="h-4 w-4" />
                                        <span>View Details</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </DialogTrigger>

                        {/* Student Details Modal */}
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <User className="h-5 w-5 text-blue-600" />
                              {`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student'} - Student Details
                            </DialogTitle>
                            <DialogDescription>
                              Detailed information about the student (Read-only)
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6">
                            {/* Student Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <UserCheck className="h-4 w-4" />
                                Student Information
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                                  <p className="text-gray-900">{`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Email</label>
                                  <p className="text-gray-900">{student.email || 'No email'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Class</label>
                                  <p className="text-gray-900">
                                    {(() => {
                                      const currentClass = classes.find(c => c.id === selectedClass) || assignedClasses.find(c => c.id === selectedClass)
                                      return currentClass?.class_name || 
                                             currentClass?.name || 
                                             student.class_name ||
                                             `Class ${currentClass?.class_code || selectedClass?.substring(0, 8) || 'Unknown'}`
                                    })()}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Current Mood</label>
                                  <p className="text-gray-900 flex items-center gap-1">
                                    {moodEmojis[student.current_mood] || '😐'}
                                    <span className="capitalize">{student.current_mood}</span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Academic Progress */}
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                Academic Progress
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">XP Points</label>
                                  <p className="text-gray-900 flex items-center gap-1">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    {student.xpPoints}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Current Level</label>
                                  <p className="text-gray-900 flex items-center gap-1">
                                    <Star className="h-4 w-4 text-blue-500" />
                                    Level {student.level}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Streak Days</label>
                                  <p className="text-gray-900 flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    {student.streak_days || 0} days
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Wellbeing Status</label>
                                  <div className="text-gray-900 flex items-center gap-1">
                                    <div className={`w-3 h-3 rounded-full ${wellbeingColors[student.wellbeing_status] || 'bg-gray-400'}`}></div>
                                    <span className="capitalize">{student.wellbeing_status?.replace('-', ' ')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No Students Found' : 'No Students in Class'}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? `No students match "${searchTerm}". Try a different search term.`
                      : 'This class doesn\'t have any students assigned yet.'
                    }
                  </p>
                </div>
              )}
              </div>
            </motion.div>
          )}

          {grades.length === 0 && !loading && currentView === 'grades' && (
            <motion.div
              key="empty-grades"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center py-12">
                <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Grade Levels Available</h3>
                <p className="text-gray-600">
                  You haven't been assigned to any grade levels yet. Please contact your administrator to set up your classes.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
