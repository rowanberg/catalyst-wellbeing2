'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock, 
  Target, 
  BookOpen, 
  TrendingUp,
  Star,
  CheckCircle,
  Play,
  Pause,
  MoreVertical,
  Edit,
  Trash2,
  Award,
  Brain,
  Zap
} from 'lucide-react'

interface StudyPlan {
  id: string
  name: string
  goal: string
  subjects: Array<{
    id: string
    name: string
    currentGrade: number
    targetGrade: number
    weeklyHours: number
    priority: 'low' | 'medium' | 'high'
  }>
  totalWeeklyHours: number
  studyDays: string[]
  sessions: Array<{
    id: string
    subject: string
    topic: string
    duration: number
    completed?: boolean
  }>
  createdAt: string
  targetDate: string
  progress: number
  isActive: boolean
}

const FloatingCard = ({ children, className = "", delay = 0 }: { 
  children: React.ReactNode
  className?: string
  delay?: number 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className={className}
  >
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm">
      {children}
    </Card>
  </motion.div>
)

export default function StudyPlanDashboard() {
  const router = useRouter()
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active')

  useEffect(() => {
    // Load study plans from localStorage
    const savedPlans = JSON.parse(localStorage.getItem('studyPlans') || '[]')
    const plansWithProgress = savedPlans.map((plan: any) => ({
      ...plan,
      progress: Math.floor(Math.random() * 100), // Simulate progress
      isActive: Math.random() > 0.3 // Simulate active status
    }))
    setStudyPlans(plansWithProgress)
  }, [])

  const filteredPlans = studyPlans.filter(plan => {
    if (activeTab === 'active') return plan.isActive && plan.progress < 100
    if (activeTab === 'completed') return plan.progress >= 100
    return true
  })

  const deletePlan = (planId: string) => {
    const updatedPlans = studyPlans.filter(plan => plan.id !== planId)
    setStudyPlans(updatedPlans)
    localStorage.setItem('studyPlans', JSON.stringify(updatedPlans))
  }

  const togglePlanStatus = (planId: string) => {
    const updatedPlans = studyPlans.map(plan => 
      plan.id === planId ? { ...plan, isActive: !plan.isActive } : plan
    )
    setStudyPlans(updatedPlans)
    localStorage.setItem('studyPlans', JSON.stringify(updatedPlans))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Compact Mobile Header */}
      <div className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">Study Plans</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage your learning journey</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/student/study-plan')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shrink-0 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
              size="sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create New Plan</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-4 sm:py-6">
        {/* Stats Overview - 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <FloatingCard delay={0.1}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Plans</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{studyPlans.length}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                  <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </FloatingCard>

          <FloatingCard delay={0.2}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Active Plans</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {studyPlans.filter(p => p.isActive && p.progress < 100).length}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                  <Play className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </FloatingCard>

          <FloatingCard delay={0.3}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {studyPlans.filter(p => p.progress >= 100).length}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                  <Award className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </FloatingCard>

          <FloatingCard delay={0.4}>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Avg Progress</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {studyPlans.length > 0 
                      ? Math.round(studyPlans.reduce((sum, p) => sum + p.progress, 0) / studyPlans.length)
                      : 0}%
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-pink-100 rounded-full">
                  <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </FloatingCard>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="overflow-x-auto pb-2 mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex space-x-1 bg-white/50 p-1 rounded-lg w-fit min-w-full sm:min-w-0">
            {[
              { id: 'active', label: 'Active Plans', shortLabel: 'Active', count: studyPlans.filter(p => p.isActive && p.progress < 100).length },
              { id: 'completed', label: 'Completed', shortLabel: 'Done', count: studyPlans.filter(p => p.progress >= 100).length },
              { id: 'all', label: 'All Plans', shortLabel: 'All', count: studyPlans.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 active:bg-white/50'
                }`}
              >
                <span className="hidden sm:inline">{tab.label} ({tab.count})</span>
                <span className="sm:hidden">{tab.shortLabel} ({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Study Plans Grid */}
        {filteredPlans.length === 0 ? (
          <FloatingCard delay={0.5}>
            <CardContent className="p-6 sm:p-12 text-center">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📚</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                {activeTab === 'active' ? 'No Active Plans' : 
                 activeTab === 'completed' ? 'No Completed Plans' : 'No Study Plans'}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {activeTab === 'active' 
                  ? 'Create your first study plan to start your learning journey!'
                  : activeTab === 'completed'
                  ? 'Complete some study plans to see them here.'
                  : 'Get started by creating your first personalized study plan.'}
              </p>
              <Button
                onClick={() => router.push('/student/study-plan')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Study Plan
              </Button>
            </CardContent>
          </FloatingCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredPlans.map((plan, index) => (
              <FloatingCard key={plan.id} delay={index * 0.1}>
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-bold text-gray-800 mb-1 truncate">
                        {plan.name}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{plan.goal}</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      {plan.progress >= 100 && (
                        <Badge variant="default" className="bg-green-500 text-xs px-1.5 py-0.5">
                          <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Complete</span>
                        </Badge>
                      )}
                      {plan.isActive && plan.progress < 100 && (
                        <Badge variant="default" className="bg-blue-500 text-xs px-1.5 py-0.5">
                          <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Active</span>
                        </Badge>
                      )}
                      {!plan.isActive && plan.progress < 100 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          <Pause className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Paused</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm text-gray-600">Progress</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-800">{plan.progress}%</span>
                    </div>
                    <Progress value={plan.progress} className="h-1.5 sm:h-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div>
                      <div className="text-base sm:text-lg font-bold text-blue-600">{plan.subjects.length}</div>
                      <div className="text-[10px] sm:text-xs text-gray-600">Subjects</div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-bold text-purple-600">{plan.totalWeeklyHours}h</div>
                      <div className="text-[10px] sm:text-xs text-gray-600">Per Week</div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-bold text-pink-600">{plan.sessions.length}</div>
                      <div className="text-[10px] sm:text-xs text-gray-600">Sessions</div>
                    </div>
                  </div>

                  {/* Subjects Preview */}
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Subjects</div>
                    <div className="flex flex-wrap gap-1">
                      {plan.subjects.slice(0, 3).map((subject) => (
                        <Badge key={subject.id} variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                          {subject.name}
                        </Badge>
                      ))}
                      {plan.subjects.length > 3 && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                          +{plan.subjects.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions - Touch-optimized */}
                  <div className="flex gap-1.5 sm:gap-2 pt-2">
                    <Button
                      onClick={() => router.push(`/student/study-plan/${plan.id}`)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:scale-95 transition-transform"
                      size="sm"
                    >
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="text-xs sm:text-sm">View</span>
                    </Button>
                    <Button
                      onClick={() => togglePlanStatus(plan.id)}
                      variant="outline"
                      size="sm"
                      className="px-2 sm:px-3 active:scale-95 transition-transform"
                    >
                      {plan.isActive ? <Pause className="h-3 w-3 sm:h-4 sm:w-4" /> : <Play className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </Button>
                    <Button
                      onClick={() => deletePlan(plan.id)}
                      variant="outline"
                      size="sm"
                      className="px-2 sm:px-3 text-red-500 hover:text-red-700 active:scale-95 transition-transform"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </CardContent>
              </FloatingCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
