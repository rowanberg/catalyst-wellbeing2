'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, TrendingDown, BookOpen, Clock, Calendar,
  CheckCircle2, XCircle, Target, RefreshCw, ChevronDown,
  Award, BarChart3, User
} from 'lucide-react'
import { useDarkMode } from '@/contexts/DarkModeContext'

interface AnalyticsTabProps {
  studentId: string
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
  <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-3 md:p-5 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-xl">
    <div className="flex items-start justify-between mb-2 md:mb-4">
      <div className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl ${color} flex items-center justify-center shadow-sm`}>
        <Icon className="h-4 w-4 md:h-6 md:w-6 text-white" strokeWidth={2} />
      </div>
      {change && trend && (
        <div className={`flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg bg-gray-100 dark:bg-gray-700 ${
          trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
        }`}>
          {trend === 'up' ? <TrendingUp className="h-3 md:h-3.5 w-3 md:w-3.5" /> : trend === 'down' ? <TrendingDown className="h-3 md:h-3.5 w-3 md:w-3.5" /> : null}
          <span className="hidden sm:inline">{change}</span>
        </div>
      )}
    </div>
    <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-0.5 md:mb-1">{value}</h3>
    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</p>
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">GPA Trend</h3>
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
          className="px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none text-gray-700 dark:text-gray-200 font-medium"
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
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-xl">
    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Subject Performance</h3>
    <div className="space-y-4">
      {subjects.map((subject, index) => (
        <div key={subject.name}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{subject.name}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{subject.score}%</span>
          </div>
          <div className="relative h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${subject.color}`}
              style={{ width: `${subject.score}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">{subject.assignments} assignments</span>
            <span className={`text-xs font-medium ${
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-xl">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Assignment Status</h3>
      
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative w-44 h-44 flex-shrink-0">
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
            <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{total}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          </div>
        </div>
        
        <div className="flex-1 w-full space-y-2.5">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Completed</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{completed}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pending</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{pending}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Overdue</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{overdue}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Analytics Tab Component
export default function AnalyticsTab({ studentId }: AnalyticsTabProps) {
  const { isDarkMode } = useDarkMode()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('1month')
  const [mockData, setMockData] = useState<any>(null)

  useEffect(() => {
    setTimeout(() => {
      setMockData({
        overview: {
          gpa: '3.85',
          gpaChange: '+0.12',
          gpaTrend: 'up',
          attendance: '94%',
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
      setLoading(false)
    }, 500)
  }, [studentId])

  if (loading) {
    return (
      <div className="space-y-6 p-3 md:p-6 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-700 h-20 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 h-96 animate-pulse" />
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 h-96 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Child Info Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl p-4 md:p-5 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
            <User className="h-5 w-5 md:h-6 md:w-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">Viewing Analytics For</p>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">Student Name</h2>
          </div>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
    </div>
  )
}
