'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    AlertTriangle,
    AlertCircle,
    AlertOctagon,
    Shield,
    Eye,
    EyeOff,
    CheckCircle,
    XCircle,
    Clock,
    MapPin,
    User,
    Activity,
    TrendingUp,
    Bell,
    Filter,
    Search,
    RefreshCw,
    ChevronRight,
    ExternalLink,
    MessageSquare,
    Flag,
    Zap,
    BarChart3
} from 'lucide-react'

interface BehaviorAlert {
    id: string
    studentId: string
    studentName: string
    studentTag: string
    alertType:
    | 'unusual_movement'
    | 'truancy_pattern'
    | 'restricted_zone'
    | 'after_hours_presence'
    | 'early_arrival'
    | 'excessive_exits'
    | 'loitering'
    | 'tailgating'
    | 'pattern_anomaly'
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    details: Record<string, any>
    isResolved: boolean
    resolvedBy?: string
    resolvedAt?: string
    resolutionNotes?: string
    actionTaken?: string
    parentNotified: boolean
    adminNotified: boolean
    createdAt: string
}

interface BehaviorAlertsProps {
    schoolId?: string
}

const alertTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
    unusual_movement: { icon: Activity, color: 'text-amber-600 bg-amber-100', label: 'Unusual Movement' },
    truancy_pattern: { icon: AlertCircle, color: 'text-red-600 bg-red-100', label: 'Truancy Pattern' },
    restricted_zone: { icon: Shield, color: 'text-purple-600 bg-purple-100', label: 'Restricted Zone' },
    after_hours_presence: { icon: Clock, color: 'text-orange-600 bg-orange-100', label: 'After Hours' },
    early_arrival: { icon: Clock, color: 'text-blue-600 bg-blue-100', label: 'Early Arrival' },
    excessive_exits: { icon: TrendingUp, color: 'text-amber-600 bg-amber-100', label: 'Excessive Exits' },
    loitering: { icon: MapPin, color: 'text-slate-600 bg-slate-100', label: 'Loitering' },
    tailgating: { icon: AlertOctagon, color: 'text-red-600 bg-red-100', label: 'Tailgating' },
    pattern_anomaly: { icon: BarChart3, color: 'text-indigo-600 bg-indigo-100', label: 'AI Pattern Anomaly' }
}

const severityConfig: Record<string, { color: string; bg: string; label: string }> = {
    low: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Low' },
    medium: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Medium' },
    high: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'High' },
    critical: { color: 'text-red-600', bg: 'bg-red-100', label: 'Critical' }
}

