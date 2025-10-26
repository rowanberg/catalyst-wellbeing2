/**
 * Card Component - Refined Design System
 * 
 * Features:
 * - Consistent elevation and spacing
 * - Minimal blur, maximum clarity
 * - Smooth hover interactions
 * - Responsive padding
 */

import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionVariants, interactions } from '@/lib/design-system/motion'
import { forwardRef, ReactNode } from 'react'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  variant?: 'default' | 'bordered' | 'elevated' | 'flat'
  hover?: boolean
  interactive?: boolean
  className?: string
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    children, 
    variant = 'default', 
    hover = false,
    interactive = false,
    className,
    ...props 
  }, ref) => {
    const baseStyles = 'rounded-xl transition-all duration-250'
    
    const variants = {
      default: 'bg-white border border-slate-200 shadow-sm',
      bordered: 'bg-white border-2 border-slate-200',
      elevated: 'bg-white shadow-md',
      flat: 'bg-slate-50',
    }
    
    const hoverStyles = hover ? 'hover:shadow-lg hover:-translate-y-0.5' : ''
    const interactiveStyles = interactive ? 'cursor-pointer' : ''
    
    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          hoverStyles,
          interactiveStyles,
          className
        )}
        {...(interactive && interactions.card)}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

// Card sub-components
export function CardHeader({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-100', className)}>
      {children}
    </div>
  )
}

export function CardContent({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-100 bg-slate-50/50', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <h3 className={cn('text-lg font-semibold text-slate-900', className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <p className={cn('text-sm text-slate-500 mt-1', className)}>
      {children}
    </p>
  )
}

// Stat Card - For dashboard metrics
interface StatCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral',
  icon,
  className 
}: StatCardProps) {
  const trendColors = {
    up: 'text-emerald-600 bg-emerald-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-slate-600 bg-slate-50',
  }
  
  return (
    <Card variant="elevated" hover className={className}>
      <CardContent className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {change && (
            <span className={cn(
              'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md mt-2',
              trendColors[trend]
            )}>
              {change}
            </span>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
