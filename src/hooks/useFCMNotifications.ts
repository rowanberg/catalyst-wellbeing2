'use client'

import { useEffect, useState, useCallback } from 'react'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { toast } from 'sonner'
import { initializeApp, getApps } from 'firebase/app'

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// VAPID key for web push
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export function useFCMNotifications(userId: string | undefined) {
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
    const [fcmToken, setFcmToken] = useState<string | null>(null)
    const [isFCMSupported, setIsFCMSupported] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Check if FCM is supported
    useEffect(() => {
        const checkSupport = async () => {
            try {
                console.log('🔍 Checking FCM support (manual check)...')
                // Manual check for required features
                const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator
                const hasPushManager = typeof window !== 'undefined' && 'PushManager' in window
                const hasNotification = typeof window !== 'undefined' && 'Notification' in window
                const hasIndexedDB = typeof window !== 'undefined' && 'indexedDB' in window

                setIsFCMSupported(hasServiceWorker && hasPushManager && hasNotification && hasIndexedDB)
            } catch (error) {
                console.error('Error checking FCM support:', error)
                setIsFCMSupported(false)
            }
        }
        checkSupport()
    }, [])

    // Save FCM token via API
    const saveFCMToken = useCallback(async (token: string) => {
        if (!userId) return false

        try {
            // Get device info
            const deviceInfo = {
                browser: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                deviceName: `${navigator.platform} - ${navigator.userAgent.split(' ')[0]}`,
            }

            const response = await fetch('/api/notifications/fcm-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    token,
                    deviceInfo,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                console.error('Error saving FCM token:', error)
                throw new Error(error.error || 'Failed to save token')
            }

            console.log('✅ FCM token saved successfully')
            return true
        } catch (error) {
            console.error('Failed to save FCM token:', error)
            return false
        }
    }, [userId])

    // Request notification permission and get FCM token
    const requestNotificationPermission = useCallback(async () => {
        if (!isFCMSupported || !userId) {
            toast.error('Notifications are not supported on this device')
            return null
        }

        setIsLoading(true)

        try {
            // Request notification permission
            const permission = await Notification.requestPermission()
            setNotificationPermission(permission)

            if (permission !== 'granted') {
                toast.error('Notification permission denied')
                return null
            }

            // Initialize Firebase if not already initialized
            const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
            const messaging = getMessaging(app)

            // Get FCM token
            const currentToken = await getToken(messaging, {
                vapidKey: VAPID_KEY,
            })

            if (currentToken) {
                setFcmToken(currentToken)

                // Save token to database
                const saved = await saveFCMToken(currentToken)

                if (saved) {
                    toast.success('Notifications enabled! You\'ll receive important updates.')
                } else {
                    toast.error('Failed to save notification token')
                }

                // Listen for foreground messages
                onMessage(messaging, (payload) => {
                    console.log('📬 Foreground message received:', payload)

                    // Show notification
                    if (payload.notification) {
                        toast(payload.notification.title || 'New notification', {
                            description: payload.notification.body,
                            duration: 5000,
                        })
                    }
                })

                return currentToken
            } else {
                console.warn('No registration token available')
                toast.error('Could not get notification token')
                return null
            }
        } catch (error: any) {
            console.error('Error getting FCM token:', error)

            if (error.code === 'messaging/permission-blocked') {
                toast.error('Notifications are blocked. Please enable them in your browser settings.')
            } else {
                toast.error('Failed to enable notifications. Please try again.')
            }

            return null
        } finally {
            setIsLoading(false)
        }
    }, [isFCMSupported, userId, saveFCMToken])

    // Initialize Firebase and get permission status
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            const permission = Notification.permission
            setNotificationPermission(permission)

            // If permission is already granted but we don't have a token, try to get it
            if (permission === 'granted' && !fcmToken && isFCMSupported && userId) {
                console.log('🔔 Permission granted, auto-retrieving token...')
                requestNotificationPermission()
            }
        }
    }, [isFCMSupported, userId, fcmToken, requestNotificationPermission])

    // Delete FCM token via API
    const deleteFCMToken = useCallback(async (token: string) => {
        if (!userId) return false

        try {
            const response = await fetch(`/api/notifications/fcm-token?token=${encodeURIComponent(token)}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                const error = await response.json()
                console.error('Error deleting FCM token:', error)
                throw new Error(error.error || 'Failed to delete token')
            }

            setFcmToken(null)
            toast.success('Notifications disabled')
            return true
        } catch (error) {
            console.error('Error deleting FCM token:', error)
            toast.error('Failed to disable notifications')
            return false
        }
    }, [userId])

    return {
        notificationPermission,
        fcmToken,
        isSupported: isFCMSupported,
        isLoading,
        requestNotificationPermission,
        deleteFCMToken,
    }
}
