import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, School, Users, Trophy, TrendingUp, Activity,
  Calendar, Clock, Mail, Phone, MapPin, Globe, Shield,
  Star, Award, Target, BookOpen, Heart, Zap, Download,
  Filter, Search, ChevronDown, Eye, MoreVertical, X, AlertTriangle,
  CreditCard, DollarSign, CheckCircle, AlertCircle, TrendingDown,
  Settings, UserPlus, UserMinus, Pause, Play, Lock, Unlock,
  Database, Wallet, Hash, UserCheck, AlertOctagon, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SchoolDetailsView({ schoolData, darkMode, setDarkMode }: any) {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'analytics' | 'payment' | 'controls'>('overview')
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [controlsLoading, setControlsLoading] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<any>(null)
  const [newUser, setNewUser] = useState({ email: '', firstName: '', lastName: '', role: 'student', password: '' })

  const filteredUsers = schoolData?.allUsers.filter((user: any) => {
    const matchesFilter = userFilter === 'all' || user.role === userFilter
    const matchesSearch = user.name.toLowerCase().includes(userSearch.toLowerCase())
    return matchesFilter && matchesSearch
  }) || []

  const exportCSV = () => {
    const csv = [
      ['Name', 'Role', 'Email', 'XP', 'Level'].join(','),
      ...filteredUsers.map((u: any) => 
        [u.name, u.role, u.email, u.xp, u.level].join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${schoolData.school.name}_users.csv`
    a.click()
  }

  const handleSchoolControl = async (action: string, data?: any) => {
    setControlsLoading(true)
    try {
      const response = await fetch(`/api/superpanel/schools/${schoolData.school.id}/controls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({ action, data })
      })

      if (response.ok) {
        const result = await response.json()
        // Refresh page data
        window.location.reload()
        return result
      } else {
        throw new Error('Control action failed')
      }
    } catch (error) {
      console.error('Control error:', error)
      alert('Failed to perform action')
    } finally {
      setControlsLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.firstName || !newUser.lastName || !newUser.password) {
      alert('Please fill all fields')
      return
    }
    await handleSchoolControl('add_user', newUser)
    setShowAddUserModal(false)
    setNewUser({ email: '', firstName: '', lastName: '', role: 'student', password: '' })
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      await handleSchoolControl('delete_user', { userId })
      setShowDeleteConfirm(null)
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-gray-50 to-purple-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white/50 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Button onClick={() => router.push('/superpanel/dashboard')} variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className={`text-base sm:text-2xl font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {schoolData.school.name}
                </h1>
                <p className={`text-xs sm:text-sm truncate ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  {schoolData.school.city} • {schoolData.school.totalUsers} users
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
              <Badge className={`${schoolData.school.payment_status === 'active' ? 'bg-green-500' : 'bg-red-500'} text-white text-xs capitalize`}>
                {schoolData.school.payment_status}
              </Badge>
              <Badge className={`${schoolData.school.plan_type === 'premium' ? 'bg-purple-500' : schoolData.school.plan_type === 'basic' ? 'bg-blue-500' : 'bg-gray-500'} text-white text-xs capitalize`}>
                {schoolData.school.plan_type}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'} overflow-x-auto`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex gap-3 sm:gap-6 min-w-max">
            {(['overview', 'users', 'analytics', 'payment', 'controls'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-2 sm:py-3 px-1 border-b-2 capitalize text-sm sm:text-base whitespace-nowrap ${
                  selectedTab === tab
                    ? `${darkMode ? 'border-purple-500 text-white' : 'border-purple-600 text-gray-900'}`
                    : `border-transparent ${darkMode ? 'text-slate-400' : 'text-gray-600'}`
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <AnimatePresence mode="wait">
          {/* Overview */}
          {selectedTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 sm:space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {schoolData.school.userStats.map((stat: any) => (
                  <Card key={stat.role} className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                    <CardHeader className="pb-2 p-3 sm:p-4">
                      <CardTitle className={`text-xs sm:text-sm capitalize ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        {stat.role}s
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <p className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stat.count}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                        {stat.activeToday} active today
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Top Students */}
              <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Top Performing Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {schoolData.topStudents.map((student: any, i: number) => (
                      <div key={student.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                            i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : darkMode ? 'bg-slate-700' : 'bg-gray-200'
                          } text-white`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm sm:text-base truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {student.first_name} {student.last_name}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                              Level {student.level}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                            {student.xp.toLocaleString()} XP
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                            {student.gems} 💎
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* School Info */}
              <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={darkMode ? 'text-white' : 'text-gray-900'}>School Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>{schoolData.school.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>{schoolData.school.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>{schoolData.school.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>
                      Teacher:Student Ratio - {schoolData.school.teacherStudentRatio}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Users */}
          {selectedTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className={`pl-10 ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white'}`}
                  />
                </div>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white'}`}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="parent">Parents</option>
                  <option value="admin">Admins</option>
                </select>
                <Button onClick={exportCSV} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                      <tr>
                        <th className={`text-left p-4 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>User</th>
                        <th className={`text-left p-4 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Role</th>
                        <th className={`text-left p-4 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Email</th>
                        <th className={`text-center p-4 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>XP</th>
                        <th className={`text-center p-4 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.slice(0, 20).map((user: any) => (
                        <tr key={user.id} className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200'}`}>
                                {user.name.charAt(0)}
                              </div>
                              <span className={darkMode ? 'text-white' : 'text-gray-900'}>{user.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={`capitalize ${
                              user.role === 'student' ? 'bg-blue-500' :
                              user.role === 'teacher' ? 'bg-green-500' :
                              user.role === 'parent' ? 'bg-purple-500' : 'bg-orange-500'
                            } text-white`}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className={`p-4 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{user.email}</td>
                          <td className={`p-4 text-center ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{user.xp}</td>
                          <td className={`p-4 text-center ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{user.level}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Analytics */}
          {selectedTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Zap className="w-5 h-5 text-purple-500" />
                      Total XP
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {schoolData.analytics.totalXP.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Star className="w-5 h-5 text-yellow-500" />
                      Total Gems
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {schoolData.analytics.totalGems.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Activity className="w-5 h-5 text-green-500" />
                      Active Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {schoolData.analytics.activeUsersToday}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={darkMode ? 'text-white' : 'text-gray-900'}>Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {schoolData.recentActivities.map((activity: any, i: number) => (
                      <div key={i} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activity.message}</p>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Payment Tab */}
          {selectedTab === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Subscription Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <CreditCard className="w-5 h-5 text-purple-500" />
                      Current Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Badge className={`text-lg px-3 py-1 ${
                        schoolData.school.plan_type === 'premium' ? 'bg-purple-500' :
                        schoolData.school.plan_type === 'basic' ? 'bg-blue-500' : 'bg-gray-500'
                      } text-white`}>
                        {schoolData.payments?.subscriptionPlan?.display_name || schoolData.school.plan_type?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>User Limit</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                          {schoolData.school.current_users} / {schoolData.school.user_limit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Monthly Fee</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                          ₹{schoolData.school.monthly_fee?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Payment Status</span>
                        <Badge className={`${
                          schoolData.school.payment_status === 'active' ? 'bg-green-500' :
                          schoolData.school.payment_status === 'overdue' ? 'bg-red-500' :
                          schoolData.school.payment_status === 'suspended' ? 'bg-orange-500' :
                          'bg-gray-500'
                        } text-white`}>
                          {schoolData.school.payment_status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <DollarSign className="w-5 h-5 text-green-500" />
                      Payment Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Total Revenue</span>
                      <span className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        ₹{schoolData.payments?.analytics?.totalRevenue?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Pending Amount</span>
                      <span className={`text-lg font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        ₹{schoolData.payments?.analytics?.pendingAmount?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Average Payment</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        ₹{schoolData.payments?.analytics?.averagePayment?.toFixed(2) || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Total Transactions</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {schoolData.payments?.analytics?.paymentHistory || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Dates */}
              <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Next Payment Due</p>
                      <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {schoolData.school.payment_due_date 
                          ? new Date(schoolData.school.payment_due_date).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })
                          : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Last Payment</p>
                      <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {schoolData.school.last_payment_date 
                          ? new Date(schoolData.school.last_payment_date).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })
                          : 'No payments yet'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Account Created</p>
                      <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(schoolData.school.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Clock className="w-5 h-5 text-indigo-500" />
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {schoolData.payments?.transactions && schoolData.payments.transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                          <tr>
                            <th className={`text-left p-3 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Date</th>
                            <th className={`text-left p-3 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Transaction ID</th>
                            <th className={`text-left p-3 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Amount</th>
                            <th className={`text-left p-3 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Method</th>
                            <th className={`text-left p-3 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schoolData.payments.transactions.slice(0, 10).map((transaction: any) => (
                            <tr key={transaction.id} className={`border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                              <td className={`p-3 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </td>
                              <td className={`p-3 ${darkMode ? 'text-slate-300' : 'text-gray-700'} font-mono text-sm`}>
                                {transaction.transaction_id}
                              </td>
                              <td className={`p-3 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                ₹{transaction.amount.toLocaleString()}
                              </td>
                              <td className={`p-3 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                {transaction.payment_method || 'Online'}
                              </td>
                              <td className="p-3">
                                <Badge className={`${
                                  transaction.status === 'completed' ? 'bg-green-500' :
                                  transaction.status === 'pending' ? 'bg-yellow-500' :
                                  transaction.status === 'failed' ? 'bg-red-500' :
                                  'bg-gray-500'
                                } text-white`}>
                                  {transaction.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className={`text-center py-8 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      No payment transactions yet
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Plan Features */}
              {schoolData.payments?.subscriptionPlan && (
                <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Shield className="w-5 h-5 text-purple-500" />
                      Plan Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {schoolData.payments.subscriptionPlan.features?.features?.map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Controls Tab */}
          {selectedTab === 'controls' && (
            <motion.div key="controls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* School Status Control */}
              <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={`flex items-center justify-between ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-purple-500" />
                      School Status Control
                    </div>
                    <Badge className={schoolData.controls?.schoolSettings?.is_active ? 'bg-green-500' : 'bg-red-500'}>
                      {schoolData.controls?.schoolSettings?.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {schoolData.controls?.schoolSettings?.is_active ? (
                      <Button
                        onClick={() => handleSchoolControl('pause_school', { reason: 'Manual suspension' })}
                        disabled={controlsLoading}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause School
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSchoolControl('activate_school', { reason: 'Manual activation' })}
                        disabled={controlsLoading}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Activate School
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        const newPlan = prompt('Enter new plan type (free/basic/premium):')
                        if (newPlan && ['free', 'basic', 'premium'].includes(newPlan)) {
                          handleSchoolControl('update_plan', { planType: newPlan })
                        }
                      }}
                      disabled={controlsLoading}
                      variant="outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Change Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* User Limits */}
              <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <UserCheck className="w-5 h-5 text-purple-500" />
                    User Limits Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Current Usage</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Total Users:</span>
                          <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                            {schoolData.controls?.userLimits?.current?.total || 0} / {schoolData.controls?.userLimits?.maximum?.total || 100}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Students:</span>
                          <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                            {schoolData.controls?.userLimits?.current?.students || 0} / {schoolData.controls?.userLimits?.maximum?.students || 70}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Teachers:</span>
                          <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                            {schoolData.controls?.userLimits?.current?.teachers || 0} / {schoolData.controls?.userLimits?.maximum?.teachers || 10}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>Parents:</span>
                          <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                            {schoolData.controls?.userLimits?.current?.parents || 0} / {schoolData.controls?.userLimits?.maximum?.parents || 20}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Set New Limits</h4>
                      <Button
                        onClick={() => {
                          const total = prompt('Enter new total user limit:', schoolData.controls?.userLimits?.maximum?.total?.toString())
                          if (total && !isNaN(Number(total))) {
                            const students = Math.floor(Number(total) * 0.7)
                            const teachers = Math.floor(Number(total) * 0.1)
                            const parents = Math.floor(Number(total) * 0.2)
                            handleSchoolControl('set_user_limits', { total: Number(total), students, teachers, parents })
                          }
                        }}
                        disabled={controlsLoading}
                        className="w-full"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Update User Limits
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Analytics */}
              <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Wallet className="w-5 h-5 text-purple-500" />
                    Wells Wallet & Fluxon Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Students with Wallets</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {schoolData.controls?.walletAnalytics?.totalStudentsWithWallets || 0}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Total Mind Gems</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        {schoolData.controls?.walletAnalytics?.totalMindGems?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Total Fluxon</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {schoolData.controls?.walletAnalytics?.totalFluxon?.toFixed(2) || 0}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Active Wallets</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                        {schoolData.controls?.walletAnalytics?.activeWallets || 0}
                      </p>
                    </div>
                  </div>

                  {/* Student Tags Table */}
                  <div>
                    <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Student Tags & Balances</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={darkMode ? 'border-b border-slate-700' : 'border-b border-gray-200'}>
                            <th className={`text-left py-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Student</th>
                            <th className={`text-left py-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Tag</th>
                            <th className={`text-left py-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Mind Gems</th>
                            <th className={`text-left py-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Fluxon</th>
                            <th className={`text-left py-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>Wallet</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schoolData.controls?.studentsWithTags?.slice(0, 10).map((student: any) => (
                            <tr key={student.id} className={darkMode ? 'border-b border-slate-700' : 'border-b border-gray-100'}>
                              <td className={`py-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{student.name}</td>
                              <td className={`py-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                <Badge variant="outline">
                                  <Hash className="w-3 h-3 mr-1" />
                                  {student.student_tag}
                                </Badge>
                              </td>
                              <td className={`py-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{student.mind_gems}</td>
                              <td className={`py-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{student.fluxon}</td>
                              <td className={`py-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'} text-xs`}>
                                {student.wallet_address ? student.wallet_address.slice(0, 10) + '...' : 'No wallet'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Management */}
              <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={`flex items-center justify-between ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      User Management
                    </div>
                    <Button
                      onClick={() => setShowAddUserModal(true)}
                      disabled={controlsLoading}
                      size="sm"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Input
                      placeholder="Search users to manage..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className={darkMode ? 'bg-slate-700 text-white' : ''}
                    />
                    <div className="max-h-64 overflow-y-auto">
                      {filteredUsers.slice(0, 10).map((user: any) => (
                        <div
                          key={user.id}
                          className={`flex items-center justify-between p-2 rounded ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}
                        >
                          <div>
                            <p className={darkMode ? 'text-white' : 'text-gray-900'}>{user.name}</p>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                              {user.role} • {user.email}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSchoolControl('reset_password', { userId: user.id })}
                              disabled={controlsLoading}
                              size="sm"
                              variant="outline"
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => setShowDeleteConfirm(user)}
                              disabled={controlsLoading}
                              size="sm"
                              variant="outline"
                              className="text-red-500 hover:text-red-600"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dashboard Access Control */}
              <Card className={darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Shield className="w-5 h-5 text-purple-500" />
                    Dashboard Access Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Student Dashboard</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>View Grades</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>Access Wallet</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>Join Classes</span>
                        </label>
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Teacher Dashboard</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>Manage Classes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>Grade Students</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>Send Messages</span>
                        </label>
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Parent Dashboard</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>View Child Progress</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>Message Teachers</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className={darkMode ? 'text-slate-300' : 'text-gray-700'}>View Reports</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-4" disabled={controlsLoading}>
                    <Shield className="w-4 h-4 mr-2" />
                    Save Access Settings
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Add User Modal */}
          {showAddUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-full max-w-md p-4 sm:p-6 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white'} max-h-[90vh] overflow-y-auto`}
              >
                <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add New User</h3>
                <div className="space-y-3 sm:space-y-4">
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className={darkMode ? 'bg-slate-700 text-white' : ''}
                  />
                  <Input
                    placeholder="First Name"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className={darkMode ? 'bg-slate-700 text-white' : ''}
                  />
                  <Input
                    placeholder="Last Name"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className={darkMode ? 'bg-slate-700 text-white' : ''}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className={darkMode ? 'bg-slate-700 text-white' : ''}
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className={`w-full p-2 rounded ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-50'}`}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                  </select>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleAddUser} disabled={controlsLoading} className="flex-1">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                    <Button onClick={() => setShowAddUserModal(false)} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-full max-w-md p-4 sm:p-6 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white'}`}
              >
                <AlertOctagon className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
                <h3 className={`text-lg sm:text-xl font-bold mb-2 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Delete User?
                </h3>
                <p className={`text-sm sm:text-base text-center mb-3 sm:mb-4 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Are you sure you want to delete {showDeleteConfirm.name}? This action cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => handleDeleteUser(showDeleteConfirm.id)}
                    disabled={controlsLoading}
                    className="flex-1 bg-red-500 hover:bg-red-600"
                  >
                    Delete User
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
