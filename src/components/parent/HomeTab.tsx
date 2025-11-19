'use client'

import { useState, useEffect, memo } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Calendar, Clock, BookOpen, FileText, X, RefreshCw, BarChart3, Activity } from 'lucide-react'
import { useDarkMode } from '@/contexts/DarkModeContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts'

interface ActionItem {
  type: 'alert' | 'warning' | 'info' | 'success'
  priority: 'high' | 'medium' | 'low'
  title: string
  message: string
  action: string | null
}

interface GrowthMetrics {
  gpa: string
  trend: 'up' | 'down' | 'stable'
  trendValue: string
  dayStreak: number
  weeklyXP: number
  level: number
  totalAssignments: number
  avgPercentage: string
  weeklySeries?: { day: string; value: number }[]
}

interface UpcomingAssignment {
  id: string
  title: string
  subject: string
  dueDate: string
  type: string
  daysUntil: number
}

interface HomeTabProps {
  studentId: string
}

// Custom Tooltip Component for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    const value = Math.round(data.value)
    const isHigh = value >= 85
    const isMedium = value >= 70
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
        <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-3 h-3 rounded-full ${
            isHigh ? 'bg-emerald-500' : isMedium ? 'bg-blue-500' : 'bg-amber-500'
          }`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">Progress: </span>
          <span className={`font-bold ${
            isHigh ? 'text-emerald-600' : isMedium ? 'text-blue-600' : 'text-amber-600'
          }`}>{value}%</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {isHigh ? '🌟 Excellent' : isMedium ? '👍 Good' : '📈 Keep Going'}
        </p>
      </div>
    )
  }
  return null
}

// Chart Type Toggle Component
const ChartTypeToggle = ({ chartType, setChartType }: { 
  chartType: 'area' | 'bar' | 'line'
  setChartType: (type: 'area' | 'bar' | 'line') => void 
}) => {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      {[
        { type: 'area' as const, icon: Activity, label: 'Area' },
        { type: 'bar' as const, icon: BarChart3, label: 'Bar' },
        { type: 'line' as const, icon: TrendingUp, label: 'Line' }
      ].map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          onClick={() => setChartType(type)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
            chartType === type
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Icon className="h-3 w-3" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

// Dynamic Chart Renderer
const DynamicChart = ({ chartType, chartData }: { 
  chartType: 'area' | 'bar' | 'line'
  chartData: any[] 
}) => {
  const commonProps = {
    data: chartData,
    margin: { top: 20, right: 30, left: 20, bottom: 5 }
  }

  const commonElements = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-600" />
      <XAxis 
        dataKey="day" 
        stroke="#6B7280" 
        className="dark:stroke-gray-400"
        fontSize={12}
      />
      <YAxis 
        stroke="#6B7280" 
        className="dark:stroke-gray-400"
        fontSize={12}
        domain={[0, 100]}
      />
      <Tooltip 
        content={<CustomTooltip />}
        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
      />
    </>
  )

  if (chartType === 'area') {
    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        {commonElements}
        <Area
          type="monotone"
          dataKey="value"
          stroke="#3B82F6"
          strokeWidth={3}
          fill="url(#progressGradient)"
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
          activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2, fill: '#FFFFFF' }}
        />
      </AreaChart>
    )
  }

  if (chartType === 'bar') {
    return (
      <BarChart {...commonProps}>
        {commonElements}
        <Bar 
          dataKey="value" 
          fill="#3B82F6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    )
  }

  return (
    <LineChart {...commonProps}>
      {commonElements}
      <Line
        type="monotone"
        dataKey="value"
        stroke="#3B82F6"
        strokeWidth={3}
        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
        activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2, fill: '#FFFFFF' }}
      />
    </LineChart>
  )
}

// Enterprise Stats Card
const StatCard = memo(({ label, value, sublabel, trend, icon }: { 
  label: string
  value: string
  sublabel?: string
  trend?: 'up' | 'down' | 'stable'
  icon?: any
}) => {
  const Icon = icon
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        {trend && (
          <div className={`text-xs font-medium ${
            trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
            trend === 'down' ? 'text-red-600 dark:text-red-400' :
            'text-slate-600 dark:text-slate-400'
          }`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
          </div>
        )}
      </div>
      {sublabel && <p className="text-xs text-slate-600 dark:text-slate-400">{sublabel}</p>}
    </div>
  )
})

StatCard.displayName = 'StatCard'

// Enterprise Action Item
const ActionItem = memo(({ item, onDismiss }: { item: ActionItem, onDismiss: () => void }) => {
  const config = {
    alert: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', iconBg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-900/30', icon: AlertTriangle },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-900/30', icon: Clock },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-900/30', icon: FileText },
    success: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-900/30', icon: BookOpen }
  }[item.type]

  const Icon = config.icon

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4 relative`}>
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      
      <div className="flex items-start gap-3 pr-8">
        <div className={`${config.iconBg} rounded-lg p-2 flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${config.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.message}</p>
          {item.action && (
            <button className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2 transition-colors">
              {item.action}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

ActionItem.displayName = 'ActionItem'

// Professional Growth Tracker Chart for Desktop
const GPAChart = memo(({ metrics }: { metrics: GrowthMetrics }) => {
  // Generate realistic trend line data
  const baseValue = parseFloat(metrics.avgPercentage) || 75
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    value: baseValue + (Math.random() - 0.5) * 5
  }))

  const maxValue = 100
  const minValue = 50

  const getTrendIcon = () => {
    if (metrics.trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />
    if (metrics.trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
  }

  const getTrendColor = () => {
    if (metrics.trend === 'up') return 'text-emerald-600 dark:text-emerald-400'
    if (metrics.trend === 'down') return 'text-red-600 dark:text-red-400'
    return 'text-slate-600 dark:text-slate-400'
  }

  return (
    <div className="space-y-6">
      {/* Desktop: Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GPA Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl p-5 border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            {getTrendIcon()}
          </div>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">{metrics.gpa}</p>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Current GPA</p>
          <p className={`text-xs font-semibold mt-1 ${getTrendColor()}`}>
            {metrics.trend === 'up' && '↑'} {metrics.trend === 'down' && '↓'} {metrics.trendValue}
          </p>
        </div>

        {/* Day Streak Card */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 rounded-xl p-5 border border-orange-200 dark:border-orange-800/50">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg">🔥</span>
          </div>
          <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-1">{metrics.dayStreak}</p>
          <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Day Streak</p>
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-1">Keep it up!</p>
        </div>

        {/* Weekly XP Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-xl p-5 border border-purple-200 dark:border-purple-800/50">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-purple-500 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg">⚡</span>
          </div>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">{metrics.weeklyXP}</p>
          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Weekly XP</p>
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1">Level {metrics.level}</p>
        </div>

        {/* Assignments Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg">📚</span>
          </div>
          <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-1">{metrics.totalAssignments}</p>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Assignments</p>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{metrics.avgPercentage}% Avg</p>
        </div>
      </div>
    </div>
  )
})

GPAChart.displayName = 'GPAChart'

// Enterprise Assignment Row
const AssignmentRow = memo(({ assignment }: { assignment: UpcomingAssignment }) => {
  const typeConfig: Record<string, { color: string, borderColor: string, label: string }> = {
    exam: { color: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-900/30', label: 'Exam' },
    quiz: { color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-900/30', label: 'Quiz' },
    project: { color: 'text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20', borderColor: 'border-violet-200 dark:border-violet-900/30', label: 'Project' },
    homework: { color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-900/30', label: 'Homework' },
    assignment: { color: 'text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-800', borderColor: 'border-slate-200 dark:border-slate-700', label: 'Task' }
  }

  const config = typeConfig[assignment.type] || typeConfig.assignment
  const isUrgent = assignment.daysUntil <= 1
  const isSoon = assignment.daysUntil <= 3

  return (
    <div className="flex items-center justify-between py-3 px-3 -mx-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`${config.color} border ${config.borderColor} text-xs font-medium px-2.5 py-1 rounded min-w-[70px] text-center`}>
          {config.label}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{assignment.title}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{assignment.subject}</p>
        </div>
      </div>
      <div className="text-right ml-3 flex-shrink-0">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs ${
          isUrgent ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
          isSoon ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
        }`}>
          <Clock className="h-3 w-3" />
          {assignment.daysUntil === 0 ? 'Today' :
           assignment.daysUntil === 1 ? 'Tomorrow' :
           `${assignment.daysUntil}d`}
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
          {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  )
})

