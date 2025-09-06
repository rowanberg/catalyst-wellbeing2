'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  AlertTriangle, 
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
  MapPin, 
  Check, 
  Flag, 
  TrendingUp, 
  Eye, 
  Ban 
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
  const [helpRequests, setHelpRequests] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>(null)

  // Fetch debug information
  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/debug/school-data', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDebugInfo(data)
        console.log('Debug info:', data)
      }
    } catch (error) {
      console.error('Error fetching debug info:', error)
    }
  }

  // Run comprehensive test
  const runTest = async () => {
    try {
      const response = await fetch('/api/test/help-requests', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setTestResults(data)
        console.log('Test results:', data)
      }
    } catch (error) {
      console.error('Error running test:', error)
    }
  }

  // Create test help request
  const createTestHelpRequest = async () => {
    try {
      const response = await fetch('/api/test/create-help-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Created test help request:', data)
        // Refresh the help requests after creating test data
        await fetchHelpRequests()
        await fetchDebugInfo()
        alert('Test help request created successfully!')
      } else {
        const errorData = await response.json()
        console.error('Failed to create test help request:', errorData)
        alert('Failed to create test help request: ' + errorData.error)
      }
    } catch (error) {
      console.error('Error creating test help request:', error)
      alert('Error creating test help request')
    }
  }

  // Fetch help requests data
  const fetchHelpRequests = async () => {
    try {
      setLoading(true)
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      // Try the direct help requests endpoint first (newer encrypted messaging system)
      let response = await fetch('/api/admin/direct-help-requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal
      })
      
      // If direct endpoint fails, fallback to original endpoint
      if (!response.ok) {
        console.log('Direct help requests failed, trying original endpoint...')
        response = await fetch('/api/admin/help-requests', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: controller.signal
        })
      }
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Help requests data:', data)
        
        // Handle both API response formats
        const requests = data.helpRequests || []
        const stats = data.stats || { total: 0, pending: 0, urgent: 0, high: 0, resolved: 0 }
        
        setHelpRequests(requests)
        setSecurityStats(prev => ({
          ...prev,
          emergencyIncidents: stats.urgent || 0,
          moderationQueue: stats.pending || 0,
          totalMessages: stats.total || 0
        }))
        
        console.log(`Loaded ${requests.length} help requests`)
        if (requests.length > 0) {
          console.log('Sample request:', requests[0])
        }
      } else {
        console.error('Failed to fetch help requests:', response.status, response.statusText)
        const errorData = await response.text()
        console.error('Error response:', errorData)
        setHelpRequests([])
      }
    } catch (error) {
      console.error('Error fetching help requests:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request timed out')
      }
      setHelpRequests([])
    } finally {
      setLoading(false)
    }
  }

  // Update help request status
  const updateHelpRequestStatus = async (id: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/help-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes })
      })
      if (response.ok) {
        await fetchHelpRequests() // Refresh data
      }
    } catch (error) {
      console.error('Error updating help request:', error)
    }
  }

  useEffect(() => {
    fetchHelpRequests()
    fetchDebugInfo()
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

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-500 rounded-xl shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Security Center</h1>
                  <p className="text-gray-600">Monitor and moderate all communications</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setIsNotificationOpen(true)}
                  className="relative"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Live Feed
                  <Badge className="ml-2 bg-red-500">
                    {securityStats.moderationQueue}
                  </Badge>
                </Button>
              </div>
            </div>

            {/* Security Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Messages</p>
                      <p className="text-2xl font-bold text-blue-600">{securityStats.totalMessages}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Flagged Messages</p>
                      <p className="text-2xl font-bold text-yellow-600">{securityStats.flaggedMessages}</p>
                    </div>
                    <Flag className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Emergency Incidents</p>
                      <p className="text-2xl font-bold text-red-600">{securityStats.emergencyIncidents}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-green-600">{securityStats.activeUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Moderation Queue</p>
                      <p className="text-2xl font-bold text-purple-600">{securityStats.moderationQueue}</p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="moderation" className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Moderation Queue</span>
                  {securityStats.moderationQueue > 0 && (
                    <Badge className="ml-1 bg-red-500 text-white">
                      {securityStats.moderationQueue}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="incidents" className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Emergency Incidents</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Analytics</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
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

              <TabsContent value="incidents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span>Student Help Requests</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={filterSeverity}
                          onChange={(e) => setFilterSeverity(e.target.value)}
                          className="px-3 py-1 border rounded-md text-sm"
                        >
                          <option value="all">All Severities</option>
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                        <Button onClick={fetchHelpRequests} variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading help requests...</p>
                      </div>
                    ) : helpRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Help Requests Found</h3>
                        <p className="text-gray-500">
                          No student help requests found for your school at this time.
                        </p>
                        <div className="mt-4 text-xs text-gray-400">
                          <p>Check browser console for debugging information</p>
                          <Button onClick={fetchHelpRequests} variant="outline" size="sm" className="mt-2">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry Loading
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {helpRequests
                          .filter(request => filterSeverity === 'all' || request.severity === filterSeverity)
                          .map((request) => (
                          <div key={request.id} className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Badge className={getSeverityColor(request.severity)}>
                                  {request.severity.toUpperCase()}
                                </Badge>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHelpRequestStatusColor(request.status)}`}>
                                  {request.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(request.timestamp).toLocaleString()}
                                </span>
                                {request.priorityScore && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    Priority: {request.priorityScore}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="text-lg font-bold text-blue-900">{request.sender}</h3>
                                    {request.studentInfo && (
                                      <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        Grade {request.studentInfo.grade}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{request.content}</p>
                                  {request.location && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      <MapPin className="h-3 w-3 inline mr-1" />
                                      Location: {request.location}
                                    </p>
                                  )}
                                  {request.studentInfo && request.studentInfo.class && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Class: {request.studentInfo.class}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {request.notes && (
                                <div className="bg-blue-50 p-2 rounded text-sm">
                                  <p className="font-medium text-blue-900">Admin Notes:</p>
                                  <p className="text-blue-800">{request.notes}</p>
                                </div>
                              )}
                              
                              {request.status !== 'resolved' && (
                                <div className="flex items-center space-x-2 pt-2">
                                  <Button
                                    onClick={() => updateHelpRequestStatus(request.id, 'acknowledged')}
                                    variant="outline"
                                    size="sm"
                                    disabled={request.status === 'acknowledged'}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Acknowledge
                                  </Button>
                                  <Button
                                    onClick={() => updateHelpRequestStatus(request.id, 'in_progress')}
                                    variant="outline"
                                    size="sm"
                                    disabled={request.status === 'in_progress'}
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    In Progress
                                  </Button>
                                  <Button
                                    onClick={() => updateHelpRequestStatus(request.id, 'resolved', 'Resolved by admin')}
                                    variant="default"
                                    size="sm"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Resolve
                                  </Button>
                                  {request.severity === 'urgent' && (
                                    <Button
                                      onClick={() => updateHelpRequestStatus(request.id, 'escalated', 'Escalated to emergency services')}
                                      variant="destructive"
                                      size="sm"
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-1" />
                                      Escalate
                                    </Button>
                                  )}
                                </div>
                              )}
                              
                              {request.resolvedAt && (
                                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                                  Resolved on {new Date(request.resolvedAt).toLocaleString()}
                                  {request.resolver && ` by ${request.resolver}`}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        <span>Communication Analytics</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                        <p className="text-gray-500">Detailed analytics and reporting coming soon.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-orange-500" />
                        <span>Debug Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {debugInfo ? (
                        <div className="space-y-4 text-sm">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Admin Profile</h4>
                            <div className="bg-gray-50 p-3 rounded">
                              <p><strong>Email:</strong> {debugInfo.adminInfo?.email || 'N/A'}</p>
                              <p><strong>Role:</strong> {debugInfo.adminInfo?.profile?.role || 'N/A'}</p>
                              <p><strong>School ID:</strong> {debugInfo.adminInfo?.profile?.school_id || 'N/A'}</p>
                              <p><strong>School Name:</strong> {debugInfo.adminInfo?.profile?.schools?.name || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Help Requests in Database</h4>
                            <div className="bg-gray-50 p-3 rounded">
                              <p><strong>Total Found:</strong> {debugInfo.helpRequestsData?.requests?.length || 0}</p>
                              {debugInfo.helpRequestsData?.requests?.length > 0 && (
                                <div className="mt-2">
                                  <p><strong>Sample Request:</strong></p>
                                  <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(debugInfo.helpRequestsData.requests[0], null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Schools in Database</h4>
                            <div className="bg-gray-50 p-3 rounded">
                              <p><strong>Total Schools:</strong> {debugInfo.schoolsData?.allSchools?.length || 0}</p>
                              {debugInfo.schoolsData?.allSchools?.map((school: any) => (
                                <p key={school.id} className="text-xs">
                                  {school.name} (ID: {school.id})
                                </p>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button onClick={runTest} variant="outline" size="sm">
                              <Activity className="h-4 w-4 mr-2" />
                              Run Full Test
                            </Button>
                            <Button onClick={fetchDebugInfo} variant="outline" size="sm">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh Debug
                            </Button>
                            <Button onClick={createTestHelpRequest} variant="outline" size="sm" className="bg-green-50 hover:bg-green-100">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Create Test Request
                            </Button>
                          </div>

                          {testResults && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Test Results</h4>
                              <div className="bg-blue-50 p-3 rounded max-h-64 overflow-y-auto">
                                <pre className="text-xs whitespace-pre-wrap">
                                  {JSON.stringify(testResults, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Loading debug information...</p>
                          <Button onClick={fetchDebugInfo} variant="outline" size="sm" className="mt-2">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Debug Info
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

        <NotificationCenter
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
        />
      </div>
    </AuthGuard>
  )
}
