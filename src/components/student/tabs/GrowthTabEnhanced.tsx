'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, Award, BookOpen, BarChart3, ChevronRight,
  GraduationCap, Target, Trophy, Star, Clock, Filter,
  Calendar, Download, ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface GrowthTabProps {
  data: any
  loading: boolean
  error: string | null
  onRefresh: () => void
  profile: any
}

export function GrowthTabEnhanced({ data, loading, error, onRefresh, profile }: GrowthTabProps) {
  const router = useRouter()
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester'>('month')

  const growthData = data || {
    stats: { overallGPA: 0, avgScore: 0, testsCount: 0, attendance: 0 },
    recentTests: [],
    subjectPerformance: [],
    achievements: { xp: 0, gems: 0, level: 1, quests: 0 },
    analytics: { gradeDistribution: [], studyStreak: 0, focusAreas: [] }
  }

  // Memoized calculations
  const topPerformingSubject = useMemo(() => {
    if (!growthData.subjectPerformance?.length) return null
    return growthData.subjectPerformance.reduce((prev: any, current: any) => 
      (prev.average > current.average) ? prev : current
    )
  }, [growthData.subjectPerformance])

  if (loading && !data) {
    return <GrowthTabSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50/50">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4 font-medium">{error}</p>
            <Button 
              onClick={onRefresh}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Performance Overview - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Academic Growth</h1>
          <div className="flex gap-2">
            {['week', 'month', 'semester'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all",
                  timeRange === range 
                    ? "bg-white/30 text-white" 
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                )}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/20 backdrop-blur-sm rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <GraduationCap className="w-5 h-5 text-white/80" />
              <motion.span 
                key={growthData.stats.overallGPA}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold"
              >
                {growthData.stats.overallGPA?.toFixed(1) || '0.0'}
              </motion.span>
            </div>
            <p className="text-xs text-white/80">Overall GPA</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white/20 backdrop-blur-sm rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <Target className="w-5 h-5 text-white/80" />
              <motion.span 
                key={growthData.stats.avgScore}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold"
              >
                {growthData.stats.avgScore || 0}%
              </motion.span>
            </div>
            <p className="text-xs text-white/80">Avg Score</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/20 backdrop-blur-sm rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <BookOpen className="w-5 h-5 text-white/80" />
              <motion.span 
                key={growthData.stats.testsCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold"
              >
                {growthData.stats.testsCount || 0}
              </motion.span>
            </div>
            <p className="text-xs text-white/80">Tests Taken</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white/20 backdrop-blur-sm rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <Calendar className="w-5 h-5 text-white/80" />
              <motion.span 
                key={growthData.stats.attendance}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold"
              >
                {growthData.stats.attendance || 0}%
              </motion.span>
            </div>
            <p className="text-xs text-white/80">Attendance</p>
          </motion.div>
        </div>

        {/* Top Performing Subject Highlight */}
        {topPerformingSubject && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-medium">Top Subject:</span>
                <span className="font-bold">{topPerformingSubject.name}</span>
              </div>
              <span className="text-xl font-bold text-yellow-300">
                {topPerformingSubject.average}%
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Subject Performance - Interactive Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Subject Performance</CardTitle>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Tap to view details
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/student/analytics')}
                className="text-indigo-600 hover:text-indigo-700"
              >
                Full Analytics
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {growthData.subjectPerformance?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {growthData.subjectPerformance.map((subject: any, index: number) => (
                  <motion.div
                    key={subject.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSubject(
                      selectedSubject === subject.name ? null : subject.name
                    )}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all",
                      selectedSubject === subject.name
                        ? "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-lg"
                        : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800">
                        {subject.name}
                      </h4>
                      <div className={cn(
                        "p-1 rounded-full",
                        subject.trend === 'up' ? "bg-green-100" :
                        subject.trend === 'down' ? "bg-red-100" :
                        "bg-gray-100"
                      )}>
                        {subject.trend === 'up' ? (
                          <ArrowUp className="w-4 h-4 text-green-600" />
                        ) : subject.trend === 'down' ? (
                          <ArrowDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                    </div>
                    
                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      {subject.average}%
                    </div>
                    
                    <div className="relative">
                      <Progress value={subject.average} className="h-2" />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.average}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="absolute top-0 left-0 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
                      />
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {selectedSubject === subject.name && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-3 pt-3 border-t border-slate-200"
                        >
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Last Test:</span>
                            <span className="font-medium text-slate-800">92%</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-slate-600">Improvement:</span>
                            <span className={cn(
                              "font-medium",
                              subject.trend === 'up' ? "text-green-600" : "text-red-600"
                            )}>
                              {subject.trend === 'up' ? '+' : ''}{subject.improvement || 0}%
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No subject data available</p>
                <p className="text-xs mt-1">Complete some tests to see your performance</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Tests & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Test Results */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Recent Tests</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/student/grades')}
                  className="text-green-600 hover:text-green-700"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {growthData.recentTests?.length > 0 ? (
                <div className="space-y-3">
                  {growthData.recentTests.slice(0, 5).map((test: any, index: number) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg hover:shadow-md transition-all cursor-pointer"
                      onClick={() => router.push(`/student/test/${test.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold shadow-sm",
                          test.score >= 90 ? "bg-gradient-to-br from-green-500 to-emerald-500" :
                          test.score >= 80 ? "bg-gradient-to-br from-blue-500 to-indigo-500" :
                          test.score >= 70 ? "bg-gradient-to-br from-yellow-500 to-orange-500" : 
                          "bg-gradient-to-br from-red-500 to-pink-500"
                        )}>
                          {test.grade}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-800">
                            {test.subject}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(test.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {test.score}/{test.maxScore}
                        </div>
                        <div className="text-xs text-slate-500">
                          {((test.score / test.maxScore) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No recent tests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Analytics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Analytics</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/student/study-plan/dashboard')}
                    className="bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-700"
                  >
                    Study Plan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Grade Distribution */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                  <Award className="h-4 w-4 mr-2 text-purple-600" />
                  Grade Distribution
                </h4>
                <div className="space-y-2">
                  {growthData.analytics?.gradeDistribution?.map((grade: any) => (
                    <div key={grade.grade} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn("w-3 h-3 rounded-full", grade.color)} />
                        <span className="text-sm font-medium text-slate-700">
                          Grade {grade.grade}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(grade.count / 10) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className={cn("h-2 rounded-full", grade.color)}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-800 w-8 text-right">
                          {grade.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Consistency */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-purple-600" />
                  Study Consistency
                </h4>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-4xl font-bold text-purple-600 mb-2"
                  >
                    {growthData.analytics?.studyStreak || 0}
                  </motion.div>
                  <p className="text-sm text-slate-600">Day Streak</p>
                  <div className="grid grid-cols-7 gap-1 mt-4 max-w-[140px] mx-auto">
                    {Array.from({ length: 14 }, (_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={cn(
                          "w-4 h-4 rounded-sm",
                          i < (growthData.analytics?.studyStreak || 0)
                            ? "bg-purple-400"
                            : "bg-slate-200"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achievement Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/student/achievements')}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 cursor-pointer hover:shadow-lg transition-all">
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-600">
                {growthData.achievements?.xp || 0}
              </div>
              <p className="text-xs text-amber-700">Total XP</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/student/wallet')}
        >
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 cursor-pointer hover:shadow-lg transition-all">
            <CardContent className="p-4 text-center">
              <span className="text-2xl mb-2 block">💎</span>
              <div className="text-2xl font-bold text-pink-600">
                {growthData.achievements?.gems || 0}
              </div>
              <p className="text-xs text-pink-700">Mind Gems</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-600">
                Level {growthData.achievements?.level || 1}
              </div>
              <p className="text-xs text-emerald-700">Current</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {growthData.achievements?.quests || 0}
              </div>
              <p className="text-xs text-blue-700">Quests</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Enhanced Skeleton loader
function GrowthTabSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-white/20 rounded w-48 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/20 rounded-lg p-3">
              <div className="h-6 bg-white/30 rounded w-12 mb-1" />
              <div className="h-4 bg-white/30 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Content skeleton */}
      <Card className="p-6">
        <div className="space-y-3">
          <div className="h-5 bg-slate-200 rounded w-32 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
        </div>
      </Card>
    </div>
  )
}
