'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/lib/redux/hooks'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
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
  Brain,
  Key,
  Cpu,
  AlertTriangle,
  ExternalLink,
  LogOut,
  MessageCircle,
  Phone,
  Link
} from 'lucide-react'
import { AdvancedProfilePictureUpload } from '@/components/ui/advanced-profile-picture-upload'

interface Profile {
  id?: string
  first_name?: string
  last_name?: string
  profile_picture_url?: string
  [key: string]: any
}

interface SettingsState {
  theme: 'light' | 'dark' | 'system'
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

interface GeminiConfig {
  apiKey: string
  selectedModel: string
  isConfigured: boolean
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
  const [showApiKey, setShowApiKey] = useState(false)
  const [geminiConfig, setGeminiConfig] = useState<GeminiConfig>({
    apiKey: '',
    selectedModel: 'gemini-1.5-flash',
    isConfigured: false
  })
  
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    phoneNumber: '',
    whatsappLink: '',
    isEnabled: false
  })
  
  const [settings, setSettings] = useState<SettingsState>({
    theme: 'system',
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

  // Gemini AI Models with their capabilities and limits
  const geminiModels = [
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      description: 'Fast and efficient for everyday tasks',
      features: ['Text', 'Images', 'Fast responses'],
      limits: {
        free: '15 requests/minute, 1,500 requests/day',
        inputTokens: '1M tokens',
        outputTokens: '8K tokens'
      },
      recommended: true
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Most capable model for complex reasoning',
      features: ['Text', 'Images', 'Advanced reasoning', 'Long context'],
      limits: {
        free: '2 requests/minute, 50 requests/day',
        inputTokens: '2M tokens',
        outputTokens: '8K tokens'
      },
      recommended: false
    },
    {
      id: 'gemini-pro',
      name: 'Gemini 1.0 Pro',
      description: 'Reliable performance for general use',
      features: ['Text only', 'Good reasoning'],
      limits: {
        free: '60 requests/minute, No daily limit',
        inputTokens: '30K tokens',
        outputTokens: '2K tokens'
      },
      recommended: false
    }
  ]

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

  // Gemini API configuration functions
  const checkGeminiConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/student/gemini-config', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const geminiData = await response.json()
        setGeminiConfig({
          apiKey: geminiData.apiKey || '',
          selectedModel: geminiData.selectedModel || 'gemini-1.5-flash',
          isConfigured: !!geminiData.apiKey
        })
      }
    } catch (error) {
      console.error('Error fetching Gemini configuration:', error)
    }
  }, [])

  const saveGeminiConfig = useCallback(async (config: GeminiConfig) => {
    try {
      setSaving(true)
      const response = await fetch('/api/student/gemini-config', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ 
          apiKey: config.apiKey,
          selectedModel: config.selectedModel
        })
      })
      
      if (response.ok) {
        setGeminiConfig(prev => ({ ...prev, isConfigured: !!config.apiKey }))
        showToast('Gemini AI configuration saved successfully!', 'success')
        setHasUnsavedChanges(false)
      } else {
        showToast('Failed to save Gemini configuration', 'error')
      }
    } catch (error) {
      showToast('Failed to save Gemini configuration', 'error')
    } finally {
      setSaving(false)
    }
  }, [])

  const testGeminiConnection = useCallback(async () => {
    if (!geminiConfig.apiKey) {
      showToast('Please enter your Gemini API key first', 'error')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/student/gemini-test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          apiKey: geminiConfig.apiKey,
          model: geminiConfig.selectedModel
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        showToast(`✅ ${result.message || 'Connection successful!'}`, 'success')
      } else {
        const error = await response.json()
        console.error('Test connection error:', error)
        showToast(`❌ ${error.error || error.message || 'Connection failed'}`, 'error')
      }
    } catch (error: any) {
      console.error('Network error:', error)
      showToast(`❌ Network error: ${error.message || 'Failed to test connection'}`, 'error')
    } finally {
      setSaving(false)
    }
  }, [geminiConfig.apiKey, geminiConfig.selectedModel])

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
      const [profileResponse, settingsResponse, geminiResponse] = await Promise.all([
        fetch('/api/student/profile', {
          headers: { 'Cache-Control': 'max-age=300' } // 5 min cache
        }),
        fetch('/api/student/settings', {
          headers: { 'Cache-Control': 'max-age=300' }
        }),
        fetch('/api/student/gemini-config', {
          headers: { 'Cache-Control': 'max-age=300' }
        })
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

      // Process Gemini configuration
      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json()
        setGeminiConfig({
          apiKey: geminiData.apiKey || '',
          selectedModel: geminiData.selectedModel || 'gemini-1.5-flash',
          isConfigured: !!geminiData.apiKey
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setProfile(reduxProfile)
    } finally {
      setLoading(false)
    }
  }, [reduxProfile, getCachedData, setCachedData])

  useEffect(() => {
    fetchProfileAndSettings()
    checkWhatsAppConfig()
  }, []) // Only run once on mount

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
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-2xl shadow-2xl z-[10000] transform transition-all duration-500 backdrop-blur-xl border ${
      type === 'success' 
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
      const newSettings = { ...prev, [key]: value }
      
      // Apply theme changes immediately with cross-account persistence
      if (key === 'theme') {
        const isDark = value === 'dark' || (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.toggle('dark', isDark)
        // Store theme preference globally for cross-account consistency
        localStorage.setItem('catalyst-theme-preference', value)
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
    const storedTheme = localStorage.getItem('catalyst-theme-preference')
    const storedFontSize = localStorage.getItem('catalyst-font-size')
    const storedLanguage = localStorage.getItem('catalyst-language')
    
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      const isDark = storedTheme === 'dark' || (storedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', isDark)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-violet-400"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    )
  }

  return (
    <UnifiedAuthGuard requiredRole="student">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Premium Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(147,51,234,0.15)_1px,transparent_0)] bg-[length:32px_32px]" />
        
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Mobile-Optimized Header */}
            <motion.div 
              className="mb-4 sm:mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-6 lg:p-8">
                {/* Mobile Header Layout */}
                <div className="flex flex-col space-y-4 sm:hidden">
                  {/* Top Row - Back Button and Save */}
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => router.back()}
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={() => saveSettings()}
                      disabled={saving || !hasUnsavedChanges}
                      size="sm"
                      className={`border-0 rounded-xl px-4 py-2 font-semibold transition-all ${
                        hasUnsavedChanges 
                          ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white' 
                          : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                      }`}
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
                    <div className="p-3 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl shadow-lg">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl font-black bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent truncate">
                        Settings Studio
                      </h1>
                      <p className="text-white/80 text-sm font-medium">Customize your experience</p>
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
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-2xl p-3"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl shadow-2xl">
                        <Settings className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                          Settings Studio
                        </h1>
                        <p className="text-white/80 text-base lg:text-lg font-medium">Customize your experience</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => saveSettings()}
                    disabled={saving || !hasUnsavedChanges}
                    className={`border-0 rounded-2xl px-6 py-3 font-bold transition-all ${
                      hasUnsavedChanges 
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white' 
                        : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                    }`}
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

            {/* Optimized Settings Grid - Full Width Desktop Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              
              {/* Profile Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl sm:rounded-3xl h-full">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-lg text-white">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-violet-300" />
                      <span className="truncate">Profile Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6">
                    <AdvancedProfilePictureUpload
                      currentImage={profile?.profile_picture_url}
                      onImageUpdate={(imageUrl) => {
                        setProfile(prev => ({ ...prev, profile_picture_url: imageUrl }))
                      }}
                    />
                    
                    {/* Mobile-Optimized Student ID */}
                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-white/80 font-medium text-xs sm:text-sm">Student ID</label>
                      <div className="p-3 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 backdrop-blur-sm">
                        {/* Mobile Layout */}
                        <div className="sm:hidden">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Users className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/90 font-medium text-xs">Your Student ID</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              {showStudentId ? (
                                <code className="text-xs font-mono text-blue-300 bg-blue-500/20 px-2 py-1 rounded truncate max-w-[120px]">
                                  {profile?.id || 'Not available'}
                                </code>
                              ) : (
                                <span className="text-xs text-white/60">••••••••••••</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowStudentId(!showStudentId)}
                                className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
                              >
                                {showStudentId ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                              </Button>
                              {showStudentId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={copyStudentId}
                                  className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
                                >
                                  {copiedStudentId ? <Check className="h-2.5 w-2.5 text-green-400" /> : <Copy className="h-2.5 w-2.5" />}
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-white/60 mt-2 leading-relaxed">
                            Share this ID with your parents for registration
                          </p>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:block">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                <Users className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="text-white/90 font-medium">Your Student ID</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  {showStudentId ? (
                                    <code className="text-sm font-mono text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                                      {profile?.id || 'Not available'}
                                    </code>
                                  ) : (
                                    <span className="text-sm text-white/60">••••••••••••</span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowStudentId(!showStudentId)}
                                    className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                                  >
                                    {showStudentId ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                  </Button>
                                  {showStudentId && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={copyStudentId}
                                      className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                                    >
                                      {copiedStudentId ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-white/60 mt-3">
                            Share this ID with your parents for registration and family messaging
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
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl sm:rounded-3xl">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-lg text-white">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
                      <span className="truncate">Privacy & Security</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-6 px-4 sm:px-6 pb-6">
                    {[
                      { key: 'privateProfile', label: 'Private Profile', description: 'Hide your profile from other users', icon: EyeOff },
                      { key: 'dataSync', label: 'Data Sync', description: 'Sync your data across devices', icon: RotateCw }
                    ].map(({ key, label, description, icon: Icon }) => (
                      <div key={key} className="p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                        {/* Mobile Layout */}
                        <div className="sm:hidden">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1 min-w-0">
                              <div className="p-1.5 bg-blue-500/20 rounded-lg flex-shrink-0 mt-0.5">
                                <Icon className="h-3 w-3 text-blue-300" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs">{label}</p>
                                <p className="text-white/60 text-[10px] mt-0.5 leading-relaxed">{description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={settings[key as keyof SettingsState] as boolean}
                              onCheckedChange={(checked) => handleSettingChange(key as keyof SettingsState, checked)}
                              className="flex-shrink-0 ml-2 data-[state=checked]:bg-violet-500 data-[state=unchecked]:bg-white/20"
                            />
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500/20 rounded-xl">
                              <Icon className="h-5 w-5 text-blue-300" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{label}</p>
                              <p className="text-white/60 text-sm">{description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings[key as keyof SettingsState] as boolean}
                            onCheckedChange={(checked) => handleSettingChange(key as keyof SettingsState, checked)}
                            className="data-[state=checked]:bg-violet-500 data-[state=unchecked]:bg-white/20"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notifications & Preferences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl sm:rounded-3xl">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-lg text-white">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-green-300" />
                      <span className="truncate">Notifications & Preferences</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-6 px-4 sm:px-6 pb-6">
                    {[
                      { key: 'notifications', label: 'Push Notifications', description: 'Receive updates and reminders', icon: Bell },
                      { key: 'soundEffects', label: 'Sound Effects', description: 'Play sounds for interactions', icon: Volume2 },
                      { key: 'animations', label: 'Animations', description: 'Enable smooth transitions', icon: Zap },
                      { key: 'hapticFeedback', label: 'Haptic Feedback', description: 'Feel vibrations for interactions', icon: Heart }
                    ].map(({ key, label, description, icon: Icon }) => (
                      <div key={key} className="p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                        {/* Mobile Layout */}
                        <div className="sm:hidden">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1 min-w-0">
                              <div className="p-1.5 bg-green-500/20 rounded-lg flex-shrink-0 mt-0.5">
                                <Icon className="h-3 w-3 text-green-300" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs">{label}</p>
                                <p className="text-white/60 text-[10px] mt-0.5 leading-relaxed">{description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={settings[key as keyof SettingsState] as boolean}
                              onCheckedChange={(checked) => handleSettingChange(key as keyof SettingsState, checked)}
                              className="flex-shrink-0 ml-2 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-white/20"
                            />
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-500/20 rounded-xl">
                              <Icon className="h-5 w-5 text-green-300" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{label}</p>
                              <p className="text-white/60 text-sm">{description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings[key as keyof SettingsState] as boolean}
                            onCheckedChange={(checked) => handleSettingChange(key as keyof SettingsState, checked)}
                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-white/20"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Account Management - New Section for Desktop Layout */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="xl:col-span-1 lg:col-span-2"
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl sm:rounded-3xl">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-lg text-white">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-orange-300" />
                      <span className="truncate">Account Management</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-6 px-4 sm:px-6 pb-6">
                    {/* Account Information */}
                    <div className="p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-500/20 rounded-xl">
                            <User className="h-5 w-5 text-orange-300" />
                          </div>
                          <div>
                            <p className="text-white font-medium">Account Information</p>
                            <p className="text-white/60 text-sm">View your account details</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-white/60 text-xs">Full Name</p>
                          <p className="text-white/90 font-medium">{profile?.first_name} {profile?.last_name}</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs">Account Type</p>
                          <p className="text-white/90 font-medium">Student Account</p>
                        </div>
                      </div>
                    </div>

                    {/* Data & Storage */}
                    <div className="p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Globe className="h-5 w-5 text-blue-300" />
                          </div>
                          <div>
                            <p className="text-white font-medium">Data & Storage</p>
                            <p className="text-white/60 text-sm">Manage your data usage</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/70">Profile Data</span>
                          <span className="text-white/90">2.4 MB</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/70">Messages</span>
                          <span className="text-white/90">15.2 MB</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                          <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <p className="text-white/60 text-xs">17.6 MB of 100 MB used</p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:text-white rounded-xl p-3 h-auto justify-start"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <p className="font-medium text-sm">Sync Data</p>
                          <p className="text-xs text-white/60">Update across devices</p>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:text-white rounded-xl p-3 h-auto justify-start"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <p className="font-medium text-sm">Privacy Center</p>
                          <p className="text-xs text-white/60">Manage permissions</p>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Gemini AI Configuration - New Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="xl:col-span-3 lg:col-span-2"
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl sm:rounded-3xl">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center justify-between text-base sm:text-lg text-white">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
                        <span className="truncate">Gemini AI Configuration</span>
                        {geminiConfig.isConfigured && (
                          <div className="flex items-center space-x-1 bg-green-500/20 text-green-300 px-2 py-1 rounded-lg text-xs">
                            <Check className="h-3 w-3" />
                            <span>Configured</span>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                        variant="ghost"
                        size="sm"
                        className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        <span className="text-xs">Get API Key</span>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6">
                    
                    {/* API Key Configuration */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-white/80 font-medium text-sm">Gemini API Key</label>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg p-1"
                          >
                            {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          {geminiConfig.apiKey && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={testGeminiConnection}
                              disabled={saving}
                              className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg px-2 py-1"
                            >
                              {saving ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Zap className="h-3 w-3" />
                              )}
                              <span className="text-xs ml-1">Test</span>
                            </Button>
                          )}
                        </div>
                      </div>
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="Enter your Gemini API key..."
                        value={geminiConfig.apiKey}
                        onChange={(e) => {
                          setGeminiConfig(prev => ({ ...prev, apiKey: e.target.value }))
                          setHasUnsavedChanges(true)
                        }}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                      />
                      <div className="flex items-start space-x-2 p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-300">
                          <p className="font-medium mb-1">Your API key is stored securely and encrypted</p>
                          <p className="text-blue-200/80">Get your free API key from Google AI Studio. The key is only used for your personal AI homework assistance.</p>
                        </div>
                      </div>
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-3">
                      <label className="text-white/80 font-medium text-sm">Select AI Model</label>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {geminiModels.map((model) => (
                          <div
                            key={model.id}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              geminiConfig.selectedModel === model.id
                                ? 'bg-purple-500/20 border-purple-400/50'
                                : 'bg-white/5 border-white/20 hover:bg-white/10'
                            }`}
                            onClick={() => {
                              setGeminiConfig(prev => ({ ...prev, selectedModel: model.id }))
                              setHasUnsavedChanges(true)
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Cpu className="h-4 w-4 text-purple-300" />
                                <h4 className="text-white font-medium text-sm">{model.name}</h4>
                              </div>
                              {model.recommended && (
                                <div className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded text-xs">
                                  Recommended
                                </div>
                              )}
                            </div>
                            <p className="text-white/70 text-xs mb-3">{model.description}</p>
                            
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {model.features.map((feature, index) => (
                                  <span key={index} className="bg-white/10 text-white/80 px-2 py-0.5 rounded text-xs">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                              
                              <div className="text-xs text-white/60">
                                <p className="font-medium text-white/80 mb-1">Free Plan Limits:</p>
                                <p>• {model.limits.free}</p>
                                <p>• Input: {model.limits.inputTokens}</p>
                                <p>• Output: {model.limits.outputTokens}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Save Configuration */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/20">
                      <div className="text-xs text-white/60">
                        <p>Configure your personal AI assistant for homework help</p>
                      </div>
                      <Button
                        onClick={() => saveGeminiConfig(geminiConfig)}
                        disabled={saving || !geminiConfig.apiKey}
                        className={`px-6 py-2 rounded-xl font-medium transition-all ${
                          geminiConfig.apiKey 
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white' 
                            : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
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

              {/* WhatsApp Configuration Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="xl:col-span-2 lg:col-span-1"
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl sm:rounded-3xl">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center justify-between text-base sm:text-lg text-white">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-300" />
                        <span className="truncate">WhatsApp Configuration</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={whatsappConfig.isEnabled}
                          onCheckedChange={(checked) => {
                            setWhatsappConfig(prev => ({ ...prev, isEnabled: checked }))
                            setHasUnsavedChanges(true)
                          }}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <span className="text-xs text-white/60">
                          {whatsappConfig.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6">
                    
                    {/* Phone Number Input */}
                    <div className="space-y-2">
                      <label className="text-white/80 text-sm font-medium flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-green-300" />
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
                        className={`bg-white/10 border-white/20 text-white placeholder-white/50 rounded-xl ${
                          whatsappConfig.phoneNumber && !validatePhoneNumber(whatsappConfig.phoneNumber)
                            ? 'border-red-400 focus:border-red-400'
                            : 'focus:border-green-400'
                        }`}
                      />
                      {whatsappConfig.phoneNumber && !validatePhoneNumber(whatsappConfig.phoneNumber) && (
                        <p className="text-red-300 text-xs flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Please enter a valid phone number with country code</span>
                        </p>
                      )}
                      <p className="text-white/60 text-xs">
                        Enter your phone number with country code (e.g., +1234567890)
                      </p>
                    </div>

                    {/* WhatsApp Link Input */}
                    <div className="space-y-2">
                      <label className="text-white/80 text-sm font-medium flex items-center space-x-2">
                        <Link className="h-4 w-4 text-green-300" />
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
                        className="bg-white/10 border-white/20 text-white placeholder-white/50 rounded-xl focus:border-green-400"
                      />
                      <p className="text-white/60 text-xs">
                        Custom WhatsApp link (optional - auto-generated from phone number)
                      </p>
                    </div>

                    {/* Auto-generated Link Display */}
                    {whatsappConfig.phoneNumber && validatePhoneNumber(whatsappConfig.phoneNumber) && (
                      <div className="p-3 bg-green-500/10 border border-green-400/20 rounded-xl">
                        <div className="flex items-start space-x-2">
                          <Check className="h-4 w-4 text-green-300 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-green-300 text-sm font-medium">Auto-generated WhatsApp Link:</p>
                            <p className="text-green-200/80 text-xs mt-1 break-all">
                              {generateWhatsAppLink(whatsappConfig.phoneNumber)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Test WhatsApp Link */}
                    {(whatsappConfig.whatsappLink || (whatsappConfig.phoneNumber && validatePhoneNumber(whatsappConfig.phoneNumber))) && (
                      <div className="flex items-center justify-between pt-4 border-t border-white/20">
                        <div className="text-xs text-white/60">
                          <p>Test your WhatsApp configuration</p>
                        </div>
                        <Button
                          onClick={() => {
                            const linkToTest = whatsappConfig.whatsappLink || generateWhatsAppLink(whatsappConfig.phoneNumber)
                            window.open(linkToTest, '_blank')
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white border-0 rounded-xl px-4 py-2 font-medium transition-all duration-200 flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Test WhatsApp
                        </Button>
                      </div>
                    )}

                    {/* Save Configuration */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/20">
                      <div className="text-xs text-white/60">
                        <p>Configure WhatsApp for quick communication</p>
                      </div>
                      <Button
                        onClick={() => saveWhatsAppConfig(whatsappConfig)}
                        disabled={saving || (!whatsappConfig.phoneNumber && !whatsappConfig.whatsappLink)}
                        className={`px-6 py-2 rounded-xl font-medium transition-all ${
                          (whatsappConfig.phoneNumber || whatsappConfig.whatsappLink)
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white' 
                            : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
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

              {/* Account Management Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="xl:col-span-3 lg:col-span-2"
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl sm:rounded-3xl">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-lg text-white">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-red-300" />
                      <span className="truncate">Account Management</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6">
                    
                    {/* Sign Out Section */}
                    <div className="p-4 sm:p-6 bg-red-500/10 border border-red-400/20 rounded-xl sm:rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-red-500/20 rounded-xl flex-shrink-0">
                            <LogOut className="h-5 w-5 text-red-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-sm sm:text-base">Sign Out</h3>
                            <p className="text-red-200/80 text-xs sm:text-sm mt-1 leading-relaxed">
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
                    <div className="p-4 sm:p-6 bg-blue-500/10 border border-blue-400/20 rounded-xl sm:rounded-2xl">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl flex-shrink-0">
                          <User className="h-5 w-5 text-blue-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm sm:text-base">Account Information</h3>
                          <div className="mt-2 space-y-1 text-xs sm:text-sm text-blue-200/80">
                            <p><span className="text-blue-300 font-medium">Name:</span> {profile?.first_name} {profile?.last_name}</p>
                            <p><span className="text-blue-300 font-medium">Student ID:</span> {profile?.id ? `${profile.id.slice(0, 8)}...` : 'Not available'}</p>
                            <p><span className="text-blue-300 font-medium">Role:</span> Student</p>
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
