'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
    Shield,
    Clock,
    MapPin,
    Users,
    AlertTriangle,
    Lock,
    Unlock,
    VolumeX,
    Bell,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    AlertCircle,
    Zap,
    Calendar,
    Building,
    GraduationCap,
    Settings,
    Power,
    RefreshCw
} from 'lucide-react'

interface AccessRule {
    id: string
    name: string
    description: string
    ruleType: 'time_based' | 'class_based' | 'role_based' | 'location_based' | 'grade_based' | 'emergency' | 'exam_mode' | 'lockdown' | 'silent_mode'
    conditions: {
        timeWindow?: { start: string; end: string }
        allowedDays?: number[]
        blockedLocationTypes?: string[]
        allowedGrades?: string[]
        allowedClasses?: string[]
        maxEntriesPerDay?: number
        requirePin?: boolean
    }
    action: 'allow' | 'deny' | 'alert' | 'silent_log' | 'require_pin' | 'notify_admin'
    priority: number
    isActive: boolean
    isEmergencyRule: boolean
    createdAt: string
}

interface EmergencyMode {
    id: string
    modeType: 'lockdown' | 'emergency_unlock' | 'silent_mode' | 'exam_mode' | 'evacuation' | 'normal'
    isActive: boolean
    activatedBy?: string
    activatedAt?: string
    activationReason?: string
    autoDeactivateAt?: string
}

interface AccessControlTabProps {
    schoolId?: string
}

const ruleTypeConfig: Record<string, { icon: any; color: string; label: string; description: string }> = {
    time_based: { icon: Clock, color: 'text-blue-600 bg-blue-100', label: 'Time-Based', description: 'Restrict access to specific hours' },
    class_based: { icon: Users, color: 'text-emerald-600 bg-emerald-100', label: 'Class-Based', description: 'Only certain classes allowed' },
    role_based: { icon: Shield, color: 'text-purple-600 bg-purple-100', label: 'Role-Based', description: 'Based on user role (student/staff)' },
    location_based: { icon: MapPin, color: 'text-amber-600 bg-amber-100', label: 'Location-Based', description: 'Restrict specific areas' },
    grade_based: { icon: GraduationCap, color: 'text-indigo-600 bg-indigo-100', label: 'Grade-Based', description: 'Only certain grade levels' },
    emergency: { icon: AlertTriangle, color: 'text-red-600 bg-red-100', label: 'Emergency', description: 'Emergency override rules' },
    exam_mode: { icon: Lock, color: 'text-orange-600 bg-orange-100', label: 'Exam Mode', description: 'Special exam restrictions' },
    lockdown: { icon: Lock, color: 'text-red-600 bg-red-100', label: 'Lockdown', description: 'Block all access' },
    silent_mode: { icon: VolumeX, color: 'text-slate-600 bg-slate-100', label: 'Silent Mode', description: 'No buzzer/sounds' }
}

