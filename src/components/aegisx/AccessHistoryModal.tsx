'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, History, CheckCircle, XCircle, Loader2, MapPin,
    Calendar, Clock, Filter, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AccessLog {
    id: string
    timestamp: string
    accessGranted: boolean
    denialReason?: string
    reader: {
        name: string
        location: string
        type: string
    }
}

interface AccessHistoryModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AccessHistoryModal({ open, onOpenChange }: AccessHistoryModalProps) {
    const [logs, setLogs] = useState<AccessLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'granted' | 'denied'>('all')

    const fetchLogs = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch('/api/student/access-logs', {
                credentials: 'include'
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to fetch logs')
            }
            const data = await res.json()
            setLogs(data.logs || [])
        } catch (err: any) {
            console.error('Error fetching access logs:', err)
            setError(err.message || 'Unable to connect to server')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchLogs()
        }
    }, [open])

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true
        if (filter === 'granted') return log.accessGranted
        if (filter === 'denied') return !log.accessGranted
        return true
    })

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return 'Today'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday'
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const getLocationIcon = (type: string) => {
        const icons: Record<string, string> = {
            library: '📚',
            canteen: '🍽️',
            gate: '🚪',
            lab: '🔬',
            classroom: '🏫',
            office: '🏢',
            gym: '🏋️',
            staffroom: '☕',
            other: '📍'
        }
        return icons[type] || icons.other
    }

    if (!open) return null

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={() => onOpenChange(false)}
                    />

                    {/* Modal Container - for centering */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-lg max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                                        <History className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">Access History</h2>
                                        <p className="text-xs text-slate-500">Your recent NFC card usage</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-full w-8 h-8 p-0"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Filters */}
                            <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <div className="flex gap-2">
                                    {(['all', 'granted', 'denied'] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                        >
                                            {f === 'all' ? 'All' : f === 'granted' ? 'Granted' : 'Denied'}
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={fetchLogs}
                                    disabled={loading}
                                    className="ml-auto"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                                        <p className="text-sm text-slate-500">Loading access history...</p>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                                            <XCircle className="w-6 h-6 text-red-500" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 mb-1">Unable to load history</p>
                                        <p className="text-xs text-slate-500 mb-4">{error}</p>
                                        <Button size="sm" onClick={fetchLogs}>Try Again</Button>
                                    </div>
                                ) : filteredLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                            <History className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 mb-1">No access logs found</p>
                                        <p className="text-xs text-slate-500">
                                            {filter !== 'all'
                                                ? `No ${filter} access attempts recorded`
                                                : 'Your NFC card usage will appear here'
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredLogs.map((log, i) => (
                                            <motion.div
                                                key={log.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className={`p-3 sm:p-4 rounded-xl border-2 transition-colors ${log.accessGranted
                                                        ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-200'
                                                        : 'bg-red-50 border-red-100 hover:border-red-200'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg flex-shrink-0 ${log.accessGranted ? 'bg-emerald-100' : 'bg-red-100'
                                                            }`}>
                                                            {log.accessGranted ? (
                                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-red-600" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-lg">{getLocationIcon(log.reader.type)}</span>
                                                                <p className="font-semibold text-slate-800 text-sm truncate">
                                                                    {log.reader.name}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                                <MapPin className="w-3 h-3" />
                                                                <span className="truncate">{log.reader.location}</span>
                                                            </div>
                                                            {!log.accessGranted && log.denialReason && (
                                                                <p className="text-xs text-red-600 mt-1.5 font-medium">
                                                                    Reason: {log.denialReason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{formatDate(log.timestamp)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{formatTime(log.timestamp)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer Stats */}
                            {!loading && !error && logs.length > 0 && (
                                <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-4">
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                {logs.filter(l => l.accessGranted).length} Granted
                                            </Badge>
                                            <Badge variant="secondary" className="bg-red-100 text-red-700">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                {logs.filter(l => !l.accessGranted).length} Denied
                                            </Badge>
                                        </div>
                                        <span className="text-slate-500">
                                            Last 50 entries
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
