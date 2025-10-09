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
  Key,
  Brain,
  Sparkles,
  Link,
  Copy,
  ExternalLink
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
  
  // Gemini AI Configuration
  geminiEnabled: boolean
  geminiApiKey: string
  geminiModel: 'gemini-pro' | 'gemini-pro-vision'
  geminiAutoGrading: boolean
  geminiContentGeneration: boolean
  geminiStudentSupport: boolean
}

const TeacherSettingsPage = () => {
  const router = useRouter()
  const { user, profile } = useAppSelector((state) => state.auth)
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
    whatsappBusinessAccount: false,
    
    // Gemini AI Configuration
    geminiEnabled: false,
    geminiApiKey: '',
    geminiModel: 'gemini-pro',
    geminiAutoGrading: false,
    geminiContentGeneration: false,
    geminiStudentSupport: false
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-blue-400"></div>
        </div>
      </div>
    )
  }

  return (
    <UnifiedAuthGuard requiredRole="teacher">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:32px_32px]" />
        
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
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                    <Button
                      onClick={() => router.back()}
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-2 flex-shrink-0"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 rounded-xl shadow-lg flex-shrink-0">
                        <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">Teacher Settings</h1>
                        <p className="text-white/80 text-xs sm:text-sm truncate">Customize your teaching experience</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              
              {/* WhatsApp Configuration */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <MessageCircle className="h-5 w-5 text-green-400" />
                      WhatsApp Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Enable WhatsApp */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <MessageCircle className="h-4 w-4 text-green-300" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">Enable WhatsApp</p>
                          <p className="text-white/60 text-xs">Connect WhatsApp for communication</p>
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
                          <label className="text-white/80 font-medium text-sm">WhatsApp Number</label>
                          <div className="space-y-2">
                            <Input
                              type="tel"
                              placeholder="+1234567890"
                              value={settings.whatsappPhoneNumber}
                              onChange={(e) => handleSettingChange('whatsappPhoneNumber', e.target.value)}
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-green-400 focus:ring-green-400/20"
                            />
                            
                            {/* Auto-generated Link Actions */}
                            {settings.whatsappPhoneNumber && (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  onClick={copyWhatsAppLink}
                                  variant="outline"
                                  size="sm"
                                  className="bg-white/5 border-green-400/30 text-green-300 hover:bg-green-500/10 hover:border-green-400 flex-1"
                                >
                                  <Copy className="h-3 w-3 mr-2" />
                                  Copy Link
                                </Button>
                                <Button
                                  onClick={openWhatsAppLink}
                                  variant="outline"
                                  size="sm"
                                  className="bg-white/5 border-green-400/30 text-green-300 hover:bg-green-500/10 hover:border-green-400 flex-1"
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
                          <p className="text-white/50 text-xs">Your WhatsApp number for messaging</p>
                        </div>

                        {/* WhatsApp Features */}
                        {[
                          { key: 'whatsappBusinessAccount', label: 'Business Account', description: 'Use WhatsApp Business features', icon: MessageCircle },
                          { key: 'whatsappAutoReply', label: 'Auto Reply', description: 'Automatic responses to messages', icon: Bot },
                          { key: 'whatsappParentNotifications', label: 'Parent Notifications', description: 'Send updates to parents', icon: User },
                          { key: 'whatsappStudentUpdates', label: 'Student Updates', description: 'Grade and attendance updates', icon: Bell }
                        ].map(({ key, label, description, icon: Icon }) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-green-500/20 rounded-lg">
                                <Icon className="h-4 w-4 text-green-300" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{label}</p>
                                <p className="text-white/60 text-xs">{description}</p>
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

              {/* Gemini AI Configuration */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Brain className="h-5 w-5 text-purple-400" />
                      Gemini AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Enable Gemini */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Brain className="h-4 w-4 text-purple-300" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">Enable Gemini AI</p>
                          <p className="text-white/60 text-xs">AI-powered teaching assistance</p>
                        </div>
                      </div>
                      <div 
                        onClick={() => handleSettingChange('geminiEnabled', !settings.geminiEnabled)}
                        className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                          settings.geminiEnabled ? 'bg-purple-500' : 'bg-white/20'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          settings.geminiEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </div>
                    </div>

                    {settings.geminiEnabled && (
                      <>
                        {/* API Key */}
                        <div className="space-y-2">
                          <label className="text-white/80 font-medium text-sm">Gemini API Key</label>
                          <Input
                            type="password"
                            placeholder="Enter your Google AI API key"
                            value={settings.geminiApiKey}
                            onChange={(e) => handleSettingChange('geminiApiKey', e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/20"
                          />
                        </div>

                        {/* Model Selection */}
                        <div className="space-y-2">
                          <label className="text-white/80 font-medium text-sm">AI Model</label>
                          <select
                            value={settings.geminiModel}
                            onChange={(e) => handleSettingChange('geminiModel', e.target.value)}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none"
                          >
                            <option value="gemini-pro" className="bg-slate-800">Gemini Pro</option>
                            <option value="gemini-pro-vision" className="bg-slate-800">Gemini Pro Vision</option>
                          </select>
                        </div>

                        {/* Gemini Features */}
                        {[
                          { key: 'geminiAutoGrading', label: 'Auto Grading', description: 'AI-assisted grading', icon: Sparkles },
                          { key: 'geminiContentGeneration', label: 'Content Generation', description: 'Create lesson materials', icon: Bot },
                          { key: 'geminiStudentSupport', label: 'Student Support', description: 'AI tutoring assistance', icon: Heart }
                        ].map(({ key, label, description, icon: Icon }) => (
                          <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Icon className="h-4 w-4 text-purple-300" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{label}</p>
                                <p className="text-white/60 text-xs">{description}</p>
                              </div>
                            </div>
                            <div 
                              onClick={() => handleSettingChange(key as keyof TeacherSettingsState, !settings[key as keyof TeacherSettingsState])}
                              className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                                settings[key as keyof TeacherSettingsState] ? 'bg-purple-500' : 'bg-white/20'
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
                className="lg:col-span-2 xl:col-span-1"
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Bell className="h-5 w-5 text-blue-400" />
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
                      <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                            <Icon className="h-4 w-4 text-blue-300" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm truncate">{label}</p>
                            <p className="text-white/60 text-xs truncate">{description}</p>
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

              {/* Privacy & Security */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:col-span-2 xl:col-span-1"
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Shield className="h-5 w-5 text-green-400" />
                      Privacy & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Profile Visibility */}
                    <div className="space-y-2">
                      <label className="text-white/80 font-medium text-sm">Profile Visibility</label>
                      <select
                        value={settings.profileVisibility}
                        onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white backdrop-blur-sm focus:border-green-400 focus:ring-2 focus:ring-green-400/20 focus:outline-none text-sm"
                      >
                        <option value="public" className="bg-slate-800">Public</option>
                        <option value="school" className="bg-slate-800">School Only</option>
                        <option value="private" className="bg-slate-800">Private</option>
                      </select>
                    </div>

                    {/* Privacy Toggles */}
                    {[
                      { key: 'showEmail', label: 'Show Email', description: 'Display email in profile', icon: Eye },
                      { key: 'showPhone', label: 'Show Phone', description: 'Display phone in profile', icon: Phone },
                      { key: 'twoFactorAuth', label: 'Two-Factor Auth', description: 'Enhanced security', icon: Lock }
                    ].map(({ key, label, description, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                            <Icon className="h-4 w-4 text-green-300" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm truncate">{label}</p>
                            <p className="text-white/60 text-xs truncate">{description}</p>
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
                        <label className="text-white/80 font-medium text-sm">Session Timeout</label>
                        <span className="text-white/60 text-sm bg-white/10 px-3 py-1 rounded-lg">{settings.sessionTimeout} min</span>
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

              {/* Teaching Preferences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="lg:col-span-2 xl:col-span-1"
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl h-fit">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Zap className="h-5 w-5 text-yellow-400" />
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
                      <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="p-2 bg-yellow-500/20 rounded-lg flex-shrink-0">
                            <Icon className="h-4 w-4 text-yellow-300" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm truncate">{label}</p>
                            <p className="text-white/60 text-xs truncate">{description}</p>
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
    </UnifiedAuthGuard>
  )
}

export default TeacherSettingsPage
