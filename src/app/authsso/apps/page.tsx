'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
    Shield, CheckCircle, X, ChevronRight, Lock, ExternalLink,
    Clock, AlertTriangle, Loader2, Trash2, Check,
    ArrowLeft, Key, ChevronDown
} from 'lucide-react'
import { useAppSelector } from '@/lib/redux/hooks'

interface ConnectedApp {
    id: string
    app: {
        id: string
        clientId: string
        name: string
        description: string
        logoUrl: string | null
        websiteUrl: string | null
        developer: string
        isVerified: boolean
        isFirstParty: boolean
        trustLevel: string
    }
    scopes: string[]
    firstAuthorizedAt: string
    lastAuthorizedAt: string
    lastActivityAt: string | null
    authorizationCount: number
    activeTokens: number
    isRevoked: boolean
}

const SCOPE_NAMES: Record<string, string> = {
    'profile.read': 'View your profile',
    'profile.email': 'View your email',
    'profile.write': 'Update your profile',
    'student.classes.read': 'View your classes',
    'student.grades.read': 'View your grades',
    'student.assignments.read': 'View assignments',
    'student.attendance.read': 'View attendance',
    'student.wellbeing.read': 'View wellbeing data',
    'student.achievements.read': 'View achievements',
    'teacher.students.read': 'View students',
    'teacher.grades.write': 'Manage grades',
    'teacher.attendance.write': 'Mark attendance',
    'teacher.analytics.read': 'View analytics',
    'parent.children.read': 'View children\'s info',
    'parent.grades.read': 'View children\'s grades',
    'parent.communications.read': 'Read communications',
    'admin.users.read': 'View all users',
    'admin.reports.read': 'View reports',
    'calendar.read': 'View calendar',
    'notifications.write': 'Send notifications',
    'school.read': 'View school info'
}

