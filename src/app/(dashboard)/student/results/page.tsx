'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  Calendar,
  BookOpen,
  Award,
  Target,
  Eye,
  Download,
  Star,
  Clock,
  User,
  School,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface Assessment {
  id: string
  title: string
  type: string
  max_score: number
  date: string
  teacher: string
}

interface Grade {
  score: number
  percentage: number
  letter_grade: string
  feedback?: string
  rubric_scores?: { [key: string]: number }
}

interface Result {
  id: string
  assessment: Assessment
  grade: Grade
  submitted_at: string
  updated_at: string
}

interface ResultsStats {
  total_assessments: number
  average_percentage: number
  highest_score: number
  lowest_score: number
  grade_distribution: { [key: string]: number }
  recent_trend: 'improving' | 'declining' | 'stable'
  improvement_areas: string[]
}

export default function StudentResultsPage() {
  const [results, setResults] = useState<Result[]>([])
  const [filteredResults, setFilteredResults] = useState<Result[]>([])
  const [stats, setStats] = useState<ResultsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')
  const [expandedResult, setExpandedResult] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

  useEffect(() => {
    fetchResults()
  }, [selectedYear])

  useEffect(() => {
    applyFilters()
  }, [results, searchQuery, filterType, sortBy])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/results?year=${selectedYear}&limit=100`)
      
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        setStats(data.stats)
      } else {
        throw new Error('Failed to fetch results')
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...results]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(result =>
        result.assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.assessment.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.assessment.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(result => result.assessment.type === filterType)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.assessment.date).getTime() - new Date(a.assessment.date).getTime()
        case 'date_asc':
          return new Date(a.assessment.date).getTime() - new Date(b.assessment.date).getTime()
        case 'grade_desc':
          return b.grade.percentage - a.grade.percentage
        case 'grade_asc':
          return a.grade.percentage - b.grade.percentage
        case 'title':
          return a.assessment.title.localeCompare(b.assessment.title)
        default:
          return 0
      }
    })

    setFilteredResults(filtered)
  }

  const getGradeColor = (letterGrade: string) => {
    switch (letterGrade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'A-':
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'B-':
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'C-':
      case 'D+':
      case 'D':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getAssessmentTypes = () => {
    const types = [...new Set(results.map(r => r.assessment.type))]
    return types
  }

  const exportResults = () => {
    const csvContent = [
      ['Assessment', 'Type', 'Date', 'Teacher', 'Score', 'Max Score', 'Percentage', 'Letter Grade', 'Feedback'],
      ...filteredResults.map(result => [
        result.assessment.title,
        result.assessment.type,
        new Date(result.assessment.date).toLocaleDateString(),
        result.assessment.teacher,
        result.grade.score,
        result.assessment.max_score,
        result.grade.percentage,
        result.grade.letter_grade,
        result.grade.feedback || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `results_${selectedYear}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Results</h1>
            <p className="text-gray-600 mt-1">Track your academic performance and progress</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={exportResults}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_assessments}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(stats.average_percentage)}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Highest Score</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.highest_score}</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Trend</p>
                    <p className="text-2xl font-bold text-gray-900 capitalize">{stats.recent_trend}</p>
                  </div>
                  {stats.recent_trend === 'improving' ? (
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  ) : stats.recent_trend === 'declining' ? (
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  ) : (
                    <Target className="h-8 w-8 text-gray-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assessments, teachers, or types..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getAssessmentTypes().map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Newest First</SelectItem>
                  <SelectItem value="date_asc">Oldest First</SelectItem>
                  <SelectItem value="grade_desc">Highest Grade</SelectItem>
                  <SelectItem value="grade_asc">Lowest Grade</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Assessment Results ({filteredResults.length})</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {selectedYear}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredResults.length > 0 ? (
                filteredResults.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div 
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedResult(
                        expandedResult === result.id ? null : result.id
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {result.assessment.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {result.assessment.type}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {result.assessment.teacher}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(result.assessment.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-bold text-lg text-gray-900">
                              {result.grade.score}/{result.assessment.max_score}
                            </div>
                            <div className="text-sm text-gray-600">
                              {Math.round(result.grade.percentage)}%
                            </div>
                          </div>
                          
                          <Badge 
                            variant="outline" 
                            className={`${getGradeColor(result.grade.letter_grade)} font-bold text-lg px-3 py-1`}
                          >
                            {result.grade.letter_grade}
                          </Badge>
                          
                          {expandedResult === result.id ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {expandedResult === result.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t bg-gray-50"
                        >
                          <div className="p-4 space-y-4">
                            {/* Feedback */}
                            {result.grade.feedback && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" />
                                  Teacher Feedback
                                </h4>
                                <p className="text-gray-700 bg-white p-3 rounded border">
                                  {result.grade.feedback}
                                </p>
                              </div>
                            )}
                            
                            {/* Rubric Scores */}
                            {result.grade.rubric_scores && Object.keys(result.grade.rubric_scores).length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Rubric Breakdown
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {Object.entries(result.grade.rubric_scores).map(([criteria, score]) => (
                                    <div key={criteria} className="bg-white p-3 rounded border">
                                      <div className="font-medium text-gray-900 capitalize">
                                        {criteria.replace('_', ' ')}
                                      </div>
                                      <div className="text-lg font-bold text-blue-600">
                                        {score}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Submission Info */}
                            <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Submitted: {new Date(result.submitted_at).toLocaleString()}
                              </span>
                              {result.updated_at !== result.submitted_at && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Updated: {new Date(result.updated_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Results Found
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || filterType !== 'all' 
                      ? 'Try adjusting your filters or search terms'
                      : `No assessment results available for ${selectedYear}`
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
