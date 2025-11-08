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
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-2xl shadow-2xl z-[10000] transform transition-all duration-500 backdrop-blur-xl border ${
      type === 'success' 
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(59,130,246,0.03)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_2px_2px,rgba(59,130,246,0.08)_1px,transparent_0)] bg-[length:32px_32px]" />
        
        {/* Custom Styles for Sliders */}
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            border: 2px solid #10b981;
          }
          
          .slider::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            border: 2px solid #10b981;
          }
          
          @media (max-width: 640px) {
            .slider::-webkit-slider-thumb {
              height: 20px;
              width: 20px;
            }
            .slider::-moz-range-thumb {
              height: 20px;
              width: 20px;
            }
          }
        `}</style>
        
        <div className="relative z-10 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white dark:bg-slate-800/95 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                    <Button
                      onClick={() => router.back()}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl p-2 flex-shrink-0"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md flex-shrink-0">
                        <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-slate-100 truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>Teacher Settings</h1>
                        <p className="text-gray-600 dark:text-slate-400 text-xs sm:text-sm truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>Customize your teaching experience</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={saveSettings}
                    disabled={saving || !hasUnsavedChanges}
                    className={`border-0 rounded-xl px-4 sm:px-6 py-2 sm:py-3 font-semibold transition-all text-sm sm:text-base w-full sm:w-auto flex-shrink-0 ${
                      hasUnsavedChanges 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white' 
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
                    <span className="truncate">
                      {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'All Saved'}
                    </span>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Settings Sections */}
            <div className="space-y-8">
              
              {/* Personalization Section */}
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                    Personalization
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Customize your interface preferences and appearance
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Appearance Settings - Dark Mode */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.05 }}
                  >
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl h-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <Palette className="h-5 w-5 text-indigo-500" />
                      Appearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-lg">
                          {isDarkMode ? (
                            <Moon className="h-4 w-4 text-white" />
                          ) : (
                            <Sun className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-slate-100 font-semibold text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>Dark Mode</p>
                          <p className="text-gray-600 dark:text-slate-400 text-xs" style={{ fontFamily: 'var(--font-dm-sans)' }}>Switch between light and dark theme</p>
                        </div>
                      </div>
                      <div 
                        onClick={toggleDarkMode}
                        className={`relative w-14 h-7 rounded-full transition-all cursor-pointer ${
                          isDarkMode ? 'bg-indigo-500' : 'bg-white/20'
                        }`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-lg ${
                          isDarkMode ? 'translate-x-7' : 'translate-x-1'
                        }`}>
                          {isDarkMode ? (
                            <Moon className="h-3 w-3 text-indigo-600 m-1" />
                          ) : (
                            <Sun className="h-3 w-3 text-amber-500 m-1" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Theme Preview */}
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700">
                      <p className="text-gray-700 dark:text-slate-300 text-xs mb-2 font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>Current Theme:</p>
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          isDarkMode 
                            ? 'bg-slate-800 text-slate-200 border border-slate-700' 
                            : 'bg-white text-slate-800 border border-slate-200'
                        }`} style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          {isDarkMode ? '🌙 Dark Theme' : '☀️ Light Theme'}
                        </div>
                        <span className="text-gray-500 dark:text-slate-500 text-xs" style={{ fontFamily: 'var(--font-dm-sans)' }}>Active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
                </div>
              </div>

              {/* Communication Section */}
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                    Communication
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Manage messaging and notification preferences
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
              {/* WhatsApp Configuration */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <MessageCircle className="h-5 w-5 text-green-500" />
                      WhatsApp Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Enable WhatsApp */}
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-100 dark:border-green-900/30">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg">
                          <MessageCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-slate-100 font-semibold text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>Enable WhatsApp</p>
                          <p className="text-gray-600 dark:text-slate-400 text-xs" style={{ fontFamily: 'var(--font-dm-sans)' }}>Connect WhatsApp for communication</p>
                        </div>
                      </div>
                      <div 
                        onClick={() => handleSettingChange('whatsappEnabled', !settings.whatsappEnabled)}
                        className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                          settings.whatsappEnabled ? 'bg-green-500' : 'bg-white/20'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          settings.whatsappEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </div>
                    </div>

                    {settings.whatsappEnabled && (
                      <>
                        {/* Phone Number */}
                        <div className="space-y-3">
                          <label className="text-gray-700 dark:text-slate-300 font-semibold text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>WhatsApp Number</label>
                          <div className="space-y-2">
                            <Input
                              type="tel"
                              placeholder="+1234567890"
                              value={settings.whatsappPhoneNumber}
                              onChange={(e) => handleSettingChange('whatsappPhoneNumber', e.target.value)}
                              className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-green-500 focus:ring-green-500/20" style={{ fontFamily: 'var(--font-dm-sans)' }}
                            />
                            
                            {/* Auto-generated Link Actions */}
                            {settings.whatsappPhoneNumber && (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  onClick={copyWhatsAppLink}
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-400 flex-1"
                                >
                                  <Copy className="h-3 w-3 mr-2" />
                                  Copy Link
                                </Button>
                                <Button
                                  onClick={openWhatsAppLink}
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-400 flex-1"
                                >
                                  <ExternalLink className="h-3 w-3 mr-2" />
                                  Open WhatsApp
                                </Button>
                              </div>
                            )}
                            
                            {/* Generated Link Preview */}
                            {settings.whatsappPhoneNumber && (
                              <div className="p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
                                <div className="flex items-start space-x-2">
                                  <Link className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-green-300 text-xs font-medium">Auto-generated WhatsApp Link:</p>
                                    <p className="text-green-200/80 text-xs break-all font-mono bg-green-900/20 px-2 py-1 rounded mt-1">
                                      {generateWhatsAppLink()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-500 dark:text-slate-500 text-xs" style={{ fontFamily: 'var(--font-dm-sans)' }}>Your WhatsApp number for messaging</p>
                        </div>

                        {/* WhatsApp Features */}
                        {[
                          { key: 'whatsappBusinessAccount', label: 'Business Account', description: 'Use WhatsApp Business features', icon: MessageCircle },
                          { key: 'whatsappAutoReply', label: 'Auto Reply', description: 'Automatic responses to messages', icon: Bot },
                          { key: 'whatsappParentNotifications', label: 'Parent Notifications', description: 'Send updates to parents', icon: User },
                          { key: 'whatsappStudentUpdates', label: 'Student Updates', description: 'Grade and attendance updates', icon: Bell }
                        ].map(({ key, label, description, icon: Icon }) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-100 dark:border-green-900/30">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg">
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="text-gray-900 dark:text-slate-100 font-semibold text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
                                <p className="text-gray-600 dark:text-slate-400 text-xs" style={{ fontFamily: 'var(--font-dm-sans)' }}>{description}</p>
                              </div>
                            </div>
                            <div 
                              onClick={() => handleSettingChange(key as keyof TeacherSettingsState, !settings[key as keyof TeacherSettingsState])}
                              className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                                settings[key as keyof TeacherSettingsState] ? 'bg-green-500' : 'bg-white/20'
                              }`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                                settings[key as keyof TeacherSettingsState] ? 'translate-x-5' : 'translate-x-1'
                              }`} />
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notification Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <Bell className="h-5 w-5 text-blue-500" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email', icon: Bell },
                      { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser notifications', icon: Smartphone },
                      { key: 'classUpdates', label: 'Class Updates', description: 'Student activity notifications', icon: User },
                      { key: 'parentMessages', label: 'Parent Messages', description: 'New parent communications', icon: Heart },
                      { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications', icon: Shield },
                      { key: 'weeklyReports', label: 'Weekly Reports', description: 'Automated weekly summaries', icon: RotateCw }
                    ].map(({ key, label, description, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-lg flex-shrink-0">
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-900 dark:text-slate-100 font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
                            <p className="text-gray-600 dark:text-slate-400 text-xs truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{description}</p>
                          </div>
                        </div>
                        <div 
                          onClick={() => handleSettingChange(key as keyof TeacherSettingsState, !settings[key as keyof TeacherSettingsState])}
                          className={`relative w-11 h-6 rounded-full transition-all cursor-pointer flex-shrink-0 ml-3 ${
                            settings[key as keyof TeacherSettingsState] ? 'bg-blue-500' : 'bg-white/20'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            settings[key as keyof TeacherSettingsState] ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
                </div>
              </div>

              {/* Security & Privacy Section */}
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                    Security & Privacy
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Protect your account and manage visibility settings
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Privacy & Security */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <Shield className="h-5 w-5 text-emerald-500" />
                      Privacy & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Profile Visibility */}
                    <div className="space-y-2">
                      <label className="text-gray-700 dark:text-slate-300 font-semibold text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>Profile Visibility</label>
                      <select
                        value={settings.profileVisibility}
                        onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-sm"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        <option value="public" className="bg-white dark:bg-slate-800">Public</option>
                        <option value="school" className="bg-white dark:bg-slate-800">School Only</option>
                        <option value="private" className="bg-white dark:bg-slate-800">Private</option>
                      </select>
                    </div>

                    {/* Privacy Toggles */}
                    {[
                      { key: 'showEmail', label: 'Show Email', description: 'Display email in profile', icon: Eye },
                      { key: 'showPhone', label: 'Show Phone', description: 'Display phone in profile', icon: Phone },
                      { key: 'twoFactorAuth', label: 'Two-Factor Auth', description: 'Enhanced security', icon: Lock }
                    ].map(({ key, label, description, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-2 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex-shrink-0">
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-900 dark:text-slate-100 font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
                            <p className="text-gray-600 dark:text-slate-400 text-xs truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{description}</p>
                          </div>
                        </div>
                        <div 
                          onClick={() => handleSettingChange(key as keyof TeacherSettingsState, !settings[key as keyof TeacherSettingsState])}
                          className={`relative w-11 h-6 rounded-full transition-all cursor-pointer flex-shrink-0 ml-3 ${
                            settings[key as keyof TeacherSettingsState] ? 'bg-green-500' : 'bg-white/20'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            settings[key as keyof TeacherSettingsState] ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </div>
                      </div>
                    ))}

                    {/* Session Timeout */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-gray-700 dark:text-slate-300 font-semibold text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>Session Timeout</label>
                        <span className="text-gray-900 dark:text-slate-100 text-sm bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-semibold" style={{ fontFamily: 'var(--font-dm-sans)' }}>{settings.sessionTimeout} min</span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="15"
                          max="120"
                          step="15"
                          value={settings.sessionTimeout}
                          onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${((settings.sessionTimeout - 15) / (120 - 15)) * 100}%, rgba(255,255,255,0.2) ${((settings.sessionTimeout - 15) / (120 - 15)) * 100}%, rgba(255,255,255,0.2) 100%)`
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
                </div>
              </div>

              {/* Teaching Section */}
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}>
                    Teaching Experience
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Customize your teaching interface and interaction preferences
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Teaching Preferences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card className="bg-white dark:bg-slate-800/95 shadow-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.01em' }}>
                      <Zap className="h-5 w-5 text-amber-500" />
                      Teaching Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { key: 'autoSaveGrades', label: 'Auto-Save Grades', description: 'Automatically save grade entries', icon: Database },
                      { key: 'soundEffects', label: 'Sound Effects', description: 'Play sounds for interactions', icon: Volume2 },
                      { key: 'animations', label: 'Animations', description: 'Enable smooth transitions', icon: Zap },
                      { key: 'hapticFeedback', label: 'Haptic Feedback', description: 'Vibration feedback', icon: Heart },
                      { key: 'classroomMode', label: 'Classroom Mode', description: 'Optimized for teaching', icon: Monitor }
                    ].map(({ key, label, description, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-2 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex-shrink-0">
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-900 dark:text-slate-100 font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
                            <p className="text-gray-600 dark:text-slate-400 text-xs truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{description}</p>
                          </div>
                        </div>
                        <div 
                          onClick={() => handleSettingChange(key as keyof TeacherSettingsState, !settings[key as keyof TeacherSettingsState])}
                          className={`relative w-11 h-6 rounded-full transition-all cursor-pointer flex-shrink-0 ml-3 ${
                            settings[key as keyof TeacherSettingsState] ? 'bg-yellow-500' : 'bg-white/20'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                            settings[key as keyof TeacherSettingsState] ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedAuthGuard>
  )
}

export default TeacherSettingsPage
