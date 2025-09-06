'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { handleError } from '@/lib/utils/errorHandling'
import { supabase } from '@/lib/supabaseClient'
import { Users, Heart, AlertTriangle, TrendingUp, Calendar, MessageSquare, BookOpen, Star, Trophy, Target, AlertCircle, Bell, Shield, Sparkles, Award, Zap, Crown, Gift } from 'lucide-react'
import Link from 'next/link'
import { MessagingNavButton } from '@/components/ui/messaging-nav-button'

interface ChildProgress {
  id: string
  first_name: string
  last_name: string
  xp: number
  level: number
  gems: number
  streak_days: number
  total_quests_completed: number
  pet_happiness: number
  pet_name: string
  grade_level?: string
  class_name?: string
  school_name?: string
}

interface HelpRequest {
  id: string
  message: string
  urgency: string
  status: string
  created_at: string
  student: {
    first_name: string
  }
}

function ParentDashboardContent() {
  const dispatch = useAppDispatch()
  const { user, profile, isLoading } = useAppSelector((state) => state.auth)
  const [children, setChildren] = useState<ChildProgress[]>([])
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()

  useEffect(() => {
    if (user && !profile) {
      dispatch(fetchProfile(user.id))
    }
    if (user) {
      fetchChildrenData()
    }
  }, [user, profile, dispatch])

  const handleAcknowledgeRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('help_requests')
        .update({ status: 'acknowledged' })
        .eq('id', requestId)

      if (error) {
        throw new Error(`Failed to acknowledge request: ${error.message}`)
      }

      addToast({
        type: 'success',
        title: 'Request Acknowledged',
        description: 'Help request has been acknowledged'
      })

      // Refresh help requests
      fetchChildrenData()
    } catch (error) {
      const appError = handleError(error, 'acknowledge help request')
      addToast({
        type: 'error',
        title: 'Failed to Acknowledge',
        description: appError.message
      })
    }
  }

  const fetchChildrenData = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Fetch children using correct foreign key relationship
      const { data: childrenData, error: childrenError } = await supabase
        .from('parent_child_relationships')
        .select(`
          child_id,
          child_profile:profiles!child_id(
            id,
            user_id,
            first_name,
            last_name,
            xp,
            gems,
            level,
            streak_days,
            total_quests_completed,
            pet_happiness,
            pet_name,
            grade_level,
            class_name,
            school_id,
            schools(name)
          )
        `)
        .eq('parent_id', user?.id)

      if (childrenError) {
        throw new Error(`Failed to fetch children: ${childrenError.message}`)
      }

      // Transform the data to match ChildProgress interface
      const transformedChildren = childrenData?.map(item => {
        const profile = Array.isArray(item.child_profile) ? item.child_profile[0] : item.child_profile;
        return {
          id: profile?.id || item.child_id,
          first_name: profile?.first_name || 'Unknown',
          last_name: profile?.last_name || 'Student',
          xp: profile?.xp || 0,
          level: profile?.level || 1,
          gems: profile?.gems || 0,
          streak_days: profile?.streak_days || 0,
          total_quests_completed: profile?.total_quests_completed || 0,
          pet_happiness: profile?.pet_happiness || 85,
          pet_name: profile?.pet_name || 'Whiskers',
          grade_level: profile?.grade_level,
          class_name: profile?.class_name,
          school_name: (profile?.schools as any)?.name || 'Unknown School'
        };
      }) || []
      
      setChildren(transformedChildren)

      // Fetch help requests for all children
      const childIds = childrenData?.map(child => child.child_id) || []
      if (childIds.length > 0) {
        const { data: requestsData, error: requestsError } = await supabase
          .from('help_requests')
          .select('*')
          .in('student_id', childIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (requestsError) {
          throw new Error(`Failed to fetch help requests: ${requestsError.message}`)
        }
        
        setHelpRequests(requestsData || [])
      }
    } catch (error) {
      const appError = handleError(error, 'parent dashboard data fetch')
      setError(appError.message)
      addToast({
        type: 'error',
        title: 'Failed to Load Data',
        description: appError.message
      })
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !profile || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Animated Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between space-y-4 sm:space-y-0">
              <div className="text-center sm:text-left">
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 flex items-center justify-center sm:justify-start gap-2 sm:gap-3"
                >
                  <Crown className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-yellow-300" />
                  Parent Dashboard
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-purple-100 text-sm sm:text-base lg:text-lg"
                >
                  Monitor your children's well-being journey and celebrate their achievements
                </motion.p>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <MessagingNavButton userRole="parent" variant="ghost" className="text-white hover:bg-white/20" />
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="text-4xl sm:text-5xl lg:text-6xl"
                >
                  👨‍👩‍👧‍👦
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Children Progress Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          {children.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border-2 border-transparent hover:border-purple-200 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg">
                    {child.first_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 truncate">
                      {child.first_name} {child.last_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {child.grade_level} • {child.school_name}
                    </p>
                  </div>
                </div>
                <div className="text-2xl">
                  {child.level >= 10 ? '🏆' : child.level >= 5 ? '⭐' : '🌟'}
                </div>
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">{child.level}</div>
                  <div className="text-xs text-blue-500">Level</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{child.xp}</div>
                  <div className="text-xs text-green-500">XP Points</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">{child.gems}</div>
                  <div className="text-xs text-yellow-500">Mind Gems</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">{child.streak_days}</div>
                  <div className="text-xs text-purple-500">Day Streak</div>
                </div>
              </div>

              {/* Pet Companion */}
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl">🐱</div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{child.pet_name}</div>
                      <div className="text-xs text-gray-600">Pet Companion</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-orange-600">{child.pet_happiness}%</div>
                    <div className="text-xs text-orange-500">Happiness</div>
                  </div>
                </div>
                <div className="mt-2 bg-white rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-pink-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${child.pet_happiness}%` }}
                  />
                </div>
              </div>

              {/* Achievement Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {child.total_quests_completed} Quests Completed
                  </span>
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  View Details
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
        {/* Help Requests Alert */}
        {helpRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <Card className="mb-8 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-red-800">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <AlertCircle className="h-6 w-6 mr-3 text-red-500" />
                  </motion.div>
                  Urgent: Help Requests Pending
                </CardTitle>
                <CardDescription className="text-red-600">
                  {helpRequests.length} of your children need support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {helpRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-800">{request.student?.first_name}</span>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            request.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                            request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                            request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {request.urgency} priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate max-w-md">{request.message}</p>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handleAcknowledgeRequest(request.id)}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="w-8 h-8" />
              <div className="text-3xl">💬</div>
            </div>
            <h3 className="font-bold text-lg mb-2">Communication</h3>
            <p className="text-blue-100 text-sm">Chat with teachers and school staff</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8" />
              <div className="text-3xl">📅</div>
            </div>
            <h3 className="font-bold text-lg mb-2">Schedule</h3>
            <p className="text-green-100 text-sm">View upcoming events and meetings</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8" />
              <div className="text-3xl">📚</div>
            </div>
            <h3 className="font-bold text-lg mb-2">Resources</h3>
            <p className="text-purple-100 text-sm">Parenting guides and support materials</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-8 h-8" />
              <div className="text-3xl">🛡️</div>
            </div>
            <h3 className="font-bold text-lg mb-2">Safety</h3>
            <p className="text-orange-100 text-sm">Digital citizenship and safety tools</p>
          </motion.div>
        </motion.div>

        {/* Family Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="bg-white rounded-2xl p-8 shadow-xl mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Family Insights</h2>
                <p className="text-gray-600">Weekly well-being summary</p>
              </div>
            </div>
            <div className="text-4xl">📊</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-600 font-semibold">Overall Progress</span>
                <div className="text-2xl">📈</div>
              </div>
              <div className="text-3xl font-bold text-green-700 mb-1">Excellent</div>
              <div className="text-sm text-green-600">All children are thriving</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-600 font-semibold">Engagement</span>
                <div className="text-2xl">🎯</div>
              </div>
              <div className="text-3xl font-bold text-blue-700 mb-1">92%</div>
              <div className="text-sm text-blue-600">Daily quest completion</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-600 font-semibold">Well-being</span>
                <div className="text-2xl">💖</div>
              </div>
              <div className="text-3xl font-bold text-purple-700 mb-1">Happy</div>
              <div className="text-sm text-purple-600">Average mood this week</div>
            </div>
          </div>
        </motion.div>

        {/* Children Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8"
        >
          {children.map((child) => (
            <Card key={child.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  {child.first_name}
                </CardTitle>
                <CardDescription>Well-being Progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Level</span>
                    <span className="font-semibold">{child.level}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">XP</span>
                    <span className="font-semibold">{child.xp}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Gems</span>
                    <span className="font-semibold">{child.gems}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(child.xp % 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Analytics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Weekly Progress</p>
                  <p className="text-2xl font-bold text-gray-900">+15%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-pink-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Kindness Acts</p>
                  <p className="text-2xl font-bold text-gray-900">23</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Courage Entries</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Streaks</p>
                  <p className="text-2xl font-bold text-gray-900">5 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resources and Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Parenting Resources</CardTitle>
              <CardDescription>Tips to support your child's well-being</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">Encourage Open Communication</h4>
                  <p className="text-sm text-green-700">Create safe spaces for your child to share their feelings</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">Celebrate Small Wins</h4>
                  <p className="text-sm text-blue-700">Acknowledge their progress in building positive habits</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800">Model Gratitude</h4>
                  <p className="text-sm text-purple-700">Share what you're grateful for to inspire them</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communication Tools</CardTitle>
              <CardDescription>Stay connected with your child's school</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" variant="outline">
                  Message Teacher
                </Button>
                <Button className="w-full" variant="outline">
                  Schedule Conference
                </Button>
                <Button className="w-full" variant="outline">
                  View School Updates
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default function ParentDashboard() {
  return (
    <AuthGuard requiredRole="parent">
      <ParentDashboardContent />
    </AuthGuard>
  )
}
