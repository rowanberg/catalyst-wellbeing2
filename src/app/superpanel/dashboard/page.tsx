'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  School, Users, DollarSign, AlertTriangle, TrendingUp, 
  Search, Filter, SortAsc, Eye, Settings, Bell, LogOut,
  Moon, Sun, BarChart3, PieChart, Activity, Shield,
  Calendar, MapPin, CreditCard, UserCheck, AlertCircle, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
// Import components that exist
import { SchoolCard } from '@/components/superpanel/SchoolCard'

interface School {
  id: string
  name: string
  city: string
  country: string
  logo_url?: string
  plan_type: 'free' | 'basic' | 'premium'
  current_users: number
  user_limit: number
  payment_status: 'active' | 'overdue' | 'suspended' | 'cancelled'
  payment_due_date?: string
  last_payment_date?: string
  monthly_fee: number
  created_at: string
  last_activity: string
  is_active: boolean
}

interface DashboardStats {
  total_schools: number
  active_schools_today: number
  total_users: number
  monthly_revenue: number
  overdue_payments: number
  user_limit_warnings: number
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [schools, setSchools] = useState<School[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const { addToast } = useToast()

  useEffect(() => {
    fetchDashboardData()
    fetchNotifications()
    
    // Set up real-time updates
    const interval = setInterval(() => {
      fetchDashboardData()
      fetchNotifications()
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setError(null)
      const response = await fetch('/api/superpanel/dashboard')
      if (response.ok) {
        const data = await response.json()
        setSchools(data.schools || [])
        setStats(data.stats || null)
        console.log('Dashboard data loaded:', { schools: data.schools?.length, stats: data.stats })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch data')
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      setError(error.message || 'Failed to load dashboard data')
      // Toast error handling - simplified for now
      console.error('Dashboard error:', error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/superpanel/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const filteredAndSortedSchools = schools
    .filter(school => {
      const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           school.city.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterPlan === 'all' || school.plan_type === filterPlan
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'users':
          return b.current_users - a.current_users
        case 'activity':
          return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
        case 'payment':
          return a.payment_status.localeCompare(b.payment_status)
        default:
          return 0
      }
    })

  const handleLogout = () => {
    document.cookie = 'super_admin_key=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    window.location.href = '/superpanel/auth'
  }

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center ${
        darkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-gray-50 to-purple-50'
      }`}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full mx-auto mb-4"
          />
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Loading Super Admin Dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center ${
        darkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-gray-50 to-purple-50'
      }`}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Dashboard Error
          </h2>
          <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            {error}
          </p>
          <Button
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchDashboardData()
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-gray-50 to-purple-50'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${
        darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-base sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Super Admin Panel
                </h1>
                <p className={`text-xs sm:text-sm hidden sm:block ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Catalyst Wells Platform Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-4">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`relative p-2 ${darkMode ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </div>

              {/* Dark mode toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 ${darkMode ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className={`p-2 ${darkMode ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-8">
        {/* Alert Banners - Simplified */}
        <AnimatePresence>
          {notifications.slice(0, 3).map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-3 sm:p-4 mb-3 sm:mb-4 rounded-xl border ${
                darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-sm sm:text-base truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {notification.title}
                    </h4>
                    <p className={`text-xs sm:text-sm line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Stats Overview - Simplified */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
            {/* Total Schools */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                darkMode ? 'bg-slate-800/40 backdrop-blur-xl border border-slate-700/50' : 'bg-white/80 backdrop-blur-xl border border-gray-200/50'
              } shadow-xl hover:shadow-2xl hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-100/50'}`}>
                  <School className={`w-4 h-4 sm:w-6 sm:h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div className="hidden sm:flex text-xs font-medium px-2 py-1 rounded-lg bg-green-500/10 text-green-400">
                  +12%
                </div>
              </div>
              <div className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats.total_schools.toLocaleString()}
              </div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Total Schools
              </p>
            </motion.div>

            {/* Active Today */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-3 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                darkMode ? 'bg-slate-800/40 backdrop-blur-xl border border-slate-700/50' : 'bg-white/80 backdrop-blur-xl border border-gray-200/50'
              } shadow-xl hover:shadow-2xl hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-100/50'}`}>
                  <Activity className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div className="hidden sm:flex text-xs font-medium px-2 py-1 rounded-lg bg-green-500/10 text-green-400">
                  +8%
                </div>
              </div>
              <div className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats.active_schools_today.toLocaleString()}
              </div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Active Today
              </p>
            </motion.div>

            {/* Total Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-3 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                darkMode ? 'bg-slate-800/40 backdrop-blur-xl border border-slate-700/50' : 'bg-white/80 backdrop-blur-xl border border-gray-200/50'
              } shadow-xl hover:shadow-2xl hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-100/50'}`}>
                  <Users className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div className="hidden sm:flex text-xs font-medium px-2 py-1 rounded-lg bg-green-500/10 text-green-400">
                  +15%
                </div>
              </div>
              <div className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats.total_users.toLocaleString()}
              </div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Total Users
              </p>
            </motion.div>

            {/* Monthly Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`p-3 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                darkMode ? 'bg-slate-800/40 backdrop-blur-xl border border-slate-700/50' : 'bg-white/80 backdrop-blur-xl border border-gray-200/50'
              } shadow-xl hover:shadow-2xl hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-gray-100/50'}`}>
                  <DollarSign className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div className="hidden sm:flex text-xs font-medium px-2 py-1 rounded-lg bg-green-500/10 text-green-400">
                  +23%
                </div>
              </div>
              <div className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ₹{stats.monthly_revenue.toLocaleString()}
              </div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Monthly Revenue
              </p>
            </motion.div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          {/* Search Bar */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${
              darkMode ? 'text-slate-400' : 'text-gray-400'
            }`} />
            <Input
              placeholder="Search schools by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 sm:pl-12 text-sm sm:text-base ${
                darkMode 
                  ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
              }`}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className={`flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border ${
                darkMode 
                  ? 'bg-slate-800/50 border-slate-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border ${
                darkMode 
                  ? 'bg-slate-800/50 border-slate-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="newest">Newest First</option>
              <option value="users">Most Users</option>
              <option value="activity">Most Active</option>
              <option value="payment">Payment Status</option>
            </select>
          </div>
        </div>

        {/* Schools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <AnimatePresence>
            {filteredAndSortedSchools.map((school, index) => (
              <SchoolCard
                key={school.id}
                school={school}
                index={index}
                darkMode={darkMode}
                onViewDetails={() => setSelectedSchool(school)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredAndSortedSchools.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-12 px-4 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}
          >
            <School className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">No schools found</h3>
            <p className="text-sm sm:text-base">Try adjusting your search or filter criteria.</p>
            {schools.length === 0 && (
              <div className="mt-4">
                <Button
                  onClick={fetchDashboardData}
                  variant="outline"
                  className={`${darkMode ? 'border-slate-600 text-slate-300' : 'border-gray-300 text-gray-600'}`}
                >
                  Refresh Data
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>

        {/* School Details Modal - with Full Details button */}
      {selectedSchool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-2xl ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            } border shadow-2xl`}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedSchool.name}
                </h2>
                <Button
                  onClick={() => setSelectedSchool(null)}
                  variant="ghost"
                  size="sm"
                  className={darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Location</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedSchool.city}, {selectedSchool.country}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Plan</p>
                    <Badge className={`capitalize ${
                      selectedSchool.plan_type === 'premium' ? 'bg-purple-500' :
                      selectedSchool.plan_type === 'basic' ? 'bg-blue-500' : 'bg-gray-500'
                    } text-white`}>
                      {selectedSchool.plan_type}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Users</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedSchool.current_users} / {selectedSchool.user_limit}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Status</p>
                    <Badge className={`capitalize ${
                      selectedSchool.payment_status === 'active' ? 'bg-green-500' :
                      selectedSchool.payment_status === 'overdue' ? 'bg-red-500' : 'bg-orange-500'
                    } text-white`}>
                      {selectedSchool.payment_status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'} mb-2`}>Registration Date</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(selectedSchool.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Full Details Button */}
                <div className="pt-4 border-t border-slate-700/50">
                  <Button
                    onClick={() => {
                      setSelectedSchool(null)
                      router.push(`/superpanel/schools/${selectedSchool.id}`)
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Details
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
