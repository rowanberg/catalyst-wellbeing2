'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/lib/redux/hooks'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@supabase/supabase-js'
import { useDarkMode } from '@/contexts/DarkModeContext'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
import {
  ArrowLeft,
  Settings,
  Bell,
  Shield,
  MessageCircle,
  Bot,
  Monitor,
  Volume2,
  Eye,
  Smartphone,
  Save,
  RefreshCw,
  Check,
  User,
  Lock,
  Database,
  Zap,
  Heart,
  RotateCw,
  Phone,
  Link,
  Copy,
  ExternalLink,
  Moon,
  Sun,
  Palette
} from 'lucide-react'

interface TeacherSettingsState {
  // Notifications
  emailNotifications: boolean
  pushNotifications: boolean
  classUpdates: boolean
  parentMessages: boolean
  systemAlerts: boolean
  weeklyReports: boolean

  // Privacy & Security
  profileVisibility: 'public' | 'school' | 'private'
  showEmail: boolean
  showPhone: boolean
  twoFactorAuth: boolean
  sessionTimeout: number

  // Teaching Preferences
  autoSaveGrades: boolean
  soundEffects: boolean
  animations: boolean
  hapticFeedback: boolean
  classroomMode: boolean

  // WhatsApp Configuration
  whatsappEnabled: boolean
  whatsappPhoneNumber: string
  whatsappAutoReply: boolean
  whatsappParentNotifications: boolean
  whatsappStudentUpdates: boolean
  whatsappBusinessAccount: boolean
}

