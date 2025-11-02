'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  Activity, 
  Users, 
  Clock,
  Eye,
  MessageCircle,
  BookOpen,
  Heart,
  Target,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Zap,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface ActivityLog {
  id: string
  userId: string
  userName: string
  userRole: 'student' | 'teacher' | 'parent' | 'admin'
  grade?: string
  activityType: 'login' | 'quest_completion' | 'mood_log' | 'help_request' | 'message_sent' | 'resource_access' | 'assessment_taken'
  description: string
  timestamp: string
  metadata?: Record<string, any>
  riskLevel?: 'low' | 'medium' | 'high'
}

interface ActivitySummary {
  totalActivities: number
  activeUsers: number
  questsCompleted: number
  helpRequests: number
  messagesExchanged: number
  averageSessionTime: number
}

interface UserActivity {
  userId: string
  userName: string
  role: string
  grade?: string
  lastActive: string
  activitiesCount: number
  sessionTime: number
  riskIndicators: string[]
}

export default function ActivityMonitorPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [summary, setSummary] = useState<ActivitySummary | null>(null)
  const [userActivities, setUserActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('today')
  const [schoolId, setSchoolId] = useState<string | null>(null)
  
  // User activity pagination
  const [userSearch, setUserSearch] = useState('')
  const [userOffset, setUserOffset] = useState(0)
  const [userPagination, setUserPagination] = useState<{ total: number; hasMore: boolean } | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  // Fetch school ID from profile
  useEffect(() => {
    async function fetchSchoolId() {
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setSchoolId(data.school_id)
        }
      } catch (err) {
        console.error('Failed to fetch school ID:', err)
        setError('Failed to load profile')
      }
    }
    fetchSchoolId()
  }, [])

  // Fetch real activity data
  useEffect(() => {
    if (!schoolId) return

    async function fetchActivityData(append = false) {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        if (!schoolId) return
        
        const params = new URLSearchParams({
          school_id: schoolId,
          time_filter: timeFilter,
          role_filter: roleFilter,
          type_filter: typeFilter,
          user_search: userSearch,
          user_limit: '12',
          user_offset: append ? userOffset.toString() : '0'
        })

        const response = await fetch(`/api/admin/activity-monitor?${params}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch activity data')
        }

        const result = await response.json()
        
        console.log('Activity monitor API response:', result)
        
        if (result.success && result.data) {
          const activities = result.data.activities || []
          const summary = result.data.summary || null
          const newUserActivities = result.data.userActivities || []
          const pagination = result.data.userPagination
          
          console.log('Setting state:', {
            activitiesCount: activities.length,
            summary,
            userActivitiesCount: newUserActivities.length,
            pagination
          })
          
          setActivities(activities)
          setSummary(summary)
          
          if (append) {
            setUserActivities(prev => [...prev, ...newUserActivities])
          } else {
            setUserActivities(newUserActivities)
          }
          
          setUserPagination(pagination)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        console.error('Error fetching activity data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load activity data')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    }

    fetchActivityData()
  }, [schoolId, timeFilter, roleFilter, typeFilter, userSearch])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800'
      case 'teacher': return 'bg-green-100 text-green-800'
      case 'parent': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'login': return <Users className="w-4 h-4" />
      case 'quest_completion': return <Target className="w-4 h-4" />
      case 'mood_log': return <Heart className="w-4 h-4" />
      case 'help_request': return <AlertCircle className="w-4 h-4" />
      case 'message_sent': return <MessageCircle className="w-4 h-4" />
      case 'resource_access': return <BookOpen className="w-4 h-4" />
      case 'assessment_taken': return <CheckCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'login': return 'bg-gray-100 text-gray-800'
      case 'quest_completion': return 'bg-green-100 text-green-800'
      case 'mood_log': return 'bg-pink-100 text-pink-800'
      case 'help_request': return 'bg-red-100 text-red-800'
      case 'message_sent': return 'bg-blue-100 text-blue-800'
      case 'resource_access': return 'bg-purple-100 text-purple-800'
      case 'assessment_taken': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return ''
    }
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || activity.userRole === roleFilter
    const matchesType = typeFilter === 'all' || activity.activityType === typeFilter
    return matchesSearch && matchesRole && matchesType
  })

  // Refresh handler
  const handleRefresh = () => {
    if (schoolId) {
      setLoading(true)
      setUserOffset(0)
      setTimeFilter(prev => prev)
    }
  }
  
  // Load more users
  const handleLoadMore = () => {
    if (!userPagination?.hasMore || loadingMore) return
    
    const newOffset = userOffset + 12
    setUserOffset(newOffset)
    
    // Trigger fetch with append=true
    if (schoolId) {
      const params = new URLSearchParams({
        school_id: schoolId,
        time_filter: timeFilter,
        role_filter: roleFilter,
        type_filter: typeFilter,
        user_search: userSearch,
        user_limit: '12',
        user_offset: newOffset.toString()
      })
      
      setLoadingMore(true)
      fetch(`/api/admin/activity-monitor?${params}`)
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data) {
            setUserActivities(prev => [...prev, ...(result.data.userActivities || [])])
            setUserPagination(result.data.userPagination)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingMore(false))
    }
  }
  
  // Handle user search change
  const handleUserSearchChange = (value: string) => {
    setUserSearch(value)
    setUserOffset(0) // Reset pagination when searching
  }

  if (loading && !activities.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error && !activities.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
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
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Activity Monitor
                </h1>
                <p className="text-gray-600 mt-1">Real-time platform activity and user engagement tracking</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-3">
              <ClientWrapper>
                <Button 
                  variant="outline" 
                  className="bg-white/50 backdrop-blur-sm hover:bg-white/80"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white/80">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </ClientWrapper>
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
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyan-100 text-sm font-medium">Total Activities</p>
                      <p className="text-3xl font-bold">{summary.totalActivities}</p>
                    </div>
                    <Activity className="w-8 h-8 text-cyan-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Active Users</p>
                      <p className="text-3xl font-bold">{summary.activeUsers}</p>
                    </div>
                    <Users className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Quests Done</p>
                      <p className="text-3xl font-bold">{summary.questsCompleted}</p>
                    </div>
                    <Target className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium">Help Requests</p>
                      <p className="text-3xl font-bold">{summary.helpRequests}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Messages</p>
                      <p className="text-3xl font-bold">{summary.messagesExchanged}</p>
                    </div>
                    <MessageCircle className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Avg Session</p>
                      <p className="text-3xl font-bold">{summary.averageSessionTime}m</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm shadow-lg rounded-xl p-1">
            <TabsTrigger value="live">Live Activity</TabsTrigger>
            <TabsTrigger value="users">User Activity</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            {/* Filters */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search activities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="parent">Parents</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="quest_completion">Quest Completion</SelectItem>
                      <SelectItem value="mood_log">Mood Log</SelectItem>
                      <SelectItem value="help_request">Help Request</SelectItem>
                      <SelectItem value="message_sent">Message Sent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="Time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <div className="space-y-4">
              {filteredActivities.length === 0 ? (
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activities Found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || roleFilter !== 'all' || typeFilter !== 'all'
                        ? 'Try adjusting your filters to see more activities.'
                        : 'No recent activities in the selected time period.'}
                    </p>
                    <div className="text-sm text-gray-500">
                      <p>Time: {timeFilter} | Total users: {summary?.activeUsers || 0}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : filteredActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`bg-white/70 backdrop-blur-sm border-0 shadow-xl ${
                    activity.riskLevel ? 'border-l-4 border-l-red-500' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${getActivityTypeColor(activity.activityType)}`}>
                            {getActivityTypeIcon(activity.activityType)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{activity.userName}</h3>
                              <Badge className={getRoleColor(activity.userRole)}>
                                {activity.userRole}
                              </Badge>
                              {activity.grade && (
                                <Badge variant="outline" className="text-xs">
                                  Grade {activity.grade}
                                </Badge>
                              )}
                              {activity.riskLevel && (
                                <Badge variant="outline" className={getRiskLevelColor(activity.riskLevel)}>
                                  {activity.riskLevel} risk
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-700">{activity.description}</p>
                            {activity.metadata && (
                              <div className="mt-2 text-xs text-gray-600">
                                {Object.entries(activity.metadata).map(([key, value]: [string, any]) => (
                                  <span key={key} className="mr-3">
                                    {key}: {String(value)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* User Search */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users by name, role, or grade..."
                      value={userSearch}
                      onChange={(e) => handleUserSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {userPagination && (
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      Showing {userActivities.length} of {userPagination.total} users
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {userActivities.length === 0 ? (
                <Card className="col-span-full bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No User Activity</h3>
                    <p className="text-gray-600">No user activity recorded in the selected time period.</p>
                  </CardContent>
                </Card>
              ) : userActivities.map((user, index) => (
                <motion.div
                  key={user.userId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{user.userName}</CardTitle>
                          <CardDescription>
                            {user.role} {user.grade && `• Grade ${user.grade}`}
                          </CardDescription>
                        </div>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Last Active:</span>
                          <span className="font-medium">
                            {new Date(user.lastActive).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Activities:</span>
                          <span className="font-medium">{user.activitiesCount}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Session Time:</span>
                          <span className="font-medium">{user.sessionTime}m</span>
                        </div>
                        
                        {user.riskIndicators.length > 0 && (
                          <div className="pt-3 border-t">
                            <p className="text-xs text-red-600 font-medium mb-2">Risk Indicators:</p>
                            <div className="space-y-1">
                              {user.riskIndicators.map((indicator, i) => (
                                <Badge key={i} variant="outline" className="bg-red-50 text-red-700 text-xs">
                                  {indicator}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            {/* Load More Button */}
            {userPagination && userPagination.hasMore && (
              <div className="flex justify-center mt-6">
                <ClientWrapper>
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3"
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Load More Users ({userPagination.total - userActivities.length} remaining)
                      </>
                    )}
                  </Button>
                </ClientWrapper>
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Activity Insights & Analytics</CardTitle>
                <CardDescription>Advanced analytics and behavioral insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                  <p className="text-gray-600 mb-6">Detailed behavioral analytics and predictive insights coming soon.</p>
                  <ClientWrapper>
                    <Button className="bg-cyan-600 hover:bg-cyan-700">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Enable Advanced Analytics
                    </Button>
                  </ClientWrapper>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
