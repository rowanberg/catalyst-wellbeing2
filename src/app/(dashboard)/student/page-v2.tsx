'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { 
  Home, TrendingUp, Heart, User, Calendar, Trophy, BookOpen, 
  MessageCircle, Settings, ChevronRight, Bell, Sparkles, Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Tab Components (to be implemented)
import { TodayTab } from '@/components/student/tabs/TodayTab'
import { GrowthTab } from '@/components/student/tabs/GrowthTab'
import { WellbeingTab } from '@/components/student/tabs/WellbeingTab'
import { ProfileTab } from '@/components/student/tabs/ProfileTab'

// Cache manager for tab data
import { TabDataCache } from '@/lib/utils/tabCache'

// Types
interface TabData {
  id: 'today' | 'growth' | 'wellbeing' | 'profile'
  label: string
  icon: React.ElementType
  color: string
  bgGradient: string
}

const tabs: TabData[] = [
  { 
    id: 'today', 
    label: 'Today', 
    icon: Home, 
    color: 'text-blue-600',
    bgGradient: 'from-blue-50 to-indigo-50'
  },
  { 
    id: 'growth', 
    label: 'Growth', 
    icon: TrendingUp, 
    color: 'text-green-600',
    bgGradient: 'from-green-50 to-emerald-50'
  },
  { 
    id: 'wellbeing', 
    label: 'Well-being', 
    icon: Heart, 
    color: 'text-pink-600',
    bgGradient: 'from-pink-50 to-rose-50'
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    icon: User, 
    color: 'text-purple-600',
    bgGradient: 'from-purple-50 to-violet-50'
  }
]

export default function StudentDashboardV2() {
  const router = useRouter()
  const { profile, user, isLoading: authLoading } = useAppSelector((state) => state.auth)
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabData['id']>('today')
  const [tabLoading, setTabLoading] = useState<Record<TabData['id'], boolean>>({
    today: true,
    growth: false,
    wellbeing: false,
    profile: false
  })
  
  // Tab data state (cached)
  const [tabData, setTabData] = useState<Record<TabData['id'], any>>({
    today: null,
    growth: null,
    wellbeing: null,
    profile: null
  })
  
  // Error state
  const [tabErrors, setTabErrors] = useState<Record<TabData['id'], string | null>>({
    today: null,
    growth: null,
    wellbeing: null,
    profile: null
  })

  // Initialize cache
  const cache = useMemo(() => new TabDataCache(), [])

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (!authLoading && profile?.role !== 'student') {
      router.push(`/${profile?.role || 'login'}`)
    }
  }, [authLoading, user, profile, router])

  // Load tab data
  const loadTabData = useCallback(async (tabId: TabData['id'], forceRefresh = false) => {
    // Check cache first
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
      
      // Cache the data
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

  // Handle tab change
  const handleTabChange = (tabId: TabData['id']) => {
    setActiveTab(tabId)
  }

  // Handle refresh
  const handleRefresh = () => {
    loadTabData(activeTab, true)
  }

  if (authLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className="pb-20 sm:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen"
          >
            {/* Tab-specific background gradient */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-30 pointer-events-none",
              activeTab === 'today' && "from-blue-50 via-indigo-50 to-purple-50",
              activeTab === 'growth' && "from-green-50 via-emerald-50 to-teal-50",
              activeTab === 'wellbeing' && "from-pink-50 via-rose-50 to-purple-50",
              activeTab === 'profile' && "from-purple-50 via-violet-50 to-indigo-50"
            )} />
            
            {/* Tab Content */}
            <div className="relative z-10">
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Blur overlay for iOS-style effect */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-gray-200" />
        
        {/* Navigation Content */}
        <div className="relative">
          <div className="flex items-center justify-around px-2 py-2 sm:py-3 max-w-lg mx-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl transition-all duration-200",
                    "hover:bg-gray-100/50 active:scale-95",
                    isActive && "bg-white shadow-lg"
                  )}
                >
                  <div className="relative">
                    <Icon 
                      className={cn(
                        "w-6 h-6 transition-all duration-200",
                        isActive ? tab.color : "text-gray-500",
                        isActive && "scale-110"
                      )} 
                    />
                    
                    {/* Loading indicator */}
                    {tabLoading[tab.id] && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      </div>
                    )}
                    
                    {/* Error indicator */}
                    {tabErrors[tab.id] && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                      </div>
                    )}
                  </div>
                  
                  <span className={cn(
                    "text-xs mt-1 font-medium transition-all duration-200",
                    isActive ? tab.color : "text-gray-500",
                    isActive && "font-semibold"
                  )}>
                    {tab.label}
                  </span>
                  
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={cn(
                        "absolute -top-0.5 left-2 right-2 h-0.5 rounded-full",
                        tab.id === 'today' && "bg-blue-600",
                        tab.id === 'growth' && "bg-green-600",
                        tab.id === 'wellbeing' && "bg-pink-600",
                        tab.id === 'profile' && "bg-purple-600"
                      )}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <motion.div
            className="absolute inset-0 border-4 border-gray-200 rounded-full"
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
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Loading Student Command Center
        </h2>
        <p className="text-gray-500 text-sm">
          Preparing your personalized dashboard...
        </p>
      </div>
    </div>
  )
}
