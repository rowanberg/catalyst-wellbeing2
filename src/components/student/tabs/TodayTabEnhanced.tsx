'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, Clock, Target, Star, ChevronRight, TrendingUp, 
  BookOpen, BarChart3, Trophy, Sparkles, CheckCircle2, Circle,
  AlertCircle, ArrowRight, Bell, Zap, Award, Sun, Moon, Cloud
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface TodayTabProps {
  data: any
  loading: boolean
  error: string | null
  onRefresh: () => void
  profile: any
}

export function TodayTabEnhanced({ data, loading, error, onRefresh, profile }: TodayTabProps) {
  const router = useRouter()
  const [greeting, setGreeting] = useState('')
  const [timeContext, setTimeContext] = useState('')
  const [questsExpanded, setQuestsExpanded] = useState(true)

  // Dynamic greeting based on time
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      const name = profile?.first_name || 'Student'
      
      if (hour < 12) {
        setGreeting(`Good morning, ${name}! ☀️`)
        setTimeContext('Start your day with energy')
      } else if (hour < 17) {
        setGreeting(`Good afternoon, ${name}! 🌤`)
        setTimeContext('Keep the momentum going')
      } else {
        setGreeting(`Good evening, ${name}! 🌙`)
        setTimeContext('Let\'s finish the day strong')
      }
    }
    
    updateGreeting()
    const interval = setInterval(updateGreeting, 60000)
    return () => clearInterval(interval)
  }, [profile])

  if (loading && !data) {
    return <TodayTabSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50/50">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
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

  const todayData = data || {
    quests: { completed: 0, total: 6, items: [] },
    upcomingExams: [],
    weeklyProgress: { xp: 0, rank: 0, streak: 0 },
    schoolUpdates: { polls: [], announcements: [] }
  }

  const questProgress = todayData.quests.total > 0 
    ? (todayData.quests.completed / todayData.quests.total) * 100 
    : 0

  return (
    <div className="space-y-6 pb-8">
      {/* Dynamic Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-6 text-white shadow-xl"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{greeting}</h1>
        <p className="text-blue-100 text-sm sm:text-base mb-4">{timeContext}</p>
        
        {/* Contextual prompt */}
        {todayData.upcomingExams?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/30 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {todayData.upcomingExams[0].subject} exam tomorrow
                </p>
                <p className="text-xs text-blue-100">Time to prepare!</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/30 hover:bg-white/40 text-white border-0"
              onClick={() => router.push(`/student/exam-prep/${todayData.upcomingExams[0].id}`)}
            >
              Prepare
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Quick Stats - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {todayData.weeklyProgress?.xp || 0}
                </span>
              </div>
              <p className="text-xs text-slate-600">Weekly XP</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 text-emerald-600" />
                <span className="text-2xl font-bold text-emerald-600">
                  #{todayData.weeklyProgress?.rank || 0}
                </span>
              </div>
              <p className="text-xs text-slate-600">Class Rank</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">
                  {todayData.weeklyProgress?.streak || 0}
                </span>
              </div>
              <p className="text-xs text-slate-600">Day Streak</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">
                  {todayData.quests.completed}/{todayData.quests.total}
                </span>
              </div>
              <p className="text-xs text-slate-600">Quests Done</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Daily Quests - Enhanced Mobile Experience */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader 
            className="bg-gradient-to-r from-slate-50 to-slate-100 cursor-pointer"
            onClick={() => setQuestsExpanded(!questsExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Daily Adventures</CardTitle>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Complete to earn XP and gems
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: questsExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </motion.div>
            </div>
          </CardHeader>
          
          <AnimatePresence>
            {questsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="pt-6">
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span className="font-medium">Daily Progress</span>
                      <span className="font-bold text-slate-800">
                        {Math.round(questProgress)}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={questProgress} className="h-3" />
                      {questProgress === 100 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -right-1 -top-1"
                        >
                          <Sparkles className="w-6 h-6 text-yellow-500" />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Quest Items - Mobile Optimized Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {todayData.quests.items?.map((quest: any, index: number) => (
                      <motion.button
                        key={quest.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push(`/student/${quest.type}`)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-left",
                          quest.completed 
                            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300"
                            : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md active:scale-[0.98]"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <motion.div
                              animate={quest.completed ? { scale: [1, 1.2, 1] } : {}}
                              transition={{ duration: 0.3 }}
                              className={cn(
                                "p-2 rounded-full mt-0.5",
                                quest.completed 
                                  ? "bg-green-100" 
                                  : "bg-slate-100"
                              )}
                            >
                              {quest.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-400" />
                              )}
                            </motion.div>
                            <div className="flex-1">
                              <p className={cn(
                                "font-semibold text-sm",
                                quest.completed ? "text-green-800" : "text-slate-800"
                              )}>
                                {quest.title}
                              </p>
                              <p className={cn(
                                "text-xs mt-1",
                                quest.completed ? "text-green-600" : "text-slate-500"
                              )}>
                                {quest.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                quest.completed 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              {quest.xp} XP
                            </Badge>
                            {quest.completed && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs text-green-600 mt-1"
                              >
                                ✓ Done
                              </motion.span>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Completion Celebration */}
                  {questProgress === 100 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-4 bg-gradient-to-r from-yellow-100 via-green-100 to-blue-100 rounded-xl text-center"
                    >
                      <p className="text-lg font-bold text-green-800 mb-1">
                        🎉 All Quests Complete!
                      </p>
                      <p className="text-sm text-green-700">
                        Amazing work today, champion!
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Responsive Grid for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/student/calendar')}
                  className="text-orange-600 hover:text-orange-700"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {todayData.upcomingExams?.length > 0 ? (
                <div className="space-y-3">
                  {todayData.upcomingExams.slice(0, 3).map((exam: any) => (
                    <motion.div
                      key={exam.id}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100 cursor-pointer"
                      onClick={() => router.push(`/student/exam-prep/${exam.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Clock className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-800">
                            {exam.subject}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(exam.date).toLocaleDateString()} • {exam.type}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-orange-400" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming exams</p>
                  <p className="text-xs mt-1">Enjoy your free time!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* School Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">School Updates</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/student/announcements')}
                  className="text-purple-600 hover:text-purple-700"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {todayData.schoolUpdates?.polls?.slice(0, 1).map((poll: any) => (
                  <motion.div
                    key={poll.id}
                    whileHover={{ x: 4 }}
                    className="p-3 bg-purple-50 rounded-lg border border-purple-100 cursor-pointer"
                    onClick={() => router.push('/student/announcements')}
                  >
                    <Badge className="bg-purple-100 text-purple-700 mb-2">POLL</Badge>
                    <p className="font-medium text-sm text-slate-800">{poll.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {poll.questions?.length || 0} questions • Tap to respond
                    </p>
                  </motion.div>
                ))}
                
                {todayData.schoolUpdates?.announcements?.slice(0, 2).map((announcement: any) => (
                  <motion.div
                    key={announcement.id}
                    whileHover={{ x: 4 }}
                    className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                  >
                    <Badge className="bg-blue-100 text-blue-700 mb-2">NEWS</Badge>
                    <p className="font-medium text-sm text-slate-800 line-clamp-2">
                      {announcement.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}

                {(!todayData.schoolUpdates?.polls?.length && !todayData.schoolUpdates?.announcements?.length) && (
                  <div className="text-center py-8 text-slate-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No new updates</p>
                    <p className="text-xs mt-1">Check back later!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// Enhanced Skeleton loader
function TodayTabSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-white/20 rounded w-48 mb-2" />
        <div className="h-4 bg-white/20 rounded w-32" />
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="h-8 bg-slate-200 rounded w-16 mb-2 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
          </Card>
        ))}
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
