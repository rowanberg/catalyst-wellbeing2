'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  School
} from 'lucide-react'
import Link from 'next/link'

interface SchoolInfo {
  id: string
  name: string
  school_code: string
  address: string
  phone: string
  email: string
  principal_name: string
  created_at: string
}

interface SchoolStats {
  totalStudents: number
  totalTeachers: number
  totalParents: number
  activeToday: number
  helpRequests: number
  thriving: number
  needsSupport: number
  atRisk: number
}

export default function AdminDashboard() {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null)
  const [schoolStats, setSchoolStats] = useState<SchoolStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    activeToday: 0,
    helpRequests: 0,
    thriving: 0,
    needsSupport: 0,
    atRisk: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        setLoading(true)
        
        // Fetch school info
        const schoolResponse = await fetch('/api/admin/school')
        if (!schoolResponse.ok) {
          throw new Error('Failed to fetch school information')
        }
        const schoolData = await schoolResponse.json()
        setSchoolInfo(schoolData.school)
        
        // Fetch school statistics
        const statsResponse = await fetch('/api/admin/stats')
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch school statistics')
        }
        const statsData = await statsResponse.json()
        setSchoolStats(statsData.stats)
        
      } catch (err) {
        console.error('Error fetching school data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load school data')
      } finally {
        setLoading(false)
      }
    }

    fetchSchoolData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 font-medium">Loading school dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Dashboard</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:32px_32px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20" />
      
      {/* Compact Professional Header */}
      <motion.div 
        className="relative z-10 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-xl border-b border-blue-200/30 shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8">
            
            {/* Compact Header Section */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <School className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {schoolInfo?.name || 'Loading...'}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs sm:text-sm font-medium text-slate-600 px-2 py-1 bg-white/60 backdrop-blur-sm rounded-full border border-blue-200/50">
                      Code: {schoolInfo?.school_code || 'Loading...'}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-slate-700">
                      Administration Dashboard
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link href="/admin/messaging">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Messages
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stats Row */}
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.div 
                className="text-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-blue-200/30 shadow-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  {schoolStats?.totalStudents || 0}
                </div>
                <div className="text-xs font-medium text-slate-600">Students</div>
              </motion.div>

              <motion.div 
                className="text-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-emerald-200/30 shadow-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1">
                  {schoolStats?.totalTeachers || 0}
                </div>
                <div className="text-xs font-medium text-slate-600">Teachers</div>
              </motion.div>

              <motion.div 
                className="text-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-purple-200/30 shadow-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-1">
                  {schoolStats?.totalParents || 0}
                </div>
                <div className="text-xs font-medium text-slate-600">Parents</div>
              </motion.div>

              <motion.div 
                className="text-center p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-amber-200/30 shadow-sm"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-1">
                  {schoolStats?.activeToday || 0}
                </div>
                <div className="text-xs font-medium text-slate-600">Active Today</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-6">
          
          {/* Quick Actions Grid */}
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
              <Link href="/admin/users" className="block">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-blue-500 rounded-xl shadow-md">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-700 text-sm">User Management</p>
                        <p className="text-xs text-blue-600 mt-1">{(schoolStats?.totalStudents || 0) + (schoolStats?.totalTeachers || 0) + (schoolStats?.totalParents || 0)} total users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
              <Link href="/admin/messaging" className="block">
                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-purple-500 rounded-xl shadow-md">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700 text-sm">Help Requests</p>
                        <p className="text-xs text-purple-600 mt-1">{schoolStats?.helpRequests || 0} pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
              <Link href="/admin/analytics" className="block">
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-emerald-500 rounded-xl shadow-md">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-700 text-sm">Analytics</p>
                        <p className="text-xs text-emerald-600 mt-1">View insights</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
              <Link href="/admin/settings" className="block">
                <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-slate-500 rounded-xl shadow-md">
                        <Settings className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">Settings</p>
                        <p className="text-xs text-slate-600 mt-1">Configure school</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </motion.div>

          {/* Alert Section - Only if help requests exist */}
          <AnimatePresence>
            {schoolStats.helpRequests > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-0 shadow-md overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5" />
                  <CardContent className="p-4 sm:p-5 relative z-10">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className="p-2 bg-red-100 rounded-xl"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-800 text-sm">Attention Required</h3>
                        <p className="text-red-700 text-xs">
                          {schoolStats.helpRequests} pending help requests need review
                        </p>
                      </div>
                      <Link href="/admin/messaging">
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
