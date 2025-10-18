'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector } from '@/lib/redux/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle,
  Search,
  Download,
  Bell,
  Phone,
  Mail,
  Loader,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface AttendanceRecord {
  id: string
  studentName: string
  grade: string
  className: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  timeIn?: string
  timeOut?: string
  reason?: string
  parentNotified: boolean
}

interface ClassAttendance {
  className: string
  grade: string
  teacher: string
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  attendanceRate: number
}

interface AttendanceAlert {
  id: string
  studentName: string
  type: 'chronic_absence' | 'pattern_concern' | 'unexcused'
  message: string
  severity: 'low' | 'medium' | 'high'
  daysCount: number
}

// Skeleton Loader Components
const StatCardSkeleton = () => (
  <Card className="bg-white border border-gray-200 shadow-sm">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    </CardContent>
  </Card>
)

const ClassCardSkeleton = () => (
  <Card className="bg-white border border-gray-200 shadow-sm">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="text-right">
          <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-1 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="h-3 bg-gray-200 rounded-full w-full animate-pulse"></div>
      </div>
    </CardContent>
  </Card>
)

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([])
  const [attendanceAlerts, setAttendanceAlerts] = useState<AttendanceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalStats, setTotalStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Get school ID from authenticated user profile - using proper Redux state
  const { profile, user } = useAppSelector((state) => state.auth)
  const schoolId = profile?.school_id || ''

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch attendance data from API
  const fetchAttendance = useCallback(async (pageNum: number = 1, isRefresh = false) => {
    if (!schoolId) {
      setLoading(false)
      return
    }
    
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const params = new URLSearchParams({
        school_id: schoolId,
        date: dateStr,
        page: pageNum.toString(),
        limit: '50',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(gradeFilter !== 'all' && { grade: gradeFilter }),
        ...(debouncedSearch && { search: debouncedSearch })
      })

      const response = await fetch(`/api/admin/attendance?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance')
      }

      const result = await response.json()

      if (result.data) {
        const { attendance, classes, summary, pagination } = result.data
        
        setAttendanceRecords(attendance || [])
        setClassAttendance(classes || [])
        setTotalStats(summary || {})
        setHasMore(pageNum < (pagination?.totalPages || 0))
        
        // Simple alerts - can be enhanced with real data
        setAttendanceAlerts([])
      }
    } catch (error: any) {
      console.error('Error fetching attendance:', error)
      setError(error?.message || 'Failed to load attendance data')
      setAttendanceRecords([])
      setClassAttendance([])
      setTotalStats(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [schoolId, selectedDate, statusFilter, gradeFilter, debouncedSearch])

  // Fetch on mount and when filters change
  useEffect(() => {
    if (schoolId) {
      setPage(1)
      fetchAttendance(1, false)
    }
  }, [fetchAttendance, schoolId])

  // Memoized filtered records for better performance
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const matchesSearch = !searchTerm || 
        record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.className.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter
      const matchesGrade = gradeFilter === 'all' || record.grade === gradeFilter
      return matchesSearch && matchesStatus && matchesGrade
    })
  }, [attendanceRecords, searchTerm, statusFilter, gradeFilter])

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
      case 'present': return <UserCheck className="w-4 h-4" />
      case 'absent': return <UserX className="w-4 h-4" />
      case 'late': return <Clock className="w-4 h-4" />
      case 'excused': return <CheckCircle className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }


  const totalStudents = totalStats?.total_students || 0
  const totalPresent = totalStats?.present_count || 0
  const totalAbsent = totalStats?.absent_count || 0
  const totalLate = totalStats?.late_count || 0
  const overallRate = totalStats?.attendance_rate || 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse"></div>
                <div>
                  <div className="h-7 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className="bg-white border border-gray-200 rounded-lg p-1">
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <ClassCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4">
              <Link href="/admin" className="md:hidden">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="p-2 md:p-3 bg-blue-600 rounded-lg">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                  Attendance Management
                </h1>
                <p className="text-xs md:text-sm text-gray-600">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Date Picker */}
              <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value)
                    setSelectedDate(newDate)
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  className="text-sm border-0 focus:outline-none focus:ring-0 bg-transparent cursor-pointer"
                />
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => fetchAttendance(1, true)}
                disabled={refreshing}
                className="hover:bg-gray-100"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <Link href="/admin" className="hidden md:block">
                <Button variant="outline" size="sm" className="border-gray-300">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Error Banner */}
        {error && (
          <Card className="bg-red-50 border-red-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900">Error Loading Data</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setError(null)
                    fetchAttendance(1)
                  }}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 font-medium">Present</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">{totalPresent}</p>
                  <p className="text-xs text-gray-500">{overallRate}% rate</p>
                </div>
                <div className="p-2 md:p-3 bg-green-100 rounded-lg">
                  <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 font-medium">Absent</p>
                  <p className="text-2xl md:text-3xl font-bold text-red-600">{totalAbsent}</p>
                  <p className="text-xs text-gray-500">{totalStudents ? ((totalAbsent / totalStudents) * 100).toFixed(1) : 0}%</p>
                </div>
                <div className="p-2 md:p-3 bg-red-100 rounded-lg">
                  <UserX className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 font-medium">Late</p>
                  <p className="text-2xl md:text-3xl font-bold text-yellow-600">{totalLate}</p>
                  <p className="text-xs text-gray-500">Tardiness</p>
                </div>
                <div className="p-2 md:p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-gray-600 font-medium">Total</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-600">{totalStudents}</p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
                <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="classes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
            <TabsTrigger value="classes" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">By Class</TabsTrigger>
            <TabsTrigger value="daily" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Daily View</TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Alerts</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-6">
            {/* Filters */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search students or classes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="excused">Excused</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Filter by grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      <SelectItem value="5">Grade 5</SelectItem>
                      <SelectItem value="6">Grade 6</SelectItem>
                      <SelectItem value="7">Grade 7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Records */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {attendanceRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{record.studentName}</h3>
                          <p className="text-sm text-gray-600">Grade {record.grade} • Class {record.className}</p>
                        </div>
                        <Badge variant="outline" className={getStatusColor(record.status)}>
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(record.status)}
                            <span className="capitalize">{record.status}</span>
                          </span>
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span>{new Date(record.date).toLocaleDateString()}</span>
                        </div>
                        
                        {record.timeIn && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Time In:</span>
                            <span>{record.timeIn}</span>
                          </div>
                        )}
                        
                        {record.timeOut && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Time Out:</span>
                            <span>{record.timeOut}</span>
                          </div>
                        )}
                        
                        {record.reason && (
                          <div className="flex items-start justify-between">
                            <span className="text-gray-600">Reason:</span>
                            <span className="text-right max-w-32">{record.reason}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Parent Notified:</span>
                          <span className={record.parentNotified ? 'text-green-600' : 'text-red-600'}>
                            {record.parentNotified ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      
                      {!record.parentNotified && record.status !== 'present' && (
                        <div className="mt-4 pt-4 border-t">
                          <ClientWrapper>
                            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                              <Phone className="w-4 h-4 mr-2" />
                              Notify Parent
                            </Button>
                          </ClientWrapper>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {attendanceRecords.length === 0 && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No Attendance Records</h3>
                  <p className="text-sm text-gray-600">No attendance has been marked for the selected date and filters.</p>
                </CardContent>
              </Card>
            )}

            {attendanceRecords.length > 0 && (
              <div className="pt-4 text-center text-sm text-gray-500">
                Showing {filteredRecords.length} of {attendanceRecords.length} records
              </div>
            )}
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            {classAttendance.length === 0 && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No Class Data Available</h3>
                  <p className="text-sm text-gray-600 mb-4">Class summaries require students to be assigned to classes.</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Why is this empty?</strong>
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      Students with attendance records need to be assigned to classes in the student_class_assignments table.
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Next steps:</strong> Ensure students are enrolled in classes through the class management system.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {classAttendance.map((classData, index) => (
                <Card key={classData.className + index} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-gray-900">
                          {classData.className}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 mt-1">
                          <span className="font-medium text-blue-600">{classData.teacher}</span> • Grade {classData.grade}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">{classData.attendanceRate}%</div>
                        <div className="text-xs text-gray-500">Attendance</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-xl font-bold text-green-600">{classData.presentCount}</div>
                          <div className="text-xs text-green-600 font-medium">Present</div>
                        </div>
                        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-xl font-bold text-red-600">{classData.absentCount}</div>
                          <div className="text-xs text-red-600 font-medium">Absent</div>
                        </div>
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="text-xl font-bold text-yellow-600">{classData.lateCount}</div>
                          <div className="text-xs text-yellow-600 font-medium">Late</div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${classData.attendanceRate}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-100">
                        <span className="font-medium">Total: {classData.totalStudents}</span>
                        <span>{classData.presentCount}/{classData.totalStudents} present</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="space-y-4">
              {attendanceAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{alert.studentName}</h3>
                            <p className="text-sm text-gray-600 capitalize">{alert.type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                          {alert.severity} priority
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{alert.message}</p>
                      
                      <div className="flex items-center space-x-2">
                        <ClientWrapper>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Phone className="w-4 h-4 mr-2" />
                            Contact Parent
                          </Button>
                          <Button size="sm" variant="outline">
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </Button>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </ClientWrapper>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Attendance Reports</CardTitle>
                <CardDescription>Generate detailed attendance reports and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Advanced Reporting</h3>
                  <p className="text-sm text-gray-600 mb-6">Comprehensive attendance reports and trend analysis tools.</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
