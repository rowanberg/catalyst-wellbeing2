'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Heart, 
  Users, 
  Brain,
  Target,
  BookOpen,
  Award,
  TrendingUp,
  Play,
  Pause,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  Star,
  Lightbulb,
  Activity
} from 'lucide-react'
import Link from 'next/link'

interface SELProgram {
  id: string
  title: string
  description: string
  category: 'self_awareness' | 'self_management' | 'social_awareness' | 'relationship_skills' | 'responsible_decision_making'
  targetGrades: string[]
  duration: string
  status: 'active' | 'inactive' | 'completed' | 'planned'
  enrolledStudents: number
  totalCapacity: number
  instructor: string
  completionRate: number
  objectives: string[]
}

export default function SELProgramsPage() {
  const [programs, setPrograms] = useState<SELProgram[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data for demonstration
  useEffect(() => {
    const mockPrograms: SELProgram[] = [
      {
        id: '1',
        title: 'Mindful Moments',
        description: 'Daily mindfulness and emotional regulation practices for elementary students',
        category: 'self_management',
        targetGrades: ['4', '5', '6'],
        duration: '8 weeks',
        status: 'active',
        enrolledStudents: 45,
        totalCapacity: 50,
        instructor: 'Ms. Rodriguez',
        completionRate: 78,
        objectives: [
          'Develop emotional awareness',
          'Learn breathing techniques',
          'Practice mindful listening',
          'Build stress management skills'
        ]
      },
      {
        id: '2',
        title: 'Friendship Skills Workshop',
        description: 'Building healthy relationships and communication skills',
        category: 'relationship_skills',
        targetGrades: ['5', '6', '7'],
        duration: '6 weeks',
        status: 'active',
        enrolledStudents: 32,
        totalCapacity: 35,
        instructor: 'Mr. Thompson',
        completionRate: 85,
        objectives: [
          'Improve communication skills',
          'Learn conflict resolution',
          'Practice empathy',
          'Build teamwork abilities'
        ]
      },
      {
        id: '3',
        title: 'Decision Making Champions',
        description: 'Teaching responsible decision-making and problem-solving skills',
        category: 'responsible_decision_making',
        targetGrades: ['6', '7'],
        duration: '10 weeks',
        status: 'planned',
        enrolledStudents: 0,
        totalCapacity: 40,
        instructor: 'Ms. Johnson',
        completionRate: 0,
        objectives: [
          'Analyze consequences',
          'Consider ethical implications',
          'Practice problem-solving',
          'Develop critical thinking'
        ]
      }
    ]
    
    setTimeout(() => {
      setPrograms(mockPrograms)
      setLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'planned': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'self_awareness': return <Brain className="w-4 h-4" />
      case 'self_management': return <Target className="w-4 h-4" />
      case 'social_awareness': return <Users className="w-4 h-4" />
      case 'relationship_skills': return <Heart className="w-4 h-4" />
      case 'responsible_decision_making': return <Lightbulb className="w-4 h-4" />
      default: return <BookOpen className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'self_awareness': return 'bg-purple-100 text-purple-800'
      case 'self_management': return 'bg-blue-100 text-blue-800'
      case 'social_awareness': return 'bg-green-100 text-green-800'
      case 'relationship_skills': return 'bg-pink-100 text-pink-800'
      case 'responsible_decision_making': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const activePrograms = programs.filter(p => p.status === 'active').length
  const totalEnrolled = programs.reduce((sum, p) => sum + p.enrolledStudents, 0)
  const averageCompletion = programs.length > 0 ? 
    programs.reduce((sum, p) => sum + p.completionRate, 0) / programs.length : 0

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
              <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  SEL Programs
                </h1>
                <p className="text-gray-600 mt-1">Social-Emotional Learning programs and activities</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-3">
              <Button className="bg-pink-600 hover:bg-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Program
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
            <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-100 text-sm font-medium">Active Programs</p>
                    <p className="text-3xl font-bold">{activePrograms}</p>
                  </div>
                  <Heart className="w-8 h-8 text-pink-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Enrolled</p>
                    <p className="text-3xl font-bold">{totalEnrolled}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Avg Completion</p>
                    <p className="text-3xl font-bold">{averageCompletion.toFixed(0)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Programs</p>
                    <p className="text-3xl font-bold">{programs.length}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {programs.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getCategoryColor(program.category)}`}>
                        {getCategoryIcon(program.category)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{program.title}</CardTitle>
                        <CardDescription className="capitalize">
                          {program.category.replace('_', ' ')}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(program.status)}>
                      {program.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm mb-4">{program.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Enrollment:</span>
                      <span className="font-medium">{program.enrolledStudents}/{program.totalCapacity}</span>
                    </div>
                    
                    <Progress 
                      value={(program.enrolledStudents / program.totalCapacity) * 100} 
                      className="h-2"
                    />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <p className="font-medium">{program.duration}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Instructor:</span>
                        <p className="font-medium">{program.instructor}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Target Grades:</span>
                      <div className="flex space-x-1">
                        {program.targetGrades.map(grade => (
                          <Badge key={grade} variant="outline" className="text-xs">
                            Grade {grade}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {program.status !== 'planned' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Completion Rate:</span>
                        <span className="font-medium">{program.completionRate}%</span>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-600 mb-2">Learning Objectives:</p>
                      <ul className="text-xs text-gray-700 space-y-1">
                        {program.objectives.slice(0, 2).map((objective, i) => (
                          <li key={i} className="flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    {program.status === 'active' && (
                      <Button size="sm" variant="outline">
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    {program.status === 'planned' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
