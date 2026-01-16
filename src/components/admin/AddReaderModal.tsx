'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, Wifi, Plus, ChevronRight, ChevronLeft, Check, AlertTriangle,
    Building, BookOpen, Coffee, DoorOpen, FlaskConical, Bus,
    GraduationCap, Dumbbell, TreePine, Car, Briefcase, Music,
    Palette, Wrench, MonitorPlay, LayoutGrid, Clock, Shield,
    Users, Zap, Settings, MapPin, Hash, Scan, QrCode
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// Location type configuration
const LOCATION_TYPES = [
    { id: 'gate', name: 'Main Gate/Entry', icon: DoorOpen, color: '#3b82f6', description: 'Campus entry/exit points' },
    { id: 'classroom', name: 'Classroom', icon: GraduationCap, color: '#8b5cf6', description: 'Individual classrooms' },
    { id: 'library', name: 'Library', icon: BookOpen, color: '#06b6d4', description: 'Library access control' },
    { id: 'canteen', name: 'Canteen/Cafeteria', icon: Coffee, color: '#f59e0b', description: 'Dining area access' },
    { id: 'lab', name: 'Laboratory', icon: FlaskConical, color: '#10b981', description: 'Science labs, computer labs' },
    { id: 'bus', name: 'School Bus', icon: Bus, color: '#ef4444', description: 'Bus boarding verification' },
    { id: 'gymnasium', name: 'Gymnasium/Sports', icon: Dumbbell, color: '#ec4899', description: 'Sports facilities' },
    { id: 'playground', name: 'Playground', icon: TreePine, color: '#22c55e', description: 'Outdoor play areas' },
    { id: 'parking', name: 'Parking Area', icon: Car, color: '#64748b', description: 'Staff/visitor parking' },
    { id: 'office', name: 'Admin Office', icon: Briefcase, color: '#6366f1', description: 'Administrative areas' },
    { id: 'staffroom', name: 'Staff Room', icon: Users, color: '#14b8a6', description: 'Teacher common areas' },
    { id: 'auditorium', name: 'Auditorium/Hall', icon: MonitorPlay, color: '#a855f7', description: 'Events and assemblies' },
    { id: 'music', name: 'Music Room', icon: Music, color: '#f97316', description: 'Music practice rooms' },
    { id: 'art', name: 'Art Room', icon: Palette, color: '#e11d48', description: 'Art and craft areas' },
    { id: 'workshop', name: 'Workshop', icon: Wrench, color: '#84cc16', description: 'Technical workshops' },
    { id: 'other', name: 'Other', icon: LayoutGrid, color: '#94a3b8', description: 'Custom locations' },
]

// Access schedule presets
const ACCESS_SCHEDULES = [
    { id: 'always', name: 'Always Open', description: '24/7 access' },
    { id: 'school_hours', name: 'School Hours', description: '7:00 AM - 4:00 PM on weekdays' },
    { id: 'extended', name: 'Extended Hours', description: '6:00 AM - 8:00 PM on weekdays' },
    { id: 'weekdays', name: 'Weekdays Only', description: 'Mon-Fri, all hours' },
    { id: 'custom', name: 'Custom Schedule', description: 'Define your own hours' },
]

// Permission levels
const PERMISSION_LEVELS = [
    { id: 'all', name: 'All Users', description: 'Students, teachers, and staff' },
    { id: 'staff_only', name: 'Staff Only', description: 'Teachers and admin staff' },
    { id: 'students_only', name: 'Students Only', description: 'Only student access' },
    { id: 'specific_grades', name: 'Specific Grades', description: 'Select grade levels' },
    { id: 'specific_classes', name: 'Specific Classes', description: 'Select class sections' },
]

interface AddReaderModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onReaderAdded: (reader: any) => void
    busRoutes?: { id: string; name: string; busNumber: string }[]
}

