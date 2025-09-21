'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector } from '@/lib/redux/hooks'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  MessageSquare, 
  Calendar, 
  Target, 
  AlertCircle, 
  Zap, 
  X,
  ChevronDown,
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Megaphone,
  Bell,
  Clock,
  MoreVertical
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'general' | 'urgent' | 'event' | 'academic' | 'safety'
  audience: 'all' | 'students' | 'teachers' | 'parents' | 'staff'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  created_at: string
  author: string
  views: number
  tags: string[]
}

export default function AdminAnnouncementsPage() {
  const { profile } = useAppSelector((state) => state.auth)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [filterType, setFilterType] = useState('all')
  const [filterAudience, setFilterAudience] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    audience: 'all',
    priority: 'medium',
    tags: ''
  })

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  const handleError = (message: string) => {
    setError(message)
    addToast(message, 'error')
  }

  useEffect(() => {
    if (!profile?.school_id) return

    const fetchAnnouncements = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/announcements?school_id=${profile.school_id}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch announcements')
        }
        
        // Transform API data to match UI interface
        const transformedAnnouncements = data.announcements.map((announcement: any) => ({
          id: announcement.id.toString(),
          title: announcement.title,
          content: announcement.content,
          type: announcement.type || 'general',
          audience: announcement.target_audience || 'all',
          priority: announcement.priority || 'medium',
          status: 'published',
          created_at: announcement.created_at,
          author: announcement.author || 'Admin',
          views: 0, // API doesn't track views yet
          tags: [] // API doesn't have tags yet
        }))
        
        setAnnouncements(transformedAnnouncements)
      } catch (err) {
        handleError(err instanceof Error ? err.message : 'Failed to fetch announcements')
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [profile])

  const handleCreateAnnouncement = async () => {
    try {
      setCreating(true)
      setError(null)
      
      // Validate form data
      if (!formData.title.trim() || !formData.content.trim()) {
        throw new Error('Title and content are required')
      }

      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          priority: formData.priority,
          target_audience: formData.audience,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create announcement')
      }

      // Transform API response to match UI interface
      const newAnnouncement: Announcement = {
        id: data.announcement.id.toString(),
        title: data.announcement.title,
        content: data.announcement.content,
        type: formData.type as 'general' | 'urgent' | 'event' | 'academic' | 'safety',
        audience: data.announcement.target_audience || formData.audience as 'all' | 'students' | 'teachers' | 'parents' | 'staff',
        priority: data.announcement.priority as 'low' | 'medium' | 'high' | 'urgent',
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        status: 'published' as const,
        created_at: data.announcement.created_at,
        author: data.announcement.author || 'Admin',
        views: 0
      }
      
      setAnnouncements(prev => [newAnnouncement, ...prev])
      setShowCreateModal(false)
      setFormData({ title: '', content: '', type: 'general', audience: 'all', priority: 'medium', tags: '' })
      
      // Show success message
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
      
      addToast('Announcement created and sent successfully!')
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'Failed to create announcement')
    } finally {
      setCreating(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'safety': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'academic': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'event': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <Zap className="w-4 h-4 text-red-600" />
      case 'event': return <Calendar className="w-4 h-4 text-blue-600" />
      case 'academic': return <Target className="w-4 h-4 text-purple-600" />
      case 'safety': return <AlertCircle className="w-4 h-4 text-orange-600" />
      default: return <MessageSquare className="w-4 h-4 text-gray-600" />
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Zap className="w-3 h-3 text-red-600" />
      case 'high': return <TrendingUp className="w-3 h-3 text-orange-600" />
      case 'medium': return <Minus className="w-3 h-3 text-yellow-600" />
      case 'low': return <TrendingDown className="w-3 h-3 text-green-600" />
      default: return <Minus className="w-3 h-3 text-gray-600" />
    }
  }

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || announcement.type === filterType
    const matchesAudience = filterAudience === 'all' || announcement.audience === filterAudience
    return matchesSearch && matchesType && matchesAudience
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading announcements...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto"
      >
        {/* Header Section - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              School Announcements
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Create and manage school-wide communications</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)} 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">New Announcement</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                <span className="text-red-800 text-sm sm:text-base">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto p-1 h-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                <span className="text-green-800 font-medium text-sm sm:text-base">Announcement sent successfully! 🎉</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modern Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-1 shadow-sm">
            <TabsTrigger 
              value="overview" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="announcements"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Announcements</span>
              <span className="sm:hidden">Posts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Modern Stats Cards - Mobile Optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-blue-700 font-medium">Total</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-900">{announcements.length}</p>
                      </div>
                      <div className="bg-blue-600 p-2 sm:p-3 rounded-xl">
                        <Megaphone className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-green-700 font-medium">Published</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-900">{announcements.filter(a => a.status === 'published').length}</p>
                      </div>
                      <div className="bg-green-600 p-2 sm:p-3 rounded-xl">
                        <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-purple-700 font-medium">Views</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-900">{announcements.reduce((sum, a) => sum + a.views, 0)}</p>
                      </div>
                      <div className="bg-purple-600 p-2 sm:p-3 rounded-xl">
                        <Eye className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-orange-700 font-medium">This Month</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-900">{announcements.length}</p>
                      </div>
                      <div className="bg-orange-600 p-2 sm:p-3 rounded-xl">
                        <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions - Mobile Optimized */}
            <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">Quick Actions</CardTitle>
                <CardDescription className="text-sm text-gray-600">Create common announcement types instantly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Button 
                    variant="outline" 
                    className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: 'urgent', priority: 'urgent', audience: 'all' }))
                      setShowCreateModal(true)
                    }}
                  >
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    <span className="text-xs sm:text-sm font-medium text-red-700">Emergency</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: 'event', priority: 'medium', audience: 'all' }))
                      setShowCreateModal(true)
                    }}
                  >
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    <span className="text-xs sm:text-sm font-medium text-blue-700">Event</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: 'general', priority: 'medium', audience: 'all' }))
                      setShowCreateModal(true)
                    }}
                  >
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    <span className="text-xs sm:text-sm font-medium text-green-700">General</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: 'safety', priority: 'high', audience: 'all' }))
                      setShowCreateModal(true)
                    }}
                  >
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                    <span className="text-xs sm:text-sm font-medium text-orange-700">Safety</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4 sm:space-y-6">
            {/* Search and Filter Section - Mobile Optimized */}
            <Card className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-sm">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search announcements..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="sm:w-auto border-gray-300 hover:bg-gray-50"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Filters</span>
                    <span className="sm:hidden">Filter</span>
                  </Button>
                </div>

                {/* Mobile Filter Panel */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-200"
                    >
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">Type</Label>
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="academic">Academic</SelectItem>
                            <SelectItem value="safety">Safety</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">Audience</Label>
                        <Select value={filterAudience} onValueChange={setFilterAudience}>
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Audiences</SelectItem>
                            <SelectItem value="students">Students</SelectItem>
                            <SelectItem value="teachers">Teachers</SelectItem>
                            <SelectItem value="parents">Parents</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Announcements List - Mobile Optimized */}
            <div className="space-y-3 sm:space-y-4">
              {filteredAnnouncements.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                    <CardContent className="p-8 sm:p-12 text-center">
                      <Megaphone className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                        {announcements.length === 0 ? 'No announcements yet' : 'No matching announcements'}
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base mb-4">
                        {announcements.length === 0 
                          ? 'Create your first announcement to get started.' 
                          : 'Try adjusting your search or filters.'}
                      </p>
                      {announcements.length === 0 && (
                        <Button 
                          onClick={() => setShowCreateModal(true)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Announcement
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                filteredAnnouncements.map((announcement, index) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {getPriorityIcon(announcement.priority)}
                              <Badge className={`${getTypeColor(announcement.type)} text-xs`}>
                                {announcement.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Users className="w-3 h-3 mr-1" />
                                {announcement.audience}
                              </Badge>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                              {announcement.title}
                            </h3>
                            <p className="text-gray-600 text-sm sm:text-base mb-3 line-clamp-3">
                              {announcement.content}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                              <span className="flex items-center">
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                {announcement.views} views
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                {new Date(announcement.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 sm:ml-4">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modern Create Announcement Dialog - Mobile Optimized */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl mx-3 sm:mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Create New Announcement
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-gray-600">
                Craft and publish announcements for your school community
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6 py-4">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Announcement Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a clear, descriptive title..."
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Content Textarea */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                  Message Content *
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your announcement message here..."
                  rows={4}
                  className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Type and Audience Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                    Announcement Type
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">
                        <div className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2 text-gray-600" />
                          General
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center">
                          <Zap className="w-4 h-4 mr-2 text-red-600" />
                          Urgent
                        </div>
                      </SelectItem>
                      <SelectItem value="event">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                          Event
                        </div>
                      </SelectItem>
                      <SelectItem value="academic">
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-2 text-purple-600" />
                          Academic
                        </div>
                      </SelectItem>
                      <SelectItem value="safety">
                        <div className="flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
                          Safety
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience" className="text-sm font-medium text-gray-700">
                    Target Audience
                  </Label>
                  <Select value={formData.audience} onValueChange={(value) => setFormData(prev => ({ ...prev, audience: value }))}>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-gray-600" />
                          Everyone
                        </div>
                      </SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="teachers">Teachers Only</SelectItem>
                      <SelectItem value="parents">Parents Only</SelectItem>
                      <SelectItem value="staff">Staff Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Priority Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Priority Level</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <Button
                      key={priority}
                      type="button"
                      variant={formData.priority === priority ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, priority }))}
                      className={`capitalize ${
                        formData.priority === priority 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {getPriorityIcon(priority)}
                      <span className="ml-1 text-xs sm:text-sm">{priority}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="w-full sm:w-auto border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAnnouncement}
                  disabled={creating || !formData.title.trim() || !formData.content.trim()}
                  className="w-full sm:w-auto min-w-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                >
                  {creating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Publishing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Send className="w-4 h-4" />
                      <span>Publish Announcement</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  )
}
