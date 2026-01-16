'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    BarChart3,
    Zap,
    Signal,
    AlertTriangle,
    Search,
    Filter,
    MoreVertical,
    Trash2,
    Edit,
    XCircle,
    WifiOff,
    Database,
    CheckCircle2,
    X,
    Wifi,
    Plus,
    Settings,
    MapPin,
    BookMarked,
    Utensils,
    DoorOpen,
    Activity,
    CreditCard,
    CheckCircle,
    RefreshCw,
    ArrowLeft,
    Shield,
    History,
    Download,
    Bus,
    AlertOctagon,
    Lock
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SettingsTab } from '@/components/aegisx/SettingsTab'
import { ReaderConfigModal } from '@/components/aegisx/ReaderConfigModal'
import { AccessControlTab } from '@/components/aegisx/AccessControlTab'
import { TransportTracking } from '@/components/aegisx/TransportTracking'
import { BehaviorAlerts } from '@/components/aegisx/BehaviorAlerts'
import { AddReaderModal } from '@/components/admin/AddReaderModal'

interface NFCReader {
    id: string
    name: string
    location: string
    locationType: 'library' | 'canteen' | 'gate' | 'lab' | 'other'
    status: 'online' | 'offline' | 'maintenance'
    lastSync: string
    totalScans: number
    todayScans: number
    serialNumber: string
    config?: any
    tags?: string[]
    notes?: string
    maxCapacity?: number
}

interface AccessLog {
    id: string
    readerId: string
    readerName: string
    userName: string
    userRole: string
    timestamp: string
    status: 'allowed' | 'denied'
}

