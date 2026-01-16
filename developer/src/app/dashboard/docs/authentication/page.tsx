'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Copy,
    Check,
    Key,
    Lock,
    Shield,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    ChevronRight,
    ExternalLink,
    Zap
} from 'lucide-react'

const oauthSteps = [
    {
        num: 1,
        title: 'Authorization Request',
        description: 'Redirect users to the authorization endpoint'
    },
    {
        num: 2,
        title: 'User Consent',
        description: 'User reviews and approves requested scopes'
    },
    {
        num: 3,
        title: 'Authorization Code',
        description: 'Receive code at your redirect URI'
    },
    {
        num: 4,
        title: 'Token Exchange',
        description: 'Exchange code for access tokens'
    }
]

const commonScopes = [
    { scope: 'profile.read', description: 'Basic profile information', risk: 'low' },
    { scope: 'student.profile.read', description: 'Student profile details', risk: 'low' },
    { scope: 'student.academic.read', description: 'Grades and marks', risk: 'medium' },
    { scope: 'student.attendance.read', description: 'Attendance records', risk: 'medium' },
    { scope: 'student.wellbeing.read', description: 'Wellbeing metrics', risk: 'high' },
    { scope: 'student.notifications.send', description: 'Send notifications', risk: 'medium' }
]

const riskColors = {
    low: 'bg-green-500/10 text-green-400 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-500/20'
}

