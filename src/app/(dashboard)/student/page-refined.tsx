'use client'

/**
 * Catalyst Wells Student Dashboard - Refined Edition
 * Microsoft Copilot-level UX refinement
 * 
 * Key improvements:
 * - Premium icon system (no common icons)
 * - Standardized motion variants (250-350ms)
 * - Consistent design tokens
 * - Performance optimized (memoization, prefetching)
 * - Minimal blur, maximum clarity
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/lib/redux/hooks'
import { cn } from '@/lib/utils'

// Design System Imports
import { icons } from '@/lib/design-system/icons'
import { motionVariants, transitions } from '@/lib/design-system/motion'
import { memoComponent, LoadingState } from '@/lib/design-system/performance'
import { IconButton } from '@/components/design-system/Button'

// Tab Components (lazy loaded for performance)
import { TodayTab } from '@/components/student/tabs/TodayTab'
import { GrowthTab } from '@/components/student/tabs/GrowthTab'
import { WellbeingTab } from '@/components/student/tabs/WellbeingTab'
import { ProfileTab } from '@/components/student/tabs/ProfileTab'

// Responsive Components
import { Sidebar } from '@/components/student/Sidebar'
import { TabDataCache } from '@/lib/utils/tabCache'

// Types
interface TabData {
  id: 'today' | 'growth' | 'wellbeing' | 'profile'
  label: string
  icon: React.ElementType
  color: string
  gradientFrom: string
  gradientTo: string
}

// Tab configuration with premium icons
const tabs: TabData[] = [
  { 
    id: 'today', 
    label: 'Dashboard', 
    icon: icons.nav.dashboard,
    color: 'text-blue-600',
    gradientFrom: '#dbeafe',
    gradientTo: '#ffffff',
  },
  { 
    id: 'growth', 
    label: 'Growth', 
    icon: icons.progress.trending,
    color: 'text-emerald-600',
    gradientFrom: '#d1fae5',
    gradientTo: '#ffffff',
  },
  { 
    id: 'wellbeing', 
    label: 'Well-being', 
    icon: icons.nav.wellbeing,
    color: 'text-rose-600',
    gradientFrom: '#ffe4e6',
    gradientTo: '#ffffff',
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    icon: icons.nav.profile,
    color: 'text-violet-600',
    gradientFrom: '#ede9fe',
    gradientTo: '#ffffff',
  }
]

// Memoized Mobile Header Component
const MobileHeader = memo(({ 
  profile, 
  greeting, 
  isPullRefreshing, 
  showMobileMenu, 
  onMenuToggle,
  activeTab,
  activeTabLabel 
}: any) => {
  const NotificationIcon = icons.status.notification
  const MenuIcon = showMobileMenu ? icons.action.cancel : icons.nav.menu
  const RefreshIcon = icons.action.refresh
  
  return (
    <motion.header
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={transitions.base}
      className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200"
    >
      {/* Pull-to-refresh indicator */}
      {isPullRefreshing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-full left-0 right-0 flex justify-center py-2 bg-white"
        >
          <RefreshIcon className="w-4 h-4 text-blue-600 animate-spin" strokeWidth={2} />
        </motion.div>
      )}
      
      <div className="px-4 py-3">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-md overflow-hidden">
                {profile?.profilePicture || profile?.avatar_url ? (
                  <img 
                    src={profile.profilePicture || profile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {profile?.firstName?.charAt(0) || profile?.first_name?.charAt(0) || 'S'}
                  </span>
                )}
              </div>
              {/* Status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            {/* Greeting */}
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-slate-900 truncate">
                {greeting}, {profile?.firstName || profile?.first_name || 'Student'}
              </h1>
              <p className="text-xs text-slate-500 truncate">
                {profile?.school?.name || 'Catalyst Wells'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <IconButton
              icon={NotificationIcon}
              label="Notifications"
              variant="ghost"
              size="md"
            />
            
            <IconButton
              icon={MenuIcon}
              label="Menu"
              variant="ghost"
              size="md"
              onClick={onMenuToggle}
            />
          </div>
        </div>

        {/* Tab Indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            layoutId="mobileTabIndicator"
            className={cn(
              "h-1 w-12 rounded-full",
              activeTab === 'today' && "bg-blue-600",
              activeTab === 'growth' && "bg-emerald-600",
              activeTab === 'wellbeing' && "bg-rose-600",
              activeTab === 'profile' && "bg-violet-600"
            )}
            transition={transitions.spring}
          />
          <span className="text-xs font-medium text-slate-600">
            {activeTabLabel}
          </span>
        </div>
      </div>
    </motion.header>
  )
})
MobileHeader.displayName = 'MobileHeader'

// Memoized Tab Button Component
const TabButton = memo(({ 
  tab, 
  isActive, 
  isLoading, 
  onClick 
}: { 
  tab: TabData
  isActive: boolean
  isLoading: boolean
  onClick: () => void 
}) => {
  const Icon = tab.icon
  
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex flex-col items-center justify-center flex-1 py-3 px-2 rounded-xl transition-all duration-250",
        "relative",
        isActive && "bg-slate-50"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute top-0 left-4 right-4 h-1 bg-blue-600 rounded-full"
          transition={transitions.spring}
        />
      )}
      
      {/* Icon */}
      <motion.div
        animate={isActive ? { y: [-1, 0] } : {}}
        transition={{ duration: 0.25 }}
      >
        <Icon 
          className={cn(
            "w-6 h-6 transition-colors duration-250",
            isActive ? tab.color : "text-slate-500"
          )}
          strokeWidth={isActive ? 2.5 : 2}
        />
      </motion.div>
      
      {/* Label */}
      <span className={cn(
        "text-xs font-medium mt-1 transition-colors duration-250",
        isActive ? tab.color : "text-slate-500"
      )}>
        {tab.label}
      </span>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-2 right-2">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
        </div>
      )}
    </motion.button>
  )
})
TabButton.displayName = 'TabButton'

