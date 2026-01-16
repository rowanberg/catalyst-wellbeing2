'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Search,
    AlertCircle,
    XCircle,
    ChevronRight,
    Copy,
    Check,
    Info,
    Shield,
    Clock,
    Server
} from 'lucide-react'

interface ErrorCode {
    code: string
    httpStatus: number
    message: string
    description: string
    resolution: string
    category: 'auth' | 'validation' | 'resource' | 'rate' | 'server'
}

const errors: ErrorCode[] = [
    // Authentication Errors
    { code: 'auth_invalid_token', httpStatus: 401, message: 'Invalid or expired access token', description: 'The access token provided is malformed, expired, or has been revoked.', resolution: 'Refresh the access token using your refresh token, or redirect the user to re-authenticate.', category: 'auth' },
    { code: 'auth_token_expired', httpStatus: 401, message: 'Access token has expired', description: 'The access token has passed its expiration time.', resolution: 'Use the refresh token to obtain a new access token.', category: 'auth' },
    { code: 'auth_insufficient_scope', httpStatus: 403, message: 'Token lacks required scope', description: 'The access token does not have the necessary scopes for this operation.', resolution: 'Request the required scopes during authorization. See the API documentation for required scopes.', category: 'auth' },
    { code: 'auth_invalid_client', httpStatus: 401, message: 'Invalid client credentials', description: 'The client ID or client secret is incorrect.', resolution: 'Verify your client credentials in the developer dashboard.', category: 'auth' },
    { code: 'auth_consent_required', httpStatus: 403, message: 'User consent required', description: 'The user has not granted consent for the requested data access.', resolution: 'Request consent from the user through the consent flow.', category: 'auth' },

    // Validation Errors
    { code: 'validation_invalid_parameter', httpStatus: 400, message: 'Invalid parameter value', description: 'One or more request parameters are invalid or malformed.', resolution: 'Check the request parameters against the API documentation.', category: 'validation' },
    { code: 'validation_missing_field', httpStatus: 400, message: 'Required field missing', description: 'A required field was not provided in the request.', resolution: 'Include all required fields in your request. See API documentation.', category: 'validation' },
    { code: 'validation_invalid_format', httpStatus: 400, message: 'Invalid data format', description: 'The data format does not match the expected format (e.g., date format, email format).', resolution: 'Ensure data follows the specified format. Dates should be ISO 8601 format.', category: 'validation' },
    { code: 'validation_out_of_range', httpStatus: 400, message: 'Value out of allowed range', description: 'A numeric or date value is outside the allowed range.', resolution: 'Check the API documentation for valid parameter ranges.', category: 'validation' },

    // Resource Errors
    { code: 'resource_not_found', httpStatus: 404, message: 'Resource not found', description: 'The requested resource does not exist or you do not have access to it.', resolution: 'Verify the resource ID and ensure you have access permissions.', category: 'resource' },
    { code: 'resource_already_exists', httpStatus: 409, message: 'Resource already exists', description: 'A resource with the same identifier already exists.', resolution: 'Use a unique identifier or update the existing resource instead.', category: 'resource' },
    { code: 'resource_deleted', httpStatus: 410, message: 'Resource has been deleted', description: 'The requested resource was previously deleted and is no longer available.', resolution: 'The resource cannot be recovered. Create a new resource if needed.', category: 'resource' },
    { code: 'resource_locked', httpStatus: 423, message: 'Resource is locked', description: 'The resource is currently locked and cannot be modified.', resolution: 'Wait for the lock to be released or contact support.', category: 'resource' },

    // Rate Limiting Errors
    { code: 'rate_limit_exceeded', httpStatus: 429, message: 'Rate limit exceeded', description: 'You have exceeded the number of allowed requests per time period.', resolution: 'Wait for the rate limit window to reset. Implement exponential backoff.', category: 'rate' },
    { code: 'rate_quota_exceeded', httpStatus: 429, message: 'Monthly quota exceeded', description: 'You have exceeded your monthly API call quota.', resolution: 'Upgrade your plan or wait for the quota to reset at the start of the next billing period.', category: 'rate' },

    // Server Errors
    { code: 'server_internal_error', httpStatus: 500, message: 'Internal server error', description: 'An unexpected error occurred on the server.', resolution: 'Retry the request. If the error persists, contact support with the request ID.', category: 'server' },
    { code: 'server_unavailable', httpStatus: 503, message: 'Service temporarily unavailable', description: 'The service is temporarily unavailable due to maintenance or high load.', resolution: 'Retry the request after a brief delay. Check our status page for updates.', category: 'server' },
    { code: 'server_timeout', httpStatus: 504, message: 'Request timeout', description: 'The request took too long to process.', resolution: 'Retry with a smaller request or use pagination for large data sets.', category: 'server' }
]

