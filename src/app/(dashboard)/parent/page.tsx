'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { OfflineAPI } from '@/lib/api/offline-wrapper'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader, Users } from 'lucide-react'
import { DarkModeProvider, useDarkMode } from '@/contexts/DarkModeContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useTabSwipeNavigation } from '@/hooks/useSwipeNavigation'
import { usePullToRefresh } from '@/components/ui/PullToRefresh'
import { useRefreshAllData, usePrefetchWellbeing } from '@/hooks/useParentAPI'
import { useOfflineStatus, usePWA } from '@/hooks/useOfflinePWA'
import { useAnalytics } from '@/utils/analytics'
import { useAccessibility } from '@/utils/accessibility'
// Removed WebSocket and performance monitoring imports for better performance
import { useDebounce } from '@/utils/performanceOptimizer'
import { PulseNotification, MorphingLoader } from '@/components/ui/MicroInteractions'

// Optimized lazy loading with proper code splitting
const BottomNavigation = lazy(() => import('@/components/parent/BottomNavigation').then(mod => ({ default: mod.default })))
const DesktopNavigation = lazy(() => import('@/components/parent/BottomNavigation').then(mod => ({ default: mod.DesktopNavigation })))
const HomeTab = lazy(() => import('@/components/parent/HomeTab'))
const CommunityTab = lazy(() => import('@/components/parent/CommunityTab'))
const AnalyticsTab = lazy(() => import('@/components/parent/AnalyticsTab'))
const WellbeingTab = lazy(() => import('@/components/parent/WellbeingTab'))
const ProfileTab = lazy(() => import('@/components/parent/ProfileTab'))

// Loading component for Suspense fallbacks
const TabLoadingFallback = ({ tabName }: { tabName: string }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Loading {tabName}...</p>
    </div>
  </div>
)

