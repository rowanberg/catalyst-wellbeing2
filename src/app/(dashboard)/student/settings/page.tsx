'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo, memo, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/lib/redux/hooks'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ThemeLoader } from '@/components/student/ThemeLoader'
import {
  Settings,
  ArrowLeft,
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Accessibility,
  Users,
  Eye,
  EyeOff,
  Copy,
  Check,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Zap,
  Heart,
  Star,
  RotateCw,
  Smartphone,
  Monitor,
  Tablet,
  Save,
  RefreshCw,
  Key,
  AlertTriangle,
  ExternalLink,
  LogOut,
  MessageCircle,
  Phone,
  Link
} from 'lucide-react'

// Lazy load heavy components
const AdvancedProfilePictureUpload = lazy(() => import('@/components/ui/advanced-profile-picture-upload').then(mod => ({ default: mod.AdvancedProfilePictureUpload })))

// Static configuration data (outside component for performance)
const PRIVACY_SETTINGS = [
  { key: 'privateProfile', label: 'Private Profile', description: 'Hide your profile from other users', icon: EyeOff },
  { key: 'dataSync', label: 'Data Sync', description: 'Sync your data across devices', icon: RotateCw }
] as const

const NOTIFICATION_SETTINGS = [
  { key: 'notifications', label: 'Push Notifications', description: 'Receive updates and reminders', icon: Bell },
  { key: 'soundEffects', label: 'Sound Effects', description: 'Play sounds for interactions', icon: Volume2 },
  { key: 'animations', label: 'Animations', description: 'Enable smooth transitions', icon: Zap },
  { key: 'hapticFeedback', label: 'Haptic Feedback', description: 'Feel vibrations for interactions', icon: Heart }
] as const

// Memoized setting item component
const SettingItem = memo(({
  settingKey,
  label,
  description,
  icon: Icon,
  checked,
  onChange,
  iconColor = 'blue'
}: {
  settingKey: string
  label: string
  description: string
  icon: any
  checked: boolean
  onChange: (checked: boolean) => void
  iconColor?: 'blue' | 'green'
}) => {

  return (
    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-highlight) 50%, transparent)', borderColor: 'color-mix(in srgb, var(--theme-accent) 20%, transparent)' }}>
      {/* Mobile Layout */}
      <div className="sm:hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg flex-shrink-0 mt-0.5" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-secondary) 20%, transparent)' }}>
              <Icon className="h-3 w-3" style={{ color: 'var(--theme-primary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 font-medium text-xs">{label}</p>
              <p className="text-slate-600 text-[10px] mt-0.5 leading-relaxed">{description}</p>
            </div>
          </div>
          <Switch
            checked={checked}
            onCheckedChange={onChange}
            className="flex-shrink-0 ml-2 data-[state=unchecked]:bg-slate-200"
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-secondary) 20%, transparent)' }}>
            <Icon className="h-5 w-5" style={{ color: 'var(--theme-primary)' }} />
          </div>
          <div>
            <p className="text-slate-800 font-medium">{label}</p>
            <p className="text-slate-600 text-sm">{description}</p>
          </div>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          className="data-[state=unchecked]:bg-slate-200"
        />
      </div>
    </div>
  )
})
SettingItem.displayName = 'SettingItem'

interface Profile {
  id?: string
  first_name?: string
  last_name?: string
  profile_picture_url?: string
  [key: string]: any
}

interface SettingsState {
  theme: 'fiery-rose' | 'ocean-sunset' | 'fresh-meadow' | 'autumn-ember'
  notifications: boolean
  soundEffects: boolean
  privateProfile: boolean
  autoSave: boolean
  animations: boolean
  hapticFeedback: boolean
  dataSync: boolean
  fontSize: number
  language: string
}

interface WhatsAppConfig {
  phoneNumber: string
  whatsappLink: string
  isEnabled: boolean
}


