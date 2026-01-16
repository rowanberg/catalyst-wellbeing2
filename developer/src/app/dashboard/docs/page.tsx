'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Search,
    Book,
    Code2,
    Key,
    Shield,
    Webhook,
    Users,
    GraduationCap,
    Building2,
    Calendar,
    Bell,
    Brain,
    ChevronRight,
    ExternalLink,
    FileText,
    Zap,
    Copy,
    Check
} from 'lucide-react'

interface DocSection {
    title: string
    description: string
    icon: React.ElementType
    href: string
    color: string
}

interface QuickLink {
    title: string
    href: string
}

const sections: DocSection[] = [
    {
        title: 'Getting Started',
        description: 'Set up your developer account and create your first application',
        icon: Zap,
        href: '/dashboard/docs/getting-started',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        title: 'Authentication',
        description: 'Learn about OAuth 2.0, access tokens, and securing your app',
        icon: Key,
        href: '/dashboard/docs/authentication',
        color: 'from-purple-500 to-pink-500'
    },
    {
        title: 'Student APIs',
        description: 'Access student profiles, grades, attendance, and more',
        icon: GraduationCap,
        href: '/dashboard/docs/api/students',
        color: 'from-emerald-500 to-teal-500'
    },
    {
        title: 'Teacher APIs',
        description: 'Retrieve teacher information, classes, and schedules',
        icon: Users,
        href: '/dashboard/docs/api/teachers',
        color: 'from-amber-500 to-orange-500'
    },
    {
        title: 'School APIs',
        description: 'Access school structure, grades, sections, and terms',
        icon: Building2,
        href: '/dashboard/docs/api/schools',
        color: 'from-indigo-500 to-blue-500'
    },
    {
        title: 'Attendance APIs',
        description: 'Track and manage student attendance records',
        icon: Calendar,
        href: '/dashboard/docs/api/attendance',
        color: 'from-rose-500 to-pink-500'
    },
    {
        title: 'Wellbeing APIs',
        description: 'Access student wellbeing metrics with proper consent',
        icon: Brain,
        href: '/dashboard/docs/api/wellbeing',
        color: 'from-cyan-500 to-blue-500'
    },
    {
        title: 'Webhooks',
        description: 'Receive real-time notifications about important events',
        icon: Webhook,
        href: '/dashboard/docs/webhooks',
        color: 'from-violet-500 to-purple-500'
    }
]

const quickLinks: QuickLink[] = [
    { title: 'API Reference', href: '/dashboard/docs/api' },
    { title: 'OAuth Scopes', href: '/dashboard/docs/scopes' },
    { title: 'Error Codes', href: '/dashboard/docs/errors' },
    { title: 'Rate Limits', href: '/dashboard/docs/rate-limits' },
    { title: 'Changelog', href: '/dashboard/docs/changelog' },
    { title: 'Examples', href: '/dashboard/docs/examples' }
]

const codeExamples = {
    authentication: `// Step 1: Redirect user to authorization URL
const authUrl = \`https://api.catalystwells.com/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=profile.read student.profile.read\`;

// Step 2: Exchange code for access token
const response = await fetch('https://api.catalystwells.com/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: 'YOUR_CLIENT_ID',
    client_secret: 'YOUR_CLIENT_SECRET',
    code: authorizationCode,
    redirect_uri: 'YOUR_REDIRECT_URI'
  })
});

const { access_token, refresh_token } = await response.json();`,

    apiCall: `// Making an authenticated API request
const response = await fetch('https://api.catalystwells.com/v1/students/me', {
  headers: {
    'Authorization': \`Bearer \${access_token}\`,
    'Content-Type': 'application/json'
  }
});

const student = await response.json();
console.log(student);
// {
//   id: "stu_abc123",
//   name: "John Doe",
//   grade: "10",
//   section: "A",
//   school: { id: "sch_123", name: "Demo High School" }
// }`
}

