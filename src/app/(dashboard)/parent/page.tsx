'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import dynamicImport from 'next/dynamic'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { OfflineAPI } from '@/lib/api/offline-wrapper'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader, Users } from 'lucide-react'
import { DarkModeProvider, useDarkMode } from '@/contexts/DarkModeContext'

// Dynamic imports to prevent SSR issues
const BottomNavigation = dynamicImport(() => import('@/components/parent/BottomNavigation').then(mod => ({ default: mod.default })), { ssr: false })
const DesktopNavigation = dynamicImport(() => import('@/components/parent/BottomNavigation').then(mod => ({ default: mod.DesktopNavigation })), { ssr: false })
const HomeTab = dynamicImport(() => import('@/components/parent/HomeTab'), { ssr: false })
const CommunityTab = dynamicImport(() => import('@/components/parent/CommunityTab'), { ssr: false })
const AnalyticsTab = dynamicImport(() => import('@/components/parent/AnalyticsTab'), { ssr: false })
const ProfileTab = dynamicImport(() => import('@/components/parent/ProfileTab'), { ssr: false })

function ParentDashboardContent() {
  const { isDarkMode } = useDarkMode()
  const dispatch = useAppDispatch()
  const { user, profile } = useAppSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState('home')
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [selectedChildDetails, setSelectedChildDetails] = useState<any>(null)
  const [children, setChildren] = useState<any[]>([])
  const [loadingChildren, setLoadingChildren] = useState(true)
  const [hasNotifications, setHasNotifications] = useState(false)

  useEffect(() => {
    if (user && !profile) {
      dispatch(fetchProfile(user.id))
    }
  }, [user, profile, dispatch])

  useEffect(() => {
    if (profile?.id) {
      fetchChildren()
      checkNotifications()
    }
  }, [profile])

  const fetchChildren = async () => {
    if (!profile?.id) return

    try {
      setLoadingChildren(true)
      // Fetch parent's linked children
      console.log('Fetching children for parent ID:', profile.id)
      const response = await fetch(`/api/v1/parents/settings?parent_id=${profile.id}`)
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('API Response:', result)
        console.log('Children data:', result.data?.children)
        
        if (result.data?.children && result.data.children.length > 0) {
          setChildren(result.data.children)
          setSelectedChild(result.data.children[0].id)
          setSelectedChildDetails(result.data.children[0])
          console.log('Children set successfully:', result.data.children)
        } else {
          console.log('No children found in response')
        }
      } else {
        const errorText = await response.text()
        console.error('API error:', errorText)
      }
    } catch (error) {
      console.error('Error fetching children:', error)
    } finally {
      setLoadingChildren(false)
    }
  }

  const checkNotifications = async () => {
    if (!selectedChild) return
    
    try {
      // Try OfflineAPI first for PWA support
      try {
        const dashboardData = await OfflineAPI.fetchParentDashboard()
        if (dashboardData) {
          const hasActions = dashboardData.actionCenter?.some(
            (action: any) => action.priority === 'high'
          )
          setHasNotifications(hasActions)
          return
        }
      } catch (offlineError) {
        console.log('[Parent] OfflineAPI failed, using regular fetch:', offlineError)
      }
      
      // Fallback to regular fetch
      const response = await fetch(`/api/v1/parents/dashboard?student_id=${selectedChild}`)
      if (response.ok) {
        const result = await response.json()
        const hasActions = result.data?.actionCenter?.some(
          (action: any) => action.priority === 'high'
        )
        setHasNotifications(hasActions)
      }
    } catch (error) {
      console.error('Error checking notifications:', error)
    }
  }

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
  }, [])

  const handleChildChange = useCallback((childId: string) => {
    setSelectedChild(childId)
    checkNotifications()
  }, [])

  // Listen for child selection from ProfileTab
  useEffect(() => {
    const handleChildSelected = (event: any) => {
      const { childId, childName, childGrade } = event.detail || {}
      if (childId) {
        setSelectedChild(childId)
        setSelectedChildDetails({
          id: childId,
          name: childName,
          grade: childGrade
        })
        checkNotifications()
        // Don't auto-switch tabs - let user stay on current tab
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('childSelected', handleChildSelected)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('childSelected', handleChildSelected)
      }
    }
  }, [])

  if (loadingChildren) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Navigation Skeleton */}
        <div className="hidden md:block fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          <div className="p-6">
            {/* Logo Skeleton */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl animate-pulse" />
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            
            {/* Nav Items Skeleton */}
            <div className="space-y-2">
              {['Home', 'Community', 'Analytics', 'Profile'].map((label, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="md:ml-64 min-h-screen pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {/* Action Center Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-red-100 rounded-full" />
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Tracker Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 animate-pulse">
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="text-center">
                    <div className="h-8 w-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded mx-auto mb-2" />
                    <div className="h-3 w-12 bg-gray-100 dark:bg-gray-700 rounded mx-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                    <div className="w-16 h-6 bg-gray-100 dark:bg-gray-700 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation Skeleton */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
          <div className="flex justify-around items-center h-16 px-2">
            {['Home', 'Community', 'Analytics', 'Profile'].map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-2">
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-2 w-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Allow dashboard to show even with no children - they can link from Profile tab

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Navigation */}
      <DesktopNavigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasNotifications={hasNotifications}
      />
      
      {/* Main Content */}
      <div className="md:ml-64 min-h-screen pb-20 md:pb-0">
        <div className={`${activeTab === 'profile' ? 'w-full px-4 py-6 sm:px-6 lg:px-8' : 'max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8'}`}>
          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'home' && (
                selectedChild ? (
                  <HomeTab studentId={selectedChild} />
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Children Linked</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Link a child to view their dashboard</p>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go to Profile to Link Child
                    </button>
                  </div>
                )
              )}
              
              {activeTab === 'community' && (
                selectedChild && profile?.id ? (
                  <CommunityTab studentId={selectedChild} parentId={profile.id} />
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Children Linked</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Link a child to view community posts</p>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go to Profile to Link Child
                    </button>
                  </div>
                )
              )}
              
              {activeTab === 'analytics' && (
                selectedChild ? (
                  <AnalyticsTab studentId={selectedChild} studentName={selectedChildDetails?.name} />
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Children Linked</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Link a child to view analytics</p>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go to Profile to Link Child
                    </button>
                  </div>
                )
              )}
              
              {activeTab === 'profile' && profile?.id && (
                <ProfileTab parentId={profile.id} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasNotifications={hasNotifications}
      />
    </div>
  )
}

export default function ParentDashboard() {
  return (
    <UnifiedAuthGuard requiredRole="parent">
      <DarkModeProvider>
        <ParentDashboardContent />
      </DarkModeProvider>
    </UnifiedAuthGuard>
  )
}
