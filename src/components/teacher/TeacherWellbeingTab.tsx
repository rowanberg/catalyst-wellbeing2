'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Brain, 
  Activity, 
  Smile, 
  Frown, 
  Meh, 
  RefreshCw,
  Calendar,
  Target,
  Lightbulb,
  Shield,
  MessageCircle,
  BarChart3,
  Clock,
  Star,
  ArrowRight,
  Filter,
  Search,
  Eye,
  EyeOff,
  Zap,
  Award,
  BookOpen,
  Phone,
  HelpCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Animation configuration matching teacher dashboard
const animConfig = {
  enableAnimations: true,
  animationDuration: 0.4
}

// Conditional motion component for consistent animations
const ConditionalMotion = ({ children, ...props }: any) => {
  if (!animConfig.enableAnimations) {
    return <div className={props.className}>{children}</div>
  }
  return <motion.div {...props}>{children}</motion.div>
}

interface WellbeingMetrics {
  classAverage: number
  totalResponses: number
  trendDirection: 'up' | 'down' | 'stable'
  trendPercentage: number
  moodDistribution: {
    happy: number
    excited: number
    calm: number
    sad: number
    angry: number
    anxious: number
  }
  riskLevel: 'low' | 'medium' | 'high'
  interventionSuggestions: string[]
}

interface StudentInsight {
  id: string
  name: string
  grade: string
  wellbeingScore: number
  recentMoods: string[]
  riskLevel: 'low' | 'medium' | 'high'
  concerns: string[]
  strengths: string[]
  lastCheckIn: string
}

interface WellbeingData {
  metrics: WellbeingMetrics
  studentInsights: StudentInsight[]
}

