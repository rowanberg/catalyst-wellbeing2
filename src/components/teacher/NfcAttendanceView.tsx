'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Clock,
    Users,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Search,
    Filter,
    RefreshCw,
    Calendar,
    MapPin,
    Zap,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    ChevronDown,
    Timer,
    Activity,
    Bell,
    Eye,
    Edit,
    RotateCw,
    Wifi,
    WifiOff,
    CreditCard,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

interface Period {
    id: string
    periodNumber: number
    periodName: string
    periodType: 'class' | 'break' | 'lunch' | 'assembly' | 'activity'
    startTime: string
    endTime: string
    lateThresholdMinutes: number
    isActive: boolean
}

interface PeriodAttendance {
    id: string
    studentId: string
    studentName: string
    studentTag: string
    periodId: string
    periodName: string
    actualEntryTime: string | null
    actualExitTime: string | null
    autoStatus: 'present' | 'absent' | 'late' | 'early_exit' | 'partial' | 'excused'
    finalStatus: string | null
    lateByMinutes: number
    isOverridden: boolean
    overrideReason?: string
    entryReaderName?: string
}

interface LiveScan {
    id: string
    cardUid: string
    studentName: string
    studentTag: string
    readerName: string
    readerLocation: string
    accessGranted: boolean
    denialReason?: string
    timestamp: string
}

interface NfcAttendanceProps {
    classId?: string
    className?: string
    onBack?: () => void
}

const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    present: { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle, label: 'Present' },
    absent: { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle, label: 'Absent' },
    late: { color: 'text-amber-600', bg: 'bg-amber-100', icon: Clock, label: 'Late' },
    early_exit: { color: 'text-orange-600', bg: 'bg-orange-100', icon: ArrowRight, label: 'Early Exit' },
    partial: { color: 'text-purple-600', bg: 'bg-purple-100', icon: Timer, label: 'Partial' },
    excused: { color: 'text-blue-600', bg: 'bg-blue-100', icon: CheckCircle, label: 'Excused' }
}

