'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Brain, 
  Users, 
  BookOpen, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Shield,
  Target,
  Lightbulb,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  PieChart,
  Loader,
  RefreshCw,
  Info,
  Star,
  Award,
  Zap,
  Eye,
  Frown,
  Meh,
  Smile,
  User,
  Clock
} from 'lucide-react'
import { useDarkMode } from '@/contexts/DarkModeContext'
import { useWellbeingData } from '@/hooks/useParentAPI'

interface WellbeingTabProps {
  studentId: string
  studentName?: string
}

interface WellbeingData {
  id: string
  student_id: string
  student_name: string
  student_grade: string
  student_class: string
  student_avatar?: string
  analysis_date: string
  period_type: string
  overall_wellbeing_score: number
  emotional_wellbeing_score: number
  academic_wellbeing_score: number
  engagement_wellbeing_score: number
  social_wellbeing_score: number
  behavioral_wellbeing_score: number
  risk_level: 'thriving' | 'low' | 'medium' | 'high' | 'critical'
  risk_score: number
  risk_trend: 'increasing' | 'stable' | 'decreasing'
  risk_factors: string[]
  protective_factors: string[]
  risk_factor_count: number
  protective_factor_count: number
  intervention_recommended: boolean
  intervention_type?: string
  intervention_priority?: 'immediate' | 'urgent' | 'moderate' | 'low'
  recommended_actions: string[]
  early_warning_flags: string[]
  warning_flag_count: number
  predicted_next_score: number
  predicted_risk_level: string
  confidence_level: number
  overall_score_trend: 'improving' | 'stable' | 'declining'
  score_change_from_previous: number
  school_percentile: number
  grade_percentile: number
  mood_score_avg: number
  gpa: number
  attendance_rate: number
  quest_completion_rate: number
  xp_earned: number
  incident_count: number
  help_requests_count: number
  urgent_help_requests_count: number
  data_quality_score: number
  data_completeness_percentage: number
}

