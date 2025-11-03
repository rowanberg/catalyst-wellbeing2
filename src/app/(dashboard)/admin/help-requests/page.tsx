'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  AlertTriangle, 
  MessageSquare, 
  User, 
  Eye, 
  MessageCircle, 
  CheckCircle, 
  Filter,
  Search,
  FileText,
  Users,
  Heart,
  Shield,
  BookOpen,
  Home,
  Clock,
  Mail,
  Archive
} from 'lucide-react'
import Link from 'next/link'

interface HelpRequest {
  id: string
  studentName: string
  grade: string
  urgency: 'urgent' | 'high' | 'medium' | 'low'
  category: 'bullying' | 'academic' | 'family' | 'mental_health' | 'safety' | 'other'
  subject: string
  message: string
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated'
  timestamp: string
  assignedTo?: string
  lastUpdated: string
  isAnonymous: boolean
}

export default function HelpRequestsPage() {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null)
  const [responseMessage, setResponseMessage] = useState('')

  // Fetch real help requests from API
  useEffect(() => {
    const fetchHelpRequests = async () => {
      try {
        setLoading(true)
        console.log('Fetching help requests...')
        
        // Fetch both active and resolved requests, plus all requests for comparison
        const [activeResponse, resolvedResponse, allResponse] = await Promise.all([
          fetch('/api/admin/help-requests?status=active'),
          fetch('/api/admin/help-requests?status=resolved'),
          fetch('/api/admin/help-requests?status=all')
        ])
        
        if (!activeResponse.ok) {
          throw new Error(`Failed to fetch active help requests: ${activeResponse.status}`)
        }
        
        if (!resolvedResponse.ok) {
          throw new Error(`Failed to fetch resolved help requests: ${resolvedResponse.status}`)
        }
        
        if (!allResponse.ok) {
          throw new Error(`Failed to fetch all help requests: ${allResponse.status}`)
        }
        
        const [activeData, resolvedData, allData] = await Promise.all([
          activeResponse.json(),
          resolvedResponse.json(),
          allResponse.json()
        ])
        
        console.log('API Response - Active:', activeData)
        console.log('API Response - Resolved:', resolvedData)
        console.log('API Response - All:', allData)
        
        // Compare counts for debugging
        console.log('Count comparison:', {
          active: activeData.helpRequests?.length || 0,
          resolved: resolvedData.helpRequests?.length || 0,
          all: allData.helpRequests?.length || 0,
          combined: (activeData.helpRequests?.length || 0) + (resolvedData.helpRequests?.length || 0)
        })
        
        if (activeData.error) {
          console.error('Active API Error:', activeData.error)
        }
        
        if (resolvedData.error) {
          console.error('Resolved API Error:', resolvedData.error)
        }
        
        if (allData.error) {
          console.error('All API Error:', allData.error)
        }
        
        // Transform API data to match component interface
        const transformActiveRequests = (requests: any[]): HelpRequest[] => requests?.map((request: any) => ({
          id: request.id,
          studentName: request.sender || 'Anonymous Student',
          grade: 'N/A', // Grade not available in current API response
          urgency: (request.severity || 'medium') as 'urgent' | 'high' | 'medium' | 'low',
          category: 'other' as const, // Category not available in current API response
          subject: request.flagReason || 'Help Request',
          message: request.content || '',
          status: (request.status || 'pending') as 'pending' | 'in_progress' | 'resolved' | 'escalated',
          timestamp: request.timestamp,
          lastUpdated: request.timestamp,
          assignedTo: request.resolver || undefined,
          isAnonymous: !request.sender || request.sender.includes('Student ID:')
        })) || []
        
        const activeRequests = transformActiveRequests(activeData.helpRequests || [])
        const resolvedRequests = transformActiveRequests(resolvedData.helpRequests || [])
        const allRequestsFromAPI = transformActiveRequests(allData.helpRequests || [])
        
        // Use the "all" API response as the primary source, but also combine active+resolved for comparison
        const combinedRequests = [...activeRequests, ...resolvedRequests]
        
        // Use whichever gives us more requests (in case of filtering issues)
        const finalRequests = allRequestsFromAPI.length >= combinedRequests.length ? allRequestsFromAPI : combinedRequests
        
        console.log('Transformed requests:', {
          active: activeRequests.length,
          resolved: resolvedRequests.length,
          combined: combinedRequests.length,
          allFromAPI: allRequestsFromAPI.length,
          finalUsed: finalRequests.length,
          usingSource: allRequestsFromAPI.length >= combinedRequests.length ? 'all-api' : 'combined'
        })
        
        setHelpRequests(finalRequests)
        setFilteredRequests(finalRequests)
        
      } catch (error) {
        console.error('Error fetching help requests:', error)
        setHelpRequests([])
        setFilteredRequests([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchHelpRequests()
  }, [])

  // Filter requests based on search and filters
  useEffect(() => {
    let filtered = helpRequests

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(request => request.urgency === urgencyFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(request => request.category === categoryFilter)
    }

    setFilteredRequests(filtered)
  }, [helpRequests, searchTerm, statusFilter, urgencyFilter, categoryFilter])

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'escalated': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bullying': return <Shield className="w-4 h-4" />
      case 'academic': return <BookOpen className="w-4 h-4" />
      case 'family': return <Users className="w-4 h-4" />
      case 'mental_health': return <Heart className="w-4 h-4" />
      case 'safety': return <AlertTriangle className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/help-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: requestId,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`)
      }

      // Update local state on successful API call
      setHelpRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status: newStatus as any, lastUpdated: new Date().toISOString() }
            : request
        )
      )
    } catch (error) {
      console.error('Error updating help request status:', error)
      // Could add toast notification here for user feedback
    }
  }

  const handleSendResponse = () => {
    if (!selectedRequest || !responseMessage.trim()) return
    
    // In a real app, this would send the response to the student
    console.log('Sending response to:', selectedRequest.studentName, responseMessage)
    setResponseMessage('')
    setSelectedRequest(null)
  }

  const stats = {
    total: helpRequests.length,
    pending: helpRequests.filter(r => r.status === 'pending').length,
    urgent: helpRequests.filter(r => r.urgency === 'urgent').length,
    resolved: helpRequests.filter(r => r.status === 'resolved').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header - Mobile Optimized */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 sm:space-x-4"
            >
              <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Help Requests
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">Manage and respond to student support requests</p>
                <p className="text-xs text-gray-600 mt-1 sm:hidden">Student support requests</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <Button variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white/80 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 flex-1 sm:flex-none">
                <Archive className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Archive Resolved</span>
                <span className="sm:hidden">Archive</span>
              </Button>
              <Link href="/admin" className="flex-1 sm:flex-none">
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white/80 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 w-full">
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Overview - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Requests</p>
                    <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
                  </div>
                  <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-xs sm:text-sm font-medium">Pending</p>
                    <p className="text-xl sm:text-3xl font-bold">{stats.pending}</p>
                  </div>
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-xs sm:text-sm font-medium">Urgent</p>
                    <p className="text-xl sm:text-3xl font-bold">{stats.urgent}</p>
                  </div>
                  <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs sm:text-sm font-medium">Resolved</p>
                    <p className="text-xl sm:text-3xl font-bold">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters - Mobile Optimized */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-auto"
                />
              </div>
              
              {/* Filter Dropdowns - Mobile Stack */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 sm:h-auto">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="h-10 sm:h-auto">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Urgency</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 sm:h-auto">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="bullying">Bullying</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="mental_health">Mental Health</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Interface for Pending, Active, and Resolved */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-sm border-0 shadow-xl mb-6">
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              Pending ({filteredRequests.filter(r => r.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              In Progress ({filteredRequests.filter(r => r.status === 'in_progress').length})
            </TabsTrigger>
            <TabsTrigger 
              value="resolved"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              Resolved ({filteredRequests.filter(r => r.status === 'resolved').length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="pending">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {filteredRequests.filter(r => r.status === 'pending').map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-orange-50/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 border-l-4 border-l-orange-500">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3 sm:gap-0">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                            <Clock className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-base sm:text-lg flex items-center space-x-2">
                              <span className="truncate">{request.isAnonymous ? 'Anonymous Student' : request.studentName}</span>
                              {request.isAnonymous && <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600">Grade {request.grade} • {new Date(request.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-start sm:items-end space-x-2 sm:space-x-0 sm:space-y-2 flex-shrink-0">
                          <Badge variant="outline" className={`${getUrgencyColor(request.urgency)} text-xs`}>
                            {request.urgency}
                          </Badge>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">{request.subject}</h4>
                        <p className="text-gray-700 text-sm line-clamp-3">{request.message}</p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <ClientWrapper>
                            <Button
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                              className="bg-blue-600 hover:bg-blue-700 h-9 text-sm"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Respond
                            </Button>
                          </ClientWrapper>
                          
                          <ClientWrapper>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50 h-9 text-sm"
                            >
                              Start Review
                            </Button>
                          </ClientWrapper>
                        </div>
                        
                        <p className="text-xs text-gray-500 text-center sm:text-right">
                          Submitted: {new Date(request.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {filteredRequests.filter(r => r.status === 'pending').length === 0 && (
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Requests</h3>
                    <p className="text-gray-600">All help requests have been reviewed or no requests match your filters.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* In Progress Requests Tab */}
          <TabsContent value="active">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {filteredRequests.filter(r => r.status === 'in_progress').map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3 sm:gap-0">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                            {getCategoryIcon(request.category)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-base sm:text-lg flex items-center space-x-2">
                              <span className="truncate">{request.isAnonymous ? 'Anonymous Student' : request.studentName}</span>
                              {request.isAnonymous && <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600">Grade {request.grade} • {new Date(request.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-start sm:items-end space-x-2 sm:space-x-0 sm:space-y-2 flex-shrink-0">
                          <Badge variant="outline" className={`${getUrgencyColor(request.urgency)} text-xs`}>
                            {request.urgency}
                          </Badge>
                          <Badge variant="outline" className={`${getStatusColor(request.status)} text-xs`}>
                            {request.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">{request.subject}</h4>
                        <p className="text-gray-700 text-sm line-clamp-3">{request.message}</p>
                      </div>

                      {request.assignedTo && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <User className="w-4 h-4 inline mr-1" />
                            Assigned to: {request.assignedTo}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <ClientWrapper>
                            <Button
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                              className="bg-blue-600 hover:bg-blue-700 h-9 text-sm"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Respond
                            </Button>
                          </ClientWrapper>
                          
                          {request.status === 'pending' && (
                            <ClientWrapper>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                                className="h-9 text-sm"
                              >
                                Start Review
                              </Button>
                            </ClientWrapper>
                          )}
                          
                          {request.status === 'in_progress' && (
                            <ClientWrapper>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(request.id, 'resolved')}
                                className="text-green-600 border-green-600 hover:bg-green-50 h-9 text-sm"
                              >
                                Mark Resolved
                              </Button>
                            </ClientWrapper>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 text-center sm:text-right">
                          Updated: {new Date(request.lastUpdated).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {filteredRequests.filter(r => r.status === 'in_progress').length === 0 && (
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No In Progress Requests</h3>
                    <p className="text-gray-600">No requests are currently being reviewed or no requests match your filters.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Resolved Requests Tab */}
          <TabsContent value="resolved">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {filteredRequests.filter(r => r.status === 'resolved').map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-green-50/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 border-l-4 border-l-green-500">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3 sm:gap-0">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-base sm:text-lg flex items-center space-x-2">
                              <span className="truncate">{request.isAnonymous ? 'Anonymous Student' : request.studentName}</span>
                              {request.isAnonymous && <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600">Grade {request.grade} • Resolved on {new Date(request.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-start sm:items-end space-x-2 sm:space-x-0 sm:space-y-2 flex-shrink-0">
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">{request.subject}</h4>
                        <p className="text-gray-700 text-sm line-clamp-3">{request.message}</p>
                      </div>

                      {request.assignedTo && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-800">
                            <User className="w-4 h-4 inline mr-1" />
                            Resolved by: {request.assignedTo}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <ClientWrapper>
                            <Button
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                              variant="outline"
                              className="bg-white hover:bg-gray-50 h-9 text-sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </ClientWrapper>
                          
                          <ClientWrapper>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(request.id, 'pending')}
                              className="text-orange-600 border-orange-600 hover:bg-orange-50 h-9 text-sm"
                            >
                              Reopen
                            </Button>
                          </ClientWrapper>
                        </div>
                        
                        <p className="text-xs text-gray-500 text-center sm:text-right">
                          Resolved: {new Date(request.lastUpdated).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {filteredRequests.filter(r => r.status === 'resolved').length === 0 && (
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Resolved Requests</h3>
                    <p className="text-gray-600">No help requests have been resolved yet or none match your filters.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Response Modal - Mobile Optimized */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold">Respond to Help Request</h2>
              <p className="text-sm sm:text-base text-gray-600 truncate">From: {selectedRequest.isAnonymous ? 'Anonymous Student' : selectedRequest.studentName}</p>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2 text-sm sm:text-base">{selectedRequest.subject}</h3>
                <p className="text-gray-700 text-xs sm:text-sm">{selectedRequest.message}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <Textarea
                  placeholder="Type your response here..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={4}
                  className="w-full text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <ClientWrapper>
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendResponse}
                  disabled={!responseMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  Send Response
                </Button>
              </ClientWrapper>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mobile Floating Action Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        >
          <ClientWrapper>
            <Button
              size="lg"
              className="rounded-full w-14 h-14 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-xl"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <AlertTriangle className="h-6 w-6" />
            </Button>
          </ClientWrapper>
        </motion.div>
      </div>
    </div>
  )
}
