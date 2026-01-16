'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    AppWindow,
    BarChart3,
    Zap,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    ExternalLink,
    Clock,
    CheckCircle,
    AlertCircle,
    Webhook,
    Key,
    BookOpen,
    Sparkles,
    TrendingUp,
    Activity
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface StatCardProps {
    title: string
    value: string
    change?: string
    changeType?: 'positive' | 'negative' | 'neutral'
    icon: React.ElementType
    color: string
}

function StatCard({ title, value, change, changeType, icon: Icon, color }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all group"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{value}</p>
                    {change && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${changeType === 'positive' ? 'text-green-400' :
                                changeType === 'negative' ? 'text-red-400' : 'text-slate-400'
                            }`}>
                            {changeType === 'positive' ? <ArrowUpRight className="w-4 h-4" /> :
                                changeType === 'negative' ? <ArrowDownRight className="w-4 h-4" /> : null}
                            <span>{change}</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${color} bg-opacity-20 group-hover:bg-opacity-30 transition-all`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
            </div>
        </motion.div>
    )
}

interface Application {
    id: string
    name: string
    status: string
    total_api_calls: number
    created_at: string
    logo_url?: string
}

interface ActivityLog {
    id: string
    action: string
    resource_type: string
    created_at: string
    details?: any
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalApps: 0,
        apiCalls24h: 0,
        activeUsers: 0,
        webhookSuccess: 0
    })
    const [recentApps, setRecentApps] = useState<Application[]>([])
    const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
    const [developerAccount, setDeveloperAccount] = useState<any>(null)

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const { data: { user } } = await devSupabase.auth.getUser()
                if (!user) return

                // Get developer account
                const { data: account } = await devSupabase
                    .from('developer_accounts')
                    .select('*')
                    .eq('auth_user_id', user.id)
                    .single()

                if (!account) return
                setDeveloperAccount(account)

                // Get applications
                const { data: apps, count } = await devSupabase
                    .from('developer_applications')
                    .select('*', { count: 'exact' })
                    .eq('developer_id', account.id)
                    .order('created_at', { ascending: false })
                    .limit(5)

                if (apps) {
                    setRecentApps(apps)
                    setStats(prev => ({ ...prev, totalApps: count || 0 }))
                }

                // Get activity logs
                const { data: activity } = await devSupabase
                    .from('developer_activity_logs')
                    .select('*')
                    .eq('developer_id', account.id)
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (activity) setRecentActivity(activity)

                // Calculate mock stats (in production, these would come from analytics)
                setStats(prev => ({
                    ...prev,
                    apiCalls24h: Math.floor(Math.random() * 50000),
                    activeUsers: Math.floor(Math.random() * 1000),
                    webhookSuccess: 99.2
                }))

            } catch (error) {
                console.error('Error loading dashboard:', error)
            } finally {
                setLoading(false)
            }
        }

        loadDashboardData()
    }, [])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-500/20 text-green-400'
            case 'draft': return 'bg-slate-500/20 text-slate-400'
            case 'in_review': return 'bg-yellow-500/20 text-yellow-400'
            case 'rejected': return 'bg-red-500/20 text-red-400'
            default: return 'bg-slate-500/20 text-slate-400'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return 'Live'
            case 'draft': return 'Draft'
            case 'in_review': return 'In Review'
            case 'rejected': return 'Rejected'
            default: return status.charAt(0).toUpperCase() + status.slice(1)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(hours / 24)

        if (hours < 1) return 'Just now'
        if (hours < 24) return `${hours}h ago`
        if (days < 7) return `${days}d ago`
        return date.toLocaleDateString()
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-10 bg-slate-800 rounded-lg w-1/3"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-slate-800/50 rounded-2xl"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-slate-800/50 rounded-2xl"></div>
                    <div className="h-96 bg-slate-800/50 rounded-2xl"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-2xl sm:text-3xl font-bold text-white"
                    >
                        Welcome back, {developerAccount?.full_name?.split(' ')[0] || 'Developer'} 👋
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 mt-1"
                    >
                        Here's what's happening with your applications today.
                    </motion.p>
                </div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Link
                        href="/dashboard/applications/create"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/25"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New App</span>
                    </Link>
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Applications"
                    value={stats.totalApps.toString()}
                    icon={AppWindow}
                    color="bg-blue-500"
                />
                <StatCard
                    title="API Calls (24h)"
                    value={stats.apiCalls24h.toLocaleString()}
                    change="+12.5% from yesterday"
                    changeType="positive"
                    icon={Zap}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Active Users"
                    value={stats.activeUsers.toLocaleString()}
                    change="+5.2% this week"
                    changeType="positive"
                    icon={Users}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Webhook Success Rate"
                    value={`${stats.webhookSuccess}%`}
                    icon={Webhook}
                    color="bg-amber-500"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Applications List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                        <h2 className="text-lg font-semibold text-white">Your Applications</h2>
                        <Link
                            href="/dashboard/applications"
                            className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                        >
                            View All
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>

                    {recentApps.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                                <AppWindow className="w-8 h-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">No applications yet</h3>
                            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                                Create your first application to start integrating with CatalystWells APIs.
                            </p>
                            <Link
                                href="/dashboard/applications/create"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create Your First App</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-700/50">
                            {recentApps.map((app, index) => (
                                <motion.div
                                    key={app.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="p-4 sm:p-6 hover:bg-slate-700/20 transition-colors group"
                                >
                                    <Link href={`/dashboard/applications/${app.id}`} className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-600 flex items-center justify-center flex-shrink-0">
                                            {app.logo_url ? (
                                                <img src={app.logo_url} alt={app.name} className="w-8 h-8 rounded-lg" />
                                            ) : (
                                                <AppWindow className="w-6 h-6 text-blue-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-base font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                                                    {app.name}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                                    {getStatusLabel(app.status)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Zap className="w-3 h-3" />
                                                    {(app.total_api_calls || 0).toLocaleString()} API calls
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Created {formatDate(app.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Quick Actions & Activity */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
                    >
                        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard/applications/create"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors group"
                            >
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                    <Plus className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">Create New App</span>
                            </Link>
                            <Link
                                href="/dashboard/docs"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors group"
                            >
                                <div className="p-2 rounded-lg bg-purple-500/20">
                                    <BookOpen className="w-4 h-4 text-purple-400" />
                                </div>
                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">View Documentation</span>
                            </Link>
                            <Link
                                href="/dashboard/playground"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors group"
                            >
                                <div className="p-2 rounded-lg bg-emerald-500/20">
                                    <Sparkles className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">API Playground</span>
                            </Link>
                            <Link
                                href="/dashboard/analytics"
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors group"
                            >
                                <div className="p-2 rounded-lg bg-amber-500/20">
                                    <BarChart3 className="w-4 h-4 text-amber-400" />
                                </div>
                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">View Analytics</span>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
                    >
                        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-6">
                                <Activity className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentActivity.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3">
                                        <div className={`p-1.5 rounded-lg ${activity.action.includes('created') ? 'bg-green-500/20' :
                                                activity.action.includes('updated') ? 'bg-blue-500/20' :
                                                    activity.action.includes('deleted') ? 'bg-red-500/20' : 'bg-slate-500/20'
                                            }`}>
                                            {activity.action.includes('created') ? <CheckCircle className="w-3 h-3 text-green-400" /> :
                                                activity.action.includes('updated') ? <TrendingUp className="w-3 h-3 text-blue-400" /> :
                                                    <AlertCircle className="w-3 h-3 text-slate-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-300 truncate">
                                                {activity.action.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {formatDate(activity.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Getting Started Banner */}
            {stats.totalApps === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 sm:p-8"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">Get Started with CatalystWells APIs</h3>
                            <p className="text-slate-300 mb-4">
                                Build powerful education apps with access to student data, attendance, grades, and more.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/dashboard/applications/create"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Your First App
                                </Link>
                                <Link
                                    href="/dashboard/docs/getting-started"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg font-semibold text-sm hover:bg-white/20 transition-colors"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Read the Docs
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
