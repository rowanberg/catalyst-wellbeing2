'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Award, 
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  Search,
  ChevronRight,
  Star,
  Trophy,
  Zap,
  Activity
} from 'lucide-react'
import Link from 'next/link'

interface StudentProgress {
  id: string
  name: string
  grade: string
  class: string
  totalXP: number
  level: number
  completedQuests: number
  streak: number
  subjects: {
    name: string
    progress: number
    grade: string
  }[]
}

export default function ProgressTrackingPage() {
  const [students, setStudents] = useState<any[]>([])
  const [availableGrades, setAvailableGrades] = useState<string[]>([])
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch real student data from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/students')
        if (!response.ok) {
          const errorData = await response.json()
          console.error('API Error:', response.status, errorData)
          throw new Error(`Failed to fetch students: ${errorData.error || response.statusText}`)
        }
        const data = await response.json()
        setStudents(data.students || [])
        setAvailableGrades(data.grades || [])
        setAvailableClasses(data.classes || [])
      } catch (error) {
        console.error('Error fetching students:', error)
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter
    const matchesClass = classFilter === 'all' || student.class === classFilter
    return matchesSearch && matchesGrade && matchesClass
  })

  const stats = {
    totalStudents: filteredStudents.length,
    averageXP: filteredStudents.length > 0 ? filteredStudents.reduce((sum, student) => sum + student.totalXP, 0) / filteredStudents.length : 0,
    topPerformers: filteredStudents.filter(student => student.level >= 10).length,
    activeStreaks: filteredStudents.filter(student => student.streak > 0).length
  }

  // Calculate grade distribution from actual student data
  const gradeDistribution = {
    A: 0, B: 0, C: 0, D: 0
  }
  
  // Calculate subject averages from actual student data
  const subjectAverages = {
    Mathematics: 0,
    Science: 0,
    English: 0,
    'Social Studies': 0
  }

  if (filteredStudents.length > 0) {
    // Calculate grade distribution
    filteredStudents.forEach(student => {
      student.subjects.forEach((subject: any) => {
        if (subject.progress >= 90) gradeDistribution.A++
        else if (subject.progress >= 80) gradeDistribution.B++
        else if (subject.progress >= 70) gradeDistribution.C++
        else gradeDistribution.D++
      })
    })

    // Calculate subject averages
    const subjectTotals = { Mathematics: 0, Science: 0, English: 0, 'Social Studies': 0 }
    filteredStudents.forEach(student => {
      student.subjects.forEach((subject: any) => {
        if (subjectTotals.hasOwnProperty(subject.name)) {
          subjectTotals[subject.name as keyof typeof subjectTotals] += subject.progress
        }
      })
    })

    Object.keys(subjectAverages).forEach(subject => {
      subjectAverages[subject as keyof typeof subjectAverages] = 
        Math.round(subjectTotals[subject as keyof typeof subjectTotals] / filteredStudents.length)
    })

    // Convert grade distribution to percentages
    const totalGrades = Object.values(gradeDistribution).reduce((sum, count) => sum + count, 0)
    if (totalGrades > 0) {
      Object.keys(gradeDistribution).forEach(grade => {
        gradeDistribution[grade as keyof typeof gradeDistribution] = 
          Math.round((gradeDistribution[grade as keyof typeof gradeDistribution] / totalGrades) * 100)
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Progress Tracking
                </h1>
                <p className="text-gray-600 mt-1">Monitor student academic progress and achievements</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white/80">
                <Download className="w-4 h-4 mr-2" />
                Export Report
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
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Students</p>
                    <p className="text-3xl font-bold">{stats.totalStudents}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Average XP</p>
                    <p className="text-3xl font-bold">{Math.round(stats.averageXP)}</p>
                  </div>
                  <Zap className="w-8 h-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Top Performers</p>
                    <p className="text-3xl font-bold">{stats.topPerformers}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Active Streaks</p>
                    <p className="text-3xl font-bold">{stats.activeStreaks}</p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm shadow-lg rounded-xl p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Student Progress</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Progress Overview</CardTitle>
                <CardDescription>School-wide academic progress summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-4">Grade Distribution</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Grade A (90-100%)</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={gradeDistribution.A} className="w-24" />
                          <span className="text-sm font-medium">{gradeDistribution.A}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Grade B (80-89%)</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={gradeDistribution.B} className="w-24" />
                          <span className="text-sm font-medium">{gradeDistribution.B}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Grade C (70-79%)</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={gradeDistribution.C} className="w-24" />
                          <span className="text-sm font-medium">{gradeDistribution.C}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Subject Performance</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mathematics</span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">{subjectAverages.Mathematics}% avg</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Science</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800">{subjectAverages.Science}% avg</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">English</span>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">{subjectAverages.English}% avg</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Social Studies</span>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800">{subjectAverages['Social Studies']}% avg</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            {/* Filters */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {availableGrades.map((grade) => (
                        <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {availableClasses.map((className) => (
                        <SelectItem key={className} value={className}>{className}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Student List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredStudents.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{student.name}</h3>
                          <p className="text-sm text-gray-600">Grade {student.grade} - Class {student.class}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold">Level {student.level}</span>
                          </div>
                          <p className="text-sm text-gray-600">{student.totalXP} XP</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Completed Quests</span>
                          <Badge variant="outline">{student.completedQuests}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Current Streak</span>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            {student.streak} days
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Subject Progress</h4>
                        <div className="space-y-2">
                          {student.subjects.map((subject: any) => (
                            <div key={subject.name} className="flex items-center justify-between">
                              <span className="text-sm">{subject.name}</span>
                              <div className="flex items-center space-x-2">
                                <Progress value={subject.progress} className="w-16" />
                                <Badge variant="outline" className="text-xs">
                                  {subject.grade}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Progress Analytics</CardTitle>
                <CardDescription>Detailed performance metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-600 mb-6">Advanced analytics and reporting features coming soon.</p>
                  <Button>
                    <PieChart className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
