'use client'

export const dynamic = 'force-dynamic'

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
  MoreVertical,
  Sparkles,
  BarChart3
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
  const [enhancing, setEnhancing] = useState(false)

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

  const handleEnhanceWithAI = async () => {
    try {
      setEnhancing(true)
      setError(null)

      // Validate that we have content to enhance
      if (!formData.title.trim() && !formData.content.trim()) {
        throw new Error('Please enter a title or content to enhance')
      }

      const response = await fetch('/api/admin/announcements/enhance-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim() || 'Untitled',
          content: formData.content.trim() || 'No content provided',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('AI service is currently busy. Please try again in a moment.')
        }
        throw new Error(data.message || 'Failed to enhance announcement')
      }

      // Update form with enhanced content
      setFormData(prev => ({
        ...prev,
        title: data.enhanced.title,
        content: data.enhanced.content
      }))

      addToast('Announcement enhanced successfully! ✨')
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'Failed to enhance announcement')
    } finally {
      setEnhancing(false)
    }
  }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sticky Professional Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 sm:space-x-4"
            >
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Announcements
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">Create and manage school-wide communications</p>
              </div>
            </motion.div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={() => setShowCreateModal(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden xs:inline">New</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

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

        {/* Professional Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 bg-white border border-gray-200 shadow-lg rounded-xl p-2 mb-6 h-auto min-h-[48px] sm:min-h-[56px]">
            <TabsTrigger
              value="overview"
              className="text-xs sm:text-sm font-medium px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600 flex items-center justify-center whitespace-nowrap"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="text-xs sm:text-sm font-medium px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600 flex items-center justify-center whitespace-nowrap"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="text-xs sm:text-sm font-medium px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600 flex items-center justify-center whitespace-nowrap"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Enhanced Statistics - Gradient Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs sm:text-sm font-medium">Total</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{announcements.length}</p>
                      </div>
                      <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-xs sm:text-sm font-medium">Published</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{announcements.filter(a => a.status === 'published').length}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-xs sm:text-sm font-medium">Views</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{announcements.reduce((sum, a) => sum + a.views, 0)}</p>
                      </div>
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-xl">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-xs sm:text-sm font-medium">This Month</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{announcements.length}</p>
                      </div>
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0 shadow-xl">
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-cyan-100 text-xs sm:text-sm font-medium">Urgent</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{announcements.filter(a => a.priority === 'urgent').length}</p>
                      </div>
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-cyan-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">Quick Actions</CardTitle>
                <CardDescription className="text-sm text-gray-600">Create common announcement types instantly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
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
            {/* Search and Filter Section */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
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

            {/* Announcements Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredAnnouncements.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 lg:col-span-2 xl:col-span-3">
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
                    <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200 h-full flex flex-col">
                      <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 flex flex-col">
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

          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl">
              <CardContent className="p-8 sm:p-12 text-center">
                <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                  Analytics Coming Soon
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Detailed engagement metrics and performance analytics will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Optimized Create Announcement Dialog */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 bg-white border-0 shadow-xl">
            <motion.div
              className="flex flex-col h-full max-h-[90vh]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 flex items-center justify-between shrink-0">
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900">
                    Create Announcement
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-600 mt-0.5">
                    Share important updates with your school community
                  </DialogDescription>
                </div>
              </div>

              {/* Content - Single Column Optimized */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {/* Title Section */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-slate-700">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., School Science Fair 2024"
                    className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 h-11 text-base"
                  />
                </div>

                {/* Content & AI Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content" className="text-sm font-semibold text-slate-700">Content</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEnhanceWithAI}
                      disabled={enhancing || (!formData.title && !formData.content)}
                      className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      {enhancing ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-2" />
                        </motion.div>
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                      )}
                      {enhancing ? 'Enhancing...' : 'Enhance with AI'}
                    </Button>
                  </div>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your message..."
                    className="min-h-[120px] bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 resize-none p-4 text-base"
                  />
                  <p className="text-xs text-slate-500">{formData.content.length} characters</p>
                </div>

                {/* Type and Audience - Compact Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visual Type Selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'general', label: 'General', icon: MessageSquare, color: 'text-slate-600', bg: 'bg-slate-100' },
                        { id: 'event', label: 'Event', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
                        { id: 'urgent', label: 'Urgent', icon: Zap, color: 'text-red-600', bg: 'bg-red-100' },
                        { id: 'safety', label: 'Safety', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
                        { id: 'academic', label: 'Academic', icon: Target, color: 'text-purple-600', bg: 'bg-purple-100' },
                      ].map((type) => (
                        <motion.button
                          key={type.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFormData(prev => ({ ...prev, type: type.id as any }))}
                          className={`flex items-center p-2.5 rounded-lg border transition-all text-left ${formData.type === type.id
                            ? 'ring-2 ring-blue-500 bg-blue-50 border-transparent'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                            }`}
                        >
                          <div className={`p-1.5 rounded-md mr-2 ${type.bg} ${type.color}`}>
                            <type.icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-xs text-slate-700">{type.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Audience Selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Audience</Label>
                    <div className="flex flex-wrap gap-2">
                      {['all', 'students', 'teachers', 'parents', 'staff'].map((audience) => (
                        <motion.button
                          key={audience}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData(prev => ({ ...prev, audience: audience as any }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${formData.audience === audience
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                            }`}
                        >
                          {audience.charAt(0).toUpperCase() + audience.slice(1)}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Priority Selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Priority Level</Label>
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                    {['low', 'medium', 'high', 'urgent'].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => setFormData(prev => ({ ...prev, priority: priority as any }))}
                        className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all capitalize relative ${formData.priority === priority
                          ? 'text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        {formData.priority === priority && (
                          <motion.div
                            layoutId="activePriority"
                            className="absolute inset-0 bg-white rounded-md shadow-sm z-0"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <span className="relative z-10">{priority}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAnnouncement}
                  disabled={creating || !formData.title || !formData.content}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md min-w-[140px] transition-all"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Publish
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      </div >
    </div >
  )
}

