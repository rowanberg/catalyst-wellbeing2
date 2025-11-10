'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, AlertTriangle, BookOpen, Star, Search, 
  Filter, Download, Calendar, Clock, User, FileText,
  ChevronDown, ChevronRight, School, ArrowLeft,
  TrendingUp, CheckCircle, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { useAppSelector } from '@/lib/redux/hooks'

interface IncidentLog {
  id: string
  student_id: string
  teacher_id: string
  teacher_name?: string
  type: 'behavioral' | 'academic' | 'positive'
  description: string
  severity: 'low' | 'medium' | 'high'
  created_at: string
  student_name: string
  student_grade?: string
  class_name?: string
  resolution_status?: 'pending' | 'in_progress' | 'resolved'
}

export default function AdminIncidentsPage() {
  const { profile } = useAppSelector((state) => state.auth)
  const [incidents, setIncidents] = useState<IncidentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string>('all')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Memoized filtered incidents
  const filteredIncidents = useMemo(() => {
    let filtered = incidents

    // Search filter (using debounced search)
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase()
      filtered = filtered.filter(incident =>
        incident.student_name.toLowerCase().includes(search) ||
        incident.description.toLowerCase().includes(search) ||
        incident.teacher_name?.toLowerCase().includes(search) ||
        incident.class_name?.toLowerCase().includes(search)
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(incident => incident.type === filterType)
    }

    // Severity filter
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(incident => incident.severity === filterSeverity)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(incident => incident.resolution_status === filterStatus)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(incident => {
        const incidentDate = new Date(incident.created_at)
        const daysDiff = Math.floor((now.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (dateFilter) {
          case 'today':
            return daysDiff === 0
          case 'week':
            return daysDiff <= 7
          case 'month':
            return daysDiff <= 30
          case '3months':
            return daysDiff <= 90
          default:
            return true
        }
      })
    }

    return filtered
  }, [debouncedSearch, filterType, filterSeverity, filterStatus, dateFilter, incidents])

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/incidents', {
        next: { revalidate: 60 } // Cache for 60 seconds
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch incidents')
      }
      
      const data = await response.json()
      setIncidents(data.incidents || [])
    } catch (error) {
      toast.error('Failed to load incidents')
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch incidents on mount
  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  // Statistics
  const stats = useMemo(() => ({
    total: incidents.length,
    behavioral: incidents.filter(i => i.type === 'behavioral').length,
    academic: incidents.filter(i => i.type === 'academic').length,
    positive: incidents.filter(i => i.type === 'positive').length,
    high: incidents.filter(i => i.severity === 'high').length,
    pending: incidents.filter(i => i.resolution_status === 'pending').length,
  }), [incidents])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'behavioral': return 'from-red-500 to-red-600'
      case 'academic': return 'from-blue-500 to-blue-600'
      case 'positive': return 'from-green-500 to-green-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'behavioral': return AlertTriangle
      case 'academic': return BookOpen
      case 'positive': return Star
      default: return FileText
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700 border-red-200">High Priority</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Medium</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Low</Badge>
      default:
        return null
    }
  }

  const exportToCSV = useCallback(() => {
    const headers = ['Date', 'Student', 'Class', 'Teacher', 'Type', 'Severity', 'Description', 'Status']
    const rows = filteredIncidents.map(inc => [
      new Date(inc.created_at).toLocaleString(),
      inc.student_name,
      inc.class_name || '',
      inc.teacher_name || '',
      inc.type,
      inc.severity,
      inc.description,
      inc.resolution_status || 'pending'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `incidents_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Incidents exported to CSV')
  }, [filteredIncidents])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border-0 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="sm:size-default">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white">
                    <Shield className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  Incident Data
                </h1>
                <p className="text-sm sm:text-base text-slate-600">All school incidents across all teachers</p>
              </div>
            </div>

            <Button 
              onClick={exportToCSV}
              variant="outline"
              className="w-full sm:w-auto"
              disabled={filteredIncidents.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mt-6">
            {[
              { title: 'Total', count: stats.total, icon: FileText, color: 'from-slate-500 to-slate-600', bgColor: 'bg-slate-50' },
              { title: 'Behavioral', count: stats.behavioral, icon: AlertTriangle, color: 'from-red-500 to-red-600', bgColor: 'bg-red-50' },
              { title: 'Academic', count: stats.academic, icon: BookOpen, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
              { title: 'Positive', count: stats.positive, icon: Star, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50' },
              { title: 'High Priority', count: stats.high, icon: TrendingUp, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50' },
              { title: 'Pending', count: stats.pending, icon: Clock, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50' },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${stat.bgColor} rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-100`}
                >
                  <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${stat.color} text-white mb-2`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-1">{stat.title}</h3>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-800">{stat.count}</div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-0 p-4 sm:p-6">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by student, teacher, class, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setFilterType('all')
                  setFilterSeverity('all')
                  setFilterStatus('all')
                  setDateFilter('all')
                }}
                className="text-xs sm:text-sm"
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {/* Incidents List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-0 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">All Incidents</h3>
            <Badge variant="outline" className="text-slate-600">
              {filteredIncidents.length} {filteredIncidents.length === 1 ? 'record' : 'records'}
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-slate-200 rounded w-1/3 animate-pulse" />
                      <div className="flex gap-2">
                        <div className="h-6 bg-slate-200 rounded w-20 animate-pulse" />
                        <div className="h-6 bg-slate-200 rounded w-16 animate-pulse" />
                      </div>
                      <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
                      <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No incidents found</h3>
              <p className="text-slate-500">
                {searchTerm || filterType !== 'all' || filterSeverity !== 'all' || filterStatus !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No incidents have been logged yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredIncidents.map((incident, index) => {
                  const TypeIcon = getTypeIcon(incident.type)
                  const isExpanded = expandedIncident === incident.id

                  return (
                    <div
                      key={incident.id}
                      className="border border-gray-200 rounded-lg sm:rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div
                        className="p-3 sm:p-4 cursor-pointer"
                        onClick={() => setExpandedIncident(isExpanded ? null : incident.id)}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${getTypeColor(incident.type)} text-white flex-shrink-0`}>
                            <TypeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-2 mb-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-sm sm:text-base text-slate-800">{incident.student_name}</h4>
                                <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {new Date(incident.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                {getSeverityBadge(incident.severity)}
                                <Badge variant="outline" className="capitalize text-xs">
                                  {incident.type}
                                </Badge>
                                {incident.class_name && (
                                  <Badge variant="outline" className="text-xs">
                                    <School className="h-3 w-3 mr-1" />
                                    {incident.class_name}
                                  </Badge>
                                )}
                                {incident.teacher_name && (
                                  <Badge variant="outline" className="text-xs">
                                    <User className="h-3 w-3 mr-1" />
                                    {incident.teacher_name}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <p className="text-slate-600 text-xs sm:text-sm line-clamp-2">{incident.description}</p>
                          </div>

                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-200 p-4 bg-gray-50"
                          >
                            <div className="space-y-3">
                              <div>
                                <h5 className="text-sm font-semibold text-slate-700 mb-2">Full Description</h5>
                                <p className="text-slate-600 text-sm">{incident.description}</p>
                              </div>

                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-slate-400" />
                                  <span className="text-slate-600">
                                    {new Date(incident.created_at).toLocaleString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      hour: 'numeric', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                                {incident.teacher_name && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-600">Reported by {incident.teacher_name}</span>
                                  </div>
                                )}
                                {incident.class_name && (
                                  <div className="flex items-center gap-2">
                                    <School className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-600">{incident.class_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
