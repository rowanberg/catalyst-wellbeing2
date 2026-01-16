// AegisX Settings Tab Component
// Complete implementation of system settings management

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, RefreshCw, Shield, Bell, Database, Settings as SettingsIcon, Clock } from 'lucide-react'

interface AegisXSettings {
    // Logging
    access_logging_enabled: boolean
    log_retention_days: number
    auto_archive_enabled: boolean

    // Security
    deny_unknown_cards: boolean
    card_expiry_warning_days: number
    max_failed_attempts: number
    lock_duration_minutes: number
    require_pin_for_sensitive_areas: boolean

    // Notifications
    realtime_alerts_enabled: boolean
    email_notifications_enabled: boolean
    admin_email: string | null
    alert_threshold_per_hour: number
    daily_summary_enabled: boolean
    summary_time: string

    // Reader Management
    auto_sync_interval_minutes: number
    offline_mode_enabled: boolean
    reader_health_check_enabled: boolean
    auto_restart_on_failure: boolean

    // Data Management
    export_enabled: boolean
    backup_enabled: boolean
    backup_frequency_days: number
    gdpr_compliance_mode: boolean

    // Analytics
    hourly_analytics_enabled: boolean
    student_tracking_enabled: boolean
    peak_hours_alerts: boolean
}

interface SettingsTabProps {
    onSettingsSaved?: () => void
}