export default function AuthenticationPage() {
    const [copiedSection, setCopiedSection] = useState<string | null>(null)

    const copyCode = async (code: string, section: string) => {
        await navigator.clipboard.writeText(code)
        setCopiedSection(section)
        setTimeout(() => setCopiedSection(null), 2000)
    }

    const authUrl = `https://auth.catalystwells.com/oauth/authorize?
  client_id=YOUR_CLIENT_ID
  &redirect_uri=https://yourapp.com/callback
  &response_type=code
  &scope=profile.read student.profile.read
  &state=random_state_string`

    const tokenRequest = `curl -X POST https://auth.catalystwells.com/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=AUTHORIZATION_CODE" \\
  -d "redirect_uri=https://yourapp.com/callback" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET"`

    const tokenResponse = `{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "scope": "profile.read student.profile.read"
}`

    const refreshRequest = `curl -X POST https://auth.catalystwells.com/oauth/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=refresh_token" \\
  -d "refresh_token=YOUR_REFRESH_TOKEN" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET"`

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Authentication</h1>
                <p className="text-lg text-slate-400">
                    CatalystWells uses OAuth 2.0 for secure authentication. This guide explains how to
                    implement the authorization flow in your application.
                </p>
            </motion.div>

            {/* OAuth Flow Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
            >
                <h2 className="text-xl font-semibold text-white mb-6">OAuth 2.0 Flow</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {oauthSteps.map((step, idx) => (
                        <div key={step.num} className="relative">
                            <div className="bg-slate-700/30 rounded-xl p-4 h-full">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-3">
                                    {step.num}
                                </div>
                                <h3 className="font-medium text-white text-sm mb-1">{step.title}</h3>
                                <p className="text-xs text-slate-400">{step.description}</p>
                            </div>
                            {idx < oauthSteps.length - 1 && (
                                <ArrowRight className="absolute top-1/2 -right-3 w-6 h-6 text-slate-600 hidden md:block" />
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Step 1: Authorization Request */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-4"
            >
                <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                    Authorization Request
                </h2>
                <p className="text-slate-400">
                    Redirect users to the CatalystWells authorization page where they can approve your app's access.
                </p>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 border-b border-slate-700/50">
                        <span className="text-xs text-slate-500 font-mono">Authorization URL</span>
                        <button
                            onClick={() => copyCode(authUrl.replace(/\s+/g, ''), 'auth-url')}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                        >
                            {copiedSection === 'auth-url' ? (
                                <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
                            ) : (
                                <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                            )}
                        </button>
                    </div>
                    <pre className="p-4 overflow-x-auto">
                        <code className="text-sm text-slate-300 font-mono whitespace-pre">{authUrl}</code>
                    </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
                        <h4 className="font-medium text-white mb-3">Required Parameters</h4>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <code className="text-blue-400">client_id</code>
                                <span className="text-slate-400">Your application's client ID</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <code className="text-blue-400">redirect_uri</code>
                                <span className="text-slate-400">Your registered callback URL</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <code className="text-blue-400">response_type</code>
                                <span className="text-slate-400">Always "code" for auth code flow</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <code className="text-blue-400">scope</code>
                                <span className="text-slate-400">Space-separated list of scopes</span>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
                        <h4 className="font-medium text-white mb-3">Optional Parameters</h4>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <code className="text-purple-400">state</code>
                                <span className="text-slate-400">CSRF protection (recommended)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <code className="text-purple-400">school_id</code>
                                <span className="text-slate-400">Pre-select a specific school</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <code className="text-purple-400">login_hint</code>
                                <span className="text-slate-400">Pre-fill email address</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </motion.div>

            {/* Step 2: Token Exchange */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
            >
                <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                    Exchange Code for Tokens
                </h2>
                <p className="text-slate-400">
                    After the user approves, you'll receive an authorization code at your redirect URI.
                    Exchange it for access and refresh tokens.
                </p>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 border-b border-slate-700/50">
                        <span className="text-xs text-slate-500 font-mono">Token Request</span>
                        <button
                            onClick={() => copyCode(tokenRequest, 'token-req')}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                        >
                            {copiedSection === 'token-req' ? (
                                <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
                            ) : (
                                <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                            )}
                        </button>
                    </div>
                    <pre className="p-4 overflow-x-auto">
                        <code className="text-sm text-slate-300 font-mono">{tokenRequest}</code>
                    </pre>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 border-b border-slate-700/50">
                        <span className="text-xs text-slate-500 font-mono">Response</span>
                    </div>
                    <pre className="p-4 overflow-x-auto">
                        <code className="text-sm text-slate-300 font-mono">{tokenResponse}</code>
                    </pre>
                </div>
            </motion.div>

            {/* Step 3: Using Access Tokens */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-4"
            >
                <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                    Using Access Tokens
                </h2>
                <p className="text-slate-400">
                    Include the access token in the Authorization header of all API requests.
                </p>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <code className="text-sm text-slate-300 font-mono">
                        <span className="text-blue-400">Authorization:</span> Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6...
                    </code>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-amber-300 font-medium">Important</p>
                        <p className="text-sm text-amber-200/80 mt-1">
                            Access tokens expire after 1 hour. Use the refresh token to get new access tokens without
                            requiring user interaction.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Step 4: Refresh Tokens */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
            >
                <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                    Refreshing Tokens
                </h2>
                <p className="text-slate-400">
                    When an access token expires, use the refresh token to get a new one.
                </p>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 border-b border-slate-700/50">
                        <span className="text-xs text-slate-500 font-mono">Refresh Request</span>
                        <button
                            onClick={() => copyCode(refreshRequest, 'refresh-req')}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                        >
                            {copiedSection === 'refresh-req' ? (
                                <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
                            ) : (
                                <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                            )}
                        </button>
                    </div>
                    <pre className="p-4 overflow-x-auto">
                        <code className="text-sm text-slate-300 font-mono">{refreshRequest}</code>
                    </pre>
                </div>
            </motion.div>

            {/* Scopes */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-4"
            >
                <h2 className="text-2xl font-semibold text-white">Common Scopes</h2>
                <p className="text-slate-400">
                    Request only the scopes your application needs. Users will see exactly what data you're requesting.
                </p>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Scope</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Description</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Risk</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commonScopes.map((s, idx) => (
                                <tr key={idx} className="border-b border-slate-700/30 last:border-0">
                                    <td className="px-4 py-3">
                                        <code className="text-sm text-blue-400 font-mono">{s.scope}</code>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">{s.description}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded border ${riskColors[s.risk as keyof typeof riskColors]}`}>
                                            {s.risk}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Link
                    href="/dashboard/docs/scopes"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm"
                >
                    View all scopes
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </motion.div>

            {/* Security Best Practices */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 border border-green-500/20 rounded-2xl p-6"
            >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    Security Best Practices
                </h2>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Never expose your client secret</p>
                            <p className="text-sm text-slate-400">Keep it server-side. Never include it in client-side code.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Use the state parameter</p>
                            <p className="text-sm text-slate-400">Protect against CSRF attacks by validating the state on callback.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Store tokens securely</p>
                            <p className="text-sm text-slate-400">Use encrypted storage. Refresh tokens are long-lived and sensitive.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Request minimal scopes</p>
                            <p className="text-sm text-slate-400">Only request the scopes you actually need.</p>
                        </div>
                    </li>
                </ul>
            </motion.div>
        </div>
    )
}
