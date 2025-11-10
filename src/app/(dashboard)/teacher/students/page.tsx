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
  Grid3x3,
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
  const [primaryClass, setPrimaryClass] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingAssignments, setLoadingAssignments] = useState(true)
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
      setLoadingAssignments(true)
      try {
        const response = await fetch('/api/teacher/class-assignments')
        if (response.ok) {
          const data = await response.json()
          setCurrentAssignments(data.assignments || [])
        }
      } catch (error: any) {
        console.error('Error loading current assignments:', error)
      } finally {
        setLoadingAssignments(false)
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

    if (!primaryClass && selectedClasses.length > 1) {
      alert('Please select a primary class (the class shown on attendance page)')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/teacher/class-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classIds: selectedClasses,
          primaryClassId: primaryClass || selectedClasses[0],
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
      {loadingAssignments ? (
        <Card className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading Your Classes...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-700 p-3 rounded-lg border border-gray-200 dark:border-slate-600 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : currentAssignments.length > 0 ? (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <UserCheck className="h-5 w-5" />
              Your Current Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Grade {assignment.classes.grade_levels.grade_level} - {assignment.classes.class_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-slate-300">{assignment.classes.subject}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
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
      ) : null}

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
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Select classes and mark one as primary</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Primary class will be displayed on the attendance page</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedClasses.includes(cls.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
                          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{cls.class_name}</h4>
                            {cls.class_code && (
                              <Badge variant="secondary" className="text-xs">
                                {cls.class_code}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">{cls.subject}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
                            <span>{cls.current_students}/{cls.max_students} students</span>
                            {cls.room_number && <span>Room {cls.room_number}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Checkbox for selection */}
                          <div 
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer ${
                              selectedClasses.includes(cls.id)
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300 dark:border-slate-500'
                            }`}
                            onClick={() => handleClassToggle(cls.id)}
                          >
                            {selectedClasses.includes(cls.id) && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                          {/* Radio for primary */}
                          {selectedClasses.includes(cls.id) && (
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                                primaryClass === cls.id
                                  ? 'border-green-500 bg-green-500'
                                  : 'border-gray-400 dark:border-slate-500 hover:border-green-400'
                              }`}
                              onClick={() => setPrimaryClass(cls.id)}
                              title="Set as primary class"
                            >
                              {primaryClass === cls.id && (
                                <Star className="w-3 h-3 text-white fill-white" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedClasses.includes(cls.id) && primaryClass === cls.id && (
                        <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                          <Star className="w-3 h-3 fill-green-600" />
                          Primary Class - Shows on Attendance
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedClasses.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-slate-300">
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
  const [gradeClasses, setGradeClasses] = useState<any[]>([])
  const [loadingGradeClasses, setLoadingGradeClasses] = useState(false)
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
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

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

  // Initial view setup: Show appropriate starting view
  useEffect(() => {
    if (!loading) {
      // Prioritize showing assigned classes if available
      if (assignedClasses.length > 0) {
        // If teacher has assigned classes, always show them first
        if (currentView === 'grades' || currentView === 'assigned-classes') {
          setCurrentView('assigned-classes')
        }
      } else if (currentView === 'assigned-classes' && grades.length > 0) {
        // Only if no assigned classes, show grades view to let teacher assign classes
        setCurrentView('grades')
      }
    }
  }, [loading, assignedClasses.length, grades.length, currentView])

  // Helper functions - memoized for performance
  const handleClassSelect = useCallback(async (classId: string) => {
    console.log('🎯 Class selected:', classId)
    console.log('🔍 User data:', { userId: user?.id, hasUser: !!user })
    setSelectedClass(classId)
    setCurrentView('students')
    // Immediately load students for better UX
    await loadStudentsForClass(classId)
  }, [loadStudentsForClass, user])

  const handleAddMoreClasses = useCallback(() => {
    // Allow navigation to grades view to add more classes
    setCurrentView('grades')
    setSelectedGrade('')
    setSelectedClass('')
  }, [])

  // Debug students data
  useEffect(() => {
    console.log('👥 Students data changed:', {
      count: students.length,
      selectedClass,
      studentsLoading,
      students: students.slice(0, 2)
    })
  }, [students, selectedClass, studentsLoading])

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

  // Get classes for selected grade (from fetched gradeClasses)
  const getClassesForSelectedGrade = useCallback(() => {
    console.log('🔍 Getting classes for selected grade')
    console.log('📚 Grade classes available:', gradeClasses.length)
    return gradeClasses
  }, [gradeClasses])

  // Navigation handlers
  const handleGradeSelect = async (gradeId: string) => {
    console.log('🎓 Grade selected:', gradeId)
    setSelectedGrade(gradeId)
    setSelectedClass('')
    setCurrentView('classes')
    setLoadingGradeClasses(true)
    
    // Fetch classes for this grade
    if (user?.id) {
      try {
        console.log('📚 Fetching classes for grade:', gradeId)
        // Fetch school_id from profile API since it's not on the User type
        const profileResponse = await fetch('/api/profile')
        const profileData = await profileResponse.json()
        const schoolId = profileData.school_id
        const response = await fetch(`/api/teacher/classes?school_id=${schoolId}&grade_level_id=${gradeId}&teacher_id=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Classes fetched:', data.classes?.length || 0, 'classes')
          setGradeClasses(data.classes || [])
        } else {
          console.error('❌ Failed to fetch classes:', response.status)
          setGradeClasses([])
        }
      } catch (error) {
        console.error('❌ Error fetching classes:', error)
        setGradeClasses([])
      } finally {
        setLoadingGradeClasses(false)
      }
    }
  }

  const handleBackToAssignedClasses = () => {
    // Always return to assigned classes view when available
    if (assignedClasses.length > 0) {
      setCurrentView('assigned-classes')
    } else {
      setCurrentView('grades')
    }
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
        console.log('✅ Class assignment successful, refreshing data...')
        // Refresh data to get updated assignments
        await refreshData()
        // Immediately redirect to assigned classes view after successful assignment
        window.location.reload() // Force page reload to ensure clean state
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          {/* Minimal spinner */}
          <div className="relative">
            <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          {/* Simple text */}
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-600 dark:text-slate-300">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Enhanced Navigation Header */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700 shadow-sm">
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
                  className="p-2 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 text-blue-600" />
                </Button>
              )}
              
              {/* Mobile Current Page Title */}
              <div className="flex-1 min-w-0 mx-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-slate-200 truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
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
                  <p className="text-xs text-gray-600 dark:text-slate-400 truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Grade {grades.find(g => g.id === selectedGrade)?.grade_level || selectedGrade} • {filteredAndSortedStudents.length} students
                  </p>
                )}
              </div>
              
              {/* Mobile Quick Actions */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                  title="Refresh"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
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
                  className="p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-full transition-colors"
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
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    currentView === 'assigned-classes' 
                      ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-slate-600' 
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200'
                  }`}
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <UserCheck className="h-4 w-4 mr-1.5" />
                  My Classes
                </Button>

                {(currentView === 'grades' || currentView === 'classes' || currentView === 'students') && (
                  <>
                    <ChevronRight className="h-3 w-3 text-gray-400 dark:text-slate-500" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToGrades}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        currentView === 'grades' 
                          ? 'bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm' 
                          : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <GraduationCap className="h-4 w-4 mr-1.5" />
                      All Grades
                    </Button>
                  </>
                )}
                
                {selectedGrade && (
                  <>
                    <ChevronRight className="h-3 w-3 text-gray-400 dark:text-slate-500" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToClasses}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        currentView === 'classes' 
                          ? 'bg-purple-100 dark:bg-slate-700 text-purple-700 dark:text-purple-400 shadow-sm' 
                          : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <BookOpen className="h-4 w-4 mr-1.5" />
                      Grade {grades.find(g => g.id === selectedGrade)?.grade_level || selectedGrade}
                    </Button>
                  </>
                )}
                
                {selectedClass && (
                  <>
                    <ChevronRight className="h-3 w-3 text-gray-400 dark:text-slate-500" />
                    <div className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 shadow-sm">
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
                    className="pl-10 pr-4 py-2.5 text-sm border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700/80 dark:text-white backdrop-blur-sm"
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
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
                  </Button>
                  
                  {/* Mobile Examinations Button */}
                  <Button
                    onClick={() => router.push('/teacher/examinations')}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-2.5 rounded-xl shadow-sm"
                  >
                    <GraduationCap className="h-4 w-4 mr-1" />
                    Exams
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
                  {/* Examinations Button */}
                  <Button
                    onClick={() => router.push('/teacher/examinations')}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl shadow-sm"
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Examinations
                  </Button>
                  
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
                      <Grid3x3 className="h-4 w-4" />
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
      <div className="py-6">
        <AnimatePresence>
          {currentView === 'assigned-classes' && assignedClasses.length > 0 && (
            <motion.div
              key="assigned-classes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="px-4 sm:px-6 lg:px-8"
            >
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <UserCheck className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                          My Assigned Classes
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Active Classes</span>
                          </div>
                          <span>•</span>
                          <span>{assignedClasses.length} class{assignedClasses.length !== 1 ? 'es' : ''} assigned</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          {assignedClasses.reduce((total, cls) => total + (cls.total_students || cls.current_students || 0), 0)} Total Students
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-700">
                        <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300" style={{ fontFamily: 'var(--font-dm-sans)' }}>
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
                          ? 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700' 
                          : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600'
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
                      className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                      style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}
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
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Classes</h3>
                  <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
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
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300">Loading Your Classes</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Fetching your assigned classes and student details...</p>
                      </motion.div>
                    </motion.div>
                  </div>
                  
                  {/* Simplified skeleton */}
                  <div className="space-y-3">
                    {[1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded-xl animate-pulse"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded animate-pulse w-1/3"></div>
                            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded animate-pulse w-1/4"></div>
                          </div>
                          <div className="flex gap-4">
                            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded animate-pulse w-16"></div>
                            <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded animate-pulse w-16"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show assigned classes with enhanced animations */}
              {assignedClasses.length > 0 ? (
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
                            className={`transition-all duration-200 hover:shadow-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 overflow-hidden ${
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
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                      {cls.class_code || cls.class_name.charAt(cls.class_name.length - 1)}
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300 shadow-sm border border-white dark:border-slate-700">
                                      {cls.grade_level || cls.grade_name?.replace('Grade ', '') || 'K'}
                                    </div>
                                  </div>
                                  
                                  {/* Class Details */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                                        {cls.class_name || cls.name || `Class ${cls.class_code || cls.id?.substring(0, 8) || 'Unknown'}`}
                                      </h3>
                                      <Badge className={`text-xs font-semibold ${cls.is_primary_teacher ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600'}`}>
                                        {cls.is_primary_teacher ? 'Primary' : 'Assigned'}
                                      </Badge>
                                      {!cls.is_primary_teacher && (
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation()
                                            try {
                                              const response = await fetch('/api/teacher/set-primary-class', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ class_id: cls.id })
                                              })
                                              if (response.ok) {
                                                await refreshData()
                                              }
                                            } catch (error) {
                                              console.error('Error setting primary class:', error)
                                            }
                                          }}
                                          className="p-1 hover:bg-green-100 rounded-full transition-colors group/star"
                                          title="Set as primary class (shows on attendance page)"
                                        >
                                          <Star className="h-4 w-4 text-gray-400 group-hover/star:text-green-600 group-hover/star:fill-green-600 transition-colors" />
                                        </button>
                                      )}
                                      {cls.is_primary_teacher && (
                                        <span title="This is your primary class">
                                          <Star className="h-4 w-4 text-green-600 fill-green-600" />
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{cls.grade_name || `Grade ${cls.grade_level || 'Unknown'}`}</p>
                                    <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>{cls.subject || 'General Education'}</p>
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
                                          className="h-8 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                                          style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600 }}
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
                                        <>
                                          {!cls.is_primary_teacher && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={async (e) => {
                                                e.stopPropagation()
                                                try {
                                                  const response = await fetch('/api/teacher/set-primary-class', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ class_id: cls.id })
                                                  })
                                                  if (response.ok) {
                                                    await refreshData()
                                                  }
                                                } catch (error) {
                                                  console.error('Error setting primary class:', error)
                                                }
                                              }}
                                              className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                              title="Set as primary class (shows on attendance page)"
                                            >
                                              <Star className="h-4 w-4 mr-1" />
                                              Set Primary
                                            </Button>
                                          )}
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
                                        </>
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
                          className={`transition-all duration-300 hover:shadow-md border border-gray-200 bg-white shadow-sm overflow-hidden relative ${
                            !showManageMode ? 'cursor-pointer' : ''
                          }`}
                          onClick={!showManageMode ? () => {
                            // Show immediate loading feedback
                            setCurrentView('students')
                            handleClassSelect(cls.id)
                          } : () => {}}
                        >
                        {/* Premium Header with Gradient */}
                        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-blue-700/90"></div>
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                          
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Enhanced Class Avatar */}
                              <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md border border-white/20 group-hover:scale-105 transition-transform duration-300">
                                  {cls.class_code || cls.class_name.charAt(cls.class_name.length - 1)}
                                </div>
                                {/* Grade Level Badge */}
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 shadow-md border-2 border-white">
                                  {cls.grade_level || cls.grade_name?.replace('Grade ', '') || 'K'}
                                </div>
                              </div>
                              
                              {/* Class Info */}
                              <div className="text-white min-w-0 flex-1">
                                <h3 className="font-bold text-lg mb-1 transition-colors truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                                  {cls.class_name || cls.name || `Class ${cls.class_code || cls.id?.substring(0, 8) || 'Unknown'}`}
                                </h3>
                                <p className="text-blue-100 text-sm opacity-90 truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{cls.grade_name || `Grade ${cls.grade_level || 'Unknown'}`}</p>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex flex-col items-end">
                              <Badge className="bg-white/20 text-white border border-white/30 backdrop-blur-sm text-xs font-semibold mb-2">
                                {cls.is_primary_teacher ? 'Primary' : 'Assigned'}
                              </Badge>
                              <div className="text-right">
                                <div className="text-xs text-blue-100 opacity-75" style={{ fontFamily: 'var(--font-dm-sans)' }}>Grade</div>
                                <div className="text-sm font-semibold text-white">{cls.grade_level || cls.grade_name?.replace('Grade ', '') || 'K'}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Card Body */}
                        <CardContent className="p-5">
                          {/* Student Statistics */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center bg-blue-50 rounded-xl p-3 border border-blue-200">
                              <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Users className="h-5 w-5 text-white" />
                              </div>
                              <div className="font-bold text-lg text-gray-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{cls.total_students || cls.current_students || 0}</div>
                              <div className="text-xs text-gray-600 font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>Students</div>
                              <div className="text-xs text-blue-600 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                                Max: {cls.max_students || 'N/A'}
                              </div>
                            </div>
                            
                            <div className="text-center bg-indigo-50 rounded-xl p-3 border border-indigo-200">
                              <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                                <MapPin className="h-5 w-5 text-white" />
                              </div>
                              <div className="font-bold text-lg text-gray-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                                {cls.room_number || '--'}
                              </div>
                              <div className="text-xs text-gray-600 font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>Room</div>
                              <div className="text-xs text-indigo-600 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>Location</div>
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
                                  className="flex-1 h-9 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold"
                                  style={{ fontFamily: 'var(--font-dm-sans)' }}
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
                                  className="flex-1 h-9 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold"
                                  style={{ fontFamily: 'var(--font-dm-sans)' }}
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
              ) : !loading && !error && assignedClasses.length === 0 && grades.length > 0 ? (
                // Show loading spinner when we're about to auto-navigate to grades
                <div className="flex items-center justify-center py-12 mt-8">
                  <div className="text-center">
                    <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Redirecting...</p>
                  </div>
                </div>
              ) : !loading && !error && assignedClasses.length === 0 && grades.length === 0 ? (
                // Only show empty state when there are truly NO grades available
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
              ) : null}
              </div>
            </motion.div>
          )}

          {currentView === 'assigned-classes' && assignedClasses.length === 0 && !loading && (
            <motion.div
              key="no-assigned-classes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="px-4 sm:px-6 lg:px-8"
            >
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                  <UserCheck className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  No Classes Assigned Yet
                </h2>
                <p className="text-gray-600 dark:text-slate-300 mb-8" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  You haven't been assigned to any classes yet. Click the button below to browse available classes and assign yourself.
                </p>
                <Button
                  onClick={handleAddMoreClasses}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-md"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Browse & Assign Classes
                </Button>
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
              className="px-4 sm:px-6 lg:px-8"
            >
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                    {assignedClasses.length === 0 ? 'Select Grade Level to Assign Classes' : 'Select Grade Level'}
                  </h1>
                  <p className="text-gray-600" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {assignedClasses.length === 0 ? 'You have no assigned classes. Choose a grade to view and assign classes' : 'Choose a grade to view classes and students'}
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
                      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-102 border border-gray-200 hover:border-blue-300 bg-white"
                      onClick={() => handleGradeSelect(grade.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                          {grade.grade_level}
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                          Grade {grade.grade_level}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>{grade.grade_name}</p>
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
              className="px-4 sm:px-6 lg:px-8"
            >
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                        Grade {getSelectedGradeObject()?.grade_level || 'Unknown'} Classes
                      </h1>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        Select a class to view students or assign yourself
                      </p>
                    </div>
                  </div>
                </div>

                {loadingGradeClasses ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500">Loading classes...</p>
                </div>
              ) : getClassesForSelectedGrade().length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getClassesForSelectedGrade().map((cls, index) => (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="relative cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-102 border border-gray-200 hover:border-blue-300 bg-white"
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
                              className={`h-8 px-3 text-xs font-semibold transition-all duration-200 ${
                                cls.is_assigned 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                                  : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300'
                              }`}
                              style={{ fontFamily: 'var(--font-dm-sans)' }}
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
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                              {cls.class_code || (cls.class_name || cls.name || cls.id)?.charAt((cls.class_name || cls.name || cls.id)?.length - 1) || 'C'}
                            </div>
                            {cls.class_code && (
                              <Badge variant="secondary" className="text-xs">
                                {cls.class_code}
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                            {cls.class_name || cls.name || `Class ${cls.class_code || cls.id?.substring(0, 8) || 'Unknown'}`}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{cls.subject || 'General'}</p>
                          
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
              className="px-4 sm:px-6 lg:px-8"
            >
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-1 truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
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
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-dm-sans)' }}>
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
                  </div>
                </div>

                {studentsLoading ? (
                <div className="space-y-6">
                  <ModernLoadingSpinner size="md" text="Loading students..." />
                  <StudentSkeleton count={6} viewMode={viewMode} />
                </div>
              ) : filteredAndSortedStudents.length > 0 ? (
                <div className="space-y-2">
                  {filteredAndSortedStudents.map((student: any, index: number) => (
                    <motion.div
                      key={student.id || `student-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="group cursor-pointer transition-all duration-200 border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md overflow-hidden">
                        <CardContent className="p-0">
                          {/* Compact Row - Always Visible */}
                          <div 
                            className="flex items-center gap-3 p-3 sm:p-4"
                            onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                          >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-sm">
                                {(student.first_name || student.last_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                student.wellbeing_status === 'thriving' ? 'bg-green-500' :
                                student.wellbeing_status === 'good' ? 'bg-blue-500' :
                                student.wellbeing_status === 'managing' ? 'bg-yellow-500' :
                                student.wellbeing_status === 'needs_support' ? 'bg-orange-500' :
                                'bg-gray-400'
                              }`}></div>
                            </div>

                            {/* Student Info - Flexible Layout */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                                  {`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student'}
                                </h3>
                                <span className="text-lg flex-shrink-0">{moodEmojis[student.current_mood] || '😐'}</span>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 truncate font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{student.email || 'No email'}</p>
                            </div>

                            {/* Quick Stats - Desktop */}
                            <div className="hidden sm:flex items-center gap-6">
                              <div className="text-center">
                                <div className="flex items-center gap-1 text-gray-700">
                                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                                  <span className="text-sm font-semibold">{student.xp || 0}</span>
                                </div>
                                <div className="text-xs text-gray-500">XP</div>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center gap-1 text-gray-700">
                                  <Star className="h-3.5 w-3.5 text-blue-500" />
                                  <span className="text-sm font-semibold">{student.level || 1}</span>
                                </div>
                                <div className="text-xs text-gray-500">Level</div>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center gap-1 text-gray-700">
                                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                  <span className="text-sm font-semibold">{student.streak_days || 0}</span>
                                </div>
                                <div className="text-xs text-gray-500">Streak</div>
                              </div>
                            </div>

                            {/* Expand Icon */}
                            <div className="flex-shrink-0">
                              <motion.div
                                animate={{ rotate: expandedStudent === student.id ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                              </motion.div>
                            </div>
                          </div>

                          {/* Expanded Details - Shows on Click */}
                          <AnimatePresence>
                            {expandedStudent === student.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t border-gray-100 bg-gray-50"
                              >
                                <div className="p-4 sm:p-6 space-y-4">
                                  {/* Mobile Stats - Only in Expanded View */}
                                  <div className="sm:hidden grid grid-cols-3 gap-3 pb-4 border-b border-gray-200">
                                    <div className="text-center p-2 bg-white rounded-lg">
                                      <div className="flex items-center justify-center gap-1 text-gray-700 mb-1">
                                        <Zap className="h-4 w-4 text-amber-500" />
                                        <span className="text-sm font-bold">{student.xp || 0}</span>
                                      </div>
                                      <div className="text-xs text-gray-500">XP Points</div>
                                    </div>
                                    <div className="text-center p-2 bg-white rounded-lg">
                                      <div className="flex items-center justify-center gap-1 text-gray-700 mb-1">
                                        <Star className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-bold">{student.level || 1}</span>
                                      </div>
                                      <div className="text-xs text-gray-500">Level</div>
                                    </div>
                                    <div className="text-center p-2 bg-white rounded-lg">
                                      <div className="flex items-center justify-center gap-1 text-gray-700 mb-1">
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                        <span className="text-sm font-bold">{student.streak_days || 0}</span>
                                      </div>
                                      <div className="text-xs text-gray-500">Day Streak</div>
                                    </div>
                                  </div>

                                  {/* Additional Info */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                      <div className="text-xs text-gray-500 mb-1">Wellbeing Status</div>
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                          student.wellbeing_status === 'thriving' ? 'bg-green-500' :
                                          student.wellbeing_status === 'good' ? 'bg-blue-500' :
                                          student.wellbeing_status === 'managing' ? 'bg-yellow-500' :
                                          student.wellbeing_status === 'needs_support' ? 'bg-orange-500' :
                                          'bg-gray-400'
                                        }`}></div>
                                        <span className="text-sm font-medium text-gray-900 capitalize">
                                          {student.wellbeing_status?.replace('_', ' ') || 'Not Set'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                      <div className="text-xs text-gray-500 mb-1">Current Mood</div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{moodEmojis[student.current_mood] || '😐'}</span>
                                        <span className="text-sm font-medium text-gray-900 capitalize">
                                          {student.current_mood || 'Neutral'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Handle view profile
                                      }}
                                      className="flex-1 sm:flex-none h-9 text-xs"
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                                      View Profile
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Handle message
                                      }}
                                      className="flex-1 sm:flex-none h-9 text-xs"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                                      Message
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/teacher/examinations?student=${student.id}`)
                                      }}
                                      className="flex-1 sm:flex-none h-9 text-xs"
                                    >
                                      <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                                      Results
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? `No students matching "${searchTerm}"` : 'No students in this class yet'}
                  </p>
                </div>
              )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
