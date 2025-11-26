'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Bell, BarChart3, Calendar, AlertCircle, Users, Clock, X, CheckCircle, Star, Heart, Zap, Filter, Search, Bookmark, Share2, Eye, TrendingUp, MessageCircle, ThumbsUp, Trophy, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { Input } from '@/components/ui/input'
import { ThemeLoader } from '@/components/student/ThemeLoader'
import { ShoutoutsStats } from '@/components/student/shoutouts/ShoutoutsStats'
import { AchievementBadges } from '@/components/student/shoutouts/AchievementBadges'
import { ShoutoutLeaderboard } from '@/components/student/shoutouts/ShoutoutLeaderboard'
import { supabase } from '@/lib/supabaseClient'

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
  poll_questions?: any[]
  endDate?: string
  end_date?: string
  hasResponded: boolean
  allowMultipleResponses?: boolean
  type?: string
}

interface ShoutOut {
  id: string
  student_id: string
  student_name: string
  category: string
  message: string
  teacher_name: string
  created_at: string
  badge?: string
  is_public: boolean
}

export default function StudentAnnouncementsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [shoutOuts, setShoutOuts] = useState<ShoutOut[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingShoutOuts, setLoadingShoutOuts] = useState(false)
  const [activeTab, setActiveTab] = useState<'announcements' | 'polls' | 'shoutouts'>('announcements')

  // UI state
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set())
  const [viewedItems, setViewedItems] = useState<Set<string>>(new Set())
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Pagination state - show 5 items initially
  const [displayedAnnouncementsCount, setDisplayedAnnouncementsCount] = useState(5)
  const [displayedPollsCount, setDisplayedPollsCount] = useState(5)
  const [displayedShoutoutsCount, setDisplayedShoutoutsCount] = useState(5)

  // Poll modal state
  const [showPollModal, setShowPollModal] = useState(false)
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [pollResponses, setPollResponses] = useState<{ [key: string]: any }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id)
      }
    })
  }, [])

  // Cache for preventing duplicate requests
  const [requestCache, setRequestCache] = useState<Map<string, any>>(new Map())
  const [lastFetchTime, setLastFetchTime] = useState<Map<string, number>>(new Map())

  // Fallback method using individual endpoints
  const fetchDataFallback = useCallback(async () => {
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
        console.log('📊 Polls API response:', pollsResult)
        const pollsData = pollsResult.polls || pollsResult || []
        console.log('📊 Extracted polls data:', pollsData)
        setPolls(pollsData)
      } else {
        console.error('❌ Polls fetch failed:', pollsResponse.status, pollsResponse.statusText)
      }

    } catch (error) {
      console.error('Fallback fetch error:', error)
    }
  }, [])

  const fetchData = useCallback(async (forceRefresh = false) => {
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
        let pollsData: Poll[] = []

        // Always fetch from dedicated endpoint since dashboard-data is unreliable for polls
        try {
          const pollsResponse = await fetch('/api/polls')
          if (pollsResponse.ok) {
            const pollsResult = await pollsResponse.json()
            pollsData = pollsResult.polls || pollsResult || []

            if (pollsData.length > 0) {
              // Optional: Toast to confirm polls loaded (can be removed later)
              // addToast({ title: 'Polls Loaded', description: `Found ${pollsData.length} active polls`, variant: 'success' })
            }
          }
        } catch (e) {
          console.error('Error fetching polls:', e)
        }

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
        console.log('⚠️ Dashboard data fetch failed, using fallback...')
        await fetchDataFallback()
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      // Fallback to individual endpoints
      console.log('⚠️ Dashboard data error, using fallback...')
      await fetchDataFallback()
    } finally {
      setIsLoading(false)
    }
  }, [requestCache, lastFetchTime, fetchDataFallback])



  // Fetch class shout-outs with caching
  const fetchShoutOuts = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'shoutouts-data'
    const now = Date.now()
    const lastFetch = lastFetchTime.get(cacheKey) || 0
    const cacheExpiry = 3 * 60 * 1000 // 3 minutes cache

    // Return cached data if still fresh and not forcing refresh
    if (!forceRefresh && requestCache.has(cacheKey) && (now - lastFetch) < cacheExpiry) {
      const cached = requestCache.get(cacheKey)
      setShoutOuts(cached)
      return
    }

    try {
      setLoadingShoutOuts(true)
      const response = await fetch('/api/student/class-shoutouts', {
        next: { revalidate: 180 } // Cache for 3 minutes
      })

      if (response.ok) {
        const data = await response.json()
        const shoutOutsData = data.shoutOuts || []
        setShoutOuts(shoutOutsData)

        // Cache the results
        setRequestCache(prev => new Map(prev.set(cacheKey, shoutOutsData)))
        setLastFetchTime(prev => new Map(prev.set(cacheKey, now)))
      }
    } catch (error) {
      console.error('Error fetching shout-outs:', error)
    } finally {
      setLoadingShoutOuts(false)
    }
  }, [requestCache, lastFetchTime])



  // Mount effect
  useEffect(() => {
    fetchData()
    fetchShoutOuts()
  }, [fetchData, fetchShoutOuts])

  // Calculate shoutout stats for gamification - ONLY for current user
  const shoutoutStats = useMemo(() => {
    // Filter to get only current user's shoutouts
    const myShoutouts = shoutOuts.filter(s => s.student_id === currentUserId)

    const categoryBreakdown: { [key: string]: number } = {}
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    let thisWeekCount = 0

    myShoutouts.forEach(shoutout => {
      // Category breakdown
      const category = shoutout.category.toLowerCase()
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1

      // This week count
      if (new Date(shoutout.created_at) >= oneWeekAgo) {
        thisWeekCount++
      }
    })

    // Calculate streak (simplified - consecutive days with shoutouts)
    const sortedDates = myShoutouts
      .map(s => new Date(s.created_at).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    let streak = 0
    const today = new Date().toDateString()
    if (sortedDates[0] === today || sortedDates[0] === new Date(Date.now() - 86400000).toDateString()) {
      streak = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i])
        const prevDate = new Date(sortedDates[i - 1])
        const dayDiff = (prevDate.getTime() - currentDate.getTime()) / 86400000
        if (dayDiff === 1) {
          streak++
        } else {
          break
        }
      }
    }

    return {
      total: myShoutouts.length,
      categoryBreakdown,
      currentStreak: streak,
      thisWeek: thisWeekCount
    }
  }, [shoutOuts, currentUserId])

  // Calculate real leaderboard from shoutouts data
  const leaderboard = useMemo(() => {
    // Count shoutouts per student
    const studentCounts: { [studentId: string]: { name: string, count: number } } = {}

    shoutOuts.forEach(shoutout => {
      const id = shoutout.student_id
      if (!studentCounts[id]) {
        studentCounts[id] = {
          name: shoutout.student_name,
          count: 0
        }
      }
      studentCounts[id].count++
    })

    // Convert to array and sort by count
    const rankedStudents = Object.entries(studentCounts)
      .map(([id, data]) => ({
        studentId: id,
        studentName: data.name,
        shoutoutCount: data.count
      }))
      .sort((a, b) => b.shoutoutCount - a.shoutoutCount)

    // Add rank and change indicators
    return rankedStudents.slice(0, 10).map((student, index) => ({
      rank: index + 1,
      studentName: student.studentName,
      shoutoutCount: student.shoutoutCount,
      change: index < 3 ? Math.floor(Math.random() * 3) - 1 : 0, // Mock change for top 3
      isCurrentUser: currentUserId === student.studentId
    }))
  }, [shoutOuts, currentUserId])

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
  const toggleExpanded = useCallback((id: string) => {
    setExpandedAnnouncements(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // Interactive functions
  const toggleBookmark = useCallback((id: string) => {
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
  }, [addToast])

  const toggleLike = useCallback((id: string) => {
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
  }, [addToast])

  const markAsViewed = useCallback((id: string) => {
    setViewedItems(prev => {
      const newSet = new Set(prev)
      newSet.add(id)
      return newSet
    })
  }, [])

  // Handle poll response
  const handlePollResponse = useCallback((poll: Poll) => {
    setSelectedPoll(poll)
    setShowPollModal(true)
    setPollResponses({}) // Reset responses
  }, [])

  // Submit poll response
  const submitPollResponse = useCallback(async () => {
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
  }, [selectedPoll, isSubmitting, pollResponses, addToast])

  return (
    <>
      <ThemeLoader />
      <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        {/* Professional Geometric Pattern Overlay */}
        <div
          className="fixed inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              repeating-linear-gradient(45deg, transparent 0px, transparent 20px, rgba(0, 0, 0, 0.02) 20px, rgba(0, 0, 0, 0.02) 21px),
              repeating-linear-gradient(-45deg, transparent 0px, transparent 20px, rgba(0, 0, 0, 0.02) 20px, rgba(0, 0, 0, 0.02) 21px)
            `,
            backgroundSize: '200% 200%, 200% 200%, 40px 40px, 40px 40px'
          }}
        />

        {/* Subtle Grid Pattern */}
        <svg className="fixed inset-0 w-full h-full opacity-[0.025] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

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

        {/* Themed Header */}
        <header
          className="sticky top-0 z-50 shadow-md backdrop-blur-md"
          style={{
            background: 'linear-gradient(to right, var(--theme-highlight), var(--theme-tertiary))',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="px-4 py-4 sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push('/student')}
                variant="ghost"
                size="sm"
                className="p-2 rounded-lg transition-all duration-200"
                style={{
                  color: 'var(--theme-primary)',
                  background: 'rgba(255, 255, 255, 0.9)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
                }}
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <h1 className="text-lg sm:text-xl sm:text-2xl font-bold" style={{ color: 'var(--theme-primary)' }}>
                School Hub
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-6xl mx-auto relative z-10">
          {/* Tabs - Professional Mobile Design */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex gap-2 sm:gap-3 overflow-x-auto">
                <Button
                  onClick={() => setActiveTab('announcements')}
                  variant="ghost"
                  className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                  style={{
                    background: activeTab === 'announcements'
                      ? 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))'
                      : 'transparent',
                    color: activeTab === 'announcements' ? 'white' : 'var(--theme-primary)',
                    boxShadow: activeTab === 'announcements' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span>Announcements</span>
                </Button>

                <Button
                  onClick={() => setActiveTab('shoutouts')}
                  variant="ghost"
                  className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                  style={{
                    background: activeTab === 'shoutouts'
                      ? 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))'
                      : 'transparent',
                    color: activeTab === 'shoutouts' ? 'white' : 'var(--theme-primary)',
                    boxShadow: activeTab === 'shoutouts' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span>Shout-Outs</span>
                </Button>

                <Button
                  onClick={() => setActiveTab('polls')}
                  variant="ghost"
                  className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                  style={{
                    background: activeTab === 'polls'
                      ? 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))'
                      : 'transparent',
                    color: activeTab === 'polls' ? 'white' : 'var(--theme-primary)'
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span>Polls</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="text-center py-12">
                <div
                  className="w-8 h-8 border-2 rounded-full mx-auto mb-4 animate-spin"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
                    borderTopColor: 'var(--theme-primary)'
                  }}
                />
                <p className="text-gray-600 text-sm">Loading...</p>
              </div>
            ) : (
              <>
                {/* Announcements Tab */}
                {activeTab === 'announcements' && (
                  <div className="space-y-6">
                    {announcements.length === 0 ? (
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="text-center py-16">
                          <div className="mb-6">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Bell className="h-10 w-10 text-blue-600" />
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            No announcements yet
                          </h3>
                          <p className="text-gray-600">
                            Check back later for important school updates and news!
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {announcements.slice(0, displayedAnnouncementsCount).map((announcement: Announcement, index: number) => {
                          const TypeIcon = getTypeIcon(announcement.type)
                          return (
                            <div
                              key={announcement.id}
                              onClick={() => markAsViewed(announcement.id)}
                              className="cursor-pointer"
                            >
                              <Card className={`bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${!viewedItems.has(announcement.id) ? 'ring-2 ring-blue-200' : ''
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
                                        <p className={`text-gray-700 leading-relaxed text-sm sm:text-base ${expandedAnnouncements.has(announcement.id) ? '' : 'line-clamp-3'
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
                                            className={`p-2 rounded-full transition-all duration-200 ${likedItems.has(announcement.id)
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
                                            className={`p-2 rounded-full transition-all duration-200 ${bookmarkedItems.has(announcement.id)
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
                        })}

                        {/* Load More Button for Announcements */}
                        {announcements.length > displayedAnnouncementsCount && (
                          <div className="flex justify-center pt-4">
                            <Button
                              onClick={() => setDisplayedAnnouncementsCount(prev => prev + 5)}
                              variant="outline"
                              className="w-full sm:w-auto"
                            >
                              Load More Announcements ({announcements.length - displayedAnnouncementsCount} remaining)
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Shout-Outs Tab */}
                {activeTab === 'shoutouts' && (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Inspirational Banner */}
                    <Card className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 border-0 shadow-lg">
                      <CardContent className="p-4 sm:p-5 sm:p-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
                          <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-200 fill-yellow-200 animate-pulse" />
                          <h3 className="text-base sm:text-lg sm:text-xl font-bold text-white leading-tight">Every Shoutout is Recognition of Your Hard Work!</h3>
                          <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-200 fill-yellow-200 animate-pulse" />
                        </div>
                        <p className="text-xs sm:text-sm sm:text-base text-white/90">Keep shining and your efforts will be celebrated! 🌟</p>
                      </CardContent>
                    </Card>

                    {/* Class Shout-Outs Section */}
                    <div className="space-y-4 sm:space-y-5">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-1.5 sm:p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white">
                            <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <h2 className="text-base sm:text-lg sm:text-xl font-bold text-gray-900">✨ Class Recognitions</h2>
                        </div>
                        {!loadingShoutOuts && shoutOuts.length > 0 && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold text-xs sm:text-sm">
                            {shoutOuts.length} shout-outs
                          </Badge>
                        )}
                      </div>

                      {loadingShoutOuts ? (
                        <Card className="bg-white border border-slate-200 shadow-sm">
                          <CardContent className="text-center py-12 sm:py-16">
                            <div
                              className="w-8 h-8 border-2 rounded-full mx-auto mb-4 animate-spin"
                              style={{
                                borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
                                borderTopColor: 'var(--theme-primary)'
                              }}
                            />
                            <p className="text-gray-600 text-sm">Loading shout-outs...</p>
                          </CardContent>
                        </Card>
                      ) : shoutOuts.length === 0 ? (
                        <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg">
                          <CardContent className="text-center py-12 sm:py-16 px-6">
                            <div className="mb-6">
                              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Star className="h-12 w-12 sm:h-14 sm:w-14 text-white fill-white" />
                              </div>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                              🌟 Your Shoutout Journey Starts Here! 🌟
                            </h3>
                            <p className="text-gray-700 text-sm sm:text-base mb-6 max-w-2xl mx-auto">
                              Teachers recognize students who shine! Here's how you can earn your first shoutouts:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto text-left">
                              <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                                    <Star className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm">Participate Actively</p>
                                    <p className="text-xs text-gray-600">Raise your hand, ask questions, share ideas</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-pink-500 rounded-lg flex-shrink-0">
                                    <Heart className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm">Show Kindness</p>
                                    <p className="text-xs text-gray-600">Help classmates, be respectful, spread positivity</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                                    <Trophy className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm">Complete Assignments</p>
                                    <p className="text-xs text-gray-600">Submit quality work, meet deadlines</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                                    <Sparkles className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm">Think Creatively</p>
                                    <p className="text-xs text-gray-600">Bring unique ideas, solve problems innovatively</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 font-semibold text-base sm:text-lg mt-6">
                              Keep working hard - your first shoutout is coming soon! 🚀
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          {/* Gamification Section */}
                          <ShoutoutsStats
                            totalShoutouts={shoutoutStats.total}
                            categoryBreakdown={shoutoutStats.categoryBreakdown}
                            currentStreak={shoutoutStats.currentStreak}
                            thisWeek={shoutoutStats.thisWeek}
                          />

                          <AchievementBadges
                            totalShoutouts={shoutoutStats.total}
                            categoryBreakdown={shoutoutStats.categoryBreakdown}
                          />

                          <ShoutoutLeaderboard leaderboard={leaderboard} />

                          {/* Shout-Out Cards Section */}
                          <div>
                            <h3 className="text-base font-bold text-slate-900 mb-3">Recent Recognitions</h3>
                            {shoutOuts.slice(0, displayedShoutoutsCount).map((shoutOut) => {
                              const categoryColors = {
                                academic: 'from-blue-500 to-indigo-500 border-blue-200',
                                behavior: 'from-green-500 to-emerald-500 border-green-200',
                                kindness: 'from-pink-500 to-rose-500 border-pink-200',
                                effort: 'from-orange-500 to-amber-500 border-orange-200',
                                leadership: 'from-purple-500 to-violet-500 border-purple-200',
                                creativity: 'from-yellow-500 to-amber-500 border-yellow-200'
                              }
                              const gradient = categoryColors[shoutOut.category as keyof typeof categoryColors] || 'from-gray-500 to-gray-600'

                              return (
                                <Card key={shoutOut.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all mb-3">
                                  <CardContent className="p-4 sm:p-6">
                                    <div className="flex gap-3 sm:gap-4">
                                      <div className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center text-2xl sm:text-3xl shadow-lg`}>
                                        {shoutOut.badge || '⭐'}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                          <div>
                                            <h3 className="font-bold text-gray-900 text-base sm:text-lg">{shoutOut.student_name}</h3>
                                            <Badge className={`mt-1 capitalize border bg-gradient-to-r ${gradient.split(' ')[0]} ${gradient.split(' ')[1]} text-white`}>
                                              {shoutOut.category}
                                            </Badge>
                                          </div>
                                          <div className="text-xs sm:text-sm text-gray-500">
                                            {new Date(shoutOut.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          </div>
                                        </div>

                                        <p className="text-gray-700 leading-relaxed mb-3 text-sm sm:text-base">{shoutOut.message}</p>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                            <Users className="h-4 w-4" />
                                            <span className="font-medium">by {shoutOut.teacher_name}</span>
                                          </div>
                                          {shoutOut.is_public && (
                                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Public
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            })}

                            {/* Load More Button for Shoutouts */}
                            {shoutOuts.length > displayedShoutoutsCount && (
                              <div className="flex justify-center pt-4">
                                <Button
                                  onClick={() => setDisplayedShoutoutsCount(prev => prev + 5)}
                                  variant="outline"
                                  className="w-full sm:w-auto"
                                >
                                  Load More Shoutouts ({shoutOuts.length - displayedShoutoutsCount} remaining)
                                </Button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Polls Tab */}
                {activeTab === 'polls' && (
                  <div className="space-y-4 sm:space-y-6">
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
                                    <span>{poll.poll_questions?.length || 0} question{(poll.poll_questions?.length || 0) !== 1 ? 's' : ''}</span>
                                    {poll.end_date && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="text-xs sm:text-sm">Ends {new Date(poll.end_date).toLocaleDateString('en-US', {
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
                  </div>
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
                              className={`w-10 h-10 rounded-full border-2 font-medium text-sm transition-all ${pollResponses[question.id] === rating
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
    </>
  )
}
