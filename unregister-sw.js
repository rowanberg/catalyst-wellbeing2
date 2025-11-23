// Temporary script to unregister old service workers
// Run this once in browser console to clear old SW

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        console.log('Found', registrations.length, 'service worker(s)');

        for (let registration of registrations) {
            console.log('Unregistering:', registration.scope);
            registration.unregister();
        }

        console.log('All service workers unregistered. Please refresh the page.');
    });

    // Also clear all caches
    caches.keys().then(function (names) {
        console.log('Found', names.length, 'cache(s)');

        for (let name of names) {
            console.log('Deleting cache:', name);
            caches.delete(name);
        }

        console.log('All caches cleared. Please refresh the page.');
    });
}
