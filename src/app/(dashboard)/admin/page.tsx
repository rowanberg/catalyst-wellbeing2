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
  ChevronDown
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
            className="text-slate-600 font-medium text-sm"
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
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:32px_32px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-blue-50/20 to-indigo-100/30" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.1),transparent_50%)]" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.08),transparent_50%)]" />
      
      {/* Enhanced Professional Header */}
      <motion.div 
        className="relative z-10 bg-gradient-to-br from-white/90 via-blue-50/60 to-indigo-50/70 backdrop-blur-xl border-b border-blue-200/40 shadow-xl overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-400/15 to-transparent rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 lg:py-8">
            
            {/* Enhanced Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                <motion.div 
                  className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center ring-4 ring-white/20"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <School className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                    {schoolInfo?.name || 'Loading...'}
                  </h1>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-1">
                    <span className="text-xs sm:text-sm font-medium text-slate-600 px-2 py-1 bg-white/70 backdrop-blur-sm rounded-full border border-blue-200/50 shadow-sm">
                      Code: {schoolInfo?.school_code || 'Loading...'}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-slate-700 hidden sm:block">
                      Administration Dashboard
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link href="/admin/messaging" className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/70 hover:bg-white/90 border-blue-200/50 shadow-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="sm:inline">Messages</span>
                  </Button>
                </Link>
                
                {/* Settings Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white/70 hover:bg-white/90 border-blue-200/50 shadow-sm flex items-center gap-1">
                      <Settings className="h-4 w-4" />
                      <ChevronDown className="h-3 w-3 opacity-50" />
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
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Complete Your School Setup
                          </h3>
                          <p className="text-sm text-gray-700 mb-2">
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
                className="text-center p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200/40 shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  {schoolStats?.totalStudents || 0}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-600">Students</div>
              </motion.div>

              <motion.div 
                className="text-center p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-200/40 shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1">
                  {schoolStats?.totalTeachers || 0}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-600">Teachers</div>
              </motion.div>

              <motion.div 
                className="text-center p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-200/40 shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-1">
                  {schoolStats?.totalParents || 0}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-600">Parents</div>
              </motion.div>

              <motion.div 
                className="text-center p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200/40 shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-1">
                  {schoolStats?.activeToday || 0}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-600">Active Today</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          
          {/* Core Features Section */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Core Management</h2>
              <div className="text-sm text-slate-500 bg-white/60 px-3 py-1 rounded-full border border-slate-200/50">
                8 tools
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">  
              {/* User Management */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/users" className="block">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-blue-700 text-sm">User Management</p>
                          <p className="text-xs text-blue-600 mt-1">Manage accounts</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Settings */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/settings" className="block">
                  <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <Settings className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-sm">Settings</p>
                          <p className="text-xs text-slate-600 mt-1">Configure school</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Academic Schedule */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/schedule" className="block">
                  <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-purple-700 text-sm">Academic Schedule</p>
                          <p className="text-xs text-purple-600 mt-1">2024-25 Academic Year</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Communications */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/communications" className="block">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-blue-700 text-sm">Communications</p>
                          <p className="text-xs text-blue-600 mt-1">Secure messaging</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Announcements */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/announcements" className="block">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <Megaphone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-green-700 text-sm">Announcements</p>
                          <p className="text-xs text-green-600 mt-1">School news</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Pending Users */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/pending-users" className="block">
                  <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <HelpCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-700 text-sm">Pending Users</p>
                          <p className="text-xs text-gray-600 mt-1">Approvals needed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Help Requests */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/help-requests" className="block">
                  <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 relative">
                          <AlertTriangle className="h-5 w-5 text-white" />
                          {schoolStats.helpRequests > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{schoolStats.helpRequests}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-red-700 text-sm">Help Requests</p>
                          <p className="text-xs text-red-600 mt-1">Support needed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Analytics */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/analytics" className="block">
                  <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-purple-700 text-sm">Analytics</p>
                          <p className="text-xs text-purple-600 mt-1">Data insights</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
            <div className="flex items-center justify-between mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Advanced Features</h2>
                <p className="text-sm text-slate-600 mt-1">Specialized tools and analytics</p>
              </div>
              <div className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
                10 tools
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              
              {/* Progress Tracking */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/progress" className="block">
                  <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-teal-700 text-sm">Progress Tracking</p>
                          <p className="text-xs text-teal-600 mt-1">Student analytics</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Well-being Analytics */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/wellbeing-analytics" className="block">
                  <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full group">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <Heart className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-700 text-sm">Well-being Analytics</p>
                          <p className="text-xs text-emerald-600 mt-1">Mental health data</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Attendance */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/attendance" className="block">
                  <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                        <div className="p-2 sm:p-3 bg-orange-500 rounded-xl shadow-md">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-orange-700 text-xs sm:text-sm">Attendance</p>
                          <p className="text-xs text-orange-600 mt-1">Track presence</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* SEL Programs */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/sel-programs" className="block">
                  <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                        <div className="p-2 sm:p-3 bg-indigo-500 rounded-xl shadow-md">
                          <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-indigo-700 text-xs sm:text-sm">SEL Programs</p>
                          <p className="text-xs text-indigo-600 mt-1">Social emotional</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* School Goals */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/school-goals" className="block">
                  <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                        <div className="p-2 sm:p-3 bg-purple-500 rounded-xl shadow-md">
                          <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-purple-700 text-xs sm:text-sm">School Goals</p>
                          <p className="text-xs text-purple-600 mt-1">Objectives</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Academic Upgrade */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/academic-upgrade" className="block">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                        <div className="p-2 sm:p-3 bg-indigo-500 rounded-xl shadow-md">
                          <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-indigo-700 text-xs sm:text-sm">Academic Upgrade</p>
                          <p className="text-xs text-indigo-600 mt-1">Enhance learning</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Activity Monitor */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/activity-monitor" className="block">
                  <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                        <div className="p-2 sm:p-3 bg-yellow-500 rounded-xl shadow-md">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-yellow-700 text-xs sm:text-sm">Activity Monitor</p>
                          <p className="text-xs text-yellow-600 mt-1">Real-time tracking</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Polls & Surveys */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/polls-surveys" className="block">
                  <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                        <div className="p-2 sm:p-3 bg-cyan-500 rounded-xl shadow-md">
                          <Vote className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-cyan-700 text-xs sm:text-sm">Polls & Surveys</p>
                          <p className="text-xs text-cyan-600 mt-1">Feedback tools</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* AI Assistant */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/ai-assistant" className="block">
                  <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                        <div className="p-2 sm:p-3 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl shadow-md">
                          <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-purple-700 text-xs sm:text-sm">AI Assistant</p>
                          <p className="text-xs text-purple-600 mt-1">Smart insights</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Parent Engagement */}
              <motion.div whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}>
                <Link href="/admin/parent-engagement" className="block">
                  <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                        <div className="p-2 sm:p-3 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl shadow-md">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-violet-700 text-xs sm:text-sm">Parent Engagement</p>
                          <p className="text-xs text-violet-600 mt-1">Family connect</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                        <h3 className="font-semibold text-red-800 text-sm sm:text-base">Attention Required</h3>
                        <p className="text-red-700 text-xs sm:text-sm mt-1">
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
