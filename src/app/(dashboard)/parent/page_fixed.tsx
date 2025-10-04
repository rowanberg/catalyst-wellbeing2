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
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { handleError } from '@/lib/utils/errorHandling'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { MessagingNavButton } from '@/components/ui/messaging-nav-button'
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
                  <p className="text-gray-600 mt-1">Monitor your children's progress and well-being</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MessagingNavButton 
                  userRole="parent" 
                  variant="default" 
                  className="bg-blue-600 hover:bg-blue-700 text-white" 
                />
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{children.length}</div>
                  <div className="text-sm text-gray-600">Children</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {children.length > 0 ? Math.round(children.reduce((sum, child) => sum + child.level, 0) / children.length) : 0}
                  </div>
                  <div className="text-sm text-gray-600">Average Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{helpRequests.length}</div>
                  <div className="text-sm text-gray-600">Alerts</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Children Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {children.map((child) => (
            <div
              key={child.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {child.first_name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {child.first_name} {child.last_name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                      <span>{child.grade_level}</span>
                      <span>•</span>
                      <span className="truncate">{child.school_name}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">Level {child.level}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-900">{child.xp}</div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">XP Points</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-900">{child.gems}</div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Gems</div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🐱</span>
                      <span className="font-medium text-gray-900">{child.pet_name || 'Buddy'}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{child.pet_happiness}%</span>
                  </div>
                  <div className="bg-white rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${child.pet_happiness}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-700">
                      {child.total_quests_completed} Quests Completed
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="text-sm">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help Requests Alert */}
        {helpRequests.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-red-800">Help Requests</h3>
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {helpRequests.length}
              </span>
            </div>
            <div className="space-y-3">
              {helpRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{request.student?.first_name}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          request.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                          request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                          request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {request.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{request.message}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700 text-white ml-4"
                      onClick={() => handleAcknowledgeRequest(request.id)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/parent/messaging">
            <div className="bg-blue-600 hover:bg-blue-700 rounded-lg p-6 text-white cursor-pointer transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Messages</h3>
              <p className="text-blue-100 text-sm">Chat with teachers and children</p>
            </div>
          </Link>

          <div
            onClick={() => setShowScheduleModal(true)}
            className="bg-green-600 hover:bg-green-700 rounded-lg p-6 text-white cursor-pointer transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Schedule</h3>
            <p className="text-green-100 text-sm">View events and meetings</p>
          </div>

          <div
            onClick={() => setShowResourcesModal(true)}
            className="bg-purple-600 hover:bg-purple-700 rounded-lg p-6 text-white cursor-pointer transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Resources</h3>
            <p className="text-purple-100 text-sm">Educational materials</p>
          </div>

          <div
            onClick={() => setShowSafetyModal(true)}
            className="bg-orange-600 hover:bg-orange-700 rounded-lg p-6 text-white cursor-pointer transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Safety</h3>
            <p className="text-orange-100 text-sm">Digital safety tools</p>
          </div>
        </div>

        {/* Family Overview */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-green-600 rounded-lg mr-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Family Overview</h2>
              <p className="text-gray-600">Weekly progress summary</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-700 font-medium">Overall Progress</span>
              </div>
              <div className="text-2xl font-bold text-green-800 mb-1">
                {children.length > 0 ? (
                  children.every(child => child.level >= 3) ? 'Excellent' : 
                  children.some(child => child.level >= 2) ? 'Good' : 'Growing'
                ) : 'No Data'}
              </div>
              <div className="text-sm text-green-600">
                {children.length > 0 ? `${children.length} ${children.length === 1 ? 'child' : 'children'} tracked` : 'Add children to see progress'}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700 font-medium">Engagement</span>
              </div>
              <div className="text-2xl font-bold text-blue-800 mb-1">
                {children.length > 0 ? (
                  Math.round((children.reduce((sum, child) => sum + (child.total_quests_completed || 0), 0) / children.length) * 10) || 0
                ) : 0}%
              </div>
              <div className="text-sm text-blue-600">Average quest completion</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-700 font-medium">Well-being</span>
              </div>
              <div className="text-2xl font-bold text-purple-800 mb-1">
                {children.length > 0 ? (
                  children.reduce((sum, child) => sum + (child.pet_happiness || 85), 0) / children.length >= 80 ? 'Happy' :
                  children.reduce((sum, child) => sum + (child.pet_happiness || 85), 0) / children.length >= 60 ? 'Content' : 'Needs Support'
                ) : 'N/A'}
              </div>
              <div className="text-sm text-purple-600">
                {children.length > 0 ? 
                  `${Math.round(children.reduce((sum, child) => sum + (child.pet_happiness || 85), 0) / children.length)}% average happiness` : 
                  'No data available'
                }
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
    <UnifiedAuthGuard requiredRole="parent">
      <ParentDashboardContent />
    </UnifiedAuthGuard>
  )
}
