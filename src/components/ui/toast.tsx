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
    success: 'border-green-200 bg-green-50 text-green-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900'
  }

  return (
    <div className={cn(
      'relative rounded-lg border p-4 shadow-lg transition-all',
      typeStyles[type]
    )}>
      <button
        onClick={() => onClose(id)}
        className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
      {title && <div className="font-semibold">{title}</div>}
      {description && <div className="text-sm opacity-90">{description}</div>}
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
