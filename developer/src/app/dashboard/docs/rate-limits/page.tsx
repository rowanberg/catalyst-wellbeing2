'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Clock,
    Zap,
    ChevronRight,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Shield,
    RefreshCw,
    BarChart3
} from 'lucide-react'

const tiers = [
    {
        name: 'Free',
        limits: {
            requestsPerMinute: 60,
            requestsPerDay: 10000,
            requestsPerMonth: 100000,
            burstLimit: 10
        },
        color: 'from-slate-500 to-slate-600',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/20',
        textColor: 'text-slate-400'
    },
    {
        name: 'Starter',
        limits: {
            requestsPerMinute: 300,
            requestsPerDay: 50000,
            requestsPerMonth: 500000,
            burstLimit: 30
        },
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        textColor: 'text-blue-400'
    },
    {
        name: 'Pro',
        limits: {
            requestsPerMinute: 1000,
            requestsPerDay: 200000,
            requestsPerMonth: 2000000,
            burstLimit: 100
        },
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        textColor: 'text-purple-400'
    },
    {
        name: 'Enterprise',
        limits: {
            requestsPerMinute: 5000,
            requestsPerDay: 1000000,
            requestsPerMonth: 10000000,
            burstLimit: 500
        },
        color: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        textColor: 'text-amber-400'
    }
]

const headers = [
    { name: 'X-RateLimit-Limit', description: 'Maximum requests allowed in the current window' },
    { name: 'X-RateLimit-Remaining', description: 'Number of requests remaining in the current window' },
    { name: 'X-RateLimit-Reset', description: 'Unix timestamp when the rate limit window resets' },
    { name: 'Retry-After', description: 'Seconds to wait before retrying (only on 429 responses)' }
]

export default function RateLimitsPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl">
                        <Clock className="w-6 h-6 text-purple-400" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">Rate Limits</h1>
                </div>
                <p className="text-lg text-slate-400 max-w-3xl">
                    Rate limits help ensure fair usage and protect the API from abuse.
                    This page explains how rate limiting works and how to handle it in your application.
                </p>
            </motion.div>

            {/* How It Works */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
            >
                <h2 className="text-xl font-semibold text-white mb-4">How Rate Limiting Works</h2>
                <p className="text-slate-400 mb-4">
                    Rate limits are applied using a sliding window algorithm. Each request consumes one unit
                    from your rate limit bucket. When the bucket is empty, subsequent requests will receive
                    a <code className="text-purple-400">429 Too Many Requests</code> response.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-700/30 rounded-xl p-4">
                        <Zap className="w-6 h-6 text-yellow-400 mb-2" />
                        <h3 className="font-medium text-white mb-1">Burst Limit</h3>
                        <p className="text-sm text-slate-400">Maximum requests in a very short window (1 second)</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-xl p-4">
                        <Clock className="w-6 h-6 text-blue-400 mb-2" />
                        <h3 className="font-medium text-white mb-1">Per Minute</h3>
                        <p className="text-sm text-slate-400">Requests allowed per rolling 60-second window</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-xl p-4">
                        <BarChart3 className="w-6 h-6 text-green-400 mb-2" />
                        <h3 className="font-medium text-white mb-1">Daily/Monthly</h3>
                        <p className="text-sm text-slate-400">Total quota for your billing period</p>
                    </div>
                </div>
            </motion.div>

            {/* Tier Limits */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-6"
            >
                <h2 className="text-2xl font-semibold text-white">Rate Limits by Plan</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {tiers.map((tier, idx) => (
                        <div
                            key={tier.name}
                            className={`${tier.bgColor} border ${tier.borderColor} rounded-2xl p-5`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 bg-gradient-to-br ${tier.color} rounded-xl flex items-center justify-center`}>
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase mb-1">Per Minute</p>
                                    <p className={`text-xl font-bold ${tier.textColor}`}>{tier.limits.requestsPerMinute.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase mb-1">Per Day</p>
                                    <p className={`text-xl font-bold ${tier.textColor}`}>{tier.limits.requestsPerDay.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase mb-1">Per Month</p>
                                    <p className={`text-xl font-bold ${tier.textColor}`}>{tier.limits.requestsPerMonth.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase mb-1">Burst</p>
                                    <p className={`text-xl font-bold ${tier.textColor}`}>{tier.limits.burstLimit}/sec</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Response Headers */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
            >
                <h2 className="text-2xl font-semibold text-white">Response Headers</h2>
                <p className="text-slate-400">
                    Every API response includes headers that help you monitor your rate limit status:
                </p>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-900/50">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Header</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {headers.map((header, idx) => (
                                <tr key={idx} className="border-b border-slate-700/30 last:border-0">
                                    <td className="px-5 py-4">
                                        <code className="text-sm text-blue-400 font-mono">{header.name}</code>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-300">{header.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Example Response */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-4"
            >
                <h2 className="text-2xl font-semibold text-white">Example Headers</h2>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <div className="p-4 bg-slate-900/50 border-b border-slate-700/50">
                        <span className="text-sm text-slate-400">Response Headers</span>
                    </div>
                    <pre className="p-5 overflow-x-auto">
                        <code className="text-sm text-slate-300 font-mono">{`HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1737037200
Content-Type: application/json`}</code>
                    </pre>
                </div>
            </motion.div>

            {/* Handling 429 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6"
            >
                <div className="flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-amber-300 mb-3">Handling Rate Limit Errors</h3>
                        <p className="text-sm text-amber-200/80 mb-4">
                            When you receive a 429 response, use the <code className="text-amber-300">Retry-After</code> header
                            to determine when to retry. Implement exponential backoff for best results.
                        </p>
                        <div className="bg-slate-900/50 rounded-xl p-4">
                            <pre className="text-sm text-slate-300 font-mono overflow-x-auto">{`async function makeRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      const waitTime = parseInt(retryAfter) * 1000 * Math.pow(2, i);
      console.log(\`Rate limited. Retrying in \${waitTime/1000}s...\`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    
    return response;
  }
  throw new Error('Max retries exceeded');
}`}</pre>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Best Practices */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
            >
                <h2 className="text-xl font-semibold text-white mb-4">Best Practices</h2>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Monitor rate limit headers</p>
                            <p className="text-sm text-slate-400">Track remaining requests and adjust your request rate accordingly.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Use caching</p>
                            <p className="text-sm text-slate-400">Cache responses to reduce repeated API calls for the same data.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Batch requests</p>
                            <p className="text-sm text-slate-400">Use bulk endpoints where available instead of many individual requests.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Implement exponential backoff</p>
                            <p className="text-sm text-slate-400">Increase wait time between retries to avoid overwhelming the API.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Use webhooks</p>
                            <p className="text-sm text-slate-400">Subscribe to webhooks instead of polling for data changes.</p>
                        </div>
                    </li>
                </ul>
            </motion.div>

            {/* Upgrade CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
            >
                <div className="flex items-center gap-4">
                    <TrendingUp className="w-10 h-10 text-purple-400" />
                    <div>
                        <h3 className="text-lg font-semibold text-white">Need Higher Limits?</h3>
                        <p className="text-sm text-slate-400">Upgrade your plan or contact us for custom enterprise limits.</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/settings"
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                    View Plans
                </Link>
            </motion.div>

            {/* Navigation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="flex items-center justify-between pt-6 border-t border-slate-700/50"
            >
                <Link
                    href="/dashboard/docs/errors"
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    ← Error Codes
                </Link>
                <Link
                    href="/dashboard/docs/sdks"
                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                    SDKs <ChevronRight className="w-4 h-4" />
                </Link>
            </motion.div>
        </div>
    )
}
