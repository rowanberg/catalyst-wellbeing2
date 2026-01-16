'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Search,
    Shield,
    Eye,
    Edit,
    Bell,
    ChevronRight,
    Copy,
    Check,
    AlertTriangle,
    CheckCircle,
    Info
} from 'lucide-react'

interface Scope {
    name: string
    description: string
    access: 'read' | 'write' | 'notify'
    sensitivity: 'low' | 'medium' | 'high'
    userTypes: ('student' | 'teacher' | 'parent' | 'admin')[]
    requiresConsent: boolean
}

const scopes: { category: string; scopes: Scope[] }[] = [
    {
        category: 'Profile',
        scopes: [
            { name: 'profile.read', description: 'Read basic profile information (name, email)', access: 'read', sensitivity: 'low', userTypes: ['student', 'teacher', 'parent'], requiresConsent: false },
            { name: 'profile.write', description: 'Update profile information', access: 'write', sensitivity: 'medium', userTypes: ['student', 'teacher', 'parent'], requiresConsent: true }
        ]
    },
    {
        category: 'Student Data',
        scopes: [
            { name: 'student.profile.read', description: 'Read student profile details', access: 'read', sensitivity: 'low', userTypes: ['student', 'parent', 'teacher'], requiresConsent: false },
            { name: 'student.academic.read', description: 'Read grades, marks, and academic records', access: 'read', sensitivity: 'medium', userTypes: ['student', 'parent', 'teacher'], requiresConsent: true },
            { name: 'student.attendance.read', description: 'Read attendance records', access: 'read', sensitivity: 'medium', userTypes: ['student', 'parent', 'teacher'], requiresConsent: true },
            { name: 'student.timetable.read', description: 'Read class timetable', access: 'read', sensitivity: 'low', userTypes: ['student', 'parent', 'teacher'], requiresConsent: false },
            { name: 'student.wellbeing.read', description: 'Read wellbeing metrics and mood data', access: 'read', sensitivity: 'high', userTypes: ['student', 'parent'], requiresConsent: true },
            { name: 'student.notifications.send', description: 'Send notifications to students', access: 'notify', sensitivity: 'medium', userTypes: ['admin'], requiresConsent: true }
        ]
    },
    {
        category: 'Teacher Data',
        scopes: [
            { name: 'teacher.profile.read', description: 'Read teacher profile details', access: 'read', sensitivity: 'low', userTypes: ['teacher', 'admin'], requiresConsent: false },
            { name: 'teacher.classes.read', description: 'Read assigned classes and sections', access: 'read', sensitivity: 'low', userTypes: ['teacher', 'admin'], requiresConsent: false },
            { name: 'teacher.students.read', description: 'Read students in assigned classes', access: 'read', sensitivity: 'medium', userTypes: ['teacher'], requiresConsent: true }
        ]
    },
    {
        category: 'Parent Data',
        scopes: [
            { name: 'parent.profile.read', description: 'Read parent profile details', access: 'read', sensitivity: 'low', userTypes: ['parent'], requiresConsent: false },
            { name: 'parent.children.read', description: 'Read linked children profiles', access: 'read', sensitivity: 'low', userTypes: ['parent'], requiresConsent: false },
            { name: 'parent.grades.read', description: 'Read children\'s grades', access: 'read', sensitivity: 'medium', userTypes: ['parent'], requiresConsent: true }
        ]
    },
    {
        category: 'School Structure',
        scopes: [
            { name: 'school.structure.read', description: 'Read school structure (grades, sections)', access: 'read', sensitivity: 'low', userTypes: ['student', 'teacher', 'parent', 'admin'], requiresConsent: false },
            { name: 'school.classes.read', description: 'Read class information', access: 'read', sensitivity: 'low', userTypes: ['student', 'teacher', 'parent', 'admin'], requiresConsent: false },
            { name: 'school.calendar.read', description: 'Read academic calendar and terms', access: 'read', sensitivity: 'low', userTypes: ['student', 'teacher', 'parent', 'admin'], requiresConsent: false }
        ]
    },
    {
        category: 'Calendar & Events',
        scopes: [
            { name: 'calendar.read', description: 'Read calendar events', access: 'read', sensitivity: 'low', userTypes: ['student', 'teacher', 'parent'], requiresConsent: false },
            { name: 'calendar.write', description: 'Create and modify calendar events', access: 'write', sensitivity: 'medium', userTypes: ['teacher', 'admin'], requiresConsent: true }
        ]
    }
]

