'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  Brain, 
  Target, 
  BookOpen, 
  CheckCircle2, 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  Zap,
  ArrowLeft,
  Settings,
  TrendingUp,
  Award,
  AlertCircle,
  Lightbulb,
  Timer,
  BarChart3,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react'

interface StudySession {
  id: string
  subject: string
  topic: string
  duration: number
  difficulty: 'easy' | 'medium' | 'hard'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduledTime: string
  completed: boolean
  aiSuggested: boolean
  type: 'review' | 'new-material' | 'practice' | 'exam-prep'
}

interface StudyGoal {
  id: string
  title: string
  subject: string
  targetDate: string
  progress: number
  sessions: number
  completedSessions: number
}

export function AIStudyPlanner({ onBack }: { onBack?: () => void }) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'planner' | 'goals' | 'analytics'>('dashboard')
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([])
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [activeTimer, setActiveTimer] = useState<string | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(0)

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeTimer) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeTimer])

  // Mock data for demonstration
  useEffect(() => {
    setStudySessions([
      {
        id: '1',
        subject: 'Mathematics',
        topic: 'Quadratic Equations',
        duration: 45,
        difficulty: 'medium',
        priority: 'high',
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        completed: false,
        aiSuggested: true,
        type: 'new-material'
      },
      {
        id: '2',
        subject: 'Science',
        topic: 'Photosynthesis Review',
        duration: 30,
        difficulty: 'easy',
        priority: 'medium',
        scheduledTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        completed: true,
        aiSuggested: true,
        type: 'review'
      },
      {
        id: '3',
        subject: 'English',
        topic: 'Essay Writing Practice',
        duration: 60,
        difficulty: 'hard',
        priority: 'urgent',
        scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        completed: false,
        aiSuggested: false,
        type: 'practice'
      }
    ])

    setStudyGoals([
      {
        id: '1',
        title: 'Master Algebra Fundamentals',
        subject: 'Mathematics',
        targetDate: '2025-10-15',
        progress: 65,
        sessions: 12,
        completedSessions: 8
      },
      {
        id: '2',
        title: 'Science Fair Project',
        subject: 'Science',
        targetDate: '2025-11-01',
        progress: 30,
        sessions: 15,
        completedSessions: 4
      }
    ])
  }, [])

  // Optimized functions with useCallback
  const toggleTimer = useCallback((sessionId: string) => {
    if (activeTimer === sessionId) {
      setActiveTimer(null)
      setTimerSeconds(0)
    } else {
      setActiveTimer(sessionId)
      setTimerSeconds(0)
    }
  }, [activeTimer])

  const completeSession = useCallback((sessionId: string) => {
    setStudySessions(prev => prev.map(session => 
      session.id === sessionId ? { ...session, completed: true } : session
    ))
    if (activeTimer === sessionId) {
      setActiveTimer(null)
      setTimerSeconds(0)
    }
  }, [activeTimer])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Memoized computed values
  const todaySessions = useMemo(() => 
    studySessions.filter(session => {
      const sessionDate = new Date(session.scheduledTime).toDateString()
      const today = new Date().toDateString()
      return sessionDate === today
    }), [studySessions]
  )

  const completionRate = useMemo(() => {
    const completed = studySessions.filter(s => s.completed).length
    return studySessions.length > 0 ? Math.round((completed / studySessions.length) * 100) : 0
  }, [studySessions])

  const generateAIPlan = async () => {
    setIsGeneratingPlan(true)
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Add AI-generated sessions
    const newSessions: StudySession[] = [
      {
        id: Date.now().toString(),
        subject: 'History',
        topic: 'World War II Timeline',
        duration: 40,
        difficulty: 'medium',
        priority: 'medium',
        scheduledTime: '2025-09-28T10:00:00',
        completed: false,
        aiSuggested: true,
        type: 'new-material'
      },
      {
        id: (Date.now() + 1).toString(),
        subject: 'Mathematics',
        topic: 'Practice Problems Set 3',
        duration: 35,
        difficulty: 'hard',
        priority: 'high',
        scheduledTime: '2025-09-28T15:00:00',
        completed: false,
        aiSuggested: true,
        type: 'practice'
      }
    ]
    
    setStudySessions(prev => [...prev, ...newSessions])
    setIsGeneratingPlan(false)
  }

  const toggleSessionComplete = (sessionId: string) => {
    setStudySessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, completed: !session.completed }
          : session
      )
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-300 border-red-400/30'
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-400/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'low': return 'bg-green-500/20 text-green-300 border-green-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <Star className="h-3 w-3 text-green-400" />
      case 'medium': return <Target className="h-3 w-3 text-yellow-400" />
      case 'hard': return <Zap className="h-3 w-3 text-red-400" />
      default: return <Star className="h-3 w-3" />
    }
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-400/20 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <p className="text-white/90 font-bold text-lg">{studySessions.filter(s => !s.completed).length}</p>
              <p className="text-white/60 text-xs">Pending Sessions</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-300" />
            </div>
            <div>
              <p className="text-white/90 font-bold text-lg">{studySessions.filter(s => s.completed).length}</p>
              <p className="text-white/60 text-xs">Completed Today</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Brain className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <p className="text-white/90 font-bold text-lg">{studySessions.filter(s => s.aiSuggested).length}</p>
              <p className="text-white/60 text-xs">AI Suggestions</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Today's Schedule */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white/90 text-lg font-bold flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span>Today's Study Schedule</span>
            </CardTitle>
            <Button
              onClick={generateAIPlan}
              disabled={isGeneratingPlan}
              className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 text-blue-300 text-xs px-3 py-1 rounded-lg"
            >
              {isGeneratingPlan ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-300 mr-1"></div>
              ) : (
                <Brain className="h-3 w-3 mr-1" />
              )}
              {isGeneratingPlan ? 'Generating...' : 'AI Optimize'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {studySessions
            .filter(session => session.scheduledTime.startsWith(selectedDate))
            .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
            .map((session) => (
              <motion.div
                key={session.id}
                className={`p-4 rounded-xl border backdrop-blur-sm transition-all cursor-pointer ${
                  session.completed 
                    ? 'bg-green-500/10 border-green-400/20' 
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.01, x: 4 }}
                onClick={() => toggleSessionComplete(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${session.completed ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                      {session.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-300" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-blue-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className={`font-medium text-sm ${session.completed ? 'text-white/70 line-through' : 'text-white/90'}`}>
                          {session.topic}
                        </p>
                        {session.aiSuggested && (
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs px-2 py-0">
                            <Brain className="h-2 w-2 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-white/60 text-xs">{session.subject}</p>
                        <div className="flex items-center space-x-1">
                          <Timer className="h-3 w-3 text-white/40" />
                          <span className="text-white/60 text-xs">{session.duration}min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getDifficultyIcon(session.difficulty)}
                          <span className="text-white/60 text-xs capitalize">{session.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs px-2 py-1 ${getPriorityColor(session.priority)}`}>
                      {session.priority}
                    </Badge>
                    <p className="text-white/60 text-xs">
                      {new Date(session.scheduledTime).toLocaleTimeString([], { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
        </CardContent>
      </Card>

      {/* Study Goals Progress */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white/90 text-lg font-bold flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-400" />
            <span>Study Goals Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {studyGoals.map((goal) => (
            <motion.div
              key={goal.id}
              className="p-4 rounded-xl bg-white/5 border border-white/20 backdrop-blur-sm"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white/90 font-medium text-sm">{goal.title}</p>
                  <p className="text-white/60 text-xs">{goal.subject}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/90 font-bold text-sm">{goal.progress}%</p>
                  <p className="text-white/60 text-xs">{goal.completedSessions}/{goal.sessions} sessions</p>
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progress}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-white/60 text-xs">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                  {Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                </Badge>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="h-full bg-gradient-to-br from-slate-900/50 via-purple-900/50 to-slate-900/50 relative overflow-hidden rounded-2xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-fuchsia-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(147,51,234,0.1)_1px,transparent_0)] bg-[length:32px_32px]" />
      
      <div className="relative z-10 p-3 sm:p-4 h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-4">
          
          {/* Compact Header */}
          <motion.div 
            className="flex items-center justify-between mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl border border-blue-400/30">
                <Brain className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">AI Study Planner</h1>
                <p className="text-white/60 text-xs sm:text-sm">Smart learning schedules</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                {completionRate}% Complete
              </Badge>
              <Button
                onClick={() => generateAIPlan()}
                disabled={isGeneratingPlan}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs px-3 py-1.5 h-auto"
              >
                {isGeneratingPlan ? (
                  <>
                    <RotateCcw className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Plan
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-white text-xs font-medium">Today</p>
                    <p className="text-white/60 text-xs">{todaySessions.length} sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="text-white text-xs font-medium">Goals</p>
                    <p className="text-white/60 text-xs">{studyGoals.length} active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  <div>
                    <p className="text-white text-xs font-medium">Completed</p>
                    <p className="text-white/60 text-xs">{studySessions.filter(s => s.completed).length} sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-orange-400" />
                  <div>
                    <p className="text-white text-xs font-medium">Active</p>
                    <p className="text-white/60 text-xs">{activeTimer ? formatTime(timerSeconds) : '00:00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>Today's Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {todaySessions.length === 0 ? (
                  <div className="text-center py-6">
                    <BookOpen className="h-8 w-8 text-white/30 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">No sessions scheduled for today</p>
                    <Button
                      onClick={() => generateAIPlan()}
                      className="mt-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 text-xs"
                      variant="outline"
                    >
                      Generate AI Schedule
                    </Button>
                  </div>
                ) : (
                  todaySessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge 
                              className={`text-xs ${
                                session.priority === 'urgent' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                                session.priority === 'high' ? 'bg-orange-500/20 text-orange-300 border-orange-400/30' :
                                session.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                                'bg-green-500/20 text-green-300 border-green-400/30'
                              }`}
                            >
                              {session.priority}
                            </Badge>
                            {session.aiSuggested && (
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                                <Sparkles className="h-2 w-2 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-white font-medium text-sm truncate">{session.topic}</h4>
                          <p className="text-white/60 text-xs">{session.subject} • {session.duration} min</p>
                          <p className="text-white/50 text-xs">
                            {new Date(session.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-3">
                          {session.completed ? (
                            <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Done
                            </Badge>
                          ) : (
                            <>
                              <Button
                                onClick={() => toggleTimer(session.id)}
                                variant="outline"
                                size="sm"
                                className="bg-white/5 border-white/20 text-white hover:bg-white/10 p-1.5 h-auto"
                              >
                                {activeTimer === session.id ? (
                                  <PauseCircle className="h-3 w-3" />
                                ) : (
                                  <PlayCircle className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                onClick={() => completeSession(session.id)}
                                variant="outline"
                                size="sm"
                                className="bg-green-500/10 border-green-400/30 text-green-300 hover:bg-green-500/20 p-1.5 h-auto"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {activeTimer === session.id && (
                        <motion.div
                          className="mt-2 p-2 bg-blue-500/10 rounded-lg border border-blue-400/20"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-blue-300 text-sm font-mono">{formatTime(timerSeconds)}</span>
                            <span className="text-blue-300/60 text-xs">Session in progress</span>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Study Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center space-x-2">
                  <Target className="h-4 w-4 text-green-400" />
                  <span>Study Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {studyGoals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    className="p-3 bg-white/5 rounded-xl border border-white/10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm truncate">{goal.title}</h4>
                        <p className="text-white/60 text-xs">{goal.subject}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-white font-bold text-sm">{goal.progress}%</p>
                        <p className="text-white/60 text-xs">{goal.completedSessions}/{goal.sessions}</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
                      <motion.div
                        className="bg-gradient-to-r from-green-400 to-emerald-400 h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progress}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-white/60 text-xs">
                        Due: {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs">
                        {Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
