'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Shield,
    Key,
    Lock,
    Smartphone,
    Globe,
    Clock,
    AlertTriangle,
    CheckCircle,
    Copy,
    Eye,
    EyeOff,
    Plus,
    Trash2,
    RefreshCw,
    LogOut,
    MapPin
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface APIKey {
    id: string
    name: string
    last_four: string
    scopes: string[]
    created_at: string
    last_used_at?: string
    expires_at?: string
    is_active: boolean
}

interface Session {
    id: string
    ip_address: string
    user_agent: string
    location?: string
    created_at: string
    last_active_at: string
    is_current: boolean
}

export default function SecurityPage() {
    const [loading, setLoading] = useState(true)
    const [apiKeys, setApiKeys] = useState<APIKey[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [showNewKeyModal, setShowNewKeyModal] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [newKeySecret, setNewKeySecret] = useState<string | null>(null)
    const [creating, setCreating] = useState(false)
    const [copied, setCopied] = useState(false)
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

    useEffect(() => {
        const loadSecurityData = async () => {
            try {
                const { data: { user } } = await devSupabase.auth.getUser()
                if (!user) return

                const { data: account } = await devSupabase
                    .from('developer_accounts')
                    .select('*')
                    .eq('auth_user_id', user.id)
                    .single()

                if (!account) return

                // Get API keys
                const { data: keys } = await devSupabase
                    .from('application_api_keys')
                    .select('*')
                    .eq('developer_id', account.id)
                    .order('created_at', { ascending: false })

                if (keys) setApiKeys(keys)

                // Mock sessions for demo
                setSessions([
                    {
                        id: '1',
                        ip_address: '192.168.1.1',
                        user_agent: 'Chrome 120 on Windows',
                        location: 'Mumbai, India',
                        created_at: new Date().toISOString(),
                        last_active_at: new Date().toISOString(),
                        is_current: true
                    },
                    {
                        id: '2',
                        ip_address: '10.0.0.1',
                        user_agent: 'Firefox 121 on macOS',
                        location: 'Bangalore, India',
                        created_at: new Date(Date.now() - 86400000).toISOString(),
                        last_active_at: new Date(Date.now() - 3600000).toISOString(),
                        is_current: false
                    }
                ])

                setTwoFactorEnabled(account.two_factor_enabled || false)
            } catch (error) {
                console.error('Error loading security data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadSecurityData()
    }, [])

    const handleCreateKey = async () => {
        if (!newKeyName) return

        setCreating(true)
        try {
            const { data: { user } } = await devSupabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: account } = await devSupabase
                .from('developer_accounts')
                .select('id')
                .eq('auth_user_id', user.id)
                .single()

            if (!account) throw new Error('Account not found')

            // Generate API key
            const keySecret = `cw_dk_${Array.from({ length: 40 }, () =>
                'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]
            ).join('')}`
            const lastFour = keySecret.slice(-4)

            const { data: key, error } = await devSupabase
                .from('application_api_keys')
                .insert({
                    developer_id: account.id,
                    name: newKeyName,
                    key_hash: keySecret, // In production, hash this
                    last_four: lastFour,
                    scopes: ['*'],
                    is_active: true
                })
                .select()
                .single()

            if (error) throw error

            setApiKeys([key, ...apiKeys])
            setNewKeySecret(keySecret)
        } catch (error) {
            console.error('Error creating API key:', error)
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteKey = async (keyId: string) => {
        if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return

        try {
            await devSupabase
                .from('application_api_keys')
                .delete()
                .eq('id', keyId)

            setApiKeys(apiKeys.filter(k => k.id !== keyId))
        } catch (error) {
            console.error('Error deleting key:', error)
        }
    }

    const handleRevokeSession = async (sessionId: string) => {
        if (!confirm('Are you sure you want to revoke this session?')) return
        setSessions(sessions.filter(s => s.id !== sessionId))
    }

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
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
                <div className="h-48 bg-slate-800/50 rounded-2xl"></div>
                <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Security Settings</h1>
                <p className="text-slate-400 mt-1">Manage API keys, sessions, and account security</p>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <Smartphone className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Add an extra layer of security to your account with 2FA
                            </p>
                        </div>
                    </div>
                    <button
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${twoFactorEnabled
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
                    </button>
                </div>
            </div>

            {/* API Keys */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">API Keys</h2>
                        <p className="text-sm text-slate-400 mt-1">Manage keys for direct API access</p>
                    </div>
                    <button
                        onClick={() => {
                            setNewKeyName('')
                            setNewKeySecret(null)
                            setShowNewKeyModal(true)
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Key
                    </button>
                </div>

                {apiKeys.length === 0 ? (
                    <div className="p-12 text-center">
                        <Key className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No API keys</h3>
                        <p className="text-slate-400 mb-4">Create an API key for programmatic access</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {apiKeys.map((key) => (
                            <div key={key.id} className="p-6 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${key.is_active ? 'bg-green-500/20' : 'bg-slate-500/20'}`}>
                                        <Key className={`w-5 h-5 ${key.is_active ? 'text-green-400' : 'text-slate-400'}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-white">{key.name}</p>
                                            <code className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                                                ****{key.last_four}
                                            </code>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                            <span>Created {formatDate(key.created_at)}</span>
                                            {key.last_used_at && (
                                                <span>Last used {formatDate(key.last_used_at)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteKey(key.id)}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Active Sessions */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-white">Active Sessions</h2>
                    <p className="text-sm text-slate-400 mt-1">Manage devices logged into your account</p>
                </div>

                <div className="divide-y divide-slate-700/50">
                    {sessions.map((session) => (
                        <div key={session.id} className="p-6 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${session.is_current ? 'bg-green-500/20' : 'bg-slate-500/20'}`}>
                                    <Globe className={`w-5 h-5 ${session.is_current ? 'text-green-400' : 'text-slate-400'}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-white">{session.user_agent}</p>
                                        {session.is_current && (
                                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {session.location || 'Unknown'}
                                        </span>
                                        <span>{session.ip_address}</span>
                                        <span>Active {formatDate(session.last_active_at)}</span>
                                    </div>
                                </div>
                            </div>
                            {!session.is_current && (
                                <button
                                    onClick={() => handleRevokeSession(session.id)}
                                    className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    Revoke
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-700">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sign out all other sessions
                    </button>
                </div>
            </div>

            {/* Password */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Lock className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Password</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Last changed 30 days ago
                            </p>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors">
                        Change Password
                    </button>
                </div>
            </div>

            {/* Create API Key Modal */}
            <AnimatePresence>
                {showNewKeyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => !newKeySecret && setShowNewKeyModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-700">
                                <h2 className="text-xl font-semibold text-white">
                                    {newKeySecret ? 'API Key Created' : 'Create API Key'}
                                </h2>
                            </div>

                            <div className="p-6">
                                {newKeySecret ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-green-300">Key created successfully!</p>
                                                    <p className="text-sm text-green-400/80 mt-1">
                                                        Copy this key now. It won't be shown again.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Your API Key</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={newKeySecret}
                                                    readOnly
                                                    className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white font-mono text-sm"
                                                />
                                                <button
                                                    onClick={() => copyToClipboard(newKeySecret)}
                                                    className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
                                                >
                                                    {copied ? (
                                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                                    ) : (
                                                        <Copy className="w-5 h-5 text-white" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Key Name</label>
                                        <input
                                            type="text"
                                            value={newKeyName}
                                            onChange={(e) => setNewKeyName(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="e.g., Production Server"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-700 flex items-center justify-end gap-3">
                                {newKeySecret ? (
                                    <button
                                        onClick={() => {
                                            setShowNewKeyModal(false)
                                            setNewKeySecret(null)
                                        }}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm"
                                    >
                                        Done
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowNewKeyModal(false)}
                                            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateKey}
                                            disabled={creating || !newKeyName}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold text-sm transition-all"
                                        >
                                            {creating ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Key className="w-4 h-4" />
                                            )}
                                            <span>{creating ? 'Creating...' : 'Create Key'}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