const accessIcons = {
    read: { icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    write: { icon: Edit, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    notify: { icon: Bell, color: 'text-purple-400', bg: 'bg-purple-500/10' }
}

const sensitivityColors = {
    low: 'bg-green-500/10 text-green-400 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-500/20'
}

export default function ScopesPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [copiedScope, setCopiedScope] = useState<string | null>(null)

    const copyScope = async (scope: string) => {
        await navigator.clipboard.writeText(scope)
        setCopiedScope(scope)
        setTimeout(() => setCopiedScope(null), 2000)
    }

    const filteredScopes = scopes.map(category => ({
        ...category,
        scopes: category.scopes.filter(scope =>
            scope.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            scope.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.scopes.length > 0)

    const allScopes = scopes.flatMap(c => c.scopes)
    const lowCount = allScopes.filter(s => s.sensitivity === 'low').length
    const mediumCount = allScopes.filter(s => s.sensitivity === 'medium').length
    const highCount = allScopes.filter(s => s.sensitivity === 'high').length

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl">
                        <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">OAuth Scopes</h1>
                </div>
                <p className="text-lg text-slate-400 max-w-3xl">
                    Scopes define what data your application can access. Request only the scopes
                    your application needs to minimize user friction during authorization.
                </p>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-3 gap-4"
            >
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{lowCount}</div>
                    <div className="text-sm text-green-300">Low Sensitivity</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{mediumCount}</div>
                    <div className="text-sm text-yellow-300">Medium Sensitivity</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{highCount}</div>
                    <div className="text-sm text-red-300">High Sensitivity</div>
                </div>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative"
            >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search scopes..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
            </motion.div>

            {/* Best Practice */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3"
            >
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm text-blue-300 font-medium">Principle of Least Privilege</p>
                    <p className="text-sm text-blue-200/80 mt-1">
                        Request only the minimum scopes required for your application. Users are more likely
                        to approve apps that request fewer permissions.
                    </p>
                </div>
            </motion.div>

            {/* Scopes Table */}
            <div className="space-y-6">
                {filteredScopes.map((category, catIdx) => (
                    <motion.div
                        key={category.category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + catIdx * 0.05 }}
                        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden"
                    >
                        <div className="px-5 py-4 bg-slate-900/50 border-b border-slate-700/50">
                            <h2 className="text-lg font-semibold text-white">{category.category}</h2>
                        </div>
                        <div className="divide-y divide-slate-700/30">
                            {category.scopes.map((scope, scopeIdx) => {
                                const AccessIcon = accessIcons[scope.access].icon
                                return (
                                    <div
                                        key={scope.name}
                                        className="p-4 hover:bg-slate-700/20 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                                            {/* Scope Name */}
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className={`p-2 rounded-lg ${accessIcons[scope.access].bg}`}>
                                                    <AccessIcon className={`w-4 h-4 ${accessIcons[scope.access].color}`} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-sm text-white font-mono">{scope.name}</code>
                                                        <button
                                                            onClick={() => copyScope(scope.name)}
                                                            className="p-1 text-slate-400 hover:text-white transition-colors"
                                                        >
                                                            {copiedScope === scope.name ? (
                                                                <Check className="w-3.5 h-3.5 text-green-400" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-slate-400 mt-0.5">{scope.description}</p>
                                                </div>
                                            </div>

                                            {/* Badges */}
                                            <div className="flex items-center gap-2 flex-shrink-0 ml-10 md:ml-0">
                                                <span className={`text-xs px-2 py-0.5 rounded border ${sensitivityColors[scope.sensitivity]}`}>
                                                    {scope.sensitivity}
                                                </span>
                                                {scope.requiresConsent && (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/50">
                                                        consent
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Legend */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid md:grid-cols-2 gap-6"
            >
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="font-semibold text-white mb-4">Access Types</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${accessIcons.read.bg}`}>
                                <Eye className={`w-4 h-4 ${accessIcons.read.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Read</p>
                                <p className="text-xs text-slate-400">View data only, no modifications</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${accessIcons.write.bg}`}>
                                <Edit className={`w-4 h-4 ${accessIcons.write.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Write</p>
                                <p className="text-xs text-slate-400">Create, update, or delete data</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${accessIcons.notify.bg}`}>
                                <Bell className={`w-4 h-4 ${accessIcons.notify.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">Notify</p>
                                <p className="text-xs text-slate-400">Send notifications to users</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="font-semibold text-white mb-4">Sensitivity Levels</h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded border ${sensitivityColors.low}`}>low</span>
                            <p className="text-sm text-slate-400">Basic information, minimal privacy impact</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded border ${sensitivityColors.medium}`}>medium</span>
                            <p className="text-sm text-slate-400">Personal data requiring user awareness</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded border ${sensitivityColors.high}`}>high</span>
                            <p className="text-sm text-slate-400">Sensitive data with strict handling requirements</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* High Sensitivity Warning */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-5"
            >
                <div className="flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-red-300 mb-2">High Sensitivity Scopes</h3>
                        <p className="text-sm text-red-200/80 mb-3">
                            High sensitivity scopes (like <code className="text-red-300">student.wellbeing.read</code>) provide access to
                            sensitive personal data. These scopes:
                        </p>
                        <ul className="space-y-2 text-sm text-red-200/80">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                <span>Require explicit user consent before access</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                <span>Are subject to additional review during app approval</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                <span>Must comply with FERPA, COPPA, and local privacy regulations</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </motion.div>

            {/* Navigation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-between pt-6 border-t border-slate-700/50"
            >
                <Link
                    href="/dashboard/docs/webhooks"
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    ← Webhooks
                </Link>
                <Link
                    href="/dashboard/docs/errors"
                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                    Error Codes <ChevronRight className="w-4 h-4" />
                </Link>
            </motion.div>
        </div>
    )
}
