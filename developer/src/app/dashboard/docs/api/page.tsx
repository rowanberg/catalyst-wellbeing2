'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Search,
    Copy,
    Check,
    ChevronRight,
    ChevronDown,
    Users,
    GraduationCap,
    Building2,
    Calendar,
    Bell,
    Brain,
    BookOpen,
    ClipboardList,
    Shield,
    Webhook,
    Play,
    ExternalLink
} from 'lucide-react'

interface Endpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    path: string
    description: string
    auth: boolean
    scopes?: string[]
}

interface ApiCategory {
    id: string
    name: string
    description: string
    icon: React.ElementType
    color: string
    endpoints: Endpoint[]
}

const apiCategories: ApiCategory[] = [
    {
        id: 'students',
        name: 'Students',
        description: 'Access student profiles, academic records, and more',
        icon: GraduationCap,
        color: 'text-emerald-400',
        endpoints: [
            { method: 'GET', path: '/v1/students/me', description: 'Get current student profile', auth: true, scopes: ['student.profile.read'] },
            { method: 'GET', path: '/v1/students/{id}', description: 'Get student by ID', auth: true, scopes: ['student.profile.read'] },
            { method: 'GET', path: '/v1/students/{id}/grades', description: 'Get student grades', auth: true, scopes: ['student.academic.read'] },
            { method: 'GET', path: '/v1/students/{id}/attendance', description: 'Get attendance records', auth: true, scopes: ['student.attendance.read'] },
            { method: 'GET', path: '/v1/students/{id}/timetable', description: 'Get class timetable', auth: true, scopes: ['student.timetable.read'] }
        ]
    },
    {
        id: 'teachers',
        name: 'Teachers',
        description: 'Access teacher profiles and class assignments',
        icon: Users,
        color: 'text-blue-400',
        endpoints: [
            { method: 'GET', path: '/v1/teachers/me', description: 'Get current teacher profile', auth: true, scopes: ['teacher.profile.read'] },
            { method: 'GET', path: '/v1/teachers/{id}', description: 'Get teacher by ID', auth: true, scopes: ['teacher.profile.read'] },
            { method: 'GET', path: '/v1/teachers/{id}/classes', description: 'Get assigned classes', auth: true, scopes: ['teacher.classes.read'] },
            { method: 'GET', path: '/v1/teachers/{id}/students', description: 'Get students in classes', auth: true, scopes: ['teacher.students.read'] }
        ]
    },
    {
        id: 'parents',
        name: 'Parents',
        description: 'Access parent profiles and children information',
        icon: Users,
        color: 'text-purple-400',
        endpoints: [
            { method: 'GET', path: '/v1/parents/me', description: 'Get current parent profile', auth: true, scopes: ['parent.profile.read'] },
            { method: 'GET', path: '/v1/parents/me/children', description: 'Get linked children', auth: true, scopes: ['parent.children.read'] },
            { method: 'GET', path: '/v1/parents/me/children/{id}/grades', description: 'Get child grades', auth: true, scopes: ['parent.grades.read'] }
        ]
    },
    {
        id: 'schools',
        name: 'Schools',
        description: 'Access school structure and organization',
        icon: Building2,
        color: 'text-amber-400',
        endpoints: [
            { method: 'GET', path: '/v1/schools', description: 'List linked schools', auth: true, scopes: ['school.structure.read'] },
            { method: 'GET', path: '/v1/schools/{id}', description: 'Get school details', auth: true, scopes: ['school.structure.read'] },
            { method: 'GET', path: '/v1/schools/{id}/classes', description: 'Get school classes', auth: true, scopes: ['school.classes.read'] },
            { method: 'GET', path: '/v1/schools/{id}/grades', description: 'Get grade levels', auth: true, scopes: ['school.structure.read'] }
        ]
    },
    {
        id: 'classes',
        name: 'Classes',
        description: 'Access class details and rosters',
        icon: BookOpen,
        color: 'text-cyan-400',
        endpoints: [
            { method: 'GET', path: '/v1/classes', description: 'List classes', auth: true, scopes: ['school.classes.read'] },
            { method: 'GET', path: '/v1/classes/{id}', description: 'Get class details', auth: true, scopes: ['school.classes.read'] },
            { method: 'GET', path: '/v1/classes/{id}/students', description: 'Get class roster', auth: true, scopes: ['school.classes.read'] }
        ]
    },
    {
        id: 'attendance',
        name: 'Attendance',
        description: 'Track and manage attendance records',
        icon: ClipboardList,
        color: 'text-rose-400',
        endpoints: [
            { method: 'GET', path: '/v1/attendance/student/{id}', description: 'Get student attendance', auth: true, scopes: ['student.attendance.read'] },
            { method: 'GET', path: '/v1/attendance/class/{id}', description: 'Get class attendance for date', auth: true, scopes: ['teacher.classes.read'] },
            { method: 'POST', path: '/v1/attendance/mark', description: 'Mark attendance (teachers)', auth: true, scopes: ['teacher.classes.read'] }
        ]
    },
    {
        id: 'calendar',
        name: 'Calendar',
        description: 'Academic calendar and events',
        icon: Calendar,
        color: 'text-orange-400',
        endpoints: [
            { method: 'GET', path: '/v1/academic-years', description: 'Get academic years', auth: true, scopes: ['school.calendar.read'] },
            { method: 'GET', path: '/v1/terms', description: 'Get academic terms', auth: true, scopes: ['school.calendar.read'] },
            { method: 'GET', path: '/v1/calendar/events', description: 'Get calendar events', auth: true, scopes: ['calendar.read'] }
        ]
    },
    {
        id: 'wellbeing',
        name: 'Wellbeing',
        description: 'Access student wellbeing data with consent',
        icon: Brain,
        color: 'text-pink-400',
        endpoints: [
            { method: 'GET', path: '/v1/wellbeing/mood/current', description: 'Get current mood (aggregated)', auth: true, scopes: ['student.wellbeing.read'] },
            { method: 'GET', path: '/v1/wellbeing/mood/history', description: 'Get mood history', auth: true, scopes: ['student.wellbeing.read'] },
            { method: 'GET', path: '/v1/wellbeing/behavior/summary', description: 'Get behavior summary', auth: true, scopes: ['student.wellbeing.read'] },
            { method: 'GET', path: '/v1/wellbeing/alerts', description: 'Get wellness alerts', auth: true, scopes: ['student.wellbeing.read'] }
        ]
    },
    {
        id: 'notifications',
        name: 'Notifications',
        description: 'Send notifications to users',
        icon: Bell,
        color: 'text-yellow-400',
        endpoints: [
            { method: 'POST', path: '/v1/notifications/send', description: 'Send a notification', auth: true, scopes: ['student.notifications.send'] },
            { method: 'PUT', path: '/v1/notifications/send', description: 'Bulk send notifications', auth: true, scopes: ['student.notifications.send'] },
            { method: 'GET', path: '/v1/messages/{id}/status', description: 'Get delivery status', auth: true, scopes: ['student.notifications.send'] }
        ]
    },
    {
        id: 'privacy',
        name: 'Privacy & Consent',
        description: 'Manage data privacy and consent',
        icon: Shield,
        color: 'text-green-400',
        endpoints: [
            { method: 'GET', path: '/v1/privacy/consent', description: 'Check consent status', auth: true, scopes: ['profile.read'] },
            { method: 'POST', path: '/v1/privacy/consent', description: 'Request consent', auth: true, scopes: ['profile.read'] },
            { method: 'GET', path: '/v1/privacy/audit-logs', description: 'Get data access logs', auth: true, scopes: ['profile.read'] }
        ]
    }
]

