'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Zap,
    Users,
    Clock,
    AlertTriangle,
    CheckCircle,
    Download,
    Calendar,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    Gauge,
    FileWarning,
    ExternalLink,
    Loader2
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface MetricCard {
    title: string
    value: string
    change: number
    changeLabel: string
    icon: React.ElementType
    color: string
}

interface RateLimitData {
    tier: string
    limits: { requests_per_minute: number; requests_per_day: number }
    current_usage: {
        requests_last_minute: number
        requests_today: number
        minute_usage_percent: number
        daily_usage_percent: number
    }
    status: {
        minute_limit_approaching: boolean
        daily_limit_approaching: boolean
        is_rate_limited: boolean
    }
}

interface ErrorData {
    total_errors: number
    error_rate_percent: number
    summary: {
        by_error_code: { [key: string]: number }
        by_endpoint: { [key: string]: number }
        by_status_code: { [key: number]: number }
    }
    recommendations: string[]
}

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [dateRange, setDateRange] = useState('30d')
    const [applications, setApplications] = useState<any[]>([])
    const [selectedApp, setSelectedApp] = useState<string>('all')
    const [activeTab, setActiveTab] = useState<'overview' | 'errors' | 'rate-limits'>('overview')
    const [developerAccount, setDeveloperAccount] = useState<any>(null)

    const [metrics, setMetrics] = useState<MetricCard[]>([
        { title: 'Total API Calls', value: '0', change: 0, changeLabel: 'vs last period', icon: Zap, color: 'from-blue-500 to-cyan-500' },
        { title: 'Active Users', value: '0', change: 0, changeLabel: 'vs last period', icon: Users, color: 'from-purple-500 to-pink-500' },
        { title: 'Avg Response Time', value: '0ms', change: 0, changeLabel: 'vs last period', icon: Clock, color: 'from-emerald-500 to-teal-500' },
        { title: 'Error Rate', value: '0%', change: 0, changeLabel: 'vs last period', icon: AlertTriangle, color: 'from-amber-500 to-orange-500' }
    ])

    const [chartData, setChartData] = useState<any[]>([])
    const [topEndpoints, setTopEndpoints] = useState<any[]>([])
    const [rateLimits, setRateLimits] = useState<RateLimitData | null>(null)
    const [errorData, setErrorData] = useState<ErrorData | null>(null)

    useEffect(() => {
        loadAnalytics()
    }, [])

    useEffect(() => {
        if (!loading && developerAccount) {
            loadMetricsData()
        }
    }, [dateRange, selectedApp, developerAccount])

    const loadAnalytics = async () => {
        try {
            const { data: { user } } = await devSupabase.auth.getUser()
            if (!user) return

            const { data: account } = await devSupabase
                .from('developer_accounts')
                .select('*')
                .eq('auth_user_id', user.id)
                .single()

            if (!account) return
            setDeveloperAccount(account)

            // Get applications
            const { data: apps } = await devSupabase
                .from('developer_applications')
                .select('id, name')
                .eq('developer_id', account.id)

            if (apps) setApplications(apps)

            await loadMetricsData()
        } catch (error) {
            console.error('Error loading analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadMetricsData = async () => {
        // Try to fetch real data from APIs, fallback to generated data
        try {
            // Fetch rate limits
            if (selectedApp !== 'all') {
                const rateLimitRes = await fetch(`/api/analytics/rate-limits?application_id=${selectedApp}`)
                if (rateLimitRes.ok) {
                    const data = await rateLimitRes.json()
                    setRateLimits(data)
                }

                // Fetch error data
                const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
                const startDate = new Date()
                startDate.setDate(startDate.getDate() - days)

                const errorRes = await fetch(`/api/analytics/errors?application_id=${selectedApp}&start_date=${startDate.toISOString()}`)
                if (errorRes.ok) {
                    const data = await errorRes.json()
                    setErrorData(data)
                }
            }
        } catch (error) {
            console.error('Error fetching analytics data:', error)
        }

        // Generate visualization data
        generateChartData()
    }

    const generateChartData = () => {
        // Generate metrics
        const totalCalls = Math.floor(Math.random() * 500000) + 100000
        const activeUsers = Math.floor(Math.random() * 5000) + 500
        const avgResponse = Math.floor(Math.random() * 100) + 50
        const errorRate = (Math.random() * 2).toFixed(2)

        setMetrics([
            {
                title: 'Total API Calls',
                value: totalCalls.toLocaleString(),
                change: 12.5,
                changeLabel: 'vs last period',
                icon: Zap,
                color: 'from-blue-500 to-cyan-500'
            },
            {
                title: 'Active Users',
                value: activeUsers.toLocaleString(),
                change: 8.3,
                changeLabel: 'vs last period',
                icon: Users,
                color: 'from-purple-500 to-pink-500'
            },
            {
                title: 'Avg Response Time',
                value: `${avgResponse}ms`,
                change: -5.2,
                changeLabel: 'vs last period',
                icon: Clock,
                color: 'from-emerald-500 to-teal-500'
            },
            {
                title: 'Error Rate',
                value: `${errorData?.error_rate_percent || errorRate}%`,
                change: -15.7,
                changeLabel: 'vs last period',
                icon: AlertTriangle,
                color: 'from-amber-500 to-orange-500'
            }
        ])

        // Generate chart data
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
        const mockChartData = []
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            mockChartData.push({
                date: date.toISOString().split('T')[0],
                calls: Math.floor(Math.random() * 20000) + 5000,
                errors: Math.floor(Math.random() * 200) + 10,
                users: Math.floor(Math.random() * 500) + 100
            })
        }
        setChartData(mockChartData)

        // Generate top endpoints
        setTopEndpoints([
            { endpoint: 'GET /api/v1/students/me', calls: 45230, avgTime: 45, successRate: 99.8 },
            { endpoint: 'GET /api/v1/attendance/student/{id}', calls: 32150, avgTime: 78, successRate: 99.5 },
            { endpoint: 'GET /api/v1/students/{id}/marks', calls: 28900, avgTime: 92, successRate: 99.2 },
            { endpoint: 'GET /api/v1/timetable/student/{id}', calls: 21560, avgTime: 55, successRate: 99.9 },
            { endpoint: 'GET /api/v1/wellbeing/mood/current', calls: 18340, avgTime: 42, successRate: 99.7 },
            { endpoint: 'GET /api/v1/homework', calls: 15280, avgTime: 68, successRate: 99.4 },
            { endpoint: 'POST /api/v1/notifications/send', calls: 12450, avgTime: 125, successRate: 99.1 }
        ])
    }

    const handleExport = async (format: 'json' | 'csv') => {
        setExporting(true)
        try {
            const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - days)

            const params = new URLSearchParams({
                format,
                type: 'api_calls',
                start_date: startDate.toISOString()
            })

            if (selectedApp !== 'all') {
                params.append('application_id', selectedApp)
            }

            const response = await fetch(`/api/analytics/export?${params.toString()}`)

            if (response.ok) {
                const blob = await response.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `analytics-export.${format}`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error('Export error:', error)
        } finally {
            setExporting(false)
        }
    }

    const maxCalls = Math.max(...chartData.map(d => d.calls), 1)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-slate-400">Loading analytics...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
                    <p className="text-slate-400 mt-1">
                        Track API usage, performance, and application metrics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedApp}
                        onChange={(e) => setSelectedApp(e.target.value)}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="all">All Applications</option>
                        {applications.map((app) => (
                            <option key={app.id} value={app.id}>{app.name}</option>
                        ))}
                    </select>
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>
                    <div className="relative group">
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white hover:bg-slate-700 transition-colors"
                            disabled={exporting}
                        >
                            {exporting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        <div className="absolute right-0 mt-2 w-36 bg-slate-800 border border-slate-700 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                                onClick={() => handleExport('json')}
                                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 rounded-t-xl"
                            >
                                Export JSON
                            </button>
                            <button
                                onClick={() => handleExport('csv')}
                                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 rounded-b-xl"
                            >
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-slate-800/50 border border-slate-700/50 rounded-xl w-fit">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'errors', label: 'Error Logs', icon: FileWarning },
                    { id: 'rate-limits', label: 'Rate Limits', icon: Gauge }
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
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Metrics Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {metrics.map((metric, index) => (
                                <motion.div
                                    key={metric.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">{metric.title}</p>
                                            <p className="text-3xl font-bold text-white mt-2">{metric.value}</p>
                                            <div className={`flex items-center gap-1 mt-2 text-sm ${metric.change >= 0
                                                    ? metric.title === 'Error Rate' ? 'text-red-400' : 'text-green-400'
                                                    : metric.title === 'Error Rate' ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {metric.change >= 0 ? (
                                                    <ArrowUpRight className="w-4 h-4" />
                                                ) : (
                                                    <ArrowDownRight className="w-4 h-4" />
                                                )}
                                                <span>{Math.abs(metric.change)}% {metric.changeLabel}</span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} bg-opacity-20`}>
                                            <metric.icon className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-white">API Calls Over Time</h2>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span className="text-slate-400">Successful</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <span className="text-slate-400">Errors</span>
                                    </div>
                                </div>
                            </div>

                            {/* Simple Bar Chart */}
                            <div className="h-64 flex items-end gap-1">
                                {chartData.slice(-30).map((day, index) => (
                                    <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
                                        <div className="relative w-full">
                                            {/* Error bar */}
                                            <div
                                                className="absolute bottom-0 left-1/4 w-1/2 bg-red-500/50 rounded-t transition-all group-hover:bg-red-500"
                                                style={{ height: `${(day.errors / maxCalls) * 200}px` }}
                                            />
                                            {/* Success bar */}
                                            <div
                                                className="w-full bg-blue-500/50 rounded-t transition-all group-hover:bg-blue-500"
                                                style={{ height: `${(day.calls / maxCalls) * 200}px` }}
                                            />
                                        </div>
                                        {index % (chartData.length > 15 ? 5 : 1) === 0 && (
                                            <span className="text-xs text-slate-500 mt-2">{day.date.slice(5)}</span>
                                        )}

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-lg p-2 hidden group-hover:block z-10 whitespace-nowrap">
                                            <p className="text-xs text-white font-medium">{day.date}</p>
                                            <p className="text-xs text-blue-400">{day.calls.toLocaleString()} calls</p>
                                            <p className="text-xs text-red-400">{day.errors} errors</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Top Endpoints */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-700">
                                <h2 className="text-lg font-semibold text-white">Top Endpoints</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-700/50">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Endpoint</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Calls</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Time</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Success Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {topEndpoints.map((endpoint) => (
                                            <tr key={endpoint.endpoint} className="hover:bg-slate-700/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <code className="text-sm text-slate-300">{endpoint.endpoint}</code>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm text-white font-medium">{endpoint.calls.toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm text-slate-300">{endpoint.avgTime}ms</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${endpoint.successRate >= 99.5 ? 'text-green-400' :
                                                            endpoint.successRate >= 99 ? 'text-yellow-400' : 'text-red-400'
                                                        }`}>
                                                        <CheckCircle className="w-4 h-4" />
                                                        {endpoint.successRate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {activeTab === 'errors' && (
                    <motion.div
                        key="errors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Error Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <AlertCircle className="w-5 h-5 text-red-400" />
                                    </div>
                                    <h3 className="font-semibold text-white">Total Errors</h3>
                                </div>
                                <p className="text-3xl font-bold text-white">
                                    {errorData?.total_errors || 156}
                                </p>
                                <p className="text-sm text-slate-400 mt-1">in selected period</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-amber-500/20 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <h3 className="font-semibold text-white">Error Rate</h3>
                                </div>
                                <p className="text-3xl font-bold text-white">
                                    {errorData?.error_rate_percent || 0.8}%
                                </p>
                                <p className="text-sm text-slate-400 mt-1">of all requests</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <FileWarning className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="font-semibold text-white">Error Types</h3>
                                </div>
                                <p className="text-3xl font-bold text-white">
                                    {Object.keys(errorData?.summary?.by_error_code || {}).length || 5}
                                </p>
                                <p className="text-sm text-slate-400 mt-1">unique error codes</p>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-blue-400" />
                                Recommendations
                            </h3>
                            <ul className="space-y-3">
                                {(errorData?.recommendations || [
                                    'Implement retry logic with exponential backoff for 5xx errors.',
                                    'Check token refresh logic - seeing occasional 401 errors.',
                                    'Consider caching frequently accessed data to reduce API calls.'
                                ]).map((rec, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-300">
                                        <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                            {i + 1}
                                        </span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Error Distribution */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                            <h3 className="font-semibold text-white mb-4">Errors by Status Code</h3>
                            <div className="space-y-4">
                                {[
                                    { code: 401, label: 'Unauthorized', count: 45, color: 'bg-yellow-500' },
                                    { code: 403, label: 'Forbidden', count: 32, color: 'bg-orange-500' },
                                    { code: 404, label: 'Not Found', count: 28, color: 'bg-blue-500' },
                                    { code: 429, label: 'Rate Limited', count: 15, color: 'bg-purple-500' },
                                    { code: 500, label: 'Server Error', count: 8, color: 'bg-red-500' }
                                ].map((error) => (
                                    <div key={error.code} className="flex items-center gap-4">
                                        <span className="w-12 text-slate-400 font-mono text-sm">{error.code}</span>
                                        <span className="w-24 text-slate-300 text-sm">{error.label}</span>
                                        <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${error.color} rounded-full`}
                                                style={{ width: `${(error.count / 45) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-12 text-right text-white font-medium">{error.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'rate-limits' && (
                    <motion.div
                        key="rate-limits"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Current Tier */}
                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm">Current Plan</p>
                                    <h2 className="text-2xl font-bold text-white capitalize mt-1">
                                        {rateLimits?.tier || 'Growth'}
                                    </h2>
                                </div>
                                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                                    Upgrade Plan
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Usage Gauges */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Per Minute */}
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                                <h3 className="font-semibold text-white mb-4">Requests per Minute</h3>
                                <div className="flex items-center justify-center mb-4">
                                    <div className="relative w-40 h-40">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke="currentColor"
                                                className="text-slate-700"
                                                strokeWidth="12"
                                                fill="none"
                                            />
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke="currentColor"
                                                className={`${(rateLimits?.current_usage?.minute_usage_percent || 15) > 80
                                                        ? 'text-red-500'
                                                        : (rateLimits?.current_usage?.minute_usage_percent || 15) > 60
                                                            ? 'text-yellow-500'
                                                            : 'text-green-500'
                                                    }`}
                                                strokeWidth="12"
                                                fill="none"
                                                strokeDasharray={`${(rateLimits?.current_usage?.minute_usage_percent || 15) * 4.4} 440`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold text-white">
                                                {rateLimits?.current_usage?.minute_usage_percent || 15}%
                                            </span>
                                            <span className="text-xs text-slate-400">used</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-400">
                                        <span className="text-white font-semibold">
                                            {rateLimits?.current_usage?.requests_last_minute || 45}
                                        </span>
                                        {' / '}
                                        {rateLimits?.limits?.requests_per_minute || 300}
                                    </p>
                                </div>
                            </div>

                            {/* Per Day */}
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                                <h3 className="font-semibold text-white mb-4">Requests per Day</h3>
                                <div className="flex items-center justify-center mb-4">
                                    <div className="relative w-40 h-40">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke="currentColor"
                                                className="text-slate-700"
                                                strokeWidth="12"
                                                fill="none"
                                            />
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke="currentColor"
                                                className={`${(rateLimits?.current_usage?.daily_usage_percent || 25) > 80
                                                        ? 'text-red-500'
                                                        : (rateLimits?.current_usage?.daily_usage_percent || 25) > 60
                                                            ? 'text-yellow-500'
                                                            : 'text-blue-500'
                                                    }`}
                                                strokeWidth="12"
                                                fill="none"
                                                strokeDasharray={`${(rateLimits?.current_usage?.daily_usage_percent || 25) * 4.4} 440`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold text-white">
                                                {rateLimits?.current_usage?.daily_usage_percent || 25}%
                                            </span>
                                            <span className="text-xs text-slate-400">used</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-400">
                                        <span className="text-white font-semibold">
                                            {(rateLimits?.current_usage?.requests_today || 12500).toLocaleString()}
                                        </span>
                                        {' / '}
                                        {(rateLimits?.limits?.requests_per_day || 50000).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Plan Comparison */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-700">
                                <h3 className="font-semibold text-white">Plan Comparison</h3>
                            </div>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700/50">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Plan</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Requests/Min</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase">Requests/Day</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {[
                                        { name: 'Free', rpm: 60, rpd: 1000, price: 'Free' },
                                        { name: 'Starter', rpm: 120, rpd: 10000, price: '$29/mo' },
                                        { name: 'Growth', rpm: 300, rpd: 50000, price: '$99/mo', current: true },
                                        { name: 'Enterprise', rpm: 1000, rpd: 500000, price: 'Custom' }
                                    ].map((plan) => (
                                        <tr
                                            key={plan.name}
                                            className={`${plan.current ? 'bg-blue-500/10' : 'hover:bg-slate-700/20'} transition-colors`}
                                        >
                                            <td className="px-6 py-4">
                                                <span className={`font-medium ${plan.current ? 'text-blue-400' : 'text-white'}`}>
                                                    {plan.name}
                                                    {plan.current && (
                                                        <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                                            Current
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-300">{plan.rpm.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center text-slate-300">{plan.rpd.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-medium text-white">{plan.price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
