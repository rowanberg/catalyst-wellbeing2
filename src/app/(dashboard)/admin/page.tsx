'use client'

import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { handleError } from '@/lib/utils/errorHandling'
import { School, Users, TrendingUp, AlertTriangle, Settings, BarChart3, UserPlus, AlertCircle, Shield, UserCheck, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { MessagingNavButton } from '@/components/ui/messaging-nav-button'

interface SchoolStats {
  totalStudents: number
  totalTeachers: number
  totalParents: number
  activeToday: number
  helpRequests: number
  averageWellbeing: number
}

interface WellbeingData {
  overallWellbeing: number
  gratitudeEntries: number
  kindnessActs: number
  courageEntries: number
  averageStreak: number
  avgSleepHours: number
  avgWaterGlasses: number
}

function AdminDashboardContent() {
  const dispatch = useAppDispatch()
  const { user, profile, isLoading } = useAppSelector((state) => state.auth)
  const [schoolStats, setSchoolStats] = useState<SchoolStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    activeToday: 0,
    helpRequests: 0,
    averageWellbeing: 0
  })
  const [schoolInfo, setSchoolInfo] = useState<any>(null)
  const [wellbeingData, setWellbeingData] = useState<WellbeingData>({
    overallWellbeing: 0,
    gratitudeEntries: 0,
    kindnessActs: 0,
    courageEntries: 0,
    averageStreak: 0,
    avgSleepHours: 0,
    avgWaterGlasses: 0
  })
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    setMounted(true)
    if (user && !profile) {
      dispatch(fetchProfile(user.id))
        .unwrap()
        .catch((error) => {
          const appError = handleError(error, 'profile fetch')
          setError(appError.message)
          addToast({
            type: 'error',
            title: 'Failed to Load Profile',
            description: appError.message
          })
        })
    }
    if (user && profile) {
      fetchSchoolData()
    }
  }, [user, profile, dispatch, addToast])

  const fetchSchoolData = async () => {
    if (!profile) return

    try {
      setDataLoading(true)
      setError(null)

      // Fetch school information via API route to bypass RLS
      const schoolResponse = await fetch('/api/admin/school-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: profile.school_id }),
      })

      if (!schoolResponse.ok) {
        const errorData = await schoolResponse.json()
        throw new Error(`Failed to fetch school info: ${errorData.message}`)
      }

      const school = await schoolResponse.json()
      setSchoolInfo(school)

      // Fetch user statistics via API route
      const statsResponse = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: profile.school_id }),
      })

      if (!statsResponse.ok) {
        const errorData = await statsResponse.json()
        throw new Error(`Failed to fetch stats: ${errorData.message}`)
      }

      const stats = await statsResponse.json()
      setSchoolStats(stats)

      // Fetch wellbeing overview data
      const wellbeingResponse = await fetch('/api/admin/wellbeing-overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: profile.school_id }),
      })

      if (wellbeingResponse.ok) {
        const wellbeing = await wellbeingResponse.json()
        setWellbeingData(wellbeing)
      }
    } catch (error) {
      const appError = handleError(error, 'admin dashboard data fetch')
      setError(appError.message)
      addToast({
        type: 'error',
        title: 'Failed to Load Dashboard Data',
        description: appError.message
      })
    } finally {
      setDataLoading(false)
    }
  }

  if (!mounted || isLoading) {
    return <PageLoader text="Loading admin dashboard..." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Dashboard Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                setError(null)
                fetchSchoolData()
              }} 
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              We couldn't load your profile. Please try logging in again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/login'} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">School Administration</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">{schoolInfo?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <MessagingNavButton userRole="admin" />
              <Button 
                variant="outline" 
                className="border-gray-300 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                onClick={() => window.location.href = '/admin/settings'}
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                onClick={() => window.location.href = '/admin/analytics'}
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* School Overview Card */}
        <Card className="mb-6 sm:mb-8 bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Welcome, {profile?.first_name}</h2>
                <p className="text-gray-600 text-sm sm:text-base">{schoolInfo?.name}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{schoolInfo?.address}</p>
              </div>
              <div className="text-center sm:text-left lg:text-center">
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">School Code</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{schoolInfo?.school_code}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Contact</p>
                <p className="text-gray-900 text-sm sm:text-base">{schoolInfo?.email}</p>
                <p className="text-gray-600 text-xs sm:text-sm">{schoolInfo?.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link href="/admin/analytics" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Analytics & Reports</p>
                    <p className="text-xs text-gray-500 mt-1 hidden sm:block">View detailed insights</p>
                  </div>
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">User Management</p>
                    <p className="text-xs text-gray-500 mt-1">Manage all users</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/pending-users" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                    <p className="text-xs text-gray-500 mt-1">Review registrations</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/settings" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">School Settings</p>
                    <p className="text-xs text-gray-500 mt-1">Configure system</p>
                  </div>
                  <Settings className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-l-4 border-l-gray-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quick Actions</p>
                  <p className="text-xs text-gray-500 mt-1">Common tasks</p>
                </div>
                <Zap className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Section */}
        {schoolStats.helpRequests > 0 && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Attention Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">
                There are {schoolStats.helpRequests} pending help requests that need immediate attention.
              </p>
              <Button className="mt-3" variant="outline">
                Review Help Requests
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Management Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                User Management
              </CardTitle>
              <CardDescription>Manage teachers, students, and parents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                <Button className="w-full text-xs sm:text-sm py-2" variant="outline">
                  Add New Teacher
                </Button>
                <Button 
                  className="w-full text-xs sm:text-sm py-2" 
                  variant="outline"
                  onClick={() => window.location.href = '/admin/users'}
                >
                  View All Users
                </Button>
                <Button className="w-full text-xs sm:text-sm py-2" variant="outline">
                  Bulk Import
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics & Reports
              </CardTitle>
              <CardDescription>School-wide well-being insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full" variant="outline">
                  Well-being Report
                </Button>
                <Button className="w-full" variant="outline">
                  Engagement Analytics
                </Button>
                <Button className="w-full" variant="outline">
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                School Settings
              </CardTitle>
              <CardDescription>Configure platform settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full" variant="outline">
                  School Information
                </Button>
                <Button className="w-full" variant="outline">
                  Privacy Settings
                </Button>
                <Button className="w-full" variant="outline">
                  Notification Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Well-being Overview */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">School Well-being Overview</CardTitle>
            <CardDescription className="text-gray-600 text-sm">Real-time mental health and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{wellbeingData.overallWellbeing}%</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">Overall Well-being Score</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{wellbeingData.gratitudeEntries}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">Gratitude Entries This Week</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">{wellbeingData.kindnessActs}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">Acts of Kindness Logged</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600">{wellbeingData.averageStreak}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">Days Average Streak</div>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="text-lg sm:text-xl font-semibold text-gray-700">{wellbeingData.courageEntries}</div>
                <div className="text-xs text-gray-500">Courage Entries</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="text-lg sm:text-xl font-semibold text-gray-700">{wellbeingData.avgSleepHours}h</div>
                <div className="text-xs text-gray-500">Avg Sleep Hours</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="text-lg sm:text-xl font-semibold text-gray-700">{wellbeingData.avgWaterGlasses}</div>
                <div className="text-xs text-gray-500">Avg Water Glasses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboardContent />
    </AuthGuard>
  )
}