// Main Dashboard Component
export default function RefinedStudentDashboard() {
  const router = useRouter()
  const { profile, user, isLoading: authLoading } = useAppSelector((state) => state.auth)
  
  // State
  const [activeTab, setActiveTab] = useState<TabData['id']>('today')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [greeting, setGreeting] = useState('Hello')
  const [isPullRefreshing, setIsPullRefreshing] = useState(false)
  
  const [tabLoading, setTabLoading] = useState<Record<TabData['id'], boolean>>({
    today: true,
    growth: false,
    wellbeing: false,
    profile: false
  })
  
  const [tabData, setTabData] = useState<Record<TabData['id'], any>>({
    today: null,
    growth: null,
    wellbeing: null,
    profile: null
  })
  
  const [tabErrors, setTabErrors] = useState<Record<TabData['id'], string | null>>({
    today: null,
    growth: null,
    wellbeing: null,
    profile: null
  })

  // Cache
  const cache = useMemo(() => new TabDataCache(), [])
  
  // Pull-to-refresh refs
  const pullYRef = useRef(0)
  const startY = useRef(0)

  // Detect desktop viewport
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Set time-based greeting
  useEffect(() => {
    const hour = new Date().getHours()
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    setGreeting(timeGreeting)
  }, [])

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (!authLoading && profile?.role !== 'student') {
      router.push(`/${profile?.role || 'login'}`)
    }
  }, [authLoading, user, profile, router])

  // Load tab data with caching
  const loadTabData = useCallback(async (tabId: TabData['id'], forceRefresh = false) => {
    if (!forceRefresh) {
      const cachedData = cache.get(tabId)
      if (cachedData) {
        setTabData(prev => ({ ...prev, [tabId]: cachedData }))
        setTabLoading(prev => ({ ...prev, [tabId]: false }))
        return
      }
    }

    setTabLoading(prev => ({ ...prev, [tabId]: true }))
    setTabErrors(prev => ({ ...prev, [tabId]: null }))

    try {
      const response = await fetch(`/api/v2/student/${tabId}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error(`Failed to load ${tabId} data`)

      const data = await response.json()
      cache.set(tabId, data)
      setTabData(prev => ({ ...prev, [tabId]: data }))
      
      // Haptic feedback
      if ('vibrate' in navigator) navigator.vibrate(10)
    } catch (error: any) {
      console.error(`Error loading ${tabId} tab:`, error)
      setTabErrors(prev => ({ ...prev, [tabId]: error.message }))
      if ('vibrate' in navigator) navigator.vibrate([50, 50, 50])
    } finally {
      setTabLoading(prev => ({ ...prev, [tabId]: false }))
    }
  }, [cache])

  // Prefetch adjacent tabs
  const prefetchAdjacentTabs = useCallback((currentTabId: TabData['id']) => {
    const currentIndex = tabs.findIndex(t => t.id === currentTabId)
    const adjacentTabs: TabData['id'][] = []
    
    if (currentIndex > 0) adjacentTabs.push(tabs[currentIndex - 1].id)
    if (currentIndex < tabs.length - 1) adjacentTabs.push(tabs[currentIndex + 1].id)
    
    adjacentTabs.forEach(tabId => {
      if (!tabData[tabId] && !tabLoading[tabId]) {
        setTimeout(() => loadTabData(tabId), 500)
      }
    })
  }, [tabData, tabLoading, loadTabData])

  // Load initial data
  useEffect(() => {
    if (!authLoading && user) {
      loadTabData('today')
    }
  }, [authLoading, user, loadTabData])

  // Prefetch on tab change
  useEffect(() => {
    if (activeTab && !tabData[activeTab] && !tabLoading[activeTab]) {
      loadTabData(activeTab)
    }
    const timer = setTimeout(() => prefetchAdjacentTabs(activeTab), 1000)
    return () => clearTimeout(timer)
  }, [activeTab, tabData, tabLoading, loadTabData, prefetchAdjacentTabs])

  // Handlers
  const handleTabChange = useCallback((tabId: TabData['id']) => {
    setActiveTab(tabId)
    setShowMobileMenu(false)
    if ('vibrate' in navigator) navigator.vibrate(10)
    prefetchAdjacentTabs(tabId)
  }, [prefetchAdjacentTabs])

  const handleRefresh = useCallback(async () => {
    setIsPullRefreshing(true)
    await loadTabData(activeTab, true)
    setTimeout(() => setIsPullRefreshing(false), 500)
  }, [activeTab, loadTabData])

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
    }
  }, [])
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current > 0) {
      const diff = e.touches[0].clientY - startY.current
      if (diff > 0 && diff < 150) pullYRef.current = diff
    }
  }, [])
  
  const handleTouchEnd = useCallback(() => {
    if (pullYRef.current > 80) handleRefresh()
    startY.current = 0
    pullYRef.current = 0
  }, [handleRefresh])

  // Active tab config
  const activeTabConfig = tabs.find(t => t.id === activeTab)

  if (authLoading) {
    return <LoadingState loading={true}>{null}</LoadingState>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      {isDesktop && (
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          profile={profile}
        />
      )}

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        isDesktop ? "md:ml-[280px]" : "pb-16"
      )}>
        {/* Mobile Header */}
        {!isDesktop && (
          <MobileHeader
            profile={profile}
            greeting={greeting}
            isPullRefreshing={isPullRefreshing}
            showMobileMenu={showMobileMenu}
            onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
            activeTab={activeTab}
            activeTabLabel={activeTabConfig?.label}
          />
        )}

        {/* Tab Content */}
        <div 
          className={cn("min-h-screen", !isDesktop && "pt-[88px]")}
          onTouchStart={!isDesktop ? handleTouchStart : undefined}
          onTouchMove={!isDesktop ? handleTouchMove : undefined}
          onTouchEnd={!isDesktop ? handleTouchEnd : undefined}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={motionVariants.tabTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              {/* Background gradient */}
              <motion.div 
                key={`bg-${activeTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${activeTabConfig?.gradientFrom} 0%, ${activeTabConfig?.gradientTo} 100%)`
                }}
              />
              
              {/* Tab content */}
              <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {activeTab === 'today' && (
                  <TodayTab 
                    data={tabData.today}
                    loading={tabLoading.today}
                    error={tabErrors.today}
                    onRefresh={handleRefresh}
                    profile={profile}
                  />
                )}
                {activeTab === 'growth' && (
                  <GrowthTab 
                    data={tabData.growth}
                    loading={tabLoading.growth}
                    error={tabErrors.growth}
                    onRefresh={handleRefresh}
                    profile={profile}
                  />
                )}
                {activeTab === 'wellbeing' && (
                  <WellbeingTab 
                    data={tabData.wellbeing}
                    loading={tabLoading.wellbeing}
                    error={tabErrors.wellbeing}
                    onRefresh={handleRefresh}
                    profile={profile}
                  />
                )}
                {activeTab === 'profile' && (
                  <ProfileTab 
                    data={tabData.profile}
                    loading={tabLoading.profile}
                    error={tabErrors.profile}
                    onRefresh={handleRefresh}
                    profile={profile}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {!isDesktop && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={transitions.gentleSpring}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom"
        >
          <div className="flex items-center justify-around px-2 py-1">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                isLoading={tabLoading[tab.id]}
                onClick={() => handleTabChange(tab.id)}
              />
            ))}
          </div>
        </motion.nav>
      )}
    </div>
  )
}
