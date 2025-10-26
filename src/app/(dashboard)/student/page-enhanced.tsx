'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { 
  Home, TrendingUp, Heart, User, Menu, X
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

// Types
interface TabData {
  id: 'today' | 'growth' | 'wellbeing' | 'profile'
  label: string
  icon: React.ElementType
  color: string
  activeColor: string
  bgGradient: string
}

const tabs: TabData[] = [
  { 
    id: 'today', 
    label: 'Today', 
    icon: Home, 
    color: 'text-slate-500',
    activeColor: 'text-blue-600',
    bgGradient: 'from-blue-50 to-indigo-50'
  },
  { 
    id: 'growth', 
    label: 'Growth', 
    icon: TrendingUp, 
    color: 'text-slate-500',
    activeColor: 'text-emerald-600',
    bgGradient: 'from-emerald-50 to-green-50'
  },
  { 
    id: 'wellbeing', 
    label: 'Well-being', 
    icon: Heart, 
    color: 'text-slate-500',
    activeColor: 'text-rose-600',
    bgGradient: 'from-rose-50 to-pink-50'
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    icon: User, 
    color: 'text-slate-500',
    activeColor: 'text-violet-600',
    bgGradient: 'from-violet-50 to-purple-50'
  }
]

export default function EnhancedStudentDashboard() {
  const router = useRouter()
  const { profile, user, isLoading: authLoading } = useAppSelector((state) => state.auth)
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabData['id']>('today')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  
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

  // Detect desktop viewport
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
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
    } catch (error: any) {
      console.error(`Error loading ${tabId} tab:`, error)
      setTabErrors(prev => ({ ...prev, [tabId]: error.message }))
    } finally {
      setTabLoading(prev => ({ ...prev, [tabId]: false }))
    }
  }, [cache])

  // Load initial tab data
  useEffect(() => {
    if (!authLoading && user) {
      loadTabData('today')
    }
  }, [authLoading, user, loadTabData])

  // Load data when tab changes
  useEffect(() => {
    if (activeTab && !tabData[activeTab] && !tabLoading[activeTab]) {
      loadTabData(activeTab)
    }
  }, [activeTab, tabData, tabLoading, loadTabData])

  const handleTabChange = (tabId: TabData['id']) => {
    setActiveTab(tabId)
    setShowMobileMenu(false)
  }

  const handleRefresh = () => {
    loadTabData(activeTab, true)
  }

  if (authLoading) {
    return <LoadingSkeleton />
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

      {/* Main Content Area with responsive padding */}
      <div className={cn(
        "transition-all duration-300",
        isDesktop ? "md:ml-[280px]" : "pb-16"
      )}>
        {/* Mobile Header */}
        {!isDesktop && (
          <motion.header
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-200"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-slate-900">Catalyst</h1>
                  <p className="text-xs text-slate-500">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5 text-slate-700" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-700" />
                )}
              </button>
            </div>
          </motion.header>
        )}

        {/* Tab Content with proper spacing */}
        <div className={cn(
          "min-h-screen",
          !isDesktop && "pt-16"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {/* Dynamic gradient background */}
              <div className={cn(
                "fixed inset-0 bg-gradient-to-br opacity-30 pointer-events-none",
                activeTab === 'today' && "from-blue-100 via-indigo-50 to-violet-50",
                activeTab === 'growth' && "from-emerald-100 via-green-50 to-teal-50",
                activeTab === 'wellbeing' && "from-rose-100 via-pink-50 to-red-50",
                activeTab === 'profile' && "from-violet-100 via-purple-50 to-indigo-50"
              )} />
              
              {/* Tab Components with responsive wrapper */}
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

      {/* Mobile Bottom Navigation - Enhanced */}
      {!isDesktop && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 safe-area-bottom"
        >
          <div className="flex items-center justify-around px-2 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl transition-all",
                    "relative overflow-hidden",
                    isActive && "bg-slate-50"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileTab"
                      className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                    />
                  )}
                  
                  <motion.div
                    animate={isActive ? { y: [0, -2, 0] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon 
                      className={cn(
                        "w-6 h-6 transition-all",
                        isActive ? tab.activeColor : tab.color
                      )} 
                    />
                  </motion.div>
                  
                  <span className={cn(
                    "text-xs mt-1 font-medium transition-colors",
                    isActive ? tab.activeColor : tab.color
                  )}>
                    {tab.label}
                  </span>
                  
                  {/* Loading dot */}
                  {tabLoading[tab.id] && (
                    <div className="absolute top-2 right-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </motion.button>
              )
            })}
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <motion.div
            className="absolute inset-0 border-4 border-slate-200 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
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
