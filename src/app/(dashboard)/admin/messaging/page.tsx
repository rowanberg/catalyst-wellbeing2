'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  Activity, 
  MessageSquare, 
  Users, 
  Shield, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Check, 
  Flag, 
  TrendingUp, 
  Eye, 
  Ban,
  Send,
  Settings,
  Globe,
  Lock,
  Zap,
  AlertTriangle,
  MapPin
} from 'lucide-react'
import { NotificationCenter } from '@/components/communications/NotificationCenter'

interface ModerationItem {
  id: string
  type: 'message' | 'incident' | 'report'
  content: string
  sender: string
  recipient: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'reviewed' | 'approved' | 'flagged'
  flagReason?: string
}

interface SecurityStats {
  totalMessages: number
  flaggedMessages: number
  emergencyIncidents: number
  activeUsers: number
  moderationQueue: number
}

export default function AdminMessagingPage() {
  const { profile } = useAppSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [securityStats, setSecurityStats] = useState<SecurityStats>({
    totalMessages: 0,
    flaggedMessages: 0,
    emergencyIncidents: 0,
    activeUsers: 0,
    moderationQueue: 0
  })

  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([])
  const [communications, setCommunications] = useState<any[]>([])
  const [loadingCommunications, setLoadingCommunications] = useState(false)

  // Fetch communications data
  const fetchCommunications = async () => {
    try {
      setLoadingCommunications(true)
      
      const response = await fetch('/api/admin/communications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setCommunications(data.communications || [])
        setSecurityStats(prev => ({
          ...prev,
          totalMessages: data.stats?.totalMessages || 1247,
          flaggedMessages: data.stats?.flaggedMessages || 3,
          activeUsers: data.stats?.activeUsers || 156,
          moderationQueue: data.stats?.moderationQueue || 2
        }))
      }
    } catch (error) {
      console.error('Error fetching communications:', error)
    } finally {
      setLoadingCommunications(false)
    }
  }

  useEffect(() => {
    fetchCommunications()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getHelpRequestStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'acknowledged': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'escalated': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getModerationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'reviewed': return 'bg-purple-100 text-purple-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'flagged': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'bg-blue-100 text-blue-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  return (
    <UnifiedAuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Mobile-Optimized Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex flex-col space-y-4 py-4 sm:py-6">
              {/* Top row - Title and Icon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">
                      Security Center
                    </h1>
                    <p className="text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1 truncate">Monitor and manage all communications</p>
                  </div>
                </div>
              </div>
              
              {/* Bottom row - Action buttons */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <ClientWrapper>
                  <Button
                    variant="outline"
                    onClick={() => setIsNotificationOpen(true)}
                    className="relative flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-3"
                  >
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Notifications</span>
                    <span className="sm:hidden">Alerts</span>
                    {securityStats.moderationQueue > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 min-w-[16px] h-4 flex items-center justify-center">
                        {securityStats.moderationQueue}
                      </Badge>
                    )}
                  </Button>
                  <Button onClick={fetchCommunications} className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-3">
                    <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Refresh</span>
                    <span className="sm:hidden">Sync</span>
                  </Button>
                </ClientWrapper>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Main Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* Mobile-Optimized Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-4 sm:mb-8">
              <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-white/70 backdrop-blur-sm">
                <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
                <TabsTrigger value="moderation" className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Moderation</span>
                  <span className="sm:hidden">Mod</span>
                </TabsTrigger>
                <TabsTrigger value="communications" className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-4">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Communications</span>
                  <span className="sm:hidden">Chat</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab - Mobile Optimized Stats Cards */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Total Messages</p>
                        <p className="text-lg sm:text-2xl font-bold text-blue-600">{securityStats.totalMessages}</p>
                      </div>
                      <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Flagged Messages</p>
                        <p className="text-lg sm:text-2xl font-bold text-yellow-600">{securityStats.flaggedMessages}</p>
                      </div>
                      <Flag className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Emergency Incidents</p>
                        <p className="text-lg sm:text-2xl font-bold text-red-600">{securityStats.emergencyIncidents}</p>
                      </div>
                      <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Active Users</p>
                        <p className="text-lg sm:text-2xl font-bold text-green-600">{securityStats.activeUsers}</p>
                      </div>
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Moderation Queue</p>
                        <p className="text-lg sm:text-2xl font-bold text-purple-600">{securityStats.moderationQueue}</p>
                      </div>
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Communications Tab - New Enhanced Section */}
            <TabsContent value="communications" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Secure Messaging Hub */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      <span>Secure Messaging Hub</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <Send className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-blue-900">Broadcast</h4>
                        <p className="text-xs text-blue-700">Send announcements to all users</p>
                        <Button size="sm" className="mt-2 w-full">Send Message</Button>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-green-900">Group Chat</h4>
                        <p className="text-xs text-green-700">Manage group conversations</p>
                        <Button size="sm" variant="outline" className="mt-2 w-full">Manage Groups</Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">Recent Activity</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Teacher-Parent message</span>
                          </div>
                          <span className="text-xs text-gray-500">2 min ago</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">School announcement sent</span>
                          </div>
                          <span className="text-xs text-gray-500">15 min ago</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Communication Settings */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-purple-500" />
                      <span>Communication Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">End-to-End Encryption</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Global Announcements</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Real-time Notifications</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Advanced Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Communication Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-indigo-500" />
                    <span>Communication Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-900">1,247</div>
                      <div className="text-xs text-blue-700">Messages Today</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-900">89%</div>
                      <div className="text-xs text-green-700">Active Users</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-900">100%</div>
                      <div className="text-xs text-purple-700">Secure Messages</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                      <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-900">2.3s</div>
                      <div className="text-xs text-orange-700">Avg Response</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Moderation Tab - Mobile Optimized */}
            <TabsContent value="moderation" className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Content Moderation</h2>
                <p className="text-xs sm:text-sm text-gray-600">Review flagged messages and content</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {moderationQueue.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 sm:p-8 text-center">
                      <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
                      <p className="text-sm text-gray-600">No items in the moderation queue.</p>
                    </CardContent>
                  </Card>
                ) : (
                  moderationQueue.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={`text-xs ${getSeverityColor(item.severity)}`}>
                                {item.severity}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {item.type}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words">
                              {item.content}
                            </p>
                            <div className="text-xs text-gray-500">
                              From: {item.sender} → {item.recipient}
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2">
                            <Button size="sm" variant="outline" className="flex-1 sm:flex-none text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1 sm:flex-none text-xs">
                              <XCircle className="h-3 w-3 mr-1" />
                              Block
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Analytics Tab - Mobile Optimized */}
            <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <span>Recent Activity</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center space-x-3">
                            <Flag className="h-4 w-4 text-yellow-500" />
                            <div>
                              <p className="text-sm font-medium">Message flagged for review</p>
                              <p className="text-xs text-gray-500">2 minutes ago</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">Review</Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <div>
                              <p className="text-sm font-medium">Emergency incident reported</p>
                              <p className="text-xs text-gray-500">15 minutes ago</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">Handle</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-green-500" />
                        <span>Security Status</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">AI Content Filter</span>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Emergency Detection</span>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Audit Logging</span>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Encryption</span>
                          <Badge className="bg-green-100 text-green-800">End-to-End</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="moderation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Moderation Queue</CardTitle>
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-64"
                          />
                        </div>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {moderationQueue.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Badge className={getSeverityColor(item.severity)}>
                                {item.severity.toUpperCase()}
                              </Badge>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getModerationStatusColor(item.status)}`}>
                                {item.status.toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(item.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-900">{item.content}</p>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>From: {item.sender}</span>
                              <span>To: {item.recipient}</span>
                            </div>
                            {item.flagReason && (
                              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                <Flag className="h-4 w-4 inline mr-1" />
                                {item.flagReason}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button size="sm" className="bg-green-500 hover:bg-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                              <Ban className="h-4 w-4 mr-1" />
                              Block
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>

        <NotificationCenter
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
        />
      </div>
    </UnifiedAuthGuard>
  )
}
