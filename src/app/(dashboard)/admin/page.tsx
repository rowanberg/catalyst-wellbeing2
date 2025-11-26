'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  AlertTriangle,
  BarChart3,
  Settings,
  School,
  MessageSquare,
  Megaphone,
  TrendingUp,
  Brain,
  GraduationCap,
  Vote,
  Heart,
  Calendar,
  UserCheck,
  Target,
  Bell,
  HelpCircle,
  Activity,
  Bot,
  Clock,
  LogOut,
  User,
  ChevronDown,
  Shield,
  CreditCard
} from 'lucide-react'
import { PageLoader } from '@/components/ui/loading-spinner'
import { UnifiedAuthGuard } from '@/components/auth/unified-auth-guard'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { signOut } from '@/lib/redux/slices/authSlice'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// import { SchoolSystemReportModal, ReportType } from '@/components/admin/school-system-report-modal'
// import { TroubleshootIssueModal } from '@/components/admin/troubleshoot-issue-modal'
// import { FloatingHelpButton } from '@/components/ui/floating-help-button'
import { OfflineAPI } from '@/lib/api/offline-wrapper'

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

interface SchoolDetails {
  setup_completed: boolean
  school_name: string
  primary_email: string
  primary_phone: string
  street_address: string
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

function AdminDashboardContent() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, profile } = useAppSelector((state) => state.auth)

  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null)
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails | null>(null)
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [featureLoading, setFeatureLoading] = useState<string | null>(null)
  const [showSetupBanner, setShowSetupBanner] = useState(false)
  const [dataFetched, setDataFetched] = useState(false)

  // Logout handler
  const handleLogout = async () => {
    try {
      await dispatch(signOut()).unwrap()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  useEffect(() => {
    // Check if data is already cached in sessionStorage
    const cachedSchoolInfo = sessionStorage.getItem('admin_school_info')
    const cachedSchoolStats = sessionStorage.getItem('admin_school_stats')
    const cachedSchoolDetails = sessionStorage.getItem('admin_school_details')

    if (cachedSchoolInfo && cachedSchoolStats) {
      // Use cached data
      setSchoolInfo(JSON.parse(cachedSchoolInfo))
      setSchoolStats(JSON.parse(cachedSchoolStats))
      if (cachedSchoolDetails) {
        setSchoolDetails(JSON.parse(cachedSchoolDetails))
      }
      setDataFetched(true)
      return
    }

    const fetchSchoolData = async () => {
      try {
        setIsLoading(true)

        // Check for setup completion parameter
        const urlParams = new URLSearchParams(window.location.search)
        const setupCompleted = urlParams.get('setup') === 'completed'

        // Try OfflineAPI first for PWA support
        try {
          const adminData = await OfflineAPI.fetchAdminDashboard()
          if (adminData) {
            setSchoolInfo(adminData.school)
            setSchoolStats(adminData.stats)
            setDataFetched(true)
            setIsLoading(false)
            return
          }
        } catch (offlineError) {
          console.log('[Admin] OfflineAPI failed, using regular fetch:', offlineError)
        }

        // Fallback to regular fetch
        const schoolResponse = await fetch('/api/admin/school')
        if (!schoolResponse.ok) {
          const errorData = await schoolResponse.json().catch(() => ({ message: 'Unknown error' }))
          console.error('School API error:', schoolResponse.status, errorData)
          throw new Error(`Failed to fetch school information: ${errorData.message || schoolResponse.statusText}`)
        }
        const schoolData = await schoolResponse.json()
        setSchoolInfo(schoolData.school)

        // Fetch school details to check setup completion

        // Simple approach - let the API handle authentication via cookies
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        }

        const detailsResponse = await fetch('/api/admin/school-details', { headers })

        let detailsDataForCache = null
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json()
          detailsDataForCache = detailsData.details

          setSchoolDetails(detailsData.details)

          // Use the status field for more precise control
          const setupStatus = detailsData.status || 'not_completed'
          const urlSetupCompleted = setupCompleted


          // Show banner based on status
          if (setupStatus === 'completed') {
            // Setup is completed - hide banner
            setShowSetupBanner(false)
          } else if (urlSetupCompleted) {
            // Just completed setup (URL param) - hide banner temporarily
            setShowSetupBanner(false)
          } else {
            // Setup not completed or in progress - show banner
            setShowSetupBanner(true)
          }
        } else {
          const errorText = await detailsResponse.text()

          // If API fails, show banner unless URL says just completed
          const shouldShowBanner = !setupCompleted
          setShowSetupBanner(shouldShowBanner)
        }

        // Fetch school statistics
        const statsResponse = await fetch('/api/admin/stats')
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch school statistics')
        }
        const statsData = await statsResponse.json()
        setSchoolStats(statsData.stats)

        // Cache the data in sessionStorage (use API response, not state)
        sessionStorage.setItem('admin_school_info', JSON.stringify(schoolData.school))
        sessionStorage.setItem('admin_school_stats', JSON.stringify(statsData.stats))
        if (detailsDataForCache) {
          sessionStorage.setItem('admin_school_details', JSON.stringify(detailsDataForCache))
        }

        setDataFetched(true)

      } catch (err: any) {
        console.error('Error fetching school data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load school data')
      } finally {
        setIsLoading(false)
      }
    }

    // Only fetch if we don't have cached data
    if (!dataFetched) {
      fetchSchoolData()
    }
  }, [])

  // Only show loading if actively fetching and no cached data
  if (isLoading && !dataFetched) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="relative w-16 h-16 mx-auto mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 border-4 border-blue-200 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner spinning dots */}
            <motion.div
              className="absolute inset-2 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            {/* Center logo */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <School className="w-6 h-6 text-blue-600" />
            </motion.div>
          </motion.div>
          <motion.p
            className="text-slate-600 font-medium text-sm font-['DM_Sans']"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading school dashboard...
          </motion.p>
          <motion.div
            className="flex justify-center mt-3 space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
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
          <h2 className="text-xl font-bold text-slate-800 mb-2 font-['Plus_Jakarta_Sans'] tracking-tight">Unable to Load Dashboard</h2>
          <p className="text-slate-600 mb-4 font-['DM_Sans']">{error}</p>
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
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden font-['DM_Sans']">
      {/* Refined Enterprise Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.025)_1px,transparent_0)] bg-[length:32px_32px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />

      {/* Enterprise Header */}
      <motion.div
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}
      >
        {/* Premium top accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#8B5CF6]" />

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 lg:py-8">

            {/* Enhanced Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                <motion.div
                  className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center relative overflow-hidden group"
                  style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <School className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white relative z-10" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl lg:text-3xl font-extrabold text-gray-900 truncate" style={{ fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.025em' }}>
                    {schoolInfo?.name || 'Loading...'}
                  </h1>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-1">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 px-3 py-1.5 bg-gray-100 rounded-md font-['DM_Sans'] hover:bg-gray-200 transition-colors cursor-default">
                      {schoolInfo?.school_code || 'Loading...'}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-gray-600 hidden sm:block font-['DM_Sans']">
                      Administration Dashboard
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link href="/admin/messaging" className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 font-['DM_Sans'] font-medium transition-all">
                    <AlertTriangle className="h-4 w-4 text-gray-600" />
                    <span className="sm:inline text-gray-700">Messages</span>
                  </Button>
                </Link>

                {/* Settings Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 transition-all flex items-center gap-1">
                      <Settings className="h-4 w-4 text-gray-600" />
                      <ChevronDown className="h-3 w-3 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <div className="flex items-center px-2 py-1.5">
                        <User className="h-4 w-4 mr-2" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{profile?.first_name} {profile?.last_name}</span>
                          <span className="text-xs text-gray-500">{user?.email}</span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/settings" className="flex items-center w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* School Setup Banner */}
            <AnimatePresence>
              {showSetupBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6"
                >
                  <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-l-4 border-orange-400 rounded-lg p-4 sm:p-6 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1 font-['Plus_Jakarta_Sans'] tracking-tight">
                            Complete Your School Setup
                          </h3>
                          <p className="text-sm text-gray-700 mb-2 font-['DM_Sans'] leading-relaxed">
                            Welcome to Catalyst! To provide the best experience for your students and staff,
                            please complete your school's detailed setup including contact information,
                            operating hours, and academic details.
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <span className="flex items-center">
                              <School className="w-3 h-3 mr-1" />
                              School Information
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Operating Hours
                            </span>
                            <span className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              Contact Details
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => setShowSetupBanner(false)}
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-gray-600 border-gray-300 hover:bg-gray-50"
                        >
                          Remind Later
                        </Button>
                        <Link href="/admin/setup" className="w-full sm:w-auto">
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
                          >
                            Complete Setup
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Quick Stats Row */}
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.div
                className="relative group text-center p-5 sm:p-6 bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer"
                style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}
                whileHover={{ y: -6, boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 font-['Plus_Jakarta_Sans'] relative" style={{ letterSpacing: '-0.04em' }}>
                  {schoolStats?.totalStudents || 0}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-600 font-['DM_Sans'] uppercase" style={{ letterSpacing: '0.05em' }}>Students</div>
              </motion.div>

              <motion.div
                className="relative group text-center p-5 sm:p-6 bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer"
                style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}
                whileHover={{ y: -6, boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                  <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 font-['Plus_Jakarta_Sans'] relative" style={{ letterSpacing: '-0.04em' }}>
                  {schoolStats?.totalTeachers || 0}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-600 font-['DM_Sans'] uppercase" style={{ letterSpacing: '0.05em' }}>Teachers</div>
              </motion.div>

              <motion.div
                className="relative group text-center p-5 sm:p-6 bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer"
                style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}
                whileHover={{ y: -6, boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)' }}>
                  <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 font-['Plus_Jakarta_Sans'] relative" style={{ letterSpacing: '-0.04em' }}>
                  {schoolStats?.totalParents || 0}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-600 font-['DM_Sans'] uppercase" style={{ letterSpacing: '0.05em' }}>Parents</div>
              </motion.div>

              <motion.div
                className="relative group text-center p-5 sm:p-6 bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer"
                style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}
                whileHover={{ y: -6, boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}>
                  <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 font-['Plus_Jakarta_Sans'] relative" style={{ letterSpacing: '-0.04em' }}>
                  {schoolStats?.activeToday || 0}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-600 font-['DM_Sans'] uppercase" style={{ letterSpacing: '0.05em' }}>Active Today</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="space-y-8 sm:space-y-10 lg:space-y-12">

          {/* Core Features Section */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.025em' }}>Core Management</h2>
                <p className="text-sm text-gray-600 mt-1 font-['DM_Sans']">Essential administrative tools</p>
              </div>
              <div className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-2 rounded-lg font-['DM_Sans']" style={{ letterSpacing: '0.05em' }}>
                9 tools
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {/* User Management */}
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/admin/users" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)' }}>
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>User Management</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Manage accounts</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Settings */}
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/admin/settings" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #64748B 0%, #475569 100%)', boxShadow: '0 4px 12px rgba(100, 116, 139, 0.15)' }}>
                        <Settings className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Settings</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Configure school</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Academic Schedule */}
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/admin/schedule" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)' }}>
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Academic Schedule</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">2024-25 Academic Year</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Time Table */}
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/admin/timetable" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', boxShadow: '0 4px 12px rgba(6, 182, 212, 0.15)' }}>
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Time Table</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Class schedules</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Announcements */}
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/admin/announcements" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
                        <Megaphone className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Announcements</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">School news</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Pending Users */}
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/admin/wellbeing-severity" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', boxShadow: '0 4px 12px rgba(236, 72, 153, 0.15)' }}>
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">Wellbeing Severity</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">Monitor student wellbeing risk levels</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Help Requests */}
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/admin/help-requests" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)' }}>
                        <AlertTriangle className="h-6 w-6 text-white" />
                        {schoolStats.helpRequests > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center" style={{ boxShadow: '0 2px 8px rgba(249, 115, 22, 0.4)' }}>
                            <span className="text-[10px] font-bold text-white">{schoolStats.helpRequests}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Help Requests</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Support needed</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Incident Data */}
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/admin/incidents" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)' }}>
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Incident Data</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">View all incidents</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Fees Management */}
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/admin/fees" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Fees Management</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Payments & Invoices</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

            </div>
          </motion.div>


          {/* Advanced Features Section */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-8 p-6 bg-white rounded-2xl border border-gray-200" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.025em' }}>Advanced Features</h2>
                <p className="text-sm text-gray-600 mt-1 font-['DM_Sans']">Specialized tools and analytics</p>
              </div>
              <div className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-2 rounded-lg font-['DM_Sans']" style={{ letterSpacing: '0.05em' }}>
                10 tools
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">

              {/* Progress Tracking */}
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Link href="/admin/progress" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', boxShadow: '0 4px 12px rgba(20, 184, 166, 0.15)' }}>
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Progress Tracking</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Student analytics</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Well-being Analytics */}
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Link href="/admin/wellbeing-analytics" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Well-being Analytics</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Mental health data</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Attendance */}
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Link href="/admin/attendance" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.15)' }}>
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Attendance</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Track presence</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* SEL Programs */}
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Link href="/admin/sel-programs" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)' }}>
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>SEL Programs</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Social emotional</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* School Goals */}
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Link href="/admin/school-goals" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.15)' }}>
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>School Goals</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Objectives</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Academic Upgrade */}
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Link href="/admin/academic-upgrade" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)' }}>
                        <GraduationCap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Academic Upgrade</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Enhance learning</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Activity Monitor */}
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Link href="/admin/activity-monitor" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)', boxShadow: '0 4px 12px rgba(234, 179, 8, 0.15)' }}>
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Activity Monitor</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Real-time tracking</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Polls & Surveys */}
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Link href="/admin/polls-surveys" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', boxShadow: '0 4px 12px rgba(6, 182, 212, 0.15)' }}>
                        <Vote className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Polls & Surveys</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Feedback tools</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* AI Assistant */}
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Link href="/admin/ai-assistant" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', boxShadow: '0 4px 12px rgba(236, 72, 153, 0.15)' }}>
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>AI Assistant</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Smart insights</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Parent Engagement */}
              <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Link href="/admin/parent-engagement" className="block group">
                  <div className="h-full bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-all" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)' }}>
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm font-['Plus_Jakarta_Sans']" style={{ letterSpacing: '-0.01em' }}>Parent Engagement</p>
                        <p className="text-xs text-gray-600 mt-1 font-['DM_Sans']">Family connect</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>


            </div>
          </motion.div>

          {/* Enhanced Alert Section - Only if help requests exist */}
          <AnimatePresence>
            {schoolStats.helpRequests > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-gradient-to-r from-red-50/90 to-orange-50/90 backdrop-blur-sm border-0 shadow-lg overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10" />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                  <CardContent className="p-3 sm:p-4 lg:p-5 relative z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <motion.div
                        className="p-2 sm:p-3 bg-red-100 rounded-xl shadow-sm"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-red-800 text-sm sm:text-base font-['Plus_Jakarta_Sans'] tracking-tight">Attention Required</h3>
                        <p className="text-red-700 text-xs sm:text-sm mt-1 font-['DM_Sans']">
                          {schoolStats.helpRequests} active help requests need review
                        </p>
                      </div>
                      <Link href="/admin/help-requests" className="w-full sm:w-auto">
                        <Button size="sm" className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Review Now
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Mobile Navigation */}
          <div className="lg:hidden fixed bottom-4 right-4 z-50">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: "spring", stiffness: 200 }}
              className="flex flex-col gap-3"
            >
              {/* Scroll to top button */}
              <Button
                size="lg"
                className="rounded-full w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <School className="h-5 w-5" />
              </Button>

              {/* Quick help requests access if any exist */}
              {schoolStats.helpRequests > 0 && (
                <Link href="/admin/help-requests">
                  <Button
                    size="lg"
                    className="rounded-full w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-xl relative"
                  >
                    <AlertTriangle className="h-5 w-5" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-red-600">{schoolStats.helpRequests}</span>
                    </div>
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <UnifiedAuthGuard requiredRole="admin">
      <AdminDashboardContent />
    </UnifiedAuthGuard>
  )
}