export function BehaviorAlerts({ schoolId }: BehaviorAlertsProps) {
    const [alerts, setAlerts] = useState<BehaviorAlert[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedAlert, setSelectedAlert] = useState<BehaviorAlert | null>(null)
    const [showResolveModal, setShowResolveModal] = useState(false)
    const [filterSeverity, setFilterSeverity] = useState<string>('all')
    const [filterType, setFilterType] = useState<string>('all')
    const [filterResolved, setFilterResolved] = useState<string>('unresolved')
    const [searchQuery, setSearchQuery] = useState('')
    const [resolutionNotes, setResolutionNotes] = useState('')
    const [actionTaken, setActionTaken] = useState('')
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 5000)
    }, [])

    // Load alerts
    const loadAlerts = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterResolved !== 'all') params.append('resolved', filterResolved === 'resolved' ? 'true' : 'false')
            if (filterSeverity !== 'all') params.append('severity', filterSeverity)
            if (filterType !== 'all') params.append('type', filterType)

            const res = await fetch(`/api/admin/aegisx/behavior-alerts?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setAlerts(data.alerts || [])
            }
        } catch (error) {
            console.error('Failed to load alerts:', error)
            showToast('Failed to load behavior alerts', 'error')
        } finally {
            setIsLoading(false)
        }
    }, [filterResolved, filterSeverity, filterType, showToast])

    useEffect(() => {
        loadAlerts()
    }, [loadAlerts])

    // Resolve alert
    const handleResolve = async () => {
        if (!selectedAlert) return

        try {
            const res = await fetch(`/api/admin/aegisx/behavior-alerts/${selectedAlert.id}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resolutionNotes,
                    actionTaken
                })
            })

            if (res.ok) {
                setAlerts(prev => prev.map(a =>
                    a.id === selectedAlert.id
                        ? { ...a, isResolved: true, resolutionNotes, actionTaken }
                        : a
                ))
                setShowResolveModal(false)
                setSelectedAlert(null)
                setResolutionNotes('')
                setActionTaken('')
                showToast('Alert resolved successfully', 'success')
            } else {
                showToast('Failed to resolve alert', 'error')
            }
        } catch (error) {
            console.error('Failed to resolve alert:', error)
            showToast('Network error. Please try again.', 'error')
        }
    }

    // Filter alerts
    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            const matchesSearch =
                alert.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                alert.description.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesSearch
        })
    }, [alerts, searchQuery])

    // Calculate stats
    const stats = useMemo(() => {
        const total = alerts.length
        const unresolved = alerts.filter(a => !a.isResolved).length
        const critical = alerts.filter(a => a.severity === 'critical' && !a.isResolved).length
        const today = alerts.filter(a => {
            const alertDate = new Date(a.createdAt).toDateString()
            return alertDate === new Date().toDateString()
        }).length
        return { total, unresolved, critical, today }
    }, [alerts])

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-slate-200 rounded-xl" />
                    ))}
                </div>
                <div className="h-96 bg-slate-200 rounded-xl" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Alerts</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-slate-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-amber-600 uppercase tracking-wide">Unresolved</p>
                                <p className="text-2xl font-bold text-amber-700">{stats.unresolved}</p>
                            </div>
                            <Clock className="w-8 h-8 text-amber-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-red-600 uppercase tracking-wide">Critical</p>
                                <p className="text-2xl font-bold text-red-700">{stats.critical}</p>
                            </div>
                            <AlertOctagon className="w-8 h-8 text-red-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-blue-600 uppercase tracking-wide">Today</p>
                                <p className="text-2xl font-bold text-blue-700">{stats.today}</p>
                            </div>
                            <Zap className="w-8 h-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                                Behavior Alerts
                            </CardTitle>
                            <CardDescription>
                                AI-detected unusual patterns and security events
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={loadAlerts}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="Search alerts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={filterResolved} onValueChange={setFilterResolved}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="unresolved">Unresolved</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severity</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Alert Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {Object.entries(alertTypeConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Alerts List */}
                    {filteredAlerts.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No behavior alerts</p>
                            <p className="text-sm">No alerts match your current filters</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAlerts.map(alert => {
                                const typeConfig = alertTypeConfig[alert.alertType] || alertTypeConfig.unusual_movement
                                const sevConfig = severityConfig[alert.severity]
                                const TypeIcon = typeConfig.icon

                                return (
                                    <motion.div
                                        key={alert.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl border-2 ${alert.isResolved
                                                ? 'bg-slate-50 border-slate-200 opacity-70'
                                                : alert.severity === 'critical'
                                                    ? 'bg-red-50 border-red-200'
                                                    : 'bg-white border-slate-200'
                                            } hover:shadow-sm transition-all`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className={`p-2.5 rounded-lg ${typeConfig.color}`}>
                                                    <TypeIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-semibold text-slate-900">{alert.title}</h4>
                                                        <Badge className={`${sevConfig.bg} ${sevConfig.color} border-0`}>
                                                            {sevConfig.label}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {typeConfig.label}
                                                        </Badge>
                                                        {alert.isResolved && (
                                                            <Badge className="bg-emerald-100 text-emerald-700">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Resolved
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            {alert.studentName}
                                                        </span>
                                                        {alert.studentTag && (
                                                            <span>{alert.studentTag}</span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(alert.createdAt).toLocaleString()}
                                                        </span>
                                                        {alert.parentNotified && (
                                                            <span className="flex items-center gap-1 text-blue-600">
                                                                <Bell className="w-3 h-3" />
                                                                Parent Notified
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedAlert(alert)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {!alert.isResolved && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedAlert(alert)
                                                            setShowResolveModal(true)
                                                        }}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Resolve
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Resolution Info */}
                                        {alert.isResolved && alert.resolutionNotes && (
                                            <div className="mt-3 pt-3 border-t border-slate-200">
                                                <p className="text-xs text-slate-500">
                                                    <strong>Resolution:</strong> {alert.resolutionNotes}
                                                </p>
                                                {alert.actionTaken && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        <strong>Action Taken:</strong> {alert.actionTaken}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Alert Details Modal */}
            <Dialog open={!!selectedAlert && !showResolveModal} onOpenChange={() => setSelectedAlert(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            Alert Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedAlert && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg ${alertTypeConfig[selectedAlert.alertType]?.color}`}>
                                    {(() => {
                                        const Icon = alertTypeConfig[selectedAlert.alertType]?.icon || AlertTriangle
                                        return <Icon className="w-6 h-6" />
                                    })()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{selectedAlert.title}</h3>
                                    <p className="text-sm text-slate-500">{selectedAlert.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <Label className="text-xs text-slate-500">Student</Label>
                                    <p className="font-medium">{selectedAlert.studentName}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Student ID</Label>
                                    <p className="font-medium">{selectedAlert.studentTag || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Severity</Label>
                                    <Badge className={`${severityConfig[selectedAlert.severity].bg} ${severityConfig[selectedAlert.severity].color} mt-1`}>
                                        {severityConfig[selectedAlert.severity].label}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Alert Type</Label>
                                    <p className="font-medium">{alertTypeConfig[selectedAlert.alertType]?.label}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Time</Label>
                                    <p className="font-medium">{new Date(selectedAlert.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Status</Label>
                                    <p className="font-medium">{selectedAlert.isResolved ? 'Resolved' : 'Unresolved'}</p>
                                </div>
                            </div>

                            {selectedAlert.details && Object.keys(selectedAlert.details).length > 0 && (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <Label className="text-xs text-blue-600">Additional Details</Label>
                                    <pre className="text-xs mt-2 overflow-auto max-h-32">
                                        {JSON.stringify(selectedAlert.details, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                            Close
                        </Button>
                        {selectedAlert && !selectedAlert.isResolved && (
                            <Button onClick={() => setShowResolveModal(true)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Resolve Alert
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Resolve Modal */}
            <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            Resolve Alert
                        </DialogTitle>
                        <DialogDescription>
                            {selectedAlert && (
                                <span>Resolving: <strong>{selectedAlert.title}</strong> for {selectedAlert.studentName}</span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Action Taken</Label>
                            <Select value={actionTaken} onValueChange={setActionTaken}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select action taken" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="investigated">Investigated - No Issue Found</SelectItem>
                                    <SelectItem value="verbal_warning">Verbal Warning Given</SelectItem>
                                    <SelectItem value="parent_contacted">Parent Contacted</SelectItem>
                                    <SelectItem value="counselor_referral">Referred to Counselor</SelectItem>
                                    <SelectItem value="disciplinary">Disciplinary Action Initiated</SelectItem>
                                    <SelectItem value="false_positive">False Positive</SelectItem>
                                    <SelectItem value="system_error">System Error</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Resolution Notes</Label>
                            <Textarea
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                placeholder="Describe the resolution and any follow-up actions..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResolveModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleResolve} className="bg-emerald-600 hover:bg-emerald-700">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Resolved
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
