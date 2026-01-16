'use client'

/**
 * Catalyst Wells Sidebar - Copilot-Style Refinement
 * Premium icons, smooth 250ms transitions, minimal design
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { VerificationBadge } from '@/components/ui/verification-badge'
import { useAppDispatch } from '@/lib/redux/hooks'
import { signOut } from '@/lib/redux/slices/authSlice'
import {
  LayoutDashboard, Sparkles, Heart, UserCircle2,
  PanelLeftClose, PanelLeftOpen, LogOut, Settings2, HelpCircle, Zap
} from 'lucide-react'

interface SidebarProps {
  activeTab: 'today' | 'growth' | 'wellbeing' | 'profile'
  onTabChange: (tab: 'today' | 'growth' | 'wellbeing' | 'profile') => void
  profile?: any
}

interface NavItem {
  id: 'today' | 'growth' | 'wellbeing' | 'profile'
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  description: string
}

// Premium navigation items - using CSS variables for dynamic themes
const navItems: NavItem[] = [
  {
    id: 'today',
    label: 'Dashboard',
    icon: LayoutDashboard,
    color: '', // Will use CSS variable
    bgColor: '', // Will use CSS variable
    description: 'Overview & tasks'
  },
  {
    id: 'growth',
    label: 'Growth',
    icon: Sparkles,
    color: '', // Will use CSS variable
    bgColor: '', // Will use CSS variable
    description: 'Your progress'
  },
  {
    id: 'wellbeing',
    label: 'Well-being',
    icon: Heart,
    color: '', // Will use CSS variable
    bgColor: '', // Will use CSS variable
    description: 'Health & mindfulness'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserCircle2,
    color: '', // Will use CSS variable
    bgColor: '', // Will use CSS variable
    description: 'Settings & achievements'
  }
]

export function Sidebar({ activeTab, onTabChange, profile }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()

  const handleCollapse = () => {
    setIsAnimating(true)
    setIsCollapsed(!isCollapsed)
    // Match the longest animation duration
    setTimeout(() => setIsAnimating(false), 400)
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      // Dispatch Redux signOut action (clears caches and Supabase session)
      await dispatch(signOut()).unwrap()
      // Small delay to ensure signOut completes
      await new Promise(resolve => setTimeout(resolve, 100))
      // Redirect to login page
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      // Still redirect even if error occurs
      router.push('/login')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <>
      {/* Desktop Sidebar - Copilot Style */}
      <motion.aside
        initial={{ x: -280, opacity: 0 }}
        animate={{
          x: 0,
          opacity: 1,
          width: isCollapsed ? 72 : 280
        }}
        transition={{
          x: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
          opacity: { duration: 0.2 },
          width: {
            type: 'spring',
            damping: 30,
            stiffness: 250,
            mass: 0.6,
            velocity: 0
          }
        }}
        className={cn(
          "hidden md:flex flex-col h-screen bg-white border-r border-slate-200",
          "z-40 fixed left-0 top-0",
          "will-change-[width]"
        )}
        style={{ overflow: 'hidden' }}
      >
        {/* Header - Refined */}
        <div className="px-4 py-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: {
                      opacity: { duration: 0.2, delay: 0.08 },
                      x: { duration: 0.25, ease: [0.4, 0, 0.2, 1], delay: 0.05 }
                    }
                  }}
                  exit={{
                    opacity: 0,
                    x: -10,
                    transition: {
                      opacity: { duration: 0.12 },
                      x: { duration: 0.15, ease: [0.4, 0, 0.6, 1] }
                    }
                  }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center">
                    <Image
                      src="/catalyst-logo.png"
                      alt="Catalyst Wells Logo"
                      width={36}
                      height={36}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 text-sm">Catalyst Wells</h2>
                    <p className="text-[11px] text-slate-500">Student Portal</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleCollapse}
              className={cn(
                "p-2 rounded-lg transition-colors duration-200 hover:bg-slate-100",
                isCollapsed && "mx-auto"
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <AnimatePresence mode="wait">
                {isCollapsed ? (
                  <motion.div
                    key="open"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <PanelLeftOpen className="w-5 h-5 text-slate-600" strokeWidth={2} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <PanelLeftClose className="w-5 h-5 text-slate-600" strokeWidth={2} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* User Profile Section - Refined */}
        <div className={cn(
          "px-4 py-4 border-b border-slate-200",
          isCollapsed && "px-3"
        )}>
          <div className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "gap-3"
          )}>
            <div className="relative shrink-0">
              <div className={cn(
                "rounded-full flex items-center justify-center text-white font-semibold shadow-sm overflow-hidden relative",
                isCollapsed ? "w-10 h-10 text-sm" : "w-11 h-11 text-base"
              )} style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))' }}>
                {(profile?.profilePicture || profile?.avatar_url || profile?.profile_picture_url) ? (
                  <img
                    src={profile?.profilePicture || profile?.avatar_url || profile?.profile_picture_url}
                    alt={`${profile?.first_name || 'User'}'s profile`}
                    className="w-full h-full object-cover absolute inset-0"
                    onError={(e) => {
                      // Hide broken image to reveal the initial behind it
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : null}
                {/* Initial letter - always visible as background, image covers it when loaded */}
                <span>{profile?.first_name?.charAt(0) || 'S'}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: 'var(--theme-secondary)' }} />
            </div>

            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: {
                    opacity: { duration: 0.2, delay: 0.1 },
                    x: { duration: 0.22, ease: [0.4, 0, 0.2, 1], delay: 0.08 }
                  }
                }}
                exit={{
                  opacity: 0,
                  x: -8,
                  transition: {
                    opacity: { duration: 0.1 },
                    x: { duration: 0.12, ease: [0.4, 0, 0.6, 1] }
                  }
                }}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <VerificationBadge size="sm" showText={false} />
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {profile?.school?.name || 'Catalyst Wells'}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation Items - Copilot Style */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center rounded-lg transition-all duration-200",
                  "relative group",
                  isActive ? "" : "hover:bg-slate-50",
                  isCollapsed ? "p-3 justify-center" : "px-3 py-2.5"
                )}
                style={isActive ? {
                  background: 'linear-gradient(to right, color-mix(in srgb, var(--theme-highlight) 20%, transparent), color-mix(in srgb, var(--theme-tertiary) 20%, transparent))'
                } : {}}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1 bottom-1 w-1 rounded-r shadow-sm transition-all duration-200"
                    style={{ background: 'linear-gradient(to bottom, var(--theme-primary), var(--theme-secondary))' }}
                  />
                )}

                <div className={cn(
                  "flex items-center",
                  isCollapsed ? "" : "gap-3 w-full"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-colors duration-250 shrink-0",
                    isActive ? "" : "text-slate-500 group-hover:text-slate-700"
                  )}
                    style={isActive ? { color: 'var(--theme-primary)' } : {}}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        transition: {
                          opacity: { duration: 0.18, delay: isAnimating ? 0 : 0.08 },
                          x: { duration: 0.2, ease: [0.4, 0, 0.2, 1], delay: isAnimating ? 0 : 0.05 }
                        }
                      }}
                      exit={{
                        opacity: 0,
                        x: -5,
                        transition: {
                          opacity: { duration: 0.1 },
                          x: { duration: 0.12, ease: [0.4, 0, 0.6, 1] }
                        }
                      }}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-slate-900" : "text-slate-700"
                      )}>
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.description}
                      </p>
                    </motion.div>
                  )}
                </div>
              </button>
            )
          })}
        </nav>

        {/* Luminex AI - Special Featured Item */}
        <div className={cn(
          "px-3 py-3 border-t border-slate-200",
          isCollapsed && "px-2"
        )}>
          <button
            onClick={() => router.push('/student/homework-helper')}
            className={cn(
              "w-full relative rounded-xl transition-all duration-200 overflow-hidden",
              "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700",
              "shadow-md hover:shadow-lg",
              isCollapsed ? "p-3" : "px-4 py-3"
            )}
            aria-label="Luminex AI Assistant"
          >

            <div className={cn(
              "relative flex items-center",
              isCollapsed ? "justify-center" : "gap-3"
            )}>
              <div className="relative">
                <Zap className="w-5 h-5 text-white" strokeWidth={2} fill="currentColor" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full" />
              </div>

              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: {
                      opacity: { duration: 0.18, delay: 0.08 },
                      x: { duration: 0.2, ease: [0.4, 0, 0.2, 1], delay: 0.05 }
                    }
                  }}
                  exit={{
                    opacity: 0,
                    x: -5,
                    transition: {
                      opacity: { duration: 0.1 },
                      x: { duration: 0.12, ease: [0.4, 0, 0.6, 1] }
                    }
                  }}
                  className="flex-1"
                >
                  <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                    Luminex AI
                    <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                  </p>
                  <p className="text-[11px] text-purple-100">
                    Homework assistant
                  </p>
                </motion.div>
              )}
            </div>
          </button>
        </div>

        {/* Bottom Actions - Refined */}
        <div className={cn(
          "px-3 py-4 border-t border-slate-200 space-y-1",
          isCollapsed && "px-2"
        )}>
          <button
            onClick={() => router.push('/student/settings')}
            className={cn(
              "w-full flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors duration-250",
              isCollapsed ? "justify-center" : "gap-3"
            )}
            aria-label="Settings"
          >
            <Settings2 className="w-5 h-5 text-slate-600" strokeWidth={2} />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15, delay: 0.08 }
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.1 }
                  }}
                  className="text-sm text-slate-700"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => router.push('/student/help')}
            className={cn(
              "w-full flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors duration-250",
              isCollapsed ? "justify-center" : "gap-3"
            )}
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5 text-slate-600" strokeWidth={2} />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15, delay: 0.08 }
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.1 }
                  }}
                  className="text-sm text-slate-700"
                >
                  Help
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={cn(
              "w-full flex items-center px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors duration-250 group",
              isCollapsed ? "justify-center" : "gap-3",
              isSigningOut && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Logout"
          >
            {isSigningOut ? (
              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 text-slate-600 group-hover:text-red-600 transition-colors duration-250" strokeWidth={2} />
            )}
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15, delay: 0.08 }
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.1 }
                  }}
                  className="text-sm text-slate-700 group-hover:text-red-600 transition-colors duration-250"
                >
                  {isSigningOut ? 'Signing out...' : 'Logout'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Spacer for fixed sidebar */}
      <motion.div
        className="hidden md:block flex-shrink-0"
        animate={{ width: isCollapsed ? 72 : 280 }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 250,
          mass: 0.6,
          velocity: 0
        }}
      />
    </>
  )
}
