'use client'

import { useState, memo } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFCMNotifications } from '@/hooks/useFCMNotifications'
import { cn } from '@/lib/utils'

interface NotificationPromptProps {
    userId: string
    onDismiss?: () => void
    className?: string
}

export const NotificationPrompt = memo(function NotificationPrompt({ userId, onDismiss, className }: NotificationPromptProps) {
    const [dismissed, setDismissed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('notification-prompt-dismissed') === 'true'
        }
        return false
    })

    const {
        notificationPermission,
        fcmToken,
        isSupported,
        isLoading,
        requestNotificationPermission,
    } = useFCMNotifications(userId)

    const handleDismiss = () => {
        setDismissed(true)
        localStorage.setItem('notification-prompt-dismissed', 'true'
        )
        onDismiss?.()
    }

    const handleEnable = async () => {
        const token = await requestNotificationPermission()
        if (token) {
            // Auto-dismiss on success
            handleDismiss()
        }
    }

    // Debug logging removed to prevent excessive console output

    // Don't show if:
    // - Not supported
    // - Already granted permission
    // - User dismissed
    // - Already has token
    if (!isSupported || notificationPermission === 'granted' || dismissed || fcmToken) {
        return null
    }

    // Don't show if permission was denied
    if (notificationPermission === 'denied') {
        return null
    }

    return (
        <div className={cn(
            "relative bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4",
            className
        )}>
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
                <X className="h-4 w-4 text-gray-500" />
            </button>

            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 bg-blue-500/20 rounded-lg">
                    <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Stay Updated with Notifications
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        Get instant notifications for new assignments, grades, announcements, and more. Never miss important updates!
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleEnable}
                            disabled={isLoading}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Enabling...
                                </>
                            ) : (
                                <>
                                    <Bell className="h-4 w-4 mr-2" />
                                    Enable Notifications
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={handleDismiss}
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 dark:text-gray-400"
                        >
                            Maybe Later
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
})

// Compact version for header/sidebar
export const NotificationButton = memo(function NotificationButton({ userId }: { userId: string }) {
    const {
        notificationPermission,
        fcmToken,
        isSupported,
        isLoading,
        requestNotificationPermission,
    } = useFCMNotifications(userId)

    if (!isSupported) return null

    const isEnabled = !!(notificationPermission === 'granted' && fcmToken)

    return (
        <Button
            onClick={requestNotificationPermission}
            disabled={!!(isLoading || isEnabled)}
            size="sm"
            variant={isEnabled ? "ghost" : "outline"}
            className={cn(
                "gap-2",
                isEnabled && "text-green-600 dark:text-green-400"
            )}
            title={isEnabled ? "Notifications enabled" : "Enable notifications"}
        >
            {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isEnabled ? (
                <Bell className="h-4 w-4 fill-current" />
            ) : (
                <BellOff className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
                {isEnabled ? 'Notifications On' : 'Enable Notifications'}
            </span>
        </Button>
    )
})
