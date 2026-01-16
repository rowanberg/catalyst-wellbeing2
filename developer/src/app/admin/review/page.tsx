'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield, Clock, CheckCircle, XCircle, AlertTriangle,
    ChevronRight, Search, Filter, ExternalLink, Eye,
    ThumbsUp, ThumbsDown, MessageSquare, Calendar,
    Building2, Globe, Lock, Users, BarChart3
} from 'lucide-react'

interface PendingApp {
    id: string
    name: string
    description: string
    category: string
    logo_url: string
    website_url: string
    privacy_policy_url: string
    requested_scopes: string[]
    status: string
    submitted_at: string
    developer: {
        id: string
        company_name: string
        email: string
        verified: boolean
    }
    review_count: number
    days_pending: number
}

export default function AdminReviewPage() {
    const [apps, setApps] = useState<PendingApp[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedApp, setSelectedApp] = useState<PendingApp | null>(null)
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [stats, setStats] = useState({
        pending: 0,
        approved_today: 0,
        rejected_today: 0,
        avg_review_time: 0
    })

    useEffect(() => {
        fetchPendingApps()
        fetchStats()
    }, [categoryFilter])

    const fetchPendingApps = async () => {
        try {
            const url = categoryFilter === 'all'
                ? '/api/admin/apps/pending'
                : `/api/admin/apps/pending?category=${categoryFilter}`
            const res = await fetch(url)
            const data = await res.json()
            setApps(data.apps || [])
        } catch (error) {
            console.error('Failed to fetch pending apps:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        // In real app, fetch from API
        setStats({
            pending: 12,
            approved_today: 3,
            rejected_today: 1,
            avg_review_time: 2.5
        })
    }

    const handleReviewAction = async (action: string, notes: string) => {
        if (!selectedApp) return

        try {
            const res = await fetch(`/api/admin/apps/${selectedApp.id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, notes })
            })

            if (res.ok) {
                setReviewModalOpen(false)
                setSelectedApp(null)
                fetchPendingApps()
            }
        } catch (error) {
            console.error('Review action failed:', error)
        }
    }

    const filteredApps = apps.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.developer.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getPriorityColor = (days: number) => {
        if (days > 7) return 'text-red-400 bg-red-500/10'
        if (days > 3) return 'text-yellow-400 bg-yellow-500/10'
        return 'text-green-400 bg-green-500/10'
    }

    const categories = ['all', 'education', 'analytics', 'communication', 'learning_tools', 'assessment']

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Shield className="w-8 h-8 text-purple-400" />
                            App Review Dashboard
                        </h1>
                        <p className="text-slate-400 mt-1">Review and approve third-party application submissions</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-400">Last updated</div>
                        <div className="text-white font-medium">{new Date().toLocaleTimeString()}</div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'yellow' },
                        { label: 'Approved Today', value: stats.approved_today, icon: CheckCircle, color: 'green' },
                        { label: 'Rejected Today', value: stats.rejected_today, icon: XCircle, color: 'red' },
                        { label: 'Avg. Review Time', value: `${stats.avg_review_time}d`, icon: BarChart3, color: 'blue' }
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm">{stat.label}</p>
                                    <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
                                </div>
                                <stat.icon className={`w-8 h-8 text-${stat.color}-400/30`} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search apps or developers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${categoryFilter === cat
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Apps List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-slate-400 mt-4">Loading pending applications...</p>
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white">All caught up!</h3>
                            <p className="text-slate-400">No pending applications to review.</p>
                        </div>
                    ) : (
                        filteredApps.map((app, i) => (
                            <motion.div
                                key={app.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-purple-500/50 transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    {/* App Logo */}
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                                        {app.logo_url ? (
                                            <img src={app.logo_url} alt={app.name} className="w-full h-full rounded-xl object-cover" />
                                        ) : (
                                            app.name.charAt(0)
                                        )}
                                    </div>

                                    {/* App Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                                                    {app.name}
                                                </h3>
                                                <p className="text-sm text-slate-400 flex items-center gap-2">
                                                    <Building2 className="w-4 h-4" />
                                                    {app.developer.company_name}
                                                    {app.developer.verified && (
                                                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                                            Verified
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(app.days_pending)}`}>
                                                {app.days_pending === 0 ? 'Today' : `${app.days_pending}d pending`}
                                            </div>
                                        </div>

                                        <p className="text-slate-300 text-sm mt-2 line-clamp-2">{app.description}</p>

                                        <div className="flex flex-wrap items-center gap-4 mt-3">
                                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                                {app.category}
                                            </span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Lock className="w-3 h-3" />
                                                {app.requested_scopes?.length || 0} scopes
                                            </span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                {app.review_count} reviews
                                            </span>
                                            {app.website_url && (
                                                <a
                                                    href={app.website_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                                >
                                                    <Globe className="w-3 h-3" />
                                                    Website
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => {
                                                setSelectedApp(app)
                                                setReviewModalOpen(true)
                                            }}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Review
                                        </button>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReviewAction('approve', 'Quick approval')}
                                                className="p-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg transition-colors"
                                                title="Quick Approve"
                                            >
                                                <ThumbsUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleReviewAction('reject', '')}
                                                className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                                                title="Quick Reject"
                                            >
                                                <ThumbsDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {reviewModalOpen && selectedApp && (
                    <ReviewModal
                        app={selectedApp}
                        onClose={() => {
                            setReviewModalOpen(false)
                            setSelectedApp(null)
                        }}
                        onAction={handleReviewAction}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function ReviewModal({
    app,
    onClose,
    onAction
}: {
    app: PendingApp
    onClose: () => void
    onAction: (action: string, notes: string) => void
}) {
    const [notes, setNotes] = useState('')
    const [action, setAction] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!action) return
        setLoading(true)
        await onAction(action, notes)
        setLoading(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xl font-bold text-white">
                            {app.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{app.name}</h2>
                            <p className="text-slate-400">{app.developer.company_name}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Checklist */}
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <h3 className="font-semibold text-white mb-3">Review Checklist</h3>
                        <div className="space-y-2">
                            {[
                                { label: 'Privacy Policy URL', checked: !!app.privacy_policy_url },
                                { label: 'Website URL', checked: !!app.website_url },
                                { label: 'App Description (50+ chars)', checked: app.description.length > 50 },
                                { label: 'Developer Verified', checked: app.developer.verified }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    {item.checked ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    )}
                                    <span className={item.checked ? 'text-slate-300' : 'text-red-400'}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Requested Scopes */}
                    <div>
                        <h3 className="font-semibold text-white mb-3">Requested Scopes</h3>
                        <div className="flex flex-wrap gap-2">
                            {app.requested_scopes?.map((scope, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm"
                                >
                                    {scope}
                                </span>
                            )) || <span className="text-slate-400">No scopes requested</span>}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Review Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes or feedback for the developer..."
                            rows={4}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setAction('approve')}
                            className={`p-4 rounded-xl border-2 transition-all ${action === 'approve'
                                    ? 'border-green-500 bg-green-500/20'
                                    : 'border-slate-700 hover:border-green-500/50'
                                }`}
                        >
                            <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${action === 'approve' ? 'text-green-400' : 'text-slate-400'}`} />
                            <div className={`text-sm font-medium ${action === 'approve' ? 'text-green-400' : 'text-slate-300'}`}>
                                Approve
                            </div>
                        </button>
                        <button
                            onClick={() => setAction('request_changes')}
                            className={`p-4 rounded-xl border-2 transition-all ${action === 'request_changes'
                                    ? 'border-yellow-500 bg-yellow-500/20'
                                    : 'border-slate-700 hover:border-yellow-500/50'
                                }`}
                        >
                            <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${action === 'request_changes' ? 'text-yellow-400' : 'text-slate-400'}`} />
                            <div className={`text-sm font-medium ${action === 'request_changes' ? 'text-yellow-400' : 'text-slate-300'}`}>
                                Request Changes
                            </div>
                        </button>
                        <button
                            onClick={() => setAction('reject')}
                            className={`p-4 rounded-xl border-2 transition-all ${action === 'reject'
                                    ? 'border-red-500 bg-red-500/20'
                                    : 'border-slate-700 hover:border-red-500/50'
                                }`}
                        >
                            <XCircle className={`w-8 h-8 mx-auto mb-2 ${action === 'reject' ? 'text-red-400' : 'text-slate-400'}`} />
                            <div className={`text-sm font-medium ${action === 'reject' ? 'text-red-400' : 'text-slate-300'}`}>
                                Reject
                            </div>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!action || loading}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        {loading ? 'Processing...' : 'Submit Review'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}
