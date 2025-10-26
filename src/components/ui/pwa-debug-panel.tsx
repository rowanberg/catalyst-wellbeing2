'use client'

import { usePWA } from '@/hooks/usePWA'

export function PWADebugPanel() {
  const pwaState = usePWA()
  
  return (
    <div className="fixed top-20 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono max-w-xs z-[9999] shadow-2xl">
      <h3 className="font-bold mb-2 text-yellow-400">PWA Debug Info</h3>
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">canInstall:</span>{' '}
          <span className={pwaState.canInstall ? 'text-green-400' : 'text-red-400'}>
            {String(pwaState.canInstall)}
          </span>
        </div>
        <div>
          <span className="text-gray-400">isInstalled:</span>{' '}
          <span className={pwaState.isInstalled ? 'text-green-400' : 'text-red-400'}>
            {String(pwaState.isInstalled)}
          </span>
        </div>
        <div>
          <span className="text-gray-400">isOnline:</span>{' '}
          <span className={pwaState.isOnline ? 'text-green-400' : 'text-red-400'}>
            {String(pwaState.isOnline)}
          </span>
        </div>
        <div>
          <span className="text-gray-400">updateAvailable:</span>{' '}
          <span className={pwaState.updateAvailable ? 'text-green-400' : 'text-red-400'}>
            {String(pwaState.updateAvailable)}
          </span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-700 text-[10px] text-gray-400">
        Check browser console for detailed logs
      </div>
    </div>
  )
}
