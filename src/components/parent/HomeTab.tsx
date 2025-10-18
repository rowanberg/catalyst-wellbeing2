'use client'

import { useState, useEffect, memo } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Calendar, Clock, BookOpen, FileText, X, RefreshCw } from 'lucide-react'
import { useDarkMode } from '@/contexts/DarkModeContext'

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

// Stats Card Component with enhanced styling
const StatCard = memo(({ label, value, sublabel, trend, icon }: { 
  label: string
  value: string
  sublabel?: string
  trend?: 'up' | 'down' | 'stable'
  icon?: any
}) => {
  const Icon = icon
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md dark:hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />}
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        {trend && (
          <div className={`flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
            trend === 'up' ? 'text-green-700 bg-green-50' :
            trend === 'down' ? 'text-red-700 bg-red-50' :
            'text-gray-600 bg-gray-50'
          }`}>
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
          </div>
        )}
      </div>
      {sublabel && <p className="text-xs text-gray-600 dark:text-gray-400">{sublabel}</p>}
    </div>
  )
})

StatCard.displayName = 'StatCard'

// Enhanced Action Item Component
const ActionItem = memo(({ item, onDismiss }: { item: ActionItem, onDismiss: () => void }) => {
  const config = {
    alert: { border: 'border-l-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', iconBg: 'bg-red-100 dark:bg-red-900/30', icon: AlertTriangle },
    warning: { border: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock },
    info: { border: 'border-l-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/30', icon: FileText },
    success: { border: 'border-l-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/30', icon: BookOpen }
  }[item.type]

  const Icon = config.icon

  return (
    <div className={`${config.bg} border border-gray-100 dark:border-gray-800 ${config.border} border-l-4 rounded-xl p-4 shadow-sm hover:shadow-md dark:hover:shadow-2xl transition-all relative`}>
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      
      <div className="flex items-start gap-4 pr-8">
        <div className={`${config.iconBg} rounded-lg p-2.5 flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${config.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{item.title}</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item.message}</p>
          {item.action && (
            <button className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 mt-3 transition-colors">
              {item.action}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

ActionItem.displayName = 'ActionItem'

// Enhanced GPA Chart Component
const GPAChart = memo(({ metrics }: { metrics: GrowthMetrics }) => {
  // Generate simple trend line data
  const baseValue = parseFloat(metrics.avgPercentage) || 75
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    value: baseValue + (Math.random() - 0.5) * 5
  }))

  const maxValue = 100
  const minValue = 0

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Academic Performance</h3>
          <p className="text-xs text-gray-600 mt-1">Weekly trend</p>
        </div>
        <div className="text-right bg-white px-4 py-2 rounded-lg border border-gray-200">
          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{metrics.gpa}</p>
          <p className="text-xs font-medium text-gray-500">Current GPA</p>
        </div>
      </div>

      {/* Simple Line Chart */}
      <div className="h-32 relative">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          {/* Grid lines */}
          <line x1="0" y1="0" x2="100" y2="0" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="#e5e7eb" strokeWidth="0.5" />
          
          {/* Gradient area fill */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {/* Area fill */}
          <polygon
            points={`0,100 ${chartData.map((d, i) => 
              `${(i / 6) * 100},${100 - ((d.value - minValue) / (maxValue - minValue)) * 100}`
            ).join(' ')} 100,100`}
            fill="url(#chartGradient)"
          />
          
          {/* Line */}
          <polyline
            points={chartData.map((d, i) => 
              `${(i / 6) * 100},${100 - ((d.value - minValue) / (maxValue - minValue)) * 100}`
            ).join(' ')}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Dots */}
          {chartData.map((d, i) => (
            <circle
              key={i}
              cx={(i / 6) * 100}
              cy={100 - ((d.value - minValue) / (maxValue - minValue)) * 100}
              r="2.5"
              fill="#2563eb"
              stroke="white"
              strokeWidth="1.5"
            />
          ))}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          {chartData.map((d, i) => (
            <span key={i} className="text-[10px] text-gray-500">{d.day}</span>
          ))}
        </div>
      </div>
    </div>
  )
})

GPAChart.displayName = 'GPAChart'

// Enhanced Assignment Row Component
const AssignmentRow = memo(({ assignment }: { assignment: UpcomingAssignment }) => {
  const typeConfig: Record<string, { color: string, borderColor: string, label: string }> = {
    exam: { color: 'text-red-700 bg-red-50', borderColor: 'border-red-200', label: 'Exam' },
    quiz: { color: 'text-amber-700 bg-amber-50', borderColor: 'border-amber-200', label: 'Quiz' },
    project: { color: 'text-purple-700 bg-purple-50', borderColor: 'border-purple-200', label: 'Project' },
    homework: { color: 'text-blue-700 bg-blue-50', borderColor: 'border-blue-200', label: 'Homework' },
    assignment: { color: 'text-gray-700 bg-gray-50', borderColor: 'border-gray-200', label: 'Task' }
  }

  const config = typeConfig[assignment.type] || typeConfig.assignment
  const isUrgent = assignment.daysUntil <= 1
  const isSoon = assignment.daysUntil <= 3

  return (
    <div className="group flex items-center justify-between py-4 px-4 -mx-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-all">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`${config.color} border ${config.borderColor} text-xs font-semibold px-3 py-1.5 rounded-md min-w-[80px] text-center`}>
          {config.label}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{assignment.title}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{assignment.subject}</p>
        </div>
      </div>
      <div className="text-right ml-4 flex-shrink-0">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm ${
          isUrgent ? 'bg-red-100 text-red-700' :
          isSoon ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          <Clock className="h-3.5 w-3.5" />
          {assignment.daysUntil === 0 ? 'Today' :
           assignment.daysUntil === 1 ? 'Tomorrow' :
           `${assignment.daysUntil} days`}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(assignment.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
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

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-24 animate-pulse p-4">
              <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-6 w-16 bg-gray-300 rounded" />
            </div>
          ))}
        </div>
        {/* Chart Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse p-6">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
          <div className="h-40 bg-gray-100 rounded" />
        </div>
        {/* Assignments Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 h-48 animate-pulse p-6">
          <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error State - No Class Assigned
  if (error === 'no_class') {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-8 border-2 border-amber-200 dark:border-amber-800 shadow-sm">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Class Assigned</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            This student hasn't been assigned to a class yet. Please contact the school administrator to assign them to a class to view their academic progress and assignments.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
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
      {/* Stats Overview - Desktop optimized grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard 
          label="GPA" 
          value={data?.growthTracker?.gpa || '0.00'}
          trend={data?.growthTracker?.trend}
          sublabel={`${data?.growthTracker?.totalAssignments || 0} assignments`}
          icon={TrendingUp}
        />
        <StatCard 
          label="Average" 
          value={`${data?.growthTracker?.avgPercentage || '0'}%`}
          sublabel="Overall performance"
          icon={BookOpen}
        />
        <StatCard 
          label="Streak" 
          value={`${data?.growthTracker?.dayStreak || 0}`}
          sublabel="days active"
          icon={Calendar}
        />
        <StatCard 
          label="Level" 
          value={`${data?.growthTracker?.level || 1}`}
          sublabel={`${data?.growthTracker?.weeklyXP || 0} XP`}
          icon={TrendingUp}
        />
      </div>

      {/* Growth Tracker - Desktop optimized layout */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5">Growth Tracker</h2>
        {data?.growthTracker && <GPAChart metrics={data.growthTracker} />}
      </div>

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
