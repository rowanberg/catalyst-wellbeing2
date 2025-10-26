'use client'

import React, { useState, useMemo, useCallback, memo, useEffect } from 'react'
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

export function TodayTab({ data, loading, error, onRefresh, profile }: TodayTabProps) {
  const router = useRouter()
  const [greeting, setGreeting] = useState('')
  const [timeContext, setTimeContext] = useState('')
  const [questsExpanded, setQuestsExpanded] = useState(true)

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Dynamic greeting based on time of day - memoized
  const { greeting: memoizedGreeting, timeContext: memoizedTimeContext } = useMemo(() => {
    const hour = new Date().getHours()
    const name = profile?.first_name || 'Student'
    return {
      greeting: hour < 12 ? `Good morning, ${name}! ☀️` : hour < 17 ? `Good afternoon, ${name}! 🌤` : `Good evening, ${name}! 🌙`,
      timeContext: hour < 12 ? 'Start your day with energy' : hour < 17 ? 'Keep the momentum going' : 'Let\'s finish the day strong'
    }
  }, [profile])

  // Prepare data (before conditional returns)
  const todayData = data || {
    quests: { completed: 0, total: 6, items: [] },
    upcomingExams: [],
    weeklyProgress: { xp: 0, rank: 0, streak: 0 },
    schoolUpdates: { polls: [], announcements: [] }
  }

  // Calculate quest progress - memoized
  const questProgress = useMemo(() => 
    todayData.quests.total > 0 
      ? (todayData.quests.completed / todayData.quests.total) * 100 
      : 0,
    [todayData.quests.completed, todayData.quests.total]
  )

  // Memoized handlers
  const handleQuestClick = useCallback((type: string) => {
    router.push(`/student/${type}`)
  }, [router])

  const handleExamPrepClick = useCallback((id: string) => {
    router.push(`/student/exam-prep/${id}`)
  }, [router])

  // Update greeting state
  useEffect(() => {
    setGreeting(memoizedGreeting)
    setTimeContext(memoizedTimeContext)
  }, [memoizedGreeting, memoizedTimeContext])

  // NOW SAFE TO HAVE CONDITIONAL RETURNS
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

  return (
    <div className="space-y-6 pb-8">
      {/* Dynamic Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#F08080] to-[#F4978E] rounded-3xl p-6 text-white shadow-2xl"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{greeting}</h1>
        <p className="text-white/90 text-sm sm:text-base mb-4">{timeContext}</p>
        
        {/* Contextual prompt */}
        {todayData.upcomingExams?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/25 backdrop-blur-sm rounded-2xl p-3 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/30 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {todayData.upcomingExams[0].subject} exam tomorrow
                </p>
                <p className="text-xs text-white/90">Time to prepare!</p>
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
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-[#F08080]" />
                <span className="text-2xl font-bold text-[#F08080]">
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
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 text-[#F4978E]" />
                <span className="text-2xl font-bold text-[#F4978E]">
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
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-[#F8AD9D]" />
                <span className="text-2xl font-bold text-[#F8AD9D]">
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
          <Card className="border-0 shadow-lg rounded-2xl bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-[#F4978E]" />
                <span className="text-2xl font-bold text-[#F4978E]">
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
        <Card className="border-0 shadow-lg rounded-2xl bg-white">
          <CardHeader 
            className="bg-gradient-to-r from-[#FFDAB9]/20 to-[#FBC4AB]/20 cursor-pointer"
            onClick={() => setQuestsExpanded(!questsExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-[#F08080] to-[#F4978E] rounded-xl shadow-sm">
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
                        whileTap={quest.completed ? {} : { scale: 0.98 }}
                        onClick={quest.completed ? undefined : () => handleQuestClick(quest.type)}
                        disabled={quest.completed}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all text-left shadow-sm",
                          quest.completed 
                            ? "bg-gradient-to-br from-[#FBC4AB]/30 to-[#F8AD9D]/30 border-[#F4978E] cursor-not-allowed opacity-75"
                            : "bg-white border-slate-200 hover:border-[#F8AD9D] hover:shadow-md active:scale-[0.98] cursor-pointer"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <motion.div
                              animate={quest.completed ? { scale: [1, 1.2, 1] } : {}}
                              transition={{ duration: 0.3 }}
                              className={cn(
                                "p-2 rounded-xl mt-0.5",
                                quest.completed 
                                  ? "bg-[#FFDAB9]" 
                                  : "bg-slate-100"
                              )}
                            >
                              {quest.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-[#F08080]" />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-400" />
                              )}
                            </motion.div>
                            <div className="flex-1">
                              <p className={cn(
                                "font-semibold text-sm",
                                quest.completed ? "text-[#F08080]" : "text-slate-800"
                              )}>
                                {quest.title}
                              </p>
                              <p className={cn(
                                "text-xs mt-1",
                                quest.completed ? "text-[#F4978E]" : "text-slate-500"
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
                                  ? "bg-[#FFDAB9] text-[#F08080]" 
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              {quest.xp} XP
                            </Badge>
                            {quest.completed && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs font-bold text-[#F08080] mt-1 bg-[#FFDAB9]/50 px-2 py-1 rounded-md"
                              >
                                COMPLETED
                              </motion.div>
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
                      className="mt-6 p-4 bg-gradient-to-r from-[#FFDAB9] via-[#FBC4AB] to-[#F8AD9D] rounded-2xl text-center shadow-sm"
                    >
                      <p className="text-lg font-bold text-[#F08080] mb-1">
                        🎉 All Quests Complete!
                      </p>
                      <p className="text-sm text-[#F4978E]">
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
          <Card className="border-0 shadow-lg h-full rounded-2xl bg-white">
            <CardHeader className="bg-gradient-to-r from-[#FFDAB9]/30 to-[#FBC4AB]/30 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-[#F08080] to-[#F8AD9D] rounded-xl shadow-sm">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/student/calendar')}
                  className="text-[#F08080] hover:text-[#F4978E]"
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
                      className="flex items-center justify-between p-3 bg-[#FFDAB9]/30 rounded-2xl border border-[#FBC4AB] cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                      onClick={() => handleExamPrepClick(exam.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[#FBC4AB]/50 rounded-xl">
                          <Clock className="h-4 w-4 text-[#F08080]" />
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
                      <ChevronRight className="w-5 h-5 text-[#F8AD9D]" />
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
            <CardHeader className="bg-gradient-to-r from-[#FBC4AB]/30 to-[#F8AD9D]/30 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-[#F4978E] to-[#F8AD9D] rounded-xl shadow-sm">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">School Updates</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/student/announcements')}
                  className="text-[#F4978E] hover:text-[#F08080]"
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
                    className="p-3 bg-[#FBC4AB]/30 rounded-2xl border border-[#F8AD9D] cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                    onClick={() => router.push('/student/announcements')}
                  >
                    <Badge className="bg-[#FFDAB9] text-[#F08080] mb-2">POLL</Badge>
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
                    className="p-3 bg-[#FFDAB9]/30 rounded-2xl border border-[#FBC4AB] shadow-sm"
                  >
                    <Badge className="bg-[#FBC4AB] text-[#F4978E] mb-2">NEWS</Badge>
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
      <div className="bg-gradient-to-r from-slate-200 to-slate-300 rounded-3xl p-6 animate-pulse shadow-lg">
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
