'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAppSelector } from '@/lib/redux/hooks'
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  AlertCircle,
  Search,
  Filter,
  ArrowLeft,
  UserCheck,
  UserX,
  RotateCcw,
  Save,
  Download,
  Upload,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  RefreshCw,
  GraduationCap,
  School,
  BookOpen,
  TrendingUp
} from 'lucide-react'

interface Student {
  id: string
  first_name: string
  last_name: string
  student_number?: string
  attendance: {
    status: 'present' | 'absent' | 'late' | 'excused'
    notes?: string
    marked_at?: string
  } | null
}

interface Grade {
  grade_level_id: string
  grade_name: string
  grade_level: number
  total_classes: number
  total_students: number
}

interface ClassInfo {
  class_id: string
  class_name: string
  grade_name: string
  total_students: number
  present_today: number
  absent_today: number
  attendance_rate: number
}

interface AttendanceSummary {
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  excused_count: number
  attendance_rate: number
}

interface AttendanceSystemProps {
  onClose?: () => void
}

export default function EnhancedAttendanceSystem() {
  // Get user from Redux state (same as teacher dashboard)
  const { user } = useAppSelector((state) => state.auth)
  
  // Navigation state - simplified to just classes and students
  const [currentView, setCurrentView] = useState<'classes' | 'students'>('classes')
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null)
  
  // Data state
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  
  // UI state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNotes, setShowNotes] = useState<string | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<'present' | 'absent' | 'late' | 'excused' | null>(null)

  // Helper function to get user's school_id
  const getSchoolId = async (): Promise<string | null> => {
    try {
      // Try the new profile endpoint first
      const profileResponse = await fetch('/api/profile', {
        credentials: 'include'
      })
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        return profileData.school_id || null
      }
      
      // Fallback: Try to get school_id from teacher analytics endpoint
      console.log('Profile endpoint not available, trying analytics fallback...')
      const analyticsResponse = await fetch('/api/teacher/dashboard-analytics', {
        credentials: 'include'
      })
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        console.log('Analytics data for school_id:', analyticsData)
        return analyticsData.teacher?.school_id || analyticsData.school_id || null
      }
      
      console.error('Failed to get school_id from any source')
      return null
    } catch (error) {
      console.error('Error fetching school_id:', error)
      return null
    }
  }

  // Initial load - fetch teacher's classes directly
  useEffect(() => {
    if (currentView === 'classes') {
      fetchTeacherClasses()
    }
  }, [currentView])

  // Fetch students when class is selected
  useEffect(() => {
    if (currentView === 'students' && selectedClass) {
      fetchStudents(selectedClass.class_id)
    }
  }, [currentView, selectedClass, selectedDate])

  const fetchTeacherClasses = async () => {
    setLoading(true)
    try {
      console.log('Fetching only teacher assigned classes...')
      
      if (!user?.id) {
        console.error('No user ID available')
        setClasses([])
        setLoading(false)
        return
      }
      
      // Create a direct API call to get teacher's assigned classes
      // This will use the existing teacher class assignments from the database
      const response = await fetch(`/api/teacher/assigned-classes?teacher_id=${user.id}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Teacher assigned classes:', data)
        
        // Transform the data to match our interface
        const transformedClasses = data.classes?.map((cls: any) => {
          console.log('Processing class:', cls)
          return {
            class_id: cls.id || cls.class_id,
            class_name: cls.class_name || cls.name || 'Unknown Class',
            grade_name: cls.grade_name || `Grade ${cls.grade_level || 'Unknown'}`,
            total_students: cls.total_students || 0,
            present_today: 0, // Will be calculated when we load attendance data
            absent_today: 0,  // Will be calculated when we load attendance data
            attendance_rate: 0 // Will be calculated when we load attendance data
          }
        }) || []
        
        console.log('Transformed teacher classes:', transformedClasses)
        console.log('Number of classes to display:', transformedClasses.length)
        setClasses(transformedClasses)
        
        if (transformedClasses.length === 0) {
          console.warn('No classes found after transformation - check API response structure')
        }
      } else if (response.status === 404) {
        // If the endpoint doesn't exist, fall back to the analytics approach
        console.log('Assigned classes endpoint not found, using analytics approach...')
        
        const analyticsResponse = await fetch(`/api/teacher/dashboard-analytics?teacher_id=${user.id}`, {
          credentials: 'include'
        })
        
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          console.log('Analytics data received:', analyticsData)
          
          // Since analytics shows the teacher has assigned classes, 
          // we need to get only the teacher's specific assignments
          // For now, show a message that we need to create the proper endpoint
          console.log('Teacher has class assignments but need specific endpoint')
          setClasses([])
        } else {
          console.error('Failed to fetch analytics:', analyticsResponse.status)
          setClasses([])
        }
      } else {
        console.error('Failed to fetch assigned classes:', response.status)
        setClasses([])
      }
      
    } catch (error) {
      console.error('Error fetching teacher classes:', error)
      setClasses([])
    } finally {
      setLoading(false)
    }
  }


  const fetchStudents = async (classId: string) => {
    setLoading(true)
    try {
      console.log('Fetching real students for class:', classId)
      
      if (!user?.id) {
        console.error('No user ID available for students')
        setStudents([])
        setSummary(null)
        setLoading(false)
        return
      }
      
      // Get school_id from analytics first
      const analyticsResponse = await fetch(`/api/teacher/dashboard-analytics?teacher_id=${user.id}`, {
        credentials: 'include'
      })
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        const schoolId = analyticsData.teacher?.school_id || analyticsData.school_id
        
        if (schoolId) {
          console.log('Using school_id for students:', schoolId)
          
          // Use the same API that works in the teacher students section
          const studentsResponse = await fetch(`/api/teacher/students?school_id=${schoolId}&class_id=${classId}`, {
            credentials: 'include'
          })
          
          if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json()
            console.log('Students data received:', studentsData)
            
            const students = studentsData.students || []
            
            // Try to get existing attendance data for these students
            let attendanceMap = new Map()
            try {
              const attendanceResponse = await fetch(`/api/attendance?date=${selectedDate}`, {
                credentials: 'include'
              })
              
              if (attendanceResponse.ok) {
                const attendanceData = await attendanceResponse.json()
                attendanceData.students?.forEach((record: any) => {
                  attendanceMap.set(record.student_id, {
                    status: record.status || record.attendance_status,
                    notes: record.notes,
                    marked_at: record.marked_at || record.created_at
                  })
                })
                console.log('Attendance data loaded:', attendanceData.students?.length || 0, 'records')
              } else {
                console.log('No existing attendance data found')
              }
            } catch (attendanceError) {
              console.log('Attendance table may not exist yet:', attendanceError)
            }
            
            // Combine students with attendance data
            const studentsWithAttendance = students.map((student: any) => ({
              id: student.id,
              first_name: student.first_name,
              last_name: student.last_name,
              student_number: student.student_number,
              attendance: attendanceMap.get(student.id) || null
            }))
            
            console.log('Students with attendance:', studentsWithAttendance)
            setStudents(studentsWithAttendance)
            
            // Calculate summary
            const totalStudents = studentsWithAttendance.length
            const presentCount = studentsWithAttendance.filter((s: any) => s.attendance?.status === 'present').length
            const absentCount = studentsWithAttendance.filter((s: any) => s.attendance?.status === 'absent').length
            const lateCount = studentsWithAttendance.filter((s: any) => s.attendance?.status === 'late').length
            const excusedCount = studentsWithAttendance.filter((s: any) => s.attendance?.status === 'excused').length
            const attendanceRate = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0
            
            setSummary({
              total_students: totalStudents,
              present_count: presentCount,
              absent_count: absentCount,
              late_count: lateCount,
              excused_count: excusedCount,
              attendance_rate: attendanceRate
            })
            
          } else {
            console.error('Failed to fetch students:', studentsResponse.status)
            setStudents([])
            setSummary(null)
          }
        } else {
          console.error('No school_id found for students')
          setStudents([])
          setSummary(null)
        }
      } else {
        console.error('Failed to fetch analytics for students:', analyticsResponse.status)
        setStudents([])
        setSummary(null)
      }
      
    } catch (error) {
      console.error('Error fetching students:', error)
      setStudents([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const updateAttendance = async (studentId: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          student_id: studentId,
          status,
          notes,
          date: selectedDate
        })
      })

      if (response.ok) {
        // Update local state
        setStudents(prev => prev.map(student => 
          student.id === studentId 
            ? {
                ...student,
                attendance: {
                  status: status as any,
                  notes,
                  marked_at: new Date().toISOString()
                }
              }
            : student
        ))
        
        // Refresh summary
        if (selectedClass) {
          fetchStudents(selectedClass.class_id)
        }
      } else {
        console.error('Failed to update attendance')
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
    }
  }

  const saveAllAttendance = async () => {
    if (!selectedClass) return
    
    setSaving(true)
    try {
      const attendanceData = students
        .filter(student => student.attendance)
        .map(student => ({
          student_id: student.id,
          status: student.attendance!.status,
          notes: student.attendance!.notes
        }))

      const response = await fetch('/api/teacher/attendance/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          class_id: selectedClass.class_id,
          attendance_data: attendanceData,
          date: selectedDate
        })
      })

      if (response.ok) {
        fetchStudents(selectedClass.class_id)
      } else {
        console.error('Failed to save attendance')
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAttendance = (status: 'present' | 'absent' | 'late' | 'excused') => {
    const studentsToUpdate = selectedStudents.size > 0 
      ? Array.from(selectedStudents) 
      : getFilteredStudents().map(s => s.id)
    
    studentsToUpdate.forEach(studentId => {
      updateAttendance(studentId, status)
    })
    
    setSelectedStudents(new Set())
    setBulkStatus(null)
  }

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedStudents(newSelection)
  }

  const selectAllFiltered = () => {
    const filteredIds = getFilteredStudents().map(s => s.id)
    setSelectedStudents(new Set(filteredIds))
  }

  const clearSelection = () => {
    setSelectedStudents(new Set())
  }

  const navigateBack = () => {
    if (currentView === 'students') {
      setCurrentView('classes')
      setSelectedClass(null)
      setStudents([])
      setSummary(null)
    }
    // No need to go back from classes view since it's the main view now
  }

  const getFilteredStudents = () => {
    return students.filter(student => {
      const matchesSearch = searchTerm === '' || 
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'unmarked' && !student.attendance) ||
        (student.attendance && student.attendance.status === statusFilter)
      
      return matchesSearch && matchesStatus
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200'
      case 'absent': return 'bg-red-100 text-red-800 border-red-200'
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'excused': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />
      case 'absent': return <XCircle className="h-4 w-4" />
      case 'late': return <Clock className="h-4 w-4" />
      case 'excused': return <AlertCircle className="h-4 w-4" />
      default: return <UserCheck className="h-4 w-4" />
    }
  }

  // Removed grade filtering since we now have hierarchical navigation
  const filteredStudents = getFilteredStudents()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {currentView === 'students' && (
            <Button
              variant="outline"
              size="sm"
              onClick={navigateBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Classes
            </Button>
          )}
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-green-600" />
              {currentView === 'classes' && 'My Assigned Classes'}
              {currentView === 'students' && `${selectedClass?.class_name} Attendance`}
            </h2>
            <p className="text-gray-600 mt-1">
              {currentView === 'classes' && 'Select a class to take attendance'}
              {currentView === 'students' && `Mark attendance for ${selectedDate}`}
            </p>
          </div>
        </div>
        
        {currentView === 'students' && (
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <Button
              onClick={saveAllAttendance}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save All
            </Button>
          </div>
        )}
      </div>

      {/* Classes View */}
      {currentView === 'classes' && (
        <>
          {loading && (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading your assigned classes...</p>
            </div>
          )}
          
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classInfo) => {
            console.log('Rendering class card:', classInfo)
            return (
            <motion.div
              key={classInfo.class_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-green-300"
                onClick={() => {
                  setSelectedClass(classInfo)
                  setCurrentView('students')
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{classInfo.class_name}</h3>
                        <p className="text-sm text-gray-600">{classInfo.grade_name}</p>
                      </div>
                    </div>
                    <Badge className={`${
                      classInfo.attendance_rate >= 90 ? 'bg-green-100 text-green-800' :
                      classInfo.attendance_rate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {classInfo.attendance_rate}%
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-lg font-bold text-blue-600">{classInfo.total_students}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-lg font-bold text-green-600">{classInfo.present_today}</p>
                      <p className="text-xs text-gray-600">Present</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <p className="text-lg font-bold text-red-600">{classInfo.absent_today}</p>
                      <p className="text-xs text-gray-600">Absent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            )
          })}
          
          {classes.length === 0 && (
            <div className="col-span-full text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                No classes assigned to you. Contact your administrator if this seems incorrect.
              </p>
            </div>
          )}
            </div>
          )}
        </>
      )}

      {/* Students View */}
      {currentView === 'students' && (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.total_students}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Present</p>
                      <p className="text-2xl font-bold text-green-600">{summary.present_count}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Absent</p>
                      <p className="text-2xl font-bold text-red-600">{summary.absent_count}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Late</p>
                      <p className="text-2xl font-bold text-yellow-600">{summary.late_count}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Rate</p>
                      <p className="text-2xl font-bold text-blue-600">{summary.attendance_rate}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Bulk Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="unmarked">Unmarked</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>

                <div className="flex gap-2">
                  {selectedStudents.size > 0 ? (
                    <>
                      <Button size="sm" variant="outline" onClick={clearSelection}>
                        Clear ({selectedStudents.size})
                      </Button>
                      <Button size="sm" onClick={() => handleBulkAttendance('present')} className="bg-green-600 hover:bg-green-700 text-white">
                        Mark Present
                      </Button>
                      <Button size="sm" onClick={() => handleBulkAttendance('absent')} className="bg-red-600 hover:bg-red-700 text-white">
                        Mark Absent
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={selectAllFiltered}>
                        Select All ({filteredStudents.length})
                      </Button>
                      <Button size="sm" onClick={() => handleBulkAttendance('present')} className="bg-green-600 hover:bg-green-700 text-white">
                        All Present
                      </Button>
                      <Button size="sm" onClick={() => handleBulkAttendance('absent')} className="bg-red-600 hover:bg-red-700 text-white">
                        All Absent
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle>Students ({filteredStudents.length})</CardTitle>
              <CardDescription>
                Click on attendance buttons to mark status, or use checkboxes for bulk actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleStudentSelection(student.id)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        {selectedStudents.has(student.id) ? 
                          <CheckSquare className="h-5 w-5 text-blue-600" /> : 
                          <Square className="h-5 w-5" />
                        }
                      </button>
                      
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </h3>
                        {student.student_number && (
                          <p className="text-sm text-gray-600">ID: {student.student_number}</p>
                        )}
                      </div>
                      
                      {student.attendance && (
                        <Badge className={`${getStatusColor(student.attendance.status)} flex items-center gap-1`}>
                          {getStatusIcon(student.attendance.status)}
                          {student.attendance.status.charAt(0).toUpperCase() + student.attendance.status.slice(1)}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {student.attendance?.notes && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowNotes(showNotes === student.id ? null : student.id)}
                        >
                          {showNotes === student.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      )}
                      
                      <div className="flex gap-1">
                        {['present', 'absent', 'late', 'excused'].map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={student.attendance?.status === status ? "default" : "outline"}
                            onClick={() => updateAttendance(student.id, status)}
                            className={`${
                              student.attendance?.status === status 
                                ? getStatusColor(status).replace('bg-', 'bg-').replace('text-', 'text-white ').replace('border-', 'border-')
                                : ''
                            }`}
                          >
                            {getStatusIcon(status)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredStudents.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {students.length === 0 
                      ? "No students found in this class."
                      : "No students found matching your filters"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Display */}
          <AnimatePresence>
            {showNotes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const student = students.find(s => s.id === showNotes)
                      return student?.attendance?.notes ? (
                        <p className="text-gray-700">{student.attendance.notes}</p>
                      ) : (
                        <p className="text-gray-500 italic">No notes for this student</p>
                      )
                    })()}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
