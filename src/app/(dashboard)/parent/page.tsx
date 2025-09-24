'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  BookOpen, 
  Shield, 
  TrendingUp, 
  Trophy,
  AlertCircle,
  Clock,
  X,
  School
} from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { handleError } from '@/lib/utils/errorHandling'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'

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
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showResourcesModal, setShowResourcesModal] = useState(false)
  const [showSafetyModal, setShowSafetyModal] = useState(false)
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

      fetchChildrenData()
    } catch (error: any) {
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
    } catch (error: any) {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-full animate-spin opacity-20"></div>
            <div className="absolute inset-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 rounded-full animate-pulse"></div>
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Loading Family Hub
          </h2>
          <p className="text-slate-600 font-medium">Preparing your children's progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-r from-emerald-400/25 to-teal-400/25 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Glassmorphism Header */}
        <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl mb-8 overflow-hidden">
          <div className="px-8 py-8 sm:px-10 sm:py-10">
            {/* Glassmorphism Header */}
            <div className="flex items-center space-x-6 mb-10">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400/80 to-purple-500/80 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
                  {profile?.first_name ? (
                    <span className="text-2xl font-bold text-white drop-shadow-lg">
                      {profile.first_name.charAt(0)}{profile.last_name?.charAt(0) || ''}
                    </span>
                  ) : (
                    <Users className="w-10 h-10 text-white drop-shadow-lg" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-green-500 border-3 border-white rounded-full shadow-lg animate-pulse"></div>
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce delay-500"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  {profile?.first_name ? (
                    <>Welcome back, {profile.first_name}! ✨</>
                  ) : (
                    'Family Dashboard 🏠'
                  )}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-white/90">
                  {children.length > 0 && children[0]?.school_name && (
                    <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                      <span className="text-lg">🏫</span>
                      <span className="font-medium">{children[0].school_name}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                    <span className="text-lg">👨‍👩‍👧‍👦</span>
                    <span className="font-medium">
                      {children.length > 0 
                        ? `${children.length} ${children.length === 1 ? 'child' : 'children'} enrolled`
                        : 'Ready to add children'
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                    <span className="text-lg">⏰</span>
                    <span className="font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Glassmorphism Quick Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="group backdrop-blur-xl bg-white/15 border border-white/20 rounded-2xl p-6 hover:bg-white/25 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-xl backdrop-blur-sm border border-white/20">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl">👨‍👩‍👧‍👦</div>
                </div>
                <div className="text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-transform duration-300">
                  {children.length}
                </div>
                <div className="text-white/80 font-medium">Active Children</div>
                <div className="text-xs text-white/60 mt-1">Enrolled & Learning</div>
              </div>
              
              <div className="group backdrop-blur-xl bg-white/15 border border-white/20 rounded-2xl p-6 hover:bg-white/25 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-xl backdrop-blur-sm border border-white/20">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl">📈</div>
                </div>
                <div className="text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-transform duration-300">
                  {children.length > 0 ? Math.round(children.reduce((sum, child) => sum + child.level, 0) / children.length) : 0}
                </div>
                <div className="text-white/80 font-medium">Average Level</div>
                <div className="text-xs text-white/60 mt-1">Academic Progress</div>
              </div>
              
              <div className="group backdrop-blur-xl bg-white/15 border border-white/20 rounded-2xl p-6 hover:bg-white/25 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-rose-400/30 to-pink-400/30 rounded-xl backdrop-blur-sm border border-white/20">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl">{helpRequests.length > 0 ? '🚨' : '✅'}</div>
                </div>
                <div className="text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-transform duration-300">
                  {helpRequests.length}
                </div>
                <div className="text-white/80 font-medium">Active Alerts</div>
                <div className="text-xs text-white/60 mt-1">{helpRequests.length > 0 ? 'Needs Attention' : 'All Good!'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Glassmorphism Children Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
          {children.map((child, index) => (
            <div
              key={child.id}
              className="group backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl hover:shadow-3xl hover:bg-white/15 transition-all duration-500 overflow-hidden hover:-translate-y-2 hover:scale-105"
            >
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative p-8">
                {/* Glassmorphism Child Header */}
                <div className="flex items-center space-x-5 mb-8">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-400/80 to-purple-500/80 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-2xl border border-white/30 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-xl font-bold text-white drop-shadow-lg">
                        {child.first_name.charAt(0)}
                      </span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-green-500 border-3 border-white rounded-full shadow-lg animate-pulse"></div>
                    <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce delay-300"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-2xl text-white mb-2 drop-shadow-lg group-hover:text-yellow-200 transition-colors duration-300">
                      {child.first_name} {child.last_name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                        <span className="text-sm">📚</span>
                        <span className="text-white/90 text-sm font-medium">{child.grade_level}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                        <span className="text-sm">🏆</span>
                        <span className="text-white/90 text-sm font-medium">Level {child.level}</span>
                      </div>
                    </div>
                    <div className="text-white/70 text-sm mt-2 truncate">{child.school_name}</div>
                  </div>
                </div>

                {/* Glassmorphism Progress Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-5 hover:bg-white/30 transition-all duration-300 group/stat">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-lg backdrop-blur-sm">
                        <span className="text-lg">⚡</span>
                      </div>
                      <div className="text-xs text-white/60 font-medium uppercase tracking-wider">Experience</div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1 group-hover/stat:scale-110 transition-transform duration-300">
                      {child.xp.toLocaleString()}
                    </div>
                    <div className="text-white/80 font-medium">XP Points</div>
                  </div>
                  
                  <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-5 hover:bg-white/30 transition-all duration-300 group/stat">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-lg backdrop-blur-sm">
                        <span className="text-lg">💎</span>
                      </div>
                      <div className="text-xs text-white/60 font-medium uppercase tracking-wider">Rewards</div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1 group-hover/stat:scale-110 transition-transform duration-300">
                      {child.gems.toLocaleString()}
                    </div>
                    <div className="text-white/80 font-medium">Mind Gems</div>
                  </div>
                </div>

                {/* Glassmorphism Pet Companion */}
                <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 mb-8 hover:bg-white/30 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl animate-bounce">🐱</div>
                      <div>
                        <div className="font-bold text-white text-lg">
                          {child.pet_name || 'Buddy'}
                        </div>
                        <div className="text-white/70 text-sm">Digital Companion</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white mb-1">
                        {child.pet_happiness}%
                      </div>
                      <div className="text-white/80 text-sm font-medium">Happiness</div>
                    </div>
                  </div>
                  <div className="bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/30">
                    <div 
                      className="bg-gradient-to-r from-pink-400 to-purple-500 h-3 rounded-full transition-all duration-1000 shadow-lg"
                      style={{ width: `${child.pet_happiness}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/60 mt-2">
                    <span>Needs Care</span>
                    <span>Thriving</span>
                  </div>
                </div>

                {/* Glassmorphism Achievement Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-xl backdrop-blur-sm border border-white/30">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xl">
                        {child.total_quests_completed}
                      </div>
                      <div className="text-white/80 font-medium">Quests Mastered</div>
                      <div className="text-white/60 text-xs">Learning Adventures</div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="backdrop-blur-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    <span className="mr-2">📊</span>
                    View Progress
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Premium Help Requests Alert */}
        {helpRequests.length > 0 && (
          <div className="bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 border border-rose-200/50 rounded-3xl p-6 sm:p-8 mb-12 shadow-xl">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl shadow-lg mr-4">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-800 mb-1">Attention Required</h3>
                <p className="text-slate-600 font-medium">Your children need support</p>
              </div>
              <div className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                {helpRequests.length} Alert{helpRequests.length > 1 ? 's' : ''}
              </div>
            </div>
            <div className="space-y-4">
              {helpRequests.map((request) => (
                <div key={request.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-bold text-slate-800 text-lg">{request.student?.first_name}</span>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          request.urgency === 'urgent' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' :
                          request.urgency === 'high' ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white' :
                          request.urgency === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' :
                          'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                        }`}>
                          {request.urgency.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium">{request.message}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold px-6 ml-4"
                      onClick={() => handleAcknowledgeRequest(request.id)}
                    >
                      Respond
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Google-Style Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/parent/messaging">
            <div className="bg-white rounded-lg border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="font-medium text-lg text-gray-900 mb-2">Messages</h3>
              <p className="text-sm text-gray-600">Connect with teachers and school</p>
            </div>
          </Link>

          <div
            onClick={() => setShowScheduleModal(true)}
            className="bg-white rounded-lg border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-50 rounded-lg mr-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="font-medium text-lg text-gray-900 mb-2">Schedule</h3>
            <p className="text-sm text-gray-600">View events and meetings</p>
          </div>

          <div
            onClick={() => setShowResourcesModal(true)}
            className="bg-white rounded-lg border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-50 rounded-lg mr-3">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="font-medium text-lg text-gray-900 mb-2">Resources</h3>
            <p className="text-sm text-gray-600">Educational materials</p>
          </div>

          <div
            onClick={() => setShowSafetyModal(true)}
            className="bg-white rounded-lg border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <div className="p-2 bg-orange-50 rounded-lg mr-3">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="font-medium text-lg text-gray-900 mb-2">Safety</h3>
            <p className="text-sm text-gray-600">Digital wellness tools</p>
          </div>
        </div>

        {/* Premium Family Overview */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8 mb-12 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-1 rounded-2xl mb-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center space-x-5">
                <div className="p-4 bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl shadow-lg">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-1">
                    Family Insights
                  </h2>
                  <p className="text-slate-600 text-lg font-medium">Your family's journey to excellence</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="group relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-3xl p-6 border border-emerald-100/50 hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Progress</div>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent mb-2">
                  {children.length > 0 ? (
                    children.every(child => child.level >= 3) ? 'Excellent' : 
                    children.some(child => child.level >= 2) ? 'Good' : 'Growing'
                  ) : 'No Data'}
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  {children.length > 0 ? `${children.length} ${children.length === 1 ? 'child' : 'children'} thriving` : 'Add children to see progress'}
                </div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-3xl p-6 border border-indigo-100/50 hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Engagement</div>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent mb-2">
                  {children.length > 0 ? (
                    Math.round((children.reduce((sum, child) => sum + (child.total_quests_completed || 0), 0) / children.length) * 10) || 0
                  ) : 0}%
                </div>
                <div className="text-sm font-semibold text-slate-600">Quest completion rate</div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 rounded-3xl p-6 border border-violet-100/50 hover:shadow-xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg">
                    <span className="text-xl">💝</span>
                  </div>
                  <div className="text-xs font-bold text-violet-600 uppercase tracking-wider">Well-being</div>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent mb-2">
                  {children.length > 0 ? (
                    children.reduce((sum, child) => sum + (child.pet_happiness || 85), 0) / children.length >= 80 ? 'Thriving' :
                    children.reduce((sum, child) => sum + (child.pet_happiness || 85), 0) / children.length >= 60 ? 'Content' : 'Growing'
                  ) : 'N/A'}
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  {children.length > 0 ? 
                    `${Math.round(children.reduce((sum, child) => sum + (child.pet_happiness || 85), 0) / children.length)}% happiness score` : 
                    'No data available'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Components */}
        <ScheduleModal open={showScheduleModal} onOpenChange={setShowScheduleModal} />
        <ResourcesModal open={showResourcesModal} onOpenChange={setShowResourcesModal} />
        <SafetyModal open={showSafetyModal} onOpenChange={setShowSafetyModal} />
      </div>
    </div>
  )
}

// Modal components
function ScheduleModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
          <Dialog.Title className="text-lg font-semibold mb-4">Schedule & Events</Dialog.Title>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Upcoming Events</h4>
              <p className="text-sm text-blue-600 mt-1">Parent-teacher conferences next week</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">School Calendar</h4>
              <p className="text-sm text-green-600 mt-1">View important dates and holidays</p>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Dialog.Close asChild>
              <Button variant="outline">Close</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ResourcesModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
          <Dialog.Title className="text-lg font-semibold mb-4">Educational Resources</Dialog.Title>
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800">Study Guides</h4>
              <p className="text-sm text-purple-600 mt-1">Download helpful study materials</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-indigo-800">Parent Resources</h4>
              <p className="text-sm text-indigo-600 mt-1">Tips for supporting your child's learning</p>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Dialog.Close asChild>
              <Button variant="outline">Close</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function SafetyModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
          <Dialog.Title className="text-lg font-semibold mb-4">Digital Safety</Dialog.Title>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800">Online Safety</h4>
              <p className="text-sm text-orange-600 mt-1">Guidelines for safe internet use</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800">Report Issues</h4>
              <p className="text-sm text-red-600 mt-1">Report any safety concerns immediately</p>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Dialog.Close asChild>
              <Button variant="outline">Close</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default function ParentPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <AuthGuard requiredRole="parent">
      <ParentDashboardContent />
    </AuthGuard>
  )
}