const methodColors = {
    GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30'
}

export default function ApiReferencePage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedCategory, setExpandedCategory] = useState<string | null>('students')
    const [copiedPath, setCopiedPath] = useState<string | null>(null)

    const copyPath = async (path: string) => {
        await navigator.clipboard.writeText(`https://api.catalystwells.com${path}`)
        setCopiedPath(path)
        setTimeout(() => setCopiedPath(null), 2000)
    }

    const filteredCategories = apiCategories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.endpoints.some(ep =>
            ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ep.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
    )

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">API Reference</h1>
                <p className="text-lg text-slate-400 max-w-3xl">
                    Complete reference for all CatalystWells API endpoints. All endpoints require authentication
                    and appropriate OAuth scopes.
                </p>
            </motion.div>

            {/* Search & Base URL */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search endpoints..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                    <span className="text-xs text-slate-500 font-medium">BASE URL</span>
                    <code className="text-sm text-blue-400 font-mono">https://api.catalystwells.com</code>
                </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-wrap gap-2"
            >
                {apiCategories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${expandedCategory === cat.id
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                            }`}
                    >
                        <cat.icon className={`w-4 h-4 ${expandedCategory === cat.id ? 'text-blue-400' : ''}`} />
                        {cat.name}
                    </button>
                ))}
            </motion.div>

            {/* API Categories */}
            <div className="space-y-4">
                {filteredCategories.map((category, idx) => (
                    <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.03 }}
                        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden"
                    >
                        <button
                            onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                            className="w-full flex items-center justify-between p-5 hover:bg-slate-700/20 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl bg-slate-700/50 ${category.color}`}>
                                    <category.icon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                                    <p className="text-sm text-slate-400">{category.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                                    {category.endpoints.length} endpoints
                                </span>
                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedCategory === category.id ? 'rotate-180' : ''
                                    }`} />
                            </div>
                        </button>

                        {expandedCategory === category.id && (
                            <div className="border-t border-slate-700/50">
                                {category.endpoints.map((endpoint, epIdx) => (
                                    <div
                                        key={epIdx}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-700/30 last:border-0 hover:bg-slate-700/10 transition-colors"
                                    >
                                        <div className="flex items-start sm:items-center gap-3 flex-1">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded border ${methodColors[endpoint.method]}`}>
                                                {endpoint.method}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <code className="text-sm text-white font-mono break-all">
                                                    {endpoint.path}
                                                </code>
                                                <p className="text-xs text-slate-500 mt-1">{endpoint.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 sm:flex-shrink-0">
                                            {endpoint.scopes && (
                                                <span className="text-xs text-slate-500 bg-slate-700/30 px-2 py-1 rounded font-mono">
                                                    {endpoint.scopes[0]}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => copyPath(endpoint.path)}
                                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
                                                title="Copy URL"
                                            >
                                                {copiedPath === endpoint.path ? (
                                                    <Check className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </button>
                                            <Link
                                                href={`/dashboard/playground?endpoint=${encodeURIComponent(endpoint.path)}&method=${endpoint.method}`}
                                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                title="Try in Playground"
                                            >
                                                <Play className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Authentication Note */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6"
            >
                <h3 className="text-lg font-semibold text-white mb-3">Authentication</h3>
                <p className="text-slate-300 mb-4">
                    All API requests require a valid access token. Include the token in the Authorization header:
                </p>
                <div className="bg-slate-900/80 rounded-xl p-4 font-mono text-sm">
                    <code className="text-slate-300">
                        <span className="text-blue-400">Authorization:</span> Bearer your_access_token
                    </code>
                </div>
                <div className="mt-4 flex gap-4">
                    <Link
                        href="/dashboard/docs/authentication"
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium inline-flex items-center gap-1"
                    >
                        Learn about OAuth
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/dashboard/docs/scopes"
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium inline-flex items-center gap-1"
                    >
                        View all scopes
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
