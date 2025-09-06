'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { handleError } from '@/lib/utils/errorHandling'
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Bell,
  ClipboardList,
  Award,
  Activity,
  AlertTriangle,
  PlusCircle,
  BarChart3,
  FileText,
  AlertCircle
} from 'lucide-react'

function TeacherDashboardContent() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, profile, isLoading } = useAppSelector((state) => state.auth)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
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
  }, [dispatch, user, profile, addToast])

  if (!mounted || isLoading) {
    return <PageLoader text="Loading teacher dashboard..." />
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
              onClick={() => window.location.reload()} 
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Teacher Dashboard</h1>
                <p className="text-sm text-slate-600">Welcome, {profile.first_name}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </button>
              <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <MessageSquare className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Students</p>
                <p className="text-2xl font-bold text-slate-900">28</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active This Week</p>
                <p className="text-2xl font-bold text-slate-900">24</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Help Requests</p>
                <p className="text-2xl font-bold text-slate-900">3</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Well-being</p>
                <p className="text-2xl font-bold text-slate-900">82%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Help Requests */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                  Student Help Requests
                </h2>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">3 pending</span>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-slate-900">Sarah M.</h3>
                    <span className="text-xs text-slate-600">10 min ago</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">"I'm feeling overwhelmed with the math assignment. Could use some help."</p>
                  <div className="flex space-x-2">
                    <button className="py-1 px-3 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors">
                      Respond
                    </button>
                    <button className="py-1 px-3 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 transition-colors">
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Class Overview */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
                Class Well-being Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="text-2xl font-bold text-green-600 mb-1">18</div>
                  <div className="text-sm text-slate-600">Thriving</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">7</div>
                  <div className="text-sm text-slate-600">Needs Support</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="text-2xl font-bold text-red-600 mb-1">3</div>
                  <div className="text-sm text-slate-600">At Risk</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition-colors">
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-900">Create Activity</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition-colors">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-900">Send Message</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition-colors">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-slate-900">Generate Report</span>
                </button>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 text-indigo-600 mr-2" />
                Today's Schedule
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-900">Morning Circle</p>
                  <p className="text-xs text-slate-600">9:00 AM - 9:30 AM</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-slate-900">Well-being Check-in</p>
                  <p className="text-xs text-slate-600">2:00 PM - 2:30 PM</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-medium text-slate-900">Parent Meeting</p>
                  <p className="text-xs text-slate-600">4:00 PM - 4:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function TeacherDashboard() {
  return (
    <AuthGuard requiredRole="teacher">
      <TeacherDashboardContent />
    </AuthGuard>
  )
}
