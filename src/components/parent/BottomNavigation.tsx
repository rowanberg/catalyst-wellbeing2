'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Home, 
  Users, 
  TrendingUp, 
  User,
  Bell,
  Heart
} from 'lucide-react'
import { useDarkMode } from '@/contexts/DarkModeContext'

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  hasNotifications?: boolean
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'wellbeing', label: 'Wellbeing', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User }
]

export default function BottomNavigation({ activeTab, onTabChange, hasNotifications }: BottomNavigationProps) {
  const { isDarkMode } = useDarkMode()
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-lg md:hidden safe-area-inset-bottom">
      <div className="grid grid-cols-5 h-16" style={{ willChange: 'transform' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center gap-1 transition-all duration-200 min-h-[44px] min-w-[44px] p-2 active:scale-95 active:bg-gray-100 dark:active:bg-gray-800 rounded-lg mx-1 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              style={{ 
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transform: 'translateZ(0)' // Force hardware acceleration
              }}
            >
              {/* Active indicator line */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500" />
              )}
              
              <div className="relative">
                <Icon 
                  className={`h-5 w-5 transition-colors ${
                    isActive ? 'text-blue-600 dark:text-blue-500' : 'text-gray-500 dark:text-gray-400'
                  }`}
                  strokeWidth={2}
                />
                
                {/* Notification badge */}
                {tab.id === 'home' && hasNotifications && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </div>
              
              <span className={`text-[10px] transition-colors ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-500 font-medium' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Desktop sidebar navigation (for larger screens)
export function DesktopNavigation({ activeTab, onTabChange, hasNotifications }: BottomNavigationProps) {
  const { isDarkMode } = useDarkMode()
  
  return (
    <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm z-40">
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 dark:from-slate-200 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight" style={{ fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>Catalyst Wells</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-semibold tracking-wide" style={{ fontFamily: 'Inter, SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>Parent Portal</p>
        </div>
        
        {/* Navigation items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-h-[44px] active:scale-98 ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                  {tab.id === 'home' && hasNotifications && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                  )}
                </div>
                <span className={`text-sm ${
                  isActive ? 'font-medium' : 'font-normal'
                }`}>
                  {tab.label}
                </span>
                
                {isActive && (
                  <div className="ml-auto w-1 h-5 bg-blue-600 dark:bg-blue-500 rounded-full" />
                )}
              </button>
            )
          })}
        </nav>
        
        {/* Quick Actions */}
        {hasNotifications && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button 
              className="w-full flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 min-h-[44px] active:scale-98 shadow-sm hover:shadow-md"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="text-sm font-medium">Action Required</span>
              <Bell className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
