'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  Settings, 
  School, 
  Bell, 
  Shield, 
  Users,
  Mail,
  Phone,
  MapPin,
  Save,
  RefreshCw,
  Calendar
} from 'lucide-react'
import { AdvancedGradeLevelManager } from '@/components/admin/AdvancedGradeLevelManager'

interface SchoolSettings {
  id: string
  name: string
  address: string
  phone: string
  email: string
  website?: string
  school_code: string
  timezone: string
  academic_year_start: string
  academic_year_end: string
  notification_settings: {
    email_notifications: boolean
    sms_notifications: boolean
    push_notifications: boolean
    weekly_reports: boolean
    urgent_alerts: boolean
  }
  privacy_settings: {
    data_retention_days: number
    allow_analytics: boolean
    share_anonymous_data: boolean
    require_parent_consent: boolean
  }
  wellbeing_settings: {
    daily_check_ins: boolean
    anonymous_reporting: boolean
    crisis_intervention: boolean
    counselor_access: boolean
  }
}

interface GeminiConfig {
  apiKey: string
  selectedModel: string
  isConfigured: boolean
}

function SchoolSettingsContent() {
  const { profile } = useAppSelector((state) => state.auth)
  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()
  
  // Gemini AI Configuration
  const [geminiConfig, setGeminiConfig] = useState<GeminiConfig>({
    apiKey: '',
    selectedModel: 'gemini-1.5-flash',
    isConfigured: false
  })
  const [geminiTesting, setGeminiTesting] = useState(false)

  useEffect(() => {
    if (profile) {
      fetchSettings()
    }
  }, [profile])

  const fetchSettings = async () => {
    if (!profile) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin/school-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: profile.school_id }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch school settings')
      }

      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      addToast({
        type: 'error',
        title: 'Failed to Load Settings',
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings || !profile) return

    try {
      setSaving(true)
      const response = await fetch('/api/admin/school-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          schoolId: profile.school_id,
          settings 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      addToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'School settings have been updated successfully'
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      addToast({
        type: 'error',
        title: 'Failed to Save Settings',
        description: errorMessage
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (path: string, value: any) => {
    if (!settings) return
    
    const keys = path.split('.')
    const newSettings = { ...settings }
    let current: any = newSettings
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    setSettings(newSettings)
  }

  // Gemini AI Configuration Functions (temporarily disabled to fix runtime errors)

  // Gemini configuration functions temporarily removed to fix runtime errors

  // Gemini functions removed to fix runtime errors - will be re-implemented later

  if (loading) {
    return <PageLoader text="Loading school settings..." />
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No settings found</p>
            <ClientWrapper>
              <Button onClick={fetchSettings} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </ClientWrapper>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Enhanced Mobile Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4 py-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 sm:py-6">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">School Settings</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 hidden sm:block">Configure your school's platform settings</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ClientWrapper>
                <Button 
                  variant="outline" 
                  onClick={fetchSettings}
                  size="sm"
                  className="flex-1 sm:flex-none min-w-0 px-3 py-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-sm truncate">Reset</span>
                </Button>
                <Button 
                  onClick={saveSettings} 
                  disabled={saving}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none min-w-0 px-3 py-2"
                >
                  <Save className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-sm truncate">{saving ? 'Saving...' : 'Save'}</span>
                </Button>
              </ClientWrapper>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Main Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {/* Grade Level Management - Mobile Optimized Container */}
        <Card className="mb-6 sm:mb-8 bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
              <span className="truncate">Grade Level Management</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 mt-2">
              Create and manage grade levels and sections for your school
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-0 pb-0">
            {profile?.school_id ? (
              <div className="w-full">
                {/* Mobile-Responsive Wrapper */}
                <div className="grade-manager-mobile-wrapper">
                  <AdvancedGradeLevelManager schoolId={profile.school_id} />
                </div>
                
                {/* Mobile-specific CSS */}
                <style dangerouslySetInnerHTML={{
                  __html: `
                    .grade-manager-mobile-wrapper {
                      width: 100%;
                      overflow-x: auto;
                      -webkit-overflow-scrolling: touch;
                    }
                    
                    /* Mobile optimizations */
                    @media (max-width: 639px) {
                      .grade-manager-mobile-wrapper .space-y-6 {
                        padding: 0.75rem !important;
                        space-y: 1rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .bg-gradient-to-r {
                        padding: 1rem !important;
                        margin-bottom: 1rem !important;
                        border-radius: 0.75rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .text-3xl {
                        font-size: 1.125rem !important;
                        line-height: 1.5rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .text-lg {
                        font-size: 0.875rem !important;
                        line-height: 1.25rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper button {
                        font-size: 0.75rem !important;
                        padding: 0.375rem 0.5rem !important;
                        white-space: nowrap;
                      }
                      
                      .grade-manager-mobile-wrapper .flex.items-center {
                        flex-wrap: wrap;
                        gap: 0.5rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .grid {
                        grid-template-columns: 1fr !important;
                        gap: 0.75rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper input {
                        font-size: 0.875rem !important;
                        padding: 0.5rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .bg-white\/10 {
                        padding: 0.25rem 0.5rem !important;
                        font-size: 0.75rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .rounded-2xl {
                        border-radius: 0.75rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .p-8 {
                        padding: 1rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .mb-8 {
                        margin-bottom: 1rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .gap-6 {
                        gap: 0.5rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .gap-3 {
                        gap: 0.375rem !important;
                      }
                    }
                    
                    /* Tablet optimizations */
                    @media (min-width: 640px) and (max-width: 1023px) {
                      .grade-manager-mobile-wrapper .space-y-6 {
                        padding: 1rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .bg-gradient-to-r {
                        padding: 1.5rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .text-3xl {
                        font-size: 1.5rem !important;
                        line-height: 2rem !important;
                      }
                      
                      .grade-manager-mobile-wrapper .grid {
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
                      }
                    }
                  `
                }} />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 px-4 sm:px-0">
                <Users className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                <p className="text-sm sm:text-base">Loading school information...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Grid - Enhanced Mobile Layout */}
        <div className="space-y-6 sm:space-y-8 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0 xl:gap-10">
          {/* School Information - Enhanced Mobile */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
              <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
                <School className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                <span className="truncate">School Information</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 mt-2">
                Basic school details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 sm:space-y-6 pt-0 px-4 sm:px-6 pb-6">
              <div className="space-y-5">
                <div>
                  <Label htmlFor="school-name" className="text-sm font-medium text-gray-700 mb-2 block">School Name</Label>
                  <Input
                    id="school-name"
                    value={settings.name}
                    onChange={(e) => updateSettings('name', e.target.value)}
                    className="w-full h-11 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter school name"
                  />
                </div>
                <div>
                  <Label htmlFor="school-code" className="text-sm font-medium text-gray-700 mb-2 block">School Code</Label>
                  <Input
                    id="school-code"
                    value={settings.school_code}
                    disabled
                    className="w-full h-11 text-base bg-gray-50 border-gray-200 rounded-lg text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">This code cannot be changed</p>
                </div>
                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700 mb-2 block">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    value={settings.address}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSettings('address', e.target.value)}
                    className="w-full text-base border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter school address"
                  />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => updateSettings('phone', e.target.value)}
                      className="w-full h-11 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSettings('email', e.target.value)}
                      className="w-full h-11 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="contact@school.edu"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website" className="text-sm font-medium text-gray-700 mb-2 block">Website (Optional)</Label>
                  <Input
                    id="website"
                    value={settings.website || ''}
                    onChange={(e) => updateSettings('website', e.target.value)}
                    className="w-full h-11 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://www.yourschool.edu"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings - Enhanced Mobile */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
              <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
                <Bell className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                <span className="truncate">Notification Settings</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 mt-2">
                Configure how and when notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 pt-0 px-4 sm:px-6 pb-6">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="email-notifications" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-blue-600" />
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">Send notifications via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notification_settings.email_notifications}
                    onCheckedChange={(checked: boolean) => 
                      updateSettings('notification_settings.email_notifications', checked)
                    }
                    className="flex-shrink-0 scale-110"
                  />
                </div>
                <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="sms-notifications" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-blue-600" />
                      SMS Notifications
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">Send urgent alerts via SMS</p>
                  </div>
                  <Switch
                    id="sms-notifications"
                    checked={settings.notification_settings.sms_notifications}
                    onCheckedChange={(checked: boolean) => 
                      updateSettings('notification_settings.sms_notifications', checked)
                    }
                    className="flex-shrink-0 scale-110"
                  />
                </div>
                <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="push-notifications" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                      <Bell className="h-4 w-4 mr-2 text-blue-600" />
                      Push Notifications
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">Send push notifications to mobile apps</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.notification_settings.push_notifications}
                    onCheckedChange={(checked: boolean) => 
                      updateSettings('notification_settings.push_notifications', checked)
                    }
                    className="flex-shrink-0 scale-110"
                  />
                </div>
                <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="weekly-reports" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      Weekly Reports
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">Send weekly wellbeing reports</p>
                  </div>
                  <Switch
                    id="weekly-reports"
                    checked={settings.notification_settings.weekly_reports}
                    onCheckedChange={(checked: boolean) => 
                      updateSettings('notification_settings.weekly_reports', checked)
                    }
                    className="flex-shrink-0 scale-110"
                  />
                </div>
                <div className="flex items-start justify-between gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="urgent-alerts" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-red-500" />
                      Urgent Alerts
                    </Label>
                    <p className="text-sm text-red-700 mt-1">Immediate alerts for crisis situations</p>
                  </div>
                  <Switch
                    id="urgent-alerts"
                    checked={settings.notification_settings.urgent_alerts}
                    onCheckedChange={(checked: boolean) => 
                      updateSettings('notification_settings.urgent_alerts', checked)
                    }
                    className="flex-shrink-0 scale-110"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings - Enhanced Mobile */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
              <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
                <Shield className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                <span className="truncate">Privacy & Security</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 mt-2">
                Data protection and privacy controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 sm:space-y-6 pt-0 px-4 sm:px-6 pb-6">
              <div className="space-y-5">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Label htmlFor="data-retention" className="text-sm font-medium text-gray-900 mb-2 block flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    Data Retention (Days)
                  </Label>
                  <Input
                    id="data-retention"
                    type="number"
                    value={settings.privacy_settings.data_retention_days}
                    onChange={(e) => 
                      updateSettings('privacy_settings.data_retention_days', parseInt(e.target.value))
                    }
                    className="w-full h-11 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="30"
                    max="2555"
                    placeholder="365"
                  />
                  <p className="text-sm text-blue-700 mt-2">How long to keep user data (30-2555 days)</p>
                </div>
                <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="allow-analytics" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                      <Settings className="h-4 w-4 mr-2 text-blue-600" />
                      Allow Analytics
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">Enable platform analytics and insights</p>
                  </div>
                  <Switch
                    id="allow-analytics"
                    checked={settings.privacy_settings.allow_analytics}
                    onCheckedChange={(checked: boolean) => 
                      updateSettings('privacy_settings.allow_analytics', checked)
                    }
                    className="flex-shrink-0 scale-110"
                  />
                </div>
                <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="share-anonymous" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-blue-600" />
                      Share Anonymous Data
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">Help improve the platform with anonymous usage data</p>
                  </div>
                  <Switch
                    id="share-anonymous"
                    checked={settings.privacy_settings.share_anonymous_data}
                    onCheckedChange={(checked: boolean) => 
                      updateSettings('privacy_settings.share_anonymous_data', checked)
                    }
                    className="flex-shrink-0 scale-110"
                  />
                </div>
                <div className="flex items-start justify-between gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="parent-consent" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-green-600" />
                      Require Parent Consent
                    </Label>
                    <p className="text-sm text-green-700 mt-1">Require explicit parent consent for student data</p>
                  </div>
                  <Switch
                    id="parent-consent"
                    checked={settings.privacy_settings.require_parent_consent}
                    onCheckedChange={(checked: boolean) => 
                      updateSettings('privacy_settings.require_parent_consent', checked)
                    }
                    className="flex-shrink-0 scale-110"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wellbeing Settings - Enhanced Mobile */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
              <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
                <Users className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                <span className="truncate">Wellbeing Features</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 mt-2">
                Configure wellbeing and mental health features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 sm:space-y-6 pt-0 px-4 sm:px-6 pb-6">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="daily-checkins" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-green-600" />
                      Daily Check-ins
                    </Label>
                    <p className="text-sm text-green-700 mt-1">Enable daily wellbeing check-ins for students</p>
                  </div>
                  <Switch
                    id="daily-checkins"
                    checked={settings.wellbeing_settings.daily_check_ins}
                    onCheckedChange={(checked: boolean) => 
                      updateSettings('wellbeing_settings.daily_check_ins', checked)
                    }
                    className="flex-shrink-0 scale-110"
                  />
                </div>
                <div className="flex items-start justify-between gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="anonymous-reporting" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-blue-600" />
                      Anonymous Reporting
                    </Label>
                    <p className="text-sm text-blue-700 mt-1">Allow anonymous incident reporting</p>
                  </div>
                  <Switch
                    id="anonymous-reporting"
                    checked={settings.wellbeing_settings.anonymous_reporting}
                    onCheckedChange={(checked: boolean) => 
                      updateSettings('wellbeing_settings.anonymous_reporting', checked)
                    }
                    className="flex-shrink-0 scale-110"
                  />
                </div>
                <div className="flex items-start justify-between gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="crisis-intervention" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-red-500" />
                      Crisis Intervention
                    </Label>
                    <p className="text-sm text-red-700 mt-1">Enable automatic crisis intervention protocols</p>
                  </div>
                  <Switch
                    id="crisis-intervention"
                    checked={settings.wellbeing_settings.crisis_intervention}
                    onCheckedChange={(checked: boolean) => 
                      updateSettings('wellbeing_settings.crisis_intervention', checked)
                    }
                    className="flex-shrink-0 scale-110"
                  />
                </div>
                <div className="flex items-start justify-between gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="counselor-access" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-purple-600" />
                      Counselor Access
                    </Label>
                    <p className="text-sm text-purple-700 mt-1">Allow school counselors to access wellbeing data</p>
                  </div>
                  <Switch
                    id="counselor-access"
                    checked={settings.wellbeing_settings.counselor_access}
                    onCheckedChange={(checked: boolean) => 
                      updateSettings('wellbeing_settings.counselor_access', checked)
                    }
                    className="flex-shrink-0 scale-110"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Academic Year Settings - Enhanced Mobile */}
        <Card className="mt-6 sm:mt-8 bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
            <CardTitle className="flex items-center text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
              <Calendar className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
              <span className="truncate">Academic Year</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 mt-2">
              Set the academic year dates for proper data organization
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-4 sm:px-6 pb-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              <div>
                <Label htmlFor="academic-start" className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-green-600" />
                  Academic Year Start
                </Label>
                <Input
                  id="academic-start"
                  type="date"
                  value={settings.academic_year_start}
                  onChange={(e) => updateSettings('academic_year_start', e.target.value)}
                  className="w-full h-11 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="academic-end" className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-red-600" />
                  Academic Year End
                </Label>
                <Input
                  id="academic-end"
                  type="date"
                  value={settings.academic_year_end}
                  onChange={(e) => updateSettings('academic_year_end', e.target.value)}
                  className="w-full h-11 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <Label htmlFor="timezone" className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                  Timezone
                </Label>
                <Input
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => updateSettings('timezone', e.target.value)}
                  className="w-full h-11 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="America/New_York"
                />
                <p className="text-xs text-gray-500 mt-2">e.g., America/New_York, Europe/London</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gemini AI Configuration - Enhanced Mobile */}
        <Card className="mt-6 sm:mt-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 rounded-xl overflow-hidden shadow-lg">
          <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg flex-shrink-0">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Gemini AI Configuration</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 mt-1">
                  Configure your Gemini API key for AI assistant features
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-4 sm:px-6 pb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 bg-blue-500 rounded-full flex-shrink-0">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Setup Required</h4>
                  <p className="text-sm sm:text-base text-blue-700 mb-4">
                    To use the AI Assistant features, you need to configure your Gemini API key from Google AI Studio.
                  </p>
                  <div className="space-y-3 text-sm sm:text-base text-blue-700">
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-blue-800 flex-shrink-0">Step 1:</span>
                      <span>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800 font-medium">Google AI Studio</a></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-blue-800 flex-shrink-0">Step 2:</span>
                      <span>Create a new API key</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-blue-800 flex-shrink-0">Step 3:</span>
                      <span>Copy and paste it below</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-blue-800 flex-shrink-0">Step 4:</span>
                      <span>Select your preferred model</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 bg-amber-500 rounded-full flex-shrink-0">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-amber-900 mb-2 text-sm sm:text-base">Model Compatibility Notice</h4>
                  <p className="text-sm sm:text-base text-amber-700">
                    Currently, all model selections use <strong>Gemini Pro</strong> due to API version compatibility. 
                    Gemini 1.5 Flash and Pro models are not yet available in the v1beta API used by this library.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="gemini-api-key" className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
                  <Settings className="h-4 w-4 mr-2 text-purple-600" />
                  Gemini API Key
                </Label>
                <Input
                  id="gemini-api-key"
                  type="password"
                  value={geminiConfig.apiKey}
                  onChange={(e) => setGeminiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your Gemini API key (starts with AIza...)"
                  className="w-full h-11 text-base font-mono border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-2">Your API key will be encrypted and stored securely</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">AI Model Selection</Label>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                    <input 
                      type="radio" 
                      id="gemini-flash" 
                      name="gemini-model" 
                      value="gemini-1.5-flash" 
                      checked={geminiConfig.selectedModel === 'gemini-1.5-flash'}
                      onChange={(e) => setGeminiConfig(prev => ({ ...prev, selectedModel: e.target.value }))}
                      className="mt-1 text-purple-600 scale-110" 
                    />
                    <Label htmlFor="gemini-flash" className="cursor-pointer flex-1">
                      <div className="font-medium text-gray-900 mb-1">Gemini 1.5 Flash - Fast and efficient (Recommended)</div>
                      <div className="text-sm text-gray-600">1,500 requests/day, supports text + images</div>
                    </Label>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                    <input 
                      type="radio" 
                      id="gemini-pro" 
                      name="gemini-model" 
                      value="gemini-1.5-pro" 
                      checked={geminiConfig.selectedModel === 'gemini-1.5-pro'}
                      onChange={(e) => setGeminiConfig(prev => ({ ...prev, selectedModel: e.target.value }))}
                      className="mt-1 text-purple-600 scale-110" 
                    />
                    <Label htmlFor="gemini-pro" className="cursor-pointer flex-1">
                      <div className="font-medium text-gray-900 mb-1">Gemini 1.5 Pro - Most capable</div>
                      <div className="text-sm text-gray-600">50 requests/day, advanced reasoning + images</div>
                    </Label>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                    <input 
                      type="radio" 
                      id="gemini-basic" 
                      name="gemini-model" 
                      value="gemini-pro" 
                      checked={geminiConfig.selectedModel === 'gemini-pro'}
                      onChange={(e) => setGeminiConfig(prev => ({ ...prev, selectedModel: e.target.value }))}
                      className="mt-1 text-purple-600 scale-110" 
                    />
                    <Label htmlFor="gemini-basic" className="cursor-pointer flex-1">
                      <div className="font-medium text-gray-900 mb-1">Gemini 1.0 Pro - Reliable</div>
                      <div className="text-sm text-gray-600">No daily limit, text only</div>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={true}
                  className="flex-1 sm:flex-none text-purple-600 border-purple-200 hover:bg-purple-50 h-11"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Test Connection (Coming Soon)
                </Button>
                <Button 
                  size="sm"
                  disabled={true}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-11"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration (Coming Soon)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SchoolSettingsPage() {
  return (
    <UnifiedAuthGuard requiredRole="admin">
      <SchoolSettingsContent />
    </UnifiedAuthGuard>
  )
}
