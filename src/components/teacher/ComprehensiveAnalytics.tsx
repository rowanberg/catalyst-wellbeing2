'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  TrendingUp, 
  Heart, 
  AlertTriangle, 
  Trophy, 
  Target,
  Droplet,
  Moon,
  Sparkles,
  CheckCircle2,
  Activity,
  RefreshCw,
  TrendingDown,
  Minus,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppSelector } from '@/lib/redux/hooks'

// Memoized skeleton loader for performance
const SkeletonLoader = memo(() => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="flex justify-between items-center">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
    </div>
    
    {/* Stats grid skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-3 flex-1">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
    
    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-48 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </div>
))

SkeletonLoader.displayName = 'SkeletonLoader'

// Memoized metric card component
interface MetricCardProps {
  title: string
  value: number | string
  subtitle: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  trend?: 'up' | 'down' | 'neutral'
  delay?: number
}

const MetricCard = memo(({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend, delay = 0 }: MetricCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1, duration: 0.3 }}
  >
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 h-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{subtitle}</p>
              {trend && (
                <span className={`inline-flex items-center ${
                  trend === 'up' ? 'text-green-600' :
                  trend === 'down' ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                  {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                  {trend === 'neutral' && <Minus className="h-3 w-3" />}
                </span>
              )}
            </div>
          </div>
          <div className={`p-3 ${iconBg} rounded-xl`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
))

MetricCard.displayName = 'MetricCard'

// Memoized mood indicator component
const MoodIndicator = memo(({ mood, count, index }: { mood: string; count: number; index: number }) => {
  const moodConfig: Record<string, { color: string; bg: string; emoji: string }> = {
    happy: { color: 'bg-yellow-400', bg: 'bg-yellow-50', emoji: '😊' },
    excited: { color: 'bg-orange-400', bg: 'bg-orange-50', emoji: '🤩' },
    calm: { color: 'bg-blue-400', bg: 'bg-blue-50', emoji: '😌' },
    sad: { color: 'bg-gray-400', bg: 'bg-gray-50', emoji: '😢' },
    angry: { color: 'bg-red-400', bg: 'bg-red-50', emoji: '😠' },
    anxious: { color: 'bg-purple-400', bg: 'bg-purple-50', emoji: '😰' }
  }

  const config = moodConfig[mood] || moodConfig.calm

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center justify-between p-3 rounded-lg ${config.bg} hover:shadow-sm transition-all duration-200 cursor-default`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{config.emoji}</span>
        <span className="text-sm font-medium capitalize text-gray-700">{mood}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-900">{count}</span>
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
      </div>
    </motion.div>
  )
})

MoodIndicator.displayName = 'MoodIndicator'

interface AnalyticsData {
  overview: {
    totalStudents: number
    activeToday: number
    avgXP: number
    avgLevel: number
    engagementRate: number
  }
  wellbeing: {
    moodDistribution: {
      happy: number
      excited: number
      calm: number
      sad: number
      angry: number
      anxious: number
    }
    avgEnergy: number
    avgStress: number
    studentsNeedingSupport: number
    pendingHelpRequests: number
    urgentHelpRequests: number
    trend: Array<{
      date: string
      avgEnergy: number
      avgStress: number
      checkIns: number
    }>
  }
  engagement: {
    questCompletionRate: number
    totalQuestsCompleted: number
    avgWaterIntake: number
    avgSleepHours: number
    weeklyKindnessActs: number
  }
  topPerformers: Array<{
    id: string
    name: string
    xp: number
    level: number
  }>
  insights: Array<{
    type: 'alert' | 'warning' | 'info' | 'success'
    priority: 'high' | 'medium' | 'low'
    message: string
    action: string | null
  }>
}

function ComprehensiveAnalytics() {
  const { user } = useAppSelector((state) => state.auth)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Memoized calculations for performance - MUST be before conditional returns (Rules of Hooks)
  const engagementScore = useMemo(() => {
    if (!data) return 0
    const scores = [
      data.overview.engagementRate,
      data.engagement.questCompletionRate,
      data.wellbeing.avgEnergy,
      100 - data.wellbeing.avgStress
    ]
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }, [data])

  const moodHealth = useMemo(() => {
    if (!data) return 0
    const positive = data.wellbeing.moodDistribution.happy + data.wellbeing.moodDistribution.excited + data.wellbeing.moodDistribution.calm
    const total = Object.values(data.wellbeing.moodDistribution).reduce((a, b) => a + b, 0)
    return total > 0 ? Math.round((positive / total) * 100) : 0
  }, [data])

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    
    setError(null)

    try {
      // Get school_id from profile
      let schoolId: string | undefined
      const profileResponse = await fetch('/api/profile')
      if (profileResponse.ok) {
        const profile = await profileResponse.json()
        schoolId = profile.school_id
      }

      if (!schoolId || !user?.id) {
        throw new Error('Missing required data')
      }

      const response = await fetch(`/api/teacher/analytics?teacher_id=${user.id}&school_id=${schoolId}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchAnalytics()
    }
  }, [user?.id])

  if (loading) {
    return <SkeletonLoader />
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">{error || 'Failed to load analytics'}</p>
        <button 
          onClick={() => fetchAnalytics()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const { overview, wellbeing, engagement, topPerformers, insights } = data

  return (
    <div className="space-y-6 bg-gray-50 -m-6 p-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Real-time insights from your students</p>
        </div>
        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Priority Insights with better design */}
      <AnimatePresence>
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {insights.map((insight, index) => {
              const config = {
                alert: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-900', icon: AlertTriangle, iconColor: 'text-red-600' },
                warning: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-900', icon: AlertTriangle, iconColor: 'text-yellow-600' },
                success: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-900', icon: CheckCircle2, iconColor: 'text-green-600' },
                info: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', icon: Zap, iconColor: 'text-blue-600' }
              }[insight.type]
              
              const Icon = config.icon
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${config.bg} ${config.border} border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${config.text}`}>{insight.message}</p>
                      {insight.action && (
                        <p className="text-xs text-gray-600 mt-1">{insight.action}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key Metrics - Using memoized MetricCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Students"
          value={overview.totalStudents}
          subtitle="Across all classes"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          delay={0}
        />
        <MetricCard
          title="Active Today"
          value={overview.activeToday}
          subtitle={`${overview.engagementRate}% engagement`}
          icon={Activity}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          trend={overview.engagementRate >= 75 ? 'up' : overview.engagementRate >= 50 ? 'neutral' : 'down'}
          delay={1}
        />
        <MetricCard
          title="Class Health"
          value={`${moodHealth}%`}
          subtitle="Positive moods"
          icon={Heart}
          iconBg="bg-pink-50"
          iconColor="text-pink-600"
          trend={moodHealth >= 75 ? 'up' : moodHealth >= 50 ? 'neutral' : 'down'}
          delay={2}
        />
        <MetricCard
          title="Need Support"
          value={wellbeing.studentsNeedingSupport}
          subtitle={wellbeing.urgentHelpRequests > 0 ? `${wellbeing.urgentHelpRequests} urgent` : 'All good'}
          icon={AlertTriangle}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          trend={wellbeing.studentsNeedingSupport > 5 ? 'down' : 'neutral'}
          delay={3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mood Distribution */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              Mood Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(wellbeing.moodDistribution).map(([mood, count], index) => (
                <MoodIndicator key={mood} mood={mood} count={count as number} index={index} />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">Energy</span>
                  <span className="font-semibold text-green-600">{wellbeing.avgEnergy}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${wellbeing.avgEnergy}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">Stress</span>
                  <span className="font-semibold text-orange-600">{wellbeing.avgStress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${wellbeing.avgStress}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quest Completion with circular progress */}
              <div className="relative">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">Quest Completion</span>
                  <span className="text-2xl font-bold text-green-600">{engagement.questCompletionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${engagement.questCompletionRate}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-3 rounded-full ${
                      engagement.questCompletionRate >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      engagement.questCompletionRate >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      'bg-gradient-to-r from-orange-400 to-orange-600'
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{engagement.totalQuestsCompleted} completed this week</p>
              </div>
              
              {/* Habit Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg transition-all"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Droplet className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Water</p>
                    <p className="text-lg font-bold text-gray-900">{engagement.avgWaterIntake}</p>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg transition-all"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Moon className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Sleep</p>
                    <p className="text-lg font-bold text-gray-900">{engagement.avgSleepHours}h</p>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg transition-all col-span-2"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-medium">Kindness Acts This Week</p>
                    <p className="text-lg font-bold text-gray-900">{engagement.weeklyKindnessActs} acts of kindness</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <div className="space-y-2">
                {topPerformers.map((student, index) => {
                  const medals = ['🥇', '🥈', '🥉']
                  const bgColors = [
                    'bg-gradient-to-r from-yellow-100 to-yellow-200',
                    'bg-gradient-to-r from-gray-100 to-gray-200',
                    'bg-gradient-to-r from-orange-100 to-orange-200',
                    'bg-white',
                    'bg-white'
                  ]
                  
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className={`flex items-center gap-3 p-3 ${bgColors[index]} rounded-lg shadow-sm border border-gray-200 transition-all`}
                    >
                      <div className="text-2xl">{medals[index] || '⭐'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-600">Level {student.level}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs font-medium text-blue-600">{student.xp} XP</span>
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Trophy className={`h-4 w-4 ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-gray-600' :
                          index === 2 ? 'text-orange-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No performance data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wellbeing Trend - Improved visualization */}
      {wellbeing.trend.length > 0 && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                7-Day Wellbeing Trend
              </CardTitle>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-600">Energy</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-gray-600">Stress</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wellbeing.trend.map((day, index) => {
                const date = new Date(day.date)
                const isToday = date.toDateString() === new Date().toDateString()
                
                return (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg ${
                      isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    } transition-all hover:shadow-sm`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-24 flex-shrink-0">
                        <p className={`text-sm font-medium ${
                          isToday ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        {/* Energy bar */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600">Energy</span>
                            <span className="text-xs font-bold text-green-600">{day.avgEnergy}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${day.avgEnergy}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05 + 0.2, ease: "easeOut" }}
                              className="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full"
                            />
                          </div>
                        </div>
                        
                        {/* Stress bar */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600">Stress</span>
                            <span className="text-xs font-bold text-orange-600">{day.avgStress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${day.avgStress}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05 + 0.3, ease: "easeOut" }}
                              className="bg-gradient-to-r from-orange-400 to-orange-600 h-2.5 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-200">
                        <Activity className="h-3.5 w-3.5 text-blue-500" />
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{day.checkIns}</p>
                          <p className="text-[10px] text-gray-500">check-ins</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default memo(ComprehensiveAnalytics)
