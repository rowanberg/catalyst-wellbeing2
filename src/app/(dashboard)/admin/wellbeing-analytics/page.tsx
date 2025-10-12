'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
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
  Monitor,
  School,
  Smile
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
  const [studentSearch, setStudentSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Debounce search input for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(studentSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [studentSearch])

  // Fetch real analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setRefreshing(true)
      setLoading(true)
      setError(null)
      setLastUpdated(null)
      const response = await fetch(`/api/admin/wellbeing-analytics?timeRange=${timeRange}&grade=${selectedGrade}`)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('API Error:', response.status, errorData)
        throw new Error(`Failed to fetch analytics data: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      setAnalytics(data.analytics)
      setError(null)
      
      // Fetch AI insights after analytics data is loaded
      fetchAIInsights(data.analytics)
    } catch (err: any) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLastUpdated(new Date())
    }
  }, [timeRange, selectedGrade])

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange, selectedGrade])

  // Memoized filtered students for better performance (must be before conditional returns)
  const filteredStudents = useMemo(() => {
    if (!analytics?.studentInsights) return []
    return analytics.studentInsights.filter((student: any) => {
      const matchesSearch = student.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesRisk = riskFilter === 'all' || student.riskLevel === riskFilter
      return matchesSearch && matchesRisk
    })
  }, [analytics?.studentInsights, debouncedSearch, riskFilter])

  // Fetch AI insights (must be before conditional returns)
  const fetchAIInsights = async (analyticsData: any) => {
    if (!analyticsData) {
      console.log('No analytics data available for AI insights')
      return
    }
    
    try {
      setAiLoading(true)
      console.log('Fetching AI insights...')
      
      const response = await fetch('/api/admin/wellbeing-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analytics: analyticsData })
      })
      
      console.log('AI insights response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('AI insights received:', data)
        
        if (data.insights) {
          setAiInsights(data.insights)
        } else if (data.fallback) {
          console.log('Using fallback insights')
          setAiInsights(data.insights)
        } else {
          console.error('No insights in response:', data)
        }
      } else {
        const errorText = await response.text()
        console.error('AI insights API error:', response.status, errorText)
      }
    } catch (err) {
      console.error('Failed to fetch AI insights:', err)
    } finally {
      setAiLoading(false)
    }
  }

  // Handle refresh with feedback (must be before conditional returns)
  const handleRefresh = useCallback(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Error handling
  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800">Failed to Load Analytics</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => fetchAnalytics()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

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

  // Skeleton loader component
  const SkeletonCard = () => (
    <Card className="bg-white/80 backdrop-blur border shadow-md">
      <CardContent className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </CardContent>
    </Card>
  )

  // Show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white border border-red-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Analytics</h3>
            <p className="text-sm text-gray-600 mb-6">We couldn't load the analytics data. Please try again.</p>
            <Button 
              onClick={fetchAnalytics}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 640px) {
          .snap-x {
            scroll-snap-type: x mandatory;
          }
          .snap-center {
            scroll-snap-align: center;
          }
        }
      `}</style>
    <div className="min-h-screen bg-gray-50">
      {/* Loading Progress Bar */}
      {(loading || refreshing) && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
          <div className="h-full bg-blue-600 animate-pulse" style={{ width: loading ? '70%' : '100%', transition: 'width 0.3s' }}></div>
        </div>
      )}
      
      {/* Enhanced Header - Mobile Optimized */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 border-b border-gray-200 shadow-sm">
        <div className="px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 sm:space-x-4"
            >
              <motion.div 
                className="p-2 sm:p-3 bg-blue-600 rounded-lg shadow-sm"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Heart className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <motion.h1 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg sm:text-3xl font-semibold text-gray-900 truncate"
                >
                  Wellbeing Analytics
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 hidden sm:block"
                >
                  Student mental health and engagement insights
                </motion.p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] text-gray-500 sm:hidden truncate">Student insights</p>
                  {lastUpdated && (
                    <p className="hidden sm:block text-xs text-gray-500">
                      Last updated: {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-24 sm:w-40 bg-white border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[10px] sm:text-sm transition-all">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-600" />
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
                  className="bg-white border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[10px] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all px-2 sm:px-4 relative"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  aria-label="Refresh analytics data"
                  title="Refresh analytics data"
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''} sm:mr-2 text-gray-600`} />
                  <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                  {refreshing && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  )}
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
                    className="bg-white border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-all text-[10px] sm:text-sm px-2 sm:px-4"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2 text-gray-600" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-2 sm:p-6">
        {/* Mobile: Horizontal Scroll Metrics */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center space-x-2 mb-3 px-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">Key Metrics</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 px-2 snap-x snap-mandatory scrollbar-hide">
            {loading && !analytics ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex-shrink-0 w-40 snap-center">
                  <Card className="bg-white/80 backdrop-blur border shadow-md h-32">
                    <CardContent className="p-3">
                      <div className="animate-pulse space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : (
              analytics?.metrics?.map((metric: any) => (
                <div key={metric.id} className="flex-shrink-0 w-36 snap-center">
                  <Card className="bg-white border border-gray-200 shadow-sm h-28 active:scale-98 transition-transform">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-semibold text-gray-900">
                          {typeof metric.value === 'number' && metric.value < 10 ? metric.value.toFixed(1) : metric.value}
                          {metric.category === 'engagement' && <span className="text-sm">%</span>}
                        </div>
                        <div className={`text-[10px] font-medium ${
                          metric.trend === 'up' ? 'text-green-600' :
                          metric.trend === 'down' ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '−'}
                          {Math.abs(((metric.value - metric.previousValue) / metric.previousValue) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-[10px] font-medium text-gray-600 line-clamp-1">
                        {metric.name}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Desktop: Sidebar + Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar with Stats (Desktop Only) */}
          <motion.div
            className="hidden lg:block lg:w-80 xl:w-96 shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-gray-200">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">Key Metrics</h2>
              </div>
              
              {/* Stats Cards */}
              <div className="space-y-3">
                {loading && !analytics ? (
                  // Show skeleton loaders in sidebar while loading
                  Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx}>
                      <SkeletonCard />
                    </div>
                  ))
                ) : (
                  analytics?.metrics?.map((metric: any, index: number) => (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-3xl font-semibold text-gray-900">
                            {typeof metric.value === 'number' && metric.value < 10 ? metric.value.toFixed(1) : metric.value}
                            {metric.category === 'engagement' && <span className="text-lg text-gray-600">%</span>}
                          </div>
                          <div className={`text-xs font-medium ${
                            metric.trend === 'up' ? 'text-green-600' :
                            metric.trend === 'down' ? 'text-red-600' :
                            'text-gray-500'
                          }`}>
                            {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '−'}
                            {Math.abs(((metric.value - metric.previousValue) / metric.previousValue) * 100).toFixed(0)}%
                          </div>
                        </div>
                        
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {metric.name}
                        </div>
                        
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {metric.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                  ))
                )}
              </div>

              {/* Quick Summary Card */}
              {!loading && analytics && (
              <Card className="bg-blue-50 border border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Quick Summary</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Total Students:</span>
                      <span className="font-semibold text-gray-900">{analytics?.totalStudents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Classes:</span>
                      <span className="font-semibold text-gray-900">{analytics?.classAnalytics?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">At Risk:</span>
                      <span className="font-semibold text-red-600">{analytics?.studentInsights?.filter((s: any) => s.riskLevel === 'high').length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Time Range:</span>
                      <span className="font-semibold text-gray-900">{timeRange}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}
            </div>
          </motion.div>

          {/* Main Content Area with Tabs */}
          <motion.div
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
          <Tabs defaultValue="overview" className="space-y-3 sm:space-y-4">
            {/* Compact Sticky Tabs */}
            <div className="sticky top-[52px] sm:top-24 z-30 bg-white border-b border-gray-200 shadow-sm -mx-2 sm:mx-0 px-2 sm:px-0 py-1.5 sm:py-2">
              <TabsList className="grid w-full grid-cols-4 bg-gray-50 border-0 shadow-none rounded-md p-0.5">
                <TabsTrigger 
                  value="overview" 
                  className="text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 transition-all rounded py-1.5 sm:py-2"
                >
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">📊</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="classes" 
                  className="text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 transition-all rounded py-1.5 sm:py-2"
                >
                  <span className="hidden sm:inline">Classes</span>
                  <span className="sm:hidden">🏫</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="students" 
                  className="text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 transition-all rounded py-1.5 sm:py-2"
                >
                  <span className="hidden sm:inline">Students</span>
                  <span className="sm:hidden">👥</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="trends" 
                  className="text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 transition-all rounded py-1.5 sm:py-2"
                >
                  <span className="hidden sm:inline">Trends</span>
                  <span className="sm:hidden">📈</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-3 sm:space-y-4">
              {/* AI-Generated Overview */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900">AI Insights</CardTitle>
                        <CardDescription className="text-xs text-gray-600">Powered by Gemini AI</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      <span>Live Analysis</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-blue-100 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : aiInsights ? (
                    <>
                      {/* Summary */}
                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <p className="text-sm text-gray-700 leading-relaxed">{aiInsights.summary}</p>
                      </div>

                      {/* Positive Highlight */}
                      {aiInsights.positiveHighlight && (
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-green-900 mb-1">Positive Highlight</p>
                              <p className="text-sm text-green-800">{aiInsights.positiveHighlight}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Key Insights Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Strengths */}
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            Key Strengths
                          </h4>
                          <ul className="space-y-1.5">
                            {aiInsights.keyStrengths?.map((strength: string, i: number) => (
                              <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">•</span>
                                <span className="flex-1">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Areas of Concern */}
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            Areas of Concern
                          </h4>
                          <ul className="space-y-1.5">
                            {aiInsights.areasOfConcern?.map((concern: string, i: number) => (
                              <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                <span className="text-orange-600 mt-0.5">•</span>
                                <span className="flex-1">{concern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <h4 className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1">
                          <Target className="w-4 h-4 text-blue-600" />
                          Recommended Actions
                        </h4>
                        <ul className="space-y-1.5">
                          {aiInsights.recommendations?.map((rec: string, i: number) => (
                            <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                              <span className="text-blue-600 font-bold mt-0.5">{i + 1}.</span>
                              <span className="flex-1">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">AI insights unavailable</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Compact 2x2 Stats Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 4 }).map((_, idx) => (
                    <Card key={idx} className="bg-white border border-gray-200 shadow-sm">
                      <CardContent className="p-3">
                        <div className="animate-pulse">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                          <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
                          <div className="h-2 bg-gray-200 rounded w-20"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <>
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow group" title="Students with wellbeing scores of 8-10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 bg-green-100 rounded flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase">Thriving</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{analytics?.wellbeingDistribution?.thriving || 68}%</p>
                    <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5">Score 8-10</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow group" title="Students with wellbeing scores of 5-7">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 bg-yellow-100 rounded flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                        <Minus className="w-4 h-4 text-yellow-600" />
                      </div>
                      <p className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase">Moderate</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{analytics?.wellbeingDistribution?.moderate || 25}%</p>
                    <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5">Score 5-7</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow group" title="Students with wellbeing scores of 1-4 (needs attention)">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 bg-red-100 rounded flex items-center justify-center group-hover:bg-red-200 transition-colors">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <p className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase">At Risk</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{analytics?.wellbeingDistribution?.atRisk || 7}%</p>
                    <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5">Score 1-4</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow group" title="Total active students in the system">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 bg-blue-100 rounded flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase">Active</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{analytics?.totalStudents || 0}</p>
                    <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5">Students</p>
                  </CardContent>
                </Card>
                  </>
                )}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Wellbeing Trend Chart */}
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">Wellbeing Trend</CardTitle>
                    <CardDescription className="text-sm text-gray-600">7-day average scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="h-64 animate-pulse">
                        <div className="h-full bg-gray-100 rounded"></div>
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics?.trendData || []}>
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#d1d5db" />
                            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#d1d5db" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e5e7eb', 
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="score" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              fill="url(#colorScore)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Key Metrics */}
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">Key Metrics</CardTitle>
                    <CardDescription className="text-sm text-gray-600">Weekly performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loading ? (
                      // Loading skeletons for metrics
                      Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                      ))
                    ) : (
                      <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Heart className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Mood Scores</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-600">+5.2%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Quest Completion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-600">+3.4%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Help Requests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-600">-33.3%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Activity className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Engagement Rate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{Math.round(analytics?.metrics?.find((m: any) => m.category === 'engagement')?.value || 0)}%</span>
                      </div>
                    </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
          </TabsContent>

          <TabsContent value="classes" className="space-y-3 sm:space-y-4">
            {analytics?.classAnalytics?.length === 0 ? (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Found</h3>
                  <p className="text-sm text-gray-600 mb-4">No class data available for the selected filters.</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefresh}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {analytics?.classAnalytics?.map((classData: any, index: number) => (
                  <motion.div
                    key={classData.className}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-white/80 backdrop-blur border shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <School className="w-4 h-4 text-blue-600" />
                              </div>
                              <span>Class {classData.className}</span>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              Grade {classData.grade} • {classData.totalStudents} students
                            </CardDescription>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getRiskLevelColor(classData.riskLevel)} text-xs`}
                          >
                            {classData.riskLevel}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Wellbeing Score */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">Wellbeing Score</span>
                            </div>
                            <span className="text-2xl font-bold text-blue-600">
                              {classData.wellbeingScore}/10
                            </span>
                          </div>
                          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(classData.wellbeingScore / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-green-50 rounded-lg p-2 text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Smile className="w-3 h-3 text-green-600" />
                              <span className="text-[10px] text-gray-600 font-medium">Mood</span>
                            </div>
                            <div className="text-lg font-bold text-green-700">
                              {Math.round(classData.trends?.mood || 0)}%
                            </div>
                          </div>
                          
                          <div className="bg-purple-50 rounded-lg p-2 text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Zap className="w-3 h-3 text-purple-600" />
                              <span className="text-[10px] text-gray-600 font-medium">Engage</span>
                            </div>
                            <div className="text-lg font-bold text-purple-700">
                              {Math.round(classData.trends?.engagement || 0)}%
                            </div>
                          </div>
                          
                          <div className="bg-orange-50 rounded-lg p-2 text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <AlertTriangle className="w-3 h-3 text-orange-600" />
                              <span className="text-[10px] text-gray-600 font-medium">Alerts</span>
                            </div>
                            <div className="text-lg font-bold text-orange-700">
                              {classData.trends?.helpRequests || 0}
                            </div>
                          </div>
                        </div>

                        {/* Student List Summary */}
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>Students enrolled</span>
                            </div>
                            <span className="font-semibold">{classData.totalStudents}</span>
                          </div>
                          
                          {classData.students?.length > 0 && (
                            <div className="mt-2 flex -space-x-2">
                              {classData.students.slice(0, 5).map((student: any, idx: number) => (
                                <div 
                                  key={idx}
                                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                                  title={student.first_name}
                                >
                                  {student.first_name?.[0] || '?'}{student.last_name?.[0] || ''}
                                </div>
                              ))}
                              {classData.students.length > 5 && (
                                <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-bold">
                                  +{classData.students.length - 5}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-3 sm:space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    aria-label="Search students by name"
                  />
                  {studentSearch && (
                    <button
                      onClick={() => setStudentSearch('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear search"
                    >
                      <span className="text-lg">&times;</span>
                    </button>
                  )}
                </div>
              </div>
              <Select value={riskFilter} onValueChange={(value: any) => setRiskFilter(value)}>
                <SelectTrigger className="w-32 text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Count */}
            {!loading && filteredStudents.length > 0 && (
              <div className="text-xs sm:text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-3">
                <p className="text-xs sm:text-sm text-gray-600">
                  Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                </p>
                {(studentSearch || riskFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setStudentSearch('')
                      setRiskFilter('all')
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
                {debouncedSearch && <span className="hidden sm:inline"> matching "{debouncedSearch}"</span>}
              </div>
            )}

            {/* Student Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
              {loading ? (
                // Show skeleton loaders while loading
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx}>
                    <SkeletonCard />
                  </div>
                ))
              ) : filteredStudents.length === 0 ? (
                <div className="col-span-full">
                  <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="p-12 text-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Try adjusting your filters.'}
                      </p>
                      {(studentSearch || riskFilter !== 'all') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setStudentSearch('')
                            setRiskFilter('all')
                          }}
                          className="border-gray-300 hover:bg-gray-50"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredStudents.map((student: any, index: number) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all overflow-hidden group">
                    {/* Header with Color Bar */}
                    <div className={`h-1 transition-all group-hover:h-1.5 ${
                      student.riskLevel === 'high' ? 'bg-red-500' :
                      student.riskLevel === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                              {student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <span className="truncate">{student.name}</span>
                          </CardTitle>
                          <CardDescription className="mt-2 flex items-center gap-2 text-xs">
                            <span className="flex items-center gap-1">
                              <School className="w-3 h-3" />
                              {student.class}
                            </span>
                            <span>•</span>
                            <span>{student.grade}</span>
                          </CardDescription>
                        </div>
                        <Badge 
                          className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                            student.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                            student.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}
                        >
                          {student.riskLevel}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Activity Radar Chart */}
                      <div className="h-48 -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={[
                            { activity: 'Gratitude', value: student.activities?.gratitude || 0, fullMark: 100 },
                            { activity: 'Kindness', value: student.activities?.kindness || 0, fullMark: 100 },
                            { activity: 'Breathing', value: student.activities?.breathing || 0, fullMark: 100 },
                            { activity: 'Courage', value: student.activities?.courage || 0, fullMark: 100 },
                            { activity: 'Sleep', value: student.activities?.sleep || 0, fullMark: 100 },
                            { activity: 'Hydration', value: student.activities?.hydration || 0, fullMark: 100 }
                          ]}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="activity" tick={{ fontSize: 10 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                            <Radar name="Score" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.5} />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-center hover:bg-gray-100 transition-colors cursor-default" title="Gratitude journal completion rate">
                          <div className="text-[10px] text-gray-600 font-medium">Gratitude</div>
                          <div className="text-base font-semibold text-gray-900">{student.activities?.gratitude || 0}%</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-center hover:bg-gray-100 transition-colors cursor-default" title="Kindness activities completed">
                          <div className="text-[10px] text-gray-600 font-medium">Kindness</div>
                          <div className="text-base font-semibold text-gray-900">{student.activities?.kindness || 0}%</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-center hover:bg-gray-100 transition-colors cursor-default" title="Sleep tracking consistency">
                          <div className="text-[10px] text-gray-600 font-medium">Sleep</div>
                          <div className="text-base font-semibold text-gray-900">{student.activities?.sleep || 0}%</div>
                        </div>
                      </div>

                      {/* Concerns */}
                      {student.concerns && student.concerns.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Concerns</span>
                          </div>
                          <div className="space-y-1">
                            {student.concerns.slice(0, 2).map((concern: string, idx: number) => (
                              <div key={idx} className="text-xs text-gray-600 pl-5 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span className="flex-1">{concern}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strengths */}
                      {student.strengths && student.strengths.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                            <TrendingUp className="w-3 h-3" />
                            <span>Strengths</span>
                          </div>
                          <div className="space-y-1">
                            {student.strengths.slice(0, 2).map((strength: string, idx: number) => (
                              <div key={idx} className="text-xs text-gray-600 pl-5 flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span className="flex-1">{strength}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Last Activity */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <Activity className="w-3 h-3" />
                          {student.lastActivity}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {/* Trend Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    {analytics?.trends?.wellbeingChange && (
                      <div className={`flex items-center gap-1 text-xs font-semibold ${
                        analytics.trends.wellbeingChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analytics.trends.wellbeingChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(analytics.trends.wellbeingChange).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-semibold text-gray-900 mb-1">
                    {analytics?.averageWellbeingScore ? analytics.averageWellbeingScore.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-gray-600">Avg Wellbeing Score</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    {analytics?.trends?.engagementChange && (
                      <div className={`flex items-center gap-1 text-xs font-semibold ${
                        analytics.trends.engagementChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analytics.trends.engagementChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(analytics.trends.engagementChange).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-semibold text-gray-900 mb-1">
                    {analytics?.metrics?.find((m: any) => m.category === 'engagement')?.value 
                      ? Math.round(analytics.metrics.find((m: any) => m.category === 'engagement').value) 
                      : '—'}%
                  </p>
                  <p className="text-xs text-gray-600">Engagement Rate</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    {analytics?.trends?.questChange && (
                      <div className={`flex items-center gap-1 text-xs font-semibold ${
                        analytics.trends.questChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analytics.trends.questChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(analytics.trends.questChange).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-semibold text-gray-900 mb-1">
                    {analytics?.questCompletionRate ? Math.round(analytics.questCompletionRate) : '—'}%
                  </p>
                  <p className="text-xs text-gray-600">Quest Completion</p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    {analytics?.trends?.helpRequestsChange && (
                      <div className={`flex items-center gap-1 text-xs font-semibold ${
                        analytics.trends.helpRequestsChange < 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analytics.trends.helpRequestsChange < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {Math.abs(analytics.trends.helpRequestsChange).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-semibold text-gray-900 mb-1">
                    {analytics?.helpRequests?.total || 0}
                  </p>
                  <p className="text-xs text-gray-600">Help Requests</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Wellbeing Trend Over Time */}
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900">Wellbeing Trends</CardTitle>
                      <CardDescription className="text-sm text-gray-600">Score progression over time</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-xs text-gray-600">Score</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <span className="text-xs text-gray-600">Engagement</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-64 animate-pulse bg-gray-100 rounded"></div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics?.trendData || []}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#d1d5db" />
                          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#d1d5db" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                          <Line type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#10b981', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mood Distribution */}
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">Mood Distribution</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Current student wellbeing levels</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-64 animate-pulse bg-gray-100 rounded"></div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Thriving', value: analytics?.wellbeingDistribution?.thriving || 68, fill: '#10b981' },
                              { name: 'Moderate', value: analytics?.wellbeingDistribution?.moderate || 25, fill: '#f59e0b' },
                              { name: 'At Risk', value: analytics?.wellbeingDistribution?.atRisk || 7, fill: '#ef4444' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            dataKey="value"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Completion */}
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">Activity Performance</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Completion rates by category</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-64 animate-pulse bg-gray-100 rounded"></div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={analytics?.activityBreakdown || [
                          { subject: 'Gratitude', A: 0, fullMark: 100 },
                          { subject: 'Kindness', A: 0, fullMark: 100 },
                          { subject: 'Courage', A: 0, fullMark: 100 },
                          { subject: 'Breathing', A: 0, fullMark: 100 },
                          { subject: 'Habits', A: 0, fullMark: 100 },
                          { subject: 'Mindfulness', A: 0, fullMark: 100 }
                        ]}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <Radar name="Completion" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Support Requests */}
              <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">Support Requests</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Help requests and resolution rates</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-64 animate-pulse bg-gray-100 rounded"></div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics?.helpRequests?.timeline || []}>
                          <defs>
                            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#d1d5db" />
                          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#d1d5db" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Area type="monotone" dataKey="requests" stroke="#ef4444" strokeWidth={2} fill="url(#colorRequests)" />
                          <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fill="url(#colorResolved)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
    </>
  )
}
