/**
 * Button Component - Premium Design System
 * 
 * Features:
 * - Clear visual hierarchy
 * - Consistent interaction patterns
 * - Accessible and semantic
 * - Smooth motion feedback
 */

import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { interactions } from '@/lib/design-system/motion'
import { forwardRef, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  className?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    loading = false,
    disabled = false,
    className,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm',
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }
    
    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }
    
    const disabledStyles = (disabled || loading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
    const widthStyles = fullWidth ? 'w-full' : ''
    
    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          disabledStyles,
          widthStyles,
          className
        )}
        disabled={disabled || loading}
        {...(!disabled && !loading && interactions.button)}
        {...props}
      >
        {loading ? (
          <>
            <motion.div
              className={cn('border-2 border-current border-t-transparent rounded-full', iconSizes[size])}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className={iconSizes[size]} strokeWidth={2} />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className={iconSizes[size]} strokeWidth={2} />}
          </>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

// Icon Button - For icon-only actions
interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: LucideIcon
  label: string // For accessibility
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'subtle' | 'primary'
  className?: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 
    icon: Icon,
    label,
    size = 'md',
    variant = 'ghost',
    className,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    const variants = {
      ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
      subtle: 'text-slate-600 bg-slate-50 hover:bg-slate-100 focus:ring-slate-400',
      primary: 'text-blue-600 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500',
    }
    
    const sizes = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
    }
    
    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }
    
    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        aria-label={label}
        title={label}
        {...interactions.iconButton}
        {...props}
      >
        <Icon className={iconSizes[size]} strokeWidth={2} />
      </motion.button>
    )
  }
)

IconButton.displayName = 'IconButton'

// Button Group - For related actions
interface ButtonGroupProps {
  children: ReactNode
  className?: string
}

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return (
    <div className={cn('inline-flex rounded-lg shadow-sm', className)} role="group">
      {children}
    </div>
  )
}
