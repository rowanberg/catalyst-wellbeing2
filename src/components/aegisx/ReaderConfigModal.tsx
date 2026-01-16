// Reader Configuration Modal
// Allows admins to configure individual readers

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Save, X, Shield, Bell, Settings, Activity, Tag } from 'lucide-react'

interface Reader {
    id: string
    name: string
    location: string
    locationType: string
    status: string
    serialNumber: string
    config?: ReaderConfig
    tags?: string[]
    notes?: string
    maxCapacity?: number
}

interface ReaderConfig {
    access_control: {
        require_pin: boolean
        allow_unknown_cards: boolean
        working_hours_only: boolean
        working_hours_start: string
        working_hours_end: string
    }
    notifications: {
        alert_on_denied: boolean
        alert_on_multiple_attempts: boolean
        alert_threshold: number
    }
    behavior: {
        auto_lock_duration: number
        beep_on_success: boolean
        beep_on_failure: boolean
        led_color_success: string
        led_color_failure: string
    }
    maintenance: {
        auto_restart: boolean
        health_check_interval: number
        log_level: string
    }
}

const DEFAULT_CONFIG: ReaderConfig = {
    access_control: {
        require_pin: false,
        allow_unknown_cards: false,
        working_hours_only: false,
        working_hours_start: '06:00',
        working_hours_end: '22:00'
    },
    notifications: {
        alert_on_denied: true,
        alert_on_multiple_attempts: true,
        alert_threshold: 3
    },
    behavior: {
        auto_lock_duration: 5,
        beep_on_success: true,
        beep_on_failure: true,
        led_color_success: 'green',
        led_color_failure: 'red'
    },
    maintenance: {
        auto_restart: false,
        health_check_interval: 300,
        log_level: 'info'
    }
}

interface ReaderConfigModalProps {
    reader: Reader | null
    open: boolean
    onClose: () => void
    onSave: (readerId: string, updates: Partial<Reader>) => void
}

