'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { handleError } from '@/lib/utils/errorHandling'
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
  RefreshCw
} from 'lucide-react'

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

function SchoolSettingsContent() {
  const { profile } = useAppSelector((state) => state.auth)
  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

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
      const appError = handleError(error, 'settings fetch')
      addToast({
        type: 'error',
        title: 'Failed to Load Settings',
        description: appError.message
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
      const appError = handleError(error, 'settings save')
      addToast({
        type: 'error',
        title: 'Failed to Save Settings',
        description: appError.message
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
            <Button onClick={fetchSettings} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">School Settings</h1>
                <p className="text-sm text-gray-600">Configure your school's platform settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={fetchSettings}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={saveSettings} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* School Information */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                <School className="h-5 w-5 mr-2" />
                School Information
              </CardTitle>
              <CardDescription className="text-gray-600">
                Basic school details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="school-name">School Name</Label>
                <Input
                  id="school-name"
                  value={settings.name}
                  onChange={(e) => updateSettings('name', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="school-code">School Code</Label>
                <Input
                  id="school-code"
                  value={settings.school_code}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSettings('address', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => updateSettings('phone', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSettings('email', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  value={settings.website || ''}
                  onChange={(e) => updateSettings('website', e.target.value)}
                  className="mt-1"
                  placeholder="https://www.yourschool.edu"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                <Bell className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-gray-600">
                Configure how and when notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Send notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.notification_settings.email_notifications}
                  onCheckedChange={(checked: boolean) => 
                    updateSettings('notification_settings.email_notifications', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <p className="text-sm text-gray-500">Send urgent alerts via SMS</p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={settings.notification_settings.sms_notifications}
                  onCheckedChange={(checked: boolean) => 
                    updateSettings('notification_settings.sms_notifications', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-gray-500">Send push notifications to mobile apps</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.notification_settings.push_notifications}
                  onCheckedChange={(checked: boolean) => 
                    updateSettings('notification_settings.push_notifications', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-reports">Weekly Reports</Label>
                  <p className="text-sm text-gray-500">Send weekly wellbeing reports</p>
                </div>
                <Switch
                  id="weekly-reports"
                  checked={settings.notification_settings.weekly_reports}
                  onCheckedChange={(checked: boolean) => 
                    updateSettings('notification_settings.weekly_reports', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="urgent-alerts">Urgent Alerts</Label>
                  <p className="text-sm text-gray-500">Immediate alerts for crisis situations</p>
                </div>
                <Switch
                  id="urgent-alerts"
                  checked={settings.notification_settings.urgent_alerts}
                  onCheckedChange={(checked: boolean) => 
                    updateSettings('notification_settings.urgent_alerts', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                <Shield className="h-5 w-5 mr-2" />
                Privacy & Security
              </CardTitle>
              <CardDescription className="text-gray-600">
                Data protection and privacy controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="data-retention">Data Retention (Days)</Label>
                <Input
                  id="data-retention"
                  type="number"
                  value={settings.privacy_settings.data_retention_days}
                  onChange={(e) => 
                    updateSettings('privacy_settings.data_retention_days', parseInt(e.target.value))
                  }
                  className="mt-1"
                  min="30"
                  max="2555"
                />
                <p className="text-sm text-gray-500 mt-1">How long to keep user data (30-2555 days)</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow-analytics">Allow Analytics</Label>
                  <p className="text-sm text-gray-500">Enable platform analytics and insights</p>
                </div>
                <Switch
                  id="allow-analytics"
                  checked={settings.privacy_settings.allow_analytics}
                  onCheckedChange={(checked: boolean) => 
                    updateSettings('privacy_settings.allow_analytics', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="share-anonymous">Share Anonymous Data</Label>
                  <p className="text-sm text-gray-500">Help improve the platform with anonymous usage data</p>
                </div>
                <Switch
                  id="share-anonymous"
                  checked={settings.privacy_settings.share_anonymous_data}
                  onCheckedChange={(checked: boolean) => 
                    updateSettings('privacy_settings.share_anonymous_data', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="parent-consent">Require Parent Consent</Label>
                  <p className="text-sm text-gray-500">Require explicit parent consent for student data</p>
                </div>
                <Switch
                  id="parent-consent"
                  checked={settings.privacy_settings.require_parent_consent}
                  onCheckedChange={(checked: boolean) => 
                    updateSettings('privacy_settings.require_parent_consent', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Wellbeing Settings */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                <Users className="h-5 w-5 mr-2" />
                Wellbeing Features
              </CardTitle>
              <CardDescription className="text-gray-600">
                Configure wellbeing and mental health features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="daily-checkins">Daily Check-ins</Label>
                  <p className="text-sm text-gray-500">Enable daily wellbeing check-ins for students</p>
                </div>
                <Switch
                  id="daily-checkins"
                  checked={settings.wellbeing_settings.daily_check_ins}
                  onCheckedChange={(checked: boolean) => 
                    updateSettings('wellbeing_settings.daily_check_ins', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="anonymous-reporting">Anonymous Reporting</Label>
                  <p className="text-sm text-gray-500">Allow anonymous incident reporting</p>
                </div>
                <Switch
                  id="anonymous-reporting"
                  checked={settings.wellbeing_settings.anonymous_reporting}
                  onCheckedChange={(checked: boolean) => 
                    updateSettings('wellbeing_settings.anonymous_reporting', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="crisis-intervention">Crisis Intervention</Label>
                  <p className="text-sm text-gray-500">Enable automatic crisis intervention protocols</p>
                </div>
                <Switch
                  id="crisis-intervention"
                  checked={settings.wellbeing_settings.crisis_intervention}
                  onCheckedChange={(checked: boolean) => 
                    updateSettings('wellbeing_settings.crisis_intervention', checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="counselor-access">Counselor Access</Label>
                  <p className="text-sm text-gray-500">Allow school counselors to access wellbeing data</p>
                </div>
                <Switch
                  id="counselor-access"
                  checked={settings.wellbeing_settings.counselor_access}
                  onCheckedChange={(checked: boolean) => 
                    updateSettings('wellbeing_settings.counselor_access', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Academic Year Settings */}
        <Card className="mt-8 bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Academic Year</CardTitle>
            <CardDescription className="text-gray-600">
              Set the academic year dates for proper data organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="academic-start">Academic Year Start</Label>
                <Input
                  id="academic-start"
                  type="date"
                  value={settings.academic_year_start}
                  onChange={(e) => updateSettings('academic_year_start', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="academic-end">Academic Year End</Label>
                <Input
                  id="academic-end"
                  type="date"
                  value={settings.academic_year_end}
                  onChange={(e) => updateSettings('academic_year_end', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => updateSettings('timezone', e.target.value)}
                  className="mt-1"
                  placeholder="America/New_York"
                />
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
    <AuthGuard requiredRole="admin">
      <SchoolSettingsContent />
    </AuthGuard>
  )
}
