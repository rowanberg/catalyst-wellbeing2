'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    AppWindow,
    Settings,
    Key,
    Webhook,
    BarChart3,
    Globe,
    Shield,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    ExternalLink,
    Copy,
    Eye,
    EyeOff,
    RefreshCw,
    Send,
    Zap,
    Users,
    Code2,
    Trash2
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface Application {
    id: string
    name: string
    description: string
    short_description: string
    category: string
    status: string
    client_id: string
    environment: string
    website_url: string
    privacy_policy_url: string
    terms_of_service_url: string
    support_url: string
    documentation_url: string
    redirect_uris: string[]
    requested_scopes: string[]
    allowed_scopes: string[]
    logo_url: string
    total_api_calls: number
    active_installs: number
    created_at: string
    updated_at: string
    submitted_at: string
    approved_at: string
    rejection_reason: string
}

function ApplicationDetailContent() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const isNewlyCreated = searchParams.get('created') === 'true'

    const [application, setApplication] = useState<Application | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [showClientId, setShowClientId] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)

    useEffect(() => {
        const loadApplication = async () => {
            try {
                const { data: { user } } = await devSupabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                const { data: account } = await devSupabase
                    .from('developer_accounts')
                    .select('id')
                    .eq('auth_user_id', user.id)
                    .single()

                if (!account) return

                const { data: app } = await devSupabase
                    .from('developer_applications')
                    .select('*')
                    .eq('id', params.id)
                    .eq('developer_id', account.id)
                    .single()

                if (app) setApplication(app)
            } catch (error) {
                console.error('Error loading application:', error)
            } finally {
                setLoading(false)
            }
        }

        loadApplication()
    }, [params.id, router])

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'approved':
                return { label: 'Live', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle }
            case 'draft':
                return { label: 'Draft', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: AlertCircle }
            case 'submitted':
            case 'in_review':
                return { label: 'In Review', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock }
            case 'rejected':
                return { label: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle }
            case 'suspended':
                return { label: 'Suspended', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertCircle }
            default:
                return { label: status, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: AlertCircle }
        }
    }

    const copyToClipboard = async (text: string, type: string) => {
        await navigator.clipboard.writeText(text)
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleSubmit = async () => {
        if (!application) return

        try {
            const response = await fetch(`/api/applications/${application.id}/submit`, {
                method: 'POST'
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit')
            }

            setApplication({ ...application, status: 'submitted' })
        } catch (error: any) {
            alert(error.message)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-slate-800 rounded-lg w-48"></div>
                <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
                <div className="grid grid-cols-3 gap-6">
                    <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
                    <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
                    <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
                </div>
            </div>
        )
    }

    if (!application) {
        return (
            <div className="text-center py-20">
                <AppWindow className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Application not found</h2>
                <p className="text-slate-400 mb-6">This application doesn't exist or you don't have access to it.</p>
                <Link
                    href="/dashboard/applications"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Applications
                </Link>
            </div>
        )
    }

    const status = getStatusConfig(application.status)
    const StatusIcon = status.icon

    const tabs = [
        { id: 'overview', label: 'Overview', icon: AppWindow },
        { id: 'credentials', label: 'Credentials', icon: Key },
        { id: 'oauth', label: 'OAuth Config', icon: Shield },
        { id: 'webhooks', label: 'Webhooks', icon: Webhook },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/applications"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Applications</span>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-600 flex items-center justify-center flex-shrink-0">
                            {application.logo_url ? (
                                <img src={application.logo_url} alt={application.name} className="w-12 h-12 rounded-lg" />
                            ) : (
                                <AppWindow className="w-8 h-8 text-blue-400" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">{application.name}</h1>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium border ${status.color}`}>
                                    <StatusIcon className="w-4 h-4" />
                                    {status.label}
                                </span>
                            </div>
                            <p className="text-slate-400 mt-1">
                                {application.short_description || application.description?.slice(0, 100)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {application.status === 'draft' && (
                            <button
                                onClick={handleSubmit}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all"
                            >
                                <Send className="w-4 h-4" />
                                Submit for Review
                            </button>
                        )}
                        <Link
                            href={`/dashboard/applications/${application.id}/settings`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium text-sm transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </Link>
                    </div>
                </div>
            </div>

            {/* New App Banner */}
            {isNewlyCreated && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3"
                >
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-green-300">Application created successfully!</p>
                        <p className="text-sm text-green-400/80 mt-1">
                            Your client credentials are shown below. Save the client secret - it won't be shown again.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Rejection Notice */}
            {application.status === 'rejected' && application.rejection_reason && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-300">Application rejected</p>
                        <p className="text-sm text-red-400/80 mt-1">{application.rejection_reason}</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-slate-700">
                <div className="flex gap-1 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-blue-400 border-blue-400'
                                    : 'text-slate-400 border-transparent hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stats */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-sm">API Calls</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{(application.total_api_calls || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Users className="w-4 h-4" />
                                    <span className="text-sm">Active Users</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{application.active_installs || 0}</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-sm">Scopes</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{application.allowed_scopes?.length || application.requested_scopes?.length || 0}</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <Globe className="w-4 h-4" />
                                    <span className="text-sm">Environment</span>
                                </div>
                                <p className="text-lg font-bold text-white capitalize">{application.environment}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
                            <p className="text-slate-300 whitespace-pre-wrap">{application.description}</p>
                        </div>

                        {/* URLs */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">URLs</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Website', url: application.website_url },
                                    { label: 'Privacy Policy', url: application.privacy_policy_url },
                                    { label: 'Terms of Service', url: application.terms_of_service_url },
                                    { label: 'Support', url: application.support_url },
                                    { label: 'Documentation', url: application.documentation_url }
                                ].filter(item => item.url).map((item) => (
                                    <div key={item.label} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                        <span className="text-sm text-slate-400">{item.label}</span>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            <span className="truncate max-w-xs">{item.url}</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Info */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-400">Category</p>
                                    <p className="text-white capitalize">{application.category || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Created</p>
                                    <p className="text-white">{formatDate(application.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Last Updated</p>
                                    <p className="text-white">{formatDate(application.updated_at)}</p>
                                </div>
                                {application.submitted_at && (
                                    <div>
                                        <p className="text-sm text-slate-400">Submitted</p>
                                        <p className="text-white">{formatDate(application.submitted_at)}</p>
                                    </div>
                                )}
                                {application.approved_at && (
                                    <div>
                                        <p className="text-sm text-slate-400">Approved</p>
                                        <p className="text-white">{formatDate(application.approved_at)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link
                                    href={`/dashboard/applications/${application.id}/settings`}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
                                >
                                    <Settings className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm text-slate-300">Edit Settings</span>
                                </Link>
                                <button
                                    onClick={() => setActiveTab('credentials')}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors w-full text-left"
                                >
                                    <Key className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm text-slate-300">View Credentials</span>
                                </button>
                                <Link
                                    href="/dashboard/docs"
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
                                >
                                    <Code2 className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm text-slate-300">API Documentation</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'credentials' && (
                <div className="space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">OAuth Credentials</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Client ID</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 p-3 bg-slate-900/50 rounded-lg border border-slate-700 font-mono text-sm text-white">
                                        {showClientId ? application.client_id : '••••••••••••••••••••••••••••'}
                                    </div>
                                    <button
                                        onClick={() => setShowClientId(!showClientId)}
                                        className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                                    >
                                        {showClientId ? <EyeOff className="w-4 h-4 text-white" /> : <Eye className="w-4 h-4 text-white" />}
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(application.client_id, 'client_id')}
                                        className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                                    >
                                        <Copy className={`w-4 h-4 ${copied === 'client_id' ? 'text-green-400' : 'text-white'}`} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Client Secret</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 p-3 bg-slate-900/50 rounded-lg border border-slate-700 font-mono text-sm text-slate-500">
                                        ••••••••••••••••••••••••••••••••••••
                                    </div>
                                    <button
                                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Rotate
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    Client secret is only shown once when created. Use the rotate button to generate a new one.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Environment</h3>
                        <div className="flex items-center gap-4">
                            <div className={`flex-1 p-4 rounded-xl border-2 ${application.environment === 'sandbox' ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-700 bg-slate-900/50'}`}>
                                <p className="font-medium text-white">Sandbox</p>
                                <p className="text-sm text-slate-400">Test with dummy data</p>
                            </div>
                            <div className={`flex-1 p-4 rounded-xl border-2 ${application.environment === 'production' ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-700 bg-slate-900/50'}`}>
                                <p className="font-medium text-white">Production</p>
                                <p className="text-sm text-slate-400">Live data access</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'oauth' && (
                <div className="space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Redirect URIs</h3>
                        <div className="space-y-2">
                            {application.redirect_uris?.map((uri: string) => (
                                <div key={uri} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <code className="text-sm text-slate-300">{uri}</code>
                                    <button
                                        onClick={() => copyToClipboard(uri, 'uri')}
                                        className="p-2 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Scopes</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(application.allowed_scopes?.length > 0 ? application.allowed_scopes : application.requested_scopes)?.map((scope: string) => (
                                <div key={scope} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <code className="text-sm text-slate-300">{scope}</code>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'webhooks' && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
                    <Webhook className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No webhooks configured</h3>
                    <p className="text-slate-400 mb-6">Set up webhooks to receive real-time notifications about events.</p>
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">
                        Add Webhook
                    </button>
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
                    <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Analytics Coming Soon</h3>
                    <p className="text-slate-400">Detailed usage analytics will be available here once your app is live.</p>
                </div>
            )}
        </div>
    )
}

export default function ApplicationDetailPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-slate-800 rounded-lg w-48"></div>
                <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
            </div>
        }>
            <ApplicationDetailContent />
        </Suspense>
    )
}
