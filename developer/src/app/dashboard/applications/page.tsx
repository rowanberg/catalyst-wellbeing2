'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
    Plus,
    Search,
    Filter,
    AppWindow,
    MoreVertical,
    Zap,
    Users,
    Clock,
    Settings,
    Trash2,
    ExternalLink,
    BarChart3,
    Key,
    Webhook,
    Grid,
    List,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface Application {
    id: string
    name: string
    description: string
    status: string
    client_id: string
    logo_url?: string
    website_url?: string
    category?: string
    environment: string
    total_api_calls: number
    active_installs: number
    created_at: string
    updated_at: string
}

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [openMenu, setOpenMenu] = useState<string | null>(null)

    useEffect(() => {
        const loadApplications = async () => {
            try {
                const { data: { user } } = await devSupabase.auth.getUser()
                if (!user) return

                const { data: account } = await devSupabase
                    .from('developer_accounts')
                    .select('id')
                    .eq('auth_user_id', user.id)
                    .single()

                if (!account) return

                const { data: apps } = await devSupabase
                    .from('developer_applications')
                    .select('*')
                    .eq('developer_id', account.id)
                    .order('created_at', { ascending: false })

                if (apps) setApplications(apps)
            } catch (error) {
                console.error('Error loading applications:', error)
            } finally {
                setLoading(false)
            }
        }

        loadApplications()
    }, [])

    const filteredApps = applications.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.description?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'approved':
                return { label: 'Live', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle }
            case 'draft':
                return { label: 'Draft', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: AlertCircle }
            case 'in_review':
                return { label: 'In Review', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock }
            case 'submitted':
                return { label: 'Submitted', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock }
            case 'rejected':
                return { label: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle }
            case 'suspended':
                return { label: 'Suspended', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertCircle }
            default:
                return { label: status, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: AlertCircle }
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const handleDeleteApp = async (appId: string) => {
        if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
            return
        }

        try {
            const { error } = await devSupabase
                .from('developer_applications')
                .delete()
                .eq('id', appId)

            if (error) throw error

            setApplications(prev => prev.filter(app => app.id !== appId))
        } catch (error) {
            console.error('Error deleting application:', error)
            alert('Failed to delete application')
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="h-10 bg-slate-800 rounded-lg w-1/3"></div>
                    <div className="h-10 bg-slate-800 rounded-lg w-40"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-64 bg-slate-800/50 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Applications</h1>
                    <p className="text-slate-400 mt-1">
                        Manage your OAuth applications and API integrations
                    </p>
                </div>
                <Link
                    href="/dashboard/applications/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/25"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create New App</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search applications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-12 pr-10 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="in_review">In Review</option>
                        <option value="approved">Live</option>
                        <option value="rejected">Rejected</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-slate-800/50 border border-slate-700 rounded-xl p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Applications */}
            {filteredApps.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-700/50 flex items-center justify-center">
                        <AppWindow className="w-10 h-10 text-slate-500" />
                    </div>
                    {applications.length === 0 ? (
                        <>
                            <h3 className="text-xl font-semibold text-white mb-2">No applications yet</h3>
                            <p className="text-slate-400 mb-6 max-w-md mx-auto">
                                Create your first application to start integrating with CatalystWells APIs and accessing education data.
                            </p>
                            <Link
                                href="/dashboard/applications/create"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Create Your First App</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-semibold text-white mb-2">No matching applications</h3>
                            <p className="text-slate-400">
                                Try adjusting your search or filter criteria.
                            </p>
                        </>
                    )}
                </motion.div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredApps.map((app, index) => {
                        const status = getStatusConfig(app.status)
                        const StatusIcon = status.icon

                        return (
                            <motion.div
                                key={app.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-all group"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-600 flex items-center justify-center">
                                            {app.logo_url ? (
                                                <img src={app.logo_url} alt={app.name} className="w-10 h-10 rounded-lg object-cover" />
                                            ) : (
                                                <AppWindow className="w-7 h-7 text-blue-400" />
                                            )}
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenMenu(openMenu === app.id ? null : app.id)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                            <AnimatePresence>
                                                {openMenu === app.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-10"
                                                    >
                                                        <Link
                                                            href={`/dashboard/applications/${app.id}`}
                                                            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            <span>View Details</span>
                                                        </Link>
                                                        <Link
                                                            href={`/dashboard/applications/${app.id}/settings`}
                                                            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                            <span>Settings</span>
                                                        </Link>
                                                        <Link
                                                            href={`/dashboard/applications/${app.id}/analytics`}
                                                            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50"
                                                        >
                                                            <BarChart3 className="w-4 h-4" />
                                                            <span>Analytics</span>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteApp(app.id)}
                                                            className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <Link href={`/dashboard/applications/${app.id}`}>
                                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                            {app.name}
                                        </h3>
                                    </Link>

                                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                                        {app.description || 'No description provided'}
                                    </p>

                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${status.color}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {status.label}
                                        </span>
                                        {app.category && (
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300">
                                                {app.category}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-slate-500">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Zap className="w-3.5 h-3.5" />
                                                {(app.total_api_calls || 0).toLocaleString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                {app.active_installs || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">
                                            Created {formatDate(app.created_at)}
                                        </span>
                                        <Link
                                            href={`/dashboard/applications/${app.id}`}
                                            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                                        >
                                            View Details
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Application</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">API Calls</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Users</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredApps.map((app) => {
                                    const status = getStatusConfig(app.status)
                                    const StatusIcon = status.icon

                                    return (
                                        <tr key={app.id} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-600 flex items-center justify-center flex-shrink-0">
                                                        {app.logo_url ? (
                                                            <img src={app.logo_url} alt={app.name} className="w-7 h-7 rounded" />
                                                        ) : (
                                                            <AppWindow className="w-5 h-5 text-blue-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Link href={`/dashboard/applications/${app.id}`} className="text-sm font-medium text-white hover:text-blue-400">
                                                            {app.name}
                                                        </Link>
                                                        <p className="text-xs text-slate-500 truncate max-w-xs">{app.client_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${status.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {(app.total_api_calls || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {app.active_installs || 0}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {formatDate(app.created_at)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/dashboard/applications/${app.id}`}
                                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/applications/${app.id}/settings`}
                                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteApp(app.id)}
                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