const StudentSettingsPage = () => {
  const router = useRouter()
  const { profile: reduxProfile } = useAppSelector((state) => state.auth)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showStudentId, setShowStudentId] = useState(false)
  const [copiedStudentId, setCopiedStudentId] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    phoneNumber: '',
    whatsappLink: '',
    isEnabled: false
  })

  const [settings, setSettings] = useState<SettingsState>({
    theme: 'fresh-meadow',
    notifications: true,
    soundEffects: true,
    privateProfile: false,
    autoSave: true,
    animations: true,
    hapticFeedback: true,
    dataSync: true,
    fontSize: 16,
    language: 'English'
  })


  // Optimized API cache
  const apiCache = useRef<Map<string, { data: any, timestamp: number }>>(new Map())
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const getCachedData = useCallback((key: string) => {
    const cached = apiCache.current.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }, [])
  const setCachedData = useCallback((key: string, data: any) => {
    apiCache.current.set(key, { data, timestamp: Date.now() })
  }, [])




  // WhatsApp configuration functions
  const checkWhatsAppConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/student/whatsapp-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })

      if (response.ok) {
        const whatsappData = await response.json()
        setWhatsappConfig({
          phoneNumber: whatsappData.phoneNumber || '',
          whatsappLink: whatsappData.whatsappLink || '',
          isEnabled: whatsappData.isEnabled || false
        })
      }
    } catch (error) {
      console.error('Error fetching WhatsApp configuration:', error)
    }
  }, [])

  const saveWhatsAppConfig = useCallback(async (config: WhatsAppConfig) => {
    try {
      setSaving(true)
      const response = await fetch('/api/student/whatsapp-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          phoneNumber: config.phoneNumber,
          whatsappLink: config.whatsappLink,
          isEnabled: config.isEnabled
        })
      })

      if (response.ok) {
        showToast('WhatsApp configuration saved successfully!', 'success')
        setHasUnsavedChanges(false)
      } else {
        showToast('Failed to save WhatsApp configuration', 'error')
      }
    } catch (error) {
      showToast('Failed to save WhatsApp configuration', 'error')
    } finally {
      setSaving(false)
    }
  }, [])

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')
    // Check if it's a valid international format (8-15 digits)
    return cleanPhone.length >= 8 && cleanPhone.length <= 15
  }

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '')
    // Ensure it starts with + if it doesn't already
    if (cleaned && !cleaned.startsWith('+')) {
      return '+' + cleaned
    }
    return cleaned
  }

  const generateWhatsAppLink = (phoneNumber: string): string => {
    if (!phoneNumber) return ''
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    return `https://wa.me/${cleanPhone}`
  }

  // Optimized fetch with caching and parallel requests
  const fetchProfileAndSettings = useCallback(async () => {
    try {
      setLoading(true)

      // Check cache first
      const cachedProfile = getCachedData('profile')
      const cachedSettings = getCachedData('settings')

      if (cachedProfile && cachedSettings) {
        setProfile(cachedProfile)
        setSettings(prev => ({ ...prev, ...cachedSettings }))
        setHasUnsavedChanges(false) // Clear unsaved changes flag when using cache
        setLoading(false)
        return
      }

      // Parallel API calls for better performance
      const [profileResponse, settingsResponse] = await Promise.all([
        fetch('/api/student/profile'),
        fetch('/api/student/settings')
      ])

      // Process profile
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setProfile(profileData.profile)
        setCachedData('profile', profileData.profile)
      } else {
        setProfile(reduxProfile)
      }

      // Process settings
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setSettings(prev => ({ ...prev, ...settingsData.settings }))
        setCachedData('settings', settingsData.settings)
        setHasUnsavedChanges(false) // Clear unsaved changes flag on initial load
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setProfile(reduxProfile)
    } finally {
      setLoading(false)
    }
  }, [reduxProfile, getCachedData, setCachedData])

  useEffect(() => {
    // Use single fetch to reduce initial load time
    const initializeSettings = async () => {
      await Promise.all([
        fetchProfileAndSettings(),
        checkWhatsAppConfig()
      ])
    }
    initializeSettings()
  }, [fetchProfileAndSettings, checkWhatsAppConfig]) // Only run once on mount

  // Debounced save settings with optimistic updates
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const saveSettings = useCallback(async (settingsToSave = settings) => {
    try {
      setSaving(true)

      // Optimistic update to cache
      setCachedData('settings', settingsToSave)

      const response = await fetch('/api/student/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ settings: settingsToSave })
      })

      if (response.ok) {
        showToast('Settings saved successfully!', 'success')
        setHasUnsavedChanges(false) // Clear unsaved changes flag
      } else {
        showToast('Failed to save settings', 'error')
        // Revert optimistic update on failure
        const cachedSettings = getCachedData('settings')
        if (cachedSettings) {
          setSettings(prev => ({ ...prev, ...cachedSettings }))
        }
      }
    } catch (error) {
      showToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }, [settings, setCachedData, getCachedData])

  // Remove auto-save - only save when user clicks save button
  // This prevents unnecessary API calls and frequent reloading

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-2xl shadow-2xl z-[10000] transform transition-all duration-500 backdrop-blur-xl border ${type === 'success'
        ? 'bg-green-500/90 text-white border-green-400/50'
        : 'bg-red-500/90 text-white border-red-400/50'
      }`
    toast.textContent = message
    toast.style.transform = 'translateX(100%)'

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.transform = 'translateX(0)'
    }, 100)

    setTimeout(() => {
      toast.style.transform = 'translateX(100%)'
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 500)
    }, 3000)
  }

  const copyStudentId = async () => {
    if (profile?.id) {
      try {
        await navigator.clipboard.writeText(profile.id)
        setCopiedStudentId(true)
        showToast('Student ID copied to clipboard!', 'success')
        setTimeout(() => setCopiedStudentId(false), 2000)
      } catch (error) {
        showToast('Failed to copy Student ID', 'error')
      }
    }
  }

  const handleSettingChange = useCallback((key: keyof SettingsState, value: any) => {
    setSettings(prev => {
      // Early return if value hasn't changed (prevent unnecessary re-renders)
      if (prev[key] === value) return prev

      const newSettings = { ...prev, [key]: value }

      // Batch DOM updates using requestAnimationFrame
      requestAnimationFrame(() => {
        // Apply theme changes immediately with cross-account persistence
        if (key === 'theme') {
          // Apply custom theme colors using CSS variables
          const root = document.documentElement

          if (value === 'fiery-rose') {
            root.style.setProperty('--theme-primary', '#F08080')
            root.style.setProperty('--theme-secondary', '#F4978E')
            root.style.setProperty('--theme-tertiary', '#FBC4AB')
            root.style.setProperty('--theme-accent', '#F8AD9D')
            root.style.setProperty('--theme-highlight', '#FFF5EE')
          } else if (value === 'ocean-sunset') {
            root.style.setProperty('--theme-primary', '#000814')
            root.style.setProperty('--theme-secondary', '#001d3d')
            root.style.setProperty('--theme-tertiary', '#003566')
            root.style.setProperty('--theme-accent', '#ffc300')
            root.style.setProperty('--theme-highlight', '#ffd60a')
          } else if (value === 'fresh-meadow') {
            root.style.setProperty('--theme-primary', '#22577a')
            root.style.setProperty('--theme-secondary', '#38a3a5')
            root.style.setProperty('--theme-tertiary', '#57cc99')
            root.style.setProperty('--theme-accent', '#80ed99')
            root.style.setProperty('--theme-highlight', '#c7f9cc')
          } else if (value === 'autumn-ember') {
            root.style.setProperty('--theme-primary', '#ea8c55')
            root.style.setProperty('--theme-secondary', '#c75146')
            root.style.setProperty('--theme-tertiary', '#ad2e24')
            root.style.setProperty('--theme-accent', '#81171b')
            root.style.setProperty('--theme-highlight', '#540804')
          }

          // Store theme preference globally for cross-account consistency
          localStorage.setItem('catalyst-theme-preference', value)

          // Dispatch custom event for same-window theme changes
          window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: value } }))
        }

        // Apply font size changes immediately with accessibility persistence
        if (key === 'fontSize') {
          document.documentElement.style.fontSize = `${value}px`
          localStorage.setItem('catalyst-font-size', value.toString())
        }

        // Apply language changes with cross-account support
        if (key === 'language') {
          document.documentElement.lang = value.toLowerCase().substring(0, 2)
          localStorage.setItem('catalyst-language', value)
        }

        // Haptic feedback with user preference respect
        if (newSettings.hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(50)
        }
      })

      return newSettings
    })

    // Mark as having unsaved changes
    setHasUnsavedChanges(true)
  }, [])

  // Sign out function
  const handleSignOut = async () => {
    try {
      console.log('🚪 [SIGN-OUT] Signing out user...')

      // Sign out from Supabase
      const { supabase } = await import('@/lib/supabaseClient')
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign out error:', error)
        showToast('There was an error signing out. Please try again.', 'error')
        return
      }

      // Clear any local storage or session data
      localStorage.clear()
      sessionStorage.clear()

      showToast('You have been signed out safely.', 'success')

      // Redirect to login page
      router.push('/login')

    } catch (error) {
      console.error('Sign out error:', error)
      showToast('There was an error signing out. Please try again.', 'error')
    }
  }

  // Initialize cross-account settings on load
  useEffect(() => {
    // Apply stored global preferences
    const storedTheme = localStorage.getItem('catalyst-theme-preference') as 'fiery-rose' | 'ocean-sunset' | 'fresh-meadow' | 'autumn-ember' | null
    const storedFontSize = localStorage.getItem('catalyst-font-size')
    const storedLanguage = localStorage.getItem('catalyst-language')

    if (storedTheme && ['fiery-rose', 'ocean-sunset', 'fresh-meadow', 'autumn-ember'].includes(storedTheme)) {
      const root = document.documentElement

      if (storedTheme === 'fiery-rose') {
        root.style.setProperty('--theme-primary', '#F08080')
        root.style.setProperty('--theme-secondary', '#F4978E')
        root.style.setProperty('--theme-tertiary', '#FBC4AB')
        root.style.setProperty('--theme-accent', '#F8AD9D')
        root.style.setProperty('--theme-highlight', '#FFF5EE')
      } else if (storedTheme === 'ocean-sunset') {
        root.style.setProperty('--theme-primary', '#000814')
        root.style.setProperty('--theme-secondary', '#001d3d')
        root.style.setProperty('--theme-tertiary', '#003566')
        root.style.setProperty('--theme-accent', '#ffc300')
        root.style.setProperty('--theme-highlight', '#ffd60a')
      } else if (storedTheme === 'fresh-meadow') {
        root.style.setProperty('--theme-primary', '#22577a')
        root.style.setProperty('--theme-secondary', '#38a3a5')
        root.style.setProperty('--theme-tertiary', '#57cc99')
        root.style.setProperty('--theme-accent', '#80ed99')
        root.style.setProperty('--theme-highlight', '#c7f9cc')
      } else if (storedTheme === 'autumn-ember') {
        root.style.setProperty('--theme-primary', '#ea8c55')
        root.style.setProperty('--theme-secondary', '#c75146')
        root.style.setProperty('--theme-tertiary', '#ad2e24')
        root.style.setProperty('--theme-accent', '#81171b')
        root.style.setProperty('--theme-highlight', '#540804')
      }

      setSettings(prev => ({ ...prev, theme: storedTheme }))
    }

    if (storedFontSize) {
      const fontSize = parseInt(storedFontSize)
      if (fontSize >= 12 && fontSize <= 24) {
        document.documentElement.style.fontSize = `${fontSize}px`
      }
    }

    if (storedLanguage) {
      document.documentElement.lang = storedLanguage.toLowerCase().substring(0, 2)
    }
  }, [])

  // Memoize loading state to prevent re-renders
  const loadingScreen = useMemo(() => {
    if (!loading) return null
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5EE] via-[#FFE4E1] to-[#FFDAB9] flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#F08080]/20 border-t-[#F4978E]"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#F8AD9D] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    )
  }, [loading])

  if (loadingScreen) return loadingScreen

  return (
    <UnifiedAuthGuard requiredRole="student">
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, var(--theme-highlight), color-mix(in srgb, var(--theme-secondary) 20%, white), var(--theme-tertiary))' }}>
        {/* Theme Loader */}
        <ThemeLoader />

        {/* Premium Background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--theme-primary) 10%, transparent), color-mix(in srgb, var(--theme-secondary) 10%, transparent), color-mix(in srgb, var(--theme-tertiary) 10%, transparent))' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, color-mix(in srgb, var(--theme-primary) 8%, transparent) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 px-3 py-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">

            {/* Mobile-Optimized Header */}
            <motion.div
              className="mb-4 sm:mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl lg:rounded-3xl border border-[#F8AD9D]/30 shadow-2xl p-3 sm:p-6 lg:p-8">
                {/* Mobile Header Layout */}
                <div className="flex flex-col space-y-4 sm:hidden">
                  {/* Top Row - Back Button and Save */}
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => router.back()}
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-800 rounded-xl p-2"
                      style={{ ['--hover-bg' as any]: 'color-mix(in srgb, var(--theme-tertiary) 30%, transparent)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={() => saveSettings()}
                      disabled={saving || !hasUnsavedChanges}
                      size="sm"
                      className="border-0 rounded-xl px-4 py-2 font-semibold transition-all text-white shadow-md"
                      style={{
                        background: hasUnsavedChanges
                          ? 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))'
                          : 'rgba(209, 213, 219, 0.5)',
                        color: hasUnsavedChanges ? 'white' : 'rgb(107, 114, 128)',
                        cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {saving ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : hasUnsavedChanges ? (
                        <Save className="h-3 w-3 mr-1" />
                      ) : (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      <span className="text-xs">{saving ? 'Saving' : hasUnsavedChanges ? 'Save' : 'Saved'}</span>
                    </Button>
                  </div>

                  {/* Title Row */}
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary), var(--theme-accent))' }}>
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl font-black bg-clip-text text-transparent truncate" style={{ backgroundImage: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary), var(--theme-accent))' }}>
                        Settings Studio
                      </h1>
                      <p className="text-slate-600 text-sm font-medium">Customize your experience</p>
                    </div>
                  </div>
                </div>

                {/* Desktop Header Layout */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center space-x-4 lg:space-x-6">
                    <Button
                      onClick={() => router.back()}
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:text-slate-800 rounded-2xl p-3"
                      style={{ ['--hover-bg' as any]: 'color-mix(in srgb, var(--theme-tertiary) 30%, transparent)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center space-x-4">
                      <div className="p-4 rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary), var(--theme-accent))' }}>
                        <Settings className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary), var(--theme-accent))' }}>
                          Settings Studio
                        </h1>
                        <p className="text-slate-600 text-base lg:text-lg font-medium">Customize your experience</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => saveSettings()}
                    disabled={saving || !hasUnsavedChanges}
                    className="border-0 rounded-2xl px-6 py-3 font-bold transition-all shadow-lg text-white"
                    style={{
                      background: hasUnsavedChanges
                        ? 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))'
                        : 'rgba(209, 213, 219, 0.5)',
                      color: hasUnsavedChanges ? 'white' : 'rgb(107, 114, 128)',
                      cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : hasUnsavedChanges ? (
                      <Save className="h-4 w-4 mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'All Saved'}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Optimized Settings Grid - Responsive & Organized Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">

              {/* Profile Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-white/95 backdrop-blur-xl shadow-xl border border-[#F8AD9D]/30 rounded-xl sm:rounded-2xl h-full">
                  <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-4">
                    <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base lg:text-lg text-slate-800">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-[#F08080]" />
                      <span className="truncate">Profile Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-6 p-3 sm:px-6 sm:pb-6">
                    <Suspense fallback={
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-violet-400"></div>
                      </div>
                    }>
                      <AdvancedProfilePictureUpload
                        currentImage={profile?.profile_picture_url}
                        onImageUpdate={(imageUrl) => {
                          setProfile(prev => ({ ...prev, profile_picture_url: imageUrl }))
                        }}
                      />
                    </Suspense>

                    {/* Mobile-Optimized Student ID */}
                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-slate-700 font-medium text-xs sm:text-sm">Student ID</label>
                      <div className="p-3 sm:p-4 bg-[#FFF5EE]/80 rounded-xl sm:rounded-2xl border border-[#F8AD9D]/30 backdrop-blur-sm">
                        {/* Mobile Layout */}
                        <div className="sm:hidden">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Users className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-800 font-medium text-xs">Your Student ID</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              {showStudentId ? (
                                <code className="text-xs font-mono text-blue-300 bg-blue-500/20 px-2 py-1 rounded truncate max-w-[120px]">
                                  {profile?.id || 'Not available'}
                                </code>
                              ) : (
                                <span className="text-xs text-slate-500">••••••••••••</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowStudentId(!showStudentId)}
                                className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700 hover:bg-[#FBC4AB]/30 rounded-lg"
                              >
                                {showStudentId ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                              </Button>
                              {showStudentId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={copyStudentId}
                                  className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700 hover:bg-[#FBC4AB]/30 rounded-lg"
                                >
                                  {copiedStudentId ? <Check className="h-2.5 w-2.5 text-green-400" /> : <Copy className="h-2.5 w-2.5" />}
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            Share this ID with your parents for registration
                          </p>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:block">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-[#F08080] to-[#F4978E] rounded-xl flex items-center justify-center">
                                <Users className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="text-slate-800 font-medium">Your Student ID</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  {showStudentId ? (
                                    <code className="text-sm font-mono text-[#F08080] bg-[#F4978E]/20 px-2 py-1 rounded">
                                      {profile?.id || 'Not available'}
                                    </code>
                                  ) : (
                                    <span className="text-sm text-slate-500">••••••••••••</span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowStudentId(!showStudentId)}
                                    className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700 hover:bg-[#FBC4AB]/30"
                                  >
                                    {showStudentId ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                  </Button>
                                  {showStudentId && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={copyStudentId}
                                      className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700 hover:bg-[#FBC4AB]/30"
                                    >
                                      {copiedStudentId ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 mt-3">
                            Share this ID with your parents for registration and family messaging
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>


              {/* Appearance & Theme */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white/95 backdrop-blur-xl shadow-xl border border-[#F8AD9D]/30 rounded-xl sm:rounded-2xl h-full">
                  <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-4">
                    <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-lg text-slate-800">
                      <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-[#F08080]" />
                      <span className="truncate">Appearance & Theme</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:px-6 sm:pb-6">
                    <div className="p-3 sm:p-4 bg-[#FFF5EE]/50 rounded-xl sm:rounded-2xl border border-[#F8AD9D]/20">
                      <div className="mb-3 sm:mb-4">
                        <p className="text-slate-800 font-medium text-sm sm:text-base mb-1">Theme Preference</p>
                        <p className="text-slate-600 text-xs sm:text-sm">Choose your preferred color scheme</p>
                      </div>

                      {/* Theme Options */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {/* Fiery Rose Theme - Default */}
                        <button
                          onClick={() => handleSettingChange('theme', 'fiery-rose')}
                          className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${settings.theme === 'fiery-rose'
                              ? 'border-[#F08080] bg-[#F08080]/10 shadow-lg shadow-[#F08080]/20'
                              : 'border-slate-200 hover:border-[#F08080]/50 hover:bg-[#FBC4AB]/5'
                            }`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className="p-2 sm:p-2.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #F08080, #F4978E, #FBC4AB, #FFF5EE)' }}>
                              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-[#F08080]" />
                            </div>
                            <div className="text-center">
                              <p className={`text-xs sm:text-sm font-medium ${settings.theme === 'fiery-rose' ? 'text-[#F08080]' : 'text-slate-700'
                                }`}>Fiery Rose</p>
                            </div>
                          </div>
                          {settings.theme === 'fiery-rose' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#F08080] rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </button>

                        {/* Ocean Sunset Theme */}
                        <button
                          onClick={() => handleSettingChange('theme', 'ocean-sunset')}
                          className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${settings.theme === 'ocean-sunset'
                              ? 'border-[#ffc300] bg-[#ffc300]/10 shadow-lg shadow-[#ffc300]/20'
                              : 'border-slate-200 hover:border-[#ffc300]/50 hover:bg-[#ffd60a]/5'
                            }`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className="p-2 sm:p-2.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #000814, #001d3d, #003566, #ffc300)' }}>
                              <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-[#ffd60a]" />
                            </div>
                            <div className="text-center">
                              <p className={`text-xs sm:text-sm font-medium ${settings.theme === 'ocean-sunset' ? 'text-[#ffc300]' : 'text-slate-700'
                                }`}>Ocean Sunset</p>
                            </div>
                          </div>
                          {settings.theme === 'ocean-sunset' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ffc300] rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-[#000814]" />
                            </div>
                          )}
                        </button>

                        {/* Fresh Meadow Theme */}
                        <button
                          onClick={() => handleSettingChange('theme', 'fresh-meadow')}
                          className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${settings.theme === 'fresh-meadow'
                              ? 'border-[#38a3a5] bg-[#38a3a5]/10 shadow-lg shadow-[#38a3a5]/20'
                              : 'border-slate-200 hover:border-[#38a3a5]/50 hover:bg-[#57cc99]/5'
                            }`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className="p-2 sm:p-2.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #22577a, #38a3a5, #57cc99, #c7f9cc)' }}>
                              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-[#c7f9cc]" />
                            </div>
                            <div className="text-center">
                              <p className={`text-xs sm:text-sm font-medium ${settings.theme === 'fresh-meadow' ? 'text-[#38a3a5]' : 'text-slate-700'
                                }`}>Fresh Meadow</p>
                            </div>
                          </div>
                          {settings.theme === 'fresh-meadow' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#38a3a5] rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </button>

                        {/* Autumn Ember Theme */}
                        <button
                          onClick={() => handleSettingChange('theme', 'autumn-ember')}
                          className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${settings.theme === 'autumn-ember'
                              ? 'border-[#ea8c55] bg-[#ea8c55]/10 shadow-lg shadow-[#ea8c55]/20'
                              : 'border-slate-200 hover:border-[#ea8c55]/50 hover:bg-[#c75146]/5'
                            }`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className="p-2 sm:p-2.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #ea8c55, #c75146, #ad2e24, #540804)' }}>
                              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-[#ea8c55]" />
                            </div>
                            <div className="text-center">
                              <p className={`text-xs sm:text-sm font-medium ${settings.theme === 'autumn-ember' ? 'text-[#ea8c55]' : 'text-slate-700'
                                }`}>Autumn Ember</p>
                            </div>
                          </div>
                          {settings.theme === 'autumn-ember' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ea8c55] rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </button>
                      </div>

                      {/* Current Theme Info */}
                      <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-[#F4978E]/10 rounded-lg border border-[#F8AD9D]/30">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full animate-pulse" style={{
                            backgroundColor: settings.theme === 'fiery-rose' ? '#F08080' : settings.theme === 'ocean-sunset' ? '#ffc300' : settings.theme === 'fresh-meadow' ? '#38a3a5' : '#ea8c55'
                          }}></div>
                          <p className="text-xs sm:text-sm text-slate-700">
                            {settings.theme === 'fiery-rose' && 'Using Fiery Rose theme - Soft coral and peachy tones (Default)'}
                            {settings.theme === 'ocean-sunset' && 'Using Ocean Sunset theme - Deep blues with golden accents'}
                            {settings.theme === 'fresh-meadow' && 'Using Fresh Meadow theme - Natural teal and green tones'}
                            {settings.theme === 'autumn-ember' && 'Using Autumn Ember theme - Warm orange to crimson red'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Privacy & Security */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-white/95 backdrop-blur-xl shadow-xl border border-[#F8AD9D]/30 rounded-xl sm:rounded-2xl h-full">
                  <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-4">
                    <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-lg text-slate-800">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[#F4978E]" />
                      <span className="truncate">Privacy & Security</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-6 p-3 sm:px-6 sm:pb-6">
                    {PRIVACY_SETTINGS.map(({ key, label, description, icon }) => (
                      <SettingItem
                        key={key}
                        settingKey={key}
                        label={label}
                        description={description}
                        icon={icon}
                        checked={settings[key as keyof SettingsState] as boolean}
                        onChange={(checked) => handleSettingChange(key as keyof SettingsState, checked)}
                        iconColor="blue"
                      />
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notifications & Preferences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="bg-white/95 backdrop-blur-xl shadow-xl border border-[#F8AD9D]/30 rounded-xl sm:rounded-2xl h-full">
                  <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-4">
                    <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-lg text-slate-800">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[#F8AD9D]" />
                      <span className="truncate">Notifications & Preferences</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-6 p-3 sm:px-6 sm:pb-6">
                    {NOTIFICATION_SETTINGS.map(({ key, label, description, icon }) => (
                      <SettingItem
                        key={key}
                        settingKey={key}
                        label={label}
                        description={description}
                        icon={icon}
                        checked={settings[key as keyof SettingsState] as boolean}
                        onChange={(checked) => handleSettingChange(key as keyof SettingsState, checked)}
                        iconColor="green"
                      />
                    ))}
                  </CardContent>
                </Card>
              </motion.div>



              {/* WhatsApp Configuration Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="md:col-span-2 xl:col-span-1"
              >
                <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border border-[#F8AD9D]/30 rounded-2xl sm:rounded-3xl">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center justify-between text-base sm:text-lg text-slate-800">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#F08080]" />
                        <span className="truncate">WhatsApp Configuration</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={whatsappConfig.isEnabled}
                          onCheckedChange={(checked) => {
                            setWhatsappConfig(prev => ({ ...prev, isEnabled: checked }))
                            setHasUnsavedChanges(true)
                          }}
                          className="data-[state=checked]:bg-[#F08080]"
                        />
                        <span className="text-xs text-slate-600">
                          {whatsappConfig.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6">

                    {/* Phone Number Input */}
                    <div className="space-y-2">
                      <label className="text-slate-700 text-sm font-medium flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-[#F4978E]" />
                        <span>Phone Number</span>
                      </label>
                      <Input
                        type="tel"
                        placeholder="+1234567890"
                        value={whatsappConfig.phoneNumber}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value)
                          setWhatsappConfig(prev => ({
                            ...prev,
                            phoneNumber: formatted,
                            whatsappLink: generateWhatsAppLink(formatted)
                          }))
                          setHasUnsavedChanges(true)
                        }}
                        className={`bg-white border-[#F8AD9D]/30 text-slate-800 placeholder-slate-400 rounded-xl ${whatsappConfig.phoneNumber && !validatePhoneNumber(whatsappConfig.phoneNumber)
                            ? 'border-red-400 focus:border-red-400'
                            : 'focus:border-[#F08080]'
                          }`}
                      />
                      {whatsappConfig.phoneNumber && !validatePhoneNumber(whatsappConfig.phoneNumber) && (
                        <p className="text-red-300 text-xs flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Please enter a valid phone number with country code</span>
                        </p>
                      )}
                      <p className="text-slate-600 text-xs">
                        Enter your phone number with country code (e.g., +1234567890)
                      </p>
                    </div>

                    {/* WhatsApp Link Input */}
                    <div className="space-y-2">
                      <label className="text-slate-700 text-sm font-medium flex items-center space-x-2">
                        <Link className="h-4 w-4 text-[#F4978E]" />
                        <span>WhatsApp Link</span>
                      </label>
                      <Input
                        type="url"
                        placeholder="https://wa.me/1234567890"
                        value={whatsappConfig.whatsappLink}
                        onChange={(e) => {
                          setWhatsappConfig(prev => ({ ...prev, whatsappLink: e.target.value }))
                          setHasUnsavedChanges(true)
                        }}
                        className="bg-white border-[#F8AD9D]/30 text-slate-800 placeholder-slate-400 rounded-xl focus:border-[#F08080]"
                      />
                      <p className="text-slate-600 text-xs">
                        Custom WhatsApp link (optional - auto-generated from phone number)
                      </p>
                    </div>

                    {/* Auto-generated Link Display */}
                    {whatsappConfig.phoneNumber && validatePhoneNumber(whatsappConfig.phoneNumber) && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-start space-x-2">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-green-700 text-sm font-medium">Auto-generated WhatsApp Link:</p>
                            <p className="text-green-600 text-xs mt-1 break-all">
                              {generateWhatsAppLink(whatsappConfig.phoneNumber)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Test WhatsApp Link */}
                    {(whatsappConfig.whatsappLink || (whatsappConfig.phoneNumber && validatePhoneNumber(whatsappConfig.phoneNumber))) && (
                      <div className="flex items-center justify-between pt-4 border-t border-[#F8AD9D]/20">
                        <div className="text-xs text-slate-600">
                          <p>Test your WhatsApp configuration</p>
                        </div>
                        <Button
                          onClick={() => {
                            const linkToTest = whatsappConfig.whatsappLink || generateWhatsAppLink(whatsappConfig.phoneNumber)
                            window.open(linkToTest, '_blank')
                          }}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 rounded-xl px-4 py-2 font-medium transition-all duration-200 flex items-center gap-2 shadow-md"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Test WhatsApp
                        </Button>
                      </div>
                    )}

                    {/* Save Configuration */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#F8AD9D]/20">
                      <div className="text-xs text-slate-600">
                        <p>Configure WhatsApp for quick communication</p>
                      </div>
                      <Button
                        onClick={() => saveWhatsAppConfig(whatsappConfig)}
                        disabled={saving || (!whatsappConfig.phoneNumber && !whatsappConfig.whatsappLink)}
                        className={`px-6 py-2 rounded-xl font-medium transition-all shadow-md ${(whatsappConfig.phoneNumber || whatsappConfig.whatsappLink)
                            ? 'bg-gradient-to-r from-[#F08080] to-[#F4978E] hover:from-[#F4978E] hover:to-[#F8AD9D] text-white'
                            : 'bg-gray-300/50 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {saving ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Configuration
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Account & Sign Out Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="md:col-span-2 xl:col-span-2"
              >
                <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border border-[#F8AD9D]/30 rounded-2xl sm:rounded-3xl">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-lg text-slate-800">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[#F08080]" />
                      <span className="truncate">Account Management</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6">

                    {/* Sign Out Section */}
                    <div className="p-4 sm:p-6 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-red-100 rounded-xl flex-shrink-0">
                            <LogOut className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-slate-800 font-semibold text-sm sm:text-base">Sign Out</h3>
                            <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                              Sign out of your account and clear all session data. You'll need to log in again to access your dashboard.
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleSignOut}
                          className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl px-4 sm:px-6 py-2 sm:py-3 font-semibold transition-all duration-200 flex items-center gap-2 flex-shrink-0"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="text-sm">Sign Out</span>
                        </Button>
                      </div>
                    </div>

                    {/* Account Info */}
                    <div className="p-4 sm:p-6 bg-[#FFF5EE] border border-[#F8AD9D]/30 rounded-xl sm:rounded-2xl">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-[#F4978E]/20 rounded-xl flex-shrink-0">
                          <User className="h-5 w-5 text-[#F08080]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-slate-800 font-semibold text-sm sm:text-base">Account Information</h3>
                          <div className="mt-2 space-y-1 text-xs sm:text-sm text-slate-600">
                            <p><span className="text-[#F08080] font-medium">Name:</span> {profile?.first_name} {profile?.last_name}</p>
                            <p><span className="text-[#F08080] font-medium">Student ID:</span> {profile?.id ? `${profile.id.slice(0, 8)}...` : 'Not available'}</p>
                            <p><span className="text-[#F08080] font-medium">Role:</span> Student</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedAuthGuard>
  )
}

export default StudentSettingsPage
