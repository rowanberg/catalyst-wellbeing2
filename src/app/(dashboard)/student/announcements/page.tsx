'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Bell, BarChart3, Calendar, AlertCircle, Users, Clock, X, CheckCircle, Star, Heart, Zap, Filter, Search, Bookmark, Share2, Eye, TrendingUp, MessageCircle, ThumbsUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { Input } from '@/components/ui/input'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'general' | 'academic' | 'event' | 'urgent'
  priority: 'low' | 'medium' | 'high'
  author: string
  created_at: string
}

interface Poll {
  id: string
  title: string
  description: string
  questions: any[]
  endDate?: string
  hasResponded: boolean
  allowMultipleResponses?: boolean
  type?: string
}

export default function StudentAnnouncementsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'announcements' | 'polls'>('announcements')
  
  // Enhanced UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'general' | 'academic' | 'event' | 'urgent'>('all')
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set())
  const [viewedItems, setViewedItems] = useState<Set<string>>(new Set())
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  
  // Performance testing
  const [showPerformanceTest, setShowPerformanceTest] = useState(false)
  const [performanceResults, setPerformanceResults] = useState<any>(null)
  
  // Poll modal state
  const [showPollModal, setShowPollModal] = useState(false)
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [pollResponses, setPollResponses] = useState<{[key: string]: any}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, []) // Fixed: Added proper dependency array to prevent duplicate calls
  // Cache for preventing duplicate requests
  const [requestCache, setRequestCache] = useState<Map<string, any>>(new Map())
  const [lastFetchTime, setLastFetchTime] = useState<Map<string, number>>(new Map())
  
  const fetchData = async (forceRefresh = false) => {
    const startTime = performance.now()
    console.log('🚀 [PERFORMANCE] Starting data fetch...', { forceRefresh, timestamp: new Date().toISOString() })
    
    const cacheKey = 'dashboard-data'
    const now = Date.now()
    const lastFetch = lastFetchTime.get(cacheKey) || 0
    const cacheExpiry = 3 * 60 * 1000 // 3 minutes (matches API cache)
    
    // Return cached data if still fresh and not forcing refresh
    if (!forceRefresh && requestCache.has(cacheKey) && (now - lastFetch) < cacheExpiry) {
      const cached = requestCache.get(cacheKey)
      setAnnouncements(cached.announcements)
      setPolls(cached.polls)
      setIsLoading(false)
      const cacheTime = performance.now() - startTime
      console.log('⚡ [PERFORMANCE] Used cached data:', { 
        time: `${cacheTime.toFixed(2)}ms`,
        announcements: cached.announcements.length,
        polls: cached.polls.length 
      })
      return
    }
    
    try {
      console.log('🌐 [PERFORMANCE] Fetching from combined endpoint...')
      const fetchStart = performance.now()
      
      // Use optimized combined endpoint
      const response = await fetch('/api/student/dashboard-data?announcements_limit=10&polls_limit=10', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      const fetchTime = performance.now() - fetchStart
      console.log('📡 [PERFORMANCE] API Response received:', { 
        time: `${fetchTime.toFixed(2)}ms`,
        status: response.status,
        ok: response.ok 
      })
      
      if (response.ok) {
        const dashboardData = await response.json()
        
        // Extract data from combined response
        const announcementsData = dashboardData.announcements?.data || []
        const pollsData = dashboardData.polls?.data || []
        
        setAnnouncements(announcementsData)
        setPolls(pollsData)
        
        // Cache the results
        setRequestCache(prev => new Map(prev.set(cacheKey, {
          announcements: announcementsData,
          polls: pollsData,
          profile: dashboardData.profile,
          schoolInfo: dashboardData.schoolInfo
        })))
        setLastFetchTime(prev => new Map(prev.set(cacheKey, now)))
        
        const totalTime = performance.now() - startTime
        console.log('✅ [PERFORMANCE] Dashboard data loaded from combined endpoint:', {
          totalTime: `${totalTime.toFixed(2)}ms`,
          announcements: announcementsData.length,
          polls: pollsData.length,
          cached: false,
          endpoint: 'combined'
        })
      } else {
        console.error('❌ [PERFORMANCE] Combined endpoint failed:', response.status)
        // Fallback to individual endpoints if combined fails
        await fetchDataFallback(startTime)
      }
      
    } catch (error) {
      console.error('❌ [PERFORMANCE] Combined endpoint error:', error)
      // Fallback to individual endpoints
      await fetchDataFallback(startTime)
    } finally {
      setIsLoading(false)
      const totalTime = performance.now() - startTime
      console.log('🏁 [PERFORMANCE] Data fetch completed:', `${totalTime.toFixed(2)}ms`)
    }
  }

  // Fallback method using individual endpoints
  const fetchDataFallback = async (startTime?: number) => {
    try {
      const [announcementsResponse, pollsResponse] = await Promise.all([
        fetch('/api/student/announcements'),
        fetch('/api/polls')
      ])
      
      let announcementsData = []
      let pollsData = []
      
      if (announcementsResponse.ok) {
        const result = await announcementsResponse.json()
        announcementsData = result.data || result // Handle both paginated and direct response
        setAnnouncements(announcementsData)
      }
      
      if (pollsResponse.ok) {
        const pollsResult = await pollsResponse.json()
        pollsData = pollsResult.polls || []
        setPolls(pollsData)
      }
      
      const fallbackTime = startTime ? performance.now() - startTime : 0
      console.log('⚠️ [PERFORMANCE] Used fallback endpoints:', {
        totalTime: startTime ? `${fallbackTime.toFixed(2)}ms` : 'unknown',
        announcements: announcementsData.length,
        polls: pollsData.length,
        endpoint: 'fallback'
      })
      
    } catch (error) {
      console.error('Fallback fetch error:', error)
    }
  }

  // Performance testing function
  const runPerformanceTest = async () => {
    console.log('🔍 [PERFORMANCE] Running diagnostic test...')
    setShowPerformanceTest(true)
    try {
      const response = await fetch('/api/student/performance-test')
      const results = await response.json()
      setPerformanceResults(results)
      console.log('📊 [PERFORMANCE] Test results:', results)
    } catch (error) {
      console.error('Performance test failed:', error)
      setPerformanceResults({ error: 'Test failed', details: error })
    }
  }


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'urgent': return '🚨'
      case 'academic': return '📚'
      case 'event': return '🎉'
      case 'general': return '📢'
      default: return '📢'
    }
  }

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'urgent': return 'from-red-500 to-pink-500'
      case 'academic': return 'from-blue-500 to-indigo-500'
      case 'event': return 'from-purple-500 to-pink-500'
      case 'general': return 'from-green-500 to-teal-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return AlertCircle
      case 'academic': return Star
      case 'event': return Calendar
      case 'general': return Bell
      default: return Bell
    }
  }

  // Enhanced filtering and search
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || announcement.type === filterType
    return matchesSearch && matchesFilter
  })

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         poll.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Interactive functions
  const toggleBookmark = (id: string) => {
    setBookmarkedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
        addToast({
          title: "Removed from bookmarks",
          description: "Item removed from your saved items",
          type: "success"
        })
      } else {
        newSet.add(id)
        addToast({
          title: "Bookmarked!",
          description: "Item saved to your bookmarks",
          type: "success"
        })
      }
      return newSet
    })
  }

  const toggleLike = (id: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
        addToast({
          title: "Liked! 👍",
          description: "Thanks for your feedback",
          type: "success"
        })
      }
      return newSet
    })
  }

  const markAsViewed = (id: string) => {
    setViewedItems(prev => {
      const newSet = new Set(prev)
      newSet.add(id)
      return newSet
    })
  }

  // Handle poll response
  const handlePollResponse = (poll: Poll) => {
    setSelectedPoll(poll)
    setShowPollModal(true)
    setPollResponses({}) // Reset responses
  }

  // Submit poll response
  const submitPollResponse = async () => {
    if (!selectedPoll || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // Validate required questions
      const requiredQuestions = selectedPoll.questions.filter(q => q.required)
      const missingResponses = requiredQuestions.filter(q => !pollResponses[q.id])
      
      if (missingResponses.length > 0) {
        addToast({
          title: "Missing Responses",
          description: "Please answer all required questions before submitting.",
          type: "error"
        })
        setIsSubmitting(false)
        return
      }

      // Convert responses to the format expected by the API
      const answers = Object.entries(pollResponses).map(([questionId, value]: [string, any]) => ({
        questionId,
        value
      }))

      const response = await fetch('/api/polls/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pollId: selectedPoll.id,
          answers: answers
        })
      })

      const responseData = await response.json()

      if (response.ok) {
        addToast({
          title: "Response Submitted!",
          description: "Thank you for participating in the poll.",
          type: "success"
        })
        
        // Update poll status
        setPolls(prev => prev.map(poll => 
          poll.id === selectedPoll.id 
            ? { ...poll, hasResponded: true }
            : poll
        ))
        
        setShowPollModal(false)
        setSelectedPoll(null)
        setPollResponses({})
      } else {
        addToast({
          title: "Submission Failed",
          description: responseData.error || "Failed to submit your response. Please try again.",
          type: "error"
        })
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to submit your response. Please try again.",
        type: "error"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
        @media (max-width: 475px) {
          .xs\\:flex { display: flex; }
          .xs\\:inline { display: inline; }
          .xs\\:hidden { display: none; }
        }
      `}</style>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-teal-400/10 to-green-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Enhanced Mobile-First Header */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/95 backdrop-blur-2xl shadow-2xl border-b border-white/30 sticky top-0 z-50"
      >
        <div className="px-3 py-3 sm:px-6 sm:py-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button 
                onClick={() => router.push('/student')} 
                variant="ghost" 
                size="sm"
                className="p-2 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 rounded-xl transition-all duration-300 flex-shrink-0 group active:scale-95"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-200" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  🎓 School Hub
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 sm:gap-2 hidden xs:flex">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                  Stay updated with school news
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-lg"
              >
                {activeTab === 'announcements' ? filteredAnnouncements.length : filteredPolls.length}
              </motion.div>
              
              {/* Performance Test Button (Development) */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  onClick={runPerformanceTest}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                >
                  🔍 Test
                </Button>
              )}

            </div>
          </div>

          {/* Mobile-Optimized Search and Filter Bar */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm border-white/50 focus:border-purple-300 focus:ring-purple-200 rounded-xl text-base"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 rounded-full hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {activeTab === 'announcements' && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className={`rounded-full whitespace-nowrap transition-all duration-200 ${
                    filterType === 'all' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-lg' 
                      : 'bg-white/90 hover:bg-white border-white/50'
                  }`}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  All
                </Button>
                {['urgent', 'academic', 'event', 'general'].map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => setFilterType(type as any)}
                    className={`rounded-full whitespace-nowrap transition-all duration-200 capitalize ${
                      filterType === type 
                        ? `bg-gradient-to-r ${getTypeGradient(type)} text-white border-transparent shadow-lg` 
                        : 'bg-white/90 hover:bg-white border-white/50'
                    }`}
                  >
                    <span className="text-sm">{getTypeEmoji(type)}</span>
                    <span className="ml-1 hidden xs:inline">{type}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl mx-auto relative z-10">
        {/* Mobile-Optimized Tab Navigation */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl p-1.5 sm:p-2 shadow-2xl border border-white/40">
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="touch-manipulation"
              >
                <Button
                  onClick={() => setActiveTab('announcements')}
                  variant="ghost"
                  className={`relative h-14 sm:h-16 w-full rounded-xl transition-all duration-500 overflow-hidden ${
                    activeTab === 'announcements'
                      ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white shadow-2xl'
                      : 'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 active:bg-purple-100'
                  }`}
                >
                  {activeTab === 'announcements' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative flex flex-col items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-semibold text-sm sm:text-base">Announcements</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Badge className={`text-xs ${
                        activeTab === 'announcements' 
                          ? 'bg-white/20 text-white border-white/30' 
                          : 'bg-purple-100 text-purple-600 border-purple-200'
                      }`}>
                        {filteredAnnouncements.length}
                      </Badge>
                      {bookmarkedItems.size > 0 && (
                        <Badge className={`text-xs ${
                          activeTab === 'announcements' 
                            ? 'bg-yellow-400/20 text-yellow-100 border-yellow-300/30' 
                            : 'bg-yellow-100 text-yellow-600 border-yellow-200'
                        }`}>
                          <Bookmark className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              </motion.div>
              
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="touch-manipulation"
              >
                <Button
                  onClick={() => setActiveTab('polls')}
                  variant="ghost"
                  className={`relative h-14 sm:h-16 w-full rounded-xl transition-all duration-500 overflow-hidden ${
                    activeTab === 'polls'
                      ? 'bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 text-white shadow-2xl'
                      : 'text-gray-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 active:bg-green-100'
                  }`}
                >
                  {activeTab === 'polls' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative flex flex-col items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-semibold text-sm sm:text-base">Polls</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Badge className={`text-xs ${
                        activeTab === 'polls' 
                          ? 'bg-white/20 text-white border-white/30' 
                          : 'bg-green-100 text-green-600 border-green-200'
                      }`}>
                        {filteredPolls.length}
                      </Badge>
                      <Badge className={`text-xs ${
                        activeTab === 'polls' 
                          ? 'bg-emerald-400/20 text-emerald-100 border-emerald-300/30' 
                          : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                      }`}>
                        <TrendingUp className="h-3 w-3" />
                      </Badge>
                    </div>
                  </div>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-6"
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 w-16 h-16 border-2 border-purple-300 rounded-full mx-auto opacity-30"
                />
              </div>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 font-medium text-lg"
              >
                Loading your updates...
              </motion.p>
            </motion.div>
          ) : (
            <>
              {/* Announcements Tab */}
              {activeTab === 'announcements' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6"
                >
                  {filteredAnnouncements.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Card className="bg-white/95 backdrop-blur-2xl border-white/40 shadow-2xl">
                        <CardContent className="text-center py-16">
                          <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mb-6"
                          >
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                              <Bell className="h-12 w-12 text-purple-500" />
                            </div>
                          </motion.div>
                          <motion.h3 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-gray-800 mb-3"
                          >
                            {searchQuery ? 'No matching announcements' : 'No announcements yet'}
                          </motion.h3>
                          <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-600 text-lg"
                          >
                            {searchQuery 
                              ? `Try adjusting your search for "${searchQuery}"` 
                              : 'Check back later for important school updates and news!'
                            }
                          </motion.p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    filteredAnnouncements.map((announcement, index) => {
                      const TypeIcon = getTypeIcon(announcement.type)
                      return (
                        <motion.div
                          key={announcement.id}
                          initial={{ opacity: 0, y: 50, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          onClick={() => markAsViewed(announcement.id)}
                          className="cursor-pointer"
                        >
                          <Card className={`bg-white/95 backdrop-blur-2xl border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden relative group ${
                            !viewedItems.has(announcement.id) ? 'ring-2 ring-purple-200' : ''
                          }`}>
                            {/* Gradient Border Effect */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${getTypeGradient(announcement.type)} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                            
                            {/* Priority Indicator */}
                            {announcement.priority === 'high' && (
                              <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-red-500">
                                <div className="absolute -top-4 -right-1 text-white text-xs font-bold transform rotate-45">
                                  !
                                </div>
                              </div>
                            )}
                            
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex gap-3 sm:gap-4">
                                {/* Mobile-Optimized Icon Section */}
                                <div className="flex-shrink-0">
                                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${getTypeGradient(announcement.type)} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <TypeIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  {/* Mobile-Optimized Header Section */}
                                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight mb-1 group-hover:text-purple-700 transition-colors duration-200 pr-2">
                                        {announcement.title}
                                      </h3>
                                    </div>
                                    {announcement.priority === 'high' && (
                                      <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                                        <AlertCircle className="h-3 w-3" />
                                        <span className="hidden xs:inline">Urgent</span>
                                      </div>
                                    )}
                                  </div>
                            
                                  {/* Mobile-Optimized Priority Badge */}
                                  <div className="flex gap-2 mb-3">
                                    <Badge className={`${getPriorityColor(announcement.priority)} font-medium text-xs`}>
                                      {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                                      <span className="hidden xs:inline"> Priority</span>
                                    </Badge>
                                    {!viewedItems.has(announcement.id) && (
                                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs">
                                        <Eye className="h-3 w-3 mr-1" />
                                        New
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* Mobile-Optimized Content */}
                                  <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base line-clamp-3 sm:line-clamp-none">
                                    {announcement.content}
                                  </p>
                                  
                                  {/* Mobile-Optimized Action Buttons */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleLike(announcement.id)
                                        }}
                                        className={`p-2 rounded-full transition-all duration-200 ${
                                          likedItems.has(announcement.id)
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                            : 'hover:bg-gray-100 text-gray-500'
                                        }`}
                                      >
                                        <Heart className={`h-4 w-4 ${likedItems.has(announcement.id) ? 'fill-current' : ''}`} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleBookmark(announcement.id)
                                        }}
                                        className={`p-2 rounded-full transition-all duration-200 ${
                                          bookmarkedItems.has(announcement.id)
                                            ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                                            : 'hover:bg-gray-100 text-gray-500'
                                        }`}
                                      >
                                        <Bookmark className={`h-4 w-4 ${bookmarkedItems.has(announcement.id) ? 'fill-current' : ''}`} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          // Share functionality
                                          if (navigator.share) {
                                            navigator.share({
                                              title: announcement.title,
                                              text: announcement.content,
                                            })
                                          }
                                        }}
                                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-200"
                                      >
                                        <Share2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Mobile-Optimized Footer */}
                                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 text-xs text-gray-500 pt-3 border-t border-gray-200/50">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-3 w-3" />
                                      <span className="font-medium truncate">{announcement.author}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3 w-3" />
                                      <span>{new Date(announcement.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })
                  )}
                </motion.div>
              )}

            {/* Polls Tab */}
            {activeTab === 'polls' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4 sm:space-y-6"
              >
                {filteredPolls.length === 0 ? (
                  <Card className="bg-white/90 backdrop-blur-xl border-white/30 shadow-xl">
                    <CardContent className="text-center py-12 sm:py-16">
                      <div className="mb-4 sm:mb-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
                        </div>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No Active Polls</h3>
                      <p className="text-gray-600 text-sm sm:text-base">No polls are currently available. Check back later to share your opinions!</p>
                    </CardContent>
                  </Card>
                ) : (
                  polls.map((poll) => (
                    <Card key={poll.id} className="bg-white/90 backdrop-blur-xl border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-[0.98] sm:hover:scale-[1.02]">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="text-xl sm:text-2xl flex-shrink-0 mt-0.5 sm:mt-1">
                            📊
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                              <h3 className="font-bold text-gray-900 text-sm sm:text-lg leading-tight">
                                {poll.title}
                              </h3>
                              <Badge className={`${poll.hasResponded ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'} font-medium text-xs flex-shrink-0`}>
                                {poll.hasResponded ? 'Done' : 'New'}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-700 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                              {poll.description}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                              <div className="flex items-center gap-2 sm:gap-4">
                                <span>{poll.questions?.length || 0} question{(poll.questions?.length || 0) !== 1 ? 's' : ''}</span>
                                {poll.endDate && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="text-xs sm:text-sm">Ends {new Date(poll.endDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {!poll.hasResponded && (
                              <Button 
                                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium text-sm"
                                onClick={() => handlePollResponse(poll)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                                    Loading...
                                  </>
                                ) : (
                                  'Participate in Poll'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </motion.div>
            )}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile-Optimized Poll Response Modal */}
      {showPollModal && selectedPoll && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            className="bg-white rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Mobile Pull Indicator */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedPoll.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedPoll.description}</p>
                </div>
                <Button
                  onClick={() => {
                    setShowPollModal(false)
                    setSelectedPoll(null)
                    setPollResponses({})
                  }}
                  variant="ghost"
                  size="sm"
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span>{selectedPoll.questions?.length || 0} question{(selectedPoll.questions?.length || 0) !== 1 ? 's' : ''}</span>
                {selectedPoll.endDate && (
                  <span>Ends {new Date(selectedPoll.endDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedPoll.questions?.map((question, index) => (
                <div key={question.id} className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-gray-500 mt-1">{index + 1}.</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{question.text}</h4>
                      {question.required && (
                        <span className="text-xs text-red-500">* Required</span>
                      )}
                    </div>
                  </div>

                  {question.type === 'multiple_choice' && (
                    <div className="space-y-2 ml-6">
                      {question.options?.map((option: string, optionIndex: number) => (
                        <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={pollResponses[question.id] === option}
                            onChange={(e) => setPollResponses(prev => ({
                              ...prev,
                              [question.id]: e.target.value
                            }))}
                            className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'text' && (
                    <div className="ml-6">
                      <textarea
                        value={pollResponses[question.id] || ''}
                        onChange={(e) => setPollResponses(prev => ({
                          ...prev,
                          [question.id]: e.target.value
                        }))}
                        placeholder="Enter your response..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>
                  )}

                  {question.type === 'rating' && (
                    <div className="ml-6">
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setPollResponses(prev => ({
                              ...prev,
                              [question.id]: rating
                            }))}
                            className={`w-10 h-10 rounded-full border-2 font-medium text-sm transition-all ${
                              pollResponses[question.id] === rating
                                ? 'bg-purple-500 text-white border-purple-500'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-purple-300'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Poor</span>
                        <span>Excellent</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {Object.keys(pollResponses).length} of {selectedPoll.questions?.length || 0} questions answered
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      setShowPollModal(false)
                      setSelectedPoll(null)
                      setPollResponses({})
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitPollResponse}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Response
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Performance Test Results Modal */}
      {showPerformanceTest && performanceResults && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">🔍 Performance Diagnostic Results</h3>
                <Button
                  onClick={() => setShowPerformanceTest(false)}
                  variant="ghost"
                  size="sm"
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Overall Performance */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Overall Performance</h4>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    performanceResults.analysis?.overall === 'EXCELLENT' ? 'bg-green-100 text-green-700' :
                    performanceResults.analysis?.overall === 'GOOD' ? 'bg-blue-100 text-blue-700' :
                    performanceResults.analysis?.overall === 'SLOW' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {performanceResults.analysis?.overall || 'UNKNOWN'}
                  </div>
                  <span className="text-lg font-mono">{performanceResults.totalTime?.toFixed(2)}ms</span>
                </div>
              </div>

              {/* Step-by-step breakdown */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Step Breakdown</h4>
                <div className="space-y-2">
                  {performanceResults.steps?.map((step: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${step.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium capitalize">{step.step.replace(/_/g, ' ')}</span>
                        {step.count !== undefined && (
                          <span className="text-sm text-gray-600">({step.count} items)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{step.time}</span>
                        {step.error && (
                          <span className="text-red-600 text-xs">❌ {step.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {performanceResults.analysis?.recommendations?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {performanceResults.analysis.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                        <span className="text-blue-600">💡</span>
                        <span className="text-blue-800">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Environment Info */}
              {performanceResults.environment && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Environment</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Supabase URL</div>
                      <div className={`font-medium ${
                        performanceResults.environment.supabaseUrl === 'PLACEHOLDER_DETECTED' 
                          ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {performanceResults.environment.supabaseUrl}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Service Role</div>
                      <div className={`font-medium ${
                        performanceResults.environment.hasServiceRole ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {performanceResults.environment.hasServiceRole ? 'Configured' : 'Missing'}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Environment</div>
                      <div className="font-medium">{performanceResults.environment.nodeEnv}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw Data (Collapsible) */}
              <details className="border rounded-lg">
                <summary className="p-3 cursor-pointer font-medium">Raw Diagnostic Data</summary>
                <pre className="p-3 bg-gray-50 text-xs overflow-auto">
                  {JSON.stringify(performanceResults, null, 2)}
                </pre>
              </details>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