const TeacherSettingsPage = () => {
  const router = useRouter()
  const { user, profile } = useAppSelector((state) => state.auth)
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [settings, setSettings] = useState<TeacherSettingsState>({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    classUpdates: true,
    parentMessages: true,
    systemAlerts: true,
    weeklyReports: false,

    // Privacy & Security
    profileVisibility: 'school',
    showEmail: false,
    showPhone: false,
    twoFactorAuth: false,
    sessionTimeout: 30,

    // Teaching Preferences
    autoSaveGrades: true,
    soundEffects: true,
    animations: true,
    hapticFeedback: true,
    classroomMode: false,

    // WhatsApp Configuration
    whatsappEnabled: false,
    whatsappPhoneNumber: '',
    whatsappAutoReply: false,
    whatsappParentNotifications: true,
    whatsappStudentUpdates: false,
    whatsappBusinessAccount: false
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)

      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        showToast('Please log in to access settings', 'error')
        return
      }

      const response = await fetch('/api/teacher/settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to fetch settings', 'error')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      showToast('Network error while fetching settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = useCallback((key: keyof TeacherSettingsState, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value }

      // Haptic feedback
      if (newSettings.hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }

      return newSettings
    })

    setHasUnsavedChanges(true)
  }, [])

  const saveSettings = async () => {
    try {
      setSaving(true)

      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        showToast('Please log in to save settings', 'error')
        return
      }

      const response = await fetch('/api/teacher/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast('Settings saved successfully!', 'success')
          setHasUnsavedChanges(false)
          // Update settings with the response to ensure consistency
          if (data.settings) {
            setSettings(prev => ({ ...prev, ...data.settings }))
          }
        }
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Failed to save settings', 'error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Network error while saving settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-2xl shadow-2xl z-[10000] transform transition-all duration-500 backdrop-blur-xl border ${type === 'success'
        ? 'bg-green-500/90 text-white border-green-400/50'
        : 'bg-red-500/90 text-white border-red-400/50'
      }`
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.transform = 'translateX(100%)'
      setTimeout(() => document.body.removeChild(toast), 500)
    }, 3000)
  }

  const generateWhatsAppLink = () => {
    if (!settings.whatsappPhoneNumber) {
      showToast('Please enter a WhatsApp number first', 'error')
      return ''
    }

    // Clean the phone number (remove spaces, dashes, etc.)
    const cleanNumber = settings.whatsappPhoneNumber.replace(/[^\d+]/g, '')

    // Generate WhatsApp link
    const whatsappLink = `https://wa.me/${cleanNumber.startsWith('+') ? cleanNumber.slice(1) : cleanNumber}`
    return whatsappLink
  }

  const copyWhatsAppLink = async () => {
    const link = generateWhatsAppLink()
    if (link) {
      try {
        await navigator.clipboard.writeText(link)
        showToast('WhatsApp link copied to clipboard!', 'success')
      } catch (error) {
        showToast('Failed to copy link', 'error')
      }
    }
  }

  const openWhatsAppLink = () => {
    const link = generateWhatsAppLink()
    if (link) {
      window.open(link, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 dark:border-slate-700 border-t-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <UnifiedAuthGuard requiredRole="teacher">
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Mobile-Optimized Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

          {/* Sticky Header - Mobile Optimized */}
          <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-lg -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Left: Title Section */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button
                      onClick={() => router.back()}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl p-2 flex-shrink-0"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md flex-shrink-0">
                      <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                        Settings
                      </h1>
                      <p className="text-sm text-gray-600 dark:text-slate-400 truncate">
                        Customize your preferences
                      </p>
                    </div>
                  </div>

                  {/* Right: Save Button */}
                  <Button
                    onClick={saveSettings}
                    disabled={saving || !hasUnsavedChanges}
                    className={`rounded-xl px-6 py-2.5 font-semibold transition-all w-full sm:w-auto flex-shrink-0 ${hasUnsavedChanges
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                        : 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-slate-500 cursor-not-allowed'
                      }`}
                  >
                    {saving ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin inline" /> Saving...</>
                    ) : hasUnsavedChanges ? (
                      <><Save className="h-4 w-4 mr-2 inline" /> Save Changes</>
                    ) : (
                      <><Check className="h-4 w-4 mr-2 inline" /> All Saved</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Settings Content */}
          <div className="space-y-8">

            {/* Personalization */}
            <section>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personalization</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Customize appearance and interface</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dark Mode Card */}
                <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Palette className="h-5 w-5 text-indigo-500" />
                      Appearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                          {isDarkMode ? <Moon className="h-4 w-4 text-white" /> : <Sun className="h-4 w-4 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">Dark Mode</p>
                          <p className="text-xs text-gray-600 dark:text-slate-400">Switch appearance theme</p>
                        </div>
                      </div>
                      <div
                        onClick={toggleDarkMode}
                        className={`relative w-14 h-7 rounded-full transition-all cursor-pointer ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'
                          }`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${isDarkMode ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Communication */}
            <section>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Communication</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Messaging and notification settings</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* WhatsApp Integration */}
                <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageCircle className="h-5 w-5 text-green-500" />
                      WhatsApp
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-100 dark:border-green-900/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <MessageCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">Enable</p>
                          <p className="text-xs text-gray-600 dark:text-slate-400">Connect WhatsApp</p>
                        </div>
                      </div>
                      <div
                        onClick={() => handleSettingChange('whatsappEnabled', !settings.whatsappEnabled)}
                        className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${settings.whatsappEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-slate-600'
                          }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.whatsappEnabled ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                      </div>
                    </div>

                    {settings.whatsappEnabled && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-900 dark:text-white">Phone Number</label>
                          <Input
                            type="tel"
                            placeholder="+1234567890"
                            value={settings.whatsappPhoneNumber}
                            onChange={(e) => handleSettingChange('whatsappPhoneNumber', e.target.value)}
                            className="bg-white dark:bg-slate-900"
                          />
                          {settings.whatsappPhoneNumber && (
                            <div className="flex gap-2">
                              <Button onClick={copyWhatsAppLink} variant="outline" size="sm" className="flex-1">
                                <Copy className="h-3 w-3 mr-1" /> Copy Link
                              </Button>
                              <Button onClick={openWhatsAppLink} variant="outline" size="sm" className="flex-1">
                                <ExternalLink className="h-3 w-3 mr-1" /> Open
                              </Button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Bell className="h-5 w-5 text-blue-500" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { key: 'emailNotifications', label: 'Email', icon: Bell },
                      { key: 'pushNotifications', label: 'Push', icon: Smartphone },
                      { key: 'classUpdates', label: 'Class Updates', icon: User },
                      { key: 'parentMessages', label: 'Parent Messages', icon: Heart }
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                        </div>
                        <div
                          onClick={() => handleSettingChange(key as keyof TeacherSettingsState, !settings[key as keyof TeacherSettingsState])}
                          className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${settings[key as keyof TeacherSettingsState] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                            }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings[key as keyof TeacherSettingsState] ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Security & Privacy */}
            <section>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security & Privacy</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Account protection and visibility</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-emerald-500" />
                      Privacy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">Profile Visibility</label>
                      <select
                        value={settings.profileVisibility}
                        onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl text-sm"
                      >
                        <option value="public">Public</option>
                        <option value="school">School Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    {[
                      { key: 'showEmail', label: 'Show Email', icon: Eye },
                      { key: 'twoFactorAuth', label: '2FA', icon: Lock }
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                        </div>
                        <div
                          onClick={() => handleSettingChange(key as keyof TeacherSettingsState, !settings[key as keyof TeacherSettingsState])}
                          className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${settings[key as keyof TeacherSettingsState] ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-slate-600'
                            }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings[key as keyof TeacherSettingsState] ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Teaching Preferences */}
            <section>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Teaching Experience</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Interface and interaction settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="h-5 w-5 text-amber-500" />
                      Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { key: 'autoSaveGrades', label: 'Auto-Save', icon: Database },
                      { key: 'soundEffects', label: 'Sounds', icon: Volume2 },
                      { key: 'animations', label: 'Animations', icon: Zap },
                      { key: 'classroomMode', label: 'Classroom', icon: Monitor }
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                        </div>
                        <div
                          onClick={() => handleSettingChange(key as keyof TeacherSettingsState, !settings[key as keyof TeacherSettingsState])}
                          className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${settings[key as keyof TeacherSettingsState] ? 'bg-amber-600' : 'bg-gray-300 dark:bg-slate-600'
                            }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings[key as keyof TeacherSettingsState] ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>

          </div>
        </div>
      </div>
    </UnifiedAuthGuard>
  )
}

export default TeacherSettingsPage