export function SettingsTab({ onSettingsSaved }: SettingsTabProps) {
    const [settings, setSettings] = useState<AegisXSettings | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const res = await fetch('/api/admin/aegisx/settings')
            const data = await res.json()

            if (data.settings) {
                setSettings(data.settings)
            }
        } catch (error) {
            console.error('Failed to load settings:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const updateSetting = <K extends keyof AegisXSettings>(
        key: K,
        value: AegisXSettings[K]
    ) => {
        if (!settings) return
        setSettings({ ...settings, [key]: value })
        setHasChanges(true)
    }

    const handleSave = async () => {
        if (!settings) return

        setIsSaving(true)
        try {
            const res = await fetch('/api/admin/aegisx/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            if (res.ok) {
                setHasChanges(false)
                onSettingsSaved?.()
                // Show success toast
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading || !settings) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Save button - sticky at top */}
            {hasChanges && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky top-16 z-40 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="font-semibold text-blue-900 text-sm">Unsaved Changes</p>
                            <p className="text-xs text-blue-700">Click save to apply your settings</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                loadSettings()
                                setHasChanges(false)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </motion.div>
            )}

            <Tabs defaultValue="security" className="w-full">
                <TabsList className="grid w-full grid-cols-5 h-auto">
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="hidden sm:inline">Security</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="w-4 h-4" />
                        <span className="hidden sm:inline">Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger value="readers" className="gap-2">
                        <SettingsIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Readers</span>
                    </TabsTrigger>
                    <TabsTrigger value="data" className="gap-2">
                        <Database className="w-4 h-4" />
                        <span className="hidden sm:inline">Data</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="hidden sm:inline">Analytics</span>
                    </TabsTrigger>
                </TabsList>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Access Control</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SettingRow
                                label="Deny Unknown Cards"
                                description="Block access for unregistered NFC cards"
                                checked={settings.deny_unknown_cards}
                                onCheckedChange={(checked) => updateSetting('deny_unknown_cards', checked)}
                            />
                            <SettingRow
                                label="Require PIN for Sensitive Areas"
                                description="Force PIN entry at restricted readers"
                                checked={settings.require_pin_for_sensitive_areas}
                                onCheckedChange={(checked) => updateSetting('require_pin_for_sensitive_areas', checked)}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <NumberInput
                                    label="Max Failed Attempts"
                                    value={settings.max_failed_attempts}
                                    onChange={(value) => updateSetting('max_failed_attempts', value)}
                                    min={1}
                                    max={10}
                                />
                                <NumberInput
                                    label="Lock Duration (minutes)"
                                    value={settings.lock_duration_minutes}
                                    onChange={(value) => updateSetting('lock_duration_minutes', value)}
                                    min={5}
                                    max={120}
                                />
                                <NumberInput
                                    label="Card Expiry Warning (days)"
                                    value={settings.card_expiry_warning_days}
                                    onChange={(value) => updateSetting('card_expiry_warning_days', value)}
                                    min={7}
                                    max={90}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Logging</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SettingRow
                                label="Enable Access Logging"
                                description="Record all NFC scan attempts"
                                checked={settings.access_logging_enabled}
                                onCheckedChange={(checked) => updateSetting('access_logging_enabled', checked)}
                            />
                            <SettingRow
                                label="Auto-Archive Old Logs"
                                description="Automatically archive logs after retention period"
                                checked={settings.auto_archive_enabled}
                                onCheckedChange={(checked) => updateSetting('auto_archive_enabled', checked)}
                            />
                            <NumberInput
                                label="Log Retention (days)"
                                value={settings.log_retention_days}
                                onChange={(value) => updateSetting('log_retention_days', value)}
                                min={30}
                                max={730}
                                description="How long to keep access logs before archiving"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Alert Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SettingRow
                                label="Real-time Alerts"
                                description="Get instant notifications for security events"
                                checked={settings.realtime_alerts_enabled}
                                onCheckedChange={(checked) => updateSetting('realtime_alerts_enabled', checked)}
                            />
                            <SettingRow
                                label="Email Notifications"
                                description="Send alerts to admin email address"
                                checked={settings.email_notifications_enabled}
                                onCheckedChange={(checked) => updateSetting('email_notifications_enabled', checked)}
                            />
                            {settings.email_notifications_enabled && (
                                <div>
                                    <Label className="text-xs text-gray-600">Admin Email Address</Label>
                                    <Input
                                        type="email"
                                        value={settings.admin_email || ''}
                                        onChange={(e) => updateSetting('admin_email', e.target.value)}
                                        placeholder="admin@school.com"
                                        className="mt-1"
                                    />
                                </div>
                            )}
                            <NumberInput
                                label="Alert Threshold (denials per hour)"
                                value={settings.alert_threshold_per_hour}
                                onChange={(value) => updateSetting('alert_threshold_per_hour', value)}
                                min={1}
                                max={100}
                                description="Trigger alert after this many denied accesses"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Daily Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SettingRow
                                label="Enable Daily Summary"
                                description="Receive daily access report"
                                checked={settings.daily_summary_enabled}
                                onCheckedChange={(checked) => updateSetting('daily_summary_enabled', checked)}
                            />
                            {settings.daily_summary_enabled && (
                                <div>
                                    <Label className="text-xs text-gray-600">Summary Time</Label>
                                    <Input
                                        type="time"
                                        value={settings.summary_time}
                                        onChange={(e) => updateSetting('summary_time', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Reader Settings */}
                <TabsContent value="readers" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Reader Management</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SettingRow
                                label="Offline Mode Support"
                                description="Allow readers to function without internet"
                                checked={settings.offline_mode_enabled}
                                onCheckedChange={(checked) => updateSetting('offline_mode_enabled', checked)}
                            />
                            <SettingRow
                                label="Health Check Monitoring"
                                description="Automatically monitor reader status"
                                checked={settings.reader_health_check_enabled}
                                onCheckedChange={(checked) => updateSetting('reader_health_check_enabled', checked)}
                            />
                            <SettingRow
                                label="Auto-Restart on Failure"
                                description="Automatically restart unresponsive readers"
                                checked={settings.auto_restart_on_failure}
                                onCheckedChange={(checked) => updateSetting('auto_restart_on_failure', checked)}
                            />
                            <NumberInput
                                label="Auto-Sync Interval (minutes)"
                                value={settings.auto_sync_interval_minutes}
                                onChange={(value) => updateSetting('auto_sync_interval_minutes', value)}
                                min={1}
                                max={60}
                                description="How often readers sync with server"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Data Management Settings */}
                <TabsContent value="data" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Data Management</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SettingRow
                                label="Enable Data Export"
                                description="Allow exporting access logs and reports"
                                checked={settings.export_enabled}
                                onCheckedChange={(checked) => updateSetting('export_enabled', checked)}
                            />
                            <SettingRow
                                label="Automatic Backups"
                                description="Regularly backup system data"
                                checked={settings.backup_enabled}
                                onCheckedChange={(checked) => updateSetting('backup_enabled', checked)}
                            />
                            {settings.backup_enabled && (
                                <NumberInput
                                    label="Backup Frequency (days)"
                                    value={settings.backup_frequency_days}
                                    onChange={(value) => updateSetting('backup_frequency_days', value)}
                                    min={1}
                                    max={30}
                                />
                            )}
                            <SettingRow
                                label="GDPR Compliance Mode"
                                description="Enable strict data privacy controls"
                                checked={settings.gdpr_compliance_mode}
                                onCheckedChange={(checked) => updateSetting('gdpr_compliance_mode', checked)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Settings */}
                <TabsContent value="analytics" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Analytics & Tracking</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SettingRow
                                label="Hourly Analytics"
                                description="Track access patterns by hour"
                                checked={settings.hourly_analytics_enabled}
                                onCheckedChange={(checked) => updateSetting('hourly_analytics_enabled', checked)}
                            />
                            <SettingRow
                                label="Student Tracking"
                                description="Monitor individual student access patterns"
                                checked={settings.student_tracking_enabled}
                                onCheckedChange={(checked) => updateSetting('student_tracking_enabled', checked)}
                            />
                            <SettingRow
                                label="Peak Hours Alerts"
                                description="Get notified during unusual traffic spikes"
                                checked={settings.peak_hours_alerts}
                                onCheckedChange={(checked) => updateSetting('peak_hours_alerts', checked)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

// Helper Components
function SettingRow({
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
        <div className="flex items-center justify-between py-2">
            <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
    )
}

function NumberInput({
    label,
    value,
    onChange,
    min,
    max,
    description
}: {
    label: string
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    description?: string
}) {
    return (
        <div>
            <Label className="text-xs text-gray-600">{label}</Label>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
            <Input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                className="mt-1"
            />
        </div>
    )
}
