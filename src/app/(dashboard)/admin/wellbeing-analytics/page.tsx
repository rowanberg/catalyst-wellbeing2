'use client'

import { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Brain,
  Users,
  AlertTriangle,
  Calendar,
  BarChart3,
  ArrowLeft,
  Download,
  Filter,
  Award,
  Target,
  Activity,
  Zap,
  Clock,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Search,
  Eye,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react'
import Link from 'next/link'
// Charts will be implemented with CSS-based visualizations for now

interface WellbeingMetric {
  id: string
  name: string
  value: number
  previousValue: number
  trend: 'up' | 'down' | 'stable'
  category: 'mood' | 'engagement' | 'safety' | 'academic' | 'social'
  description: string
}

interface ClassAnalytics {
  className: string
  grade: string
  teacher: string
  totalStudents: number
  wellbeingScore: number
  riskLevel: 'low' | 'medium' | 'high'
  trends: {
    mood: number
    engagement: number
    helpRequests: number
  }
}

interface StudentInsight {
  id: string
  name: string
  grade: string
  riskLevel: 'low' | 'medium' | 'high'
  lastActivity: string
  concerns: string[]
  strengths: string[]
}

export default function WellbeingAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  // Fetch real analytics data
  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/admin/wellbeing-analytics?timeRange=${timeRange}&grade=${selectedGrade}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const data = await response.json()
      setAnalytics(data.analytics)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange, selectedGrade])

  // Fallback to mock data if API fails
  useEffect(() => {
    if (error && !analytics) {
      const mockAnalytics = {
        metrics: [
          {
            id: '1',
            name: 'Overall Wellbeing Score',
            value: 8.2,
            previousValue: 7.8,
            trend: 'up',
            category: 'mood',
            description: 'Average wellbeing score across all students'
          },
          {
            id: '2',
            name: 'Student Engagement',
            value: 85,
            previousValue: 82,
            trend: 'up',
            category: 'engagement',
            description: 'Percentage of students actively participating'
          },
          {
            id: '3',
            name: 'Help Requests',
            value: 12,
            previousValue: 18,
            trend: 'down',
            category: 'safety',
            description: 'Number of help requests this week'
          },
          {
            id: '4',
            name: 'Mood Tracker Usage',
            value: 78,
            previousValue: 75,
            trend: 'up',
            category: 'mood',
            description: 'Percentage of students using mood tracker daily'
          },
          {
            id: '5',
            name: 'Quest Completion Rate',
            value: 92,
            previousValue: 89,
            trend: 'up',
            category: 'engagement',
            description: 'Percentage of daily quests completed'
          },
          {
            id: '6',
            name: 'Academic Stress Level',
            value: 3.2,
            previousValue: 3.8,
            trend: 'down',
            category: 'academic',
            description: 'Average stress level (1-10 scale)'
          }
        ],
        classAnalytics: [
          {
            className: '5A',
            grade: '5',
            teacher: 'Ms. Johnson',
            totalStudents: 24,
            wellbeingScore: 8.5,
            riskLevel: 'low',
            trends: { mood: 85, engagement: 92, helpRequests: 2 }
          },
          {
            className: '5B',
            grade: '5',
            teacher: 'Mr. Smith',
            totalStudents: 22,
            wellbeingScore: 7.8,
            riskLevel: 'medium',
            trends: { mood: 78, engagement: 85, helpRequests: 5 }
          },
          {
            className: '6A',
            grade: '6',
            teacher: 'Ms. Rodriguez',
            totalStudents: 26,
            wellbeingScore: 8.1,
            riskLevel: 'low',
            trends: { mood: 82, engagement: 88, helpRequests: 3 }
          },
          {
            className: '7A',
            grade: '7',
            teacher: 'Mr. Thompson',
            totalStudents: 25,
            wellbeingScore: 7.2,
            riskLevel: 'high',
            trends: { mood: 72, engagement: 78, helpRequests: 8 }
          }
        ],
        studentInsights: [
          {
            id: '1',
            name: 'Emma Johnson',
            grade: '5',
            riskLevel: 'high',
            lastActivity: '2 hours ago',
            concerns: ['Low mood scores', 'Missed daily quests', 'Help request submitted'],
            strengths: ['High kindness counter', 'Regular breathing exercises']
          },
          {
            id: '2',
            name: 'Michael Chen',
            grade: '6',
            riskLevel: 'medium',
            lastActivity: '1 day ago',
            concerns: ['Academic stress indicators', 'Irregular sleep patterns'],
            strengths: ['Consistent gratitude journaling', 'Peer support activities']
          },
          {
            id: '3',
            name: 'Sarah Williams',
            grade: '7',
            riskLevel: 'low',
            lastActivity: '30 minutes ago',
            concerns: [],
            strengths: ['High engagement', 'Leadership in group activities', 'Excellent wellbeing scores']
          }
        ],
        wellbeingDistribution: {
          thriving: 68,
          moderate: 25,
          atRisk: 7
        }
      }
      
      setAnalytics(mockAnalytics)
      setLoading(false)
    }
  }, [error, analytics])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-600" />
      case 'down': return <ArrowDown className="w-4 h-4 text-red-600" />
      default: return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mood': return <Heart className="w-5 h-5" />
      case 'engagement': return <Zap className="w-5 h-5" />
      case 'safety': return <AlertTriangle className="w-5 h-5" />
      case 'academic': return <Brain className="w-5 h-5" />
      case 'social': return <Users className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600"></div>
          <div className="text-lg font-medium text-gray-700 animate-pulse">Loading analytics...</div>
          <div className="text-sm text-gray-500">Gathering student wellbeing insights</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-gradient-to-r from-white/90 to-emerald-50/90 border-b border-emerald-200/30 shadow-xl">
        <div className="px-3 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 sm:space-x-4"
            >
              <motion.div 
                className="p-3 sm:p-4 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent"
                >
                  Student Wellbeing Analytics
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm sm:text-base text-gray-600 mt-2 hidden sm:block"
                >
                  🌟 Comprehensive insights into student mental health, engagement, and growth
                </motion.p>
                <p className="text-xs text-gray-600 mt-1 sm:hidden">📊 Student insights & trends</p>
              </div>
            </motion.div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32 sm:w-40 bg-white/70 backdrop-blur-sm border-emerald-200 hover:bg-white/90 text-xs sm:text-sm shadow-lg">
                    <Clock className="w-4 h-4 mr-2 text-emerald-600" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">📅 Last 7 days</SelectItem>
                    <SelectItem value="30d">📊 Last 30 days</SelectItem>
                    <SelectItem value="90d">📈 Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:from-emerald-100 hover:to-teal-100 text-xs sm:text-sm px-3 sm:px-4 shadow-lg transition-all duration-300"
                  onClick={() => setRefreshing(true)}
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh Data</span>
                  <span className="sm:hidden">Refresh</span>
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 text-xs sm:text-sm px-3 sm:px-4 shadow-lg"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">📄 Export Report</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </motion.div>
              
              <Link href="/admin">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 hover:from-gray-100 hover:to-slate-100 text-xs sm:text-sm px-3 sm:px-4 shadow-lg"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">🏠 Dashboard</span>
                    <span className="sm:hidden">Back</span>
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Enhanced Key Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">📊 Key Performance Indicators</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {analytics?.metrics?.map((metric: any, index: number) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="group"
              >
                <Card className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:from-white/90 group-hover:to-white/80 overflow-hidden relative">
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-emerald-50/20 to-teal-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <CardContent className="p-5 sm:p-7 relative z-10">
                    <div className="flex items-center justify-between mb-4 sm:mb-5">
                      <motion.div 
                        className={`p-3 rounded-xl shadow-lg ${
                          metric.category === 'mood' ? 'bg-gradient-to-br from-pink-100 to-rose-100' :
                          metric.category === 'engagement' ? 'bg-gradient-to-br from-blue-100 to-indigo-100' :
                          metric.category === 'safety' ? 'bg-gradient-to-br from-orange-100 to-red-100' :
                          metric.category === 'academic' ? 'bg-gradient-to-br from-purple-100 to-violet-100' :
                          'bg-gradient-to-br from-green-100 to-emerald-100'
                        }`}
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className={`${
                          metric.category === 'mood' ? 'text-pink-600' :
                          metric.category === 'engagement' ? 'text-blue-600' :
                          metric.category === 'safety' ? 'text-orange-600' :
                          metric.category === 'academic' ? 'text-purple-600' :
                          'text-green-600'
                        }`}>
                          {getCategoryIcon(metric.category)}
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-md ${
                          metric.trend === 'up' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' :
                          metric.trend === 'down' ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700' :
                          'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700'
                        }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {getTrendIcon(metric.trend)}
                        <span>
                          {Math.abs(((metric.value - metric.previousValue) / metric.previousValue) * 100).toFixed(1)}%
                        </span>
                      </motion.div>
                    </div>
                    
                    <div className="space-y-3">
                      <motion.div 
                        className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                      >
                        {typeof metric.value === 'number' && metric.value < 10 ? metric.value.toFixed(1) : metric.value}
                        {metric.category === 'engagement' && '%'}
                      </motion.div>
                      
                      <div className="text-sm sm:text-base font-semibold text-gray-700 mb-2">
                        {metric.name}
                      </div>
                      
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {metric.description}
                      </p>
                      
                      {/* Progress bar for percentage metrics */}
                      {(metric.category === 'engagement' || metric.name.includes('Usage')) && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div 
                              className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${metric.value}%` }}
                              transition={{ delay: index * 0.1 + 0.8, duration: 1, ease: "easeOut" }}
                            ></motion.div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-gradient-to-r from-white/70 to-emerald-50/70 backdrop-blur-lg border border-emerald-200/30 shadow-lg rounded-xl p-1">
                <TabsTrigger 
                  value="overview" 
                  className="text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
                >
                  📊 Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="classes" 
                  className="text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
                >
                  🏫 Classes
                </TabsTrigger>
                <TabsTrigger 
                  value="students" 
                  className="text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
                >
                  👥 Students
                </TabsTrigger>
                <TabsTrigger 
                  value="trends" 
                  className="text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
                >
                  📈 Trends
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-gradient-to-br from-white/80 to-emerald-50/60 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                    <CardHeader className="relative z-10">
                      <CardTitle className="flex items-center space-x-3">
                        <motion.div
                          className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg"
                          whileHover={{ rotate: 10, scale: 1.1 }}
                        >
                          <Heart className="w-5 h-5 text-emerald-600" />
                        </motion.div>
                        <span className="bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">🌟 Well-being Distribution</span>
                      </CardTitle>
                      <CardDescription className="text-gray-600">Student mental health levels across the school</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="space-y-5">
                        <motion.div 
                          className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center space-x-3">
                            <motion.div 
                              className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            ></motion.div>
                            <span className="text-sm font-medium text-green-800">😊 Thriving (8-10)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-green-700 text-lg">68%</span>
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center space-x-3">
                            <motion.div 
                              className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg"
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2.5, repeat: Infinity }}
                            ></motion.div>
                            <span className="text-sm font-medium text-yellow-800">😐 Moderate (5-7)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-yellow-700 text-lg">25%</span>
                            <Minus className="w-4 h-4 text-yellow-600" />
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center space-x-3">
                            <motion.div 
                              className="w-5 h-5 bg-gradient-to-r from-red-400 to-pink-500 rounded-full shadow-lg"
                              animate={{ scale: [1, 1.15, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            ></motion.div>
                            <span className="text-sm font-medium text-red-800">😟 At Risk (1-4)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-red-700 text-lg">7%</span>
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-gradient-to-br from-white/80 to-blue-50/60 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="w-5 h-5" />
                    <span>Weekly Trends</span>
                  </CardTitle>
                  <CardDescription>Key metrics over the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mt-6">
                    <div className="h-48 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">Weekly Wellbeing Trend</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics?.trendData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mood Scores</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">+5.2%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Quest Completion</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">+3.4%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Help Requests</span>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">-33.3%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
                </motion.div>
              </motion.div>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {analytics?.classAnalytics?.map((classData: any, index: number) => (
                <motion.div
                  key={classData.className}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Class {classData.className}</CardTitle>
                          <CardDescription>
                            {classData.teacher} • {classData.totalStudents} students
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={getRiskLevelColor(classData.riskLevel)}>
                          {classData.riskLevel} risk
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Average Score</span>
                          <span className="text-2xl font-bold text-blue-600">{classData.averageScore}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Students</span>
                          <span className="text-lg font-semibold">{classData.totalStudents}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Risk Level</span>
                          <Badge variant={classData.riskLevel === 'low' ? 'default' : classData.riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                            {classData.riskLevel}
                          </Badge>
                        </div>
                        
                        {/* Class Performance Chart */}
                        <div className="mt-4 h-24 sm:h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={classData.weeklyData || []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="day" fontSize={10} />
                              <YAxis fontSize={10} />
                              <Tooltip />
                              <Bar dataKey="score" fill="#3B82F6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              {analytics?.studentInsights?.map((student: any, index: number) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 space-y-2 sm:space-y-0">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base sm:text-lg truncate">{student.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">{student.grade} • {student.class}</p>
                        </div>
                        <Badge variant={student.riskLevel === 'low' ? 'default' : student.riskLevel === 'medium' ? 'secondary' : 'destructive'} className="text-xs">
                          {student.riskLevel} risk
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {student.concerns.length > 0 && (
                          <div>
                            <h4 className="font-medium text-red-800 mb-2 flex items-center text-sm">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Concerns
                            </h4>
                            <ul className="space-y-1">
                              {student.concerns.map((concern: any, i: number) => (
                                <li key={i} className="text-xs sm:text-sm text-red-700 bg-red-50 px-2 py-1 rounded">
                                  {concern}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {student.strengths.length > 0 && (
                          <div>
                            <h4 className="font-medium text-green-800 mb-2 flex items-center text-sm">
                              <Award className="w-4 h-4 mr-2" />
                              Strengths
                            </h4>
                            <ul className="space-y-1">
                              {student.strengths.map((strength: any, i: number) => (
                                <li key={i} className="text-xs sm:text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mood Distribution Pie Chart */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>Mood Distribution</span>
                  </CardTitle>
                  <CardDescription>Current student mood breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Happy', value: 45, fill: '#10B981' },
                            { name: 'Calm', value: 30, fill: '#3B82F6' },
                            { name: 'Excited', value: 15, fill: '#F59E0B' },
                            { name: 'Sad', value: 7, fill: '#EF4444' },
                            { name: 'Anxious', value: 3, fill: '#8B5CF6' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Happy', value: 45, fill: '#10B981' },
                            { name: 'Calm', value: 30, fill: '#3B82F6' },
                            { name: 'Excited', value: 15, fill: '#F59E0B' },
                            { name: 'Sad', value: 7, fill: '#EF4444' },
                            { name: 'Anxious', value: 3, fill: '#8B5CF6' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Progress Line Chart */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span>Weekly Progress</span>
                  </CardTitle>
                  <CardDescription>Wellbeing score trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics?.trendData || [
                        { date: 'Mon', score: 78, engagement: 85 },
                        { date: 'Tue', score: 82, engagement: 88 },
                        { date: 'Wed', score: 79, engagement: 82 },
                        { date: 'Thu', score: 85, engagement: 90 },
                        { date: 'Fri', score: 88, engagement: 92 },
                        { date: 'Sat', score: 84, engagement: 87 },
                        { date: 'Sun', score: 86, engagement: 89 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={3} />
                        <Line type="monotone" dataKey="engagement" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Quest Completion Radar Chart */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    <span>Quest Performance</span>
                  </CardTitle>
                  <CardDescription>Activity completion rates by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={[
                        { subject: 'Gratitude', A: 85, fullMark: 100 },
                        { subject: 'Kindness', A: 78, fullMark: 100 },
                        { subject: 'Courage', A: 92, fullMark: 100 },
                        { subject: 'Breathing', A: 88, fullMark: 100 },
                        { subject: 'Habits', A: 75, fullMark: 100 },
                        { subject: 'Mindfulness', A: 82, fullMark: 100 }
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar name="Completion Rate" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Help Requests Trend */}
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span>Support Requests</span>
                  </CardTitle>
                  <CardDescription>Help request patterns and resolution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { date: 'Week 1', requests: 12, resolved: 10 },
                        { date: 'Week 2', requests: 8, resolved: 8 },
                        { date: 'Week 3', requests: 15, resolved: 13 },
                        { date: 'Week 4', requests: 6, resolved: 6 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="requests" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="resolved" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
