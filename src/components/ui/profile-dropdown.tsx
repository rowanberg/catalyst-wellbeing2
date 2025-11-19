'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { signOut } from '@/lib/redux/slices/authSlice'
import { 
  User, 
  School, 
  Settings, 
  LogOut, 
  ChevronDown,
  Shield,
  Bell,
  HelpCircle,
  Palette
} from 'lucide-react'

interface ProfileDropdownProps {
  className?: string
}

export function ProfileDropdown({ className = '' }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, profile } = useAppSelector((state) => state.auth)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSignOut = useCallback(async () => {
    try {
      await dispatch(signOut())
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }, [dispatch, router])

  const handleProfileClick = useCallback(() => {
    router.push('/teacher/profile')
    setIsOpen(false)
  }, [router])

  const handleSchoolClick = useCallback(() => {
    router.push('/teacher/school')
    setIsOpen(false)
  }, [router])

  const handleSettingsClick = useCallback(() => {
    router.push('/teacher/settings')
    setIsOpen(false)
  }, [router])

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      description: 'Manage your account',
      action: handleProfileClick,
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50'
    },
    {
      icon: School,
      label: 'Your School',
      description: 'School information',
      action: handleSchoolClick,
      color: 'text-emerald-600',
      bgColor: 'hover:bg-emerald-50'
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'Preferences & privacy',
      action: handleSettingsClick,
      color: 'text-gray-600',
      bgColor: 'hover:bg-gray-50'
    },
    {
      icon: LogOut,
      label: 'Logout',
      description: 'Sign out of your account',
      action: handleSignOut,
      color: 'text-red-600',
      bgColor: 'hover:bg-red-50',
      isDanger: true
    }
  ]

  if (!profile) return null

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Button - Matching Enterprise Header Design */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition-all duration-300 ${
          isOpen ? 'ring-2 ring-blue-500/20 border-blue-300/50 dark:border-blue-600/50' : ''
        }`}
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        {/* Avatar with enterprise styling */}
        <div className="relative">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
            {profile.first_name?.[0]}{profile.last_name?.[0]}
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm"></div>
        </div>

        {/* Profile Info - Matching header typography */}
        <div className="hidden sm:block text-left min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate max-w-32 lg:max-w-none" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {profile.first_name} {profile.last_name}
          </p>
          <p className="text-xs text-gray-600 dark:text-slate-400 font-medium capitalize" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {profile.role || 'Teacher'}
          </p>
        </div>

        {/* Chevron with enterprise styling */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="hidden sm:block"
        >
          <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-72 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-slate-400 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {user?.email || 'No email'}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs text-gray-600 dark:text-slate-400 font-medium capitalize" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {profile.role || 'Teacher'} • Online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.button
                    key={item.label}
                    onClick={item.action}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-150 ${
                      item.isDanger 
                        ? 'hover:bg-red-50 dark:hover:bg-red-950/20 border-t border-slate-100/50 dark:border-slate-700/50 mt-1' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      item.isDanger 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : item.label === 'Profile' 
                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                          : item.label === 'Your School'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30'
                            : 'bg-slate-100 dark:bg-slate-700/50'
                    }`}>
                      <Icon className={`w-4 h-4 ${item.color} ${item.isDanger ? '' : 'dark:text-slate-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${
                        item.isDanger ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-slate-100'
                      }`} style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {item.label}
                      </p>
                      <p className={`text-xs font-medium ${
                        item.isDanger ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-slate-400'
                      }`} style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {item.description}
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-100/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <span>Catalyst Platform</span>
                <div className="flex items-center space-x-2 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
                  <HelpCircle className="w-3 h-3" />
                  <span>Help</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
