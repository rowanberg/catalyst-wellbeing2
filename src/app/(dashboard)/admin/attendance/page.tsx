'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Download,
  Bell,
  MapPin,
  Phone,
  Mail
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

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([])
  const [attendanceAlerts, setAttendanceAlerts] = useState<AttendanceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')

  // Mock data for demonstration
  useEffect(() => {
    const mockRecords: AttendanceRecord[] = [
      {
        id: '1',
        studentName: 'Emma Johnson',
        grade: '5',
        className: '5A',
        date: '2024-01-15',
        status: 'absent',
        reason: 'Sick',
        parentNotified: true
      },
      {
        id: '2',
        studentName: 'Michael Chen',
        grade: '6',
        className: '6A',
        date: '2024-01-15',
        status: 'late',
        timeIn: '8:45 AM',
        reason: 'Transportation delay',
        parentNotified: false
      },
      {
        id: '3',
        studentName: 'Sarah Williams',
        grade: '7',
        className: '7A',
        date: '2024-01-15',
        status: 'present',
        timeIn: '8:15 AM',
        timeOut: '3:30 PM',
        parentNotified: false
      },
      {
        id: '4',
        studentName: 'David Rodriguez',
        grade: '5',
        className: '5B',
        date: '2024-01-15',
        status: 'excused',
        reason: 'Medical appointment',
        parentNotified: true
      }
    ]

    const mockClassAttendance: ClassAttendance[] = [
      {
        className: '5A',
        grade: '5',
        teacher: 'Ms. Johnson',
        totalStudents: 24,
        presentCount: 22,
        absentCount: 1,
        lateCount: 1,
        attendanceRate: 91.7
      },
      {
        className: '5B',
        grade: '5',
        teacher: 'Mr. Smith',
        totalStudents: 22,
        presentCount: 20,
        absentCount: 2,
        lateCount: 0,
        attendanceRate: 90.9
      },
      {
        className: '6A',
        grade: '6',
        teacher: 'Ms. Rodriguez',
        totalStudents: 26,
        presentCount: 24,
        absentCount: 1,
        lateCount: 1,
        attendanceRate: 92.3
      },
      {
        className: '7A',
        grade: '7',
        teacher: 'Mr. Thompson',
        totalStudents: 25,
        presentCount: 23,
        absentCount: 2,
        lateCount: 0,
        attendanceRate: 92.0
      }
    ]

    const mockAlerts: AttendanceAlert[] = [
      {
        id: '1',
        studentName: 'Emma Johnson',
        type: 'chronic_absence',
        message: 'Has been absent 8 days in the past month',
        severity: 'high',
        daysCount: 8
      },
      {
        id: '2',
        studentName: 'Alex Thompson',
        type: 'pattern_concern',
        message: 'Frequently late on Mondays (4 times this month)',
        severity: 'medium',
        daysCount: 4
      },
      {
        id: '3',
        studentName: 'Jordan Smith',
        type: 'unexcused',
        message: '3 unexcused absences this week',
        severity: 'high',
        daysCount: 3
      }
    ]
    
    setTimeout(() => {
      setAttendanceRecords(mockRecords)
      setClassAttendance(mockClassAttendance)
      setAttendanceAlerts(mockAlerts)
      setLoading(false)
    }, 1000)
  }, [])

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

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.className.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter
    const matchesGrade = gradeFilter === 'all' || record.grade === gradeFilter
    return matchesSearch && matchesStatus && matchesGrade
  })

  const totalStudents = classAttendance.reduce((sum, cls) => sum + cls.totalStudents, 0)
  const totalPresent = classAttendance.reduce((sum, cls) => sum + cls.presentCount, 0)
  const totalAbsent = classAttendance.reduce((sum, cls) => sum + cls.absentCount, 0)
  const totalLate = classAttendance.reduce((sum, cls) => sum + cls.lateCount, 0)
  const overallRate = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Attendance Management
                </h1>
                <p className="text-gray-600 mt-1">Track and manage student attendance across all classes</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-3">
              <ClientWrapper>
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white/80">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white/80">
                  <Bell className="w-4 h-4 mr-2" />
                  Send Notifications
                </Button>
              </ClientWrapper>
              <Link href="/admin">
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white/80">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Present Today</p>
                    <p className="text-3xl font-bold">{totalPresent}</p>
                    <p className="text-green-100 text-xs">{overallRate}% attendance rate</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Absent Today</p>
                    <p className="text-3xl font-bold">{totalAbsent}</p>
                    <p className="text-red-100 text-xs">{((totalAbsent / totalStudents) * 100).toFixed(1)}% of students</p>
                  </div>
                  <UserX className="w-8 h-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Late Today</p>
                    <p className="text-3xl font-bold">{totalLate}</p>
                    <p className="text-yellow-100 text-xs">Tardiness incidents</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Active Alerts</p>
                    <p className="text-3xl font-bold">{attendanceAlerts.length}</p>
                    <p className="text-purple-100 text-xs">Require attention</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm shadow-lg rounded-xl p-1">
            <TabsTrigger value="daily">Daily View</TabsTrigger>
            <TabsTrigger value="classes">By Class</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
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
              {filteredRecords.map((record, index) => (
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
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {classAttendance.map((classData, index) => (
                <motion.div
                  key={classData.className}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Class {classData.className}</CardTitle>
                          <CardDescription>
                            {classData.teacher} • Grade {classData.grade}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{classData.attendanceRate}%</div>
                          <div className="text-sm text-gray-600">Attendance Rate</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-lg font-semibold text-green-600">{classData.presentCount}</div>
                            <div className="text-xs text-green-600">Present</div>
                          </div>
                          <div className="p-3 bg-red-50 rounded-lg">
                            <div className="text-lg font-semibold text-red-600">{classData.absentCount}</div>
                            <div className="text-xs text-red-600">Absent</div>
                          </div>
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <div className="text-lg font-semibold text-yellow-600">{classData.lateCount}</div>
                            <div className="text-xs text-yellow-600">Late</div>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${classData.attendanceRate}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Total Students: {classData.totalStudents}</span>
                          <span>{classData.presentCount}/{classData.totalStudents} present</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
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

          <TabsContent value="reports" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Attendance Reports</CardTitle>
                <CardDescription>Generate detailed attendance reports and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Reporting</h3>
                  <p className="text-gray-600 mb-6">Comprehensive attendance reports and trend analysis tools.</p>
                  <ClientWrapper>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </ClientWrapper>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
