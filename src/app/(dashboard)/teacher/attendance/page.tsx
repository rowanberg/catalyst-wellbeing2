'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector } from '@/lib/redux/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
// Note: Checkbox component may not exist, using a simple checkbox implementation
// import { Checkbox } from '@/components/ui/checkbox'
import { ProfessionalLoader } from '@/components/ui/professional-loader'
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
  CalendarDays
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
  const [currentView, setCurrentView] = useState<'classes' | 'students' | 'history' | 'history-detail'>('classes')
  const [loading, setLoading] = useState(true)
  const [loadingAssignedClasses, setLoadingAssignedClasses] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAppSelector((state) => state.auth)
  
  // Data states
  const [grades, setGrades] = useState<Grade[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  
  // Selection states
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  
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

  // Load assigned classes when user is available
  useEffect(() => {
    if (user?.id) {
      loadAssignedClasses()
    }
  }, [user?.id])

  const loadAssignedClasses = async () => {
    if (!user?.id) return
    
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
          console.log(`✅ Loaded ${transformedClasses.length} assigned classes`)
        } else {
          setClasses([])
          console.log('No assigned classes found')
        }
      } else {
        throw new Error(`Failed to fetch assigned classes: ${response.status}`)
      }
    } catch (error: any) {
      console.error('Error loading assigned classes:', error)
      setError('Failed to load assigned classes. Please try again.')
      setClasses([])
    } finally {
      setLoadingAssignedClasses(false)
      setLoading(false)
    }
  }


  const fetchGrades = async (schoolId: string) => {
    if (!schoolId) {
      console.error('No school ID provided to fetchGrades')
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch(`/api/teacher/grades?school_id=${schoolId}`)
      if (response.ok) {
        const data = await response.json()
        setGrades(data.grades || [])
      } else {
        console.error('Failed to fetch grades:', response.status, response.statusText)
      }
    } catch (error: any) {
      console.error('Error fetching grades:', error)
    } finally {
      setLoading(false)
    }
  }

  // Removed fetchClasses since we fetch all classes at once in fetchAllClasses

  const fetchStudents = async (classId: string) => {
    if (!user?.school_id) {
      console.error('No school ID available for fetching students')
      return
    }
    
    setLoading(true)
    try {
      // First, get the students in the class
      console.log('🔍 Fetching students for class:', classId, 'school:', user.school_id)
      const studentsResponse = await fetch(`/api/teacher/students?school_id=${user.school_id}&class_id=${classId}`)
      
      console.log('📡 Students API response status:', studentsResponse.status)
      
      if (!studentsResponse.ok) {
        console.error('❌ Failed to fetch students:', studentsResponse.status, studentsResponse.statusText)
        const errorText = await studentsResponse.text()
        console.error('Error details:', errorText)
        setStudents([])
        setCurrentView('students')
        return
      }
      
      const studentsData = await studentsResponse.json()
      console.log('📊 Students API response data:', studentsData)
      
      const classStudents = studentsData.students || []
      console.log('👥 Raw class students:', classStudents.length, classStudents)
      
      // Normalize student objects to ensure they have proper IDs
      const validStudents = classStudents.map((student: any) => ({
        ...student,
        id: student.id || student.student_id, // Ensure we have an ID
      })).filter((student: any) => student.id) // Only keep students with valid IDs
      
      console.log('✅ Processed students:', validStudents.length, validStudents)
      
      if (validStudents.length === 0) {
        console.warn('⚠️ No valid students found in class')
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
        } else {
          console.log('No existing attendance data found for date:', selectedDate)
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
        
        console.log(`✅ Loaded ${studentsWithAttendance.length} students with attendance data`)
        setStudents(studentsWithAttendance)
        setCurrentView('students')
        
      } catch (attendanceError: any) {
        console.error('Error fetching attendance data:', attendanceError)
        // Still show students with default attendance status
        const studentsWithDefaultAttendance = validStudents.map((student: any) => ({
          ...student,
          attendance_status: 'present' // Default fallback
        }))
        setStudents(studentsWithDefaultAttendance)
        setCurrentView('students')
      }
      
    } catch (error: any) {
      console.error('Error fetching students:', error)
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
      console.warn('Cannot change attendance: student ID is undefined')
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
    
    if (validStudents.length < students.length) {
      console.warn(`Warning: ${students.length - validStudents.length} students have invalid IDs and will be skipped`)
    }
    
    setSaving(true)
    try {
      const attendanceData = validStudents.map(student => ({
        student_id: student.id,
        status: student.attendance_status || 'present',
        notes: ''
      }))

      console.log('Saving attendance data:', {
        class: selectedClass.class_name,
        date: selectedDate,
        studentsCount: attendanceData.length,
        attendanceData: attendanceData
      })

      console.log('🚀 Making POST request to /api/attendance')
      console.log('📦 Request payload:', { attendanceData, date: selectedDate })
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          attendanceData: attendanceData,
          date: selectedDate
        })
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        console.log('Attendance saved successfully:', result)
        alert(`✅ Attendance saved successfully for ${attendanceData.length} students!`)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to save attendance:', response.status, errorData)
        
        if (errorData.error && errorData.error.includes('not created yet')) {
          alert('⚠️ Attendance system not initialized. Please contact your administrator to set up the attendance tables.')
        } else {
          alert(`❌ Failed to save attendance: ${errorData.error || response.statusText}`)
        }
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
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

  // Load attendance history for selected class
  const loadAttendanceHistory = async () => {
    if (!selectedClass?.id) return
    
    setLoadingHistory(true)
    setError(null)
    
    try {
      // Mock data for demonstration - replace with actual API call
      const mockHistory: AttendanceHistory[] = [
        {
          id: '1',
          class_id: selectedClass.id,
          class_name: selectedClass.class_name,
          attendance_date: '2024-01-15',
          total_students: 25,
          present_count: 22,
          absent_count: 2,
          late_count: 1,
          excused_count: 0
        },
        {
          id: '2',
          class_id: selectedClass.id,
          class_name: selectedClass.class_name,
          attendance_date: '2024-01-14',
          total_students: 25,
          present_count: 24,
          absent_count: 1,
          late_count: 0,
          excused_count: 0
        },
        {
          id: '3',
          class_id: selectedClass.id,
          class_name: selectedClass.class_name,
          attendance_date: '2024-01-13',
          total_students: 25,
          present_count: 20,
          absent_count: 3,
          late_count: 2,
          excused_count: 0
        }
      ]
      
      setAttendanceHistory(mockHistory)
    } catch (error) {
      console.error('Error loading attendance history:', error)
      setError('Failed to load attendance history')
    } finally {
      setLoadingHistory(false)
    }
  }

  // Load attendance details for a specific date
  const loadAttendanceDetails = async (date: string) => {
    if (!selectedClass?.id) return
    
    setLoadingHistory(true)
    setError(null)
    
    try {
      // Mock data for demonstration - replace with actual API call
      const mockDetails: AttendanceDetail[] = [
        {
          id: '1',
          student_id: '1',
          student_name: 'John Smith',
          student_email: 'john.smith@school.edu',
          attendance_status: 'present',
          attendance_date: date
        },
        {
          id: '2',
          student_id: '2',
          student_name: 'Emma Johnson',
          student_email: 'emma.johnson@school.edu',
          attendance_status: 'present',
          attendance_date: date
        },
        {
          id: '3',
          student_id: '3',
          student_name: 'Michael Brown',
          student_email: 'michael.brown@school.edu',
          attendance_status: 'late',
          attendance_date: date
        },
        {
          id: '4',
          student_id: '4',
          student_name: 'Sarah Davis',
          student_email: 'sarah.davis@school.edu',
          attendance_status: 'absent',
          attendance_date: date
        },
        {
          id: '5',
          student_id: '5',
          student_name: 'David Wilson',
          student_email: 'david.wilson@school.edu',
          attendance_status: 'present',
          attendance_date: date
        }
      ]
      
      setAttendanceDetails(mockDetails)
      setSelectedHistoryDate(date)
      setCurrentView('history-detail')
    } catch (error) {
      console.error('Error loading attendance details:', error)
      setError('Failed to load attendance details')
    } finally {
      setLoadingHistory(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ProfessionalLoader size="md" text="Loading attendance..." variant="default" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="p-2 shrink-0 hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Class Attendance</h1>
                <p className="text-sm sm:text-base text-gray-600 truncate mt-1">
                  {currentView === 'classes' && 'Select a class to mark attendance'}
                  {currentView === 'students' && `${selectedClass?.class_name} - ${selectedDate}`}
                  {currentView === 'history' && `${selectedClass?.class_name} - Attendance History`}
                  {currentView === 'history-detail' && `${selectedClass?.class_name} - ${new Date(selectedHistoryDate).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            
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
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
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
                      <ProfessionalLoader size="md" text="Loading your assigned classes..." variant="default" />
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

                  {/* Student List */}
                  {filteredStudents.length > 0 ? (
                    <div className="space-y-2">
                      {filteredStudents.map((student, index) => (
                        <motion.div
                          key={student.id || `student-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                            student.id && selectedStudents.includes(student.id)
                              ? 'border-blue-400 bg-blue-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Student Info */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={student.id ? selectedStudents.includes(student.id) : false}
                                onChange={(e) => {
                                  if (!student.id) return // Skip if no ID
                                  if (e.target.checked) {
                                    setSelectedStudents(prev => [...prev, student.id])
                                  } else {
                                    setSelectedStudents(prev => prev.filter(id => id !== student.id))
                                  }
                                }}
                                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 shrink-0"
                              />
                              
                              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 relative shadow-lg ${
                                student.attendance_status === 'present' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                                student.attendance_status === 'absent' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                                student.attendance_status === 'late' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                                student.attendance_status === 'excused' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                                'bg-gradient-to-br from-blue-500 to-purple-600'
                              }`}>
                                {(student.first_name || student.last_name || 'U').charAt(0).toUpperCase()}
                                {/* Status indicator dot */}
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                                  student.attendance_status === 'present' ? 'bg-green-500' :
                                  student.attendance_status === 'absent' ? 'bg-red-500' :
                                  student.attendance_status === 'late' ? 'bg-yellow-500' :
                                  student.attendance_status === 'excused' ? 'bg-purple-500' :
                                  'bg-gray-400'
                                }`}></div>
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                                  {`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student'}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">{student.email}</p>
                                {student.attendance_status && (
                                  <div className="mt-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                      student.attendance_status === 'present' ? 'bg-green-100 text-green-800' :
                                      student.attendance_status === 'absent' ? 'bg-red-100 text-red-800' :
                                      student.attendance_status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                      student.attendance_status === 'excused' ? 'bg-purple-100 text-purple-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {student.attendance_status.charAt(0).toUpperCase() + student.attendance_status.slice(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Attendance Status Buttons - Professional Layout */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-row gap-2 lg:gap-2 w-full lg:w-auto lg:shrink-0">
                              <Button
                                onClick={() => {
                                  console.log('Marking student present:', student.id, student.first_name, student.last_name)
                                  handleStudentAttendanceChange(student.id, 'present')
                                }}
                                size="sm"
                                variant={student.attendance_status === 'present' ? 'default' : 'outline'}
                                className={`px-3 py-2 lg:px-4 lg:py-2 font-medium transition-all duration-200 ${
                                  student.attendance_status === 'present' 
                                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-md' 
                                    : 'border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400'
                                }`}
                              >
                                <UserCheck className="h-4 w-4 lg:mr-2" />
                                <span className="hidden lg:inline">Present</span>
                                <span className="lg:hidden ml-1">P</span>
                              </Button>
                              
                              <Button
                                onClick={() => {
                                  console.log('Marking student absent:', student.id, student.first_name, student.last_name)
                                  handleStudentAttendanceChange(student.id, 'absent')
                                }}
                                size="sm"
                                variant={student.attendance_status === 'absent' ? 'destructive' : 'outline'}
                                className={`px-3 py-2 lg:px-4 lg:py-2 font-medium transition-all duration-200 ${
                                  student.attendance_status === 'absent' 
                                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-md' 
                                    : 'border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400'
                                }`}
                              >
                                <UserX className="h-4 w-4 lg:mr-2" />
                                <span className="hidden lg:inline">Absent</span>
                                <span className="lg:hidden ml-1">A</span>
                              </Button>
                              
                              <Button
                                onClick={() => {
                                  console.log('Marking student late:', student.id, student.first_name, student.last_name)
                                  handleStudentAttendanceChange(student.id, 'late')
                                }}
                                size="sm"
                                variant={student.attendance_status === 'late' ? 'default' : 'outline'}
                                className={`px-3 py-2 lg:px-4 lg:py-2 font-medium transition-all duration-200 ${
                                  student.attendance_status === 'late' 
                                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 shadow-md' 
                                    : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400'
                                }`}
                              >
                                <Clock className="h-4 w-4 lg:mr-2" />
                                <span className="hidden lg:inline">Late</span>
                                <span className="lg:hidden ml-1">L</span>
                              </Button>
                              
                              <Button
                                onClick={() => {
                                  console.log('Marking student excused:', student.id, student.first_name, student.last_name)
                                  handleStudentAttendanceChange(student.id, 'excused')
                                }}
                                size="sm"
                                variant={student.attendance_status === 'excused' ? 'default' : 'outline'}
                                className={`px-3 py-2 lg:px-4 lg:py-2 font-medium transition-all duration-200 ${
                                  student.attendance_status === 'excused' 
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-md' 
                                    : 'border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400'
                                }`}
                              >
                                <CheckCircle className="h-4 w-4 lg:mr-2" />
                                <span className="hidden lg:inline">Excused</span>
                                <span className="lg:hidden ml-1">E</span>
                              </Button>
                            </div>
                          </div>
                        </motion.div>
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
                            School ID: {user?.school_id}<br/>
                            Check the browser console for more details.
                          </p>
                          <Button
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/debug/students?school_id=${user?.school_id}&class_id=${selectedClass?.id}`)
                                const debugData = await response.json()
                                console.log('🔍 Debug API Results:', debugData)
                                alert('Debug results logged to console. Check browser dev tools.')
                              } catch (error) {
                                console.error('Debug API failed:', error)
                                alert('Debug API failed. Check console for details.')
                              }
                            }}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Run Database Debug
                          </Button>
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
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <History className="h-5 w-5 text-indigo-600" />
                        <span className="truncate">Attendance History</span>
                      </CardTitle>
                      <Button
                        onClick={() => setCurrentView('students')}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Back to Current</span>
                        <span className="sm:hidden">Back</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-12">
                        <ProfessionalLoader size="md" text="Loading history..." variant="default" />
                      </div>
                    ) : attendanceHistory.length > 0 ? (
                      <div className="space-y-3">
                        {attendanceHistory.map((record, index) => (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 sm:p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-indigo-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                            onClick={() => loadAttendanceDetails(record.attendance_date)}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              {/* Date and Class Info */}
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                                  <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                                    {new Date(record.attendance_date).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </h3>
                                  <p className="text-sm text-gray-600">{record.class_name}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Total Students: {record.total_students}
                                  </p>
                                </div>
                              </div>

                              {/* Attendance Stats */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                                <div className="text-center">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-1">
                                    <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </div>
                                  <div className="text-sm font-bold text-green-700">{record.present_count}</div>
                                  <div className="text-xs text-gray-600">Present</div>
                                </div>
                                <div className="text-center">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-1">
                                    <UserX className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </div>
                                  <div className="text-sm font-bold text-red-700">{record.absent_count}</div>
                                  <div className="text-xs text-gray-600">Absent</div>
                                </div>
                                <div className="text-center">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mx-auto mb-1">
                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </div>
                                  <div className="text-sm font-bold text-yellow-700">{record.late_count}</div>
                                  <div className="text-xs text-gray-600">Late</div>
                                </div>
                                <div className="text-center">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-1">
                                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </div>
                                  <div className="text-sm font-bold text-purple-700">{record.excused_count}</div>
                                  <div className="text-xs text-gray-600">Excused</div>
                                </div>
                              </div>

                              {/* View Details Button */}
                              <div className="flex items-center justify-center lg:justify-end">
                                <Button
                                  size="sm"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
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
                        <ProfessionalLoader size="md" text="Loading details..." variant="default" />
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
  )
}
