'use client'

/**
 * Catalyst Wells Student Dashboard - Refined Edition
 * Microsoft Copilot-level UX with premium icons, consistent motion, and performance optimization
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAppSelector } from '@/lib/redux/hooks'
import { 
  Compass, Rocket, Flower2, ScanFace, Menu, X, BellDot, RefreshCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Tab Components (will be enhanced)
import { TodayTab } from '@/components/student/tabs/TodayTab'
import { GrowthTab } from '@/components/student/tabs/GrowthTab'
import { WellbeingTab } from '@/components/student/tabs/WellbeingTab'
import { ProfileTab } from '@/components/student/tabs/ProfileTab'

// Responsive Components
import { Sidebar } from '@/components/student/Sidebar'
import { TabDataCache } from '@/lib/utils/tabCache'
import { ThemeLoader } from '@/components/student/ThemeLoader'

// Types
interface TabData {
  id: 'today' | 'growth' | 'wellbeing' | 'profile'
  label: string
  icon: React.ElementType
  color: string
  activeColor: string
  bgGradient: string
}

// Premium icon tabs with dynamic theme colors using CSS variables
const tabs: TabData[] = [
  { 
    id: 'today', 
    label: 'Dashboard', 
    icon: Compass,
    color: 'text-slate-400',
    activeColor: '', // Will use CSS variable
    bgGradient: '' // Will use CSS variable
  },
  { 
    id: 'growth', 
    label: 'Growth', 
    icon: Rocket,
    color: 'text-slate-400',
    activeColor: '', // Will use CSS variable
    bgGradient: '' // Will use CSS variable
  },
  { 
    id: 'wellbeing', 
    label: 'Well-being', 
    icon: Flower2, 
    color: 'text-slate-400',
    activeColor: '', // Will use CSS variable
    bgGradient: '' // Will use CSS variable
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    icon: ScanFace,
    color: 'text-slate-400',
    activeColor: 'text-[#F4978E]',
    bgGradient: 'from-[#FFDAB9] to-[#F8AD9D]'
  }
]

// Memoized Mobile Header for performance
const MobileHeader = memo(({ 
  profile, 
  greeting, 
  isPullRefreshing, 
  showMobileMenu, 
  onMenuToggle,
  activeTab 
}: any) => (
  <motion.header
    initial={{ y: -60 }}
    animate={{ y: 0 }}
    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}  // 250ms standard
    className="fixed top-0 left-0 right-0 z-40 shadow-sm"
    style={{ 
      background: 'linear-gradient(to right, var(--theme-highlight), var(--theme-tertiary))',
      borderBottom: '1px solid color-mix(in srgb, var(--theme-accent) 30%, transparent)'
    }}
  >
    {isPullRefreshing && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="absolute top-full left-0 right-0 flex justify-center py-2 bg-white"
      >
        <RefreshCcw className="w-4 h-4 animate-spin" strokeWidth={2} style={{ color: 'var(--theme-primary)' }} />
      </motion.div>
    )}
    
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md overflow-hidden" style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))' }}>
              {profile?.profilePicture || profile?.avatar_url ? (
                <Image src={profile.profilePicture || profile.avatar_url} alt="Profile" className="w-full h-full object-cover" width={40} height={40} />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {profile?.firstName?.charAt(0) || profile?.first_name?.charAt(0) || 'S'}
                </span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ backgroundColor: 'var(--theme-secondary)', borderColor: 'var(--theme-highlight)' }} />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-slate-900 truncate">
              {greeting}, {profile?.firstName || profile?.first_name || 'Student'}
            </h1>
            <p className="text-xs text-slate-500 truncate">
              {profile?.school?.name || 'Catalyst Wells'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="relative p-2 rounded-lg transition-colors duration-250"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-highlight) 50%, transparent)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <BellDot className="w-5 h-5 text-slate-600" strokeWidth={2} />
          </motion.button>
          
          <motion.button
            onClick={onMenuToggle}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="p-2 rounded-lg transition-colors duration-250"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-highlight) 50%, transparent)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {showMobileMenu ? (
              <X className="w-5 h-5 text-slate-700" strokeWidth={2} />
            ) : (
              <Menu className="w-5 h-5 text-slate-700" strokeWidth={2} />
            )}
          </motion.button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.div
          layoutId="mobileTabIndicator"
          className="h-1 w-12 rounded-full"
          style={{ background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        />
        <span className="text-xs font-medium text-slate-600">
          {tabs.find(t => t.id === activeTab)?.label}
        </span>
      </div>
    </div>
  </motion.header>
))
MobileHeader.displayName = 'MobileHeader'

// Memoized Tab Button for performance
const TabButton = memo(({ tab, isActive, isLoading, onClick }: any) => {
  const Icon = tab.icon
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "flex flex-col items-center justify-center flex-1 py-2.5 px-3 rounded-2xl transition-all duration-250 relative"
      )}
      style={{
        backgroundColor: isActive ? 'color-mix(in srgb, var(--theme-highlight) 15%, transparent)' : 'transparent'
      }}
    >
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute top-1 left-1/2 w-12 h-1 rounded-full shadow-sm"
          style={{
            background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))',
            transform: 'translateX(-50%)'
          }}
          transition={{ 
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1]
          }}
        />
      )}
      
      <Icon 
        className={cn(
          "w-5 h-5 transition-all duration-250",
          isActive ? '' : tab.color
        )}
        style={{
          color: isActive ? 'var(--theme-primary)' : undefined
        }}
        strokeWidth={isActive ? 2.5 : 2}
      />
      
      <span 
        className={cn(
          "text-[10px] font-medium mt-1 transition-colors duration-250",
          isActive ? '' : tab.color
        )}
        style={{
          color: isActive ? 'var(--theme-primary)' : undefined
        }}
      >
        {tab.label}
      </span>
      
      {isLoading && (
        <div className="absolute top-1 right-1">
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-primary)' }} />
        </div>
      )}
    </motion.button>
  )
})
TabButton.displayName = 'TabButton'

export default function EnhancedStudentDashboard() {
  const router = useRouter()
  const { profile, user, isLoading: authLoading } = useAppSelector((state) => state.auth)
  
  // Mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabData['id']>('today')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [greeting, setGreeting] = useState('Hello')
  const [isPullRefreshing, setIsPullRefreshing] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  
  // Refs for pull-to-refresh
  const pullYRef = useRef(0)
  const startY = useRef(0)
  
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

  // Initialize cache
  const cache = useMemo(() => new TabDataCache(), [])

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Detect desktop viewport
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Set time-based greeting (client-side only to avoid hydration mismatch)
  useEffect(() => {
    const hour = new Date().getHours()
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    setGreeting(timeGreeting)
  }, [])

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (!authLoading && profile?.role !== 'student') {
      router.push(`/${profile?.role || 'login'}`)
    }
  }, [authLoading, user, profile, router])

  // Load tab data with performance optimization
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
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load ${tabId} data`)
      }

      const data = await response.json()
      cache.set(tabId, data)
      setTabData(prev => ({ ...prev, [tabId]: data }))
      
      // Haptic feedback on successful load
      if ('vibrate' in navigator) {
        navigator.vibrate(10)
      }
    } catch (error: any) {
      console.error(`Error loading ${tabId} tab:`, error)
      setTabErrors(prev => ({ ...prev, [tabId]: error.message }))
      
      // Error haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50])
      }
    } finally {
      setTabLoading(prev => ({ ...prev, [tabId]: false }))
    }
  }, [cache])

  // Load initial tab data (only today tab)
  useEffect(() => {
    if (!authLoading && user) {
      loadTabData('today')
    }
  }, [authLoading, user, loadTabData])

  // Load data on demand when tab changes
  useEffect(() => {
    if (activeTab && !tabData[activeTab] && !tabLoading[activeTab]) {
      loadTabData(activeTab)
    }
  }, [activeTab, tabData, tabLoading, loadTabData])

  // Handle tab change with direction-aware animations
  const handleTabChange = useCallback((newTab: TabData['id']) => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab)
    const newIndex = tabs.findIndex(t => t.id === newTab)
    
    // Set swipe direction based on tab order
    if (newIndex > currentIndex) {
      setSwipeDirection('left')
    } else if (newIndex < currentIndex) {
      setSwipeDirection('right')
    }
    
    setActiveTab(newTab)
    // Data will be loaded on-demand by useEffect
  }, [activeTab])

  const handleRefresh = async () => {
    setIsPullRefreshing(true)
    await loadTabData(activeTab, true)
    setTimeout(() => setIsPullRefreshing(false), 500)
  }
  
  // Pull-to-refresh gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
    }
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current > 0) {
      const currentY = e.touches[0].clientY
      const diff = currentY - startY.current
      if (diff > 0 && diff < 150) {
        pullYRef.current = diff
      }
    }
  }
  
  const handleTouchEnd = () => {
    if (pullYRef.current > 80) {
      handleRefresh()
    }
    startY.current = 0
    pullYRef.current = 0
  }

  // Show loading skeleton during SSR, hydration, or auth loading
  if (!mounted || authLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight) 30%, transparent), white, color-mix(in srgb, var(--theme-tertiary) 20%, transparent))' }}>
      {/* Theme Loader - Applies theme CSS variables */}
      <ThemeLoader />
      
      {/* Desktop Sidebar */}
      {isDesktop && (
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          profile={profile}
        />
      )}

      {/* Main Content Area with responsive padding */}
      <div className={cn(
        "transition-all duration-300",
        isDesktop ? "md:ml-[280px]" : "pb-16"
      )}>
        {/* Memoized Mobile Header */}
        {!isDesktop && (
          <MobileHeader
            profile={profile}
            greeting={greeting}
            isPullRefreshing={isPullRefreshing}
            showMobileMenu={showMobileMenu}
            onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
            activeTab={activeTab}
          />
        )}

        {/* Tab Content with pull-to-refresh */}
        <div 
          className={cn(
            "min-h-screen",
            !isDesktop && "pt-[88px]"
          )}
          onTouchStart={!isDesktop ? handleTouchStart : undefined}
          onTouchMove={!isDesktop ? handleTouchMove : undefined}
          onTouchEnd={!isDesktop ? handleTouchEnd : undefined}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="w-full"
            >
              {/* Subtle gradient background */}
              <motion.div 
                key={`bg-${activeTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "fixed inset-0 bg-gradient-to-br pointer-events-none",
                  activeTab === 'today' && "from-[#FFDAB9]/20 to-transparent",
                  activeTab === 'growth' && "from-[#FBC4AB]/20 to-transparent",
                  activeTab === 'wellbeing' && "from-[#F8AD9D]/20 to-transparent",
                  activeTab === 'profile' && "from-[#F4978E]/20 to-transparent"
                )} 
              />
              
              {/* Tab Components with smooth slide animations */}
              <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <AnimatePresence mode="wait" initial={false}>
                  {activeTab === 'today' && (
                    <motion.div
                      key="today"
                      initial={{ opacity: 0, x: swipeDirection === 'left' ? 20 : -20, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: swipeDirection === 'left' ? -20 : 20, scale: 0.98 }}
                      transition={{ 
                        duration: 0.3, 
                        ease: [0.4, 0, 0.2, 1]
                      }}
                    >
                      <TodayTab 
                        data={tabData.today}
                        loading={tabLoading.today}
                        error={tabErrors.today}
                        onRefresh={handleRefresh}
                        profile={profile}
                      />
                    </motion.div>
                  )}
                  {activeTab === 'growth' && (
                    <motion.div
                      key="growth"
                      initial={{ opacity: 0, x: swipeDirection === 'left' ? 20 : -20, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: swipeDirection === 'left' ? -20 : 20, scale: 0.98 }}
                      transition={{ 
                        duration: 0.3, 
                        ease: [0.4, 0, 0.2, 1]
                      }}
                    >
                      <GrowthTab 
                        data={tabData.growth}
                        loading={tabLoading.growth}
                        error={tabErrors.growth}
                        onRefresh={handleRefresh}
                        profile={profile}
                      />
                    </motion.div>
                  )}
                  {activeTab === 'wellbeing' && (
                    <motion.div
                      key="wellbeing"
                      initial={{ opacity: 0, x: swipeDirection === 'left' ? 20 : -20, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: swipeDirection === 'left' ? -20 : 20, scale: 0.98 }}
                      transition={{ 
                        duration: 0.3, 
                        ease: [0.4, 0, 0.2, 1]
                      }}
                    >
                      <WellbeingTab 
                        data={tabData.wellbeing}
                        loading={tabLoading.wellbeing}
                        error={tabErrors.wellbeing}
                        onRefresh={handleRefresh}
                        profile={profile}
                      />
                    </motion.div>
                  )}
                  {activeTab === 'profile' && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, x: swipeDirection === 'left' ? 20 : -20, scale: 0.98 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: swipeDirection === 'left' ? -20 : 20, scale: 0.98 }}
                      transition={{ 
                        duration: 0.3, 
                        ease: [0.4, 0, 0.2, 1]
                      }}
                    >
                      <ProfileTab 
                        data={tabData.profile}
                        loading={tabLoading.profile}
                        error={tabErrors.profile}
                        onRefresh={handleRefresh}
                        profile={profile}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Professional Minimal Design */}
      {!isDesktop && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#FBC4AB]/20 shadow-[0_-2px_10px_rgba(240,128,128,0.08)] safe-area-bottom"
        >
          <div className="flex items-center justify-around px-3 py-2">
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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileMenu(false)}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Menu</h2>
                {/* Add menu items here */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Enhanced Loading Skeleton with shimmer effect
function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-highlight, #FFF5EE) 30%, transparent), white, color-mix(in srgb, var(--theme-tertiary, #FBC4AB) 20%, transparent))' }} suppressHydrationWarning>
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 border-4 rounded-full" style={{ borderColor: 'var(--theme-tertiary, #FBC4AB)' }} />
          <div className="absolute inset-0 border-4 border-transparent rounded-full animate-spin" style={{ borderTopColor: 'var(--theme-primary, #F08080)' }} />
        </div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">
          Loading Dashboard
        </h2>
        <p className="text-slate-500 text-sm">
          Preparing your experience...
        </p>
      </div>
    </div>
  )
}
