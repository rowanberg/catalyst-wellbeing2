'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Award, Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Achievement {
    id: string
    title: string
    description: string
    icon: string
    unlocked: boolean
    progress?: number
    requirement?: number
}

interface AchievementBadgeProps {
    achievement: Achievement
    size?: 'sm' | 'md' | 'lg'
    showDetails?: boolean
    onClick?: () => void
}

export function AchievementBadge({
    achievement,
    size = 'md',
    showDetails = false,
    onClick
}: AchievementBadgeProps) {
    const sizeClasses = {
        sm: 'w-12 h-12 text-xl',
        md: 'w-16 h-16 text-2xl',
        lg: 'w-20 h-20 text-3xl',
    }

    const progress = achievement.progress && achievement.requirement
        ? (achievement.progress / achievement.requirement) * 100
        : 0

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                'relative cursor-pointer',
                showDetails ? 'w-full' : 'inline-block'
            )}
        >
            {showDetails ? (
                // Card view with details
                <div className={cn(
                    'relative p-4 rounded-xl border transition-all',
                    achievement.unlocked
                        ? 'bg-white border-amber-200 shadow-sm'
                        : 'bg-gray-50 border-gray-200'
                )}>
                    <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className={cn(
                            'relative w-12 h-12 rounded-lg flex items-center justify-center text-xl shadow-sm',
                            achievement.unlocked
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                                : 'bg-gray-200 text-gray-400'
                        )}>
                            {achievement.unlocked ? (
                                <span>{achievement.icon}</span>
                            ) : (
                                <Lock className="w-5 h-5" />
                            )}

                            {achievement.unlocked && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h4 className={cn(
                                'font-semibold text-sm mb-0.5',
                                achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                            )}>
                                {achievement.title}
                            </h4>
                            <p className="text-xs text-gray-500 mb-2 leading-tight">
                                {achievement.description}
                            </p>

                            {!achievement.unlocked && achievement.progress !== undefined && achievement.requirement && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                                        <span>Progress</span>
                                        <span>{achievement.progress}/{achievement.requirement}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.5 }}
                                            className="h-full bg-indigo-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // Icon-only view
                <div className="relative group">
                    <div className={cn(
                        'relative rounded-xl flex items-center justify-center transition-all duration-200',
                        sizeClasses[size],
                        achievement.unlocked
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm group-hover:shadow-md text-white'
                            : 'bg-gray-100 border border-gray-200 text-gray-400'
                    )}>
                        {achievement.unlocked ? (
                            <span>{achievement.icon}</span>
                        ) : (
                            <Lock className={cn(
                                size === 'sm' && 'w-4 h-4',
                                size === 'md' && 'w-5 h-5',
                                size === 'lg' && 'w-6 h-6'
                            )} />
                        )}

                        {achievement.unlocked && (
                            <div className={cn(
                                'absolute -top-1 -right-1 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm',
                                size === 'sm' && 'w-3 h-3',
                                size === 'md' && 'w-4 h-4',
                                size === 'lg' && 'w-5 h-5'
                            )}>
                                <Check className={cn(
                                    size === 'sm' && 'w-1.5 h-1.5',
                                    size === 'md' && 'w-2 h-2',
                                    size === 'lg' && 'w-3 h-3',
                                    'text-white'
                                )} />
                            </div>
                        )}
                    </div>

                    {/* Progress ring for locked badges */}
                    {!achievement.unlocked && achievement.progress !== undefined && achievement.requirement && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                            <circle
                                cx="50%"
                                cy="50%"
                                r="46%"
                                fill="none"
                                stroke="#f3f4f6"
                                strokeWidth="3"
                            />
                            <motion.circle
                                cx="50%"
                                cy="50%"
                                r="46%"
                                fill="none"
                                stroke="#6366f1"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 46} ${2 * Math.PI * 46}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - progress / 100) }}
                                transition={{ duration: 0.5 }}
                            />
                        </svg>
                    )}
                </div>
            )}
        </motion.div>
    )
}
