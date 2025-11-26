import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerificationBadgeProps {
    className?: string
    showText?: boolean
    size?: 'sm' | 'md' | 'lg'
    variant?: 'default' | 'white'
}

export function VerificationBadge({
    className,
    showText = true,
    size = 'md',
    variant = 'default'
}: VerificationBadgeProps) {
    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    }

    const variants = {
        default: "bg-blue-500/10 border-blue-500/20 text-blue-600",
        white: "bg-white/20 border-white/30 text-white"
    }

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border backdrop-blur-sm",
            variants[variant],
            className
        )}>
            <ShieldCheck className={cn(
                sizeClasses[size],
                variant === 'default' ? "text-blue-500" : "text-white"
            )} />
            {showText && (
                <span className={cn(
                    "font-medium",
                    size === 'sm' ? 'text-[10px]' : 'text-xs'
                )}>
                    Verified
                </span>
            )}
        </div>
    )
}
