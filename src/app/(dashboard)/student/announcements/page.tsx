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
  
  // UI state
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set())
  const [viewedItems, setViewedItems] = useState<Set<string>>(new Set())
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set())
  
  
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
    const cacheKey = 'announcements-data'
    const now = Date.now()
    const lastFetch = lastFetchTime.get(cacheKey) || 0
    const cacheExpiry = 3 * 60 * 1000 // 3 minutes cache
    
    // Return cached data if still fresh and not forcing refresh
    if (!forceRefresh && requestCache.has(cacheKey) && (now - lastFetch) < cacheExpiry) {
      const cached = requestCache.get(cacheKey)
      setAnnouncements(cached.announcements)
      setPolls(cached.polls)
      setIsLoading(false)
      return
    }
    
    try {
      // Use optimized combined endpoint
      const response = await fetch('/api/student/dashboard-data?announcements_limit=10&polls_limit=10', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
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
          polls: pollsData
        })))
        setLastFetchTime(prev => new Map(prev.set(cacheKey, now)))
      } else {
        // Fallback to individual endpoints if combined fails
        await fetchDataFallback()
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      // Fallback to individual endpoints
      await fetchDataFallback()
    } finally {
      setIsLoading(false)
    }
  }

  // Fallback method using individual endpoints
  const fetchDataFallback = async () => {
    try {
      const [announcementsResponse, pollsResponse] = await Promise.all([
        fetch('/api/student/announcements'),
        fetch('/api/polls')
      ])
      
      if (announcementsResponse.ok) {
        const result = await announcementsResponse.json()
        const announcementsData = result.data || result
        setAnnouncements(announcementsData)
      }
      
      if (pollsResponse.ok) {
        const pollsResult = await pollsResponse.json()
        const pollsData = pollsResult.polls || []
        setPolls(pollsData)
      }
      
    } catch (error) {
      console.error('Fallback fetch error:', error)
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

  // Toggle announcement expansion
  const toggleExpanded = (id: string) => {
    setExpandedAnnouncements(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

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
    <div className="min-h-screen bg-gray-50 relative">
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
      `}</style>

      {/* Simple Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => router.push('/student')} 
              variant="ghost" 
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              School Hub
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-6xl mx-auto relative z-10">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200 max-w-md mx-auto lg:mx-0">
            <div className="grid grid-cols-2 gap-1">
              <Button
                onClick={() => setActiveTab('announcements')}
                variant="ghost"
                className={`h-10 rounded-md transition-colors duration-200 ${
                  activeTab === 'announcements'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bell className="h-4 w-4 mr-2" />
                <span className="font-medium">Announcements</span>
              </Button>
              
              <Button
                onClick={() => setActiveTab('polls')}
                variant="ghost"
                className={`h-10 rounded-md transition-colors duration-200 ${
                  activeTab === 'polls'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="font-medium">Polls</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 text-sm">Loading...</p>
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
                  {announcements.length === 0 ? (
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
                            No announcements yet
                          </motion.h3>
                          <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-600 text-lg"
                          >
                            Check back later for important school updates and news!
                          </motion.p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    announcements.map((announcement: Announcement, index: number) => {
                      const TypeIcon = getTypeIcon(announcement.type)
                      return (
                        <div
                          key={announcement.id}
                          onClick={() => markAsViewed(announcement.id)}
                          className="cursor-pointer"
                        >
                          <Card className={`bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                            !viewedItems.has(announcement.id) ? 'ring-2 ring-blue-200' : ''
                          }`}>
                            
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex gap-3 sm:gap-4">
                                {/* Icon Section */}
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <TypeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  {/* Mobile-Optimized Header Section */}
                                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight mb-1">
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
                                  
                                  {/* Content with Read More */}
                                  <div className="mb-4">
                                    <p className={`text-gray-700 leading-relaxed text-sm sm:text-base ${
                                      expandedAnnouncements.has(announcement.id) ? '' : 'line-clamp-3'
                                    }`}>
                                      {announcement.content}
                                    </p>
                                    {announcement.content.length > 150 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleExpanded(announcement.id)
                                        }}
                                        className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium mt-2"
                                      >
                                        {expandedAnnouncements.has(announcement.id) ? 'Read Less' : 'Read More'}
                                      </Button>
                                    )}
                                  </div>
                                  
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
                        </div>
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
                {polls.length === 0 ? (
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

    </div>
  )
}
