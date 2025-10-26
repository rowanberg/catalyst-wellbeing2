/**
 * PWA Hook for install prompts and offline status
 */

import { useState, useEffect } from 'react';
import { initializeDB } from '@/lib/db/indexeddb';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  useEffect(() => {
    // Skip SSR
    if (typeof window === 'undefined') return;
    // Initialize IndexedDB
    initializeDB();
    
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebApp = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebApp);
    };
    
    checkInstalled();
    
    // Register service worker
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          setRegistration(reg);
          console.log('[PWA] Service Worker registered');
          
          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && typeof navigator !== 'undefined' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
        
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'api-updated') {
          // Notify user that fresh data is available
          console.log('[PWA] Fresh data available:', event.data.data);
        } else if (event.data.type === 'sync-success') {
          console.log('[PWA] Offline action synced:', event.data.data);
        }
      });
    }
    
    // Listen for install prompt
    const handleInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('[PWA] Install prompt captured');
    };
    
    window.addEventListener('beforeinstallprompt', handleInstallPrompt as any);
    
    // Network status listeners
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[PWA] Back online');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('[PWA] Gone offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // App installed listener
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      console.log('[PWA] App installed');
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt as any);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  /**
   * Trigger PWA install
   */
  const install = async () => {
    if (!installPrompt) return;
    
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install');
      } else {
        console.log('[PWA] User dismissed install');
      }
      
      setInstallPrompt(null);
    } catch (error) {
      console.error('[PWA] Install failed:', error);
    }
  };
  
  /**
   * Update service worker
   */
  const update = async () => {
    if (registration && updateAvailable) {
      // Skip waiting and activate new service worker
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };
  
  return {
    isOnline,
    isInstalled,
    canInstall: !!installPrompt && !isInstalled,
    updateAvailable,
    install,
    update
  };
}
