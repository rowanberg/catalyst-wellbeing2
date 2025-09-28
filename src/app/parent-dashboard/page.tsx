'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { 
  Users, 
  Heart, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Bell,
  BookOpen,
  Shield,
  Activity,
  Award,
  Eye,
  Phone
} from 'lucide-react'

export default function ParentDashboard() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, profile, isLoading } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (user.role !== 'parent') {
      router.push('/login')
      return
    }

    if (!profile) {
      dispatch(fetchProfile(user.id))
    }
  }, [user, profile, router, dispatch])

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
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
              <div className="p-2 bg-emerald-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Parent Dashboard</h1>
                <p className="text-sm text-slate-600">Welcome, {profile.first_name}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
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
        {/* Children Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Children</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Emma Johnson</h3>
                  <p className="text-sm text-slate-600">Grade 8 • Room 204</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Well-being Score</span>
                  <span className="text-sm font-medium text-emerald-600">85%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{width: '85%'}}></div>
                </div>
                <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 text-blue-500 mr-2" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Emma completed gratitude journal</p>
                    <p className="text-xs text-slate-600">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Emma earned "Kindness Champion" badge</p>
                    <p className="text-xs text-slate-600">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Communication */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 text-purple-500 mr-2" />
                Messages & Updates
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-slate-900">Teacher Update</h3>
                    <span className="text-xs text-slate-600">1 day ago</span>
                  </div>
                  <p className="text-sm text-slate-700">Emma showed great leadership in today's group activity.</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-slate-900">School Announcement</h3>
                    <span className="text-xs text-slate-600">2 days ago</span>
                  </div>
                  <p className="text-sm text-slate-700">Parent-teacher conferences scheduled for next week.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">This Week</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Activities Completed</span>
                  <span className="text-sm font-medium text-slate-900">12/15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Goals Achieved</span>
                  <span className="text-sm font-medium text-slate-900">3/4</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Teacher Messages</span>
                  <span className="text-sm font-medium text-slate-900">2 new</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Parent Tools</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition-colors">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-900">View Progress Reports</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition-colors">
                  <Phone className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-900">Schedule Meeting</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-100 transition-colors">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-slate-900">Safety Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
