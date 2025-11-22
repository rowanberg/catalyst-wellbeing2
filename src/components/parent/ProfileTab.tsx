'use client'

import React, { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  User,
  Settings,
  Bell,
  Users,
  Mail,
  Phone,
  School,
  Save,
  Check,
  ChevronRight,
  Loader,
  LogOut,
  X,
  Plus,
  Search,
  Moon,
  Sun
} from 'lucide-react'
import { useDarkMode } from '@/contexts/DarkModeContext'
import { useAppDispatch } from '@/lib/redux/hooks'
import { signOut } from '@/lib/redux/slices/authSlice'
import { useRouter } from 'next/navigation'
import { AdvancedProfilePictureUpload } from '@/components/ui/advanced-profile-picture-upload'

interface Child {
  id: string
  name: string
  grade: string
  school: string
  avatarUrl?: string
}

interface NotificationSetting {
  enabled: boolean
  threshold: number | null
  frequency: 'immediate' | 'daily' | 'weekly'
}

interface ProfileTabProps {
  parentId: string
  onChildSelect?: (childId: string) => void
  currentSelectedChild?: string | null
}

// Notification Toggle Component
const NotificationToggle = memo(({
  label,
  description,
  setting,
  onChange
}: {
  label: string
  description: string
  setting: NotificationSetting
  onChange: (setting: NotificationSetting) => void
}) => {
  return (
    <div className="flex items-start justify-between py-4 border-b border-slate-200 dark:border-slate-800 last:border-0">
      <div className="flex-1 pr-4">
        <p className="font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{description}</p>
        {setting.threshold !== null && (
          <div className="mt-2 flex items-center gap-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">Threshold:</label>
            <input
              type="number"
              value={setting.threshold}
              onChange={(e) => onChange({ ...setting, threshold: parseInt(e.target.value) })}
              className="w-16 px-2 py-1 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">%</span>
          </div>
        )}
        {setting.frequency && (
          <div className="mt-2 flex items-center gap-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">Frequency:</label>
            <select
              value={setting.frequency}
              onChange={(e) => onChange({ ...setting, frequency: e.target.value as any })}
              className="text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="immediate">Immediate</option>
              <option value="daily">Daily Summary</option>
              <option value="weekly">Weekly Summary</option>
            </select>
          </div>
        )}
      </div>
      <button
        onClick={() => onChange({ ...setting, enabled: !setting.enabled })}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setting.enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${setting.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
      </button>
    </div>
  )
})

NotificationToggle.displayName = 'NotificationToggle'

// Child Card Component
const ChildCard = memo(({ child, isActive, onClick }: {
  child: Child
  isActive: boolean
  onClick: () => void
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-4 rounded-lg border transition-all ${isActive
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
    >
      <div className="flex items-center gap-4">
        {child.avatarUrl ? (
          <div className="relative w-12 h-12">
            <Image
              src={child.avatarUrl}
              alt={child.name}
              fill
              className="rounded-full object-cover"
              sizes="48px"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {child.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        )}
        <div className="flex-1 text-left">
          <p className="font-semibold text-slate-900 dark:text-white">{child.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Grade {child.grade} • {child.school}</p>
        </div>
        <ChevronRight className={`h-4 w-4 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'
          }`} />
      </div>
    </motion.button>
  )
})

ChildCard.displayName = 'ChildCard'

export default function ProfileTab({ parentId, onChildSelect, currentSelectedChild }: ProfileTabProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [data, setData] = useState<any>(null)
  // Use parent's selected child or maintain local state
  const [localActiveChild, setLocalActiveChild] = useState<string | null>(null)
  const activeChild = currentSelectedChild !== undefined ? currentSelectedChild : localActiveChild
  const [notifications, setNotifications] = useState<Record<string, NotificationSetting>>({})
  const [profile, setProfile] = useState<any>({})
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [parentId])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/parents/settings?parent_id=${parentId}`)

      if (!response.ok) throw new Error('Failed to fetch settings')

      const result = await response.json()
      setData(result.data)
      setNotifications(result.data.notifications)
      setProfile(result.data.profile)
      // API returns avatarUrl in camelCase
      setAvatarUrl(result.data.profile?.avatarUrl)

      // Set first child as active if available and no child is selected
      if (result.data.children?.length > 0 && !activeChild) {
        const firstChildId = result.data.children[0].id
        if (currentSelectedChild === undefined) {
          setLocalActiveChild(firstChildId)
        }
        // Notify parent if callback provided
        if (onChildSelect && !currentSelectedChild) {
          onChildSelect(firstChildId)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/v1/parents/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId,
          notifications,
          profile: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone
          }
        })
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLinkChild = async () => {
    if (!studentId.trim() || !studentEmail.trim()) {
      setLinkError('Please enter both Student ID and Email')
      return
    }

    try {
      setLinkLoading(true)
      setLinkError('')

      console.log('Sending link request with parentId:', parentId)

      const response = await fetch('/api/v1/parents/link-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: parentId,
          studentId: studentId.trim(),
          studentEmail: studentEmail.trim()
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Refresh data
        await fetchSettings()
        setShowLinkModal(false)
        setStudentId('')
        setStudentEmail('')
      } else {
        setLinkError(result.error || 'Student not found. Please check the ID and Email.')
      }
    } catch (error) {
      console.error('Error linking child:', error)
      setLinkError('An error occurred. Please try again.')
    } finally {
      setLinkLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full pb-8">
        {/* Cover Banner Skeleton */}
        <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 h-24 lg:h-32 rounded-t-lg" />

        {/* Main Profile Card Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-b-lg border border-slate-200 dark:border-slate-800">
          {/* Profile Header Skeleton */}
          <div className="px-4 lg:px-6 pt-3 pb-2">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
              {/* Avatar Skeleton */}
              <div className="relative -mt-12 lg:-mt-16">
                <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 ring-4 ring-white dark:ring-slate-950 animate-pulse" />
              </div>

              {/* Name Section Skeleton */}
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                  <div className="space-y-2">
                    <div className="h-6 lg:h-7 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800" />

          {/* Children Section Skeleton */}
          <div className="px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-8 w-24 bg-blue-600 rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800" />

          {/* Two Column Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 lg:px-6 py-4">
            {/* Payments Card Skeleton */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl p-4">
                  <div className="h-3 w-20 bg-emerald-200 dark:bg-emerald-800 rounded mb-2 animate-pulse" />
                  <div className="h-8 w-24 bg-emerald-300 dark:bg-emerald-700 rounded animate-pulse" />
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/40 rounded-2xl p-4">
                  <div className="h-3 w-16 bg-orange-200 dark:bg-orange-800 rounded mb-2 animate-pulse" />
                  <div className="h-8 w-20 bg-orange-300 dark:bg-orange-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-12 w-full bg-emerald-500 rounded-2xl animate-pulse" />
            </div>

            {/* Notifications Card Skeleton */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-36 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    </div>
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="h-12 w-full bg-blue-600 rounded-2xl mt-6 animate-pulse" />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800" />

          {/* Account Actions Skeleton */}
          <div className="px-4 lg:px-6 py-3">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="flex-1 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-8">
      {/* Compact Cover Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 h-24 lg:h-32 rounded-t-xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 bg-white/90 hover:bg-white rounded-full transition-all shadow-md"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-gray-700" />
            ) : (
              <Moon className="h-4 w-4 text-gray-700" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Main Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-b-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-gray-800"
      >
        {/* Compact Profile Header */}
        <div className="px-4 lg:px-6 pt-3 pb-2">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
            {/* Profile Photo - Smaller & Compact */}
            <div className="relative -mt-12 lg:-mt-16">
              {avatarUrl ? (
                <div className="relative w-24 h-24 lg:w-28 lg:h-28">
                  <Image
                    src={avatarUrl}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    fill
                    className="rounded-full object-cover ring-4 ring-white dark:ring-gray-900"
                    sizes="(max-width: 1024px) 96px, 112px"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ring-4 ring-white dark:ring-gray-900">
                  <span className="text-white font-bold text-2xl lg:text-3xl">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 w-7 h-7 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-md border-2 border-white dark:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPhoto ? (
                  <Loader className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Name and Status - Horizontal Layout */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Parent Account</p>
                </div>

                {/* Status Pills - Compact */}
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white rounded-full text-xs font-medium hover:bg-gray-800 transition-colors">
                    <span>😊</span>
                    <span className="hidden lg:inline">Away</span>
                  </button>
                  <button className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium hover:bg-emerald-200 transition-colors">
                    <span>💼</span>
                    <span className="hidden lg:inline">Work</span>
                  </button>
                  <button className="flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 transition-colors">
                    <span>😴</span>
                    <span className="hidden lg:inline">Sleep</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800" />

        {/* Children Section - Compact */}
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">My Children</h2>
            <button
              onClick={() => setShowLinkModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Link Child
            </button>
          </div>
          {data?.children && data.children.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
              {data.children.map((child: Child) => (
                <button
                  key={child.id}
                  onClick={() => {
                    // Update local state if not controlled
                    if (currentSelectedChild === undefined) {
                      setLocalActiveChild(child.id)
                    }
                    // Always notify parent if callback provided
                    if (onChildSelect) {
                      onChildSelect(child.id)
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all border ${activeChild === child.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-sm'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                >
                  {child.avatarUrl ? (
                    <div className="relative w-10 h-10">
                      <Image src={child.avatarUrl} alt={child.name} fill className="rounded-full object-cover" sizes="40px" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {child.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <p className={`font-medium text-sm truncate ${activeChild === child.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                      {child.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      Grade {child.grade}
                    </p>
                  </div>
                  {activeChild === child.id && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No children linked yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Click "Link Child" to get started</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800" />

        {/* Two Column Grid - Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 lg:px-6 py-4">
          {/* Payments Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Payments</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fee Status Overview</p>
              </div>
            </div>

            {/* Payment Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 rounded-2xl p-4">
                <p className="text-xs text-emerald-600 font-medium mb-1">Paid Amount</p>
                <p className="text-2xl font-bold text-emerald-700">$2,450</p>
                <p className="text-xs text-emerald-600 mt-1">✓ Up to date</p>
              </div>
              <div className="bg-orange-50 rounded-2xl p-4">
                <p className="text-xs text-orange-600 font-medium mb-1">Pending</p>
                <p className="text-2xl font-bold text-orange-700">$850</p>
                <p className="text-xs text-orange-600 mt-1">Due: Dec 15</p>
              </div>
            </div>

            {/* Total */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Annual Fee</p>
                  <p className="text-xl font-bold text-gray-900">$3,300</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-xs font-semibold text-blue-700">74% Paid</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-3">Recent Transactions</p>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Term 2 Fees</p>
                    <p className="text-xs text-gray-500">Nov 1, 2024</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600">$1,100</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Term 1 Fees</p>
                    <p className="text-xs text-gray-500">Aug 15, 2024</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600">$1,350</span>
              </div>
            </div>

            {/* Pay Now Button */}
            <button className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg">
              Pay Pending Amount
            </button>
          </motion.div>

          {/* Notification Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Notifications</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manage your alerts</p>
              </div>
            </div>

            <div className="space-y-4">
              <NotificationToggle
                label="Grade Updates"
                description="Get notified about new grades"
                setting={notifications.gradeUpdates || { enabled: true, threshold: 80, frequency: 'immediate' }}
                onChange={(setting) => setNotifications({ ...notifications, gradeUpdates: setting })}
              />
              <NotificationToggle
                label="Attendance Alerts"
                description="Notify when child is absent"
                setting={notifications.attendance || { enabled: true, threshold: null, frequency: 'immediate' }}
                onChange={(setting) => setNotifications({ ...notifications, attendance: setting })}
              />
              <NotificationToggle
                label="Assignment Due"
                description="Reminders for upcoming work"
                setting={notifications.assignments || { enabled: true, threshold: null, frequency: 'daily' }}
                onChange={(setting) => setNotifications({ ...notifications, assignments: setting })}
              />
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-5 h-5" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </motion.div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800" />

        {/* Account Actions Section */}
        <div className="px-4 lg:px-6 py-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Account</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
              Account Settings
            </button>
            <button
              onClick={async () => {
                try {
                  await dispatch(signOut()).unwrap()
                  router.push('/login')
                } catch (error) {
                  console.error('Logout error:', error)
                  router.push('/login')
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>

      {/* Hidden file input with compression */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return

          setUploadingPhoto(true)

          try {
            // Import the compression library
            const imageCompression = (await import('browser-image-compression')).default

            // Compress the image
            const options = {
              maxSizeMB: 0.5,
              maxWidthOrHeight: 800,
              useWebWorker: false, // Disabled to avoid CSP issues
              fileType: 'image/jpeg',
              initialQuality: 0.9
            }

            const compressedFile = await imageCompression(file, options)
            console.log('✅ Original:', (file.size / 1024 / 1024).toFixed(2), 'MB → Compressed:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB')

            // Convert to base64 for upload
            const reader = new FileReader()
            reader.onloadend = async () => {
              const base64String = reader.result as string

              try {
                // Upload to backend
                const response = await fetch('/api/v1/parents/profile-picture', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    parentId,
                    imageData: base64String
                  })
                })

                if (response.ok) {
                  const result = await response.json()
                  setAvatarUrl(result.data.avatar_url)
                  console.log('✅ Profile picture uploaded successfully!')

                  // Show success feedback
                  setSaved(true)
                  setTimeout(() => setSaved(false), 3000)
                } else {
                  const error = await response.json()
                  console.error('❌ Upload failed:', error.error)
                  alert('Failed to upload profile picture. Please try again.')
                }
              } catch (uploadError) {
                console.error('❌ Upload error:', uploadError)
                alert('Error uploading image. Please check your connection.')
              } finally {
                setUploadingPhoto(false)
              }
            }
            reader.readAsDataURL(compressedFile)
          } catch (error) {
            console.error('❌ Compression error:', error)
            alert('Error processing image. Please try a different image.')
            setUploadingPhoto(false)
          }

          // Reset input
          e.target.value = ''
        }}
      />

      {/* Link Child Modal */}
      <AnimatePresence>
        {showLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLinkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Link Child</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Connect your child's account</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    i
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">How to link your child:</p>
                    <p className="text-xs text-blue-800 dark:text-blue-200">Enter both your child's Student ID and Email address to connect their account.</p>
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => {
                        setStudentId(e.target.value)
                        setLinkError('')
                      }}
                      placeholder="Enter Student ID"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Student Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => {
                        setStudentEmail(e.target.value)
                        setLinkError('')
                      }}
                      placeholder="student@school.edu"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                </div>

                {linkError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 dark:text-red-400 text-xs flex items-center gap-1"
                  >
                    <span className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xs">!</span>
                    {linkError}
                  </motion.p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkChild}
                  disabled={linkLoading || !studentId.trim() || !studentEmail.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {linkLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Link Child
                    </>
                  )}
                </button>
              </div>

              {/* Success Animation Placeholder */}
              {linkLoading && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
