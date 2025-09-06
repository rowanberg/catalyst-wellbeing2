'use client'

import { useState, useEffect } from 'react'
import { useAppSelector } from '@/lib/redux/hooks'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageLoader } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { handleError } from '@/lib/utils/errorHandling'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  GraduationCap, 
  BookOpen, 
  Heart,
  Shield,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Award,
  TrendingUp,
  Clock,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Settings,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  SortAsc,
  SortDesc,
  Grid,
  List,
  RefreshCw
} from 'lucide-react'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'student' | 'teacher' | 'parent' | 'admin'
  created_at: string
  updated_at: string
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
}

function UserManagementContent() {
  const { profile } = useAppSelector((state) => state.auth)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const { addToast } = useToast()

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    teachers: 0,
    parents: 0,
    admins: 0,
    active: 0,
    inactive: 0
  })

  useEffect(() => {
    if (profile?.school_id) {
      fetchUsers()
    }
  }, [profile])

  useEffect(() => {
    filterAndSortUsers()
  }, [users, searchTerm, roleFilter, statusFilter, sortBy, sortOrder])

  useEffect(() => {
    calculateStats()
  }, [users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users?schoolId=${profile?.school_id}`)
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users || [])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      const appError = handleError(error, 'fetch users')
      addToast({
        type: 'error',
        title: 'Failed to Load Users',
        description: appError.message
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const total = users.length
    const students = users.filter(u => u.role === 'student').length
    const teachers = users.filter(u => u.role === 'teacher').length
    const parents = users.filter(u => u.role === 'parent').length
    const admins = users.filter(u => u.role === 'admin').length
    const active = users.filter(u => u.last_sign_in_at && 
      new Date(u.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
    const inactive = total - active

    setStats({ total, students, teachers, parents, admins, active, inactive })
  }

  const filterAndSortUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.last_sign_in_at && new Date(user.last_sign_in_at) > thirtyDaysAgo)
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => !user.last_sign_in_at || new Date(user.last_sign_in_at) <= thirtyDaysAgo)
      }
    }

    // Sort users
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase()
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase()
          break
        case 'email':
          aValue = a.email?.toLowerCase() || ''
          bValue = b.email?.toLowerCase() || ''
          break
        case 'role':
          aValue = a.role
          bValue = b.role
          break
        case 'created':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'lastActive':
          aValue = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0
          bValue = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0
          break
        default:
          aValue = a.first_name
          bValue = b.first_name
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredUsers(filtered)
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

  const getStatusBadge = (user: User) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const isActive = user.last_sign_in_at && new Date(user.last_sign_in_at) > thirtyDaysAgo
    
    return isActive ? (
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
    return <PageLoader text="Loading users..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">User Management</h1>
                <p className="text-slate-600">Comprehensive user administration and analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => fetchUsers()}
                className="border-slate-300 hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => setShowAddUser(true)}
                className="bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white shadow-lg"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Students</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.students}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Teachers</p>
                  <p className="text-2xl font-bold text-emerald-700">{stats.teachers}</p>
                </div>
                <BookOpen className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-violet-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-600">Parents</p>
                  <p className="text-2xl font-bold text-violet-700">{stats.parents}</p>
                </div>
                <Heart className="w-8 h-8 text-violet-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-amber-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">Admins</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.admins}</p>
                </div>
                <Shield className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active</p>
                  <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-red-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Inactive</p>
                  <p className="text-2xl font-bold text-red-700">{stats.inactive}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Controls */}
        <Card className="bg-white border-slate-200 shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="lg:col-span-2">
                <Label className="text-slate-700 mb-2 block font-medium">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-slate-700 mb-2 block font-medium">Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="border-slate-300 focus:border-slate-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="teacher">Teachers</SelectItem>
                    <SelectItem value="parent">Parents</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-slate-700 mb-2 block font-medium">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-slate-300 focus:border-slate-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-slate-700 mb-2 block font-medium">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border-slate-300 focus:border-slate-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="role">Role</SelectItem>
                    <SelectItem value="created">Created Date</SelectItem>
                    <SelectItem value="lastActive">Last Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort(sortBy)}
                  className="border-slate-300 hover:bg-slate-50"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 mr-1" /> : <SortDesc className="w-4 h-4 mr-1" />}
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
                
                <div className="flex items-center gap-1 border border-slate-300 rounded-md p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                
                {selectedUsers.length > 0 && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-800">
                    {selectedUsers.length} selected
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete Selected
                    </Button>
                    <Button variant="outline" size="sm" className="border-slate-300 hover:bg-slate-50">
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                )}
                
                <Button variant="outline" size="sm" className="border-slate-300 hover:bg-slate-50">
                  <Upload className="w-4 h-4 mr-1" />
                  Import
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user, index) => (
              <Card key={user.id} className="bg-white border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                      />
                      <div className={`w-12 h-12 bg-gradient-to-r ${getRoleColor(user.role)} rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}>
                        {getRoleIcon(user.role)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(user)}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {user.first_name} {user.last_name}
                    </h3>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </div>
                  
                  {user.email && (
                    <div className="flex items-center gap-2 text-slate-600 text-sm mb-2">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-slate-600 text-sm mb-4">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </div>

                  {user.role === 'student' && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <div className="text-amber-600 font-bold text-lg">{user.gems || 0}</div>
                        <div className="text-xs text-amber-600">Gems</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <div className="text-blue-600 font-bold text-lg">{user.level || 1}</div>
                        <div className="text-xs text-blue-600">Level</div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                        <div className="text-emerald-600 font-bold text-lg">{user.xp || 0}</div>
                        <div className="text-xs text-emerald-600">XP</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1 border-slate-300 hover:bg-slate-50">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 border-slate-300 hover:bg-slate-50">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left p-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={selectAllUsers}
                          className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                        />
                      </th>
                      <th className="text-left p-4 font-semibold text-slate-900">User</th>
                      <th className="text-left p-4 font-semibold text-slate-900">Role</th>
                      <th className="text-left p-4 font-semibold text-slate-900">Status</th>
                      <th className="text-left p-4 font-semibold text-slate-900">Joined</th>
                      <th className="text-left p-4 font-semibold text-slate-900">Last Active</th>
                      <th className="text-left p-4 font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(user.role)} rounded-lg flex items-center justify-center text-white`}>
                              {getRoleIcon(user.role)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-slate-600">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(user)}
                        </td>
                        <td className="p-4 text-slate-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-slate-600">
                          {user.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredUsers.length === 0 && (
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Users Found</h3>
              <p className="text-slate-600">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function UserManagement() {
  return (
    <AuthGuard requiredRole="admin">
      <UserManagementContent />
    </AuthGuard>
  )
}