export function ReaderConfigModal({ reader, open, onClose, onSave }: ReaderConfigModalProps) {
    const [config, setConfig] = useState<ReaderConfig>(DEFAULT_CONFIG)
    const [tags, setTags] = useState<string[]>([])
    const [notes, setNotes] = useState('')
    const [maxCapacity, setMaxCapacity] = useState<number | undefined>()
    const [newTag, setNewTag] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (reader) {
            setConfig(reader.config || DEFAULT_CONFIG)
            setTags(reader.tags || [])
            setNotes(reader.notes || '')
            setMaxCapacity(reader.maxCapacity)
        }
    }, [reader])

    if (!reader) return null

    const updateConfig = <K extends keyof ReaderConfig>(
        section: K,
        key: keyof ReaderConfig[K],
        value: any
    ) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }))
    }

    const addTag = () => {
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag])
            setNewTag('')
        }
    }

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave(reader.id, {
                config,
                tags,
                notes,
                maxCapacity
            })
            onClose()
        } catch (error) {
            console.error('Failed to save reader config:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-600" />
                        Configure Reader: {reader.name}
                    </DialogTitle>
                    <DialogDescription>
                        {reader.location} • {reader.serialNumber}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="access" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="access">
                            <Shield className="w-4 h-4 mr-1" />
                            Access
                        </TabsTrigger>
                        <TabsTrigger value="alerts">
                            <Bell className="w-4 h-4 mr-1" />
                            Alerts
                        </TabsTrigger>
                        <TabsTrigger value="behavior">
                            <Activity className="w-4 h-4 mr-1" />
                            Behavior
                        </TabsTrigger>
                        <TabsTrigger value="maintenance">
                            <Settings className="w-4 h-4 mr-1" />
                            Maintenance
                        </TabsTrigger>
                        <TabsTrigger value="general">
                            <Tag className="w-4 h-4 mr-1" />
                            General
                        </TabsTrigger>
                    </TabsList>

                    {/* Access Control */}
                    <TabsContent value="access" className="space-y-4 mt-4">
                        <div className="space-y-4">
                            <SettingToggle
                                label="Require PIN Entry"
                                description="Force users to enter PIN for access"
                                checked={config.access_control.require_pin}
                                onCheckedChange={(checked) => updateConfig('access_control', 'require_pin', checked)}
                            />
                            <SettingToggle
                                label="Allow Unknown Cards"
                                description="Grant access to unregistered cards"
                                checked={config.access_control.allow_unknown_cards}
                                onCheckedChange={(checked) => updateConfig('access_control', 'allow_unknown_cards', checked)}
                            />
                            <SettingToggle
                                label="Working Hours Only"
                                description="Restrict access to working hours"
                                checked={config.access_control.working_hours_only}
                                onCheckedChange={(checked) => updateConfig('access_control', 'working_hours_only', checked)}
                            />
                            {config.access_control.working_hours_only && (
                                <div className="grid grid-cols-2 gap-4 pl-6">
                                    <div>
                                        <Label className="text-xs">Start Time</Label>
                                        <Input
                                            type="time"
                                            value={config.access_control.working_hours_start}
                                            onChange={(e) => updateConfig('access_control', 'working_hours_start', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">End Time</Label>
                                        <Input
                                            type="time"
                                            value={config.access_control.working_hours_end}
                                            onChange={(e) => updateConfig('access_control', 'working_hours_end', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Notifications */}
                    <TabsContent value="alerts" className="space-y-4 mt-4">
                        <SettingToggle
                            label="Alert on Denied Access"
                            description="Send alert when access is denied"
                            checked={config.notifications.alert_on_denied}
                            onCheckedChange={(checked) => updateConfig('notifications', 'alert_on_denied', checked)}
                        />
                        <SettingToggle
                            label="Alert on Multiple Attempts"
                            description="Send alert after failed attempts threshold"
                            checked={config.notifications.alert_on_multiple_attempts}
                            onCheckedChange={(checked) => updateConfig('notifications', 'alert_on_multiple_attempts', checked)}
                        />
                        <div>
                            <Label className="text-xs">Failed Attempts Threshold</Label>
                            <Input
                                type="number"
                                value={config.notifications.alert_threshold}
                                onChange={(e) => updateConfig('notifications', 'alert_threshold', Number(e.target.value))}
                                min={1}
                                max={10}
                                className="mt-1"
                            />
                        </div>
                    </TabsContent>

                    {/* Behavior */}
                    <TabsContent value="behavior" className="space-y-4 mt-4">
                        <div>
                            <Label className="text-xs">Auto-Lock Duration (seconds)</Label>
                            <Input
                                type="number"
                                value={config.behavior.auto_lock_duration}
                                onChange={(e) => updateConfig('behavior', 'auto_lock_duration', Number(e.target.value))}
                                min={1}
                                max={60}
                                className="mt-1"
                            />
                        </div>
                        <SettingToggle
                            label="Beep on Success"
                            description="Sound beep for successful access"
                            checked={config.behavior.beep_on_success}
                            onCheckedChange={(checked) => updateConfig('behavior', 'beep_on_success', checked)}
                        />
                        <SettingToggle
                            label="Beep on Failure"
                            description="Sound beep for denied access"
                            checked={config.behavior.beep_on_failure}
                            onCheckedChange={(checked) => updateConfig('behavior', 'beep_on_failure', checked)}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs">Success LED Color</Label>
                                <Select
                                    value={config.behavior.led_color_success}
                                    onValueChange={(value) => updateConfig('behavior', 'led_color_success', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="green">Green</SelectItem>
                                        <SelectItem value="blue">Blue</SelectItem>
                                        <SelectItem value="white">White</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs">Failure LED Color</Label>
                                <Select
                                    value={config.behavior.led_color_failure}
                                    onValueChange={(value) => updateConfig('behavior', 'led_color_failure', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="red">Red</SelectItem>
                                        <SelectItem value="orange">Orange</SelectItem>
                                        <SelectItem value="yellow">Yellow</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Maintenance */}
                    <TabsContent value="maintenance" className="space-y-4 mt-4">
                        <SettingToggle
                            label="Auto-Restart on Failure"
                            description="Automatically restart reader if it crashes"
                            checked={config.maintenance.auto_restart}
                            onCheckedChange={(checked) => updateConfig('maintenance', 'auto_restart', checked)}
                        />
                        <div>
                            <Label className="text-xs">Health Check Interval (seconds)</Label>
                            <Input
                                type="number"
                                value={config.maintenance.health_check_interval}
                                onChange={(e) => updateConfig('maintenance', 'health_check_interval', Number(e.target.value))}
                                min={60}
                                max={3600}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Log Level</Label>
                            <Select
                                value={config.maintenance.log_level}
                                onValueChange={(value) => updateConfig('maintenance', 'log_level', value)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="error">Error Only</SelectItem>
                                    <SelectItem value="warn">Warning +</SelectItem>
                                    <SelectItem value="info">Info +</SelectItem>
                                    <SelectItem value="debug">Debug (All)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TabsContent>

                    {/* General */}
                    <TabsContent value="general" className="space-y-4 mt-4">
                        <div>
                            <Label className="text-xs">Tags</Label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Add tag (e.g., high-security, public)"
                                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                />
                                <Button onClick={addTag} size="sm">Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="gap-1">
                                        {tag}
                                        <X
                                            className="w-3 h-3 cursor-pointer hover:text-red-600"
                                            onClick={() => removeTag(tag)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs">Maximum Capacity</Label>
                            <Input
                                type="number"
                                value={maxCapacity || ''}
                                onChange={(e) => setMaxCapacity(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Optional (e.g., 50 for library)"
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                        </div>
                        <div>
                            <Label className="text-xs">Admin Notes</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Notes about this reader (location details, maintenance schedule, etc.)"
                                rows={4}
                                className="mt-1"
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function SettingToggle({
    label,
    description,
    checked,
    onCheckedChange
}: {
    label: string
    description: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
}) {
    return (
        <div className="flex items-start justify-between py-2">
            <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    )
}
