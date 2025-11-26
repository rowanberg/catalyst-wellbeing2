// Firebase Cloud Messaging Service Worker
// This file handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js')

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDEempJTrFk_c0bB7QTtIJ9iTa9BO_8oVA",
    authDomain: "catalystwells-globalservices.firebaseapp.com",
    projectId: "catalystwells-globalservices",
    storageBucket: "catalystwells-globalservices.firebasestorage.app",
    messagingSenderId: "105110242066",
    appId: "1:105110242066:web:a80988b2d80e7bc6b169cb"
}

// Initialize Firebase
if (firebase) {
    try {
        firebase.initializeApp(firebaseConfig)

        const messaging = firebase.messaging()

        // Handle background messages
        messaging.onBackgroundMessage((payload) => {
            console.log('[firebase-messaging-sw.js] Received background message:', payload)

            const notificationTitle = payload.notification?.title || 'Catalyst Notification'
            const notificationOptions = {
                body: payload.notification?.body || 'You have a new notification',
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: payload.data?.tag || 'default',
                data: payload.data,
                requireInteraction: false,
                vibrate: [200, 100, 200],
            }

            return self.registration.showNotification(notificationTitle, notificationOptions)
        })
        console.log('[firebase-messaging-sw.js] Firebase initialized successfully')
    } catch (error) {
        console.error('[firebase-messaging-sw.js] Error initializing Firebase:', error)
    }
}

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Installing service worker...')
    self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Activating service worker...')
    event.waitUntil(self.clients.claim())
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received.')

    event.notification.close()

    // Navigate to the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i]
                if (client.url === '/' && 'focus' in client) {
                    return client.focus()
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data?.url || '/')
            }
        })
    )
})
