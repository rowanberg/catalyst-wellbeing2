'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users,
    Plus,
    Mail,
    Shield,
    MoreVertical,
    Edit2,
    Trash2,
    CheckCircle,
    Clock,
    XCircle,
    Send,
    RefreshCw,
    Crown,
    User,
    Eye
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface TeamMember {
    id: string
    email: string
    full_name: string
    role: string
    status: string
    avatar_url?: string
    joined_at: string
    last_active_at?: string
}

interface Invitation {
    id: string
    email: string
    role: string
    status: string
    created_at: string
    expires_at: string
}

const roles = [
    { id: 'admin', name: 'Admin', description: 'Full access to all apps and settings', color: 'text-purple-400' },
    { id: 'developer', name: 'Developer', description: 'Can manage apps and view analytics', color: 'text-blue-400' },
    { id: 'viewer', name: 'Viewer', description: 'Read-only access to apps and analytics', color: 'text-slate-400' }
]

export default function TeamPage() {
    const [loading, setLoading] = useState(true)
    const [members, setMembers] = useState<TeamMember[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('developer')
    const [sending, setSending] = useState(false)
    const [activeMenu, setActiveMenu] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        const loadTeam = async () => {
            try {
                const { data: { user } } = await devSupabase.auth.getUser()
                if (!user) return

                const { data: account } = await devSupabase
                    .from('developer_accounts')
                    .select('*')
                    .eq('auth_user_id', user.id)
                    .single()

                if (account) {
                    setCurrentUser(account)

                    // Get team members
                    const { data: teamMembers } = await devSupabase
                        .from('developer_team_members')
                        .select('*')
                        .eq('developer_id', account.id)
                        .order('joined_at', { ascending: true })

                    if (teamMembers) setMembers(teamMembers)

                    // Get pending invitations
                    const { data: invites } = await devSupabase
                        .from('developer_team_invitations')
                        .select('*')
                        .eq('developer_id', account.id)
                        .eq('status', 'pending')
                        .order('created_at', { ascending: false })

                    if (invites) setInvitations(invites)
                }
            } catch (error) {
                console.error('Error loading team:', error)
            } finally {
                setLoading(false)
            }
        }

        loadTeam()
    }, [])

    const handleSendInvite = async () => {
        if (!inviteEmail || !currentUser) return

        setSending(true)
        try {
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 7)

            const { data, error } = await devSupabase
                .from('developer_team_invitations')
                .insert({
                    developer_id: currentUser.id,
                    email: inviteEmail,
                    role: inviteRole,
                    status: 'pending',
                    expires_at: expiresAt.toISOString(),
                    invited_by: currentUser.id
                })
                .select()
                .single()

            if (error) throw error

            setInvitations([data, ...invitations])
            setShowInviteModal(false)
            setInviteEmail('')
            setInviteRole('developer')
        } catch (error) {
            console.error('Error sending invite:', error)
        } finally {
            setSending(false)
        }
    }

    const handleCancelInvite = async (inviteId: string) => {
        try {
            await devSupabase
                .from('developer_team_invitations')
                .update({ status: 'cancelled' })
                .eq('id', inviteId)

            setInvitations(invitations.filter(i => i.id !== inviteId))
        } catch (error) {
            console.error('Error cancelling invite:', error)
        }
    }

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this team member?')) return

        try {
            await devSupabase
                .from('developer_team_members')
                .delete()
                .eq('id', memberId)

            setMembers(members.filter(m => m.id !== memberId))
        } catch (error) {
            console.error('Error removing member:', error)
        }
    }

    const handleUpdateRole = async (memberId: string, newRole: string) => {
        try {
            await devSupabase
                .from('developer_team_members')
                .update({ role: newRole })
                .eq('id', memberId)

            setMembers(members.map(m =>
                m.id === memberId ? { ...m, role: newRole } : m
            ))
            setActiveMenu(null)
        } catch (error) {
            console.error('Error updating role:', error)
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return Crown
            case 'admin': return Shield
            case 'developer': return User
            case 'viewer': return Eye
            default: return User
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'owner': return 'text-amber-400 bg-amber-500/20'
            case 'admin': return 'text-purple-400 bg-purple-500/20'
            case 'developer': return 'text-blue-400 bg-blue-500/20'
            case 'viewer': return 'text-slate-400 bg-slate-500/20'
            default: return 'text-slate-400 bg-slate-500/20'
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-10 bg-slate-800 rounded-lg w-1/3"></div>
                <div className="grid grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-800/50 rounded-2xl"></div>
                    ))}
                </div>
                <div className="h-96 bg-slate-800/50 rounded-2xl"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Team Members</h1>
                    <p className="text-slate-400 mt-1">
                        Manage your team and their access permissions
                    </p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all"
                >
                    <Plus className="w-4 h-4" />
                    <span>Invite Member</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Users className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{members.length + 1}</p>
                            <p className="text-sm text-slate-400">Team Members</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-xl">
                            <Clock className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{invitations.length}</p>
                            <p className="text-sm text-slate-400">Pending Invites</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                            <Shield className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{members.filter(m => m.role === 'admin').length + 1}</p>
                            <p className="text-sm text-slate-400">Admins</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members List */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-white">Active Members</h2>
                </div>

                <div className="divide-y divide-slate-700/50">
                    {/* Owner (Current User) */}
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                                {currentUser?.full_name?.charAt(0) || 'O'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-white">{currentUser?.full_name || 'You'}</p>
                                    <span className="text-xs text-amber-400">(You)</span>
                                </div>
                                <p className="text-sm text-slate-400">{currentUser?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${getRoleColor('owner')}`}>
                                <Crown className="w-4 h-4" />
                                Owner
                            </span>
                        </div>
                    </div>

                    {/* Team Members */}
                    {members.map((member) => {
                        const RoleIcon = getRoleIcon(member.role)
                        return (
                            <div key={member.id} className="p-6 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                                        ) : (
                                            member.full_name?.charAt(0) || member.email.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{member.full_name || 'Unnamed'}</p>
                                        <p className="text-sm text-slate-400">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${getRoleColor(member.role)}`}>
                                        <RoleIcon className="w-4 h-4" />
                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </span>
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                        <AnimatePresence>
                                            {activeMenu === member.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-10"
                                                >
                                                    <div className="p-2">
                                                        <p className="px-3 py-1.5 text-xs text-slate-500 font-medium">Change Role</p>
                                                        {roles.map((role) => (
                                                            <button
                                                                key={role.id}
                                                                onClick={() => handleUpdateRole(member.id, role.id)}
                                                                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors ${member.role === role.id
                                                                        ? 'bg-blue-500/20 text-blue-400'
                                                                        : 'text-slate-300 hover:bg-slate-700/50'
                                                                    }`}
                                                            >
                                                                {member.role === role.id && <CheckCircle className="w-4 h-4" />}
                                                                <span>{role.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="border-t border-slate-700 p-2">
                                                        <button
                                                            onClick={() => handleRemoveMember(member.id)}
                                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Remove Member
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {members.length === 0 && (
                        <div className="p-12 text-center">
                            <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No team members yet</h3>
                            <p className="text-slate-400 mb-4">Invite team members to collaborate on your applications.</p>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Invite Member
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h2 className="text-lg font-semibold text-white">Pending Invitations</h2>
                    </div>

                    <div className="divide-y divide-slate-700/50">
                        {invitations.map((invite) => (
                            <div key={invite.id} className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{invite.email}</p>
                                        <p className="text-sm text-slate-400">
                                            Invited as {invite.role} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium">
                                        <Clock className="w-3 h-3" />
                                        Pending
                                    </span>
                                    <button
                                        onClick={() => handleCancelInvite(invite.id)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowInviteModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-700">
                                <h2 className="text-xl font-semibold text-white">Invite Team Member</h2>
                                <p className="text-sm text-slate-400 mt-1">Send an invitation to join your team</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            placeholder="colleague@company.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                                    <div className="space-y-2">
                                        {roles.map((role) => (
                                            <button
                                                key={role.id}
                                                onClick={() => setInviteRole(role.id)}
                                                className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-colors ${inviteRole === role.id
                                                        ? 'bg-blue-500/20 border-blue-500/50'
                                                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${inviteRole === role.id ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                                                    }`}>
                                                    {inviteRole === role.id && <CheckCircle className="w-3 h-3 text-white" />}
                                                </div>
                                                <div className="text-left">
                                                    <p className={`font-medium ${inviteRole === role.id ? 'text-white' : 'text-slate-300'}`}>
                                                        {role.name}
                                                    </p>
                                                    <p className="text-sm text-slate-500">{role.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-700 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendInvite}
                                    disabled={sending || !inviteEmail}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold text-sm transition-all"
                                >
                                    {sending ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    <span>{sending ? 'Sending...' : 'Send Invitation'}</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