export const TeacherWellbeingTab: React.FC = () => {
  const [data, setData] = useState<WellbeingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [activeView, setActiveView] = useState<'overview' | 'students' | 'insights' | 'actions'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [refreshing, setRefreshing] = useState(false)
  
  // Action states
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [showParentContactModal, setShowParentContactModal] = useState(false)
  const [showRecognitionModal, setShowRecognitionModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [availableClasses, setAvailableClasses] = useState<Array<{id: string, name: string}>>([
    { id: 'all', name: 'All Classes' }
  ])
  const [classesLoading, setClassesLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false)
  const [detailedStudentData, setDetailedStudentData] = useState<any>(null)
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false)

  // Action handlers
  const handleSendCheckIn = useCallback(async () => {
    setActionLoading('check-in')
    try {
      // Simulate API call to send wellbeing check-in survey
      await new Promise(resolve => setTimeout(resolve, 1500))
      setActionSuccess('Wellbeing check-in sent to all students!')
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to send check-in:', error)
    } finally {
      setActionLoading(null)
      setShowCheckInModal(false)
    }
  }, [])

  const handleScheduleMeeting = useCallback(async (studentIds: string[]) => {
    setActionLoading('meeting')
    try {
      // Simulate API call to schedule meetings
      await new Promise(resolve => setTimeout(resolve, 1200))
      setActionSuccess(`Meeting scheduled with ${studentIds.length} student(s)!`)
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to schedule meeting:', error)
    } finally {
      setActionLoading(null)
      setShowMeetingModal(false)
    }
  }, [])

  const handleContactParents = useCallback(async (studentIds: string[], message: string) => {
    setActionLoading('contact')
    try {
      // Simulate API call to contact parents
      await new Promise(resolve => setTimeout(resolve, 1800))
      setActionSuccess(`Parent notifications sent for ${studentIds.length} student(s)!`)
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to contact parents:', error)
    } finally {
      setActionLoading(null)
      setShowParentContactModal(false)
    }
  }, [])

  const handlePositiveRecognition = useCallback(async (studentIds: string[], recognition: string) => {
    setActionLoading('recognition')
    try {
      // Simulate API call to send positive recognition
      await new Promise(resolve => setTimeout(resolve, 1000))
      setActionSuccess(`Positive recognition sent to ${studentIds.length} student(s)!`)
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (error) {
      console.error('Failed to send recognition:', error)
    } finally {
      setActionLoading(null)
      setShowRecognitionModal(false)
    }
  }, [])

  // Handle opening student detail modal
  const handleStudentDetailView = useCallback(async (student: any) => {
    setSelectedStudent(student)
    setShowStudentDetailModal(true)
    setLoadingStudentDetail(true)
    setDetailedStudentData(null)

    try {
      const response = await fetch(`/api/teacher/student-detail?student_id=${student.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch student details')
      }
      const result = await response.json()
      if (result.success) {
        setDetailedStudentData(result.student)
      }
    } catch (error) {
      console.error('Error fetching student details:', error)
    } finally {
      setLoadingStudentDetail(false)
    }
  }, [])

  // Fetch teacher's assigned classes
  const fetchTeacherClasses = useCallback(async () => {
    try {
      setClassesLoading(true)
      const response = await fetch('/api/teacher/class-assignments')
      if (!response.ok) {
        throw new Error('Failed to fetch teacher classes')
      }
      
      const result = await response.json()
      if (result.success && result.assignments) {
        const classes = result.assignments.map((assignment: any) => ({
          id: assignment.class_id,
          name: assignment.classes?.class_name || `Class ${assignment.class_id.substring(0, 8)}`,
          grade: assignment.classes?.grade_levels?.grade_level || 'Unknown',
          subject: assignment.classes?.subject || assignment.subject || 'General'
        }))
        
        setAvailableClasses([
          { id: 'all', name: 'All Classes' },
          ...classes.map((cls: any) => ({
            id: cls.id,
            name: `${cls.name} (${cls.subject})`
          }))
        ])
      }
    } catch (error) {
      console.error('Failed to fetch teacher classes:', error)
      // Keep default "All Classes" option on error
    } finally {
      setClassesLoading(false)
    }
  }, [])

  // Enterprise stat cards configuration
  const statCards = useMemo(() => {
    if (!data) return []
    
    return [
      {
        label: 'Class Average',
        value: `${data.metrics.classAverage}/10`,
        description: 'Overall wellbeing score',
        icon: BarChart3,
        iconBg: 'from-blue-500 to-indigo-600',
        bgColor: 'from-blue-50 to-indigo-50',
        color: 'text-blue-600',
        trend: data.metrics.trendDirection === 'up' ? `+${data.metrics.trendPercentage}%` : 
               data.metrics.trendDirection === 'down' ? `-${data.metrics.trendPercentage}%` : '0%'
      },
      {
        label: 'Total Responses',
        value: data.metrics.totalResponses.toString(),
        description: 'Student check-ins',
        icon: Users,
        iconBg: 'from-emerald-500 to-green-600',
        bgColor: 'from-emerald-50 to-green-50',
        color: 'text-emerald-600',
        trend: '+12%'
      },
      {
        label: 'Risk Level',
        value: data.metrics.riskLevel.toUpperCase(),
        description: 'Current assessment',
        icon: data.metrics.riskLevel === 'high' ? AlertTriangle : 
             data.metrics.riskLevel === 'medium' ? Clock : CheckCircle,
        iconBg: data.metrics.riskLevel === 'high' ? 'from-red-500 to-rose-600' :
                data.metrics.riskLevel === 'medium' ? 'from-amber-500 to-orange-600' : 'from-green-500 to-emerald-600',
        bgColor: data.metrics.riskLevel === 'high' ? 'from-red-50 to-rose-50' :
                 data.metrics.riskLevel === 'medium' ? 'from-amber-50 to-orange-50' : 'from-green-50 to-emerald-50',
        color: data.metrics.riskLevel === 'high' ? 'text-red-600' :
               data.metrics.riskLevel === 'medium' ? 'text-amber-600' : 'text-green-600',
        trend: data.metrics.trendDirection === 'up' ? 'Improving' : 
               data.metrics.trendDirection === 'down' ? 'Declining' : 'Stable'
      },
      {
        label: 'At-Risk Students',
        value: data.studentInsights.filter(s => s.riskLevel === 'high').length.toString(),
        description: 'Need attention',
        icon: Shield,
        iconBg: 'from-purple-500 to-violet-600',
        bgColor: 'from-purple-50 to-violet-50',
        color: 'text-purple-600',
        trend: '-5%'
      }
    ]
  }, [data])

  // Quick actions configuration
  const quickActions = useMemo(() => [
    {
      label: 'Send Check-in',
      description: 'Wellbeing survey to class',
      icon: MessageCircle,
      iconColor: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      stats: 'Weekly',
      action: () => setShowCheckInModal(true),
      loading: actionLoading === 'check-in'
    },
    {
      label: 'Schedule Meeting',
      description: 'Meet with at-risk students',
      icon: Calendar,
      iconColor: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      stats: data ? `${data.studentInsights.filter(s => s.riskLevel === 'high').length} pending` : '0 pending',
      action: () => setShowMeetingModal(true),
      loading: actionLoading === 'meeting'
    },
    {
      label: 'Contact Parents',
      description: 'Reach out for support',
      icon: Phone,
      iconColor: 'from-amber-500 to-orange-600',
      bgColor: 'from-amber-50 to-orange-50',
      stats: data ? `${data.studentInsights.filter(s => s.riskLevel === 'high').length} urgent` : '0 urgent',
      action: () => setShowParentContactModal(true),
      loading: actionLoading === 'contact'
    },
    {
      label: 'Positive Recognition',
      description: 'Celebrate improvements',
      icon: Award,
      iconColor: 'from-purple-500 to-violet-600',
      bgColor: 'from-purple-50 to-violet-50',
      stats: data ? `${data.studentInsights.filter(s => s.strengths.length > 0).length} ready` : '0 ready',
      action: () => setShowRecognitionModal(true),
      loading: actionLoading === 'recognition'
    }
  ], [data, actionLoading])

  const fetchWellbeingData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)
      
      const classParam = selectedClass !== 'all' ? `&class_id=${selectedClass}` : ''
      const response = await fetch(`/api/teacher/wellbeing-analytics?time_range=${timeRange}${classParam}`)
      if (!response.ok) {
        throw new Error('Failed to fetch wellbeing data')
      }
      
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [timeRange, selectedClass])

  useEffect(() => {
    fetchWellbeingData()
  }, [fetchWellbeingData])

  // Fetch teacher classes on mount
  useEffect(() => {
    fetchTeacherClasses()
  }, [fetchTeacherClasses])

  // Refetch data when class or time range changes
  useEffect(() => {
    fetchWellbeingData()
  }, [selectedClass, timeRange])

  const filteredStudents = useMemo(() => {
    if (!data?.studentInsights) return []
    
    return data.studentInsights.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.grade.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRisk = riskFilter === 'all' || student.riskLevel === riskFilter
      
      return matchesSearch && matchesRisk
    })
  }, [data?.studentInsights, searchTerm, riskFilter])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getMoodEmoji = (mood: string) => {
    const moodMap: Record<string, string> = {
      'happy': '😊', 'excited': '😄', 'calm': '😌',
      'sad': '😢', 'angry': '😠', 'anxious': '😰',
      '😊': '😊', '😄': '😄', '😌': '😌',
      '😢': '😢', '😠': '😠', '😰': '😰'
    }
    return moodMap[mood] || '😐'
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-5 lg:p-6">
        {/* Loading Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-96 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
        
        {/* Loading Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 lg:p-6 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-slate-600 rounded-xl" />
                <div className="w-12 h-5 bg-gray-200 dark:bg-slate-600 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 dark:bg-slate-600 rounded" />
                <div className="h-8 w-16 bg-gray-200 dark:bg-slate-600 rounded" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-slate-600 rounded" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Loading Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl p-3 sm:p-4 lg:p-6 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-slate-600 rounded-xl" />
                <div className="w-12 h-5 bg-gray-200 dark:bg-slate-600 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-slate-600 rounded" />
                <div className="h-3 w-32 bg-gray-200 dark:bg-slate-600 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Wellbeing Data</h3>
                <p className="text-red-700">{error}</p>
                <Button 
                  onClick={() => fetchWellbeingData()} 
                  className="mt-3" 
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-4 sm:p-5 lg:p-6">
      {/* Enterprise Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
            Student Wellbeing Analytics
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Monitor and support your students' emotional and academic wellbeing
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Class Selection Dropdown */}
          <Select value={selectedClass} onValueChange={setSelectedClass} disabled={classesLoading}>
            <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
              <SelectValue placeholder={classesLoading ? "Loading classes..." : "Select class"} />
            </SelectTrigger>
            <SelectContent>
              {availableClasses.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time Range Selection */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-32 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => fetchWellbeingData(true)} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
            className="w-full sm:w-auto bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Enterprise Analytics Cards - Mobile 2x2 Layout */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <ConditionalMotion
                key={stat.label}
                initial={animConfig.enableAnimations ? { opacity: 0, y: 20 } : false}
                animate={animConfig.enableAnimations ? { opacity: 1, y: 0 } : false}
                transition={{ delay: animConfig.enableAnimations ? index * 0.05 : 0, duration: animConfig.animationDuration }}
              >
                <Card className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-30 dark:opacity-20 group-hover:opacity-40 dark:group-hover:opacity-30 transition-opacity duration-300`} />
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300`} />
                  <CardContent className="p-3 sm:p-4 lg:p-6 relative z-10">
                    {/* Mobile 2x2 Optimized Layout */}
                    <div className="lg:hidden">
                      <div className="text-center space-y-2">
                        <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-r ${stat.iconBg} text-white shadow-md flex items-center justify-center`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div>
                          <p className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                            {stat.value}
                          </p>
                          <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{stat.label}</p>
                          <p className="text-xs text-gray-600 dark:text-slate-500 truncate leading-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>{stat.description}</p>
                        </div>
                        
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                          stat.trend.startsWith('+') || stat.trend === 'Improving'
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' 
                            : stat.trend.startsWith('-') || stat.trend === 'Declining'
                            ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'
                            : 'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-400'
                        }`}>
                          {stat.trend}
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop Layout */}
                    <div className="hidden lg:block">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${stat.iconBg} text-white shadow-md group-hover:shadow-lg transition-all duration-300`}>
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                          stat.trend.startsWith('+') || stat.trend === 'Improving'
                            ? 'bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                            : stat.trend.startsWith('-') || stat.trend === 'Declining'
                            ? 'bg-gradient-to-r from-rose-100 to-red-100 dark:from-rose-900/50 dark:to-red-900/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900/50 dark:to-slate-900/50 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                        }`}>
                          {stat.trend}
                        </div>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-slate-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>{stat.label}</p>
                        <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                          {stat.value}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-slate-500" style={{ fontFamily: 'var(--font-dm-sans)' }}>{stat.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ConditionalMotion>
            )
          })}
        </div>
      )}

      {/* Enterprise Quick Actions - Mobile 2x2 Layout */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 lg:gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.label}
                onClick={action.action}
                disabled={action.loading || actionLoading !== null}
                initial={animConfig.enableAnimations ? { opacity: 0, y: 20 } : false}
                animate={animConfig.enableAnimations ? { opacity: 1, y: 0 } : false}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={animConfig.enableAnimations && !action.loading ? { scale: 1.02 } : undefined}
                whileTap={animConfig.enableAnimations && !action.loading ? { scale: 0.98 } : undefined}
                className={`p-3 sm:p-4 lg:p-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-left group relative overflow-hidden ${
                  action.loading || actionLoading !== null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.bgColor} opacity-50 dark:opacity-30 group-hover:opacity-70 dark:group-hover:opacity-50 transition-opacity duration-300`} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-r ${action.iconColor} text-white shadow-sm transition-shadow duration-200 group-hover:shadow-md`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-slate-400 font-semibold bg-gray-50/80 dark:bg-slate-700/80 px-2 py-1 rounded-full border border-gray-200 dark:border-slate-600" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {action.stats}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      {action.label}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {action.description}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-center justify-end">
                    <ArrowRight className="h-4 w-4 text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Contextual Information Panel */}
      <Card className="border-indigo-200 dark:border-indigo-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <Lightbulb className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Understanding Student Wellbeing Data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="font-medium text-indigo-800 dark:text-indigo-200">Activity Patterns:</div>
                  <div className="text-indigo-700 dark:text-indigo-300">
                    • Low activity may indicate focus on assignments, exams, or personal commitments
                    • Extended absence could suggest health issues or family responsibilities
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-indigo-800 dark:text-indigo-200">Engagement Levels:</div>
                  <div className="text-indigo-700 dark:text-indigo-300">
                    • Reduced engagement might reflect workload balance or changing interests
                    • Consider individual learning styles and preferences
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-indigo-800 dark:text-indigo-200">Risk Assessment:</div>
                  <div className="text-indigo-700 dark:text-indigo-300">
                    • Risk levels are calculated from multiple factors including mood, attendance, and academic performance
                    • Early intervention is most effective
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Notification */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{actionSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enterprise Content Sections */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Mood Distribution Card */}
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600 pb-3 sm:pb-4 relative z-10">
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-md flex-shrink-0">
                  <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-xl font-bold truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>Mood Distribution</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 mt-0.5 truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>Student emotional patterns</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {Object.entries(data.metrics.moodDistribution).map(([mood, count]) => (
                  <motion.div
                    key={mood}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-50/50 dark:bg-slate-700/40 rounded-xl border border-gray-200 dark:border-slate-600 hover:border-purple-200 dark:hover:border-purple-600 hover:shadow-md hover:bg-purple-50/30 dark:hover:bg-purple-900/20 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getMoodEmoji(mood)}</span>
                      <span className="font-semibold capitalize text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-dm-sans)' }}>{mood}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)' }}>{count}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Card */}
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600 pb-3 sm:pb-4 relative z-10">
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-md flex-shrink-0">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-xl font-bold truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>AI Insights</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 mt-0.5 truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>Intelligent analysis</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 relative z-10 space-y-4">
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>Overall Assessment</h4>
                <p className="text-blue-800 dark:text-blue-200 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  Your class shows a <strong>{data.metrics.riskLevel}</strong> risk level with an average wellbeing score of <strong>{data.metrics.classAverage}/10</strong>. 
                  The trend is <strong>{data.metrics.trendDirection}</strong> by {data.metrics.trendPercentage}% over the selected period.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)' }}>Recommendations</h4>
                {data.metrics.interventionSuggestions.slice(0, 3).map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50/50 dark:bg-slate-700/40 rounded-lg border border-gray-200 dark:border-slate-600">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0">
                      <Lightbulb className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-900 dark:text-slate-100 font-medium text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* At-Risk Students Section */}
      {data && filteredStudents.length > 0 && (
        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-900/10 dark:to-orange-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600 pb-3 sm:pb-4 relative z-10">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl text-white shadow-md flex-shrink-0">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg sm:text-xl font-bold truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>Students Needing Attention</div>
                <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-400 mt-0.5 truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{filteredStudents.length} students with concerns</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="space-y-4">
              {filteredStudents.slice(0, 5).map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 p-4 bg-gray-50/50 dark:bg-slate-700/40 rounded-xl border border-gray-200 dark:border-slate-600 hover:border-red-200 dark:hover:border-red-600 hover:shadow-md hover:bg-red-50/30 dark:hover:bg-red-900/20 transition-all duration-300"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)' }}>{student.name}</h4>
                      <Badge className={`${getRiskColor(student.riskLevel)} text-xs font-semibold`}>
                        {student.riskLevel.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-slate-400">Grade {student.grade}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Score:</span>
                        <span className="text-base font-bold text-gray-900 dark:text-slate-100">{student.wellbeingScore}/10</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Recent:</span>
                        {student.recentMoods.slice(0, 3).map((mood, idx) => (
                          <span key={idx} className="text-base">{getMoodEmoji(mood)}</span>
                        ))}
                      </div>
                    </div>

                    {/* Contextual Information */}
                    <div className="space-y-2">
                      {student.concerns.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-red-600 dark:text-red-400">Concerns:</span>
                          <span className="text-red-700 dark:text-red-300 ml-2">{student.concerns.slice(0, 2).join(', ')}</span>
                          {student.concerns.length > 2 && <span className="text-red-600 dark:text-red-400 ml-1">+{student.concerns.length - 2} more</span>}
                        </div>
                      )}
                      
                      {/* Activity Context */}
                      {(() => {
                        const daysSinceLastActivity = student.lastCheckIn 
                          ? Math.floor((new Date().getTime() - new Date(student.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24))
                          : null
                        
                        if (daysSinceLastActivity && daysSinceLastActivity > 7) {
                          return (
                            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                              <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <span className="text-xs text-blue-700 dark:text-blue-300">
                                No activity for {daysSinceLastActivity} days - may be focused on assignments or other commitments
                              </span>
                            </div>
                          )
                        } else if (daysSinceLastActivity && daysSinceLastActivity > 3) {
                          return (
                            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                              <Activity className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                              <span className="text-xs text-amber-700 dark:text-amber-300">
                                Reduced activity - normal for busy periods or exam preparation
                              </span>
                            </div>
                          )
                        } else if ((student as any).attendanceRate && (student as any).attendanceRate < 85) {
                          return (
                            <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                              <Calendar className="h-3 w-3 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                              <span className="text-xs text-orange-700 dark:text-orange-300">
                                {((student as any).attendanceRate).toFixed(1)}% attendance - may indicate health or family responsibilities
                              </span>
                            </div>
                          )
                        } else if ((student as any).engagementLevel && (student as any).engagementLevel < 60) {
                          return (
                            <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                              <Target className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                              <span className="text-xs text-purple-700 dark:text-purple-300">
                                Lower engagement - consider checking workload balance or interest levels
                              </span>
                            </div>
                          )
                        } else if (student.riskLevel === 'low' && student.concerns.length === 0) {
                          return (
                            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-xs text-green-700 dark:text-green-300">
                                Generally doing well - showing in attention list for comprehensive monitoring
                              </span>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex w-full md:w-auto gap-2 md:ml-4 mt-2 md:mt-0 justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleStudentDetailView(student)}
                      className="flex-1 md:flex-none bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:border-blue-700 dark:text-blue-300"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setActionSuccess(`Contacting ${student.name}'s parents...`)
                        setTimeout(() => setActionSuccess(null), 2000)
                      }}
                      className="flex-1 md:flex-none"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Modals */}
      {/* Check-in Modal */}
      <AnimatePresence>
        {showCheckInModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCheckInModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Send Wellbeing Check-in</h3>
              </div>
              <p className="text-gray-600 dark:text-slate-400 mb-6">
                Send a wellbeing survey to all students in your class. This will help track their emotional state and identify students who may need support.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCheckInModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendCheckIn}
                  disabled={actionLoading === 'check-in'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {actionLoading === 'check-in' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Check-in'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meeting Modal */}
      <AnimatePresence>
        {showMeetingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowMeetingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Schedule Meeting</h3>
              </div>
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                Schedule individual meetings with at-risk students to provide personalized support.
              </p>
              {data && data.studentInsights.filter(s => s.riskLevel === 'high').length > 0 ? (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">At-risk students:</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {data.studentInsights.filter(s => s.riskLevel === 'high').map(student => (
                      <div key={student.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <span className="text-sm font-medium">{student.name}</span>
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">High Risk</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-slate-400 mb-6 text-sm">No high-risk students currently identified.</p>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowMeetingModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleScheduleMeeting(data?.studentInsights.filter(s => s.riskLevel === 'high').map(s => s.id) || [])}
                  disabled={actionLoading === 'meeting' || !data?.studentInsights.filter(s => s.riskLevel === 'high').length}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === 'meeting' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    'Schedule Meetings'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parent Contact Modal */}
      <AnimatePresence>
        {showParentContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowParentContactModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <Phone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Contact Parents</h3>
              </div>
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                Send notifications to parents of students who need additional support at home.
              </p>
              {data && data.studentInsights.filter(s => s.riskLevel === 'high').length > 0 ? (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Students requiring parent contact:</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {data.studentInsights.filter(s => s.riskLevel === 'high').map(student => (
                      <div key={student.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <span className="text-sm font-medium">{student.name}</span>
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">Urgent</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-slate-400 mb-4 text-sm">No urgent parent contacts needed.</p>
              )}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Message Template:
                </label>
                <textarea
                  className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  rows={3}
                  defaultValue="Your child may benefit from additional wellbeing support. Please contact me to discuss how we can work together."
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowParentContactModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleContactParents(data?.studentInsights.filter(s => s.riskLevel === 'high').map(s => s.id) || [], 'Default message')}
                  disabled={actionLoading === 'contact' || !data?.studentInsights.filter(s => s.riskLevel === 'high').length}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  {actionLoading === 'contact' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Notifications'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recognition Modal */}
      <AnimatePresence>
        {showRecognitionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRecognitionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Positive Recognition</h3>
              </div>
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                Send positive recognition to students showing improvement or demonstrating strengths.
              </p>
              {data && data.studentInsights.filter(s => s.strengths.length > 0).length > 0 ? (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Students with strengths to celebrate:</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {data.studentInsights.filter(s => s.strengths.length > 0).map(student => (
                      <div key={student.id} className="p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{student.name}</span>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">Strengths</Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{student.strengths[0]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-slate-400 mb-4 text-sm">No students with identified strengths currently.</p>
              )}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Recognition Message:
                </label>
                <textarea
                  className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  rows={3}
                  defaultValue="Great job on your positive attitude and engagement! Keep up the excellent work."
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowRecognitionModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handlePositiveRecognition(data?.studentInsights.filter(s => s.strengths.length > 0).map(s => s.id) || [], 'Default recognition')}
                  disabled={actionLoading === 'recognition' || !data?.studentInsights.filter(s => s.strengths.length > 0).length}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {actionLoading === 'recognition' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Recognition'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {showStudentDetailModal && selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowStudentDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 p-4 sm:p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                      {selectedStudent.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {selectedStudent.name}
                      </h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600 dark:text-slate-400 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          Grade {selectedStudent.grade}
                        </span>
                        <Badge className={`${getRiskColor(selectedStudent.riskLevel)} text-xs font-semibold`}>
                          {selectedStudent.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowStudentDetailModal(false)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-6">
                {loadingStudentDetail ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-slate-400">Loading detailed analytics...</span>
                  </div>
                ) : detailedStudentData ? (
                  <>
                    {/* Comprehensive Wellbeing Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300" style={{ fontFamily: 'var(--font-jakarta)' }}>
                              {detailedStudentData.currentAnalytics?.overallWellbeingScore?.toFixed(1) || 'N/A'}/10
                            </div>
                            <div className="text-xs font-medium text-blue-600 dark:text-blue-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                              Overall Wellbeing
                            </div>
                            <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                              {detailedStudentData.trends?.wellbeingTrend === 'improving' ? '↗️ Improving' : 
                               detailedStudentData.trends?.wellbeingTrend === 'declining' ? '↘️ Declining' : '→ Stable'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300" style={{ fontFamily: 'var(--font-jakarta)' }}>
                              {detailedStudentData.currentAnalytics?.emotionalWellbeingScore?.toFixed(1) || 'N/A'}/10
                            </div>
                            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                              Emotional Health
                            </div>
                            <div className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
                              {detailedStudentData.trends?.emotionalTrend === 'improving' ? '↗️ Improving' : 
                               detailedStudentData.trends?.emotionalTrend === 'declining' ? '↘️ Declining' : '→ Stable'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300" style={{ fontFamily: 'var(--font-jakarta)' }}>
                              {detailedStudentData.currentAnalytics?.academicWellbeingScore?.toFixed(1) || 'N/A'}/10
                            </div>
                            <div className="text-xs font-medium text-purple-600 dark:text-purple-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                              Academic Performance
                            </div>
                            <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                              {detailedStudentData.trends?.academicTrend === 'improving' ? '↗️ Improving' : 
                               detailedStudentData.trends?.academicTrend === 'declining' ? '↘️ Declining' : '→ Stable'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300" style={{ fontFamily: 'var(--font-jakarta)' }}>
                              {detailedStudentData.currentAnalytics?.engagementWellbeingScore?.toFixed(1) || 'N/A'}/10
                            </div>
                            <div className="text-xs font-medium text-amber-600 dark:text-amber-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                              Engagement Level
                            </div>
                            <div className="text-xs text-amber-500 dark:text-amber-400 mt-1">
                              {detailedStudentData.trends?.engagementTrend === 'improving' ? '↗️ Improving' : 
                               detailedStudentData.trends?.engagementTrend === 'declining' ? '↘️ Declining' : '→ Stable'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                        <CardContent className="p-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
                              {detailedStudentData.currentAnalytics?.attendanceRate?.toFixed(1) || 'N/A'}%
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Attendance</div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                        <CardContent className="p-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
                              {detailedStudentData.currentAnalytics?.gpa?.toFixed(2) || 'N/A'}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">GPA</div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                        <CardContent className="p-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
                              {detailedStudentData.currentAnalytics?.level || 'N/A'}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Level</div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                        <CardContent className="p-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
                              {detailedStudentData.currentAnalytics?.xpEarned || 0}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">XP Earned</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Mood & Emotional Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Smile className="h-5 w-5 text-yellow-500" />
                          Mood & Emotional Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-sm mb-3">Recent Mood History (Last 14 days)</h4>
                            <div className="space-y-2">
                              {detailedStudentData.moodHistory?.slice(0, 7).map((mood: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                  <span className="text-sm text-gray-600 dark:text-slate-400">
                                    {new Date(mood.date).toLocaleDateString()}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{mood.emoji}</span>
                                    <span className="text-sm font-medium capitalize">{mood.mood}</span>
                                  </div>
                                </div>
                              )) || <p className="text-sm text-gray-500">No recent mood data</p>}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-sm mb-3">Mood Statistics</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-slate-400">Total Entries:</span>
                                <span className="font-medium">{detailedStudentData.moodStats?.totalEntries || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-green-600 dark:text-green-400">Positive Moods:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">{detailedStudentData.moodStats?.positiveCount || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-red-600 dark:text-red-400">Negative Moods:</span>
                                <span className="font-medium text-red-600 dark:text-red-400">{detailedStudentData.moodStats?.negativeCount || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-slate-400">Neutral Moods:</span>
                                <span className="font-medium">{detailedStudentData.moodStats?.neutralCount || 0}</span>
                              </div>
                            </div>
                            
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="text-sm">
                                <strong>Mood Score Average:</strong> {detailedStudentData.currentAnalytics?.moodScoreAvg?.toFixed(1) || 'N/A'}/10
                              </div>
                              <div className="text-sm mt-1">
                                <strong>Trend:</strong> {detailedStudentData.currentAnalytics?.moodTrend || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Risk Assessment & Intervention */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                            Risk Assessment & Concerns
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <span className="font-medium">Risk Level:</span>
                              <Badge className={`${getRiskColor(detailedStudentData.currentAnalytics?.riskLevel || 'low')} font-semibold`}>
                                {(detailedStudentData.currentAnalytics?.riskLevel || 'low').toUpperCase()}
                              </Badge>
                            </div>
                            
                            {detailedStudentData.currentAnalytics?.riskScore && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-slate-400">Risk Score:</span>
                                <span className="font-medium">{detailedStudentData.currentAnalytics.riskScore.toFixed(1)}/10</span>
                              </div>
                            )}

                            <div>
                              <h4 className="font-semibold text-sm mb-2">Critical Risk Factors:</h4>
                              {detailedStudentData.currentAnalytics?.criticalRiskFactors?.length > 0 ? (
                                <div className="space-y-1">
                                  {detailedStudentData.currentAnalytics.criticalRiskFactors.map((factor: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      <span className="text-sm text-red-700 dark:text-red-300">{factor}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-slate-400">No critical risk factors identified</p>
                              )}
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-2">Early Warning Flags:</h4>
                              {detailedStudentData.currentAnalytics?.earlyWarningFlags?.length > 0 ? (
                                <div className="space-y-1">
                                  {detailedStudentData.currentAnalytics.earlyWarningFlags.slice(0, 3).map((flag: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                      <span className="text-sm text-yellow-700 dark:text-yellow-300">{flag}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-slate-400">No warning flags</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <Star className="h-5 w-5" />
                            Strengths & Protective Factors
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-slate-400">Resilience Score:</span>
                              <span className="font-medium">{detailedStudentData.currentAnalytics?.resilienceScore?.toFixed(1) || 'N/A'}/10</span>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-2">Protective Factors:</h4>
                              {detailedStudentData.currentAnalytics?.protectiveFactors && 
                               Array.isArray(detailedStudentData.currentAnalytics.protectiveFactors) &&
                               detailedStudentData.currentAnalytics.protectiveFactors.length > 0 ? (
                                <div className="space-y-1">
                                  {detailedStudentData.currentAnalytics.protectiveFactors.slice(0, 4).map((factor: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded">
                                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                      <span className="text-sm text-emerald-700 dark:text-emerald-300">{factor}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-slate-400">No protective factors identified</p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Social Skills</div>
                                <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                                  {detailedStudentData.currentAnalytics?.peerInteractionScore?.toFixed(1) || 'N/A'}/10
                                </div>
                              </div>
                              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Collaboration</div>
                                <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                                  {detailedStudentData.currentAnalytics?.collaborationScore?.toFixed(1) || 'N/A'}/10
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Additional Analytics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Academic & Engagement Details */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-purple-500" />
                            Academic & Engagement Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-gray-600 dark:text-slate-400">Quest Completion</div>
                                <div className="text-lg font-bold">{detailedStudentData.currentAnalytics?.questCompletionRate?.toFixed(1) || 'N/A'}%</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600 dark:text-slate-400">Achievement Count</div>
                                <div className="text-lg font-bold">{detailedStudentData.currentAnalytics?.achievementCount || 0}</div>
                              </div>
                            </div>

                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Social & Behavioral</div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Gratitude Entries: <span className="font-medium">{detailedStudentData.currentAnalytics?.gratitudeEntriesCount || 0}</span></div>
                                <div>Kindness Acts: <span className="font-medium">{detailedStudentData.currentAnalytics?.kindnessActsCount || 0}</span></div>
                                <div>Help Requests: <span className="font-medium">{detailedStudentData.currentAnalytics?.helpRequestsCount || 0}</span></div>
                                <div>Incidents: <span className="font-medium">{detailedStudentData.currentAnalytics?.incidentCount || 0}</span></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Help & Support History */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-blue-500" />
                            Help & Support History
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{detailedStudentData.helpStats?.totalRequests || 0}</div>
                                <div className="text-xs text-blue-600 dark:text-blue-400">Total</div>
                              </div>
                              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                <div className="text-lg font-bold text-red-700 dark:text-red-300">{detailedStudentData.helpStats?.urgentRequests || 0}</div>
                                <div className="text-xs text-red-600 dark:text-red-400">Urgent</div>
                              </div>
                              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                <div className="text-lg font-bold text-green-700 dark:text-green-300">{detailedStudentData.helpStats?.resolvedRequests || 0}</div>
                                <div className="text-xs text-green-600 dark:text-green-400">Resolved</div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-2">Recent Help Requests:</h4>
                              {detailedStudentData.helpRequests?.length > 0 ? (
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {detailedStudentData.helpRequests.map((request: any, idx: number) => (
                                    <div key={idx} className="p-2 bg-gray-50 dark:bg-slate-700 rounded text-sm">
                                      <div className="flex items-center justify-between mb-1">
                                        <Badge className={`text-xs ${request.urgency === 'high' ? 'bg-red-100 text-red-800' : 
                                                                   request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                                                   'bg-green-100 text-green-800'}`}>
                                          {request.urgency}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                          {new Date(request.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-gray-700 dark:text-slate-300 text-xs truncate">{request.message}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-slate-400">No recent help requests</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Intelligent Insights */}
                    {detailedStudentData.insights && detailedStudentData.insights.length > 0 && (
                      <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <Lightbulb className="h-5 w-5" />
                            Intelligent Insights & Context
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {detailedStudentData.insights.map((insight: any, idx: number) => (
                              <div 
                                key={idx} 
                                className={`p-4 rounded-lg border-l-4 ${
                                  insight.level === 'urgent' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                                  insight.level === 'concern' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' :
                                  insight.level === 'positive' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                                  'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-1.5 rounded-full ${
                                    insight.level === 'urgent' ? 'bg-red-100 dark:bg-red-900/50' :
                                    insight.level === 'concern' ? 'bg-orange-100 dark:bg-orange-900/50' :
                                    insight.level === 'positive' ? 'bg-green-100 dark:bg-green-900/50' :
                                    'bg-blue-100 dark:bg-blue-900/50'
                                  }`}>
                                    {insight.type === 'activity' && <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                                    {insight.type === 'academic' && <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                                    {insight.type === 'attendance' && <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                                    {insight.type === 'emotional' && <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" />}
                                    {insight.type === 'support' && <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                                    {insight.type === 'engagement' && <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className={`font-semibold text-sm mb-1 ${
                                      insight.level === 'urgent' ? 'text-red-700 dark:text-red-300' :
                                      insight.level === 'concern' ? 'text-orange-700 dark:text-orange-300' :
                                      insight.level === 'positive' ? 'text-green-700 dark:text-green-300' :
                                      'text-blue-700 dark:text-blue-300'
                                    }`}>
                                      {insight.title}
                                    </h4>
                                    <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">
                                      {insight.message}
                                    </p>
                                    <div className={`text-xs p-2 rounded ${
                                      insight.level === 'urgent' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                                      insight.level === 'concern' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' :
                                      insight.level === 'positive' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                                      'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                    }`}>
                                      <strong>Suggestion:</strong> {insight.suggestion}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Intervention Recommendations */}
                    {detailedStudentData.currentAnalytics?.interventionRecommended && (
                      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                            <AlertCircle className="h-5 w-5" />
                            Recommended Interventions
                            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                              {detailedStudentData.currentAnalytics.interventionPriority || 'Standard'}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {detailedStudentData.currentAnalytics.recommendedActions?.length > 0 ? (
                            <div className="space-y-2">
                              {detailedStudentData.currentAnalytics.recommendedActions.map((action: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  <span className="text-sm text-orange-700 dark:text-orange-300">{action}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-orange-600 dark:text-orange-400">General monitoring and support recommended</p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-600">
                    <Button
                      onClick={() => {
                        setActionSuccess(`Scheduling meeting with ${selectedStudent.name}...`)
                        setTimeout(() => setActionSuccess(null), 2000)
                        setShowStudentDetailModal(false)
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Meeting
                    </Button>
                    <Button
                      onClick={() => {
                        setActionSuccess(`Contacting ${selectedStudent.name}'s parents...`)
                        setTimeout(() => setActionSuccess(null), 2000)
                        setShowStudentDetailModal(false)
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Parents
                    </Button>
                    <Button
                      onClick={() => {
                        setActionSuccess(`Sending positive recognition to ${selectedStudent.name}...`)
                        setTimeout(() => setActionSuccess(null), 2000)
                        setShowStudentDetailModal(false)
                      }}
                      variant="outline"
                      className="flex-1 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:border-purple-700 dark:text-purple-300"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Send Recognition
                    </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-slate-400">Unable to load detailed student data</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
