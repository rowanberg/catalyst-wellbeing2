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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gray-200 rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="w-32 sm:w-48 h-5 sm:h-6 bg-gray-200 rounded animate-pulse" />
                <div className="w-48 h-3 bg-gray-200 rounded animate-pulse hidden sm:block" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/70 rounded-xl p-3 sm:p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                    <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Tabs Skeleton */}
          <div className="bg-white/50 rounded-lg p-1 shadow-lg">
            <div className="grid grid-cols-3 gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="bg-white/70 rounded-xl p-4 shadow-lg space-y-4">
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                      <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 sm:space-x-4"
            >
              <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Progress Tracking
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 hidden sm:block">Monitor student academic progress and achievements</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button variant="outline" size="sm" className="bg-white/50 backdrop-blur-sm hover:bg-white/80 text-xs sm:text-sm">
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Export Report</span>
              </Button>
              <Link href="/admin">
                <Button variant="outline" size="sm" className="bg-white/50 backdrop-blur-sm hover:bg-white/80 text-xs sm:text-sm">
                  <ChevronRight className="w-4 h-4 rotate-180 sm:hidden" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Students</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.totalStudents}</p>
                  </div>
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-xs sm:text-sm font-medium">Average XP</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{Math.round(stats.averageXP)}</p>
                  </div>
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs sm:text-sm font-medium">Top Performers</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.topPerformers}</p>
                  </div>
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-xs sm:text-sm font-medium">Active Streaks</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.activeStreaks}</p>
                  </div>
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm shadow-lg rounded-lg sm:rounded-xl p-0.5 sm:p-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-1.5 sm:py-2">Overview</TabsTrigger>
            <TabsTrigger value="students" className="text-xs sm:text-sm py-1.5 sm:py-2"><span className="hidden sm:inline">Student </span>Progress</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-1.5 sm:py-2">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-base sm:text-lg">Progress Overview</CardTitle>
                <CardDescription className="text-xs sm:text-sm">School-wide academic progress summary</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Grade Distribution</h4>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm whitespace-nowrap">Grade A (90%+)</span>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Progress value={gradeDistribution.A} className="w-14 sm:w-20 lg:w-24" />
                          <span className="text-xs sm:text-sm font-medium w-8 text-right">{gradeDistribution.A}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm whitespace-nowrap">Grade B (80%+)</span>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Progress value={gradeDistribution.B} className="w-14 sm:w-20 lg:w-24" />
                          <span className="text-xs sm:text-sm font-medium w-8 text-right">{gradeDistribution.B}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm whitespace-nowrap">Grade C (70%+)</span>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Progress value={gradeDistribution.C} className="w-14 sm:w-20 lg:w-24" />
                          <span className="text-xs sm:text-sm font-medium w-8 text-right">{gradeDistribution.C}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Subject Performance</h4>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm">Mathematics</span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">{subjectAverages.Mathematics}%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm">Science</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">{subjectAverages.Science}%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm">English</span>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">{subjectAverages.English}%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm">Social Studies</span>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">{subjectAverages['Social Studies']}%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4 sm:space-y-6">
            {/* Filters */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9 sm:h-10 text-sm"
                    />
                  </div>
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="h-9 sm:h-10 text-sm">
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
                    <SelectTrigger className="h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {availableClasses.map((className) => (
                        <SelectItem key={className} value={className}>{className}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                    <Filter className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">More Filters</span>
                  </Button>
                </div>

                {/* Result Count */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{filteredStudents.length}</span> student{filteredStudents.length !== 1 ? 's' : ''} found
                  </p>
                  {(searchTerm || gradeFilter !== 'all' || classFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setGradeFilter('all')
                        setClassFilter('all')
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium active:scale-95 transition-transform"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Student List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              {filteredStudents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full"
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-6 sm:p-8 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('')
                          setGradeFilter('all')
                          setClassFilter('all')
                        }}
                        className="text-xs sm:text-sm"
                      >
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                filteredStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  >
                    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all duration-200 cursor-pointer touch-manipulation">
                      <CardContent className="p-3 sm:p-4 lg:p-6">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div className="min-w-0 flex-1 mr-2">
                            <h3 className="font-semibold text-sm sm:text-base lg:text-lg truncate">{student.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Grade {student.grade} - Class {student.class}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                              <span className="font-semibold text-xs sm:text-sm">Lvl {student.level}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600">{student.totalXP} XP</p>
                          </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span>Completed Quests</span>
                            <Badge variant="outline" className="text-xs">{student.completedQuests}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span>Current Streak</span>
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">
                              {student.streak} days
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-3 sm:mt-4">
                          <h4 className="font-medium mb-2 text-xs sm:text-sm">Subject Progress</h4>
                          <div className="space-y-1.5 sm:space-y-2">
                            {student.subjects.map((subject: any) => (
                              <div key={subject.name} className="flex items-center justify-between gap-2">
                                <span className="text-xs sm:text-sm truncate flex-1">{subject.name}</span>
                                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                                  <Progress value={subject.progress} className="w-10 sm:w-14 lg:w-16" />
                                  <Badge variant="outline" className="text-[10px] sm:text-xs">
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
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-base sm:text-lg">Progress Analytics</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Detailed performance metrics and trends</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                <div className="text-center py-8 sm:py-12">
                  <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">Advanced analytics and reporting features coming soon.</p>
                  <Button size="sm" className="text-xs sm:text-sm">
                    <PieChart className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div >
  )
}
