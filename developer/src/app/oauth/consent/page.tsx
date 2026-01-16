'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Shield,
    Check,
    X,
    AlertTriangle,
    User,
    Mail,
    Calendar,
    BookOpen,
    Users,
    Building2,
    Brain,
    Bell,
    ChevronDown,
    ExternalLink,
    Lock
} from 'lucide-react'

interface AppInfo {
    id: string
    name: string
    description: string
    logo_url?: string
    website_url: string
    privacy_policy_url: string
    is_verified: boolean
    trust_level: string
}

interface ScopeInfo {
    scope_name: string
    display_name: string
    description: string
    category: string
    risk_level: string
}

interface UserInfo {
    id: string
    email: string
    name: string
}

const scopeIcons: { [key: string]: React.ElementType } = {
    profile: User,
    email: Mail,
    student: BookOpen,
    teacher: Users,
    parent: Users,
    school: Building2,
    wellbeing: Brain,
    notifications: Bell,
    calendar: Calendar
}

const riskColors: { [key: string]: string } = {
    low: 'text-green-400 bg-green-500/10 border-green-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    critical: 'text-red-400 bg-red-500/10 border-red-500/30'
}

export default function ConsentPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [app, setApp] = useState<AppInfo | null>(null)
    const [scopes, setScopes] = useState<ScopeInfo[]>([])
    const [user, setUser] = useState<UserInfo | null>(null)
    const [params, setParams] = useState<any>(null)
    const [expandedScopes, setExpandedScopes] = useState<{ [key: string]: boolean }>({})

    useEffect(() => {
        const fetchConsentData = async () => {
            try {
                const queryString = searchParams.toString()
                const response = await fetch(`/api/oauth/authorize?${queryString}`)

                if (!response.ok) {
                    const data = await response.json()
                    if (response.status === 401) {
                        // Redirect to login
                        router.push(`/login?return_to=${encodeURIComponent(window.location.href)}`)
                        return
                    }
                    throw new Error(data.error_description || 'Failed to load consent data')
                }

                const data = await response.json()

                // Check if we got a redirect (auto-approved)
                if (data.redirect_url) {
                    window.location.href = data.redirect_url
                    return
                }

                setApp(data.app)
                setScopes(data.scopes)
                setUser(data.user)
                setParams(data.params)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchConsentData()
    }, [searchParams, router])

    const handleDecision = async (decision: 'approve' | 'deny') => {
        setSubmitting(true)
        try {
            const response = await fetch('/api/oauth/authorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...params,
                    decision
                })
            })

            const data = await response.json()

            if (data.redirect_url) {
                window.location.href = data.redirect_url
            } else if (data.error) {
                setError(data.error_description || data.error)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const toggleScope = (scopeName: string) => {
        setExpandedScopes(prev => ({
            ...prev,
            [scopeName]: !prev[scopeName]
        }))
    }

    // Group scopes by category
    const groupedScopes = scopes.reduce((acc: { [key: string]: ScopeInfo[] }, scope) => {
        const cat = scope.category || 'other'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(scope)
        return acc
    }, {})

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
                    <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Authorization Error</h1>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={() => window.close()}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-700 text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        {/* App Logo */}
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                            {app?.logo_url ? (
                                <img src={app.logo_url} alt={app.name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <ChevronDown className="w-6 h-6 text-slate-500 rotate-[-90deg]" />
                        {/* CatalystWells Logo */}
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <h1 className="text-xl font-bold text-white mb-1">
                        {app?.name || 'Application'}
                    </h1>
                    <p className="text-slate-400 text-sm">
                        wants to access your CatalystWells account
                    </p>

                    {app?.is_verified && (
                        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                            <Shield className="w-3 h-3" />
                            Verified Application
                        </div>
                    )}
                </div>

                {/* User Info */}
                <div className="px-6 py-4 bg-slate-900/30 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{user?.name}</p>
                            <p className="text-xs text-slate-400">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Permissions */}
                <div className="p-6">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
                        This application will be able to:
                    </h2>

                    <div className="space-y-3">
                        {Object.entries(groupedScopes).map(([category, categoryScopes]) => {
                            const Icon = scopeIcons[category] || Shield

                            return (
                                <div key={category} className="bg-slate-900/30 rounded-xl overflow-hidden border border-slate-700/50">
                                    <div className="flex items-start gap-3 p-4">
                                        <div className="p-2 bg-blue-500/20 rounded-lg">
                                            <Icon className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white capitalize">{category}</p>
                                            <div className="mt-2 space-y-2">
                                                {categoryScopes.map((scope) => (
                                                    <div key={scope.scope_name} className="flex items-start gap-2">
                                                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm text-slate-300">{scope.display_name}</p>
                                                            <p className="text-xs text-slate-500">{scope.description}</p>
                                                            {scope.risk_level === 'high' || scope.risk_level === 'critical' ? (
                                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium border ${riskColors[scope.risk_level]}`}>
                                                                    {scope.risk_level === 'critical' ? '⚠️ Sensitive' : 'Sensitive'}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Privacy Notice */}
                    <div className="mt-6 p-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                        <div className="flex items-start gap-3">
                            <Lock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-slate-400">
                                <p className="mb-2">
                                    By clicking Allow, you permit this app to use your information in
                                    accordance with their{' '}
                                    <a
                                        href={app?.privacy_policy_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline inline-flex items-center gap-1"
                                    >
                                        privacy policy
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </p>
                                <p>You can revoke this access at any time from your account settings.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 border-t border-slate-700 bg-slate-900/30">
                    <button
                        onClick={() => handleDecision('deny')}
                        disabled={submitting}
                        className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <X className="w-5 h-5" />
                        Deny
                    </button>
                    <button
                        onClick={() => handleDecision('approve')}
                        disabled={submitting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Check className="w-5 h-5" />
                        )}
                        Allow
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
