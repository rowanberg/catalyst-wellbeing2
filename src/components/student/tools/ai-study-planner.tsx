'use client'

import { useState, useEffect } from 'react'
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
  BarChart3
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

export function AIStudyPlanner({ onBack }: { onBack: () => void }) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'planner' | 'goals' | 'analytics'>('dashboard')
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([])
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

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
        scheduledTime: '2025-09-27T09:00:00',
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
        scheduledTime: '2025-09-27T14:30:00',
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
        scheduledTime: '2025-09-27T16:00:00',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(147,51,234,0.15)_1px,transparent_0)] bg-[length:32px_32px]" />
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="ghost"
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-400/30">
                  <Calendar className="h-6 w-6 text-blue-300" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">AI Study Planner</h1>
                  <p className="text-white/60 text-sm">Personalized learning schedules powered by AI</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            className="flex space-x-2 bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'planner', label: 'Planner', icon: Calendar },
              { id: 'goals', label: 'Goals', icon: Target },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all ${
                    currentView === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              )
            })}
          </motion.div>

          {/* Content */}
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'dashboard' && renderDashboard()}
            {currentView === 'planner' && (
              <div className="text-center py-12">
                <p className="text-white/60">Advanced Planner View - Coming Soon</p>
              </div>
            )}
            {currentView === 'goals' && (
              <div className="text-center py-12">
                <p className="text-white/60">Goals Management - Coming Soon</p>
              </div>
            )}
            {currentView === 'analytics' && (
              <div className="text-center py-12">
                <p className="text-white/60">Study Analytics - Coming Soon</p>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
