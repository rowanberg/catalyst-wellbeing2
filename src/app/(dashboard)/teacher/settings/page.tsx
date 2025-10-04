'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/lib/redux/hooks'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft,
  Settings,
  Bell,
  Shield,
  Palette,
  Globe,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Smartphone,
  Save,
  RefreshCw,
  Check,
  User,
  Lock,
  Database,
  Zap,
  Heart,
  RotateCw
} from 'lucide-react'

interface TeacherSettingsState {
  // Appearance
  theme: 'light' | 'dark' | 'system'
  fontSize: number
  language: string
  
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
  
  // Communication
  parentCommunication: boolean
  studentMessaging: boolean
  autoResponder: boolean
  messagePreview: boolean
}

const TeacherSettingsPage = () => {
  const router = useRouter()
  const { user, profile } = useAppSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const [settings, setSettings] = useState<TeacherSettingsState>({
    // Appearance
    theme: 'system',
    fontSize: 16,
    language: 'English',
    
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
    
    // Communication
    parentCommunication: true,
    studentMessaging: true,
    autoResponder: false,
    messagePreview: true
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/teacher/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data.settings }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = useCallback((key: keyof TeacherSettingsState, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value }
      
      // Apply theme changes immediately
      if (key === 'theme') {
        const isDark = value === 'dark' || (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.toggle('dark', isDark)
        localStorage.setItem('catalyst-theme-preference', value)
      }
      
      // Apply font size changes immediately
      if (key === 'fontSize') {
        document.documentElement.style.fontSize = `${value}px`
        localStorage.setItem('catalyst-font-size', value.toString())
      }
      
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
      
      const response = await fetch('/api/teacher/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })
      
      if (response.ok) {
        showToast('Settings saved successfully!', 'success')
        setHasUnsavedChanges(false)
      } else {
        showToast('Failed to save settings', 'error')
      }
    } catch (error) {
      showToast('Failed to save settings', 'error')
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
        
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => router.back()}
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 rounded-xl shadow-lg">
                        <Settings className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white">Teacher Settings</h1>
                        <p className="text-white/80 text-sm">Customize your teaching experience</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={saveSettings}
                    disabled={saving || !hasUnsavedChanges}
                    className={`border-0 rounded-xl px-6 py-3 font-semibold transition-all ${
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
                    {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'All Saved'}
                  </Button>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Appearance Settings */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl h-fit">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Palette className="h-5 w-5 text-purple-400" />
                      Appearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Theme */}
                    <div className="space-y-3">
                      <label className="text-white/80 font-medium text-sm">Theme</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', label: 'Light', icon: Sun },
                          { value: 'dark', label: 'Dark', icon: Moon },
                          { value: 'system', label: 'System', icon: Monitor }
                        ].map(({ value, label, icon: Icon }) => (
                          <Button
                            key={value}
                            variant={settings.theme === value ? 'default' : 'outline'}
                            onClick={() => handleSettingChange('theme', value)}
                            className={`p-3 rounded-xl border transition-all ${
                              settings.theme === value
                                ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0'
                                : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                            }`}
                          >
                            <div className="flex flex-col items-center space-y-2">
                              <Icon className="h-4 w-4" />
                              <span className="text-xs font-medium">{label}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-white/80 font-medium text-sm">Font Size</label>
                        <span className="text-white/60 text-sm bg-white/10 px-2 py-1 rounded-lg">{settings.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="20"
                        value={settings.fontSize}
                        onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Language */}
                    <div className="space-y-3">
                      <label className="text-white/80 font-medium text-sm">Language</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none"
                      >
                        <option value="English" className="bg-slate-800">English</option>
                        <option value="Spanish" className="bg-slate-800">Spanish</option>
                        <option value="French" className="bg-slate-800">French</option>
                        <option value="German" className="bg-slate-800">German</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notification Settings */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl h-fit">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Bell className="h-5 w-5 text-blue-400" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email', icon: Bell },
                      { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser notifications', icon: Smartphone },
                      { key: 'classUpdates', label: 'Class Updates', description: 'Student activity notifications', icon: User },
                      { key: 'parentMessages', label: 'Parent Messages', description: 'New parent communications', icon: Heart },
                      { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications', icon: Shield },
                      { key: 'weeklyReports', label: 'Weekly Reports', description: 'Automated weekly summaries', icon: RotateCw }
                    ].map(({ key, label, description, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Icon className="h-4 w-4 text-blue-300" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{label}</p>
                            <p className="text-white/60 text-xs">{description}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSettingChange(key as keyof TeacherSettingsState, !settings[key as keyof TeacherSettingsState])}
                          className={`relative w-11 h-6 rounded-full transition-all ${
                            settings[key as keyof TeacherSettingsState] ? 'bg-blue-500' : 'bg-white/20'
                          }`}
                        >
                          <div className={`absolute w-4 h-4 bg-white rounded-full transition-all ${
                            settings[key as keyof TeacherSettingsState] ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Privacy & Security */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Shield className="h-5 w-5 text-green-400" />
                      Privacy & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Visibility */}
                    <div className="space-y-3">
                      <label className="text-white/80 font-medium text-sm">Profile Visibility</label>
                      <select
                        value={settings.profileVisibility}
                        onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white backdrop-blur-sm focus:border-green-400 focus:ring-2 focus:ring-green-400/20 focus:outline-none"
                      >
                        <option value="public" className="bg-slate-800">Public</option>
                        <option value="school" className="bg-slate-800">School Only</option>
                        <option value="private" className="bg-slate-800">Private</option>
                      </select>
                    </div>

                    {/* Privacy Toggles */}
                    {[
                      { key: 'showEmail', label: 'Show Email', description: 'Display email in profile', icon: Eye },
                      { key: 'showPhone', label: 'Show Phone', description: 'Display phone in profile', icon: Eye },
                      { key: 'twoFactorAuth', label: 'Two-Factor Auth', description: 'Enhanced security', icon: Lock }
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
                        <Button
                          onClick={() => handleSettingChange(key as keyof TeacherSettingsState, !settings[key as keyof TeacherSettingsState])}
                          className={`relative w-11 h-6 rounded-full transition-all ${
                            settings[key as keyof TeacherSettingsState] ? 'bg-green-500' : 'bg-white/20'
                          }`}
                        >
                          <div className={`absolute w-4 h-4 bg-white rounded-full transition-all ${
                            settings[key as keyof TeacherSettingsState] ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </Button>
                      </div>
                    ))}

                    {/* Session Timeout */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-white/80 font-medium text-sm">Session Timeout</label>
                        <span className="text-white/60 text-sm bg-white/10 px-2 py-1 rounded-lg">{settings.sessionTimeout} min</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="120"
                        step="15"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Teaching Preferences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      Teaching Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: 'autoSaveGrades', label: 'Auto-Save Grades', description: 'Automatically save grade entries', icon: Database },
                      { key: 'soundEffects', label: 'Sound Effects', description: 'Play sounds for interactions', icon: Volume2 },
                      { key: 'animations', label: 'Animations', description: 'Enable smooth transitions', icon: Zap },
                      { key: 'hapticFeedback', label: 'Haptic Feedback', description: 'Vibration feedback', icon: Heart },
                      { key: 'classroomMode', label: 'Classroom Mode', description: 'Optimized for teaching', icon: Monitor }
                    ].map(({ key, label, description, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-yellow-500/20 rounded-lg">
                            <Icon className="h-4 w-4 text-yellow-300" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{label}</p>
                            <p className="text-white/60 text-xs">{description}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSettingChange(key as keyof TeacherSettingsState, !settings[key as keyof TeacherSettingsState])}
                          className={`relative w-11 h-6 rounded-full transition-all ${
                            settings[key as keyof TeacherSettingsState] ? 'bg-yellow-500' : 'bg-white/20'
                          }`}
                        >
                          <div className={`absolute w-4 h-4 bg-white rounded-full transition-all ${
                            settings[key as keyof TeacherSettingsState] ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </Button>
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
