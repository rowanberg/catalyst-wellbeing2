'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

interface NotificationToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
  isVisible?: boolean
}

export function NotificationToast({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  isVisible = true
}: NotificationToastProps) {
  const [show, setShow] = useState(isVisible)

  useEffect(() => {
    setShow(isVisible)
  }, [isVisible])

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [show, duration, onClose])

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed top-4 right-4 z-50 max-w-sm w-full ${config.bgColor} border rounded-lg shadow-lg p-4`}
        >
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
            >
              <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
            </motion.div>
            <div className="flex-1">
              <motion.p
                className={`text-sm font-medium ${config.textColor}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {message}
              </motion.p>
            </div>
            <motion.button
              onClick={() => {
                setShow(false)
                onClose?.()
              }}
              className={`${config.textColor} hover:opacity-70 transition-opacity`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>
          
          {/* Progress bar */}
          {duration > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-b-lg"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
