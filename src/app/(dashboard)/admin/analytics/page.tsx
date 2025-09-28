'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { handleError } from '@/lib/utils/errorHandling'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Heart, 
  Award,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  wellbeingTrend: number[]
  engagementMetrics: {
    gratitudeEntries: number
    kindnessActs: number
    courageEntries: number
    helpRequests: number
  }
  weeklyActivity: {
    week: string
    students: number
    teachers: number
    parents: number
  }[]
  topPerformers: {
    name: string
    xp: number
    streak: number
  }[]
}

function AnalyticsContent() {
  const { profile } = useAppSelector((state) => state.auth)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week')
  const { addToast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchAnalytics()
    }
  }, [profile, timeRange])

  const fetchAnalytics = async () => {
    if (!profile) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          schoolId: profile.school_id,
          timeRange 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      const appError = handleError(error, 'analytics fetch')
      addToast({
        type: 'error',
        title: 'Failed to Load Analytics',
        description: appError.message
      })
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          schoolId: profile?.school_id,
          timeRange 
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `school-analytics-${timeRange}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        
        addToast({
          type: 'success',
          title: 'Export Complete',
          description: 'Analytics data has been downloaded'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        description: 'Could not export analytics data'
      })
    }
  }

  if (loading) {
    return <PageLoader text="Loading analytics..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
                <p className="text-sm text-gray-600">School performance insights and data</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ClientWrapper>
                <Button variant="outline" onClick={() => fetchAnalytics()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={exportData} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </ClientWrapper>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Range Filter */}
        <div className="mb-8 flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          <div className="flex space-x-2">
            <ClientWrapper>
              {['week', 'month', 'quarter', 'year'].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={timeRange === range ? 'bg-blue-600 text-white' : ''}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Button>
              ))}
            </ClientWrapper>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData?.totalUsers || 0}</p>
                  <p className="text-sm text-green-600 mt-1">↗ All roles</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData?.activeUsers || 0}</p>
                  <p className="text-sm text-green-600 mt-1">↗ This period</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Wellbeing Activities</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {(analyticsData?.engagementMetrics.gratitudeEntries || 0) + 
                     (analyticsData?.engagementMetrics.kindnessActs || 0) + 
                     (analyticsData?.engagementMetrics.courageEntries || 0)}
                  </p>
                  <p className="text-sm text-purple-600 mt-1">↗ Total entries</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Help Requests</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData?.engagementMetrics.helpRequests || 0}</p>
                  <p className="text-sm text-orange-600 mt-1">↗ Pending</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Wellbeing Activities Breakdown</CardTitle>
              <CardDescription className="text-gray-600">Activity distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Gratitude Entries</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">
                    {analyticsData?.engagementMetrics.gratitudeEntries || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Acts of Kindness</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">
                    {analyticsData?.engagementMetrics.kindnessActs || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Courage Entries</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">
                    {analyticsData?.engagementMetrics.courageEntries || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Top Performers</CardTitle>
              <CardDescription className="text-gray-600">Students with highest engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.topPerformers?.slice(0, 5).map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-yellow-600">#{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-900">{performer.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{performer.xp} XP</div>
                      <div className="text-xs text-gray-500">{performer.streak} day streak</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No performance data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Activity Chart */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Activity Trends</CardTitle>
            <CardDescription className="text-gray-600">User activity over time by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Activity Chart</p>
                <p className="text-sm">Interactive charts will be implemented with Chart.js</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <ClientWrapper>
      <AuthGuard requiredRole="admin">
        <AnalyticsContent />
      </AuthGuard>
    </ClientWrapper>
  )
}
