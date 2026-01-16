'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2,
    Search,
    Plus,
    CheckCircle,
    Clock,
    XCircle,
    ExternalLink,
    Users,
    Calendar,
    BarChart3,
    Shield,
    ChevronRight,
    Loader2,
    RefreshCw,
    AlertTriangle,
    MapPin,
    Globe
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface School {
    id: string
    name: string
    code: string
    logo_url?: string
    location: {
        city: string
        state: string
        country: string
    }
    student_count: number
    type: string
}

interface AccessRequest {
    id: string
    school_id: string
    school_name: string
    status: 'pending' | 'approved' | 'rejected'
    requested_at: string
    purpose: string
    requested_scopes: string[]
}

interface LinkedSchool {
    school_id: string
    school_name: string
    school_logo?: string
    school_code: string
    location: { city: string; state: string }
    linked_at: string
    approved_scopes: string[]
    usage: {
        api_calls_30d: number
        active_users: number
    }
}

export default function SchoolLinkingPage() {
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'linked' | 'requests' | 'discover'>('linked')
    const [applications, setApplications] = useState<any[]>([])
    const [selectedApp, setSelectedApp] = useState<string>('')
    const [linkedSchools, setLinkedSchools] = useState<LinkedSchool[]>([])
    const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
    const [allSchools, setAllSchools] = useState<School[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
    const [requestPurpose, setRequestPurpose] = useState('')
    const [requestScopes, setRequestScopes] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)

    const availableScopes = [
        { id: 'student.profile.read', label: 'Student Profiles', description: 'Read student names, grades, sections' },
        { id: 'student.attendance.read', label: 'Attendance Data', description: 'Read attendance records' },
        { id: 'student.academic.read', label: 'Academic Records', description: 'Read grades and marks' },
        { id: 'student.timetable.read', label: 'Timetable', description: 'Read class schedules' },
        { id: 'school.structure.read', label: 'School Structure', description: 'Read classes, sections, subjects' },
        { id: 'wellbeing.mood.read', label: 'Wellbeing Data', description: 'Read mood and wellness (requires consent)' }
    ]

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (selectedApp) {
            loadLinkedSchools()
            loadAccessRequests()
        }
    }, [selectedApp])

    const loadData = async () => {
        try {
            const { data: { user } } = await devSupabase.auth.getUser()
            if (!user) return

            const { data: account } = await devSupabase
                .from('developer_accounts')
                .select('id')
                .eq('auth_user_id', user.id)
                .single()

            if (!account) return

            // Get applications
            const { data: apps } = await devSupabase
                .from('developer_applications')
                .select('id, name, status')
                .eq('developer_id', account.id)
                .eq('status', 'approved')

            if (apps && apps.length > 0) {
                setApplications(apps)
                setSelectedApp(apps[0].id)
            }

            // Load sample schools for discovery
            setAllSchools([
                {
                    id: 'sch_001',
                    name: 'Springfield High School',
                    code: 'SHS',
                    location: { city: 'Springfield', state: 'IL', country: 'USA' },
                    student_count: 1250,
                    type: 'high_school'
                },
                {
                    id: 'sch_002',
                    name: 'Riverside Elementary',
                    code: 'RES',
                    location: { city: 'Portland', state: 'OR', country: 'USA' },
                    student_count: 450,
                    type: 'elementary'
                },
                {
                    id: 'sch_003',
                    name: 'Oakwood International Academy',
                    code: 'OIA',
                    location: { city: 'Austin', state: 'TX', country: 'USA' },
                    student_count: 890,
                    type: 'international'
                },
                {
                    id: 'sch_004',
                    name: 'Mumbai Central School',
                    code: 'MCS',
                    location: { city: 'Mumbai', state: 'MH', country: 'India' },
                    student_count: 2100,
                    type: 'cbse'
                },
                {
                    id: 'sch_005',
                    name: 'Delhi Public School',
                    code: 'DPS',
                    location: { city: 'New Delhi', state: 'DL', country: 'India' },
                    student_count: 3500,
                    type: 'cbse'
                }
            ])
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadLinkedSchools = async () => {
        try {
            const response = await fetch(`/api/schools/linked?application_id=${selectedApp}`)
            if (response.ok) {
                const data = await response.json()
                setLinkedSchools(data.schools || [])
            }
        } catch (error) {
            console.error('Error loading linked schools:', error)
            // Use sample data
            setLinkedSchools([
                {
                    school_id: 'sch_001',
                    school_name: 'Springfield High School',
                    school_code: 'SHS',
                    location: { city: 'Springfield', state: 'IL' },
                    linked_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    approved_scopes: ['student.profile.read', 'student.attendance.read'],
                    usage: { api_calls_30d: 15420, active_users: 245 }
                }
            ])
        }
    }

    const loadAccessRequests = async () => {
        try {
            const response = await fetch(`/api/schools/request?application_id=${selectedApp}`)
            if (response.ok) {
                const data = await response.json()
                setAccessRequests(data.requests || [])
            }
        } catch (error) {
            console.error('Error loading access requests:', error)
            // Use sample data
            setAccessRequests([
                {
                    id: 'req_001',
                    school_id: 'sch_003',
                    school_name: 'Oakwood International Academy',
                    status: 'pending',
                    requested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    purpose: 'To provide tutoring services',
                    requested_scopes: ['student.profile.read', 'student.academic.read']
                }
            ])
        }
    }

    const handleRequestAccess = async () => {
        if (!selectedSchool || !requestPurpose || requestScopes.length === 0) return

        setSubmitting(true)
        try {
            const response = await fetch('/api/schools/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    application_id: selectedApp,
                    school_id: selectedSchool.id,
                    purpose: requestPurpose,
                    requested_scopes: requestScopes
                })
            })

            if (response.ok) {
                setShowRequestModal(false)
                setSelectedSchool(null)
                setRequestPurpose('')
                setRequestScopes([])
                loadAccessRequests()
            }
        } catch (error) {
            console.error('Error requesting access:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Approved
                    </span>
                )
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        Pending
                    </span>
                )
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium">
                        <XCircle className="w-3 h-3" />
                        Rejected
                    </span>
                )
            default:
                return null
        }
    }

    const filteredSchools = allSchools.filter(school =>
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.location.city.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-slate-400">Loading school connections...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-400" />
                        School Connections
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Manage school access for your applications
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {applications.length > 0 && (
                        <select
                            value={selectedApp}
                            onChange={(e) => setSelectedApp(e.target.value)}
                            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {applications.map((app) => (
                                <option key={app.id} value={app.id}>{app.name}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => setActiveTab('discover')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Request Access
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{linkedSchools.length}</p>
                            <p className="text-sm text-slate-400">Linked Schools</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-xl">
                            <Clock className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {accessRequests.filter(r => r.status === 'pending').length}
                            </p>
                            <p className="text-sm text-slate-400">Pending Requests</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Users className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {linkedSchools.reduce((sum, s) => sum + (s.usage?.active_users || 0), 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-400">Active Users</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-slate-800/50 border border-slate-700/50 rounded-xl w-fit">
                {[
                    { id: 'linked', label: 'Linked Schools', icon: CheckCircle },
                    { id: 'requests', label: 'Access Requests', icon: Clock },
                    { id: 'discover', label: 'Discover Schools', icon: Search }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* Linked Schools */}
                {activeTab === 'linked' && (
                    <motion.div
                        key="linked"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {linkedSchools.length === 0 ? (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
                                <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">No linked schools yet</h3>
                                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                                    Request access to schools to start integrating with their data.
                                </p>
                                <button
                                    onClick={() => setActiveTab('discover')}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold"
                                >
                                    <Search className="w-4 h-4" />
                                    Discover Schools
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {linkedSchools.map((school) => (
                                    <motion.div
                                        key={school.school_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all group"
                                    >
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-600 flex items-center justify-center flex-shrink-0">
                                                {school.school_logo ? (
                                                    <img src={school.school_logo} alt="" className="w-10 h-10 rounded-lg" />
                                                ) : (
                                                    <Building2 className="w-7 h-7 text-blue-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-white truncate">{school.school_name}</h3>
                                                <p className="text-sm text-slate-400 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {school.location.city}, {school.location.state}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Linked {new Date(school.linked_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <p className="text-lg font-semibold text-white">
                                                    {(school.usage?.api_calls_30d || 0).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-slate-400">API Calls (30d)</p>
                                            </div>
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <p className="text-lg font-semibold text-white">
                                                    {(school.usage?.active_users || 0).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-slate-400">Active Users</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500 mb-2">Approved Scopes:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {school.approved_scopes.slice(0, 3).map((scope) => (
                                                    <span key={scope} className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                                                        {scope.split('.')[1]}
                                                    </span>
                                                ))}
                                                {school.approved_scopes.length > 3 && (
                                                    <span className="text-xs text-slate-500">
                                                        +{school.approved_scopes.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Access Requests */}
                {activeTab === 'requests' && (
                    <motion.div
                        key="requests"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden"
                    >
                        {accessRequests.length === 0 ? (
                            <div className="p-12 text-center">
                                <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">No pending requests</h3>
                                <p className="text-slate-400">All your access requests have been processed.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700/50">
                                {accessRequests.map((request) => (
                                    <div key={request.id} className="p-6 hover:bg-slate-700/20 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                                                    <Building2 className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white">{request.school_name}</h3>
                                                    <p className="text-sm text-slate-400">
                                                        Requested {new Date(request.requested_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {getStatusBadge(request.status)}
                                        </div>
                                        <p className="text-sm text-slate-300 mb-3">{request.purpose}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {request.requested_scopes.map((scope) => (
                                                <span key={scope} className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">
                                                    {scope}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Discover Schools */}
                {activeTab === 'discover' && (
                    <motion.div
                        key="discover"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search schools by name, code, or city..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        {/* Schools Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSchools.map((school) => {
                                const isLinked = linkedSchools.some(s => s.school_id === school.id)
                                const isPending = accessRequests.some(r => r.school_id === school.id && r.status === 'pending')

                                return (
                                    <motion.div
                                        key={school.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`bg-slate-800/50 border rounded-2xl p-5 transition-all ${isLinked
                                                ? 'border-green-500/30 bg-green-500/5'
                                                : isPending
                                                    ? 'border-yellow-500/30 bg-yellow-500/5'
                                                    : 'border-slate-700/50 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-600 flex items-center justify-center flex-shrink-0">
                                                <Building2 className="w-6 h-6 text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-white truncate">{school.name}</h3>
                                                <p className="text-sm text-slate-400">{school.code}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <MapPin className="w-4 h-4" />
                                                {school.location.city}, {school.location.state}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Users className="w-4 h-4" />
                                                {school.student_count.toLocaleString()} students
                                            </div>
                                        </div>

                                        {isLinked ? (
                                            <div className="flex items-center gap-2 text-green-400 text-sm">
                                                <CheckCircle className="w-4 h-4" />
                                                Already Linked
                                            </div>
                                        ) : isPending ? (
                                            <div className="flex items-center gap-2 text-yellow-400 text-sm">
                                                <Clock className="w-4 h-4" />
                                                Request Pending
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setSelectedSchool(school)
                                                    setShowRequestModal(true)
                                                }}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Request Access
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Request Access Modal */}
            <AnimatePresence>
                {showRequestModal && selectedSchool && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowRequestModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-700">
                                <h2 className="text-xl font-semibold text-white">Request School Access</h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    Request access to {selectedSchool.name}
                                </p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* School Info */}
                                <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{selectedSchool.name}</p>
                                        <p className="text-sm text-slate-400">
                                            {selectedSchool.location.city}, {selectedSchool.location.state}
                                        </p>
                                    </div>
                                </div>

                                {/* Purpose */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Purpose of Access *
                                    </label>
                                    <textarea
                                        value={requestPurpose}
                                        onChange={(e) => setRequestPurpose(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Describe why your application needs access to this school's data..."
                                    />
                                </div>

                                {/* Scopes */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Requested Permissions *
                                    </label>
                                    <div className="space-y-2">
                                        {availableScopes.map((scope) => (
                                            <label
                                                key={scope.id}
                                                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${requestScopes.includes(scope.id)
                                                        ? 'bg-blue-500/20 border-blue-500/50'
                                                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={requestScopes.includes(scope.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setRequestScopes([...requestScopes, scope.id])
                                                        } else {
                                                            setRequestScopes(requestScopes.filter(s => s !== scope.id))
                                                        }
                                                    }}
                                                    className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-white">{scope.label}</p>
                                                    <p className="text-xs text-slate-500">{scope.description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Data Usage Declaration */}
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-400">Data Usage Agreement</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                By requesting access, you agree to handle all data in accordance with
                                                our data protection policies and applicable privacy laws (GDPR, DPDP Act, FERPA).
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-700 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowRequestModal(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRequestAccess}
                                    disabled={submitting || !requestPurpose || requestScopes.length === 0}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold text-sm transition-all"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Shield className="w-4 h-4" />
                                    )}
                                    <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
