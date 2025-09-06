'use client'

import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, AlertTriangle, MessageSquare, BarChart3, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { MessagingNavButton } from '@/components/ui/messaging-nav-button'

interface StudentOverview {
  id: string
  first_name: string
  last_name: string
  xp: number
  level: number
  gems: number
  last_active: string
}

interface ClassAnalytics {
  totalStudents: number
  averageXP: number
  activeToday: number
  helpRequests: number
}

export default function TeacherDashboard() {
  const dispatch = useAppDispatch()
  const { user, profile, isLoading } = useAppSelector((state) => state.auth)
  const [students, setStudents] = useState<StudentOverview[]>([])
  const [analytics, setAnalytics] = useState<ClassAnalytics>({
    totalStudents: 0,
    averageXP: 0,
    activeToday: 0,
    helpRequests: 0
  })

  useEffect(() => {
    if (user && !profile) {
      dispatch(fetchProfile(user.id))
    }
    if (user) {
      fetchClassData()
    }
  }, [user, profile, dispatch])

  const fetchClassData = async () => {
    if (!user || !profile) return

    // Fetch students in the same school
    const { data: studentsData, error: studentsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, xp, level, gems, updated_at')
      .eq('role', 'student')
      .eq('school_id', profile.school_id)
      .order('xp', { ascending: false })

    if (!studentsError && studentsData) {
      setStudents(studentsData.map(student => ({
        ...student,
        last_active: student.updated_at
      })))

      // Calculate analytics
      const totalStudents = studentsData.length
      const averageXP = totalStudents > 0 ? Math.round(studentsData.reduce((sum, s) => sum + s.xp, 0) / totalStudents) : 0
      const today = new Date().toDateString()
      const activeToday = studentsData.filter(s => new Date(s.updated_at).toDateString() === today).length

      setAnalytics({
        totalStudents,
        averageXP,
        activeToday,
        helpRequests: 0 // Will be fetched separately
      })
    }

    // Fetch help requests count
    const { count } = await supabase
      .from('help_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    setAnalytics(prev => ({ ...prev, helpRequests: count || 0 }))
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-3 sm:gap-0">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Teacher Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Monitor your class well-being and engagement</p>
            </div>
            <div className="flex items-center space-x-4 w-full sm:w-auto justify-center sm:justify-end">
              <MessagingNavButton userRole="teacher" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="flex items-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{analytics.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Average XP</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{analytics.averageXP}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="flex items-center">
                <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-pink-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Active Today</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{analytics.activeToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Help Requests</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{analytics.helpRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Class Roster */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Class Roster
            </CardTitle>
            <CardDescription className="text-sm">Overview of student progress and engagement</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">Student</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">Level</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">XP</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">Gems</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">Last Active</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <div className="font-medium text-sm sm:text-base">{student.first_name} {student.last_name}</div>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Level {student.level}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-sm sm:text-base">{student.xp}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-sm sm:text-base">{student.gems}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                        {new Date(student.last_active).toLocaleDateString()}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <Button size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions and Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              <CardDescription className="text-sm">Common teacher tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                <Button className="w-full justify-start text-sm sm:text-base py-2 sm:py-3" variant="outline">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  View Class Analytics
                </Button>
                <Button className="w-full justify-start text-sm sm:text-base py-2 sm:py-3" variant="outline">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Review Help Requests
                </Button>
                <Button className="w-full justify-start text-sm sm:text-base py-2 sm:py-3" variant="outline">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Send Class Message
                </Button>
                <Button className="w-full justify-start text-sm sm:text-base py-2 sm:py-3" variant="outline">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Parent Communication
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Well-being Insights</CardTitle>
              <CardDescription className="text-sm">Class mental health overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div className="p-2 sm:p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-green-800">Positive Engagement</span>
                    <span className="text-base sm:text-lg font-bold text-green-600">85%</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">Students actively participating in well-being activities</p>
                </div>
                
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-blue-800">Gratitude Entries</span>
                    <span className="text-base sm:text-lg font-bold text-blue-600">42</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">This week's gratitude journal submissions</p>
                </div>

                <div className="p-2 sm:p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-purple-800">Kindness Acts</span>
                    <span className="text-base sm:text-lg font-bold text-purple-600">127</span>
                  </div>
                  <p className="text-xs text-purple-700 mt-1">Total acts of kindness logged by class</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
