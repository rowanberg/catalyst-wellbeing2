'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/lib/redux/hooks'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from 'framer-motion'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { Input } from '@/components/ui/input'
import { ProfessionalLoader } from '@/components/ui/professional-loader'
import { AttendanceLoader } from '@/components/ui/attendance-loader'
import { 
  ArrowLeft,
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  Clock,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  BarChart3,
  Download,
  RefreshCw,
  GraduationCap,
  BookOpen,
  Target,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  Square,
  History,
  Eye,
  CalendarDays,
  ChevronRight
} from 'lucide-react'

interface Grade {
  id: string
  grade_level: string
  description?: string
}

interface Class {
  id: string
  class_name: string
  class_code?: string
  subject?: string
  room_number?: string
  current_students?: number
  total_students?: number
  max_students?: number
  grade_level?: string
  grade_level_id?: string
  grade_name?: string
  is_primary_teacher?: boolean
}

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  attendance_status?: 'present' | 'absent' | 'late' | 'excused'
  attendance_date?: string
}

interface AttendanceRecord {
  student_id: string
  attendance_status: 'present' | 'absent' | 'late' | 'excused'
  attendance_date: string
  notes?: string
}

interface AttendanceHistory {
  id: string
  class_id: string
  class_name: string
  attendance_date: string
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  excused_count: number
}

interface AttendanceDetail {
  id: string
  student_id: string
  student_name: string
  student_email: string
  attendance_status: 'present' | 'absent' | 'late' | 'excused'
  attendance_date: string
  notes?: string
}