const locationConfig: any = {
    library: { icon: BookMarked, color: 'from-blue-500 to-indigo-600', label: 'Library', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    canteen: { icon: Utensils, color: 'from-amber-500 to-orange-600', label: 'Canteen', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    gate: { icon: DoorOpen, color: 'from-emerald-500 to-teal-600', label: 'Gate', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    lab: { icon: MapPin, color: 'from-purple-500 to-violet-600', label: 'Lab', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    other: { icon: Wifi, color: 'from-slate-500 to-gray-600', label: 'Other', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' }
}

function AegisXContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') || 'overview'

    const [activeTab, setActiveTab] = useState(initialTab)
    const [showAddReaderModal, setShowAddReaderModal] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [readers, setReaders] = useState<NFCReader[]>([])
    const [logs, setLogs] = useState<AccessLog[]>([])
    const [stats, setStats] = useState({
        totalReaders: 0,
        onlineReaders: 0,
        totalScansToday: 0,
        linkedCards: 0
    })

    // Error and Toast States
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Add Reader Form State
    const [newReaderName, setNewReaderName] = useState('')
    const [newReaderLocation, setNewReaderLocation] = useState('')
    const [newReaderType, setNewReaderType] = useState('library')
    const [newReaderSerial, setNewReaderSerial] = useState('')
    const [isAddingReader, setIsAddingReader] = useState(false)
    const [addReaderError, setAddReaderError] = useState<string | null>(null)

    // Reader Configuration State
    const [selectedReader, setSelectedReader] = useState<NFCReader | null>(null)
    const [showReaderConfig, setShowReaderConfig] = useState(false)
    const [readerToDelete, setReaderToDelete] = useState<NFCReader | null>(null)
    const [isDeletingReader, setIsDeletingReader] = useState(false)

    // Handle delete reader
    const handleDeleteReader = async () => {
        if (!readerToDelete) return

        setIsDeletingReader(true)
        try {
            const res = await fetch(`/api/admin/aegisx/readers?id=${readerToDelete.id}`, {
                method: 'DELETE',
            })

            const data = await res.json()

            if (res.ok) {
                setReaders(prev => prev.filter(r => r.id !== readerToDelete.id))
                showToast(`Reader "${readerToDelete.name}" deleted successfully`, 'success')
                setReaderToDelete(null)
            } else {
                showToast(data.error || 'Failed to delete reader', 'error')
            }
        } catch (error: any) {
            console.error('Failed to delete reader:', error)
            showToast('Network error. Please try again.', 'error')
        } finally {
            setIsDeletingReader(false)
        }
    }

    // Show toast notification
    const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 5000)
    }, [])

    // Fetch real data from API
    const loadData = useCallback(async (showRefreshToast = false) => {
        setIsLoading(true)
        setError(null)
        try {
            // Parallel fetch for broader efficiency
            const [readersRes, logsRes] = await Promise.all([
                fetch('/api/admin/aegisx/readers', { cache: 'no-store' }),
                fetch('/api/admin/aegisx/logs', { cache: 'no-store' })
            ])

            // Check for errors
            if (!readersRes.ok || !logsRes.ok) {
                throw new Error('Failed to fetch data. Please check your connection and try again.')
            }

            const readersData = await readersRes.json()
            const logsData = await logsRes.json()

            // Check if migration is needed
            if (readersData.message || logsData.message) {
                setError('Database tables not found. Please run the AegisX database migration.')
                showToast('Database setup required', 'warning')
            }

            if (readersData.readers) {
                setReaders(readersData.readers)

                // Calculate stats from readers
                const total = readersData.readers.length
                const online = readersData.readers.filter((r: any) => r.status === 'online').length
                const scans = readersData.readers.reduce((acc: number, r: any) => acc + (r.todayScans || 0), 0)

                setStats(prev => ({
                    ...prev,
                    totalReaders: total,
                    onlineReaders: online,
                    totalScansToday: scans
                }))
            }

            if (logsData.logs) {
                setLogs(logsData.logs)
            }

            if (showRefreshToast) {
                showToast('Data refreshed successfully', 'success')
            }

        } catch (error: any) {
            console.error('Failed to load AegisX data:', error)
            setError(error.message || 'Failed to load data. Please try again.')
            showToast('Failed to load data', 'error')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [showToast])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true)
        loadData(true)
    }, [loadData])

    const handleAddReader = async () => {
        if (!newReaderName || !newReaderSerial) {
            setAddReaderError('Please fill in all required fields')
            return
        }

        setIsAddingReader(true)
        setAddReaderError(null)
        try {
            const res = await fetch('/api/admin/aegisx/readers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newReaderName,
                    location: newReaderLocation,
                    type: newReaderType,
                    serialNumber: newReaderSerial
                })
            })

            const data = await res.json()

            if (res.ok && data.reader) {
                setReaders(prev => [...prev, data.reader])
                // Update stats
                setStats(prev => ({
                    ...prev,
                    totalReaders: prev.totalReaders + 1,
                    onlineReaders: prev.onlineReaders + 1
                }))
                setShowAddReaderModal(false)
                // Reset form
                setNewReaderName('')
                setNewReaderLocation('')
                setNewReaderSerial('')
                setNewReaderType('library')
                setAddReaderError(null)
                showToast(`Reader "${data.reader.name}" added successfully`, 'success')
            } else {
                // Handle API error
                setAddReaderError(data.error || 'Failed to add reader')
                showToast(data.error || 'Failed to add reader', 'error')
            }
        } catch (error: any) {
            console.error('Failed to add reader:', error)
            setAddReaderError('Network error. Please try again.')
            showToast('Network error. Please try again.', 'error')
        } finally {
            setIsAddingReader(false)
        }
    }

    // Handle updating reader configuration
    const handleUpdateReader = useCallback(async (readerId: string, updates: Partial<NFCReader>) => {
        try {
            const res = await fetch(`/api/admin/aegisx/readers/${readerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })

            const data = await res.json()

            if (res.ok && data.reader) {
                // Update reader in state
                setReaders(prev => prev.map(r =>
                    r.id === readerId ? { ...r, ...data.reader } : r
                ))
                showToast('Reader configuration saved successfully', 'success')
            } else {
                showToast(data.error || 'Failed to update reader', 'error')
            }
        } catch (error: any) {
            console.error('Failed to update reader:', error)
            showToast('Network error. Please try again.', 'error')
        }
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <motion.div
                        className="relative w-20 h-20 mx-auto mb-6"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-blue-400 border-b-transparent border-l-transparent" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading AegisX System</h3>
                    <p className="text-sm text-gray-500">Fetching readers and access logs...</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans relative">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-4 right-4 z-[100] max-w-md"
                    >
                        <div className={`rounded-xl shadow-2xl border-2 backdrop-blur-sm p-4 flex items-start gap-3 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
                            toast.type === 'error' ? 'bg-red-50 border-red-200' :
                                'bg-amber-50 border-amber-200'
                            }`}>
                            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
                            {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold ${toast.type === 'success' ? 'text-emerald-900' :
                                    toast.type === 'error' ? 'text-red-900' :
                                        'text-amber-900'
                                    }`}>
                                    {toast.type === 'success' && 'Success'}
                                    {toast.type === 'error' && 'Error'}
                                    {toast.type === 'warning' && 'Warning'}
                                </p>
                                <p className={`text-xs mt-0.5 ${toast.type === 'success' ? 'text-emerald-700' :
                                    toast.type === 'error' ? 'text-red-700' :
                                        'text-amber-700'
                                    }`}>
                                    {toast.message}
                                </p>
                            </div>
                            <button
                                onClick={() => setToast(null)}
                                className="p-1 rounded-lg hover:bg-white/50 transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Banner */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-50 border-b-2 border-red-200"
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-red-900">System Error</h4>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-100"
                                    >
                                        <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        Retry
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setError(null)}
                                        className="h-8 text-xs text-red-700 hover:bg-red-100"
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Premium Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="p-2 hover:bg-white/50 rounded-xl transition-colors group">
                                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                            </Link>
                            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 items-center justify-center shadow-lg shadow-blue-500/20">
                                <Wifi className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">AegisX System</h1>
                                <p className="text-xs text-gray-500 font-medium hidden sm:block">NFC Access Control & Monitoring</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-medium text-emerald-700">System Online</span>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="h-9 w-9 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                                title="Refresh data"
                            >
                                <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button onClick={() => setShowAddReaderModal(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                                <Plus className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Add Reader</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Immersive Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Active Readers', value: stats.onlineReaders, total: stats.totalReaders, icon: Wifi, gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
                        { label: 'Scans Today', value: stats.totalScansToday, today: true, icon: Activity, gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20' },
                        { label: 'Linked Cards', value: stats.linkedCards, new: '+12', icon: CreditCard, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
                        { label: 'Security Alerts', value: '0', good: true, icon: Shield, gradient: 'from-orange-500 to-red-600', shadow: 'shadow-orange-500/20' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className={`border-0 bg-gradient-to-br ${stat.gradient} text-white shadow-xl ${stat.shadow} overflow-hidden relative group rounded-2xl`}>
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <stat.icon className="w-16 h-16" />
                                </div>
                                <CardContent className="p-5 relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                                            <stat.icon className="w-5 h-5 text-white" />
                                        </div>
                                        {stat.total !== undefined && <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">{stat.total} Total</span>}
                                        {stat.today && <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Live</span>}
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                                        <p className="text-sm font-medium text-white/80 mt-1">{stat.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Layout */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column: Navigation & Filters */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tab Navigation Pill */}
                        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-1.5 shadow-sm border border-white/50 inline-flex w-full sm:w-auto overflow-x-auto">
                            {[
                                { id: 'overview', label: 'Overview', icon: Zap },
                                { id: 'readers', label: 'Readers', icon: Wifi },
                                { id: 'logs', label: 'Access Logs', icon: History },
                                { id: 'access', label: 'Access Control', icon: Lock },
                                { id: 'transport', label: 'Transport', icon: Bus },
                                { id: 'alerts', label: 'Alerts', icon: AlertOctagon },
                                { id: 'settings', label: 'Settings', icon: Settings }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-4 sm:px-6 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-white text-blue-600 shadow-md shadow-blue-500/10 scale-100'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                        }`}
                                >
                                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'fill-current' : ''}`} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    {/* Locations Overview */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {Object.entries(locationConfig).slice(0, 4).map(([key, config]: any, i) => {
                                            const Icon = config.icon
                                            return (
                                                <motion.div
                                                    key={key}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="group cursor-pointer"
                                                    onClick={() => setActiveTab('readers')}
                                                >
                                                    <div className={`h-full bg-white rounded-2xl border ${config.border} p-5 hover:shadow-lg hover:shadow-${config.text.split('-')[1]}-500/10 transition-all duration-300 relative overflow-hidden`}>
                                                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${config.color} opacity-5 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform`} />

                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg transform group-hover:-translate-y-1 transition-transform`}>
                                                                <Icon className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div className={`px-2.5 py-1 rounded-full ${config.bg} border ${config.border}`}>
                                                                <span className={`text-xs font-bold ${config.text}`}>Active</span>
                                                            </div>
                                                        </div>

                                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{config.label}</h3>
                                                        <div className="flex items-center text-sm text-gray-500 gap-4">
                                                            <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> {readers.filter((r) => r.locationType === key).length} Readers</span>
                                                            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {readers.filter((r) => r.locationType === key).reduce((acc, r) => acc + r.todayScans, 0)} Scans</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>

                                    {/* Recent Access Chart Placeholder */}
                                    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                                        <CardHeader>
                                            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-blue-500" />
                                                Traffic Analytics
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-48 flex items-end justify-between gap-2">
                                                {[35, 60, 45, 75, 50, 80, 65, 90, 70, 55, 85, 95].map((h, i) => (
                                                    <div key={i} className="w-full bg-blue-100 rounded-t-sm relative group overflow-hidden" style={{ height: `${h}%` }}>
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-500 to-indigo-500 transition-all duration-500 h-0 group-hover:h-full" style={{ height: `${h}%` }} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-gray-400">
                                                <span>8 AM</span>
                                                <span>12 PM</span>
                                                <span>4 PM</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {activeTab === 'readers' && (
                                <motion.div
                                    key="readers"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                        <Search className="w-5 h-5 text-gray-400 ml-2" />
                                        <Input placeholder="Search readers..." className="border-0 focus-visible:ring-0 shadow-none" />
                                        <Button variant="ghost" size="icon"><Filter className="w-5 h-5 text-gray-500" /></Button>
                                    </div>

                                    {readers.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200"
                                        >
                                            <div className="max-w-md mx-auto">
                                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                    <WifiOff className="w-10 h-10 text-white" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Readers Found</h3>
                                                <p className="text-gray-500 mb-6">
                                                    Get started by adding your first NFC reader to the system. Readers enable access control across your campus.
                                                </p>
                                                <Button
                                                    onClick={() => setShowAddReaderModal(true)}
                                                    className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add Your First Reader
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        readers.map((reader) => {
                                            const config: any = locationConfig[reader.locationType] || locationConfig.other
                                            return (
                                                <div key={reader.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-md`}>
                                                        <Wifi className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-gray-900 truncate">{reader.name}</h4>
                                                            <Badge variant="outline" className={`${reader.status === 'online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                                {reader.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                                            <MapPin className="w-3 h-3" /> {reader.location}
                                                        </p>
                                                    </div>
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-sm font-bold text-gray-900">{reader.totalScans}</p>
                                                        <p className="text-xs text-gray-500">Total Scans</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="hover:bg-blue-50 hover:text-blue-600"
                                                            onClick={() => {
                                                                setSelectedReader(reader)
                                                                setShowReaderConfig(true)
                                                            }}
                                                            title="Configure Reader"
                                                        >
                                                            <Settings className="w-5 h-5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="hover:bg-red-50 hover:text-red-600"
                                                            onClick={() => setReaderToDelete(reader)}
                                                            title="Delete Reader"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'logs' && (
                                <motion.div
                                    key="logs"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                                >
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900">Access History</h3>
                                        <Button variant="outline" size="sm" className="h-8">
                                            <Download className="w-4 h-4 mr-2" /> Export
                                        </Button>
                                    </div>
                                    {logs.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                                <History className="w-8 h-8 text-white" />
                                            </div>
                                            <h4 className="font-bold text-gray-900 mb-2">No Access Logs Yet</h4>
                                            <p className="text-sm text-gray-500">
                                                Access attempts will appear here once readers are active and cards are scanned.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {logs.map((log) => (
                                                <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.status === 'allowed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        {log.status === 'allowed' ? <CheckCircle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-900 text-sm">{log.userName}</p>
                                                        <p className="text-xs text-gray-500">{log.userRole} • {log.readerName}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${log.status === 'allowed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                            {log.status}
                                                        </span>
                                                        <p className="text-xs text-gray-400">{log.timestamp}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'access' && (
                                <motion.div
                                    key="access"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <AccessControlTab />
                                </motion.div>
                            )}

                            {activeTab === 'transport' && (
                                <motion.div
                                    key="transport"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <TransportTracking />
                                </motion.div>
                            )}

                            {activeTab === 'alerts' && (
                                <motion.div
                                    key="alerts"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <BehaviorAlerts />
                                </motion.div>
                            )}

                            {activeTab === 'settings' && (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <SettingsTab
                                        onSettingsSaved={() => {
                                            showToast('Settings saved successfully!', 'success')
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column: Live Feed & Quick Config */}
                    <div className="space-y-6">
                        {/* Live Access Feed */}
                        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg overflow-hidden rounded-2xl">
                            <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Signal className="w-4 h-4 text-emerald-400 animate-pulse" />
                                    Live Access Feed
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
                                    {logs.slice(0, 3).map((log, i) => (
                                        <motion.div
                                            key={`live-${i}`}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.2 }}
                                            className="flex gap-3 relative"
                                        >
                                            <div className="absolute left-[19px] top-8 bottom-[-16px] w-0.5 bg-gray-100 last:hidden" />
                                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm z-10 ${log.status === 'allowed' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                                <Wifi className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-900 text-sm">{log.userName}</h4>
                                                    <span className="text-[10px] text-gray-400">{log.timestamp}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">Accessed {log.readerName}</p>
                                                <div className={`mt-2 text-[10px] font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${log.status === 'allowed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                                    {log.status === 'allowed' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                    {log.status === 'allowed' ? 'Access Granted' : 'Access Denied'}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                                    <Button variant="link" size="sm" className="text-xs text-blue-600 h-auto p-0">View All Activity</Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* System Status */}
                        <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-bold text-gray-900">System Health</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-gray-600">Sync Status</span>
                                        <span className="text-emerald-600 font-bold">Operational</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-full" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-gray-600">Server Latency</span>
                                        <span className="text-blue-600 font-bold">24ms</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[90%]" />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button variant="outline" size="sm" className="w-full text-xs">
                                        <RefreshCw className="w-3 h-3 mr-2" /> Run Diagnostics
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!readerToDelete} onOpenChange={(open) => !open && setReaderToDelete(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
                            <AlertTriangle className="w-6 h-6" />
                            Delete Reader?
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <span className="font-bold text-gray-900">{readerToDelete?.name}</span>?
                            This action cannot be undone and will permanently remove all configuration and access logs associated with this reader.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setReaderToDelete(null)}
                            disabled={isDeletingReader}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteReader}
                            disabled={isDeletingReader}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeletingReader ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Reader
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Reader Modal - Enhanced */}
            <AddReaderModal
                open={showAddReaderModal}
                onOpenChange={setShowAddReaderModal}
                onReaderAdded={(reader) => {
                    setReaders(prev => [...prev, reader])
                    setStats(prev => ({
                        ...prev,
                        totalReaders: prev.totalReaders + 1,
                        onlineReaders: prev.onlineReaders + 1
                    }))
                    showToast(`Reader "${reader.name}" added successfully`, 'success')
                }}
            />

            {/* Reader Configuration Modal */}
            <ReaderConfigModal
                reader={selectedReader}
                open={showReaderConfig}
                onClose={() => {
                    setShowReaderConfig(false)
                    setSelectedReader(null)
                }}
                onSave={handleUpdateReader}
            />
        </div>
    )
}

export default function AegisXAdminPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-3 border-blue-200 border-t-blue-600 animate-spin" />
            </div>
        }>
            <AegisXContent />
        </Suspense>
    )
}
