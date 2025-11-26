'use client'

import { motion } from 'framer-motion'
import { Minus, Plus, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'

interface HabitSliderProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max: number
    goal: number
    unit: string
    icon: React.ReactNode
    color: string
    label: string
    quickIncrements?: number[]
    disabled?: boolean
}

export function HabitSlider({
    value,
    onChange,
    min = 0,
    max,
    goal,
    unit,
    icon: Icon,
    color,
    label,
    quickIncrements = [1, 2, 4],
    disabled = false,
}: HabitSliderProps) {
    const progress = Math.min((value / goal) * 100, 100)
    const isGoalMet = value >= goal

    const handleIncrement = (amount: number) => {
        const newValue = Math.min(value + amount, max)
        onChange(newValue)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'relative p-6 rounded-2xl border transition-all bg-white shadow-sm',
                disabled && 'opacity-60 pointer-events-none'
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            'p-2.5 rounded-xl transition-colors duration-300',
                            isGoalMet
                                ? `bg-gradient-to-br ${color} text-white shadow-md`
                                : 'bg-gray-100 text-gray-500'
                        )}
                    >
                        {Icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{label}</h3>
                        <p className="text-xs text-gray-500 font-medium">
                            Goal: {goal} {unit}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 tracking-tight">
                            {value}
                            <span className="text-sm font-medium text-gray-400 ml-1">
                                /{unit}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative h-32 flex flex-col items-center justify-center mb-6">
                <ProgressRing
                    progress={progress}
                    size={120}
                    strokeWidth={12}
                    color={color}
                    showPercentage={!isGoalMet}
                />

                {/* Goal Status Overlay */}
                {isGoalMet && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute flex flex-col items-center"
                    >
                        <Trophy className="w-8 h-8 text-amber-500 mb-1" />
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                            Goal Met
                        </span>
                    </motion.div>
                )}

                {/* Quick Increment Buttons */}
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                    {quickIncrements.map((amount) => (
                        <button
                            key={amount}
                            onClick={() => handleIncrement(amount)}
                            disabled={value >= max}
                            className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            +{amount}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between gap-4">
                <button
                    onClick={() => handleIncrement(-1)}
                    disabled={value <= 0}
                    className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Minus className="w-5 h-5" />
                </button>

                <div className="flex-1">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={cn('h-full bg-gradient-to-r', color)}
                        />
                    </div>
                </div>

                <button
                    onClick={() => handleIncrement(1)}
                    disabled={value >= max}
                    className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                        `bg-gradient-to-br ${color} hover:shadow-md hover:brightness-105`
                    )}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
}