const NavigationLoadingFallback = () => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-sm md:hidden">
    <div className="flex justify-around items-center h-16 px-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col items-center gap-1 py-2">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-2 w-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </div>
)

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

  // Advanced features (must be declared before other callbacks)
  const { isOnline } = useOfflineStatus()
  const { track, page, setUser } = useAnalytics()
  const { announce, focusElement } = useAccessibility({
    announcePageChanges: true,
    keyboardNavigation: true,
    focusManagement: true,
    screenReaderOptimizations: true
  })
  const pwa = usePWA()
  
  // Performance monitoring removed for better performance
  
  // Simple notification state (replacing WebSocket real-time updates)
  const [hasRealTimeUpdates, setHasRealTimeUpdates] = useState(false)

  // Prefetch wellbeing data in the background for smoother tab switching
  const prefetchWellbeing = usePrefetchWellbeing()

  const checkNotifications = useCallback(async () => {
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
  }, [selectedChild])

  const handleTabChange = useCallback((tab: string) => {
    // Track tab navigation
    track('parent_tab_change', {
      from_tab: activeTab,
      to_tab: tab,
      selectedChild,
      navigation_method: 'click'
    })
    
    // Announce tab change for screen readers
    announce(`Switched to ${tab} tab`)
    
    setActiveTab(tab)
    
    // Track page view
    page(`Parent ${tab.charAt(0).toUpperCase() + tab.slice(1)}`, {
      tab,
      selectedChild,
      hasChildren: children.length > 0
    })
  }, [activeTab, selectedChild, children.length, track, announce, page])

  const handleChildChange = useCallback((childId: string) => {
    setSelectedChild(childId)
    checkNotifications()
  }, [checkNotifications])

  // Warm wellbeing data when child changes (unless already on wellbeing tab)
  useEffect(() => {
    if (selectedChild && activeTab !== 'wellbeing') {
      prefetchWellbeing(selectedChild)
    }
  }, [selectedChild, activeTab, prefetchWellbeing])

  // Tab order for swipe navigation
  const tabOrder = ['home', 'community', 'analytics', 'wellbeing', 'profile']
  
  // Modern swipe navigation with improved touch handling
  const { elementRef: swipeRef, canSwipeLeft, canSwipeRight } = useTabSwipeNavigation(
    tabOrder,
    activeTab,
    handleTabChange,
    true // enabled
  )

  // Pull-to-refresh functionality with smart detection
  const refreshAllData = useRefreshAllData()
  const { PullToRefreshWrapper, isRefreshing } = usePullToRefresh(
    async () => {
      // Track refresh action
      track('parent_dashboard_refresh', { 
        activeTab, 
        selectedChild,
        method: 'pull_to_refresh'
      })
      
      // Refresh all cached data
      refreshAllData()
      
      // Refetch children and notifications
      await fetchChildren()
      await checkNotifications()
      
      // Announce completion for screen readers
      announce('Dashboard refreshed successfully')
    },
    {
      threshold: 80,
      resistance: 2.5,
      enabled: true
    }
  )


  // Initialize analytics and accessibility
  useEffect(() => {
    if (profile?.id) {
      // Set user for analytics
      setUser(profile.id, 'parent', {
        hasChildren: children.length > 0,
        childrenCount: children.length
      })
      
      // Track initial page view
      page('Parent Dashboard', {
        activeTab,
        selectedChild,
        hasChildren: children.length > 0,
        isOnline
      })
      
      // Announce page load for screen readers
      announce(`Parent dashboard loaded. ${children.length} children linked.`)
    }
  }, [profile?.id, children.length, activeTab, selectedChild, isOnline, setUser, page, announce])

  // Listen for child selection from ProfileTab with proper cleanup
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
  }, [checkNotifications]) // Add checkNotifications to dependencies

  if (loadingChildren) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Desktop Navigation Skeleton */}
        <div className="hidden md:block fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl">
          <div className="p-6">
            {/* Logo Skeleton */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl animate-pulse shadow-lg" />
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            
            {/* Nav Items Skeleton */}
            <div className="space-y-2">
              {['Home', 'Community', 'Analytics', 'Wellbeing', 'Profile'].map((label, i) => (
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
          {/* Professional Header Skeleton */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="h-4 w-24 bg-blue-400 rounded mb-2 animate-pulse" />
                  <div className="h-8 w-64 bg-blue-500 rounded animate-pulse" />
                </div>
                <div className="flex gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex-1 md:w-32">
                    <div className="h-3 w-12 bg-blue-300 rounded mb-2 animate-pulse" />
                    <div className="h-6 w-16 bg-blue-200 rounded animate-pulse" />
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex-1 md:w-32">
                    <div className="h-3 w-12 bg-blue-300 rounded mb-2 animate-pulse" />
                    <div className="h-6 w-16 bg-blue-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 -mt-4">
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
                    <div className="flex-1 overflow-hidden">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/3" />
                      </div>
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
            {['Home', 'Community', 'Analytics', 'Wellbeing', 'Profile'].map((label, i) => (
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop Navigation */}
      <ErrorBoundary level="component">
        <Suspense fallback={<div className="hidden md:block w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 animate-pulse" />}>
          <DesktopNavigation 
            activeTab={activeTab}
            onTabChange={handleTabChange}
            hasNotifications={hasNotifications}
          />
        </Suspense>
      </ErrorBoundary>
      
      {/* Enterprise Header - Only on Home Tab */}
      {activeTab === 'home' && (
        <div className="md:ml-64 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
            {/* Top Bar */}
            <div className="flex items-center justify-between h-16 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Parent Portal</h1>
                <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
                  <span>/</span>
                  <span className="text-slate-700 dark:text-slate-300">Home</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasNotifications && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Action Required</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Child Selector & Metrics */}
            {children.length > 0 && (
            <div className="py-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Child Selector */}
                <div className="lg:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Active Child</label>
                  <select
                    value={selectedChild || ''}
                    onChange={(e) => {
                      setSelectedChild(e.target.value)
                      const child = children.find(c => c.id === e.target.value)
                      setSelectedChildDetails(child)
                    }}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name} • {child.grade}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Key Metrics */}
                <div className="lg:col-span-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Linked Children</span>
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{children.length}</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Avg Performance</span>
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">--</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 rounded-lg p-4 border border-violet-200 dark:border-violet-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">Attendance</span>
                        <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-violet-900 dark:text-violet-100">--</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Wellbeing</span>
                        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">--</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      )}
      
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            You're offline. Some features may be limited.
          </span>
        </div>
      )}

      {/* PWA Install Prompt */}
      {pwa.install.canInstall && (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-40 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <p className="text-sm mb-3">Install Catalyst for a better experience!</p>
          <div className="flex gap-2">
            <button
              onClick={pwa.install.installPWA}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium"
            >
              Install
            </button>
            <button
              onClick={() => {/* dismiss */}}
              className="text-blue-100 px-3 py-1 rounded text-sm"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="md:ml-64 min-h-screen pb-20 md:pb-0 bg-slate-50 dark:bg-slate-950" ref={swipeRef as any}>
        {/* Swipe indicators for mobile */}
        <div className="md:hidden fixed top-1/2 left-2 right-2 flex justify-between pointer-events-none z-10">
          {canSwipeRight && (
            <div className="bg-black/20 dark:bg-white/20 backdrop-blur-sm rounded-full p-2 animate-pulse">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          )}
          {canSwipeLeft && (
            <div className="bg-black/20 dark:bg-white/20 backdrop-blur-sm rounded-full p-2 animate-pulse ml-auto">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
        
        <PullToRefreshWrapper className="h-full">
          <div 
            className={`${activeTab === 'profile' ? 'w-full' : 'max-w-[1600px] mx-auto'} px-6 lg:px-8 py-8 overscroll-behavior-y-contain`}
            ref={swipeRef as React.RefObject<HTMLDivElement>}
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y pinch-zoom'
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
              {activeTab === 'home' && (
                selectedChild ? (
                  <ErrorBoundary level="component">
                    <Suspense fallback={<TabLoadingFallback tabName="Home" />}>
                      <HomeTab studentId={selectedChild} />
                    </Suspense>
                  </ErrorBoundary>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
                          <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">Get Started</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">Link your child's account to access their academic progress, wellbeing insights, and stay connected with their educational journey.</p>
                        <button
                          onClick={() => setActiveTab('profile')}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                          <span>Link Child Account</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 px-12 py-6">
                        <div className="grid grid-cols-3 gap-8 text-center">
                          <div>
                            <div className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">Real-time</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Progress Tracking</div>
                          </div>
                          <div>
                            <div className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">Insights</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Performance Analytics</div>
                          </div>
                          <div>
                            <div className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">Connect</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">School Community</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
              
              {activeTab === 'community' && (
                selectedChild && profile?.id ? (
                  <ErrorBoundary level="component">
                    <Suspense fallback={<TabLoadingFallback tabName="Community" />}>
                      <CommunityTab studentId={selectedChild} parentId={profile.id} />
                    </Suspense>
                  </ErrorBoundary>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
                        <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">Community Access Required</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">Link your child to access community updates and school announcements.</p>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <span>Link Child Account</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              )}
              
              {activeTab === 'analytics' && (
                selectedChild ? (
                  <ErrorBoundary level="component">
                    <Suspense fallback={<TabLoadingFallback tabName="Analytics" />}>
                      <AnalyticsTab studentId={selectedChild} studentName={selectedChildDetails?.name} />
                    </Suspense>
                  </ErrorBoundary>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6">
                        <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">Analytics Dashboard</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">Link your child to view detailed analytics and performance metrics.</p>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <span>Link Child Account</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              )}
              
              {activeTab === 'wellbeing' && (
                selectedChild ? (
                  <ErrorBoundary level="component">
                    <Suspense fallback={<TabLoadingFallback tabName="Wellbeing" />}>
                      <WellbeingTab studentId={selectedChild} studentName={selectedChildDetails?.name} />
                    </Suspense>
                  </ErrorBoundary>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full mb-6">
                        <Users className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                      </div>
                      <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">Wellbeing Dashboard</h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">Link your child to view their wellbeing insights and mental health analytics.</p>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <span>Link Child Account</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              )}
              
              {activeTab === 'profile' && profile?.id && (
                <ErrorBoundary level="component">
                  <Suspense fallback={<TabLoadingFallback tabName="Profile" />}>
                    <ProfileTab parentId={profile.id} />
                  </Suspense>
                </ErrorBoundary>
              )}
              </motion.div>
            </AnimatePresence>
          </div>
        </PullToRefreshWrapper>
      </div>

      {/* Mobile Bottom Navigation */}
      <ErrorBoundary level="component">
        <Suspense fallback={<NavigationLoadingFallback />}>
          <PulseNotification 
            active={hasRealTimeUpdates || hasNotifications}
            color="bg-blue-500"
          >
            <BottomNavigation 
              activeTab={activeTab}
              onTabChange={handleTabChange}
              hasNotifications={hasNotifications || hasRealTimeUpdates}
            />
          </PulseNotification>
        </Suspense>
      </ErrorBoundary>
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
