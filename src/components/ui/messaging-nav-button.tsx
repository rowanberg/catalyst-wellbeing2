'use client'

import { useState } from 'react'
import { MessageCircle, Bell, Users, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRealtime } from '@/components/communications/RealtimeProvider'

interface MessagingNavButtonProps {
  userRole: 'admin' | 'teacher' | 'parent' | 'student'
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  compact?: boolean
}

export function MessagingNavButton({ 
  userRole, 
  className, 
  variant = 'default',
  size = 'md',
  compact = false
}: MessagingNavButtonProps) {
  const { unreadCount } = useRealtime()

  const getMessagingPath = () => {
    switch (userRole) {
      case 'admin': return '/admin/messaging'
      case 'teacher': return '/teacher/messaging'
      case 'parent': return '/parent/messaging'
      case 'student': return '/student/messaging'
      default: return '/messaging'
    }
  }

  const getButtonConfig = () => {
    switch (userRole) {
      case 'admin':
        return {
          icon: Shield,
          label: 'Security Center',
          description: 'Monitor & moderate communications',
          color: 'bg-red-500 hover:bg-red-600'
        }
      case 'teacher':
        return {
          icon: Users,
          label: 'Class Connect',
          description: 'Communicate with students & parents',
          color: 'bg-blue-500 hover:bg-blue-600'
        }
      case 'parent':
        return {
          icon: MessageCircle,
          label: 'Family Hub',
          description: 'Connect with teachers & view child messages',
          color: 'bg-green-500 hover:bg-green-600'
        }
      case 'student':
        return {
          icon: MessageCircle,
          label: 'Teacher Connect',
          description: 'Safe communication with teachers',
          color: 'bg-purple-500 hover:bg-purple-600'
        }
    }
  }

  const config = getButtonConfig()
  const Icon = config.icon

  if (compact) {
    return (
      <Link href={getMessagingPath()}>
        <Button
          variant={variant}
          size="sm"
          className={cn(
            'relative w-full justify-start space-x-2 py-2.5 text-sm',
            variant === 'default' && config.color,
            className
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{config.label}</span>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="ml-auto h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </Link>
    )
  }

  if (size === 'sm') {
    return (
      <Link href={getMessagingPath()}>
        <Button
          variant={variant}
          size="sm"
          className={cn(
            'relative',
            variant === 'default' && config.color,
            className
          )}
        >
          <Icon className="h-4 w-4 mr-2" />
          Messages
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </Link>
    )
  }

  return (
    <Link href={getMessagingPath()}>
      <Button
        variant={variant}
        className={cn(
          'relative h-auto p-4 flex flex-col items-start text-left space-y-2',
          variant === 'default' && config.color,
          size === 'lg' && 'p-6',
          className
        )}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <Icon className={cn(
              'h-6 w-6',
              size === 'lg' && 'h-8 w-8'
            )} />
            <div>
              <h3 className={cn(
                'font-semibold',
                size === 'lg' && 'text-lg'
              )}>
                {config.label}
              </h3>
              <p className={cn(
                'text-sm opacity-90',
                size === 'lg' && 'text-base'
              )}>
                {config.description}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white border-white/30"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </Button>
    </Link>
  )
}
