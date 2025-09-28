'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Target, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Eye,
  Award,
  Users,
  BarChart3,
  Flag,
  Zap,
  Star,
  Activity
} from 'lucide-react'
import Link from 'next/link'

interface SchoolGoal {
  id: string
  title: string
  description: string
  category: 'academic' | 'wellbeing' | 'engagement' | 'safety' | 'community'
  priority: 'high' | 'medium' | 'low'
  status: 'active' | 'completed' | 'paused' | 'planning'
  progress: number
  targetDate: string
  startDate: string
  owner: string
  metrics: GoalMetric[]
  milestones: Milestone[]
}

interface GoalMetric {
  id: string
  name: string
  currentValue: number
  targetValue: number
  unit: string
}

interface Milestone {
  id: string
  title: string
  dueDate: string
  completed: boolean
  completedDate?: string
}

export default function SchoolGoalsPage() {
  const [goals, setGoals] = useState<SchoolGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SchoolGoal | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    const mockGoals: SchoolGoal[] = [
      {
        id: '1',
        title: 'Improve Student Well-being Scores',
        description: 'Increase overall student well-being scores by 15% through enhanced SEL programs and support systems',
        category: 'wellbeing',
        priority: 'high',
        status: 'active',
        progress: 68,
        targetDate: '2024-06-30',
        startDate: '2024-01-01',
        owner: 'Ms. Rodriguez',
        metrics: [
          { id: '1', name: 'Average Well-being Score', currentValue: 7.8, targetValue: 9.0, unit: '/10' },
          { id: '2', name: 'Help Requests Resolved', currentValue: 85, targetValue: 95, unit: '%' }
        ],
        milestones: [
          { id: '1', title: 'Launch new SEL programs', dueDate: '2024-02-15', completed: true, completedDate: '2024-02-10' },
          { id: '2', title: 'Train all teachers on well-being support', dueDate: '2024-03-30', completed: false },
          { id: '3', title: 'Implement peer support system', dueDate: '2024-05-15', completed: false }
        ]
      },
      {
        id: '2',
        title: 'Increase Parent Engagement',
        description: 'Boost parent participation in school activities and communication by 25%',
        category: 'community',
        priority: 'medium',
        status: 'active',
        progress: 45,
        targetDate: '2024-05-31',
        startDate: '2024-01-15',
        owner: 'Mr. Thompson',
        metrics: [
          { id: '1', name: 'Parent Event Attendance', currentValue: 65, targetValue: 85, unit: '%' },
          { id: '2', name: 'Active Parent Portal Users', currentValue: 120, targetValue: 180, unit: 'users' }
        ],
        milestones: [
          { id: '1', title: 'Launch parent communication app', dueDate: '2024-02-01', completed: true, completedDate: '2024-01-28' },
          { id: '2', title: 'Host monthly parent workshops', dueDate: '2024-03-01', completed: false },
          { id: '3', title: 'Create parent volunteer program', dueDate: '2024-04-15', completed: false }
        ]
      },
      {
        id: '3',
        title: 'Reduce Chronic Absenteeism',
        description: 'Decrease chronic absenteeism rate from 12% to 6% through targeted interventions',
        category: 'engagement',
        priority: 'high',
        status: 'active',
        progress: 72,
        targetDate: '2024-08-31',
        startDate: '2023-09-01',
        owner: 'Ms. Johnson',
        metrics: [
          { id: '1', name: 'Chronic Absenteeism Rate', currentValue: 8.5, targetValue: 6.0, unit: '%' },
          { id: '2', name: 'Average Daily Attendance', currentValue: 94, targetValue: 96, unit: '%' }
        ],
        milestones: [
          { id: '1', title: 'Implement early warning system', dueDate: '2023-10-15', completed: true, completedDate: '2023-10-10' },
          { id: '2', title: 'Launch family engagement program', dueDate: '2024-01-15', completed: true, completedDate: '2024-01-12' },
          { id: '3', title: 'Evaluate and adjust interventions', dueDate: '2024-06-30', completed: false }
        ]
      },
      {
        id: '4',
        title: 'Digital Citizenship Excellence',
        description: 'Achieve 100% student completion of digital citizenship curriculum with 90% proficiency',
        category: 'safety',
        priority: 'medium',
        status: 'planning',
        progress: 15,
        targetDate: '2024-12-15',
        startDate: '2024-03-01',
        owner: 'Mr. Davis',
        metrics: [
          { id: '1', name: 'Curriculum Completion Rate', currentValue: 15, targetValue: 100, unit: '%' },
          { id: '2', name: 'Proficiency Rate', currentValue: 0, targetValue: 90, unit: '%' }
        ],
        milestones: [
          { id: '1', title: 'Develop curriculum framework', dueDate: '2024-03-15', completed: false },
          { id: '2', title: 'Train teachers on digital citizenship', dueDate: '2024-04-30', completed: false },
          { id: '3', title: 'Launch student program', dueDate: '2024-09-01', completed: false }
        ]
      }
    ]
    
    setTimeout(() => {
      setGoals(mockGoals)
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'planning': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return <Award className="w-4 h-4" />
      case 'wellbeing': return <Target className="w-4 h-4" />
      case 'engagement': return <Users className="w-4 h-4" />
      case 'safety': return <Flag className="w-4 h-4" />
      case 'community': return <Activity className="w-4 h-4" />
      default: return <Target className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'bg-blue-100 text-blue-800'
      case 'wellbeing': return 'bg-green-100 text-green-800'
      case 'engagement': return 'bg-purple-100 text-purple-800'
      case 'safety': return 'bg-red-100 text-red-800'
      case 'community': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const activeGoals = goals.filter(g => g.status === 'active').length
  const completedGoals = goals.filter(g => g.status === 'completed').length
  const averageProgress = goals.length > 0 ? 
    goals.reduce((sum, g) => sum + g.progress, 0) / goals.length : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  School Goals
                </h1>
                <p className="text-gray-600 mt-1">Track and manage strategic school objectives</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Goal
              </Button>
              <Link href="/admin">
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white/80">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Active Goals</p>
                    <p className="text-3xl font-bold">{activeGoals}</p>
                  </div>
                  <Target className="w-8 h-8 text-amber-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold">{completedGoals}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Avg Progress</p>
                    <p className="text-3xl font-bold">{averageProgress.toFixed(0)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Goals</p>
                    <p className="text-3xl font-bold">{goals.length}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getCategoryColor(goal.category)}`}>
                        {getCategoryIcon(goal.category)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <CardDescription className="capitalize">
                          {goal.category} • {goal.owner}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant="outline" className={getStatusColor(goal.status)}>
                        {goal.status}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                        {goal.priority} priority
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm mb-4">{goal.description}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Start Date:</span>
                        <p className="font-medium">{new Date(goal.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Target Date:</span>
                        <p className="font-medium">{new Date(goal.targetDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Key Metrics:</p>
                      <div className="space-y-2">
                        {goal.metrics.slice(0, 2).map((metric) => (
                          <div key={metric.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700">{metric.name}</span>
                            <span className="font-medium">
                              {metric.currentValue}{metric.unit} / {metric.targetValue}{metric.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Milestones:</p>
                      <div className="space-y-1">
                        {goal.milestones.slice(0, 2).map((milestone) => (
                          <div key={milestone.id} className="flex items-center text-xs">
                            <CheckCircle className={`w-3 h-3 mr-2 ${
                              milestone.completed ? 'text-green-500' : 'text-gray-400'
                            }`} />
                            <span className={milestone.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                              {milestone.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedGoal(goal)}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Goal Details Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedGoal.title}</h2>
                  <p className="text-gray-600">{selectedGoal.description}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedGoal(null)}
                >
                  Close
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Metrics</h3>
                  <div className="space-y-3">
                    {selectedGoal.metrics.map((metric) => (
                      <div key={metric.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{metric.name}</span>
                          <span className="text-sm text-gray-600">
                            {metric.currentValue}{metric.unit} / {metric.targetValue}{metric.unit}
                          </span>
                        </div>
                        <Progress 
                          value={(metric.currentValue / metric.targetValue) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Milestones</h3>
                  <div className="space-y-2">
                    {selectedGoal.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className={`w-5 h-5 mt-0.5 ${
                          milestone.completed ? 'text-green-500' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <p className={`font-medium ${
                            milestone.completed ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {milestone.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                            {milestone.completed && milestone.completedDate && (
                              <span className="ml-2 text-green-600">
                                • Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
