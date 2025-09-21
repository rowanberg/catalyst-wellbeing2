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
  Square
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

export default function TeacherAttendancePage() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<'classes' | 'students'>('classes')
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
    } catch (error) {
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
    } catch (error) {
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
      const response = await fetch(`/api/teacher/students?school_id=${user.school_id}&class_id=${classId}`)
      if (response.ok) {
        const data = await response.json()
        const studentsWithAttendance = await Promise.all(
          (data.students || []).map(async (student: any) => {
            // Fetch existing attendance for this student and date
            try {
              const attendanceResponse = await fetch(
                `/api/attendance?student_id=${student.id}&date=${selectedDate}`
              )
              let attendanceStatus = 'present' // Default to present
              
              if (attendanceResponse.ok) {
                const attendanceData = await attendanceResponse.json()
                if (attendanceData.attendance && attendanceData.attendance.length > 0) {
                  attendanceStatus = attendanceData.attendance[0].attendance_status
                }
              }
              
              return {
                ...student,
                attendance_status: attendanceStatus
              }
            } catch (attendanceError) {
              console.error('Error fetching attendance for student:', student.id, attendanceError)
              return {
                ...student,
                attendance_status: 'present' // Default fallback
              }
            }
          })
        )
        
        setStudents(studentsWithAttendance)
        setCurrentView('students')
      } else {
        console.error('Failed to fetch students:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
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
    const validStudents = students.filter(student => student.id)
    
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
        console.log('Attendance saved successfully:', result)
        alert(`Attendance saved successfully for ${attendanceData.length} students!`)
      } else {
        const errorText = await response.text()
        console.error('Failed to save attendance:', response.status, errorText)
        alert(`Failed to save attendance: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Error saving attendance. Please check your connection and try again.')
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
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Class Attendance</h1>
                <p className="text-sm text-gray-600">
                  {currentView === 'classes' && 'Select a class to mark attendance'}
                  {currentView === 'students' && `${selectedClass?.class_name} - ${selectedDate}`}
                </p>
              </div>
            </div>
            
            {currentView === 'students' && (
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <Button
                  onClick={saveAttendance}
                  disabled={saving}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Attendance
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            <CardContent className="p-6">
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
              <div>
                {/* Attendance Summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-900">{attendanceStats.total}</div>
                    <div className="text-sm text-blue-700">Total Students</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4 text-center">
                    <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-900">{attendanceStats.present}</div>
                    <div className="text-sm text-green-700">Present</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <CardContent className="p-4 text-center">
                    <UserX className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-900">{attendanceStats.absent}</div>
                    <div className="text-sm text-red-700">Absent</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-900">{attendanceStats.late}</div>
                    <div className="text-sm text-yellow-700">Late</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-900">{attendanceStats.excused}</div>
                    <div className="text-sm text-purple-700">Excused</div>
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      {selectedClass?.class_name} Attendance
                    </CardTitle>
                    <Button
                      onClick={() => setCurrentView('classes')}
                      variant="outline"
                      size="sm"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Classes
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Bulk Actions */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    {selectedStudents.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleBulkAttendanceChange('present')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Mark Present ({selectedStudents.length})
                        </Button>
                        <Button
                          onClick={() => handleBulkAttendanceChange('absent')}
                          size="sm"
                          variant="destructive"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Mark Absent ({selectedStudents.length})
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Select All */}
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">
                      Select All ({filteredStudents.length} students)
                    </span>
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
                          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                            student.id && selectedStudents.includes(student.id)
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
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
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {(student.first_name || student.last_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {`${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student'}
                                </h3>
                                <p className="text-sm text-gray-600">{student.email}</p>
                              </div>
                            </div>

                            {/* Attendance Status Buttons */}
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleStudentAttendanceChange(student.id, 'present')}
                                size="sm"
                                variant={student.attendance_status === 'present' ? 'default' : 'outline'}
                                className={student.attendance_status === 'present' 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'border-green-300 text-green-700 hover:bg-green-50'
                                }
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Present
                              </Button>
                              
                              <Button
                                onClick={() => handleStudentAttendanceChange(student.id, 'absent')}
                                size="sm"
                                variant={student.attendance_status === 'absent' ? 'destructive' : 'outline'}
                                className={student.attendance_status === 'absent' 
                                  ? '' 
                                  : 'border-red-300 text-red-700 hover:bg-red-50'
                                }
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Absent
                              </Button>
                              
                              <Button
                                onClick={() => handleStudentAttendanceChange(student.id, 'late')}
                                size="sm"
                                variant={student.attendance_status === 'late' ? 'default' : 'outline'}
                                className={student.attendance_status === 'late' 
                                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                                  : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                                }
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Late
                              </Button>
                              
                              <Button
                                onClick={() => handleStudentAttendanceChange(student.id, 'excused')}
                                size="sm"
                                variant={student.attendance_status === 'excused' ? 'default' : 'outline'}
                                className={student.attendance_status === 'excused' 
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                  : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Excused
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
                      <p className="text-gray-600">
                        {searchTerm 
                          ? `No students match "${searchTerm}". Try a different search term.`
                          : 'This class doesn\'t have any students assigned yet.'
                        }
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
