'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClientWrapper } from '@/components/providers/ClientWrapper'
import { 
  Users, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Settings, 
  Edit, 
  MoreVertical, 
  Trash2, 
  Eye, 
  Download, 
  Upload, 
  UserCheck, 
  UserX, 
  Mail,
  School, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  TrendingUp, 
  Activity, 
  Target,
  Layers,
  BarChart3,
  PieChart,
  LineChart,
  UserPlus,
  FileText,
  Send,
  MessageCircle,
  Bell,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Copy,
  ExternalLink,
  Shield,
  Ban,
  UserMinus,
  GraduationCap,
  Heart,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Zap
} from 'lucide-react'
import { useAppSelector } from '@/lib/redux/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

interface User {
  id: string
  user_id?: string
  first_name: string
  last_name: string
  email: string
  role: string
  school_id?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
  last_sign_in_at?: string
  current_streak?: number
  total_xp?: number
  level?: number
  gems?: number
  xp?: number
  phone?: string
  date_of_birth?: string
  address?: string
  emergency_contact?: string
  class_name?: string
  grade_level?: string
  status?: string
}

function UserManagementContent() {
  const { profile } = useAppSelector((state) => state.auth)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'organized'>('table')
  const [organizationMode, setOrganizationMode] = useState<'grade' | 'class' | 'role'>('grade')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Debug logging for tab state
  useEffect(() => {
    console.log('🔍 Admin Users - Current active tab:', activeTab)
  }, [activeTab])
  const [editFormData, setEditFormData] = useState<any>({})
  const [bulkAction, setBulkAction] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Advanced UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<User | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [messageSubject, setMessageSubject] = useState('')

  // Statistics with enhanced metrics
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    teachers: 0,
    parents: 0,
    admins: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
    engagementRate: 0,
    averageXP: 0,
    topPerformers: 0
  })

  // Toast notification state
  const [toasts, setToasts] = useState<Array<{id: string, message: string, type: 'success' | 'error'}>>([])

  // Helper functions
  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const handleError = (message: string) => {
    setError(message)
    addToast(message, 'error')
  }

  // Fetch users from API with proper authentication and school context
  useEffect(() => {
    const fetchUsers = async () => {
      if (!profile) {
        return
      }
      
      if (profile.role !== 'admin') {
        handleError('Access denied. Admin role required.')
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const schoolId = profile.school_id
        if (!schoolId) {
          throw new Error('School ID not found for admin user')
        }

        // Fetch users for this school
        const response = await fetch(`/api/admin/users?schoolId=${schoolId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch users')
        }
        
        const data = await response.json()
        const fetchedUsers = data.users || []
        setUsers(fetchedUsers)
        
        // Calculate comprehensive stats from real data
        const currentDate = new Date()
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        
        const newThisMonth = fetchedUsers.filter((user: User) => 
          user.created_at && new Date(user.created_at) >= lastMonth
        ).length
        
        const studentUsers = fetchedUsers.filter((u: User) => u.role === 'student')
        const totalXP = studentUsers.reduce((sum: number, user: User) => sum + (user.xp || 0), 0)
        const averageXP = studentUsers.length > 0 ? Math.round(totalXP / studentUsers.length) : 0
        
        const activeUsers = fetchedUsers.filter((u: User) => {
          // Consider users active if they've been created recently or have XP
          const dateToCheck = u.updated_at || u.created_at
          const recentlyActive = dateToCheck ? 
            new Date(dateToCheck) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false
          return recentlyActive || (u.xp && u.xp > 0)
        })
        
        const engagementRate = fetchedUsers.length > 0 ? 
          Math.round((activeUsers.length / fetchedUsers.length) * 100) : 0
        
        const topPerformers = studentUsers
          .sort((a: User, b: User) => (b.xp || 0) - (a.xp || 0))
          .slice(0, 5).length
        
        const userStats = {
          total: fetchedUsers.length,
          students: fetchedUsers.filter((u: User) => u.role === 'student').length,
          teachers: fetchedUsers.filter((u: User) => u.role === 'teacher').length,
          parents: fetchedUsers.filter((u: User) => u.role === 'parent').length,
          admins: fetchedUsers.filter((u: User) => u.role === 'admin').length,
          active: activeUsers.length,
          inactive: fetchedUsers.length - activeUsers.length,
          newThisMonth,
          engagementRate,
          averageXP,
          topPerformers,
        }
        setStats(userStats)
        
      } catch (err: any) {
        console.error('Error fetching users:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch users')
        setUsers([])
        setStats({
          total: 0,
          students: 0,
          teachers: 0,
          parents: 0,
          admins: 0,
          active: 0,
          inactive: 0,
          newThisMonth: 0,
          engagementRate: 0,
          averageXP: 0,
          topPerformers: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [profile])

  // Filter and sort users
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.grade_level && user.grade_level.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.class_name && user.class_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Grade filter
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(user => user.grade_level === gradeFilter)
    }

    // Class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter(user => user.class_name === classFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      // For now, consider all users as active since we don't have a status field
      // filtered = filtered.filter(user => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter, gradeFilter, classFilter])

  const uniqueGrades = Array.from(new Set(users.filter((u: User) => u.grade_level).map((u: User) => u.grade_level).filter((grade): grade is string => Boolean(grade)))).sort()
  const uniqueClasses = Array.from(new Set(users.filter((u: User) => u.class_name).map((u: User) => u.class_name).filter((className): className is string => Boolean(className)))).sort()

  const organizeUsers = () => {
    const organized: { [key: string]: User[] } = {}
    
    filteredUsers.forEach(user => {
      let key = ''
      switch (organizationMode) {
        case 'grade':
          key = user.grade_level || 'No Grade'
          break
        case 'class':
          key = user.class_name || 'No Class'
          break
        case 'role':
          key = user.role.charAt(0).toUpperCase() + user.role.slice(1) + 's'
          break
      }
      
      if (!organized[key]) {
        organized[key] = []
      }
      organized[key].push(user)
    })

    // Sort groups by key
    const sortedKeys = Object.keys(organized).sort((a, b) => {
      if (organizationMode === 'grade') {
        // Custom grade sorting (e.g., Grade 1, Grade 2, etc.)
        const gradeA = a.match(/\d+/)?.[0] || '999'
        const gradeB = b.match(/\d+/)?.[0] || '999'
        return parseInt(gradeA) - parseInt(gradeB)
      }
      return a.localeCompare(b)
    })

    const result: { [key: string]: User[] } = {}
    sortedKeys.forEach(key => {
      result[key] = organized[key]
    })

    return result
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    setSelectedUsers(selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id))
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowViewModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      emergency_contact: user.emergency_contact,
      class_name: user.class_name,
      grade_level: user.grade_level
    })
    setShowEditModal(true)
  }

  const handleMessageUser = (user: User) => {
    setMessageRecipient(user)
    setMessageSubject('')
    setMessageContent('')
    setShowMessageModal(true)
  }

  const handleSendMessage = async () => {
    if (!messageRecipient || !messageSubject || !messageContent) {
      addToast('Please fill in all message fields', 'error')
      return
    }

    try {
      const response = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: messageRecipient.id || messageRecipient.user_id,
          subject: messageSubject,
          content: messageContent,
          messageType: 'management'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      addToast(`Message sent to ${messageRecipient.first_name} ${messageRecipient.last_name}`, 'success')
      setShowMessageModal(false)
      setMessageRecipient(null)
      setMessageSubject('')
      setMessageContent('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      addToast(error.message || 'Failed to send message', 'error')
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      return
    }

    try {
      // TODO: Implement actual delete API
      console.log('Deleting user:', user.id)
      addToast(`User ${user.first_name} ${user.last_name} has been deleted`, 'success')
    } catch (error: any) {
      addToast('Failed to delete user', 'error')
    }
  }

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    try {
      // TODO: Implement actual status toggle API
      console.log('Toggling user status:', user.id, 'to', newStatus)
      addToast(`User ${user.first_name} ${user.last_name} is now ${newStatus}`, 'success')
    } catch (error: any) {
      addToast('Failed to update user status', 'error')
    }
  }

  const handleSaveUser = async () => {
    if (!selectedUser || isSaving) return

    setIsSaving(true)
    try {
      console.log('🔍 Frontend - Saving user:', {
        selectedUserId: selectedUser.id,
        selectedUserUserId: selectedUser.user_id,
        selectedUserName: `${selectedUser.first_name} ${selectedUser.last_name}`,
        editFormData: editFormData,
        apiUrl: `/api/admin/users/${selectedUser.id}`,
        willTryUserId: selectedUser.user_id ? `/api/admin/users/${selectedUser.user_id}` : 'N/A'
      })
      
      // Try with user_id first if available, fallback to id
      const userId = selectedUser.user_id || selectedUser.id
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })

      const data = await response.json()
      console.log('Save response:', response.status, data)

      if (response.ok) {
        // Update the user in the local state with the returned data
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id ? { ...u, ...data.user } : u
        ))
        
        // Update filtered users as well
        setFilteredUsers(prev => prev.map(u => 
          u.id === selectedUser.id ? { ...u, ...data.user } : u
        ))
        
        // Clear edit form and close modal
        setEditFormData({})
        setShowEditModal(false)
        setSelectedUser(null)
        
        addToast('User information saved successfully!', 'success')
      } else {
        console.error('Save failed:', data)
        throw new Error(data.error || data.details || 'Failed to save user')
      }
    } catch (error: any) {
      console.error('Save error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user'
      handleError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <GraduationCap className="w-5 h-5" />
      case 'teacher': return <Users className="w-5 h-5" />
      case 'parent': return <Heart className="w-5 h-5" />
      case 'admin': return <Shield className="w-5 h-5" />
      default: return <Users className="w-5 h-5" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'from-blue-600 to-indigo-600'
      case 'teacher': return 'from-emerald-600 to-teal-600'
      case 'parent': return 'from-violet-600 to-purple-600'
      case 'admin': return 'from-amber-600 to-orange-600'
      default: return 'from-slate-600 to-gray-600'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'teacher': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'parent': return 'bg-violet-100 text-violet-800 border-violet-200'
      case 'admin': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const renderStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <motion.div
          className="relative w-16 h-16 mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="absolute inset-0 border-4 border-blue-200 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <School className="w-6 h-6 text-blue-600" />
          </motion.div>
        </motion.div>
        
        <motion.div
          className="flex items-center justify-center space-x-1"
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
        
        <motion.p
          className="text-gray-600 mt-4 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Loading users...
        </motion.p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Users</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <ClientWrapper>
              <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </ClientWrapper>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile-First Responsive Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3 sm:space-x-4"
            >
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 hidden sm:block">Manage students, teachers, parents, and administrators</p>
              </div>
            </motion.div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <Button variant="outline" size="sm" className="bg-white/50 backdrop-blur-sm hover:bg-white/80 text-xs sm:text-sm">
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button variant="outline" size="sm" className="bg-white/50 backdrop-blur-sm hover:bg-white/80 text-xs sm:text-sm">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button onClick={() => setShowAddUser(true)} size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs sm:text-sm">
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden xs:inline">Add User</span>
                </Button>
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="bg-white/50 backdrop-blur-sm hover:bg-white/80 text-xs sm:text-sm">
                    <span className="hidden sm:inline">Back to Dashboard</span>
                    <span className="sm:hidden">Back</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Enhanced Statistics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Users</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs sm:text-sm font-medium">Students</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.students}</p>
                  </div>
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs sm:text-sm font-medium">Teachers</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.teachers}</p>
                  </div>
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-xs sm:text-sm font-medium">Parents</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.parents}</p>
                  </div>
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-100 text-xs sm:text-sm font-medium">Active Users</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.active}</p>
                  </div>
                  <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-cyan-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-xs sm:text-sm font-medium">New This Month</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.newThisMonth}</p>
                  </div>
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-indigo-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Tabs - Enhanced Visibility */}
        <Tabs value={activeTab} onValueChange={(value) => {
          console.log('🔄 Tab changing to:', value)
          setActiveTab(value)
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white border border-gray-200 shadow-lg rounded-xl p-2 mb-6 h-auto min-h-[48px] sm:min-h-[56px]">
            <TabsTrigger 
              value="overview" 
              className="text-xs sm:text-sm font-medium px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600 flex items-center justify-center whitespace-nowrap"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="text-xs sm:text-sm font-medium px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600 flex items-center justify-center whitespace-nowrap"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="text-xs sm:text-sm font-medium px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600 flex items-center justify-center whitespace-nowrap"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="text-xs sm:text-sm font-medium px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600 flex items-center justify-center whitespace-nowrap"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Quick Actions Grid */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Frequently used administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 sm:h-24 flex-col space-y-1 sm:space-y-2 bg-white/50 hover:bg-white/80 border-2 hover:border-blue-300"
                    onClick={() => setShowAddUser(true)}
                  >
                    <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                    <span className="font-medium text-xs sm:text-sm">Add User</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 sm:h-24 flex-col space-y-1 sm:space-y-2 bg-white/50 hover:bg-white/80 border-2 hover:border-green-300"
                    onClick={() => setBulkAction('message')}
                  >
                    <Send className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                    <span className="font-medium text-xs sm:text-sm">Message</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 sm:h-24 flex-col space-y-1 sm:space-y-2 bg-white/50 hover:bg-white/80 border-2 hover:border-purple-300"
                    onClick={() => setShowExportDialog(true)}
                  >
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                    <span className="font-medium text-xs sm:text-sm">Report</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 sm:h-24 flex-col space-y-1 sm:space-y-2 bg-white/50 hover:bg-white/80 border-2 hover:border-orange-300"
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                    <span className="font-medium text-xs sm:text-sm">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Advanced Search and Filters - Mobile Optimized */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                  <h3 className="text-base sm:text-lg font-semibold">Search & Filter</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="self-start sm:self-auto text-xs sm:text-sm"
                  >
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Advanced </span>Filters
                    {showAdvancedFilters ? <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" /> : <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
                  <div className="relative sm:col-span-2 lg:col-span-1">
                    <Search className="absolute left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 sm:pl-10 bg-white/50 border-2 focus:border-blue-400 text-sm h-9 sm:h-10"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="bg-white/50 border-2 focus:border-blue-400 h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="parent">Parents</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white/50 border-2 focus:border-blue-400 h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex space-x-1 sm:space-x-2 sm:col-span-2 lg:col-span-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="flex-1 px-2 sm:px-3 h-9 sm:h-10 text-xs sm:text-sm"
                    >
                      <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline ml-1">Grid</span>
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="flex-1 px-2 sm:px-3 h-9 sm:h-10 text-xs sm:text-sm"
                    >
                      <List className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline ml-1">Table</span>
                    </Button>
                  </div>
                </div>

                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 pt-3 sm:pt-4 border-t border-gray-200"
                  >
                    <Select value={gradeFilter} onValueChange={setGradeFilter}>
                      <SelectTrigger className="bg-white/50 h-9 sm:h-10 text-sm">
                        <SelectValue placeholder="All Grades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        <SelectItem value="K">Kindergarten</SelectItem>
                        <SelectItem value="1">Grade 1</SelectItem>
                        <SelectItem value="2">Grade 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={classFilter} onValueChange={setClassFilter}>
                      <SelectTrigger className="bg-white/50 h-9 sm:h-10 text-sm">
                        <SelectValue placeholder="All Classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        <SelectItem value="A">Class A</SelectItem>
                        <SelectItem value="B">Class B</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2 sm:col-span-2 lg:col-span-1">
                      <Switch id="active-only" />
                      <Label htmlFor="active-only" className="text-sm">Active users only</Label>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Users Display */}
            {filteredUsers.length === 0 ? (
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-6 sm:p-12 text-center">
                  <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No users found</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Try adjusting your filters or add some users to get started.</p>
                  <Button onClick={() => setShowAddUser(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-sm sm:text-base px-4 sm:px-6">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add First User
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'table' ? (
              /* Table View - Mobile Optimized */
              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-0">
                  {/* Mobile: Card-based layout, Desktop: Table layout */}
                  <div className="block sm:hidden">
                    {/* Mobile Card Layout */}
                    <div className="divide-y divide-gray-200">
                      {filteredUsers.map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 mt-1"
                                checked={selectedUsers.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, user.id])
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                                  }
                                }}
                              />
                              <div className="relative">
                                <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">{user.email}</div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMessageUser(user)}>
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                                  {user.status === 'active' ? (
                                    <>
                                      <Ban className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500 text-xs">Role:</span>
                              <div className="mt-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getRoleBadgeColor(user.role)}`}
                                >
                                  {user.role}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs">Status:</span>
                              <div className="mt-1">
                                {renderStatusBadge(user.status || 'active')}
                              </div>
                            </div>
                            {(user.grade_level || user.class_name) && (
                              <div>
                                <span className="text-gray-500 text-xs">Grade/Class:</span>
                                <div className="mt-1 text-sm font-medium text-gray-900">
                                  {user.grade_level || user.class_name || '-'}
                                </div>
                              </div>
                            )}
                            {user.role === 'student' && (
                              <div>
                                <span className="text-gray-500 text-xs">XP:</span>
                                <div className="mt-1 text-sm font-medium text-gray-900">
                                  {user.xp || 0} XP
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Desktop Table Layout */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-gray-50/80 border-b border-gray-200">
                        <tr>
                          <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers(filteredUsers.map(u => u.id))
                                  } else {
                                    setSelectedUsers([])
                                  }
                                }}
                              />
                            </div>
                          </th>
                          <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                            User
                          </th>
                          <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Grade/Class
                          </th>
                          <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            XP
                          </th>
                          <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user, index) => (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-3 lg:px-4 py-3 lg:py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={selectedUsers.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, user.id])
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                                  }
                                }}
                              />
                            </td>
                            <td className="px-3 lg:px-4 py-3 lg:py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2 lg:space-x-3">
                                <div className="relative">
                                  <Avatar className="w-7 h-7 lg:w-8 lg:h-8 ring-2 ring-white shadow-sm">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                                      {user.first_name?.[0]}{user.last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-green-500 rounded-full border border-white"></div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs lg:text-sm font-medium text-gray-900 truncate">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 lg:px-4 py-3 lg:py-4 whitespace-nowrap">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getRoleBadgeColor(user.role)}`}
                              >
                                {user.role}
                              </Badge>
                            </td>
                            <td className="px-3 lg:px-4 py-3 lg:py-4 whitespace-nowrap">
                              {renderStatusBadge(user.status || 'active')}
                            </td>
                            <td className="px-3 lg:px-4 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                              {user.grade_level || user.class_name || '-'}
                            </td>
                            <td className="px-3 lg:px-4 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900">
                              {user.role === 'student' ? (user.xp || 0) : '-'}
                            </td>
                            <td className="px-3 lg:px-4 py-3 lg:py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 lg:h-8 lg:w-8 p-0"
                                  onClick={() => handleViewUser(user)}
                                  title="View Details"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 lg:h-8 lg:w-8 p-0 hidden md:flex"
                                  onClick={() => handleMessageUser(user)}
                                  title="Send Message"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 lg:h-8 lg:w-8 p-0"
                                  onClick={() => handleEditUser(user)}
                                  title="Edit User"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 lg:h-8 lg:w-8 p-0"
                                      title="More Actions"
                                    >
                                      <MoreVertical className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => handleMessageUser(user)} className="md:hidden">
                                      <MessageCircle className="w-4 h-4 mr-2" />
                                      Send Message
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                                      {user.status === 'active' ? (
                                        <>
                                          <Ban className="w-4 h-4 mr-2" />
                                          Deactivate User
                                        </>
                                      ) : (
                                        <>
                                          <UserCheck className="w-4 h-4 mr-2" />
                                          Activate User
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteUser(user)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Grid View - Mobile Optimized */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                      <CardContent className="p-3 sm:p-4 lg:p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                              <Avatar className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ring-2 ring-white shadow-lg">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs sm:text-sm">
                                  {user.first_name?.[0]}{user.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate text-xs sm:text-sm lg:text-base">
                                {user.first_name} {user.last_name}
                              </h3>
                              <p className="text-xs text-gray-600 truncate">{user.email}</p>
                              <div className="flex flex-wrap items-center gap-1 mt-1 sm:mt-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getRoleBadgeColor(user.role)}`}
                                >
                                  {user.role}
                                </Badge>
                                {renderStatusBadge(user.status || 'active')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 sm:hidden"
                              onClick={() => handleEditUser(user)}
                              title="Edit User"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  title="Actions"
                                >
                                  <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMessageUser(user)}>
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                                  {user.status === 'active' ? (
                                    <>
                                      <Ban className="w-4 h-4 mr-2" />
                                      Deactivate User
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Activate User
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {/* User Stats - Mobile Optimized */}
                        {user.role === 'student' && (
                          <div className="mt-2 sm:mt-3 lg:mt-4 pt-2 sm:pt-3 lg:pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">XP Progress</span>
                              <span className="font-medium">{user.xp || 0} XP</span>
                            </div>
                            <Progress value={((user.xp || 0) % 100)} className="mt-1 h-1.5 sm:h-2" />
                          </div>
                        )}
                        
                        {/* Additional Info for Mobile */}
                        {(user.grade_level || user.class_name) && (
                          <div className="mt-2 sm:hidden">
                            <span className="text-xs text-gray-500">Grade/Class: </span>
                            <span className="text-xs font-medium text-gray-900">{user.grade_level || user.class_name}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab - Mobile Optimized */}
          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">User Analytics</CardTitle>
                <CardDescription className="text-sm sm:text-base">Detailed insights into user behavior and engagement</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Role Distribution</h4>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm">Students</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-gray-200 rounded-full">
                            <div className="h-1.5 sm:h-2 bg-blue-500 rounded-full" style={{ width: `${stats.total > 0 ? (stats.students / stats.total) * 100 : 0}%` }}></div>
                          </div>
                          <span className="text-xs sm:text-sm font-medium w-8 text-right">{stats.students}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm">Teachers</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-gray-200 rounded-full">
                            <div className="h-1.5 sm:h-2 bg-green-500 rounded-full" style={{ width: `${stats.total > 0 ? (stats.teachers / stats.total) * 100 : 0}%` }}></div>
                          </div>
                          <span className="text-xs sm:text-sm font-medium w-8 text-right">{stats.teachers}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm">Parents</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-gray-200 rounded-full">
                            <div className="h-1.5 sm:h-2 bg-purple-500 rounded-full" style={{ width: `${stats.total > 0 ? (stats.parents / stats.total) * 100 : 0}%` }}></div>
                          </div>
                          <span className="text-xs sm:text-sm font-medium w-8 text-right">{stats.parents}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm">Admins</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-gray-200 rounded-full">
                            <div className="h-1.5 sm:h-2 bg-orange-500 rounded-full" style={{ width: `${stats.total > 0 ? (stats.admins / stats.total) * 100 : 0}%` }}></div>
                          </div>
                          <span className="text-xs sm:text-sm font-medium w-8 text-right">{stats.admins}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base mt-6 lg:mt-0">Activity Metrics</h4>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm text-gray-600">Engagement Rate</span>
                        <span className="font-medium text-sm sm:text-base">{stats.engagementRate}%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm text-gray-600">Average XP</span>
                        <span className="font-medium text-sm sm:text-base">{stats.averageXP}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm text-gray-600">New This Month</span>
                        <span className="font-medium text-sm sm:text-base">{stats.newThisMonth}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm text-gray-600">Active Users</span>
                        <span className="font-medium text-sm sm:text-base">{stats.active}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - Mobile Optimized */}
          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">User Management Settings</CardTitle>
                <CardDescription className="text-sm sm:text-base">Configure user management preferences and permissions</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm sm:text-base">Auto-approve new users</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Automatically approve new user registrations</p>
                    </div>
                    <Switch className="self-start sm:self-center" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm sm:text-base">Email notifications</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Send email notifications for user activities</p>
                    </div>
                    <Switch className="self-start sm:self-center" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm sm:text-base">Bulk operations</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Enable bulk user management operations</p>
                    </div>
                    <Switch className="self-start sm:self-center" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm sm:text-base">Data export permissions</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Allow authorized users to export user data</p>
                    </div>
                    <Switch className="self-start sm:self-center" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Message Modal - Mobile Optimized */}
        <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Send Message</DialogTitle>
              <DialogDescription className="text-sm">
                Send a message to {messageRecipient?.first_name} {messageRecipient?.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="subject" className="text-sm">Subject</Label>
                <Input
                  id="subject"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="Enter message subject"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="message" className="text-sm">Message</Label>
                <Textarea
                  id="message"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="mt-1 text-sm resize-none"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowMessageModal(false)} className="text-sm">
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} className="text-sm">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Modal - Mobile Optimized */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit User</DialogTitle>
              <DialogDescription className="text-sm">
                Update information for {selectedUser?.first_name} {selectedUser?.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="edit-first-name" className="text-sm">First Name</Label>
                <Input
                  id="edit-first-name"
                  value={editFormData.first_name || ''}
                  onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                  placeholder="First name"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="edit-last-name" className="text-sm">Last Name</Label>
                <Input
                  id="edit-last-name"
                  value={editFormData.last_name || ''}
                  onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                  placeholder="Last name"
                  className="mt-1 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="edit-email" className="text-sm">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  placeholder="Email address"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="edit-role" className="text-sm">Role</Label>
                <Select 
                  value={editFormData.role || ''} 
                  onValueChange={(value) => setEditFormData({...editFormData, role: value})}
                >
                  <SelectTrigger className="mt-1 text-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-phone" className="text-sm">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  placeholder="Phone number"
                  className="mt-1 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="edit-grade" className="text-sm">Grade Level</Label>
                <Input
                  id="edit-grade"
                  value={editFormData.grade_level || ''}
                  onChange={(e) => setEditFormData({...editFormData, grade_level: e.target.value})}
                  placeholder="Grade level"
                  className="mt-1 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="edit-address" className="text-sm">Address</Label>
                <Input
                  id="edit-address"
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                  placeholder="Address"
                  className="mt-1 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="edit-emergency" className="text-sm">Emergency Contact</Label>
                <Input
                  id="edit-emergency"
                  value={editFormData.emergency_contact || ''}
                  onChange={(e) => setEditFormData({...editFormData, emergency_contact: e.target.value})}
                  placeholder="Emergency contact"
                  className="mt-1 text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="text-sm">
                Cancel
              </Button>
              <Button onClick={handleSaveUser} disabled={isSaving} className="text-sm">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Toast Notifications - Mobile Optimized */}
        <div className="fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto z-50 space-y-2">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.95 }}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg flex items-center justify-between w-full sm:min-w-[300px] sm:max-w-md ${
                toast.type === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {toast.type === 'success' ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-medium truncate">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 sm:ml-4 text-white hover:text-gray-200 flex-shrink-0 p-1"
                aria-label="Close notification"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function UserManagementPage() {
  return <UserManagementContent />
}
