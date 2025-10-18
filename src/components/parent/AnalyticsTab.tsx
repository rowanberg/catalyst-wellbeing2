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

// Professional Stats Card with Dark Mode
const StatCard = ({ icon: Icon, label, value, change, trend, color }: {
  icon: any
  label: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'stable'
  color: string
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-2 lg:mb-3">
      <div className={`w-9 h-9 lg:w-12 lg:h-12 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-4 w-4 lg:h-6 lg:w-6 text-white" strokeWidth={2} />
      </div>
      {change && trend && (
        <div className={`flex items-center gap-0.5 lg:gap-1 text-[10px] lg:text-xs font-semibold px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md ${
          trend === 'up' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 
          trend === 'down' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 
          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}>
          {trend === 'up' ? <TrendingUp className="h-2.5 lg:h-3.5 w-2.5 lg:w-3.5" /> : trend === 'down' ? <TrendingDown className="h-2.5 lg:h-3.5 w-2.5 lg:w-3.5" /> : null}
          <span className="whitespace-nowrap">{change}</span>
        </div>
      )}
    </div>
    <h3 className="text-lg lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-0.5 lg:mb-1 truncate">{value}</h3>
    <p className="text-[10px] lg:text-xs text-gray-600 dark:text-gray-400 font-medium truncate">{label}</p>
  </div>
)

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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-sm lg:text-base font-bold text-gray-900 dark:text-gray-100">GPA Trend</h3>
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
          className="px-2 lg:px-3 py-1.5 text-[10px] lg:text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-200 font-medium"
        >
          <option value="1week">Last Week</option>
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>
      
      <div className="relative h-48 lg:h-64">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="0.5" />
          
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
        
        <div className="absolute -left-8 top-0 flex flex-col justify-between h-full text-xs text-gray-500 dark:text-gray-400">
          <span>4.0</span>
          <span>3.0</span>
          <span>2.0</span>
          <span>1.0</span>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
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
  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
    <h3 className="text-sm lg:text-base font-bold text-gray-900 dark:text-gray-100 mb-3 lg:mb-4">Subject Performance</h3>
    <div className="space-y-3 lg:space-y-4">
      {subjects.map((subject, index) => (
        <div key={subject.name}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 truncate pr-2">{subject.name}</span>
            <span className="text-xs lg:text-sm font-bold text-gray-900 dark:text-gray-100 flex-shrink-0">{subject.score}%</span>
          </div>
          <div className="relative h-2 lg:h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${subject.color}`}
              style={{ width: `${subject.score}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 truncate pr-2">{subject.assignments} assignments</span>
            <span className={`text-[10px] lg:text-xs font-medium flex-shrink-0 ${
              subject.trend === 'up' ? 'text-green-600 dark:text-green-400' : subject.trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
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
                className={`aspect-square flex items-center justify-center text-[10px] lg:text-xs font-medium rounded-md lg:rounded-lg transition-all ${
                  status === 'present' 
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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-sm lg:text-base font-bold text-gray-900 dark:text-gray-100 mb-3 lg:mb-4">Assignment Status</h3>
      
      <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
        <div className="relative w-36 h-36 lg:w-40 lg:h-40 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-700" strokeWidth="12" />
            
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
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{total}</p>
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 font-medium">Total</p>
          </div>
        </div>
        
        <div className="flex-1 w-full space-y-2 lg:space-y-2.5">
          <div className="flex items-center justify-between p-2.5 lg:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg">
            <div className="flex items-center gap-2 lg:gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">Completed</span>
            </div>
            <span className="text-sm lg:text-lg font-bold text-gray-900 dark:text-gray-100 flex-shrink-0 ml-2">{completed}</span>
          </div>
          
          <div className="flex items-center justify-between p-2.5 lg:p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
            <div className="flex items-center gap-2 lg:gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">Pending</span>
            </div>
            <span className="text-sm lg:text-lg font-bold text-gray-900 dark:text-gray-100 flex-shrink-0 ml-2">{pending}</span>
          </div>
          
          <div className="flex items-center justify-between p-2.5 lg:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
            <div className="flex items-center gap-2 lg:gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">Overdue</span>
            </div>
            <span className="text-sm lg:text-lg font-bold text-gray-900 dark:text-gray-100 flex-shrink-0 ml-2">{overdue}</span>
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
      
      // Load mock data for other sections
      setMockData({
        overview: {
          gpa: '3.85',
          gpaChange: '+0.12',
          gpaTrend: 'up',
          attendance: '0%',
          attendanceChange: '+2%',
          attendanceTrend: 'up',
          assignments: '89%',
          assignmentsChange: '-3%',
          assignmentsTrend: 'down',
          classRank: '5th',
          classRankChange: '+2',
          classRankTrend: 'up'
        },
        gpaTrend: [
          { label: 'Jan', gpa: 3.65 },
          { label: 'Feb', gpa: 3.72 },
          { label: 'Mar', gpa: 3.80 },
          { label: 'Apr', gpa: 3.85 }
        ],
        subjects: [
          { name: 'Mathematics', score: 92, assignments: 24, trend: 'up', change: '+5%', color: 'bg-blue-500' },
          { name: 'Science', score: 88, assignments: 18, trend: 'stable', change: '0%', color: 'bg-green-500' },
          { name: 'English', score: 85, assignments: 22, trend: 'up', change: '+3%', color: 'bg-purple-500' },
          { name: 'History', score: 90, assignments: 16, trend: 'down', change: '-2%', color: 'bg-amber-500' }
        ],
        assignments: {
          completed: 45,
          pending: 8,
          overdue: 2,
          total: 55
        }
      })
      
      // Fetch initial 3 months of attendance data
      await fetchInitialAttendance()
      
      setLoading(false)
    }
    
    loadData()
  }, [studentId])

  if (loading) {
    return (
      <div className="space-y-3 lg:space-y-4 p-3 lg:p-4 w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-4 border border-gray-200 dark:border-gray-700 h-16 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-20 lg:h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-64 lg:h-80 animate-pulse" />
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-64 lg:h-80 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4 p-3 lg:p-4 w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Child Info Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2.5 lg:gap-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 lg:h-6 lg:w-6 text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] lg:text-xs text-gray-600 dark:text-gray-400 font-medium">Viewing Analytics For</p>
            <h2 className="text-base lg:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{studentName || 'Student'}</h2>
          </div>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
        <StatCard
          icon={Target}
          label="Current GPA"
          value={mockData?.overview?.gpa || '0.00'}
          change={mockData?.overview?.gpaChange}
          trend={mockData?.overview?.gpaTrend}
          color="bg-blue-500"
        />
        <StatCard
          icon={Calendar}
          label="Attendance"
          value={mockData?.overview?.attendance || '0%'}
          change={mockData?.overview?.attendanceChange}
          trend={mockData?.overview?.attendanceTrend}
          color="bg-green-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="Assignments"
          value={mockData?.overview?.assignments || '0%'}
          change={mockData?.overview?.assignmentsChange}
          trend={mockData?.overview?.assignmentsTrend}
          color="bg-purple-500"
        />
        <StatCard
          icon={Award}
          label="Class Rank"
          value={mockData?.overview?.classRank || 'N/A'}
          change={mockData?.overview?.classRankChange}
          trend={mockData?.overview?.classRankTrend}
          color="bg-amber-500"
        />
      </div>

      {/* GPA Trend & Subject Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
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

      {/* Monthly Attendance Calendar with Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <div className="min-w-0">
            <h3 className="text-sm lg:text-base font-bold text-gray-900 dark:text-gray-100">Monthly Attendance</h3>
            <p className="text-[10px] lg:text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
              Viewing: {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 lg:gap-2 flex-shrink-0">
            <button
              onClick={() => changeMonth('prev')}
              className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-lg bg-green-500 flex items-center justify-center">
              <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-white" strokeWidth={2} />
            </div>
            <button
              onClick={() => changeMonth('next')}
              className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-600 dark:text-gray-300" />
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