export default function TeacherAttendancePage() {
  const router = useRouter()
  const { user, profile } = useAppSelector((state) => state.auth)
  const [currentView, setCurrentView] = useState('classes')
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [loadingAssignedClasses, setLoadingAssignedClasses] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [grades, setGrades] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [attendanceSaved, setAttendanceSaved] = useState(false)
  const [savedStudentCount, setSavedStudentCount] = useState(0)

  // Attendance states
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [bulkAction, setBulkAction] = useState<'present' | 'absent' | 'late' | 'excused' | null>(null)
  
  // Attendance history states
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistory[]>([])
  const [attendanceDetails, setAttendanceDetails] = useState<AttendanceDetail[]>([])
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>('')
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyOffset, setHistoryOffset] = useState(0)
  const [hasMoreHistory, setHasMoreHistory] = useState(false)
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false)
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load assigned classes when user is available
  useEffect(() => {
    if (user?.id) {
      setAuthChecked(true)
      loadAssignedClasses()
      
      // Fallback timeout in case API hangs
      fallbackTimerRef.current = setTimeout(() => {
        setLoading(false)
        setLoadingAssignedClasses(false)
      }, 10000) // 10 second timeout
      
      return () => {
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current)
        }
      }
    } else {
      // Wait longer before declaring no user (auth takes time to load)
      const timer = setTimeout(() => {
        setAuthChecked(true)
        setLoading(false)
      }, 3000) // Wait 3 seconds for auth to load
      return () => clearTimeout(timer)
    }
  }, [user?.id])

  const loadAssignedClasses = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    
    setLoadingAssignedClasses(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/teacher/class-assignments?teacher_id=${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.assignments && data.assignments.length > 0) {
          // Transform the assignments data to match our Class interface
          const transformedClasses = data.assignments.map((assignment: any) => ({
            id: assignment.class_id,
            class_name: assignment.classes?.class_name || `Class ${assignment.classes?.class_code || 'Unknown'}`,
            class_code: assignment.classes?.class_code,
            subject: assignment.subject || assignment.classes?.subject || 'General Education',
            room_number: assignment.classes?.room_number,
            current_students: assignment.classes?.current_students || 0,
            total_students: assignment.classes?.current_students || 0,
            max_students: assignment.classes?.max_students,
            grade_level: assignment.classes?.grade_levels?.grade_level || 'Unknown',
            grade_level_id: assignment.classes?.grade_level_id,
            grade_name: assignment.classes?.grade_levels ? `Grade ${assignment.classes.grade_levels.grade_level}` : 'Unknown Grade',
            is_primary_teacher: assignment.is_primary_teacher
          }))
          
          setClasses(transformedClasses)
          
          // Clear the timeout since API completed successfully
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current)
            fallbackTimerRef.current = null
          }
        } else {
          setClasses([])
        }
      } else {
        throw new Error(`Failed to fetch assigned classes: ${response.status}`)
      }
    } catch (error: any) {
      setError('Failed to load assigned classes. Please try again.')
      setClasses([])
    } finally {
      setLoadingAssignedClasses(false)
      setLoading(false)
    }
  }


  const fetchGrades = async (schoolId: string) => {
    if (!schoolId) {
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch(`/api/teacher/grades?school_id=${schoolId}`)
      if (response.ok) {
        const data = await response.json()
        setGrades(data.grades || [])
      }
    } catch (error: any) {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  // Removed fetchClasses since we fetch all classes at once in fetchAllClasses

  const fetchStudents = async (classId: string) => {
    if (!profile?.school_id) {
      return
    }
    
    setLoading(true)
    try {
      // First, get the students in the class
      const studentsResponse = await fetch(`/api/teacher/students?school_id=${profile.school_id}&class_id=${classId}`)
      
      if (!studentsResponse.ok) {
        setStudents([])
        setCurrentView('students')
        return
      }
      
      const studentsData = await studentsResponse.json()
      const classStudents = studentsData.students || []
      
      // Normalize student objects to ensure they have proper IDs
      const validStudents = classStudents.map((student: any) => ({
        ...student,
        id: student.id || student.student_id, // Ensure we have an ID
      })).filter((student: any) => student.id) // Only keep students with valid IDs
      
      if (validStudents.length === 0) {
        setStudents([])
        setCurrentView('students')
        return
      }
      
      // Then, get attendance data for all students on the selected date
      try {
        const attendanceResponse = await fetch(`/api/attendance?date=${selectedDate}`)
        let attendanceData = { students: [] }
        
        if (attendanceResponse.ok) {
          attendanceData = await attendanceResponse.json()
        }
        
        // Create a map of student attendance by student ID
        const attendanceMap = new Map()
        if (attendanceData.students) {
          attendanceData.students.forEach((studentAttendance: any) => {
            if (studentAttendance.attendance) {
              attendanceMap.set(studentAttendance.id, studentAttendance.attendance.status)
            }
          })
        }
        
        // Combine student data with attendance status
        const studentsWithAttendance = validStudents.map((student: any) => ({
          ...student,
          attendance_status: attendanceMap.get(student.id) || 'present' // Default to present
        }))
        
        setStudents(studentsWithAttendance)
        setCurrentView('students')
        
      } catch (attendanceError: any) {
        // Still show students with default attendance status
        const studentsWithDefaultAttendance = validStudents.map((student: any) => ({
          ...student,
          attendance_status: 'present' // Default fallback
        }))
        setStudents(studentsWithDefaultAttendance)
        setCurrentView('students')
      }
      
    } catch (error: any) {
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  // Removed handleGradeSelect since we skip grade selection

  const handleClassSelect = (classItem: Class) => {
    setSelectedClass(classItem)
    fetchStudents(classItem.id)
  }

  const handleStudentAttendanceChange = (studentId: string | undefined, status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!studentId) {
      return
    }
    
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, attendance_status: status }
        : student
    ))
  }

  const handleBulkAttendanceChange = (status: 'present' | 'absent' | 'late' | 'excused') => {
    if (selectedStudents.length === 0) return
    
    setStudents(prev => prev.map(student => 
      selectedStudents.includes(student.id)
        ? { ...student, attendance_status: status }
        : student
    ))
    setSelectedStudents([])
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id))
    }
  }

  const saveAttendance = async () => {
    if (!selectedClass) {
      alert('No class selected')
      return
    }
    
    if (students.length === 0) {
      alert('No students to save attendance for')
      return
    }
    
    if (!user?.id) {
      alert('User not authenticated')
      return
    }
    
    // Filter out students with invalid IDs
    const validStudents = students.filter(student => student.id && student.id !== 'undefined')
    
    if (validStudents.length === 0) {
      alert('No valid students found to save attendance for')
      return
    }
    
    setSaving(true)
    try {
      const attendanceData = validStudents.map(student => ({
        student_id: student.id,
        status: student.attendance_status || 'present',
        notes: ''
      }))

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          attendanceData: attendanceData,
          date: selectedDate
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setAttendanceSaved(true)
        setSavedStudentCount(attendanceData.length)
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setAttendanceSaved(false)
        }, 5000)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        if (errorData.error && errorData.error.includes('not created yet')) {
          alert('⚠️ Attendance system not initialized. Please contact your administrator to set up the attendance tables.')
        } else {
          alert(`❌ Failed to save attendance: ${errorData.error || response.statusText}`)
        }
      }
    } catch (error) {
      // console.error('Error saving attendance:', error)
      alert('❌ Error saving attendance. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const attendanceStats = {
    total: students.length,
    present: students.filter(s => s.attendance_status === 'present').length,
    absent: students.filter(s => s.attendance_status === 'absent').length,
    late: students.filter(s => s.attendance_status === 'late').length,
    excused: students.filter(s => s.attendance_status === 'excused').length
  }

  // Load attendance history for selected class (initial load or refresh)
  const loadAttendanceHistory = async (reset = true) => {
    if (!selectedClass?.id) return
    
    if (reset) {
      setLoadingHistory(true)
      setHistoryOffset(0)
    } else {
      setLoadingMoreHistory(true)
    }
    setError(null)
    
    try {
      const offset = reset ? 0 : historyOffset
      const response = await fetch(`/api/teacher/attendance-history?limit=7&offset=${offset}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance history')
      }
      
      const result = await response.json()
      
      if (result.success && result.history) {
        if (reset) {
          setAttendanceHistory(result.history)
        } else {
          // Append to existing history
          setAttendanceHistory(prev => [...prev, ...result.history])
        }
        setHasMoreHistory(result.hasMore || false)
        setHistoryOffset(result.nextOffset || offset + 7)
      } else {
        if (reset) {
          setAttendanceHistory([])
        }
        setHasMoreHistory(false)
      }
    } catch (error) {
      setError('Failed to load attendance history')
      if (reset) {
        setAttendanceHistory([])
      }
      setHasMoreHistory(false)
    } finally {
      setLoadingHistory(false)
      setLoadingMoreHistory(false)
    }
  }

  // Load more attendance history
  const loadMoreHistory = () => {
    loadAttendanceHistory(false)
  }

  // Load attendance details for a specific date
  const loadAttendanceDetails = async (date: string) => {
    if (!selectedClass?.id) return
    
    setLoadingHistory(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/teacher/attendance-details?date=${date}&class_id=${selectedClass.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance details')
      }
      
      const result = await response.json()
      
      if (result.success && result.details) {
        setAttendanceDetails(result.details)
        setSelectedHistoryDate(date)
        setCurrentView('history-detail')
      } else {
        setAttendanceDetails([])
        setError('No attendance details found for this date')
      }
    } catch (error) {
      setError('Failed to load attendance details')
      setAttendanceDetails([])
    } finally {
      setLoadingHistory(false)
    }
  }

  // Show loader while checking auth or loading data
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <AttendanceLoader />
          <p className="mt-4 text-sm text-gray-600">
            {!authChecked ? 'Checking authentication...' : 'Loading attendance data...'}
          </p>
        </div>
      </div>
    )
  }

  // Only show auth required after we've confirmed no user
  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Card className="max-w-md p-8">
          <CardContent className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to access the attendance page.</p>
            <Button onClick={() => router.push('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Success Banner */}
          {attendanceSaved && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900">Attendance Saved Successfully!</h3>
                  <p className="text-sm text-green-700 mt-0.5">
                    Marked attendance for {savedStudentCount} students in {selectedClass?.class_name} on {new Date(selectedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
            
            {currentView === 'students' && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    // Refetch students with new date
                    if (selectedClass) {
                      fetchStudents(selectedClass.id)
                    }
                  }}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-sm w-full sm:w-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button
                  onClick={saveAttendance}
                  disabled={saving}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 w-full sm:w-auto px-6 py-3"
                  size="default"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Saving Attendance...</span>
                      <span className="sm:hidden">Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Save Attendance</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  )}
                </Button>
              </div>
            )}

          {/* Main Content */}
          <div className="mt-6">
            <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Class Selection */}
            {currentView === 'classes' && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    Your Assigned Classes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAssignedClasses ? (
                    <div className="flex items-center justify-center py-12">
                      <AttendanceLoader size="md" text="Loading your assigned classes..." variant="default" />
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Classes</h3>
                      <p className="text-red-600 mb-4">{error}</p>
                      <Button
                        onClick={loadAssignedClasses}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  ) : classes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {classes.map((classItem) => (
                        <motion.div
                          key={classItem.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card 
                            className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-indigo-300 bg-gradient-to-br from-white to-indigo-50"
                            onClick={() => handleClassSelect(classItem)}
                          >
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                  <BookOpen className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {classItem.current_students || classItem.total_students || 0} students
                                  </Badge>
                                  {classItem.is_primary_teacher && (
                                    <Badge className="text-xs bg-green-100 text-green-700">
                                      Primary
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <h3 className="font-semibold text-gray-900 mb-2">
                                {classItem.class_name || `Class ${classItem.class_code || 'Unknown'}`}
                              </h3>
                              <p className="text-sm text-gray-600 mb-1">{classItem.grade_name || `Grade ${classItem.grade_level || 'Unknown'}`}</p>
                              <p className="text-sm text-gray-600 mb-2">{classItem.subject || 'General Education'}</p>
                              {classItem.room_number && (
                                <p className="text-xs text-gray-500">{classItem.room_number}</p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
                      <p className="text-gray-600">
                        You haven't been assigned to any classes yet. Contact your administrator to set up your class assignments.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Student Attendance */}
            {currentView === 'students' && (
              <div className="space-y-6">
                {/* Modern Professional Attendance Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6 sm:p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                      Attendance Overview
                    </h3>
                    <div className="text-sm text-gray-500">
                      {new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="text-center"
                    >
                      <div className="relative inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-3 shadow-lg">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-700">{attendanceStats.total}</span>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-gray-600">Total Students</div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="text-center"
                    >
                      <div className="relative inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white mb-3 shadow-lg">
                        <UserCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-green-700">{attendanceStats.present}</span>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-gray-600">Present</div>
                      <div className="text-xs text-green-600 font-semibold">
                        {attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0}%
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="text-center"
                    >
                      <div className="relative inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white mb-3 shadow-lg">
                        <UserX className="h-5 w-5 sm:h-6 sm:w-6" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-red-700">{attendanceStats.absent}</span>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-gray-600">Absent</div>
                      <div className="text-xs text-red-600 font-semibold">
                        {attendanceStats.total > 0 ? Math.round((attendanceStats.absent / attendanceStats.total) * 100) : 0}%
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                      className="text-center"
                    >
                      <div className="relative inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 text-white mb-3 shadow-lg">
                        <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-yellow-700">{attendanceStats.late}</span>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-gray-600">Late</div>
                      <div className="text-xs text-yellow-600 font-semibold">
                        {attendanceStats.total > 0 ? Math.round((attendanceStats.late / attendanceStats.total) * 100) : 0}%
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      className="text-center"
                    >
                      <div className="relative inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-white mb-3 shadow-lg">
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-700">{attendanceStats.excused}</span>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-gray-600">Excused</div>
                      <div className="text-xs text-purple-600 font-semibold">
                        {attendanceStats.total > 0 ? Math.round((attendanceStats.excused / attendanceStats.total) * 100) : 0}%
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
                      <span className="text-sm font-bold text-gray-900">
                        {attendanceStats.total > 0 ? Math.round(((attendanceStats.present + attendanceStats.late + attendanceStats.excused) / attendanceStats.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: attendanceStats.total > 0 
                            ? `${Math.round(((attendanceStats.present + attendanceStats.late + attendanceStats.excused) / attendanceStats.total) * 100)}%`
                            : '0%'
                        }}
                        transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                      />
                    </div>
                  </div>
                  
                  {/* Previous Attendance Button */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Button
                      onClick={() => {
                        loadAttendanceHistory()
                        setCurrentView('history')
                      }}
                      variant="outline"
                      className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300 transition-all duration-200"
                    >
                      <History className="h-4 w-4 mr-2" />
                      <span className="font-medium">Previous Attendance</span>
                      <CalendarDays className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>

                {/* Controls */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Users className="h-5 w-5 text-purple-600" />
                        <span className="truncate">{selectedClass?.class_name} Attendance</span>
                      </CardTitle>
                      <Button
                        onClick={() => setCurrentView('classes')}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Back to Classes</span>
                        <span className="sm:hidden">Back</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Search and Bulk Actions */}
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 py-3 text-base"
                        />
                      </div>
                    
                      {selectedStudents.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
                            </p>
                            <Button
                              onClick={() => setSelectedStudents([])}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                            >
                              Clear
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 lg:flex gap-2 lg:gap-3">
                            <Button
                              onClick={() => handleBulkAttendanceChange('present')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <UserCheck className="h-4 w-4 mr-1 lg:mr-2" />
                              <span className="hidden lg:inline">Mark Present</span>
                              <span className="lg:hidden">Present</span>
                            </Button>
                            <Button
                              onClick={() => handleBulkAttendanceChange('absent')}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <UserX className="h-4 w-4 mr-1 lg:mr-2" />
                              <span className="hidden lg:inline">Mark Absent</span>
                              <span className="lg:hidden">Absent</span>
                            </Button>
                            <Button
                              onClick={() => handleBulkAttendanceChange('late')}
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <Clock className="h-4 w-4 mr-1 lg:mr-2" />
                              <span className="hidden lg:inline">Mark Late</span>
                              <span className="lg:hidden">Late</span>
                            </Button>
                            <Button
                              onClick={() => handleBulkAttendanceChange('excused')}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <CheckCircle className="h-4 w-4 mr-1 lg:mr-2" />
                              <span className="hidden lg:inline">Mark Excused</span>
                              <span className="lg:hidden">Excused</span>
                            </Button>
                          </div>
                        </motion.div>
                      )}
                  </div>

                    {/* Select All */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                          onChange={handleSelectAll}
                          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          <span className="hidden sm:inline">Select All ({filteredStudents.length} students)</span>
                          <span className="sm:hidden">All ({filteredStudents.length})</span>
                        </span>
                      </div>
                      {selectedStudents.length > 0 && (
                        <Button
                          onClick={() => setSelectedStudents([])}
                          variant="ghost"
                          size="sm"
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Clear Selection
                        </Button>
                      )}
                    </div>

                  {/* Student List - Optimized Professional Layout */}
                  {filteredStudents.length > 0 ? (
                    <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                      {/* Desktop Table Header - Hidden on Mobile */}
                      <div className="hidden lg:grid lg:grid-cols-12 gap-4 bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="col-span-1 flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-5 text-xs font-semibold text-gray-700 uppercase tracking-wide">Student</div>
                        <div className="col-span-6 text-xs font-semibold text-gray-700 uppercase tracking-wide text-center">Attendance Status</div>
                      </div>
                      
                      {/* Student Rows */}
                      {filteredStudents.map((student, index) => (
                        <div
                          key={student.id || `student-${index}`}
                          className={`transition-colors duration-150 ${
                            student.id && selectedStudents.includes(student.id)
                              ? 'bg-blue-50'
                              : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          } hover:bg-gray-100 border-b border-gray-200 last:border-b-0`}
                        >
                          {/* Desktop Row */}
                          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 items-center">
                            {/* Checkbox */}
                            <div className="col-span-1">
                              <input
                                type="checkbox"
                                checked={student.id ? selectedStudents.includes(student.id) : false}
                                onChange={(e) => {
                                  if (!student.id) return
                                  if (e.target.checked) {
                                    setSelectedStudents(prev => [...prev, student.id])
                                  } else {
                                    setSelectedStudents(prev => prev.filter(id => id !== student.id))
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            {/* Student Info */}
                            <div className="col-span-5 flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${
                                student.attendance_status === 'present' ? 'bg-green-500' :
                                student.attendance_status === 'absent' ? 'bg-red-500' :
                                student.attendance_status === 'late' ? 'bg-yellow-500' :
                                student.attendance_status === 'excused' ? 'bg-purple-500' :
                                'bg-gray-400'
                              }`}>
                                {(student.first_name || student.last_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 truncate text-sm">
                                  {`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student'}
                                </div>
                                <div className="text-xs text-gray-500 truncate">{student.email}</div>
                              </div>
                            </div>
                            
                            {/* Status Buttons */}
                            <div className="col-span-6 flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleStudentAttendanceChange(student.id, 'present')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                  student.attendance_status === 'present'
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-300'
                                }`}
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                Present
                              </button>
                              <button
                                onClick={() => handleStudentAttendanceChange(student.id, 'absent')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                  student.attendance_status === 'absent'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300'
                                }`}
                              >
                                <UserX className="h-3.5 w-3.5" />
                                Absent
                              </button>
                              <button
                                onClick={() => handleStudentAttendanceChange(student.id, 'late')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                  student.attendance_status === 'late'
                                    ? 'bg-yellow-600 text-white shadow-sm'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-yellow-50 hover:border-yellow-300'
                                }`}
                              >
                                <Clock className="h-3.5 w-3.5" />
                                Late
                              </button>
                              <button
                                onClick={() => handleStudentAttendanceChange(student.id, 'excused')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                  student.attendance_status === 'excused'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-300'
                                }`}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Excused
                              </button>
                            </div>
                          </div>
                          
                          {/* Mobile Card */}
                          <div className="lg:hidden p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <input
                                type="checkbox"
                                checked={student.id ? selectedStudents.includes(student.id) : false}
                                onChange={(e) => {
                                  if (!student.id) return
                                  if (e.target.checked) {
                                    setSelectedStudents(prev => [...prev, student.id])
                                  } else {
                                    setSelectedStudents(prev => prev.filter(id => id !== student.id))
                                  }
                                }}
                                className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${
                                student.attendance_status === 'present' ? 'bg-green-500' :
                                student.attendance_status === 'absent' ? 'bg-red-500' :
                                student.attendance_status === 'late' ? 'bg-yellow-500' :
                                student.attendance_status === 'excused' ? 'bg-purple-500' :
                                'bg-gray-400'
                              }`}>
                                {(student.first_name || student.last_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-gray-900 truncate">
                                  {`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student'}
                                </div>
                                <div className="text-sm text-gray-600 truncate">{student.email}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleStudentAttendanceChange(student.id, 'present')}
                                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  student.attendance_status === 'present'
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-300'
                                }`}
                              >
                                <UserCheck className="h-4 w-4" />
                                Present
                              </button>
                              <button
                                onClick={() => handleStudentAttendanceChange(student.id, 'absent')}
                                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  student.attendance_status === 'absent'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-300'
                                }`}
                              >
                                <UserX className="h-4 w-4" />
                                Absent
                              </button>
                              <button
                                onClick={() => handleStudentAttendanceChange(student.id, 'late')}
                                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  student.attendance_status === 'late'
                                    ? 'bg-yellow-600 text-white shadow-sm'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-yellow-300'
                                }`}
                              >
                                <Clock className="h-4 w-4" />
                                Late
                              </button>
                              <button
                                onClick={() => handleStudentAttendanceChange(student.id, 'excused')}
                                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  student.attendance_status === 'excused'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300'
                                }`}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Excused
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? 'No Students Found' : 'No Students in Class'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm 
                          ? `No students match "${searchTerm}". Try a different search term.`
                          : 'This class doesn\'t have any students assigned yet.'
                        }
                      </p>
                      {!searchTerm && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                          <p className="text-sm text-blue-800 mb-3">
                            <strong>Debug Info:</strong><br/>
                            Class ID: {selectedClass?.id}<br/>
                            School ID: {profile?.school_id}<br/>
                            Check the browser console for more details.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>
            )}

            {/* Attendance History List */}
            {currentView === 'history' && (
              <div className="space-y-4 sm:space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                        <History className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                        <span className="truncate">Attendance History</span>
                      </CardTitle>
                      <Button
                        onClick={() => setCurrentView('students')}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto text-sm"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Back to Current</span>
                        <span className="sm:hidden">Back</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-12">
                        <AttendanceLoader size="md" text="Loading attendance history..." variant="default" />
                      </div>
                    ) : attendanceHistory.length > 0 ? (
                      <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
                        {/* Desktop Table Header */}
                        <div className="hidden lg:grid lg:grid-cols-12 gap-4 bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <div className="col-span-3 text-xs font-semibold text-gray-700 uppercase tracking-wide">Date</div>
                          <div className="col-span-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">Class</div>
                          <div className="col-span-6 text-xs font-semibold text-gray-700 uppercase tracking-wide text-center">Attendance Summary</div>
                          <div className="col-span-1 text-xs font-semibold text-gray-700 uppercase tracking-wide text-center">Action</div>
                        </div>
                        
                        {/* History Rows */}
                        {attendanceHistory.map((record, index) => (
                          <div
                            key={record.id}
                            className={`transition-colors duration-150 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                            } hover:bg-gray-100 border-b border-gray-200 last:border-b-0 cursor-pointer`}
                            onClick={() => loadAttendanceDetails(record.attendance_date)}
                          >
                            {/* Desktop Row */}
                            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 items-center">
                              {/* Date */}
                              <div className="col-span-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-indigo-500 text-white flex flex-col items-center justify-center shrink-0">
                                    <span className="text-sm font-bold">{new Date(record.attendance_date).getDate()}</span>
                                    <span className="text-[9px] uppercase">{new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900">
                                      {new Date(record.attendance_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(record.attendance_date).getFullYear()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Class Name */}
                              <div className="col-span-2">
                                <div className="text-sm font-medium text-gray-900 truncate">{record.class_name}</div>
                                <div className="text-xs text-gray-500">{record.total_students} students</div>
                              </div>
                              
                              {/* Stats */}
                              <div className="col-span-6 flex items-center justify-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-8 h-8 rounded-md bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                                    {record.present_count}
                                  </div>
                                  <span className="text-xs text-gray-600">Present</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-8 h-8 rounded-md bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                                    {record.absent_count}
                                  </div>
                                  <span className="text-xs text-gray-600">Absent</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-8 h-8 rounded-md bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                                    {record.late_count}
                                  </div>
                                  <span className="text-xs text-gray-600">Late</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-8 h-8 rounded-md bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                                    {record.excused_count}
                                  </div>
                                  <span className="text-xs text-gray-600">Excused</span>
                                </div>
                              </div>
                              
                              {/* View Button */}
                              <div className="col-span-1 flex justify-center">
                                <button className="p-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors">
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Mobile Card */}
                            <div className="lg:hidden p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-lg bg-indigo-500 text-white flex flex-col items-center justify-center shrink-0">
                                  <span className="text-base font-bold">{new Date(record.attendance_date).getDate()}</span>
                                  <span className="text-[10px] uppercase">{new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 text-sm truncate">
                                    {new Date(record.attendance_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                  </div>
                                  <div className="text-xs text-gray-600 truncate">{record.class_name}</div>
                                  <div className="text-xs text-gray-500">{record.total_students} students</div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                <div className="text-center bg-green-50 rounded-lg p-2">
                                  <div className="text-lg font-bold text-green-700">{record.present_count}</div>
                                  <div className="text-[10px] text-gray-600">Present</div>
                                </div>
                                <div className="text-center bg-red-50 rounded-lg p-2">
                                  <div className="text-lg font-bold text-red-700">{record.absent_count}</div>
                                  <div className="text-[10px] text-gray-600">Absent</div>
                                </div>
                                <div className="text-center bg-amber-50 rounded-lg p-2">
                                  <div className="text-lg font-bold text-amber-700">{record.late_count}</div>
                                  <div className="text-[10px] text-gray-600">Late</div>
                                </div>
                                <div className="text-center bg-blue-50 rounded-lg p-2">
                                  <div className="text-lg font-bold text-blue-700">{record.excused_count}</div>
                                  <div className="text-[10px] text-gray-600">Excused</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Load More Button */}
                        {hasMoreHistory && (
                          <div className="flex justify-center mt-6 pt-4 border-t border-gray-200">
                            <Button
                              onClick={loadMoreHistory}
                              disabled={loadingMoreHistory}
                              variant="outline"
                              className="px-6 py-3 text-sm font-medium"
                            >
                              {loadingMoreHistory ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Load More
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance History</h3>
                        <p className="text-gray-600">
                          No previous attendance records found for this class.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Attendance History Detail */}
            {currentView === 'history-detail' && (
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Eye className="h-5 w-5 text-indigo-600" />
                        <span className="truncate">Attendance Details</span>
                      </CardTitle>
                      <Button
                        onClick={() => setCurrentView('history')}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Back to History</span>
                        <span className="sm:hidden">Back</span>
                      </Button>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        {new Date(selectedHistoryDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} - {selectedClass?.class_name}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-12">
                        <AttendanceLoader size="md" text="Loading attendance details..." variant="default" />
                      </div>
                    ) : attendanceDetails.length > 0 ? (
                      <div className="space-y-3">
                        {attendanceDetails.map((student, index) => (
                          <motion.div
                            key={student.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 sm:p-6 rounded-xl border-2 border-gray-200 bg-white hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              {/* Student Avatar */}
                              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                                student.attendance_status === 'present' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                                student.attendance_status === 'absent' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                                student.attendance_status === 'late' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                                student.attendance_status === 'excused' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                                'bg-gradient-to-br from-blue-500 to-purple-600'
                              }`}>
                                {student.student_name.charAt(0).toUpperCase()}
                              </div>
                              
                              {/* Student Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                                  {student.student_name}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">{student.student_email}</p>
                              </div>

                              {/* Status Badge */}
                              <div className="shrink-0">
                                <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                                  student.attendance_status === 'present' ? 'bg-green-100 text-green-800' :
                                  student.attendance_status === 'absent' ? 'bg-red-100 text-red-800' :
                                  student.attendance_status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                  student.attendance_status === 'excused' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {student.attendance_status === 'present' && <UserCheck className="h-4 w-4 mr-1" />}
                                  {student.attendance_status === 'absent' && <UserX className="h-4 w-4 mr-1" />}
                                  {student.attendance_status === 'late' && <Clock className="h-4 w-4 mr-1" />}
                                  {student.attendance_status === 'excused' && <CheckCircle className="h-4 w-4 mr-1" />}
                                  {student.attendance_status.charAt(0).toUpperCase() + student.attendance_status.slice(1)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Details Available</h3>
                        <p className="text-gray-600">
                          No attendance details found for this date.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  </div>
    </ClientWrapper>
  )
}
