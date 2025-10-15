'use client'

import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex-1 pr-4">
        <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{description}</p>
        {setting.threshold !== null && (
          <div className="mt-2 flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Threshold:</label>
            <input
              type="number"
              value={setting.threshold}
              onChange={(e) => onChange({ ...setting, threshold: parseInt(e.target.value) })}
              className="w-16 px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
          </div>
        )}
        {setting.frequency && (
          <div className="mt-2 flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Frequency:</label>
            <select
              value={setting.frequency}
              onChange={(e) => onChange({ ...setting, frequency: e.target.value as any })}
              className="text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          setting.enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            setting.enabled ? 'translate-x-6' : 'translate-x-1'
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
      className={`w-full p-4 rounded-xl border transition-all ${
        isActive 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-md' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-4">
        {child.avatarUrl ? (
          <img 
            src={child.avatarUrl} 
            alt={child.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {child.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        )}
        <div className="flex-1 text-left">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{child.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Grade {child.grade} • {child.school}</p>
        </div>
        <ChevronRight className={`h-4 w-4 transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-400'
        }`} />
      </div>
    </motion.button>
  )
})

ChildCard.displayName = 'ChildCard'

export default function ProfileTab({ parentId }: ProfileTabProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [data, setData] = useState<any>(null)
  const [activeChild, setActiveChild] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Record<string, NotificationSetting>>({})
  const [profile, setProfile] = useState<any>({})
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')

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
      
      // Set first child as active if available
      if (result.data.children?.length > 0 && !activeChild) {
        setActiveChild(result.data.children[0].id)
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
      <div className="max-w-md mx-auto space-y-6 pb-8">
        {/* Profile Card Skeleton */}
        <div className="bg-white rounded-3xl p-6 shadow-sm animate-pulse">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
          </div>

          {/* Avatar and Name */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mx-auto" />
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-gray-200 rounded-full" />
            </div>
            <div className="h-6 w-40 bg-gray-200 rounded mx-auto mb-2" />
            <div className="h-4 w-24 bg-gray-100 rounded mx-auto" />
          </div>

          {/* Status Pills */}
          <div className="mb-6">
            <div className="h-3 w-16 bg-gray-100 rounded mb-3" />
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-gray-900 rounded-full" />
              <div className="h-9 w-28 bg-emerald-100 rounded-full" />
              <div className="h-9 w-20 bg-orange-100 rounded-full" />
            </div>
          </div>

          {/* Manage Children */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-32 bg-gray-100 rounded" />
              <div className="h-7 w-24 bg-blue-600 rounded-full" />
            </div>
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-3 w-16 bg-gray-100 rounded" />
                  </div>
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Items */}
          <div className="space-y-3">
            <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
            {[1, 2].map(i => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full" />
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                </div>
                <div className="w-4 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>

          {/* Account Actions */}
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
            <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Payments Card Skeleton */}
        <div className="bg-white rounded-3xl p-6 shadow-sm animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-full" />
            <div className="space-y-2">
              <div className="h-5 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
          </div>

          {/* Payment Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-50 rounded-2xl p-4">
              <div className="h-3 w-20 bg-emerald-200 rounded mb-2" />
              <div className="h-8 w-24 bg-emerald-300 rounded mb-2" />
              <div className="h-3 w-16 bg-emerald-200 rounded" />
            </div>
            <div className="bg-orange-50 rounded-2xl p-4">
              <div className="h-3 w-16 bg-orange-200 rounded mb-2" />
              <div className="h-8 w-20 bg-orange-300 rounded mb-2" />
              <div className="h-3 w-20 bg-orange-200 rounded" />
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-28 bg-gray-200 rounded" />
                <div className="h-6 w-20 bg-gray-300 rounded" />
              </div>
              <div className="h-7 w-20 bg-blue-100 rounded-full" />
            </div>
          </div>

          {/* Transactions */}
          <div className="space-y-2">
            <div className="h-3 w-36 bg-gray-100 rounded mb-3" />
            {[1, 2].map(i => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full" />
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>

          {/* Pay Button */}
          <div className="h-12 w-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl mt-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-8">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm dark:shadow-xl"
      >
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Profile</h1>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>

        {/* Profile Avatar and Name */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-3xl">
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {profile.firstName} {profile.lastName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Parent Account</p>
        </div>

        {/* Dark Mode Toggle */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Reduce eye strain in low light</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Status Pills */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">My Status</p>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium">
              <span className="text-yellow-400">😊</span>
              <span>Away</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm">
              <span>💼</span>
              <span>At Work</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm">
              <span>😴</span>
              <span>Sleep</span>
            </button>
          </div>
        </div>

        {/* Manage Children Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">Select Child to View</p>
            <button
              onClick={() => setShowLinkModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Child
            </button>
          </div>
          {data?.children && data.children.length > 0 ? (
            <div className="space-y-2">
              {data.children.map((child: Child) => (
                <button
                  key={child.id}
                  onClick={() => {
                    setActiveChild(child.id)
                    // Notify parent component of child selection to update all tabs
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('childSelected', { 
                        detail: { 
                          childId: child.id,
                          childName: child.name,
                          childGrade: child.grade
                        } 
                      }))
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-colors ${
                    activeChild === child.id ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {child.avatarUrl ? (
                    <img src={child.avatarUrl} alt={child.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ${
                      activeChild === child.id ? 'ring-2 ring-white' : ''
                    }`}>
                      <span className="text-white font-bold text-sm">
                        {child.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className={`font-semibold text-sm ${activeChild === child.id ? 'text-white' : 'text-gray-900'}`}>
                      {child.name}
                    </p>
                    <p className={`text-xs ${activeChild === child.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      Grade {child.grade}
                    </p>
                  </div>
                  {activeChild === child.id && (
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-2xl">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No children linked</p>
            </div>
          )}
        </div>

        {/* Dashboard Section */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Dashboard</p>
          
          {/* Achievements */}
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-900">Achievements</span>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Privacy */}
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900">Privacy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">Actions Needed</span>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Account Actions */}
        <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
          <p className="text-xs text-gray-500">My Account</p>
          <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
            Switch to Other Account
          </button>
          <button 
            onClick={async () => {
              try {
                await dispatch(signOut()).unwrap()
                router.push('/login')
              } catch (error) {
                console.error('Logout error:', error)
                // Fallback: force navigation to login
                router.push('/login')
              }
            }}
            className="text-orange-600 hover:text-orange-700 font-semibold text-sm block"
          >
            Log Out
          </button>
        </div>
      </motion.div>

      {/* Payments Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm dark:shadow-xl"
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
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
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
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
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
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Link Child</h3>
                    <p className="text-xs text-gray-500">Connect your child's account</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    i
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">How to link your child:</p>
                    <p className="text-xs text-blue-800">Enter both your child's Student ID and Email address to connect their account.</p>
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {linkError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-xs flex items-center gap-1"
                  >
                    <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-xs">!</span>
                    {linkError}
                  </motion.p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors"
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
                  <div className="inline-flex items-center gap-2 text-sm text-gray-600">
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
