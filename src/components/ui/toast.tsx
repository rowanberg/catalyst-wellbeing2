'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastProps {
  id: string
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, title, description, type = 'info', duration = 5000, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const typeStyles = {
    success: 'border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-400',
    error: 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-400',
    warning: 'border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-400',
    info: 'border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-400'
  }

  const iconStyles = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-600 dark:text-blue-400'
  }

  return (
    <div className={cn(
      'relative rounded-xl border p-4 shadow-xl backdrop-blur-sm transition-all animate-in slide-in-from-bottom-2 duration-300',
      'bg-white/95 dark:bg-slate-800/95',
      typeStyles[type]
    )}>
      <button
        onClick={() => onClose(id)}
        className="absolute right-3 top-3 rounded-lg p-1 opacity-70 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="pr-6">
        {title && <div className="font-semibold text-sm mb-1">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
    </div>
  )
}

interface ToastContextValue {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