const WellbeingTab = React.memo(function WellbeingTab({ studentId, studentName }: WellbeingTabProps) {
  const { isDarkMode } = useDarkMode()
  const [wellbeingData, setWellbeingData] = useState<WellbeingData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  // Use the new caching API
  const { data: wellbeingApiData, error: apiError, isLoading, refetch } = useWellbeingData(studentId)
  
  // Transform API data to component state
  useEffect(() => {
    if (wellbeingApiData?.analytics && wellbeingApiData.analytics.length > 0) {
      // Map the API data to the component's expected format
      const apiData = wellbeingApiData.analytics[0]
      const transformedData: WellbeingData = {
        ...apiData,
        risk_level: (apiData.risk_level as 'thriving' | 'low' | 'medium' | 'high' | 'critical') || 'low',
        student_name: studentName || 'Student',
        student_grade: 'Grade N/A',
        student_class: 'Class N/A',
        analysis_date: new Date().toISOString(),
        period_type: 'weekly',
        risk_trend: 'stable',
        risk_factors: apiData.risk_factors || [],
        protective_factors: apiData.protective_factors || [],
        risk_factor_count: apiData.risk_factors?.length || 0,
        protective_factor_count: apiData.protective_factors?.length || 0,
        intervention_recommended: apiData.intervention_recommended || false,
        intervention_type: apiData.intervention_type || '',
        intervention_priority: (apiData.intervention_priority as 'low' | 'immediate' | 'urgent' | 'moderate') || 'low',
        recommended_actions: apiData.recommended_actions || [],
        early_warning_flags: [],
        warning_flag_count: 0,
        predicted_next_score: apiData.predicted_next_score || 0,
        predicted_risk_level: 'low',
        confidence_level: apiData.confidence_level || 0,
        overall_score_trend: 'stable',
        score_change_from_previous: 0,
        school_percentile: apiData.school_percentile || 0,
        grade_percentile: 0,
        mood_score_avg: 0,
        gpa: apiData.gpa || 0,
        attendance_rate: apiData.attendance_rate || 0,
        quest_completion_rate: 0,
        xp_earned: 0,
        incident_count: apiData.incident_count || 0,
        help_requests_count: apiData.help_requests_count || 0,
        urgent_help_requests_count: 0,
        data_quality_score: 1,
        data_completeness_percentage: 100
      }
      setWellbeingData(transformedData)
      setError(null)
    } else if (apiError) {
      setError(apiError.message)
      setWellbeingData(null)
    }
  }, [wellbeingApiData, apiError, studentName])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }, [refetch])

  // Memoized helper functions for performance
  const formatScore = useCallback((score: number) => {
    return Math.round(score * 10) / 10
  }, [])

  const getRiskColor = useMemo(() => (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'from-red-600 to-red-700'
      case 'high': return 'from-orange-600 to-red-600'
      case 'medium': return 'from-yellow-500 to-orange-500'
      case 'low': return 'from-green-500 to-emerald-500'
      case 'thriving': return 'from-emerald-500 to-green-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }, [])

  const getRiskBadgeColor = useMemo(() => (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'thriving': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }, [])

  // Use isLoading from the API hook instead of local loading state
  const loading = isLoading

  if (loading) {
    return (
      <div className="space-y-4 lg:space-y-6 pb-4 lg:pb-0">
        {/* Mobile header skeleton */}
        <div className="flex items-center justify-between px-1">
          <div className="h-6 lg:h-8 w-32 lg:w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 lg:h-10 w-8 lg:w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        
        {/* Mobile-optimized skeleton cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-3 lg:p-6 animate-pulse border border-gray-200 dark:border-gray-700"
            >
              <div className="h-3 lg:h-4 w-16 lg:w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 lg:mb-4" />
              <div className="h-6 lg:h-8 w-12 lg:w-16 bg-gray-300 dark:bg-gray-600 rounded mb-1 lg:mb-2" />
              <div className="h-1.5 lg:h-2 bg-gray-200 dark:bg-gray-700 rounded" />
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-sm lg:max-w-2xl"
      >
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6 lg:p-12 text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4 lg:mb-6"
            >
              <AlertTriangle className="h-6 w-6 lg:h-8 lg:w-8 text-red-600 dark:text-red-400" />
            </motion.div>
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-2 lg:mb-3">
              Unable to Load Wellbeing Data
            </h3>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mb-4 lg:mb-6">{error}</p>
            <Button 
              onClick={handleRefresh} 
              className="bg-red-600 hover:bg-red-700 text-white w-full lg:w-auto"
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (!wellbeingData) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-sm lg:max-w-2xl"
      >
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-6 lg:p-12 text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 lg:mb-6"
            >
              <Heart className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-2 lg:mb-3">
              No Wellbeing Data Available
            </h3>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Wellbeing analytics will appear here once data is collected.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 lg:space-y-6 pb-4 lg:pb-0"
    >
      {/* Mobile-optimized header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
        <div className="flex items-center gap-3 lg:gap-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`p-2 lg:p-3 bg-gradient-to-r ${getRiskColor(wellbeingData.risk_level)} rounded-xl shadow-lg`}
          >
            <Heart className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {wellbeingData.student_name || studentName}'s Wellbeing
            </h1>
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate">
              {wellbeingData.student_grade || 'Student'} • {new Date(wellbeingData.analysis_date).toLocaleDateString()}
            </p>
          </div>
          {/* Mobile refresh button */}
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="lg:hidden p-2 h-8 w-8"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Mobile-optimized badges */}
        <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
          <Badge className={`${getRiskBadgeColor(wellbeingData.risk_level)} text-[10px] lg:text-xs px-2 py-1`}>
            {wellbeingData.risk_level.toUpperCase()} RISK
          </Badge>
          <Badge variant="outline" className={`text-[10px] lg:text-xs px-2 py-1 ${
            wellbeingData.overall_score_trend === 'improving' ? 'border-green-500 text-green-700 dark:text-green-400' :
            wellbeingData.overall_score_trend === 'declining' ? 'border-red-500 text-red-700 dark:text-red-400' :
            'border-gray-500 text-gray-700 dark:text-gray-400'
          }`}>
            {wellbeingData.overall_score_trend === 'improving' ? '📈 IMPROVING' :
             wellbeingData.overall_score_trend === 'declining' ? '📉 DECLINING' : '➡️ STABLE'}
          </Badge>
          {/* Desktop refresh button */}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="hidden lg:flex items-center gap-2"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Mobile-optimized overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-200 active:scale-95 touch-manipulation">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between mb-2 lg:mb-4">
                <div className="p-1.5 lg:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Heart className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {formatScore(wellbeingData.overall_wellbeing_score)}<span className="text-sm lg:text-base text-gray-500">/10</span>
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm lg:text-base">Overall</h3>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mb-2 lg:mb-3">Comprehensive</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 lg:h-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(wellbeingData.overall_wellbeing_score / 10) * 100}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-1.5 lg:h-2 bg-blue-500 rounded-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-purple-200 dark:border-purple-800 hover:shadow-md transition-all duration-200 active:scale-95 touch-manipulation">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between mb-2 lg:mb-4">
                <div className="p-1.5 lg:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Brain className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {formatScore(wellbeingData.emotional_wellbeing_score)}<span className="text-sm lg:text-base text-gray-500">/10</span>
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm lg:text-base">Emotional</h3>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mb-2 lg:mb-3">Mood & feelings</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 lg:h-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(wellbeingData.emotional_wellbeing_score / 10) * 100}%` }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="h-1.5 lg:h-2 bg-purple-500 rounded-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200 active:scale-95 touch-manipulation">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between mb-2 lg:mb-4">
                <div className="p-1.5 lg:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {formatScore(wellbeingData.social_wellbeing_score)}<span className="text-sm lg:text-base text-gray-500">/10</span>
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm lg:text-base">Social</h3>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mb-2 lg:mb-3">Relationships</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 lg:h-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(wellbeingData.social_wellbeing_score / 10) * 100}%` }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="h-1.5 lg:h-2 bg-green-500 rounded-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-orange-200 dark:border-orange-800 hover:shadow-md transition-all duration-200 active:scale-95 touch-manipulation">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between mb-2 lg:mb-4">
                <div className="p-1.5 lg:p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Activity className="h-4 w-4 lg:h-5 lg:w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {formatScore(wellbeingData.engagement_wellbeing_score)}<span className="text-sm lg:text-base text-gray-500">/10</span>
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm lg:text-base">Engagement</h3>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mb-2 lg:mb-3">Participation</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 lg:h-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(wellbeingData.engagement_wellbeing_score / 10) * 100}%` }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="h-1.5 lg:h-2 bg-orange-500 rounded-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mobile-optimized tabs section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="flex flex-col items-center gap-1 py-2 lg:py-3 text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700"
            >
              <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="hidden lg:inline">Overview</span>
              <span className="lg:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="risks" 
              className="flex flex-col items-center gap-1 py-2 lg:py-3 text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700"
            >
              <Shield className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="hidden lg:inline">Risk Factors</span>
              <span className="lg:hidden">Risks</span>
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="flex flex-col items-center gap-1 py-2 lg:py-3 text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700"
            >
              <Lightbulb className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="hidden lg:inline">AI Insights</span>
              <span className="lg:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger 
              value="actions" 
              className="flex flex-col items-center gap-1 py-2 lg:py-3 text-xs lg:text-sm data-[state=active]:bg-white data-[state=active]:dark:bg-gray-700"
            >
              <Target className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="hidden lg:inline">Actions</span>
              <span className="lg:hidden">Help</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile-optimized tab content */}
          <div className="mt-4 lg:mt-6">
            <AnimatePresence mode="wait">
              {activeView === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 lg:space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
                    {/* Academic Performance - Mobile Optimized */}
                    <Card className="border-green-200 dark:border-green-800">
                      <CardHeader className="pb-3 lg:pb-6">
                        <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                          <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 dark:text-green-400" />
                          Academic Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 lg:space-y-4 p-3 lg:p-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">Academic Score</span>
                          <span className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                            {formatScore(wellbeingData.academic_wellbeing_score)}<span className="text-sm text-gray-500">/10</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 lg:h-3">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(wellbeingData.academic_wellbeing_score / 10) * 100}%` }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="h-2 lg:h-3 bg-green-500 rounded-full"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 lg:gap-4 pt-2 lg:pt-4">
                          <div className="text-center p-2 lg:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                              {wellbeingData.gpa?.toFixed(2) || 'N/A'}
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">GPA</div>
                          </div>
                          <div className="text-center p-2 lg:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                              {Math.round((wellbeingData.attendance_rate || 0) * 100)}%
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Attendance</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Behavioral Patterns - Mobile Optimized */}
                    <Card className="border-blue-200 dark:border-blue-800">
                      <CardHeader className="pb-3 lg:pb-6">
                        <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
                          <Activity className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 dark:text-blue-400" />
                          Behavioral Patterns
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 lg:space-y-4 p-3 lg:p-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">Behavioral Score</span>
                          <span className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                            {formatScore(wellbeingData.behavioral_wellbeing_score)}<span className="text-sm text-gray-500">/10</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 lg:h-3">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(wellbeingData.behavioral_wellbeing_score / 10) * 100}%` }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="h-2 lg:h-3 bg-blue-500 rounded-full"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 lg:gap-4 pt-2 lg:pt-4">
                          <div className="text-center p-2 lg:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                              {wellbeingData.incident_count || 0}
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Incidents</div>
                          </div>
                          <div className="text-center p-2 lg:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                              {wellbeingData.help_requests_count || 0}
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Help Requests</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {activeView === 'risks' && (
                <motion.div
                  key="risks"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 lg:space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
                    {/* Risk Factors - Mobile Optimized */}
                    <Card className="border-red-200 dark:border-red-800">
                      <CardHeader className="pb-3 lg:pb-6">
                        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm lg:text-base">
                          <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5" />
                          Risk Factors ({wellbeingData.risk_factor_count || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 lg:p-6">
                        {wellbeingData.risk_factors?.length > 0 ? (
                          <div className="space-y-2 lg:space-y-3">
                            {wellbeingData.risk_factors.map((factor, index) => (
                              <div key={index} className="flex items-start gap-2 lg:gap-3 p-2 lg:p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <span className="text-xs lg:text-sm text-red-700 dark:text-red-300">{factor}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 lg:py-8">
                            <CheckCircle className="h-8 w-8 lg:h-12 lg:w-12 text-green-500 mx-auto mb-2" />
                            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                              No significant risk factors identified
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Protective Factors */}
                    <Card className="border-green-200 dark:border-green-800">
                      <CardHeader className="pb-3 lg:pb-6">
                        <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm lg:text-base">
                          <Shield className="h-4 w-4 lg:h-5 lg:w-5" />
                          Protective Factors ({wellbeingData.protective_factor_count || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 lg:p-6">
                        {wellbeingData.protective_factors?.length > 0 ? (
                          <div className="space-y-2 lg:space-y-3">
                            {wellbeingData.protective_factors.map((factor, index) => (
                              <div key={index} className="flex items-start gap-2 lg:gap-3 p-2 lg:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <Shield className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-xs lg:text-sm text-green-700 dark:text-green-300">{factor}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 lg:py-8">
                            <Info className="h-8 w-8 lg:h-12 lg:w-12 text-blue-500 mx-auto mb-2" />
                            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                              Building protective factors...
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {activeView === 'insights' && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 lg:space-y-6"
                >
                  <div className="grid grid-cols-1 gap-3 lg:gap-6">
                    {/* AI Predictions */}
                    <Card className="border-purple-200 dark:border-purple-800">
                      <CardHeader className="pb-3 lg:pb-6">
                        <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm lg:text-base">
                          <Brain className="h-4 w-4 lg:h-5 lg:w-5" />
                          AI Predictions & Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 lg:p-6 space-y-4 lg:space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                          <div className="text-center p-3 lg:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="text-lg lg:text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {formatScore(wellbeingData.predicted_next_score || 0)}
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Predicted Score</div>
                          </div>
                          <div className="text-center p-3 lg:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-lg lg:text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {Math.round((wellbeingData.confidence_level || 0) * 100)}%
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Confidence</div>
                          </div>
                          <div className="text-center p-3 lg:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="text-lg lg:text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {Math.round(wellbeingData.school_percentile || 0)}%
                            </div>
                            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">School Rank</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {activeView === 'actions' && (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 lg:space-y-6"
                >
                  <div className="grid grid-cols-1 gap-3 lg:gap-6">
                    {/* Recommended Actions */}
                    <Card className="border-blue-200 dark:border-blue-800">
                      <CardHeader className="pb-3 lg:pb-6">
                        <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm lg:text-base">
                          <Target className="h-4 w-4 lg:h-5 lg:w-5" />
                          Recommended Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 lg:p-6">
                        {wellbeingData.recommended_actions?.length > 0 ? (
                          <div className="space-y-2 lg:space-y-3">
                            {wellbeingData.recommended_actions.map((action, index) => (
                              <div key={index} className="flex items-start gap-2 lg:gap-3 p-2 lg:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <Lightbulb className="h-3 w-3 lg:h-4 lg:w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span className="text-xs lg:text-sm text-blue-700 dark:text-blue-300">{action}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 lg:py-8">
                            <Star className="h-8 w-8 lg:h-12 lg:w-12 text-yellow-500 mx-auto mb-2" />
                            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                              Keep up the great work! No specific actions needed.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Professional Support */}
                    {wellbeingData.intervention_recommended && (
                      <Card className="border-orange-200 dark:border-orange-800">
                        <CardHeader className="pb-3 lg:pb-6">
                          <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm lg:text-base">
                            <Phone className="h-4 w-4 lg:h-5 lg:w-5" />
                            Professional Support Recommended
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 lg:p-6">
                          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 lg:p-4">
                            <p className="text-xs lg:text-sm text-orange-700 dark:text-orange-300 mb-2">
                              Priority: {wellbeingData.intervention_priority?.toUpperCase()}
                            </p>
                            <p className="text-xs lg:text-sm text-orange-600 dark:text-orange-400">
                              Type: {wellbeingData.intervention_type || 'To be determined'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  )
})

export default WellbeingTab
