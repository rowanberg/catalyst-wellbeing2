'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, BookOpen, Clock, Calendar,
  CheckCircle2, XCircle, Target, RefreshCw, ChevronDown,
  Award, BarChart3, User, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useDarkMode } from '@/contexts/DarkModeContext'

interface AnalyticsTabProps {
  studentId: string
  studentName?: string
}

// Enterprise Metric Card
const StatCard = ({ icon: Icon, label, value, change, trend, colorClass }: {
  icon: any
  label: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'stable'
  colorClass: string
}) => {
  const gradientClasses = {
    'blue': 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800',
    'emerald': 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800',
    'violet': 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 border-violet-200 dark:border-violet-800',
    'amber': 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800'
  }[colorClass] || 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800'

  const iconColors = {
    'blue': 'text-blue-500',
    'emerald': 'text-emerald-500',
    'violet': 'text-violet-500',
    'amber': 'text-amber-500'
  }[colorClass] || 'text-blue-500'

  const textColors = {
    'blue': 'text-blue-600 dark:text-blue-400',
    'emerald': 'text-emerald-600 dark:text-emerald-400',
    'violet': 'text-violet-600 dark:text-violet-400',
    'amber': 'text-amber-600 dark:text-amber-400'
  }[colorClass] || 'text-blue-600 dark:text-blue-400'

  const valueColors = {
    'blue': 'text-blue-900 dark:text-blue-100',
    'emerald': 'text-emerald-900 dark:text-emerald-100',
    'violet': 'text-violet-900 dark:text-violet-100',
    'amber': 'text-amber-900 dark:text-amber-100'
  }[colorClass] || 'text-blue-900 dark:text-blue-100'

  return (
    <div className={`${gradientClasses} rounded-lg p-3 lg:p-4 border`}>
      <div className="flex items-center justify-between mb-1.5 lg:mb-2">
        <span className={`text-[10px] lg:text-xs font-medium ${textColors} uppercase tracking-wider`}>{label}</span>
        <Icon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${iconColors}`} strokeWidth={2} />
      </div>
      <div className={`text-xl lg:text-2xl font-bold ${valueColors} mb-0.5 lg:mb-1`}>{value}</div>
      {change && trend && (
        <div className={`text-[10px] lg:text-xs font-medium ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
          trend === 'down' ? 'text-red-600 dark:text-red-400' :
            'text-slate-600 dark:text-slate-400'
          }`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'} {change}
        </div>
      )}
    </div>
  )
}

// GPA Trend Chart with Dark Mode
const GPATrendChart = ({ data, timeRange, onTimeRangeChange }: {
  data: any[]
  timeRange: string
  onTimeRangeChange: (range: string) => void
}) => {
  const maxGPA = 4.0
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = ((maxGPA - item.gpa) / maxGPA) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 lg:p-4 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3 lg:mb-4">
        <h3 className="text-sm lg:text-base font-semibold text-slate-900 dark:text-white">GPA Trend</h3>
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
          className="px-2 lg:px-3 py-1 lg:py-1.5 text-[10px] lg:text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-medium"
        >
          <option value="1week">1W</option>
          <option value="1month">1M</option>
          <option value="3months">3M</option>
          <option value="6months">6M</option>
          <option value="1year">1Y</option>
        </select>
      </div>

      <div className="relative h-48 lg:h-64">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.5" />

          <polygon
            points={`0,100 ${points} 100,100`}
            fill="url(#gpaGradient)"
            opacity="0.3"
          />

          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <defs>
            <linearGradient id="gpaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute -left-6 lg:-left-8 top-0 flex flex-col justify-between h-full text-[10px] lg:text-xs text-slate-500 dark:text-slate-400">
          <span>4.0</span>
          <span>3.0</span>
          <span>2.0</span>
          <span>1.0</span>
        </div>
      </div>

      <div className="flex justify-between text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 mt-2">
        {data.map((item, index) => (
          index % Math.ceil(data.length / 6) === 0 && (
            <span key={index}>{item.label}</span>
          )
        ))}
      </div>
    </div>
  )
}

// Subject Performance with Dark Mode
const SubjectPerformance = ({ subjects }: { subjects: any[] }) => (
  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 lg:p-4 border border-slate-200 dark:border-slate-800">
    <h3 className="text-sm lg:text-base font-semibold text-slate-900 dark:text-white mb-3 lg:mb-4">Subject Performance</h3>
    <div className="space-y-3 lg:space-y-4">
      {subjects.map((subject, index) => (
        <div key={subject.name}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-2">{subject.name}</span>
            <span className="text-xs lg:text-sm font-semibold text-slate-900 dark:text-white flex-shrink-0">{subject.score}%</span>
          </div>
          <div className="relative h-1.5 lg:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${subject.color}`}
              style={{ width: `${subject.score}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-0.5 lg:mt-1">
            <span className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 truncate pr-2">{subject.assignments} assignments</span>
            <span className={`text-[10px] lg:text-xs font-medium flex-shrink-0 ${subject.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : subject.trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
              }`}>
              {subject.trend === 'up' ? '↑' : subject.trend === 'down' ? '↓' : '—'} {subject.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Monthly Attendance Calendar with Dark Mode
const MonthlyAttendance = ({ attendanceData, currentMonth }: {
  attendanceData: any[]
  currentMonth: Date
}) => {
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const getAttendanceStatus = (day: number) => {
    const found = attendanceData.find(a => a.day === day)
    return found?.status || 'none'
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const stats = {
    present: attendanceData.filter(a => a.status === 'present').length,
    absent: attendanceData.filter(a => a.status === 'absent').length,
    late: attendanceData.filter(a => a.status === 'late').length,
    excused: attendanceData.filter(a => a.status === 'excused').length
  }

  return (
    <>
      {/* Calendar Grid */}
      <div className="mb-3 lg:mb-4">
        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 lg:gap-1.5 mb-1.5">
          {dayNames.map(day => (
            <div key={day} className="text-center text-[10px] lg:text-xs font-semibold text-gray-600 dark:text-gray-400 py-0.5">
              {day.slice(0, 1)}<span className="hidden sm:inline">{day.slice(1)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 lg:gap-1.5">
          {emptyDays.map(i => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map(day => {
            const status = getAttendanceStatus(day)
            return (
              <div
                key={day}
                className={`aspect-square flex items-center justify-center text-[10px] lg:text-xs font-medium rounded-md lg:rounded-lg transition-all ${status === 'present'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500'
                  : status === 'absent'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500'
                    : status === 'late'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-2 border-amber-500'
                      : status === 'excused'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                  }`}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats Legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 lg:gap-2">
        <div className="flex items-center gap-1.5 p-1.5 lg:p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg">
          <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-green-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] lg:text-[10px] text-gray-600 dark:text-gray-400 truncate">Present</p>
            <p className="text-xs lg:text-sm font-bold text-gray-900 dark:text-gray-100">{stats.present}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 lg:p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
          <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-red-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] lg:text-[10px] text-gray-600 dark:text-gray-400 truncate">Absent</p>
            <p className="text-xs lg:text-sm font-bold text-gray-900 dark:text-gray-100">{stats.absent}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 lg:p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
          <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] lg:text-[10px] text-gray-600 dark:text-gray-400 truncate">Late</p>
            <p className="text-xs lg:text-sm font-bold text-gray-900 dark:text-gray-100">{stats.late}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 lg:p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg">
          <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] lg:text-[10px] text-gray-600 dark:text-gray-400 truncate">Excused</p>
            <p className="text-xs lg:text-sm font-bold text-gray-900 dark:text-gray-100">{stats.excused}</p>
          </div>
        </div>
      </div>
    </>
  )
}

// Assignment Status with Dark Mode
const AssignmentCompletionChart = ({ completed, pending, overdue, total }: {
  completed: number
  pending: number
  overdue: number
  total: number
}) => {
  const completedPercent = (completed / total) * 100
  const pendingPercent = (pending / total) * 100
  const overduePercent = (overdue / total) * 100

  const completedAngle = (completedPercent / 100) * 360
  const pendingAngle = (pendingPercent / 100) * 360
  const overdueAngle = (overduePercent / 100) * 360

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 lg:p-4 border border-slate-200 dark:border-slate-800">
      <h3 className="text-sm lg:text-base font-semibold text-slate-900 dark:text-white mb-3 lg:mb-4">Assignment Status</h3>

      <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
        <div className="relative w-32 h-32 lg:w-40 lg:h-40 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="12" />

            <circle
              cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12"
              strokeDasharray={`${completedPercent * 2.51} ${251 - completedPercent * 2.51}`}
              strokeLinecap="round"
            />
            <circle
              cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12"
              strokeDasharray={`${pendingPercent * 2.51} ${251 - pendingPercent * 2.51}`}
              strokeDashoffset={`${-completedPercent * 2.51}`}
              strokeLinecap="round"
            />
            <circle
              cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12"
              strokeDasharray={`${overduePercent * 2.51} ${251 - overduePercent * 2.51}`}
              strokeDashoffset={`${-(completedPercent + pendingPercent) * 2.51}`}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{total}</p>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium">Total</p>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2 lg:space-y-2.5">
          <div className="flex items-center justify-between p-2 lg:p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg">
            <div className="flex items-center gap-2 lg:gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">Completed</span>
            </div>
            <span className="text-base lg:text-lg font-semibold text-slate-900 dark:text-white flex-shrink-0 ml-2">{completed}</span>
          </div>

          <div className="flex items-center justify-between p-2 lg:p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
            <div className="flex items-center gap-2 lg:gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">Pending</span>
            </div>
            <span className="text-base lg:text-lg font-semibold text-slate-900 dark:text-white flex-shrink-0 ml-2">{pending}</span>
          </div>

          <div className="flex items-center justify-between p-2 lg:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
            <div className="flex items-center gap-2 lg:gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">Overdue</span>
            </div>
            <span className="text-base lg:text-lg font-semibold text-slate-900 dark:text-white flex-shrink-0 ml-2">{overdue}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Analytics Tab Component
export default function AnalyticsTab({ studentId, studentName }: AnalyticsTabProps) {
  const { isDarkMode } = useDarkMode()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('1month')
  const [mockData, setMockData] = useState<any>(null)
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [attendanceCache, setAttendanceCache] = useState<Map<string, any>>(new Map())
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false)

  // Generate cache key for a month
  const getCacheKey = (year: number, month: number) => `${year}-${month}`

  // Fetch attendance data from API with caching
  const fetchAttendanceData = async (year: number, month: number, force = false) => {
    if (!studentId) return null

    const cacheKey = getCacheKey(year, month)

    // Return cached data if available
    if (!force && attendanceCache.has(cacheKey)) {
      const cached = attendanceCache.get(cacheKey)
      setAttendanceData(cached)
      return cached
    }

    try {
      const response = await fetch(
        `/api/v1/students/${studentId}/attendance?year=${year}&month=${month}`
      )

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // Cache the data
          setAttendanceCache(prev => new Map(prev).set(cacheKey, result.data))
          setAttendanceData(result.data)

          // Update attendance percentage for current month only
          if (year === new Date().getFullYear() && month === new Date().getMonth() + 1) {
            if (mockData) {
              setMockData((prev: any) => ({
                ...prev,
                overview: {
                  ...prev?.overview,
                  attendance: `${result.data.stats.percentage}%`
                }
              }))
            }
          }
          return result.data
        }
      } else {
        console.error('Attendance API error:', await response.json())
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
    return null
  }

  // Fetch multiple months at once (current + 2 previous)
  const fetchInitialAttendance = async () => {
    if (!studentId || isFetchingAttendance) return

    setIsFetchingAttendance(true)
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonthNum = now.getMonth() + 1

    // Calculate 3 months: current, -1, -2
    const monthsToFetch: { year: number; month: number }[] = []
    for (let i = 0; i < 3; i++) {
      const d = new Date(currentYear, currentMonthNum - 1 - i, 1)
      monthsToFetch.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
    }

    // Fetch all 3 months in parallel and get results
    const results = await Promise.all(
      monthsToFetch.map(({ year, month }) => fetchAttendanceData(year, month))
    )

    // Set current month data (first result is current month)
    if (results[0]) {
      setAttendanceData(results[0])
    }

    setIsFetchingAttendance(false)
  }

  // Navigate to previous/next month
  const changeMonth = async (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }

    const year = newDate.getFullYear()
    const month = newDate.getMonth() + 1
    const cacheKey = getCacheKey(year, month)

    setCurrentMonth(newDate)

    // Check if data is cached
    if (attendanceCache.has(cacheKey)) {
      // Use cached data
      setAttendanceData(attendanceCache.get(cacheKey))
    } else {
      // Fetch new month data
      await fetchAttendanceData(year, month)
    }
  }

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      try {
        console.log('[AnalyticsTab] Fetching analytics for student:', studentId)

        // Fetch analytics data
        const response = await fetch(`/api/v1/students/${studentId}/analytics`)
        console.log('[AnalyticsTab] API Response status:', response.status)

        const result = await response.json()
        console.log('[AnalyticsTab] API Result:', result)

        if (result.success && result.data) {
          const { academic, engagement } = result.data
          console.log('[AnalyticsTab] Academic data:', academic)
          console.log('[AnalyticsTab] Engagement data:', engagement)

          // Map API data to component state
          const mappedData = {
            overview: {
              gpa: academic.currentGPA,
              gpaChange: null, // Not available in API yet
              gpaTrend: 'stable',
              attendance: '0%', // Will be updated by fetchAttendanceData
              attendanceChange: null,
              attendanceTrend: 'stable',
              assignments: `${engagement.completionRate}%`,
              assignmentsChange: null,
              assignmentsTrend: 'stable',
              classRank: 'N/A',
              classRankChange: null,
              classRankTrend: 'stable'
            },
            gpaTrend: academic.gpaTrend.map((t: any) => ({
              label: new Date(t.month).toLocaleDateString('en-US', { month: 'short' }),
              gpa: t.gpa
            })),
            subjects: academic.bySubject.map((s: any, i: number) => ({
              name: s.subject,
              score: Math.round(parseFloat(s.average)),
              assignments: s.totalAssignments,
              trend: s.trend,
              change: '', // Not available in API yet
              color: ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500'][i % 4]
            })),
            assignments: {
              completed: academic.totalAssignments, // Using total graded assignments as completed
              pending: 0, // Not available in API yet
              overdue: 0, // Not available in API yet
              total: academic.totalAssignments
            }
          }

          console.log('[AnalyticsTab] Mapped data:', mappedData)
          setMockData(mappedData)
        } else {
          console.error('[AnalyticsTab] API returned no data or failed:', result)
        }
      } catch (error) {
        console.error('[AnalyticsTab] Error fetching analytics:', error)
      }

      // Fetch initial 3 months of attendance data
      await fetchInitialAttendance()

      setLoading(false)
    }

    if (studentId) {
      loadData()
    }
  }, [studentId])

  if (loading) {
    return (
      <div className="space-y-4 lg:space-y-6 w-full pb-4 lg:pb-0">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-3 lg:p-4 border border-slate-200 dark:border-slate-800 h-16 lg:h-20 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 h-20 lg:h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 h-60 lg:h-80 animate-pulse" />
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 h-60 lg:h-80 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6 w-full pb-4 lg:pb-0">
      {/* Child Info Header - Mobile Optimized */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-3 lg:p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 lg:gap-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Student Analytics</p>
            <h2 className="text-base lg:text-lg font-semibold text-slate-900 dark:text-white truncate">{studentName || 'Student'}</h2>
          </div>
        </div>
      </div>

      {/* Overview Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          icon={Target}
          label="Current GPA"
          value={mockData?.overview?.gpa || '0.00'}
          change={mockData?.overview?.gpaChange}
          trend={mockData?.overview?.gpaTrend}
          colorClass="blue"
        />
        <StatCard
          icon={Calendar}
          label="Attendance"
          value={mockData?.overview?.attendance || '0%'}
          change={mockData?.overview?.attendanceChange}
          trend={mockData?.overview?.attendanceTrend}
          colorClass="emerald"
        />
        <StatCard
          icon={CheckCircle2}
          label="Assignments"
          value={mockData?.overview?.assignments || '0%'}
          change={mockData?.overview?.assignmentsChange}
          trend={mockData?.overview?.assignmentsTrend}
          colorClass="violet"
        />
        <StatCard
          icon={Award}
          label="Class Rank"
          value={mockData?.overview?.classRank || 'N/A'}
          change={mockData?.overview?.classRankChange}
          trend={mockData?.overview?.classRankTrend}
          colorClass="amber"
        />
      </div>

      {/* GPA Trend & Subject Performance - Mobile First */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <GPATrendChart
          data={mockData?.gpaTrend || []}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
        <SubjectPerformance subjects={mockData?.subjects || []} />
      </div>

      {/* Assignment Completion */}
      <AssignmentCompletionChart
        completed={mockData?.assignments?.completed || 0}
        pending={mockData?.assignments?.pending || 0}
        overdue={mockData?.assignments?.overdue || 0}
        total={mockData?.assignments?.total || 0}
      />

      {/* Monthly Attendance Calendar - Touch Optimized */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-3 lg:p-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <div className="min-w-0">
            <h3 className="text-sm lg:text-base font-semibold text-slate-900 dark:text-white">Monthly Attendance</h3>
            <p className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Viewing: {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 lg:gap-2 flex-shrink-0">
            <button
              onClick={() => changeMonth('prev')}
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center transition-all touch-manipulation"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-white" strokeWidth={2} />
            </div>
            <button
              onClick={() => changeMonth('next')}
              className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center transition-all touch-manipulation"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        <MonthlyAttendance
          attendanceData={attendanceData?.attendance || []}
          currentMonth={currentMonth}
        />
      </div>
    </div>
  )
}