export function AddReaderModal({ open, onOpenChange, onReaderAdded, busRoutes = [] }: AddReaderModalProps) {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [locationType, setLocationType] = useState<string>('')
    const [readerName, setReaderName] = useState('')
    const [buildingLocation, setBuildingLocation] = useState('')
    const [serialNumber, setSerialNumber] = useState('')

    // Bus-specific
    const [selectedBusRoute, setSelectedBusRoute] = useState('')
    const [busNumber, setBusNumber] = useState('')

    // Advanced settings
    const [accessSchedule, setAccessSchedule] = useState('school_hours')
    const [permissionLevel, setPermissionLevel] = useState('all')
    const [enableAutoProvisioning, setEnableAutoProvisioning] = useState(true)
    const [enableOfflineMode, setEnableOfflineMode] = useState(true)
    const [enableAlerts, setEnableAlerts] = useState(true)
    const [maxCapacity, setMaxCapacity] = useState('')

    const selectedType = useMemo(() =>
        LOCATION_TYPES.find(t => t.id === locationType),
        [locationType]
    )

    const totalSteps = locationType === 'bus' ? 4 : 3

    const resetForm = () => {
        setStep(1)
        setLocationType('')
        setReaderName('')
        setBuildingLocation('')
        setSerialNumber('')
        setSelectedBusRoute('')
        setBusNumber('')
        setAccessSchedule('school_hours')
        setPermissionLevel('all')
        setEnableAutoProvisioning(true)
        setEnableOfflineMode(true)
        setEnableAlerts(true)
        setMaxCapacity('')
        setError(null)
    }

    const handleClose = () => {
        resetForm()
        onOpenChange(false)
    }

    const canProceed = () => {
        switch (step) {
            case 1:
                return locationType !== ''
            case 2:
                if (locationType === 'bus') {
                    return readerName && (selectedBusRoute || busNumber)
                }
                return readerName && buildingLocation
            case 3:
                return serialNumber.length >= 4
            case 4:
                return true
            default:
                return false
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError(null)

        try {
            const payload = {
                name: readerName,
                location: locationType === 'bus'
                    ? `Bus ${busNumber || selectedBusRoute}`
                    : buildingLocation,
                type: locationType,
                serialNumber: serialNumber,
                config: {
                    accessSchedule,
                    permissionLevel,
                    autoProvisioning: enableAutoProvisioning,
                    offlineMode: enableOfflineMode,
                    alertsEnabled: enableAlerts,
                    maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
                    ...(locationType === 'bus' && {
                        busRouteId: selectedBusRoute,
                        busNumber: busNumber
                    })
                }
            }

            const res = await fetch('/api/admin/aegisx/readers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (res.ok && data.reader) {
                onReaderAdded(data.reader)
                handleClose()
            } else {
                setError(data.error || 'Failed to add reader')
            }
        } catch (err: any) {
            console.error('Failed to add reader:', err)
            setError('Network error. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                        <Plus className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">Add NFC Reader</h2>
                                        <p className="text-xs text-slate-500">Configure a new smart access point</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClose}
                                    className="rounded-full w-8 h-8 p-0 hover:bg-slate-200"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Progress Steps */}
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    {Array.from({ length: totalSteps }).map((_, i) => (
                                        <React.Fragment key={i}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step > i + 1
                                                        ? 'bg-emerald-500 text-white'
                                                        : step === i + 1
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-200 text-slate-500'
                                                    }`}>
                                                    {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                                                </div>
                                                <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? 'text-blue-600' : 'text-slate-500'
                                                    }`}>
                                                    {i === 0 && 'Type'}
                                                    {i === 1 && 'Details'}
                                                    {i === 2 && (locationType === 'bus' ? 'Bus Config' : 'Device')}
                                                    {i === 3 && 'Settings'}
                                                </span>
                                            </div>
                                            {i < totalSteps - 1 && (
                                                <div className={`flex-1 h-0.5 mx-2 ${step > i + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                                                    }`} />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <AnimatePresence mode="wait">
                                    {/* Step 1: Location Type */}
                                    {step === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            <div className="text-center mb-6">
                                                <h3 className="text-lg font-semibold text-slate-800">Select Location Type</h3>
                                                <p className="text-sm text-slate-500">What type of access point is this reader for?</p>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {LOCATION_TYPES.map((type) => {
                                                    const Icon = type.icon
                                                    const isSelected = locationType === type.id
                                                    return (
                                                        <motion.button
                                                            key={type.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setLocationType(type.id)}
                                                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                                                }`}
                                                        >
                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2">
                                                                    <Check className="w-4 h-4 text-blue-600" />
                                                                </div>
                                                            )}
                                                            <div
                                                                className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                                                                style={{ backgroundColor: `${type.color}15` }}
                                                            >
                                                                <Icon className="w-5 h-5" style={{ color: type.color }} />
                                                            </div>
                                                            <p className="font-medium text-sm text-slate-800 truncate">{type.name}</p>
                                                            <p className="text-xs text-slate-500 truncate">{type.description}</p>
                                                        </motion.button>
                                                    )
                                                })}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 2: Basic Details */}
                                    {step === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-5"
                                        >
                                            <div className="text-center mb-6">
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                    {selectedType && (
                                                        <div
                                                            className="p-2 rounded-lg"
                                                            style={{ backgroundColor: `${selectedType.color}15` }}
                                                        >
                                                            <selectedType.icon
                                                                className="w-5 h-5"
                                                                style={{ color: selectedType.color }}
                                                            />
                                                        </div>
                                                    )}
                                                    <h3 className="text-lg font-semibold text-slate-800">
                                                        {selectedType?.name} Reader Details
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-slate-500">Provide information about this reader</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Reader Name *</Label>
                                                    <Input
                                                        placeholder={locationType === 'bus'
                                                            ? 'e.g., Bus 12 - Entry Scanner'
                                                            : 'e.g., Library Main Entrance'
                                                        }
                                                        value={readerName}
                                                        onChange={(e) => setReaderName(e.target.value)}
                                                        className="h-11"
                                                    />
                                                    <p className="text-xs text-slate-500">A descriptive name for easy identification</p>
                                                </div>

                                                {locationType === 'bus' ? (
                                                    <>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-sm font-medium">Bus Route</Label>
                                                                <Select value={selectedBusRoute} onValueChange={setSelectedBusRoute}>
                                                                    <SelectTrigger className="h-11">
                                                                        <SelectValue placeholder="Select route" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {busRoutes.length > 0 ? (
                                                                            busRoutes.map(route => (
                                                                                <SelectItem key={route.id} value={route.id}>
                                                                                    {route.name} ({route.busNumber})
                                                                                </SelectItem>
                                                                            ))
                                                                        ) : (
                                                                            <SelectItem value="none" disabled>
                                                                                No routes configured
                                                                            </SelectItem>
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-sm font-medium">Bus Number *</Label>
                                                                <Input
                                                                    placeholder="e.g., BUS-12"
                                                                    value={busNumber}
                                                                    onChange={(e) => setBusNumber(e.target.value)}
                                                                    className="h-11 font-mono uppercase"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                                                            <div className="flex items-start gap-3">
                                                                <Bus className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                                                <div>
                                                                    <p className="font-medium text-amber-800 text-sm">Bus Reader Configuration</p>
                                                                    <p className="text-xs text-amber-700 mt-1">
                                                                        Bus readers track student boarding and alighting. They work in offline mode when no network is available and sync when connected.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">Building/Block *</Label>
                                                            <Input
                                                                placeholder="e.g., Block A"
                                                                value={buildingLocation}
                                                                onChange={(e) => setBuildingLocation(e.target.value)}
                                                                className="h-11"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">Floor/Room</Label>
                                                            <Select defaultValue="ground">
                                                                <SelectTrigger className="h-11">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="basement">Basement</SelectItem>
                                                                    <SelectItem value="ground">Ground Floor</SelectItem>
                                                                    <SelectItem value="1">1st Floor</SelectItem>
                                                                    <SelectItem value="2">2nd Floor</SelectItem>
                                                                    <SelectItem value="3">3rd Floor</SelectItem>
                                                                    <SelectItem value="4">4th Floor</SelectItem>
                                                                    <SelectItem value="5">5th Floor</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 3: Device Registration */}
                                    {step === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-5"
                                        >
                                            <div className="text-center mb-6">
                                                <h3 className="text-lg font-semibold text-slate-800">Device Registration</h3>
                                                <p className="text-sm text-slate-500">Enter the device serial number or scan the QR code</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Serial Number / Device ID *</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="e.g., CW-NFC-2024-0001"
                                                            value={serialNumber}
                                                            onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                                                            className="h-11 font-mono uppercase flex-1"
                                                        />
                                                        <Button variant="outline" size="icon" className="h-11 w-11" title="Scan QR Code">
                                                            <QrCode className="w-5 h-5" />
                                                        </Button>
                                                        <Button variant="outline" size="icon" className="h-11 w-11" title="Auto-detect">
                                                            <Scan className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-slate-500">Find this on the device label or scan the QR code</p>
                                                </div>

                                                {/* Quick Settings */}
                                                <div className="grid gap-3 pt-2">
                                                    <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100">
                                                        <div className="flex items-center gap-3">
                                                            <Zap className="w-5 h-5 text-blue-600" />
                                                            <div>
                                                                <p className="font-medium text-blue-900 text-sm">Auto-Provisioning</p>
                                                                <p className="text-xs text-blue-700">Sync configuration automatically</p>
                                                            </div>
                                                        </div>
                                                        <Switch
                                                            checked={enableAutoProvisioning}
                                                            onCheckedChange={setEnableAutoProvisioning}
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                        <div className="flex items-center gap-3">
                                                            <Wifi className="w-5 h-5 text-slate-600" />
                                                            <div>
                                                                <p className="font-medium text-slate-900 text-sm">Offline Mode</p>
                                                                <p className="text-xs text-slate-600">Works without network connection</p>
                                                            </div>
                                                        </div>
                                                        <Switch
                                                            checked={enableOfflineMode}
                                                            onCheckedChange={setEnableOfflineMode}
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                                                        <div className="flex items-center gap-3">
                                                            <AlertTriangle className="w-5 h-5 text-slate-600" />
                                                            <div>
                                                                <p className="font-medium text-slate-900 text-sm">Enable Alerts</p>
                                                                <p className="text-xs text-slate-600">Notify on denied access attempts</p>
                                                            </div>
                                                        </div>
                                                        <Switch
                                                            checked={enableAlerts}
                                                            onCheckedChange={setEnableAlerts}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 4: Advanced Settings (for bus readers) */}
                                    {step === 4 && locationType === 'bus' && (
                                        <motion.div
                                            key="step4"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-5"
                                        >
                                            <div className="text-center mb-6">
                                                <h3 className="text-lg font-semibold text-slate-800">Advanced Settings</h3>
                                                <p className="text-sm text-slate-500">Configure access rules and permissions</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Access Schedule</Label>
                                                    <div className="grid gap-2">
                                                        {ACCESS_SCHEDULES.map((schedule) => (
                                                            <button
                                                                key={schedule.id}
                                                                onClick={() => setAccessSchedule(schedule.id)}
                                                                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${accessSchedule === schedule.id
                                                                        ? 'border-blue-500 bg-blue-50'
                                                                        : 'border-slate-200 hover:border-slate-300'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <Clock className={`w-4 h-4 ${accessSchedule === schedule.id ? 'text-blue-600' : 'text-slate-400'
                                                                        }`} />
                                                                    <div className="text-left">
                                                                        <p className="font-medium text-sm text-slate-800">{schedule.name}</p>
                                                                        <p className="text-xs text-slate-500">{schedule.description}</p>
                                                                    </div>
                                                                </div>
                                                                {accessSchedule === schedule.id && (
                                                                    <Check className="w-4 h-4 text-blue-600" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Permission Level</Label>
                                                    <Select value={permissionLevel} onValueChange={setPermissionLevel}>
                                                        <SelectTrigger className="h-11">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {PERMISSION_LEVELS.map((level) => (
                                                                <SelectItem key={level.id} value={level.id}>
                                                                    <div className="flex flex-col">
                                                                        <span>{level.name}</span>
                                                                        <span className="text-xs text-slate-500">{level.description}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Max Capacity (Optional)</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g., 50 for bus seating"
                                                        value={maxCapacity}
                                                        onChange={(e) => setMaxCapacity(e.target.value)}
                                                        className="h-11"
                                                    />
                                                    <p className="text-xs text-slate-500">Set capacity limit for alerts (leave empty for no limit)</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Error Display */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mt-4"
                                    >
                                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700 flex-1">{error}</p>
                                        <button
                                            onClick={() => setError(null)}
                                            className="p-0.5 rounded hover:bg-red-100 transition-colors"
                                        >
                                            <X className="w-3 h-3 text-red-600" />
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50">
                                <Button
                                    variant="ghost"
                                    onClick={step === 1 ? handleClose : () => setStep(s => s - 1)}
                                    className="gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    {step === 1 ? 'Cancel' : 'Back'}
                                </Button>

                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        Step {step} of {totalSteps}
                                    </Badge>
                                </div>

                                {step < totalSteps ? (
                                    <Button
                                        onClick={() => setStep(s => s + 1)}
                                        disabled={!canProceed()}
                                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !canProceed()}
                                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </motion.div>
                                                Activating...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Activate Reader
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