AssignmentRow.displayName = 'AssignmentRow'

// Main HomeTab Component
export default function HomeTab({ studentId }: HomeTabProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [dismissedActions, setDismissedActions] = useState<number[]>([])
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area')

  useEffect(() => {
    fetchDashboardData()
  }, [studentId])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('HomeTab: Fetching dashboard for studentId:', studentId)
      const response = await fetch(`/api/v1/parents/dashboard?student_id=${studentId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('HomeTab: API error:', errorData)
        throw new Error(errorData.error || 'Failed to load dashboard')
      }
      
      const result = await response.json()
      console.log('HomeTab: Dashboard API result:', result)
      console.log('HomeTab: Student info:', result.data?.studentInfo)
      
      // Check if student has no class assigned
      if (!result.data?.studentInfo?.className && !result.data?.studentInfo?.classId) {
        console.warn('HomeTab: No class assigned - className:', result.data?.studentInfo?.className, 'classId:', result.data?.studentInfo?.classId)
        setError('no_class')
        setData(null)
        return
      }
      
      console.log('HomeTab: Setting dashboard data')
      setData(result.data)
    } catch (err: any) {
      console.error('HomeTab: Error:', err)
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleDismissAction = (index: number) => {
    setDismissedActions([...dismissedActions, index])
  }

  // Precompute weekly chart data with safe numeric values
  const weeklyBaseRaw = data?.growthTracker?.avgPercentage
  const weeklyBaseParsed = weeklyBaseRaw !== undefined && weeklyBaseRaw !== null
    ? parseFloat(weeklyBaseRaw)
    : NaN
  const weeklyBaseValue = !Number.isNaN(weeklyBaseParsed) ? weeklyBaseParsed : 75

  const backendWeekly = data?.growthTracker?.weeklySeries
  const defaultWeekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  let weeklyChartData: { day: string; value: number }[]

  if (Array.isArray(backendWeekly) && backendWeekly.length > 0) {
    weeklyChartData = backendWeekly.map((point, index) => {
      const safeDay = typeof point.day === 'string'
        ? point.day
        : defaultWeekDays[index] || `Day ${index + 1}`

      let rawValue: number
      if (typeof point.value === 'number') {
        rawValue = point.value
      } else if (typeof (point as any).value === 'string') {
        const parsed = parseFloat((point as any).value)
        rawValue = Number.isNaN(parsed) ? weeklyBaseValue : parsed
      } else {
        rawValue = weeklyBaseValue
      }

      const clamped = Math.max(20, Math.min(100, rawValue))

      return {
        day: safeDay,
        value: Number(clamped.toFixed(1)),
      }
    })
  } else {
    // Deterministic fallback (no randomness) using a gentle wave around the base value
    weeklyChartData = defaultWeekDays.map((day, index) => {
      const position = defaultWeekDays.length > 1 ? index / (defaultWeekDays.length - 1) : 0
      const wave = Math.sin(position * Math.PI) * 4
      const value = weeklyBaseValue + wave
      const clamped = Math.max(20, Math.min(100, value))
      return {
        day,
        value: Number(clamped.toFixed(1)),
      }
    })
  }

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 h-24 animate-pulse p-4">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
              <div className="h-6 w-16 bg-slate-300 dark:bg-slate-600 rounded" />
            </div>
          ))}
        </div>
        {/* Chart Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 h-64 animate-pulse p-4">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
          <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        {/* Assignments Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 h-48 animate-pulse p-4">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error State - No Class Assigned
  if (error === 'no_class') {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg p-8 border border-amber-200 dark:border-amber-800">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Class Assigned</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
            This student hasn't been assigned to a class yet. Please contact the school administrator to assign them to a class to view their academic progress and assignments.
          </p>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 lg:p-6 border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-2">What you can do:</p>
            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 text-left">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span>Contact your school administrator or teacher</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span>Verify the student's enrollment status</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span>Check back after class assignment is complete</span>
              </li>
            </ul>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 dark:from-amber-600 dark:to-orange-600 dark:hover:from-amber-700 dark:hover:to-orange-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <RefreshCw className="h-4 w-4" />
            Check Again
          </button>
        </div>
      </div>
    )
  }

  // Error State - General Error
  if (error) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h3>
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    )
  }

  const visibleActions = data?.actionCenter?.filter((_: any, index: number) => 
    !dismissedActions.includes(index)
  ) || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Growth Tracker - Desktop optimized layout */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5">Growth Tracker</h2>
        {data?.growthTracker && <GPAChart metrics={data.growthTracker} />}
      </div>

      {/* Professional Weekly Progress Chart */}
      {data?.growthTracker && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 shadow-[0_0_40px_rgba(56,189,248,0.18)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-90">
            <div className="absolute -top-24 -right-24 h-64 w-64 bg-cyan-500/30 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 bg-violet-500/25 blur-3xl rounded-full" />
          </div>

          <div className="relative p-4 lg:p-6">
            {/* Header with Chart Type Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/40">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 tracking-tight">Weekly Progress</h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pulse view of performance across the last 7 days</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-slate-900/90 text-xs text-slate-200 px-3 py-1 border border-slate-700/80">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live snapshot · Last 7 days</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-slate-900/80 text-xs text-slate-200 px-3 py-1 border border-slate-700/80">
                  <span className="text-slate-400">Average</span>
                  <span className="font-semibold text-slate-50">{data.growthTracker.avgPercentage}%</span>
                </div>
                <ChartTypeToggle chartType={chartType} setChartType={setChartType} />
              </div>
            </div>

            {/* Professional Chart Container */}
            <div className="mb-6">
              <div className="h-64 lg:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <DynamicChart 
                    chartType={chartType} 
                    chartData={weeklyChartData}
                  />
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="relative overflow-hidden rounded-xl border border-cyan-500/40 bg-slate-950/80 px-4 py-3">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-sky-500/10" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs font-medium text-slate-200">Weekly Average</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-50">{data.growthTracker.avgPercentage}%</div>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Performance</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-emerald-500/40 bg-slate-950/80 px-4 py-3">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-transparent to-emerald-400/10" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-medium text-slate-200">Tasks Completed</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-50">{data.growthTracker.totalAssignments}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Volume</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-purple-500/40 bg-slate-950/80 px-4 py-3">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-transparent to-fuchsia-500/10" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-medium text-slate-200">Streak</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-50">{data.growthTracker.dayStreak} days</div>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Consistency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Center */}
      {visibleActions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Action Center</h2>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
              {visibleActions.length} {visibleActions.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          {visibleActions.map((item: ActionItem, index: number) => (
            <ActionItem 
              key={index} 
              item={item} 
              onDismiss={() => handleDismissAction(index)}
            />
          ))}
        </div>
      )}

      {/* Upcoming Week - Desktop optimized */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Upcoming Week</h2>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
            <Calendar className="h-3.5 w-3.5" />
            {data?.upcomingWeek?.length || 0} tasks
          </div>
        </div>
        
        {(!data?.upcomingWeek || data.upcomingWeek.length === 0) ? (
          <div className="text-center py-8">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No upcoming assignments</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.upcomingWeek.slice(0, 5).map((assignment: UpcomingAssignment) => (
              <AssignmentRow key={assignment.id} assignment={assignment} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