export function NfcAttendanceView({ classId, className, onBack }: NfcAttendanceProps) {
    const [periods, setPeriods] = useState<Period[]>([])
    const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
    const [attendance, setAttendance] = useState<PeriodAttendance[]>([])
    const [liveScans, setLiveScans] = useState<LiveScan[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLiveMode, setIsLiveMode] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [showOverrideModal, setShowOverrideModal] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<PeriodAttendance | null>(null)
    const [overrideStatus, setOverrideStatus] = useState('')
    const [overrideReason, setOverrideReason] = useState('')
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

    // Live polling for NFC scans
    useEffect(() => {
        if (!isLiveMode) return

        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`/api/teacher/nfc-attendance/live?classId=${classId}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.scans && data.scans.length > 0) {
                        setLiveScans(prev => [...data.scans, ...prev].slice(0, 50))
                        // Refresh attendance when new scans come in
                        loadAttendance()
                    }
                }
            } catch (error) {
                console.error('Failed to poll live scans:', error)
            }
        }, 3000) // Poll every 3 seconds

        return () => clearInterval(pollInterval)
    }, [isLiveMode, classId])

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 5000)
    }, [])

    // Load periods
    const loadPeriods = useCallback(async () => {
        try {
            const res = await fetch('/api/teacher/nfc-attendance/periods')
            if (res.ok) {
                const data = await res.json()
                setPeriods(data.periods || [])

                // Auto-select current period
                const now = new Date()
                const currentTime = now.toTimeString().slice(0, 5)
                const currentPeriod = data.periods?.find((p: Period) =>
                    currentTime >= p.startTime && currentTime <= p.endTime
                )
                if (currentPeriod) {
                    setSelectedPeriod(currentPeriod)
                } else if (data.periods?.length > 0) {
                    setSelectedPeriod(data.periods[0])
                }
            }
        } catch (error) {
            console.error('Failed to load periods:', error)
        }
    }, [])

    // Load attendance for selected period
    const loadAttendance = useCallback(async () => {
        if (!selectedPeriod || !classId) return

        setIsLoading(true)
        try {
            const res = await fetch(
                `/api/teacher/nfc-attendance/records?periodId=${selectedPeriod.id}&classId=${classId}&date=${selectedDate}`
            )
            if (res.ok) {
                const data = await res.json()
                setAttendance(data.records || [])
            }
        } catch (error) {
            console.error('Failed to load attendance:', error)
            showToast('Failed to load attendance records', 'error')
        } finally {
            setIsLoading(false)
        }
    }, [selectedPeriod, classId, selectedDate, showToast])

    useEffect(() => {
        loadPeriods()
    }, [loadPeriods])

    useEffect(() => {
        loadAttendance()
    }, [loadAttendance])

    // Filter attendance
    const filteredAttendance = useMemo(() => {
        return attendance.filter(record => {
            const matchesSearch = record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.studentTag?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = filterStatus === 'all' || record.autoStatus === filterStatus
            return matchesSearch && matchesStatus
        })
    }, [attendance, searchQuery, filterStatus])

    // Calculate stats
    const stats = useMemo(() => {
        const total = attendance.length
        const present = attendance.filter(a => a.autoStatus === 'present').length
        const late = attendance.filter(a => a.autoStatus === 'late').length
        const absent = attendance.filter(a => a.autoStatus === 'absent').length
        const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0
        return { total, present, late, absent, rate }
    }, [attendance])

    // Handle override
    const handleOverride = async () => {
        if (!selectedStudent || !overrideStatus) {
            showToast('Please select a status', 'warning')
            return
        }

        try {
            const res = await fetch('/api/teacher/nfc-attendance/override', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attendanceId: selectedStudent.id,
                    newStatus: overrideStatus,
                    reason: overrideReason
                })
            })

            if (res.ok) {
                setAttendance(prev => prev.map(a =>
                    a.id === selectedStudent.id
                        ? {
                            ...a,
                            finalStatus: overrideStatus,
                            isOverridden: true,
                            overrideReason
                        }
                        : a
                ))
                setShowOverrideModal(false)
                setSelectedStudent(null)
                setOverrideStatus('')
                setOverrideReason('')
                showToast('Attendance overridden successfully', 'success')
            } else {
                showToast('Failed to override attendance', 'error')
            }
        } catch (error) {
            console.error('Failed to override:', error)
            showToast('Network error. Please try again.', 'error')
        }
    }

    // Navigate dates
    const changeDate = (days: number) => {
        const date = new Date(selectedDate)
        date.setDate(date.getDate() + days)
        setSelectedDate(date.toISOString().split('T')[0])
    }

    const isToday = selectedDate === new Date().toISOString().split('T')[0]

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

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            NFC Attendance
                            {className && <span className="text-slate-500">• {className}</span>}
                        </h2>
                        <p className="text-sm text-slate-500">
                            Real-time attendance tracking via NFC scans
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Live Mode Toggle */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isLiveMode ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {isLiveMode ? (
                            <Wifi className="w-4 h-4 animate-pulse" />
                        ) : (
                            <WifiOff className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">Live</span>
                        <Switch
                            checked={isLiveMode}
                            onCheckedChange={setIsLiveMode}
                        />
                    </div>

                    {/* Date Navigator */}
                    <div className="flex items-center gap-1 bg-white rounded-lg border px-2 py-1">
                        <Button variant="ghost" size="sm" onClick={() => changeDate(-1)}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="px-2 min-w-[100px] text-center">
                            <span className="text-sm font-medium">
                                {isToday ? 'Today' : new Date(selectedDate).toLocaleDateString()}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => changeDate(1)}
                            disabled={isToday}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button variant="outline" size="sm" onClick={loadAttendance}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                            </div>
                            <Users className="w-8 h-8 text-slate-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-emerald-600 uppercase tracking-wide">Present</p>
                                <p className="text-2xl font-bold text-emerald-700">{stats.present}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-amber-600 uppercase tracking-wide">Late</p>
                                <p className="text-2xl font-bold text-amber-700">{stats.late}</p>
                            </div>
                            <Clock className="w-8 h-8 text-amber-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-red-600 uppercase tracking-wide">Absent</p>
                                <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-blue-600 uppercase tracking-wide">Rate</p>
                                <p className="text-2xl font-bold text-blue-700">{stats.rate}%</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Period Selector */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Select Period</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {periods.map(period => {
                            const isSelected = selectedPeriod?.id === period.id
                            const isCurrent = (() => {
                                if (!isToday) return false
                                const now = new Date().toTimeString().slice(0, 5)
                                return now >= period.startTime && now <= period.endTime
                            })()

                            return (
                                <motion.button
                                    key={period.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`px-4 py-2 rounded-lg border-2 transition-all ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : isCurrent
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {isCurrent && !isSelected && (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        )}
                                        <span className="font-medium">{period.periodName}</span>
                                        <span className="text-xs opacity-70">
                                            {period.startTime} - {period.endTime}
                                        </span>
                                    </div>
                                </motion.button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance Table */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Attendance Records
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search student..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 w-48"
                                    />
                                </div>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Filter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="present">Present</SelectItem>
                                        <SelectItem value="late">Late</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                        <SelectItem value="early_exit">Early Exit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        ) : filteredAttendance.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="font-medium">No attendance records</p>
                                <p className="text-sm">
                                    {isLiveMode
                                        ? 'Waiting for NFC scans...'
                                        : 'No records for this period and date'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredAttendance.map(record => {
                                    const status = record.finalStatus || record.autoStatus
                                    const config = statusConfig[status] || statusConfig.absent
                                    const StatusIcon = config.icon

                                    return (
                                        <motion.div
                                            key={record.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 rounded-lg border bg-white hover:shadow-sm transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${config.bg}`}>
                                                        <StatusIcon className={`w-5 h-5 ${config.color}`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-slate-900">
                                                                {record.studentName}
                                                            </span>
                                                            {record.studentTag && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {record.studentTag}
                                                                </Badge>
                                                            )}
                                                            {record.isOverridden && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Overridden
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                            {record.actualEntryTime && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    In: {record.actualEntryTime}
                                                                </span>
                                                            )}
                                                            {record.actualExitTime && (
                                                                <span className="flex items-center gap-1">
                                                                    <ArrowRight className="w-3 h-3" />
                                                                    Out: {record.actualExitTime}
                                                                </span>
                                                            )}
                                                            {record.lateByMinutes > 0 && (
                                                                <span className="text-amber-600">
                                                                    {record.lateByMinutes} min late
                                                                </span>
                                                            )}
                                                            {record.entryReaderName && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {record.entryReaderName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Badge className={`${config.bg} ${config.color} border-0`}>
                                                        {config.label}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedStudent(record)
                                                            setOverrideStatus(status)
                                                            setShowOverrideModal(true)
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Live Feed */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className={`w-5 h-5 ${isLiveMode ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                            Live NFC Feed
                        </CardTitle>
                        <CardDescription>
                            {isLiveMode
                                ? 'Monitoring scans in real-time'
                                : 'Enable live mode to see scans'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!isLiveMode ? (
                            <div className="text-center py-8">
                                <WifiOff className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-sm text-slate-500">Live mode is off</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => setIsLiveMode(true)}
                                >
                                    <Wifi className="w-4 h-4 mr-2" />
                                    Enable Live Mode
                                </Button>
                            </div>
                        ) : liveScans.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                    <Wifi className="w-6 h-6 text-emerald-600 animate-pulse" />
                                </div>
                                <p className="text-sm text-slate-500">Waiting for scans...</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                <AnimatePresence>
                                    {liveScans.slice(0, 20).map((scan, index) => (
                                        <motion.div
                                            key={scan.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`p-3 rounded-lg border ${scan.accessGranted
                                                    ? 'bg-emerald-50 border-emerald-200'
                                                    : 'bg-red-50 border-red-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {scan.accessGranted ? (
                                                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                    )}
                                                    <span className="font-medium text-sm">
                                                        {scan.studentName || 'Unknown'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(scan.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                                <MapPin className="w-3 h-3" />
                                                {scan.readerName}
                                                {scan.denialReason && (
                                                    <span className="text-red-500">• {scan.denialReason}</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Override Modal */}
            <Dialog open={showOverrideModal} onOpenChange={setShowOverrideModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5 text-blue-600" />
                            Override Attendance
                        </DialogTitle>
                        <DialogDescription>
                            {selectedStudent && (
                                <span>Changing status for <strong>{selectedStudent.studentName}</strong></span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>New Status</Label>
                            <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(statusConfig).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            <div className="flex items-center gap-2">
                                                <config.icon className={`w-4 h-4 ${config.color}`} />
                                                {config.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Reason for Override</Label>
                            <Textarea
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                                placeholder="Enter reason for changing status..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowOverrideModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleOverride}>
                            Save Override
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
