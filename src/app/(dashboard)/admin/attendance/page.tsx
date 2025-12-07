'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector } from '@/lib/redux/hooks'
import { Button } from '@/components/ui/button'
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar as CalendarIcon,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { CalendarHeatmap } from '@/components/admin/CalendarHeatmap'
import { ClassHeatmapCard } from '@/components/admin/ClassHeatmapCard'
import { StudentHeatmapGrid } from '@/components/admin/StudentHeatmapGrid'
import { AttendanceSkeleton } from './attendance-skeleton'
import { AttendanceDetailsPanel } from './attendance-details-panel'

interface ClassData {
  id: string
  className: string
  teacher: string
  grade: string
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  attendanceRate: number
  weeklyTrend: number[]
}

interface DayStats {
  date: string
  attendanceRate: number
  present: number
  absent: number
  late: number
  total: number
}

interface StudentData {
  id: string
  name: string
  attendance: { date: string; status: 'present' | 'absent' | 'late' | null }[]
  attendanceRate: number
}

// Animated Counter Component
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 30
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return <span>{displayValue}{suffix}</span>
}

// Stats Card Component - Memoized for performance
const StatsCard = memo(function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  index = 0
}: {
  title: string
  value: number
  subtitle: string
  icon: any
  color: 'green' | 'red' | 'yellow' | 'blue'
  trend?: number
  index?: number
}) {
  const colors = {
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-rose-600',
    yellow: 'from-yellow-500 to-amber-600',
    blue: 'from-blue-500 to-indigo-600'
  }

  const bgColors = {
    green: 'bg-gradient-to-br from-green-500/20 to-emerald-500/10',
    red: 'bg-gradient-to-br from-red-500/20 to-rose-500/10',
    yellow: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/10',
    blue: 'bg-gradient-to-br from-blue-500/20 to-indigo-500/10'
  }

  const iconColors = {
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600'
  }

  const shadowColors = {
    green: 'shadow-green-500/10',
    red: 'shadow-red-500/10',
    yellow: 'shadow-yellow-500/10',
    blue: 'shadow-blue-500/10'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index * 0.05, 0.2), type: 'spring', stiffness: 100 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-xl ${shadowColors[color]} hover:shadow-2xl active:scale-[0.98] transition-all duration-200 group touch-manipulation`}
    >
      {/* Decorative gradient blur - hidden on mobile for performance */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-bl from-blue-100/50 via-purple-100/30 to-transparent dark:from-blue-900/20 dark:via-purple-900/10 rounded-full blur-3xl hidden sm:block" />

      {/* Pulse ring on hover */}
      <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}>
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${colors[color]} opacity-5`} />
      </div>

      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{title}</p>
          <p className={`text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold mt-1 sm:mt-2 bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent`}>
            <AnimatedCounter value={value} />
          </p>
          <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 truncate">{subtitle}</p>
        </div>

        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl ${bgColors[color]} shadow-lg flex-shrink-0`}
        >
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 ${iconColors[color]}`} />
        </motion.div>
      </div>

      {trend !== undefined && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(index * 0.05 + 0.2, 0.4) }}
          className={`mt-2 sm:mt-3 lg:mt-4 pt-2 sm:pt-3 lg:pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs lg:text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
        >
          {trend >= 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
          <span className="font-medium truncate">{Math.abs(trend)}% vs last week</span>
        </motion.div>
      )}
    </motion.div>
  )
})

export default function AttendancePage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [classData, setClassData] = useState<ClassData[]>([])
  const [dailyStats, setDailyStats] = useState<DayStats[]>([])
  const [totalStats, setTotalStats] = useState<any>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Modal & Panel state
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [studentData, setStudentData] = useState<StudentData[]>([])
  const [studentDates, setStudentDates] = useState<string[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [showStudentGrid, setShowStudentGrid] = useState(false)
  const [showDetailsPanel, setShowDetailsPanel] = useState(false)

  const { profile } = useAppSelector((state) => state.auth)
  const schoolId = profile?.school_id || ''

  // Fetch attendance data
  const fetchAttendance = useCallback(async (isRefresh = false) => {
    if (!schoolId) {
      setLoading(false)
      return
    }

    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const params = new URLSearchParams({
        school_id: schoolId,
        date: dateStr,
        page: '1',
        limit: '100'
      })

      const response = await fetch(`/api/admin/attendance?${params}`)

      if (!response.ok) throw new Error('Failed to fetch attendance')

      const result = await response.json()

      if (result.data) {
        const { classes, summary, attendance } = result.data

        // Transform class data
        const transformedClasses = (classes || []).map((c: any) => ({
          ...c,
          id: c.className, // Fallback ID
          weeklyTrend: [0, 0, 0, 0, 0, 0, c.attendanceRate] // Placeholder for real history trend if not available
        }))

        setClassData(transformedClasses)
        setTotalStats(summary || {})
        setAttendanceRecords(attendance || [])

        // NOTE: Real daily history for the heatmap would require a separate aggregate endpoint.
        // For now, we update the CURRENT day in the heatmap with real stats.
        setDailyStats(prev => {
          // Create a new array if empty or update current day
          const newStats = [...prev]

          // If we don't have enough history, generate placeholder history but ensure today/selected is real
          if (newStats.length === 0) {
            for (let i = 34; i >= 0; i--) {
              const d = new Date()
              d.setDate(d.getDate() - i)
              newStats.push({
                date: d.toISOString().split('T')[0],
                attendanceRate: 0,
                present: 0,
                absent: 0,
                late: 0,
                total: 0
              })
            }
          }

          // Update the specific date stat
          const index = newStats.findIndex(s => s.date === dateStr)
          if (index !== -1 && summary) {
            newStats[index] = {
              date: dateStr,
              attendanceRate: summary.attendance_rate,
              present: summary.present_count,
              absent: summary.absent_count,
              late: summary.late_count,
              total: summary.total_students
            }
          }
          return newStats
        })
      }
    } catch (error: any) {
      console.error('Error fetching attendance:', error)
      setError(error?.message || 'Failed to load attendance data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [schoolId, selectedDate])

  useEffect(() => {
    if (schoolId) fetchAttendance()
  }, [fetchAttendance, schoolId])

  // Fetch student heatmap data
  const fetchStudentData = async (className: string) => {
    setLoadingStudents(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const params = new URLSearchParams({
        school_id: schoolId,
        class_name: className,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      })

      const response = await fetch(`/api/admin/attendance/heatmap?${params}`)
      if (!response.ok) throw new Error('Failed to fetch student data')

      const data = await response.json()

      // Calculate attendance rate for each student
      const studentsWithRate = (data.students || []).map((s: any) => {
        const presentDays = s.attendance.filter((a: any) => a.status === 'present').length
        const totalDays = s.attendance.filter((a: any) => a.status !== null).length
        return {
          ...s,
          attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
        }
      })

      setStudentData(studentsWithRate)
      setStudentDates(data.dates || [])

      if (studentsWithRate.length > 0) {
        setShowStudentGrid(true)
      } else {
        setError(`No students assigned to "${className}" class.`)
      }
    } catch (error: any) {
      console.error('Error fetching student data:', error)
      setError(error?.message || 'Failed to load student attendance data')
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleClassClick = (classItem: ClassData) => {
    setSelectedClass(classItem)
    fetchStudentData(classItem.className)
  }

  const handleDateClick = async (date: string) => {
    const newDate = new Date(date)
    setSelectedDate(newDate)
    setShowDetailsPanel(true)
    // fetchAttendance will automatically trigger due to dependency on selectedDate
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    if (newDate <= new Date()) {
      setSelectedDate(newDate)
    }
  }

  const totalStudents = totalStats?.total_students || 0
  const totalPresent = totalStats?.present_count || 0
  const totalAbsent = totalStats?.absent_count || 0
  const totalLate = totalStats?.late_count || 0
  const overallRate = totalStats?.attendance_rate || 0

  if (loading && dailyStats.length === 0) {
    return <AttendanceSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex">
      {/* Main Content - Shifts when panel is open on wider screens if we wanted, but overlay is fine */}
      <div className="flex-1 min-w-0 transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <Link href="/admin" className="lg:hidden">
                  <Button variant="ghost" size="sm" className="p-1.5 sm:p-2">
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </Link>
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg sm:rounded-xl shadow-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white">
                    Attendance
                  </h1>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                    Real-time tracking and analytics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Mobile Date Picker */}
                <div className="flex lg:hidden items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 py-1">
                  <Button variant="ghost" size="sm" className="p-1 h-7 w-7" onClick={() => navigateDate('prev')}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    max={new Date().toISOString().split('T')[0]}
                    className="text-xs border-0 focus:outline-none bg-transparent cursor-pointer w-[90px]"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-7 w-7"
                    onClick={() => navigateDate('next')}
                    disabled={selectedDate.toDateString() === new Date().toDateString()}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Desktop Date Picker */}
                <div className="hidden lg:flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2">
                  <Button variant="ghost" size="sm" className="p-2" onClick={() => navigateDate('prev')}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-2 px-2">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      max={new Date().toISOString().split('T')[0]}
                      className="text-sm border-0 focus:outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    onClick={() => navigateDate('next')}
                    disabled={selectedDate.toDateString() === new Date().toDateString()}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchAttendance(true)}
                  disabled={refreshing}
                  className="p-1.5 sm:p-2 h-8 w-8 sm:h-9 sm:w-9"
                >
                  <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>

                <Link href="/admin" className="hidden lg:block">
                  <Button variant="outline" size="sm" className="text-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3"
            >
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-red-900 truncate">{error}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setError(null); fetchAttendance() }}
                className="border-red-300 text-red-700 text-xs sm:text-sm flex-shrink-0"
              >
                Retry
              </Button>
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <StatsCard
              title="Present Today"
              value={totalPresent}
              subtitle={`${overallRate}% attendance rate`}
              icon={UserCheck}
              color="green"
              trend={undefined}
              index={0}
            />
            <StatsCard
              title="Absent Today"
              value={totalAbsent}
              subtitle={totalStudents ? `${((totalAbsent / totalStudents) * 100).toFixed(1)}% of total` : '0%'}
              icon={UserX}
              color="red"
              trend={undefined}
              index={1}
            />
            <StatsCard
              title="Late Today"
              value={totalLate}
              subtitle="Tardiness count"
              icon={Clock}
              color="yellow"
              index={2}
            />
            <StatsCard
              title="Total Students"
              value={totalStudents}
              subtitle={`${classData.length} classes`}
              icon={Users}
              color="blue"
              index={3}
            />
          </div>

          {/* Calendar Heatmap */}
          {/* We pass onDateClick to enable interactions */}
          <CalendarHeatmap
            data={dailyStats}
            onDateClick={handleDateClick}
            selectedDate={selectedDate.toISOString().split('T')[0]}
          />

          {/* Class Cards Section */}
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Class Attendance</h2>
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500">Click a class to view student heatmap</p>
              </div>
            </div>

            {classData.length === 0 ? (
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 text-center border border-gray-200/50">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Class Data Available
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                  Class attendance summaries require students to be assigned to classes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                {classData.map((classItem, index) => (
                  <motion.div
                    key={classItem.id || index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  >
                    <ClassHeatmapCard
                      data={classItem}
                      onClick={() => handleClassClick(classItem)}
                      isSelected={selectedClass?.className === classItem.className}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side Panels */}
      <AnimatePresence>
        {showDetailsPanel && (
          <AttendanceDetailsPanel
            date={selectedDate.toISOString().split('T')[0]}
            records={attendanceRecords}
            loading={loading}
            onClose={() => setShowDetailsPanel(false)}
          />
        )}

        {showStudentGrid && selectedClass && (
          <StudentHeatmapGrid
            students={studentData}
            dates={studentDates}
            className={selectedClass.className}
            onClose={() => {
              setShowStudentGrid(false)
              setSelectedClass(null)
              setStudentData([])
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
