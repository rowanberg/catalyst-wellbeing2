'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Notification {
  id: string
  school_id: string
  type: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  created_at: string
  schools: {
    name: string
    city: string
    plan_type: string
  }
}

interface AlertBannerProps {
  notification: Notification
  darkMode: boolean
  onDismiss: () => void
}

export function AlertBanner({ notification, darkMode, onDismiss }: AlertBannerProps) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertTriangle,
          bgClass: 'from-red-500/10 to-red-600/10',
          borderClass: 'border-red-500/30',
          iconClass: 'text-red-400',
          textClass: darkMode ? 'text-red-300' : 'text-red-700'
        }
      case 'error':
        return {
          icon: AlertCircle,
          bgClass: 'from-red-500/10 to-orange-500/10',
          borderClass: 'border-red-500/30',
          iconClass: 'text-red-400',
          textClass: darkMode ? 'text-red-300' : 'text-red-700'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          bgClass: 'from-orange-500/10 to-yellow-500/10',
          borderClass: 'border-orange-500/30',
          iconClass: 'text-orange-400',
          textClass: darkMode ? 'text-orange-300' : 'text-orange-700'
        }
      case 'info':
      default:
        return {
          icon: Info,
          bgClass: 'from-blue-500/10 to-purple-500/10',
          borderClass: 'border-blue-500/30',
          iconClass: 'text-blue-400',
          textClass: darkMode ? 'text-blue-300' : 'text-blue-700'
        }
    }
  }

  const config = getSeverityConfig(notification.severity)
  const Icon = config.icon

  const handleMarkAsRead = async () => {
    try {
      await fetch('/api/superpanel/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notification_id: notification.id
        })
      })
      onDismiss()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleResolve = async () => {
    try {
      await fetch('/api/superpanel/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          notification_id: notification.id
        })
      })
      onDismiss()
    } catch (error) {
      console.error('Failed to resolve notification:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl mb-4 ${
        config.borderClass
      } bg-gradient-to-r ${config.bgClass}`}
    >
      {/* Animated border glow */}
      <div className={`absolute inset-0 bg-gradient-to-r ${config.bgClass} opacity-50 animate-pulse`} />
      
      <div className="relative p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${
            darkMode ? 'bg-slate-800/50' : 'bg-white/50'
          }`}>
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${config.iconClass}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-xs sm:text-sm mb-1 truncate ${config.textClass}`}>
                  {notification.title}
                </h4>
                <p className={`text-xs sm:text-sm mb-2 line-clamp-2 ${
                  darkMode ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  {notification.message}
                </p>
                <div className={`flex flex-wrap items-center gap-1 sm:gap-2 text-xs ${
                  darkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  <span className="font-medium">{notification.schools.name}</span>
                  <span>•</span>
                  <span>{notification.schools.city}</span>
                  <span>•</span>
                  <span className="capitalize">{notification.schools.plan_type} Plan</span>
                  <span>•</span>
                  <span>{new Date(notification.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <Button
                  onClick={handleMarkAsRead}
                  variant="ghost"
                  size="sm"
                  className={`text-xs p-1.5 sm:p-2 ${config.textClass} hover:bg-white/10`}
                >
                  <CheckCircle className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Mark Read</span>
                </Button>
                
                {(notification.type === 'user_limit_warning' || 
                  notification.type === 'payment_due') && (
                  <Button
                    onClick={handleResolve}
                    variant="ghost"
                    size="sm"
                    className={`text-xs p-1.5 sm:p-2 ${config.textClass} hover:bg-white/10`}
                  >
                    <span className="hidden sm:inline">Resolve</span>
                    <span className="sm:hidden">✓</span>
                  </Button>
                )}

                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  size="sm"
                  className={`p-1.5 sm:p-2 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} hover:bg-white/10`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar for critical alerts */}
      {notification.severity === 'critical' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            className="h-full bg-white/30"
          />
        </div>
      )}
    </motion.div>
  )
}
