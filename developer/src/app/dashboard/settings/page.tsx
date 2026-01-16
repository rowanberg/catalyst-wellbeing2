'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    User,
    Mail,
    Building2,
    Globe,
    Camera,
    Save,
    AlertCircle,
    CheckCircle,
    Key,
    Shield,
    Bell,
    Trash2
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface DeveloperAccount {
    id: string
    auth_user_id: string
    email: string
    full_name: string
    company_name: string
    company_website: string
    avatar_url: string
    api_key_count: number
    created_at: string
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [account, setAccount] = useState<DeveloperAccount | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [formData, setFormData] = useState({
        full_name: '',
        company_name: '',
        company_website: '',
        avatar_url: ''
    })

    useEffect(() => {
        const loadAccount = async () => {
            try {
                const { data: { user } } = await devSupabase.auth.getUser()
                if (!user) return

                const { data: accountData } = await devSupabase
                    .from('developer_accounts')
                    .select('*')
                    .eq('auth_user_id', user.id)
                    .single()

                if (accountData) {
                    setAccount(accountData)
                    setFormData({
                        full_name: accountData.full_name || '',
                        company_name: accountData.company_name || '',
                        company_website: accountData.company_website || '',
                        avatar_url: accountData.avatar_url || ''
                    })
                }
            } catch (error) {
                console.error('Error loading account:', error)
            } finally {
                setLoading(false)
            }
        }

        loadAccount()
    }, [])

    const handleSave = async () => {
        if (!account) return

        setSaving(true)
        setMessage(null)

        try {
            const { error } = await devSupabase
                .from('developer_accounts')
                .update({
                    full_name: formData.full_name,
                    company_name: formData.company_name || null,
                    company_website: formData.company_website || null,
                    avatar_url: formData.avatar_url || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', account.id)

            if (error) throw error

            setMessage({ type: 'success', text: 'Settings saved successfully!' })
            setAccount({ ...account, ...formData })
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to save settings' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-10 bg-slate-800 rounded-lg w-1/3"></div>
                <div className="h-96 bg-slate-800/50 rounded-2xl"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Account Settings</h1>
                <p className="text-slate-400 mt-1">Manage your developer account and preferences</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 overflow-x-auto pb-2">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 rounded-xl">
                    <User className="w-4 h-4" />
                    Profile
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
                    <Key className="w-4 h-4" />
                    API Keys
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
                    <Shield className="w-4 h-4" />
                    Security
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
                    <Bell className="w-4 h-4" />
                    Notifications
                </button>
            </div>

            {/* Message */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-start gap-3 ${message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-red-500/10 border border-red-500/20'
                        }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    )}
                    <p className={`text-sm ${message.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                        {message.text}
                    </p>
                </motion.div>
            )}

            {/* Profile Settings */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-white">Profile Information</h2>
                    <p className="text-sm text-slate-400 mt-1">Update your developer profile details</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                {formData.avatar_url ? (
                                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-white">
                                        {formData.full_name?.charAt(0) || 'D'}
                                    </span>
                                )}
                            </div>
                            <button className="absolute -bottom-2 -right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 transition-colors">
                                <Camera className="w-4 h-4 text-white" />
                            </button>
                        </div>
                        <div>
                            <h3 className="font-medium text-white">Profile Picture</h3>
                            <p className="text-sm text-slate-400">PNG, JPG up to 5MB</p>
                        </div>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                value={account?.email || ''}
                                disabled
                                className="w-full pl-12 pr-4 py-3 bg-slate-900/30 border border-slate-700 rounded-xl text-slate-400 cursor-not-allowed"
                            />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Email cannot be changed</p>
                    </div>

                    {/* Company Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Company Name <span className="text-slate-500">(optional)</span>
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="My Company Inc."
                            />
                        </div>
                    </div>

                    {/* Company Website */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Company Website <span className="text-slate-500">(optional)</span>
                        </label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="url"
                                value={formData.company_website}
                                onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="https://mycompany.com"
                            />
                        </div>
                    </div>

                    {/* Avatar URL */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Avatar URL <span className="text-slate-500">(optional)</span>
                        </label>
                        <input
                            type="url"
                            value={formData.avatar_url}
                            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="https://example.com/avatar.png"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Member since {new Date(account?.created_at || '').toLocaleDateString()}
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold text-sm transition-all"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/30 rounded-2xl">
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
                    <p className="text-sm text-slate-400 mt-1">Irreversible and destructive actions</p>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-medium">Delete Account</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Permanently delete your developer account and all applications
                            </p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-colors">
                            <Trash2 className="w-4 h-4" />
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
