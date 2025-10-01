'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Award,
  BookOpen,
  Calendar,
  Eye,
  ArrowRight,
  Target,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

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

interface RecentResultsCardProps {
  limit?: number
  showViewAll?: boolean
}

export default function RecentResultsCard({ limit = 5, showViewAll = true }: RecentResultsCardProps) {
  const [results, setResults] = useState<Result[]>([])
  const [stats, setStats] = useState<ResultsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecentResults()
  }, [limit])

  const fetchRecentResults = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/results?limit=${limit}`)
      
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        setStats(data.stats)
      } else {
        throw new Error('Failed to fetch results')
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      setError('Failed to load recent results')
      toast.error('Could not load recent results')
    } finally {
      setLoading(false)
    }
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'declining':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchRecentResults}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Recent Results
            </CardTitle>
            <CardDescription>
              Your latest assessment scores and performance
            </CardDescription>
          </div>
          
          {stats && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(stats.average_percentage)}%
              </div>
              <div className="text-sm text-gray-600">Average</div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Performance Summary */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {stats.total_assessments}
              </div>
              <div className="text-xs text-gray-600">Total Tests</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                {getTrendIcon(stats.recent_trend)}
                <span className="text-lg font-bold capitalize">
                  {stats.recent_trend}
                </span>
              </div>
              <div className="text-xs text-gray-600">Trend</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {Object.entries(stats.grade_distribution)
                  .filter(([grade]) => ['A+', 'A', 'A-'].includes(grade))
                  .reduce((sum, [, count]) => sum + count, 0)}
              </div>
              <div className="text-xs text-gray-600">A Grades</div>
            </div>
          </div>
        )}

        {/* Recent Results List */}
        <div className="space-y-3">
          {results.length > 0 ? (
            results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {result.assessment.title}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Badge variant="outline" className="text-xs">
                        {result.assessment.type}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(result.assessment.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {result.grade.score}/{result.assessment.max_score}
                    </div>
                    <div className="text-sm text-gray-600">
                      {Math.round(result.grade.percentage)}%
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className={`${getGradeColor(result.grade.letter_grade)} font-bold`}
                  >
                    {result.grade.letter_grade}
                  </Badge>
                  
                  {result.grade.feedback && (
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h4 className="font-semibold text-gray-700 mb-1">
                No Results Yet
              </h4>
              <p className="text-sm text-gray-500">
                Your assessment results will appear here once teachers publish them
              </p>
            </div>
          )}
        </div>

        {/* Improvement Areas */}
        {stats && stats.improvement_areas.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-amber-600" />
              <h4 className="font-semibold text-amber-800">Focus Areas</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.improvement_areas.map((area) => (
                <Badge 
                  key={area}
                  variant="outline" 
                  className="bg-amber-100 text-amber-800 border-amber-300"
                >
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* View All Button */}
        {showViewAll && results.length > 0 && (
          <Link href="/student/results">
            <Button variant="outline" className="w-full flex items-center gap-2">
              <span>View All Results</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