export default function DocsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [copied, setCopied] = useState<string | null>(null)

    const copyCode = async (code: string, key: string) => {
        await navigator.clipboard.writeText(code)
        setCopied(key)
        setTimeout(() => setCopied(null), 2000)
    }

    const filteredSections = sections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl sm:text-4xl font-bold text-white mb-4"
                >
                    Documentation
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-slate-400 mb-6"
                >
                    Everything you need to integrate with CatalystWells APIs
                </motion.p>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search documentation..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg"
                    />
                </motion.div>
            </div>

            {/* Quick Links */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap justify-center gap-3"
            >
                {quickLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
                    >
                        {link.title}
                    </Link>
                ))}
            </motion.div>

            {/* Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredSections.map((section, index) => (
                    <motion.div
                        key={section.href}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                    >
                        <Link
                            href={section.href}
                            className="block h-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all group"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} bg-opacity-20 flex items-center justify-center mb-4`}>
                                <section.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                {section.title}
                            </h3>
                            <p className="text-sm text-slate-400">
                                {section.description}
                            </p>
                            <div className="flex items-center gap-1 mt-4 text-sm text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Learn more</span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Quick Start Guide */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white">Quick Start Guide</h2>
                    <p className="text-slate-400 mt-1">Get up and running in minutes</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                            1
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-medium text-white mb-2">Create an Application</h4>
                            <p className="text-slate-400 text-sm mb-3">
                                Go to the Applications page and create a new app. You'll receive a client ID and secret.
                            </p>
                            <Link
                                href="/dashboard/applications/create"
                                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                            >
                                Create Application
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                            2
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-medium text-white mb-2">Implement OAuth Authentication</h4>
                            <p className="text-slate-400 text-sm mb-3">
                                Use the OAuth 2.0 authorization code flow to authenticate users and get access tokens.
                            </p>
                            <div className="relative">
                                <div className="flex items-center justify-between p-3 bg-slate-900/50 border-b border-slate-700 rounded-t-xl">
                                    <span className="text-sm text-slate-400">JavaScript</span>
                                    <button
                                        onClick={() => copyCode(codeExamples.authentication, 'auth')}
                                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
                                    >
                                        {copied === 'auth' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <pre className="p-4 bg-slate-900/50 rounded-b-xl overflow-x-auto">
                                    <code className="text-sm text-slate-300">{codeExamples.authentication}</code>
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                            3
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-medium text-white mb-2">Make API Requests</h4>
                            <p className="text-slate-400 text-sm mb-3">
                                Use the access token to make authenticated requests to any of our education APIs.
                            </p>
                            <div className="relative">
                                <div className="flex items-center justify-between p-3 bg-slate-900/50 border-b border-slate-700 rounded-t-xl">
                                    <span className="text-sm text-slate-400">JavaScript</span>
                                    <button
                                        onClick={() => copyCode(codeExamples.apiCall, 'api')}
                                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
                                    >
                                        {copied === 'api' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                <pre className="p-4 bg-slate-900/50 rounded-b-xl overflow-x-auto">
                                    <code className="text-sm text-slate-300">{codeExamples.apiCall}</code>
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold flex-shrink-0">
                            ✓
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-medium text-white mb-2">Submit for Review</h4>
                            <p className="text-slate-400 text-sm">
                                Once your app is ready, submit it for review. After approval, you can switch to production and access real data.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Resources */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6"
                >
                    <Book className="w-8 h-8 text-blue-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">API Reference</h3>
                    <p className="text-sm text-slate-300 mb-4">
                        Complete reference for all endpoints, parameters, and response formats.
                    </p>
                    <Link
                        href="/dashboard/docs/api"
                        className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                        View Reference
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-6"
                >
                    <Code2 className="w-8 h-8 text-emerald-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Code Examples</h3>
                    <p className="text-sm text-slate-300 mb-4">
                        Sample applications and code snippets in multiple languages.
                    </p>
                    <Link
                        href="/dashboard/docs/examples"
                        className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
                    >
                        View Examples
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-2xl p-6"
                >
                    <Shield className="w-8 h-8 text-amber-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Security & Privacy</h3>
                    <p className="text-sm text-slate-300 mb-4">
                        Best practices for handling student data and maintaining compliance.
                    </p>
                    <Link
                        href="/dashboard/docs/security"
                        className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300"
                    >
                        Learn More
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </div>
        </div>
    )
}