export default function ConnectedAppsPage() {
    const { user, profile, isLoading: authLoading } = useAppSelector((state) => state.auth)

    const [apps, setApps] = useState<ConnectedApp[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [revoking, setRevoking] = useState<string | null>(null)
    const [showRevokeConfirm, setShowRevokeConfirm] = useState<string | null>(null)
    const [expandedApp, setExpandedApp] = useState<string | null>(null)
    const [stats, setStats] = useState({ total: 0, active: 0 })

    useEffect(() => {
        if (!user) return

        const fetchApps = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/oauth/apps')

                if (!response.ok) {
                    throw new Error('Failed to fetch connected apps')
                }

                const data = await response.json()
                setApps(data.apps || [])
                setStats({ total: data.total || 0, active: data.active || 0 })
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchApps()
    }, [user])

    const handleRevokeAccess = async (appId: string) => {
        setRevoking(appId)

        try {
            const response = await fetch(`/api/oauth/apps?app_id=${appId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to revoke access')
            }

            setApps(prev => prev.map(app =>
                app.app.id === appId
                    ? { ...app, isRevoked: true, activeTokens: 0 }
                    : app
            ))
            setStats(prev => ({ ...prev, active: prev.active - 1 }))
            setShowRevokeConfirm(null)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setRevoking(null)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatRelativeTime = (dateStr: string | null) => {
        if (!dateStr) return 'Never'

        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} minutes ago`
        if (diffHours < 24) return `${diffHours} hours ago`
        if (diffDays < 7) return `${diffDays} days ago`
        return formatDate(dateStr)
    }

    if (authLoading || loading) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#60a5fa' }} />
            </div>
        )
    }

    if (!user) {
        return null
    }

    const activeApps = apps.filter(a => !a.isRevoked)
    const revokedApps = apps.filter(a => a.isRevoked)

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 24px',
                backgroundColor: '#171717',
                borderBottom: '1px solid #262626'
            }}>
                <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #10b981, #f59e0b)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>C</span>
                </div>
                <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 500 }}>CatalystWells Account</span>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>
                {/* Page Header */}
                <div style={{ marginBottom: '32px' }}>
                    <Link
                        href="/student/settings"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#60a5fa',
                            fontSize: '14px',
                            textDecoration: 'none',
                            marginBottom: '24px'
                        }}
                    >
                        <ArrowLeft style={{ width: '16px', height: '16px' }} />
                        Back to Settings
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Key style={{ width: '24px', height: '24px', color: 'white' }} />
                        </div>
                        <div>
                            <h1 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 500, margin: 0 }}>
                                Third-party apps & services
                            </h1>
                            <p style={{ color: '#a3a3a3', fontSize: '14px', margin: '4px 0 0 0' }}>
                                Manage apps that have access to your CatalystWells account
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    <div style={{
                        backgroundColor: '#171717',
                        border: '1px solid #262626',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <div style={{ color: '#ffffff', fontSize: '36px', fontWeight: 600, marginBottom: '4px' }}>{stats.active}</div>
                        <div style={{ color: '#a3a3a3', fontSize: '14px' }}>Active apps</div>
                    </div>
                    <div style={{
                        backgroundColor: '#171717',
                        border: '1px solid #262626',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <div style={{ color: '#ffffff', fontSize: '36px', fontWeight: 600, marginBottom: '4px' }}>{stats.total - stats.active}</div>
                        <div style={{ color: '#a3a3a3', fontSize: '14px' }}>Revoked apps</div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        backgroundColor: '#7f1d1d',
                        border: '1px solid #991b1b',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                    }}>
                        <AlertTriangle style={{ width: '20px', height: '20px', color: '#fca5a5', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <p style={{ color: '#fecaca', fontSize: '14px', margin: 0 }}>{error}</p>
                            <button
                                onClick={() => setError(null)}
                                style={{
                                    color: '#fca5a5',
                                    fontSize: '13px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    marginTop: '8px',
                                    textDecoration: 'underline'
                                }}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Active Apps */}
                {activeApps.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{
                            color: '#ffffff',
                            fontSize: '18px',
                            fontWeight: 500,
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />
                            Apps with access to your account
                        </h2>

                        <div style={{
                            backgroundColor: '#171717',
                            border: '1px solid #262626',
                            borderRadius: '16px',
                            overflow: 'hidden'
                        }}>
                            {activeApps.map((app, index) => (
                                <div
                                    key={app.id}
                                    style={{
                                        padding: '20px',
                                        borderBottom: index < activeApps.length - 1 ? '1px solid #262626' : 'none'
                                    }}
                                >
                                    {/* App Header */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {app.app.logoUrl ? (
                                                <img src={app.app.logoUrl} alt={app.app.name} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                            ) : (
                                                <span style={{ color: 'white', fontSize: '20px', fontWeight: 700 }}>
                                                    {app.app.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                <h3 style={{ color: '#ffffff', fontSize: '16px', fontWeight: 500, margin: 0 }}>{app.app.name}</h3>
                                                {app.app.isVerified && (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        backgroundColor: '#1e3a8a',
                                                        color: '#93c5fd',
                                                        fontSize: '11px',
                                                        fontWeight: 500,
                                                        padding: '2px 8px',
                                                        borderRadius: '9999px'
                                                    }}>
                                                        <CheckCircle style={{ width: '12px', height: '12px' }} />
                                                        Verified
                                                    </span>
                                                )}
                                                {app.app.isFirstParty && (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        backgroundColor: '#14532d',
                                                        color: '#86efac',
                                                        fontSize: '11px',
                                                        fontWeight: 500,
                                                        padding: '2px 8px',
                                                        borderRadius: '9999px'
                                                    }}>
                                                        Official
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ color: '#a3a3a3', fontSize: '13px', margin: '0 0 8px 0' }}>{app.app.developer}</p>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#737373' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock style={{ width: '14px', height: '14px' }} />
                                                    Last used: {formatRelativeTime(app.lastActivityAt)}
                                                </span>
                                                <span>Connected: {formatDate(app.firstAuthorizedAt)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                                            style={{
                                                padding: '8px',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                color: '#a3a3a3',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#262626'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <ChevronRight
                                                style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    transform: expandedApp === app.id ? 'rotate(90deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s'
                                                }}
                                            />
                                        </button>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {expandedApp === app.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #262626' }}>
                                                    {/* Permissions */}
                                                    <div style={{ marginBottom: '20px' }}>
                                                        <h4 style={{
                                                            color: '#ffffff',
                                                            fontSize: '14px',
                                                            fontWeight: 500,
                                                            marginBottom: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            <Lock style={{ width: '16px', height: '16px' }} />
                                                            Permissions granted
                                                        </h4>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                                                            {app.scopes.map((scope) => (
                                                                <div key={scope} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a3a3a3', fontSize: '13px' }}>
                                                                    <Check style={{ width: '16px', height: '16px', color: '#10b981', flexShrink: 0 }} />
                                                                    {SCOPE_NAMES[scope] || scope}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* App Description */}
                                                    {app.app.description && (
                                                        <p style={{ color: '#a3a3a3', fontSize: '14px', marginBottom: '20px' }}>{app.app.description}</p>
                                                    )}

                                                    {/* Actions */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                        {app.app.websiteUrl && (
                                                            <a
                                                                href={app.app.websiteUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    color: '#60a5fa',
                                                                    fontSize: '14px',
                                                                    textDecoration: 'none'
                                                                }}
                                                            >
                                                                <ExternalLink style={{ width: '16px', height: '16px' }} />
                                                                Visit website
                                                            </a>
                                                        )}

                                                        {showRevokeConfirm === app.app.id ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                                                                <span style={{ color: '#a3a3a3', fontSize: '14px' }}>Revoke access?</span>
                                                                <button
                                                                    onClick={() => setShowRevokeConfirm(null)}
                                                                    style={{
                                                                        padding: '8px 16px',
                                                                        backgroundColor: 'transparent',
                                                                        border: '1px solid #404040',
                                                                        borderRadius: '8px',
                                                                        color: '#ffffff',
                                                                        fontSize: '13px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRevokeAccess(app.app.id)}
                                                                    disabled={revoking === app.app.id}
                                                                    style={{
                                                                        padding: '8px 16px',
                                                                        backgroundColor: '#dc2626',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        color: 'white',
                                                                        fontSize: '13px',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        opacity: revoking === app.app.id ? 0.5 : 1
                                                                    }}
                                                                >
                                                                    {revoking === app.app.id ? (
                                                                        <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                                                                    ) : (
                                                                        'Revoke'
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setShowRevokeConfirm(app.app.id)}
                                                                style={{
                                                                    marginLeft: 'auto',
                                                                    padding: '8px 16px',
                                                                    backgroundColor: 'transparent',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    color: '#ef4444',
                                                                    fontSize: '13px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7f1d1d'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                <Trash2 style={{ width: '16px', height: '16px' }} />
                                                                Remove access
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Active Apps */}
                {activeApps.length === 0 && !loading && (
                    <div style={{
                        backgroundColor: '#171717',
                        border: '1px solid #262626',
                        borderRadius: '16px',
                        padding: '48px 24px',
                        textAlign: 'center',
                        marginBottom: '32px'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: '#262626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <Shield style={{ width: '32px', height: '32px', color: '#737373' }} />
                        </div>
                        <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>No connected apps</h3>
                        <p style={{ color: '#a3a3a3', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                            When you authorize third-party apps to access your CatalystWells account, they'll appear here.
                        </p>
                    </div>
                )}

                {/* Revoked Apps */}
                {revokedApps.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{
                            color: '#ffffff',
                            fontSize: '18px',
                            fontWeight: 500,
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <X style={{ width: '20px', height: '20px', color: '#737373' }} />
                            Previously connected apps
                        </h2>

                        <div style={{
                            backgroundColor: '#171717',
                            border: '1px solid #262626',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            opacity: 0.6
                        }}>
                            {revokedApps.map((app, index) => (
                                <div
                                    key={app.id}
                                    style={{
                                        padding: '16px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        borderBottom: index < revokedApps.length - 1 ? '1px solid #262626' : 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        backgroundColor: '#262626',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <span style={{ color: '#737373', fontSize: '18px', fontWeight: 700 }}>
                                            {app.app.name.charAt(0)}
                                        </span>
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ color: '#a3a3a3', fontSize: '15px', fontWeight: 500, margin: 0 }}>{app.app.name}</h3>
                                        <p style={{ color: '#737373', fontSize: '12px', margin: '2px 0 0 0' }}>Access revoked</p>
                                    </div>

                                    <span style={{
                                        padding: '4px 12px',
                                        backgroundColor: '#262626',
                                        border: '1px solid #404040',
                                        borderRadius: '9999px',
                                        color: '#737373',
                                        fontSize: '11px',
                                        fontWeight: 500
                                    }}>
                                        Revoked
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Security Tips */}
                <div style={{
                    backgroundColor: '#1e3a8a',
                    border: '1px solid #1e40af',
                    borderRadius: '16px',
                    padding: '20px'
                }}>
                    <h3 style={{
                        color: '#93c5fd',
                        fontSize: '16px',
                        fontWeight: 500,
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Shield style={{ width: '20px', height: '20px' }} />
                        Security tips
                    </h3>
                    <ul style={{ color: '#bfdbfe', fontSize: '14px', lineHeight: 1.6, margin: 0, paddingLeft: '20px' }}>
                        <li>Only authorize apps from developers you trust</li>
                        <li>Review permissions carefully before authorizing</li>
                        <li>Remove apps you no longer use</li>
                        <li>Verified apps have been reviewed by CatalystWells</li>
                    </ul>
                </div>
            </main>

            {/* Footer */}
            <footer style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderTop: '1px solid #262626',
                marginTop: '48px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#a3a3a3',
                    fontSize: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                }}>
                    English (United States)
                    <ChevronDown style={{ width: '12px', height: '12px' }} />
                </button>
                <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <a href="#" style={{ color: '#a3a3a3', fontSize: '12px', textDecoration: 'none' }}>Help</a>
                    <a href="/privacy" style={{ color: '#a3a3a3', fontSize: '12px', textDecoration: 'none' }}>Privacy</a>
                    <a href="/terms" style={{ color: '#a3a3a3', fontSize: '12px', textDecoration: 'none' }}>Terms</a>
                </nav>
            </footer>
        </div>
    )
}