const categoryInfo = {
    auth: { label: 'Authentication', icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    validation: { label: 'Validation', icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    resource: { label: 'Resource', icon: XCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    rate: { label: 'Rate Limiting', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    server: { label: 'Server', icon: Server, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
}

const statusColors: Record<number, string> = {
    400: 'bg-yellow-500/20 text-yellow-400',
    401: 'bg-red-500/20 text-red-400',
    403: 'bg-red-500/20 text-red-400',
    404: 'bg-orange-500/20 text-orange-400',
    409: 'bg-orange-500/20 text-orange-400',
    410: 'bg-slate-500/20 text-slate-400',
    423: 'bg-purple-500/20 text-purple-400',
    429: 'bg-purple-500/20 text-purple-400',
    500: 'bg-red-500/20 text-red-400',
    503: 'bg-blue-500/20 text-blue-400',
    504: 'bg-blue-500/20 text-blue-400'
}

export default function ErrorCodesPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [copiedCode, setCopiedCode] = useState<string | null>(null)
    const [expandedError, setExpandedError] = useState<string | null>(null)

    const copyCode = async (code: string) => {
        await navigator.clipboard.writeText(code)
        setCopiedCode(code)
        setTimeout(() => setCopiedCode(null), 2000)
    }

    const filteredErrors = errors.filter(error => {
        const matchesSearch =
            error.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            error.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            error.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || error.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const errorResponse = `{
  "error": {
    "code": "auth_invalid_token",
    "message": "Invalid or expired access token",
    "status": 401,
    "request_id": "req_abc123xyz",
    "documentation_url": "https://developers.catalystwells.com/docs/errors#auth_invalid_token"
  }
}`

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-red-500/10 rounded-xl">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">Error Codes</h1>
                </div>
                <p className="text-lg text-slate-400 max-w-3xl">
                    This page documents all error codes returned by the CatalystWells API.
                    Use this reference to understand and handle errors in your application.
                </p>
            </motion.div>

            {/* Error Response Format */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden"
            >
                <div className="p-5 border-b border-slate-700/50">
                    <h2 className="text-lg font-semibold text-white">Error Response Format</h2>
                    <p className="text-sm text-slate-400 mt-1">All API errors follow a consistent JSON structure</p>
                </div>
                <pre className="p-5 overflow-x-auto">
                    <code className="text-sm text-slate-300 font-mono">{errorResponse}</code>
                </pre>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-4"
            >
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search error codes..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedCategory
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                            }`}
                    >
                        All ({errors.length})
                    </button>
                    {Object.entries(categoryInfo).map(([key, info]) => {
                        const count = errors.filter(e => e.category === key).length
                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedCategory(key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === key
                                        ? `${info.bg} ${info.color} border ${info.border}`
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                                    }`}
                            >
                                <info.icon className="w-4 h-4" />
                                <span>{info.label} ({count})</span>
                            </button>
                        )
                    })}
                </div>
            </motion.div>

            {/* Error List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
            >
                {filteredErrors.map((error, idx) => {
                    const cat = categoryInfo[error.category]
                    const isExpanded = expandedError === error.code

                    return (
                        <div
                            key={error.code}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => setExpandedError(isExpanded ? null : error.code)}
                                className="w-full p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${cat.bg}`}>
                                        <cat.icon className={`w-4 h-4 ${cat.color}`} />
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-3">
                                            <code className="text-sm text-white font-mono">{error.code}</code>
                                            <span className={`text-xs px-2 py-0.5 rounded font-mono ${statusColors[error.httpStatus] || 'bg-slate-500/20 text-slate-400'}`}>
                                                {error.httpStatus}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-0.5">{error.message}</p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>

                            {isExpanded && (
                                <div className="px-4 pb-4 border-t border-slate-700/50 pt-4 space-y-4">
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Description</h4>
                                        <p className="text-sm text-slate-300">{error.description}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Resolution</h4>
                                        <p className="text-sm text-slate-300">{error.resolution}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => copyCode(error.code)}
                                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                                        >
                                            {copiedCode === error.code ? (
                                                <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
                                            ) : (
                                                <><Copy className="w-3.5 h-3.5" /><span>Copy code</span></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                {filteredErrors.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No errors found matching your search.</p>
                    </div>
                )}
            </motion.div>

            {/* Handling Errors */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6"
            >
                <div className="flex items-start gap-4">
                    <Info className="w-6 h-6 text-blue-400 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-white mb-2">Best Practices for Error Handling</h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>Always check the HTTP status code and error code in responses</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>Log the <code className="text-blue-300">request_id</code> for debugging and support requests</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>Implement exponential backoff for rate limit (429) and server (5xx) errors</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>Automatically refresh tokens when receiving <code className="text-blue-300">auth_token_expired</code></span>
                            </li>
                        </ul>
                    </div>
                </div>
            </motion.div>

            {/* Navigation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center justify-between pt-6 border-t border-slate-700/50"
            >
                <Link
                    href="/dashboard/docs/scopes"
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    ← OAuth Scopes
                </Link>
                <Link
                    href="/dashboard/docs/rate-limits"
                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                    Rate Limits <ChevronRight className="w-4 h-4" />
                </Link>
            </motion.div>
        </div>
    )
}
