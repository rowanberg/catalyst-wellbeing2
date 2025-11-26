// Redirect to the actual service worker file
// This file exists for backwards compatibility with cached registrations
self.addEventListener('install', () => {
    console.log('[service-worker.js] Redirecting to sw.js')
    // Immediately activate and skip waiting
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    console.log('[service-worker.js] Unregistering old worker')
    event.waitUntil(
        // Unregister this worker and register the correct one
        self.registration.unregister().then(() => {
            console.log('[service-worker.js] Please clear cache and reload')
        })
    )
})
