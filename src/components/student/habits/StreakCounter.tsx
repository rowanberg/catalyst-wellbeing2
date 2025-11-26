'use client'

import { motion } from 'framer-motion'
import { Award, Flame, Shield, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakCounterProps {
    streak: number
    className?: string
}

export function StreakCounter({ streak, className }: StreakCounterProps) {
    // Determine milestone level
    const getMilestone = (days: number) => {
        if (days >= 100) return { level: 'legendary', color: 'from-amber-400 to-orange-500', icon: Award }
        if (days >= 30) return { level: 'gold', color: 'from-yellow-400 to-amber-500', icon: Star }
        if (days >= 14) return { level: 'silver', color: 'from-slate-300 to-slate-400', icon: Shield }
        if (days >= 7) return { level: 'bronze', color: 'from-orange-300 to-amber-400', icon: Flame }
        return { level: 'starter', color: 'from-gray-300 to-gray-400', icon: Flame }
    }

    const milestone = getMilestone(streak)
    const Icon = milestone.icon

    // Calculate progress to next milestone
    const nextMilestones = [7, 14, 30, 100]
    const currentMilestone = nextMilestones.find(m => streak < m) || 100
    const previousMilestone = nextMilestones[nextMilestones.indexOf(currentMilestone) - 1] || 0
    const progress = previousMilestone === 100 ? 100 : ((streak - previousMilestone) / (currentMilestone - previousMilestone)) * 100

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('relative', className)}
        >
            {/* Main card */}
            <div className="relative bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <div className={cn(
                            'p-3 rounded-lg bg-gradient-to-br shadow-sm',
                            milestone.color
                        )}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Current Streak</h3>
                            <p className="text-xs text-gray-500 font-medium capitalize">{milestone.level} Level</p>
                        </div>
                    </div>

                    {/* Streak count */}
                    <div className="text-right">
                        <div className="text-4xl font-bold text-gray-900 tracking-tight">
                            {streak}
                        </div>
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">days</div>
                    </div>
                </div>

                {/* Progress bar to next milestone */}
                {streak < 100 && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                            <span>Next milestone: {currentMilestone} days</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={cn('h-full rounded-full bg-gradient-to-r', milestone.color)}
                            />
                        </div>
                    </div>
                )}

                {/* Milestone badges */}
                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                    {[7, 14, 30, 100].map((m) => (
                        <div
                            key={m}
                            className={cn(
                                'flex flex-col items-center space-y-1',
                                streak >= m ? 'opacity-100' : 'opacity-40 grayscale'
                            )}
                        >
                            <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border',
                                streak >= m
                                    ? 'bg-white border-amber-200 text-amber-600 shadow-sm'
                                    : 'bg-gray-50 border-gray-200 text-gray-400'
                            )}>
                                {m}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