const emergencyModeConfig: Record<string, { icon: any; color: string; bgColor: string; label: string; description: string }> = {
    normal: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200', label: 'Normal Operation', description: 'All systems operating normally' },
    lockdown: { icon: Lock, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', label: 'Lockdown', description: 'All access blocked immediately' },
    emergency_unlock: { icon: Unlock, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', label: 'Emergency Unlock', description: 'All doors unlocked for evacuation' },
    silent_mode: { icon: VolumeX, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200', label: 'Silent Mode', description: 'No buzzers during exams' },
    exam_mode: { icon: GraduationCap, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', label: 'Exam Mode', description: 'Special exam restrictions active' },
    evacuation: { icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200', label: 'Evacuation', description: 'Emergency evacuation in progress' }
}

export function AccessControlTab({ schoolId }: AccessControlTabProps) {
    const [rules, setRules] = useState<AccessRule[]>([])
    const [emergencyMode, setEmergencyMode] = useState<EmergencyMode | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showAddRuleModal, setShowAddRuleModal] = useState(false)
    const [showEmergencyModal, setShowEmergencyModal] = useState(false)
    const [selectedRule, setSelectedRule] = useState<AccessRule | null>(null)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

    // Form state
    const [newRule, setNewRule] = useState({
        name: '',
        description: '',
        ruleType: 'time_based' as AccessRule['ruleType'],
        action: 'allow' as AccessRule['action'],
        priority: 10,
        isActive: true,
        conditions: {
            timeWindow: { start: '08:00', end: '16:00' },
            allowedDays: [1, 2, 3, 4, 5],
            blockedLocationTypes: [] as string[],
            allowedGrades: [] as string[]
        }
    })

    // Emergency mode form
    const [emergencyReason, setEmergencyReason] = useState('')
    const [selectedEmergencyMode, setSelectedEmergencyMode] = useState<EmergencyMode['modeType']>('lockdown')
    const [autoDeactivateMinutes, setAutoDeactivateMinutes] = useState(60)

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 5000)
    }, [])

    // Load data
    const loadData = useCallback(async () => {
        setIsLoading(true)
        try {
            const [rulesRes, modeRes] = await Promise.all([
                fetch('/api/admin/aegisx/access-rules'),
                fetch('/api/admin/aegisx/emergency-mode')
            ])

            if (rulesRes.ok) {
                const data = await rulesRes.json()
                setRules(data.rules || [])
            }

            if (modeRes.ok) {
                const data = await modeRes.json()
                setEmergencyMode(data.mode || { modeType: 'normal', isActive: false })
            }
        } catch (error) {
            console.error('Failed to load access control data:', error)
            showToast('Failed to load access control data', 'error')
        } finally {
            setIsLoading(false)
        }
    }, [showToast])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Add new rule
    const handleAddRule = async () => {
        if (!newRule.name) {
            showToast('Please enter a rule name', 'warning')
            return
        }

        try {
            const res = await fetch('/api/admin/aegisx/access-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRule)
            })

            const data = await res.json()

            if (res.ok && data.rule) {
                setRules(prev => [...prev, data.rule])
                setShowAddRuleModal(false)
                resetNewRule()
                showToast('Access rule created successfully', 'success')
            } else {
                showToast(data.error || 'Failed to create rule', 'error')
            }
        } catch (error) {
            console.error('Failed to add rule:', error)
            showToast('Network error. Please try again.', 'error')
        }
    }

    // Toggle rule active status
    const handleToggleRule = async (ruleId: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/admin/aegisx/access-rules/${ruleId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive })
            })

            if (res.ok) {
                setRules(prev => prev.map(r =>
                    r.id === ruleId ? { ...r, isActive } : r
                ))
                showToast(`Rule ${isActive ? 'activated' : 'deactivated'}`, 'success')
            }
        } catch (error) {
            console.error('Failed to toggle rule:', error)
            showToast('Failed to update rule', 'error')
        }
    }

    // Delete rule
    const handleDeleteRule = async (ruleId: string) => {
        try {
            const res = await fetch(`/api/admin/aegisx/access-rules/${ruleId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                setRules(prev => prev.filter(r => r.id !== ruleId))
                showToast('Rule deleted successfully', 'success')
            }
        } catch (error) {
            console.error('Failed to delete rule:', error)
            showToast('Failed to delete rule', 'error')
        }
    }

    // Activate emergency mode
    const handleActivateEmergencyMode = async () => {
        if (!emergencyReason && selectedEmergencyMode !== 'normal') {
            showToast('Please provide a reason for activating emergency mode', 'warning')
            return
        }

        try {
            const res = await fetch('/api/admin/aegisx/emergency-mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    modeType: selectedEmergencyMode,
                    reason: emergencyReason,
                    autoDeactivateMinutes: selectedEmergencyMode !== 'normal' ? autoDeactivateMinutes : null
                })
            })

            const data = await res.json()

            if (res.ok) {
                setEmergencyMode(data.mode)
                setShowEmergencyModal(false)
                setEmergencyReason('')
                showToast(
                    selectedEmergencyMode === 'normal'
                        ? 'Emergency mode deactivated'
                        : `${emergencyModeConfig[selectedEmergencyMode].label} activated`,
                    'success'
                )
            } else {
                showToast(data.error || 'Failed to change emergency mode', 'error')
            }
        } catch (error) {
            console.error('Failed to activate emergency mode:', error)
            showToast('Network error. Please try again.', 'error')
        }
    }

    const resetNewRule = () => {
        setNewRule({
            name: '',
            description: '',
            ruleType: 'time_based',
            action: 'allow',
            priority: 10,
            isActive: true,
            conditions: {
                timeWindow: { start: '08:00', end: '16:00' },
                allowedDays: [1, 2, 3, 4, 5],
                blockedLocationTypes: [],
                allowedGrades: []
            }
        })
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Emergency Mode Status Skeleton */}
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl p-6 border-2 border-slate-200">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-slate-200 animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse" />
                                <div className="h-4 w-56 bg-slate-200 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="h-10 w-36 bg-slate-200 rounded-lg animate-pulse" />
                    </div>
                </div>

                {/* Quick Actions Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="relative overflow-hidden p-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border-2 border-slate-100">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
                            <div className="w-8 h-8 bg-slate-200 rounded-lg mb-3 animate-pulse" />
                            <div className="h-5 w-24 bg-slate-200 rounded animate-pulse mb-2" />
                            <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Rules Section Skeleton */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
                                <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-9 w-24 bg-slate-200 rounded-lg animate-pulse" />
                                <div className="h-9 w-24 bg-slate-200 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="relative overflow-hidden p-4 rounded-xl border-2 border-slate-100">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" style={{ animationDelay: `${i * 150}ms` }} />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-slate-200 rounded-lg animate-pulse" />
                                        <div className="space-y-2">
                                            <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
                                            <div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
                                        <div className="h-6 w-12 bg-slate-200 rounded-full animate-pulse" />
                                        <div className="h-8 w-8 bg-slate-100 rounded animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add shimmer animation style */}
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

    const currentMode = emergencyMode?.modeType || 'normal'
    const modeConfig = emergencyModeConfig[currentMode]
    const ModeIcon = modeConfig.icon

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
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
                        {toast.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Emergency Mode Status Banner */}
            <Card className={`border-2 ${modeConfig.bgColor}`}>
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${modeConfig.bgColor}`}>
                                <ModeIcon className={`w-8 h-8 ${modeConfig.color}`} />
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${modeConfig.color}`}>
                                    {modeConfig.label}
                                </h3>
                                <p className="text-sm text-slate-600">{modeConfig.description}</p>
                                {emergencyMode?.activatedAt && currentMode !== 'normal' && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Activated at {new Date(emergencyMode.activatedAt).toLocaleString()}
                                        {emergencyMode.activationReason && ` • ${emergencyMode.activationReason}`}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant={currentMode === 'normal' ? 'default' : 'destructive'}
                            className="gap-2"
                            onClick={() => setShowEmergencyModal(true)}
                        >
                            {currentMode === 'normal' ? (
                                <>
                                    <AlertTriangle className="w-4 h-4" />
                                    Activate Emergency
                                </>
                            ) : (
                                <>
                                    <Power className="w-4 h-4" />
                                    Change Mode
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Emergency Actions */}
            {currentMode === 'normal' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(['lockdown', 'emergency_unlock', 'silent_mode', 'exam_mode'] as const).map(mode => {
                        const config = emergencyModeConfig[mode]
                        const Icon = config.icon
                        return (
                            <motion.button
                                key={mode}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setSelectedEmergencyMode(mode)
                                    setShowEmergencyModal(true)
                                }}
                                className={`p-4 rounded-xl border-2 ${config.bgColor} hover:shadow-lg transition-all text-left`}
                            >
                                <Icon className={`w-6 h-6 ${config.color} mb-2`} />
                                <h4 className={`font-semibold ${config.color}`}>{config.label}</h4>
                                <p className="text-xs text-slate-500 mt-1">{config.description}</p>
                            </motion.button>
                        )
                    })}
                </div>
            )}

            {/* Access Rules Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Access Control Rules
                        </CardTitle>
                        <CardDescription>
                            Define time-based, location-based, and role-based access restrictions
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={loadData}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button size="sm" onClick={() => setShowAddRuleModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Rule
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {rules.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No access rules configured</p>
                            <p className="text-sm">Create rules to control who can access what and when</p>
                            <Button className="mt-4" onClick={() => setShowAddRuleModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create First Rule
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rules.sort((a, b) => b.priority - a.priority).map(rule => {
                                const config = ruleTypeConfig[rule.ruleType]
                                const Icon = config.icon
                                return (
                                    <motion.div
                                        key={rule.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl border-2 ${rule.isActive
                                            ? 'bg-white border-slate-200'
                                            : 'bg-slate-50 border-slate-100 opacity-60'
                                            } hover:shadow-sm transition-all`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-lg ${config.color}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-slate-900">{rule.name}</h4>
                                                        <Badge
                                                            variant={rule.action === 'allow' ? 'default' : 'destructive'}
                                                            className="text-xs"
                                                        >
                                                            {rule.action.toUpperCase()}
                                                        </Badge>
                                                        {rule.isEmergencyRule && (
                                                            <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                                                                Emergency
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-500">
                                                        {rule.description || config.description}
                                                    </p>
                                                    {rule.conditions.timeWindow && (
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            <Clock className="w-3 h-3 inline mr-1" />
                                                            {rule.conditions.timeWindow.start} - {rule.conditions.timeWindow.end}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="text-xs">
                                                    Priority: {rule.priority}
                                                </Badge>
                                                <Switch
                                                    checked={rule.isActive}
                                                    onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedRule(rule)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

            {/* Add Rule Modal */}
            <Dialog open={showAddRuleModal} onOpenChange={setShowAddRuleModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Create Access Rule
                        </DialogTitle>
                        <DialogDescription>
                            Define conditions for controlling access to readers
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Rule Name *</Label>
                            <Input
                                value={newRule.name}
                                onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Lab Hours Restriction"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={newRule.description}
                                onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe what this rule does..."
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Rule Type</Label>
                                <Select
                                    value={newRule.ruleType}
                                    onValueChange={(v) => setNewRule(prev => ({ ...prev, ruleType: v as any }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ruleTypeConfig).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex items-center gap-2">
                                                    <config.icon className="w-4 h-4" />
                                                    {config.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Action</Label>
                                <Select
                                    value={newRule.action}
                                    onValueChange={(v) => setNewRule(prev => ({ ...prev, action: v as any }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="allow">✓ Allow Access</SelectItem>
                                        <SelectItem value="deny">✕ Deny Access</SelectItem>
                                        <SelectItem value="alert">⚠ Allow + Alert</SelectItem>
                                        <SelectItem value="silent_log">🔕 Allow Silently</SelectItem>
                                        <SelectItem value="notify_admin">📢 Allow + Notify Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Time-based conditions */}
                        {newRule.ruleType === 'time_based' && (
                            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Time Window
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Time</Label>
                                        <Input
                                            type="time"
                                            value={newRule.conditions.timeWindow?.start || '08:00'}
                                            onChange={(e) => setNewRule(prev => ({
                                                ...prev,
                                                conditions: {
                                                    ...prev.conditions,
                                                    timeWindow: {
                                                        ...prev.conditions.timeWindow!,
                                                        start: e.target.value
                                                    }
                                                }
                                            }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Time</Label>
                                        <Input
                                            type="time"
                                            value={newRule.conditions.timeWindow?.end || '16:00'}
                                            onChange={(e) => setNewRule(prev => ({
                                                ...prev,
                                                conditions: {
                                                    ...prev.conditions,
                                                    timeWindow: {
                                                        ...prev.conditions.timeWindow!,
                                                        end: e.target.value
                                                    }
                                                }
                                            }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Priority (higher = first)</Label>
                                <Input
                                    type="number"
                                    value={newRule.priority}
                                    onChange={(e) => setNewRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                                    min={0}
                                    max={100}
                                />
                            </div>
                            <div className="space-y-2 flex items-end">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={newRule.isActive}
                                        onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, isActive: checked }))}
                                    />
                                    <Label>Active immediately</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddRuleModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddRule}>
                            Create Rule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Emergency Mode Modal */}
            <Dialog open={showEmergencyModal} onOpenChange={setShowEmergencyModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Emergency Mode Control
                        </DialogTitle>
                        <DialogDescription>
                            Change the school's emergency mode. This affects all readers immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Mode</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(emergencyModeConfig).map(([key, config]) => {
                                    const Icon = config.icon
                                    const isSelected = selectedEmergencyMode === key
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedEmergencyMode(key as any)}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${isSelected
                                                ? `${config.bgColor} border-current`
                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${config.color} mb-1`} />
                                            <div className={`font-medium text-sm ${isSelected ? config.color : 'text-slate-700'}`}>
                                                {config.label}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {selectedEmergencyMode !== 'normal' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Reason *</Label>
                                    <Textarea
                                        value={emergencyReason}
                                        onChange={(e) => setEmergencyReason(e.target.value)}
                                        placeholder="Provide a reason for activation..."
                                        rows={2}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Auto-deactivate after (minutes)</Label>
                                    <Input
                                        type="number"
                                        value={autoDeactivateMinutes}
                                        onChange={(e) => setAutoDeactivateMinutes(parseInt(e.target.value) || 60)}
                                        min={5}
                                        max={1440}
                                    />
                                    <p className="text-xs text-slate-500">
                                        Mode will automatically return to normal after this time
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEmergencyModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant={selectedEmergencyMode === 'normal' ? 'default' : 'destructive'}
                            onClick={handleActivateEmergencyMode}
                        >
                            {selectedEmergencyMode === 'normal' ? 'Return to Normal' : 'Activate Mode'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
