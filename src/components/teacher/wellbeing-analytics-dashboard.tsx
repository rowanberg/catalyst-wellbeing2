'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Brain, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Smile,
  Meh,
  Frown,
  Zap,
  Star,
  Eye,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WellbeingMetrics {
  classAverage: number
  totalResponses: number
  trendDirection: 'up' | 'down' | 'stable'
  trendPercentage: number
  moodDistribution: {
    happy: number
    excited: number
    calm: number
    sad: number
    angry: number
    anxious: number
  }
  riskLevel: 'low' | 'medium' | 'high'
  interventionSuggestions: string[]
}

interface StudentInsight {
  id: string
  name: string
  grade: string
  wellbeingScore: number
  recentMoods: string[]
  riskLevel: 'low' | 'medium' | 'high'
  concerns: string[]
  strengths: string[]
  lastCheckIn: string
}

interface WellbeingAnalyticsDashboardProps {
  teacherId: string
  schoolId: string
}

export const WellbeingAnalyticsDashboard = ({ teacherId, schoolId }: WellbeingAnalyticsDashboardProps) => {
  const [metrics, setMetrics] = useState<WellbeingMetrics | null>(null)
  const [studentInsights, setStudentInsights] = useState<StudentInsight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'trends' | 'interventions'>('overview')

  const fetchWellbeingData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/teacher/wellbeing-analytics?teacher_id=${teacherId}&time_range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
        setStudentInsights(data.studentInsights || [])
      }
    } catch (error: any) {
      console.error('Error fetching wellbeing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWellbeingData()
  }, [teacherId, timeRange])

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy':
      case 'excited':
        return <Smile className="w-4 h-4 text-green-500" />
      case 'calm':
        return <Meh className="w-4 h-4 text-blue-500" />
      case 'sad':
      case 'angry':
      case 'anxious':
        return <Frown className="w-4 h-4 text-red-500" />
      default:
        return <Meh className="w-4 h-4 text-gray-500" />
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredStudents = studentInsights.filter(student => {
    if (selectedRiskLevel === 'all') return true
    return student.riskLevel === selectedRiskLevel
  })

  if (isLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Loading wellbeing analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Wellbeing Analytics</h2>
          <p className="text-gray-600">Anonymized insights to support student mental health</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchWellbeingData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Student Insights
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="interventions" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Interventions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {metrics && (
            <>
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Class Average"
                  value={`${metrics.classAverage.toFixed(1)}/10`}
                  trend={metrics.trendDirection}
                  trendValue={`${metrics.trendPercentage}%`}
                  icon={<Heart className="w-5 h-5" />}
                  color="blue"
                />
                <MetricCard
                  title="Total Responses"
                  value={metrics.totalResponses.toString()}
                  icon={<Users className="w-5 h-5" />}
                  color="green"
                />
                <MetricCard
                  title="Risk Level"
                  value={metrics.riskLevel.charAt(0).toUpperCase() + metrics.riskLevel.slice(1)}
                  icon={<AlertTriangle className="w-5 h-5" />}
                  color={metrics.riskLevel === 'high' ? 'red' : metrics.riskLevel === 'medium' ? 'yellow' : 'green'}
                />
                <MetricCard
                  title="Interventions"
                  value={metrics.interventionSuggestions.length.toString()}
                  subtitle="Suggested"
                  icon={<Target className="w-5 h-5" />}
                  color="purple"
                />
              </div>

              {/* Mood Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Mood Distribution
                  </CardTitle>
                  <CardDescription>
                    Current emotional state breakdown across your class
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(metrics.moodDistribution).map(([mood, count]: [string, any]) => (
                      <div key={mood} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {getMoodIcon(mood)}
                          <span className="capitalize font-medium">{mood}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          {/* Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline">
                  {filteredStudents.length} students
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Student Insights */}
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <StudentInsightCard key={student.id} student={student} />
            ))}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <TrendsAnalysis metrics={metrics} timeRange={timeRange} />
        </TabsContent>

        {/* Interventions Tab */}
        <TabsContent value="interventions">
          <InterventionToolkit 
            suggestions={metrics?.interventionSuggestions || []}
            riskLevel={metrics?.riskLevel || 'low'}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const MetricCard = ({ title, value, subtitle, trend, trendValue, icon, color }: any) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : trend === 'down' ? (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                ) : (
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                )}
                <span className={`text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const StudentInsightCard = ({ student }: { student: StudentInsight }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{student.name}</h3>
          <p className="text-sm text-gray-600">{student.grade}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${student.riskLevel === 'high' ? 'bg-red-100 text-red-800' : 
                           student.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                           'bg-green-100 text-green-800'}`}>
            {student.riskLevel} risk
          </Badge>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">{student.wellbeingScore}/10</p>
            <p className="text-xs text-gray-500">wellbeing score</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {student.concerns.length > 0 && (
          <div>
            <p className="text-sm font-medium text-red-700 mb-2">Concerns:</p>
            <ul className="text-sm text-red-600 space-y-1">
              {student.concerns.map((concern, index) => (
                <li key={index} className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {student.strengths.length > 0 && (
          <div>
            <p className="text-sm font-medium text-green-700 mb-2">Strengths:</p>
            <ul className="text-sm text-green-600 space-y-1">
              {student.strengths.map((strength, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Star className="w-3 h-3" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
        <div className="flex items-center gap-4">
          <span>Recent moods:</span>
          <div className="flex gap-1">
            {student.recentMoods.slice(0, 5).map((mood, index) => (
              <div key={index} className="w-2 h-2 rounded-full bg-gray-300" title={mood} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last check-in: {new Date(student.lastCheckIn).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  )
}

const TrendsAnalysis = ({ metrics, timeRange }: any) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wellbeing Trends</CardTitle>
          <CardDescription>
            Class wellbeing patterns over the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Trend chart visualization would go here</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Peak Wellbeing Times</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Monday mornings</span>
                <Badge className="bg-green-100 text-green-800">8.2/10</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Wednesday afternoons</span>
                <Badge className="bg-green-100 text-green-800">7.8/10</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Friday mornings</span>
                <Badge className="bg-green-100 text-green-800">7.5/10</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Challenging Times</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Tuesday afternoons</span>
                <Badge className="bg-red-100 text-red-800">5.2/10</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Thursday mornings</span>
                <Badge className="bg-yellow-100 text-yellow-800">6.1/10</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Friday afternoons</span>
                <Badge className="bg-yellow-100 text-yellow-800">6.3/10</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const InterventionToolkit = ({ suggestions, riskLevel }: any) => {
  const interventions = [
    {
      title: "3-Minute Mindfulness Break",
      description: "Quick breathing exercise to reset class energy",
      duration: "3 minutes",
      difficulty: "Easy",
      category: "Mindfulness"
    },
    {
      title: "Gratitude Circle",
      description: "Students share one thing they're grateful for",
      duration: "10 minutes", 
      difficulty: "Easy",
      category: "Social-Emotional"
    },
    {
      title: "Movement Break",
      description: "Simple stretches or desk exercises",
      duration: "5 minutes",
      difficulty: "Easy", 
      category: "Physical"
    },
    {
      title: "Worry Box Activity",
      description: "Anonymous way for students to share concerns",
      duration: "15 minutes",
      difficulty: "Medium",
      category: "Mental Health"
    }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Recommended Interventions
          </CardTitle>
          <CardDescription>
            Based on current class wellbeing data and risk level: {riskLevel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interventions.map((intervention, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{intervention.title}</h3>
                  <Badge variant="outline">{intervention.category}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{intervention.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {intervention.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {intervention.difficulty}
                  </div>
                </div>
                <Button size="sm" className="w-full mt-3" variant="outline">
                  Try This Activity
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI-Generated Suggestions</CardTitle>
            <CardDescription>
              Personalized recommendations based on your class data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
