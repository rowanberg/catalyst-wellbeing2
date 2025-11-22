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
  Calendar,
  CreditCard,
  Sparkles,
  CheckCircle2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
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

  // Subscription + billing data from schools table
  subscription_plan?: string | null
  subscription_status?: string | null
  plan_type?: string | null
  user_limit?: number | null
  current_users?: number | null
  student_count?: number | null
  payment_status?: string | null
  payment_due_date?: string | null
  last_payment_date?: string | null
  monthly_fee?: number | null
  student_limit?: number | null
  trial_end_date?: string | null
  subscription_start_date?: string | null
  subscription_end_date?: string | null
  next_billing_date?: string | null
  razorpay_subscription_id?: string | null
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
    restrict_email_domains: boolean
    allowed_email_domain: string
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
  const router = useRouter()

  const formatDate = (value?: string | null) => {
    if (!value) return 'Not set'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return 'Not set'
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  useEffect(() => {
    if (profile) {
      fetchSettings()
    }
  }, [profile])

  const fetchSettings = async () => {
    if (!profile) return

    try {
      setLoading(true)
      console.log('Fetching school settings for schoolId:', profile.school_id)
      
      const response = await fetch('/api/admin/school-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: profile.school_id }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('School settings API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.message || `Failed to fetch school settings (${response.status})`)
      }

      const data = await response.json()
      console.log('School settings fetched successfully')
      
      // Auto-populate email domain if not set
      if (data && !data.privacy_settings?.allowed_email_domain && data.email) {
        const emailParts = data.email.split('@')
        if (emailParts.length === 2) {
          data.privacy_settings = {
            ...data.privacy_settings,
            allowed_email_domain: emailParts[1]
          }
        }
      }
      
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
        {/* Subscription Plan Display */}
        <Card className="mb-6 sm:mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6 bg-white/50 backdrop-blur-sm">
            <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
              <CreditCard className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
              <span className="truncate">Current Subscription Plan</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 mt-2">
              Your school's active subscription tier and features
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <div className="space-y-4">
              {/* Plan Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-lg border-2 border-blue-100">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`px-4 py-2 rounded-lg font-bold text-base sm:text-lg ${
                      settings.plan_type === 'premium' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                      settings.plan_type === 'basic' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
                      'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                    }`}>
                      {settings.subscription_plan || '📦 Free Plan'}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      settings.subscription_status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' :
                      settings.subscription_status === 'trial' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                      settings.subscription_status === 'expired' ? 'bg-red-100 text-red-700 border border-red-300' :
                      'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}>
                      {settings.subscription_status === 'active' ? '✓ Active' :
                       settings.subscription_status === 'trial' ? '⏱ Trial' :
                       settings.subscription_status === 'expired' ? '⚠ Expired' :
                       settings.subscription_status || 'Unknown'}
                    </div>
                  </div>
                  
                  {/* Plan Description & Pricing */}
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {settings.plan_type === 'premium'
                      ? 'Full-featured premium subscription for larger deployments.'
                      : settings.plan_type === 'basic'
                      ? 'Standard subscription with core features enabled.'
                      : 'Basic features with limited access.'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    {typeof settings.monthly_fee === 'number'
                      ? `₹${settings.monthly_fee.toFixed(2)}/month`
                      : '₹0.00/month'}
                  </p>

                  {/* Subscription metadata from schools table */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Student limit</span>
                      <span className="font-medium">
                        {settings.student_limit ?? 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">User limit</span>
                      <span className="font-medium">
                        {settings.user_limit ?? settings.student_limit ?? 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Current users</span>
                      <span className="font-medium">
                        {settings.current_users ?? 'Not tracked'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total students</span>
                      <span className="font-medium">
                        {settings.student_count ?? 'Not tracked'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Billing status</span>
                      <span className="font-medium capitalize">
                        {settings.payment_status || 'active'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Subscription period</span>
                      <span className="font-medium text-right">
                        {formatDate(settings.subscription_start_date)}
                        {' '}–{' '}
                        {formatDate(settings.subscription_end_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Next billing</span>
                      <span className="font-medium">
                        {formatDate(settings.next_billing_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last payment</span>
                      <span className="font-medium">
                        {formatDate(settings.last_payment_date)}
                      </span>
                    </div>
                    {settings.trial_end_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Trial ends</span>
                        <span className="font-medium">
                          {formatDate(settings.trial_end_date)}
                        </span>
                      </div>
                    )}
                    {settings.razorpay_subscription_id && (
                      <div className="flex items-center justify-between col-span-1 sm:col-span-2">
                        <span className="text-gray-600">Razorpay Subscription ID</span>
                        <span className="font-mono text-[11px] sm:text-xs truncate max-w-[180px] sm:max-w-xs text-gray-800">
                          {settings.razorpay_subscription_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/billing')}
                    className="bg-white hover:bg-gray-50 border-blue-300 text-blue-600 hover:text-blue-700 whitespace-nowrap"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Plan
                  </Button>
                </div>
              </div>

              {/* Plan Features */}
              {settings.subscription_plan && settings.subscription_plan !== 'free' && (
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                    What's Included
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {settings.subscription_plan === 'catalyst_ai_extreme' ? (
                      <>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>Luminex AI Extreme</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span><strong>UNLIMITED</strong> AI Credits</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>All Dashboards & Core Modules</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>All Premium Resources</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>Real-Time Van Tracking</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>Priority Hardware Access</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>Premium API & SIS Integration</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>24/7 Priority Support</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>Dedicated Account Manager</span>
                        </div>
                      </>
                    ) : settings.subscription_plan === 'catalyst_ai_pro' ? (
                      <>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Luminex AI Pro Plus</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>150 AI Credits/Student/Day</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>All Dashboards</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Core Modules (Gamification, Reports)</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>On-Demand Branded Report Cards</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Expanded AI Tools</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Enterprise-Grade Security</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>Standard Support</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Luminex Pro</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>70 AI Credits/Student/Day</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>All Dashboards</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Core Modules (Gamification, Reports)</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>On-Demand Branded Report Cards</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Metered AI Tools</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Enterprise-Grade Security</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>Standard Support</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="restrict-email-domains" className="text-sm font-medium cursor-pointer text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-amber-600" />
                        Restrict Email Domains
                      </Label>
                      <p className="text-sm text-amber-700 mt-1">Only allow registration with your school's email domain</p>
                    </div>
                    <Switch
                      id="restrict-email-domains"
                      checked={settings.privacy_settings.restrict_email_domains}
                      onCheckedChange={(checked: boolean) => 
                        updateSettings('privacy_settings.restrict_email_domains', checked)
                      }
                      className="flex-shrink-0 scale-110"
                    />
                  </div>
                  
                  {/* Domain Configuration */}
                  <div className="space-y-3">
                    <Label htmlFor="allowed-domain" className="text-sm font-medium text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-amber-600" />
                      Allowed Email Domain
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 font-mono">@</span>
                      <Input
                        id="allowed-domain"
                        value={settings.privacy_settings.allowed_email_domain || (settings.email ? settings.email.split('@')[1] : '')}
                        onChange={(e) => updateSettings('privacy_settings.allowed_email_domain', e.target.value)}
                        className="flex-1 h-10 text-sm border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder={settings.email ? settings.email.split('@')[1] : 'yourschool.edu'}
                        disabled={!settings.privacy_settings.restrict_email_domains}
                      />
                    </div>
                    <div className="flex items-start gap-2 text-xs text-amber-700">
                      <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">
                          Registration will be restricted to: @{
                            settings.privacy_settings.allowed_email_domain || 
                            (settings.email ? settings.email.split('@')[1] : 'yourschool.edu')
                          }
                        </p>
                        <p className="mt-1">
                          {settings.email ? (
                            <>Based on your school's primary email: <span className="font-mono font-medium">{settings.email}</span></>
                          ) : (
                            'Users with other email domains will not be able to register.'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
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
