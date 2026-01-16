'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
    Bus,
    MapPin,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Phone,
    User,
    Route,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Bell,
    Navigation,
    ArrowRight,
    Calendar,
    Search,
    Filter,
    ChevronDown
} from 'lucide-react'

interface TransportRoute {
    id: string
    routeName: string
    routeCode: string
    vehicleNumber: string
    driverName: string
    driverPhone: string
    stops: RouteStop[]
    morningStartTime: string
    morningEndTime: string
    afternoonStartTime: string
    afternoonEndTime: string
    isActive: boolean
    studentCount: number
}

interface RouteStop {
    name: string
    time: string
    lat?: number
    lng?: number
}

interface TransportLog {
    id: string
    studentId: string
    studentName: string
    studentTag: string
    routeId: string
    routeName: string
    logDate: string
    boardingTime: string | null
    boardingStop: string | null
    dropTime: string | null
    dropStop: string | null
    boardingStatus: 'boarded' | 'missed' | 'late' | null
    dropStatus: 'dropped' | 'early' | 'late' | 'wrong_stop' | null
    parentNotified: boolean
}

interface TransportTrackingProps {
    schoolId?: string
}

export function TransportTracking({ schoolId }: TransportTrackingProps) {
    const [routes, setRoutes] = useState<TransportRoute[]>([])
    const [logs, setLogs] = useState<TransportLog[]>([])
    const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('routes')
    const [showAddRouteModal, setShowAddRouteModal] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [searchQuery, setSearchQuery] = useState('')
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

    // New route form state
    const [newRoute, setNewRoute] = useState({
        routeName: '',
        routeCode: '',
        vehicleNumber: '',
        driverName: '',
        driverPhone: '',
        morningStartTime: '07:00',
        morningEndTime: '08:30',
        afternoonStartTime: '14:00',
        afternoonEndTime: '16:00',
        stops: [{ name: '', time: '' }] as RouteStop[]
    })

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 5000)
    }, [])

    // Load routes
    const loadRoutes = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/transport/routes')
            if (res.ok) {
                const data = await res.json()
                setRoutes(data.routes || [])
            }
        } catch (error) {
            console.error('Failed to load routes:', error)
            showToast('Failed to load transport routes', 'error')
        } finally {
            setIsLoading(false)
        }
    }, [showToast])

    // Load logs for selected date
    const loadLogs = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/transport/logs?date=${selectedDate}${selectedRoute ? `&routeId=${selectedRoute.id}` : ''}`)
            if (res.ok) {
                const data = await res.json()
                setLogs(data.logs || [])
            }
        } catch (error) {
            console.error('Failed to load logs:', error)
        }
    }, [selectedDate, selectedRoute])

    useEffect(() => {
        loadRoutes()
    }, [loadRoutes])

    useEffect(() => {
        if (activeTab === 'logs') {
            loadLogs()
        }
    }, [activeTab, loadLogs])

    // Add new route
    const handleAddRoute = async () => {
        if (!newRoute.routeName || !newRoute.vehicleNumber) {
            showToast('Please fill in required fields', 'warning')
            return
        }

        try {
            const res = await fetch('/api/admin/transport/routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRoute)
            })

            const data = await res.json()

            if (res.ok && data.route) {
                setRoutes(prev => [...prev, data.route])
                setShowAddRouteModal(false)
                resetNewRoute()
                showToast('Route created successfully', 'success')
            } else {
                showToast(data.error || 'Failed to create route', 'error')
            }
        } catch (error) {
            console.error('Failed to add route:', error)
            showToast('Network error. Please try again.', 'error')
        }
    }

    const resetNewRoute = () => {
        setNewRoute({
            routeName: '',
            routeCode: '',
            vehicleNumber: '',
            driverName: '',
            driverPhone: '',
            morningStartTime: '07:00',
            morningEndTime: '08:30',
            afternoonStartTime: '14:00',
            afternoonEndTime: '16:00',
            stops: [{ name: '', time: '' }]
        })
    }

    // Add stop
    const addStop = () => {
        setNewRoute(prev => ({
            ...prev,
            stops: [...prev.stops, { name: '', time: '' }]
        }))
    }

    // Remove stop
    const removeStop = (index: number) => {
        setNewRoute(prev => ({
            ...prev,
            stops: prev.stops.filter((_, i) => i !== index)
        }))
    }

    // Calculate stats
    const stats = {
        totalRoutes: routes.length,
        activeRoutes: routes.filter(r => r.isActive).length,
        totalStudents: routes.reduce((acc, r) => acc + (r.studentCount || 0), 0),
        todayBoarded: logs.filter(l => l.boardingStatus === 'boarded').length,
        missedBus: logs.filter(l => l.boardingStatus === 'missed').length
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { color: 'from-blue-50 to-blue-100', border: 'border-blue-200' },
                        { color: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200' },
                        { color: 'from-purple-50 to-purple-100', border: 'border-purple-200' },
                        { color: 'from-amber-50 to-amber-100', border: 'border-amber-200' },
                        { color: 'from-red-50 to-red-100', border: 'border-red-200' }
                    ].map((item, i) => (
                        <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${item.color} ${item.border} rounded-xl p-4 border`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="h-3 w-16 bg-white/60 rounded animate-pulse mb-2" />
                                    <div className="h-7 w-12 bg-white/70 rounded animate-pulse" />
                                </div>
                                <div className="w-8 h-8 bg-white/50 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Card Skeleton */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
                                <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-9 w-24 bg-slate-200 rounded-lg animate-pulse" />
                                <div className="h-9 w-28 bg-blue-200 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    </div>
                    <div className="p-2 border-b border-slate-100">
                        <div className="flex gap-2">
                            <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse" />
                            <div className="h-10 w-28 bg-slate-100 rounded-lg animate-pulse" />
                            <div className="h-10 w-20 bg-slate-100 rounded-lg animate-pulse" />
                        </div>
                    </div>
                    <div className="p-6 grid md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="relative overflow-hidden p-4 rounded-xl border-2 border-slate-100">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" style={{ animationDelay: `${i * 150}ms` }} />
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg animate-pulse" />
                                        <div className="space-y-2">
                                            <div className="h-5 w-36 bg-slate-200 rounded animate-pulse" />
                                            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-8 h-8 bg-slate-100 rounded animate-pulse" />
                                        <div className="w-8 h-8 bg-slate-100 rounded animate-pulse" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                                    <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <style jsx>{`
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                    .animate-shimmer {
                        animation: shimmer 1.5s infinite;
                    }
                `}</style>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500 text-white' :
                            toast.type === 'error' ? 'bg-red-500 text-white' :
                                'bg-amber-500 text-white'
                            }`}
                    >
                        {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                        {toast.type === 'error' && <XCircle className="w-5 h-5" />}
                        {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                        <span className="font-medium">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-blue-600 uppercase tracking-wide">Total Routes</p>
                                <p className="text-2xl font-bold text-blue-700">{stats.totalRoutes}</p>
                            </div>
                            <Route className="w-8 h-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-emerald-600 uppercase tracking-wide">Active</p>
                                <p className="text-2xl font-bold text-emerald-700">{stats.activeRoutes}</p>
                            </div>
                            <Bus className="w-8 h-8 text-emerald-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-purple-600 uppercase tracking-wide">Students</p>
                                <p className="text-2xl font-bold text-purple-700">{stats.totalStudents}</p>
                            </div>
                            <Users className="w-8 h-8 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-amber-600 uppercase tracking-wide">Boarded Today</p>
                                <p className="text-2xl font-bold text-amber-700">{stats.todayBoarded}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-amber-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-red-600 uppercase tracking-wide">Missed Bus</p>
                                <p className="text-2xl font-bold text-red-700">{stats.missedBus}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Bus className="w-5 h-5 text-blue-600" />
                                Transport Management
                            </CardTitle>
                            <CardDescription>
                                Manage bus routes and track student transport
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={loadRoutes}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                            <Button size="sm" onClick={() => setShowAddRouteModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Route
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="routes" className="gap-2">
                                <Route className="w-4 h-4" />
                                Routes
                            </TabsTrigger>
                            <TabsTrigger value="logs" className="gap-2">
                                <Clock className="w-4 h-4" />
                                Today's Logs
                            </TabsTrigger>
                            <TabsTrigger value="alerts" className="gap-2">
                                <Bell className="w-4 h-4" />
                                Alerts
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="routes">
                            {routes.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Bus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="font-medium">No transport routes configured</p>
                                    <p className="text-sm">Add routes to start tracking student transport</p>
                                    <Button className="mt-4" onClick={() => setShowAddRouteModal(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Route
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {routes.map(route => (
                                        <motion.div
                                            key={route.id}
                                            layout
                                            className="p-4 rounded-xl border-2 border-slate-200 bg-white hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2.5 rounded-lg bg-blue-100">
                                                        <Bus className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-slate-900">
                                                                {route.routeName}
                                                            </h4>
                                                            {route.routeCode && (
                                                                <Badge variant="outline">{route.routeCode}</Badge>
                                                            )}
                                                            {route.isActive ? (
                                                                <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                                                            ) : (
                                                                <Badge variant="secondary">Inactive</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-500">
                                                            {route.vehicleNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <User className="w-4 h-4" />
                                                    <span>{route.driverName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Phone className="w-4 h-4" />
                                                    <span>{route.driverPhone}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Users className="w-4 h-4" />
                                                    <span>{route.studentCount || 0} students</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{route.stops?.length || 0} stops</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-slate-500">
                                                <div className="flex items-center gap-4">
                                                    <span>
                                                        <strong>AM:</strong> {route.morningStartTime} - {route.morningEndTime}
                                                    </span>
                                                    <span>
                                                        <strong>PM:</strong> {route.afternoonStartTime} - {route.afternoonEndTime}
                                                    </span>
                                                </div>
                                                <Button variant="link" size="sm" className="text-blue-600 p-0">
                                                    View Details <ArrowRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="logs">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-40"
                                    />
                                    <Select
                                        value={selectedRoute?.id || 'all'}
                                        onValueChange={(v) => setSelectedRoute(routes.find(r => r.id === v) || null)}
                                    >
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="All Routes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Routes</SelectItem>
                                            {routes.map(r => (
                                                <SelectItem key={r.id} value={r.id}>{r.routeName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="outline" size="sm" onClick={loadLogs}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>

                            {logs.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="font-medium">No transport logs for this date</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {logs.map(log => (
                                        <div
                                            key={log.id}
                                            className="p-4 rounded-lg border bg-white hover:shadow-sm transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${log.boardingStatus === 'boarded'
                                                        ? 'bg-emerald-100'
                                                        : log.boardingStatus === 'missed'
                                                            ? 'bg-red-100'
                                                            : 'bg-slate-100'
                                                        }`}>
                                                        {log.boardingStatus === 'boarded' ? (
                                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                        ) : log.boardingStatus === 'missed' ? (
                                                            <XCircle className="w-5 h-5 text-red-600" />
                                                        ) : (
                                                            <Clock className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{log.studentName}</span>
                                                            <Badge variant="outline">{log.studentTag}</Badge>
                                                        </div>
                                                        <p className="text-sm text-slate-500">{log.routeName}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right text-sm">
                                                    {log.boardingTime && (
                                                        <p className="text-emerald-600">
                                                            Boarded: {log.boardingTime} @ {log.boardingStop}
                                                        </p>
                                                    )}
                                                    {log.dropTime && (
                                                        <p className="text-blue-600">
                                                            Dropped: {log.dropTime} @ {log.dropStop}
                                                        </p>
                                                    )}
                                                    {log.parentNotified && (
                                                        <Badge variant="secondary" className="mt-1">
                                                            <Bell className="w-3 h-3 mr-1" />
                                                            Parent Notified
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="alerts">
                            <div className="text-center py-12 text-slate-500">
                                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="font-medium">No transport alerts</p>
                                <p className="text-sm">Alerts for missed buses and delays will appear here</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Add Route Modal */}
            <Dialog open={showAddRouteModal} onOpenChange={setShowAddRouteModal}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bus className="w-5 h-5 text-blue-600" />
                            Add Transport Route
                        </DialogTitle>
                        <DialogDescription>
                            Configure a new bus route with stops and timing
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Route Name *</Label>
                                <Input
                                    value={newRoute.routeName}
                                    onChange={(e) => setNewRoute(prev => ({ ...prev, routeName: e.target.value }))}
                                    placeholder="e.g., North City Route"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Route Code</Label>
                                <Input
                                    value={newRoute.routeCode}
                                    onChange={(e) => setNewRoute(prev => ({ ...prev, routeCode: e.target.value }))}
                                    placeholder="e.g., RT-001"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Vehicle Number *</Label>
                            <Input
                                value={newRoute.vehicleNumber}
                                onChange={(e) => setNewRoute(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                                placeholder="e.g., KA-01-AB-1234"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Driver Name</Label>
                                <Input
                                    value={newRoute.driverName}
                                    onChange={(e) => setNewRoute(prev => ({ ...prev, driverName: e.target.value }))}
                                    placeholder="Driver's name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Driver Phone</Label>
                                <Input
                                    value={newRoute.driverPhone}
                                    onChange={(e) => setNewRoute(prev => ({ ...prev, driverPhone: e.target.value }))}
                                    placeholder="Phone number"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                            <h4 className="font-medium text-blue-900 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Timing
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-blue-700">Morning Start</Label>
                                    <Input
                                        type="time"
                                        value={newRoute.morningStartTime}
                                        onChange={(e) => setNewRoute(prev => ({ ...prev, morningStartTime: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-blue-700">Morning End</Label>
                                    <Input
                                        type="time"
                                        value={newRoute.morningEndTime}
                                        onChange={(e) => setNewRoute(prev => ({ ...prev, morningEndTime: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-blue-700">Afternoon Start</Label>
                                    <Input
                                        type="time"
                                        value={newRoute.afternoonStartTime}
                                        onChange={(e) => setNewRoute(prev => ({ ...prev, afternoonStartTime: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-blue-700">Afternoon End</Label>
                                    <Input
                                        type="time"
                                        value={newRoute.afternoonEndTime}
                                        onChange={(e) => setNewRoute(prev => ({ ...prev, afternoonEndTime: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Route Stops</Label>
                                <Button variant="outline" size="sm" onClick={addStop}>
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Stop
                                </Button>
                            </div>
                            {newRoute.stops.map((stop, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500 w-6">{index + 1}.</span>
                                    <Input
                                        value={stop.name}
                                        onChange={(e) => {
                                            const newStops = [...newRoute.stops]
                                            newStops[index].name = e.target.value
                                            setNewRoute(prev => ({ ...prev, stops: newStops }))
                                        }}
                                        placeholder="Stop name"
                                        className="flex-1"
                                    />
                                    <Input
                                        type="time"
                                        value={stop.time}
                                        onChange={(e) => {
                                            const newStops = [...newRoute.stops]
                                            newStops[index].time = e.target.value
                                            setNewRoute(prev => ({ ...prev, stops: newStops }))
                                        }}
                                        className="w-28"
                                    />
                                    {newRoute.stops.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeStop(index)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddRouteModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddRoute}>
                            Create Route
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
