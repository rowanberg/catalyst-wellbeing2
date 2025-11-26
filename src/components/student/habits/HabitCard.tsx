import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Minus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HabitCardProps {
    label: string
    value: number
    max: number
    goal: number
    unit: string
    icon: React.ElementType
    color: string
    onChange: (value: number) => void
}

export function HabitCard({
    label,
    value,
    max,
    goal,
    unit,
    icon: Icon,
    color,
    onChange,
}: HabitCardProps) {
    const percentage = Math.min(100, (value / goal) * 100)
    const isCompleted = value >= goal

    return (
        <Card className="relative overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
            {/* Progress Background */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 h-1 bg-gradient-to-r transition-all duration-500 ease-out",
                    color
                )}
                style={{ width: `${percentage}%` }}
            />

            <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3 rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100",
                            isCompleted && "bg-green-50 text-green-600 ring-green-100"
                        )}>
                            {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 text-lg">{label}</h3>
                            <p className="text-sm text-slate-500 font-medium">
                                Goal: {goal} {unit}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">
                            {value}
                            <span className="text-sm text-slate-400 font-medium ml-1">/ {goal}</span>
                        </div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">
                            {unit}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                        onClick={() => onChange(Math.max(0, value - 1))}
                        disabled={value <= 0}
                    >
                        <Minus className="w-4 h-4" />
                    </Button>

                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden relative">
                        <motion.div
                            className={cn("h-full bg-gradient-to-r", color)}
                            initial={{ width: 0 }}
                            animate={{ width: `${(value / max) * 100}%` }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        />
                        {/* Goal Marker */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-10"
                            style={{ left: `${(goal / max) * 100}%` }}
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                        onClick={() => onChange(Math.min(max, value + 1))}
                        disabled={value >= max}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
