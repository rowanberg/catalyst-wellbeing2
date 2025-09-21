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
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Study Plans</h1>
                <p className="text-sm text-gray-600">Manage your personalized learning journey</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/student/study-plan')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Plan
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <FloatingCard delay={0.1}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Plans</p>
                  <p className="text-2xl font-bold text-gray-900">{studyPlans.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </FloatingCard>

          <FloatingCard delay={0.2}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Plans</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {studyPlans.filter(p => p.isActive && p.progress < 100).length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Play className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </FloatingCard>

          <FloatingCard delay={0.3}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {studyPlans.filter(p => p.progress >= 100).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </FloatingCard>

          <FloatingCard delay={0.4}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {studyPlans.length > 0 
                      ? Math.round(studyPlans.reduce((sum, p) => sum + p.progress, 0) / studyPlans.length)
                      : 0}%
                  </p>
                </div>
                <div className="p-3 bg-pink-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </FloatingCard>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/50 p-1 rounded-lg mb-6 w-fit">
          {[
            { id: 'active', label: 'Active Plans', count: studyPlans.filter(p => p.isActive && p.progress < 100).length },
            { id: 'completed', label: 'Completed', count: studyPlans.filter(p => p.progress >= 100).length },
            { id: 'all', label: 'All Plans', count: studyPlans.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Study Plans Grid */}
        {filteredPlans.length === 0 ? (
          <FloatingCard delay={0.5}>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {activeTab === 'active' ? 'No Active Plans' : 
                 activeTab === 'completed' ? 'No Completed Plans' : 'No Study Plans'}
              </h3>
              <p className="text-gray-600 mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan, index) => (
              <FloatingCard key={plan.id} delay={index * 0.1}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-800 mb-1">
                        {plan.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 line-clamp-2">{plan.goal}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.progress >= 100 && (
                        <Badge variant="default" className="bg-green-500">
                          <Award className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                      {plan.isActive && plan.progress < 100 && (
                        <Badge variant="default" className="bg-blue-500">
                          <Play className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      {!plan.isActive && plan.progress < 100 && (
                        <Badge variant="outline">
                          <Pause className="h-3 w-3 mr-1" />
                          Paused
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-semibold text-gray-800">{plan.progress}%</span>
                    </div>
                    <Progress value={plan.progress} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">{plan.subjects.length}</div>
                      <div className="text-xs text-gray-600">Subjects</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">{plan.totalWeeklyHours}h</div>
                      <div className="text-xs text-gray-600">Per Week</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-pink-600">{plan.sessions.length}</div>
                      <div className="text-xs text-gray-600">Sessions</div>
                    </div>
                  </div>

                  {/* Subjects Preview */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Subjects</div>
                    <div className="flex flex-wrap gap-1">
                      {plan.subjects.slice(0, 3).map((subject) => (
                        <Badge key={subject.id} variant="outline" className="text-xs">
                          {subject.name}
                        </Badge>
                      ))}
                      {plan.subjects.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{plan.subjects.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => router.push(`/student/study-plan/${plan.id}`)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      size="sm"
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      View Plan
                    </Button>
                    <Button
                      onClick={() => togglePlanStatus(plan.id)}
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      {plan.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={() => deletePlan(plan.id)}
                      variant="outline"
                      size="sm"
                      className="px-3 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
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
