import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface DailyStatus {
    date: string
    completed: boolean
    isToday: boolean
    label: string // 'M', 'T', 'W', etc.
}

interface WeeklyProgressProps {
    data: DailyStatus[]
    streak: number
}

export function WeeklyProgress({ data, streak }: WeeklyProgressProps) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-semibold text-slate-900">Weekly Consistency</h3>
                    <p className="text-sm text-slate-500">Last 7 days activity</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{streak}</div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Day Streak</div>
                </div>
            </div>

            <div className="flex justify-between items-center gap-2">
                {data.map((day, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                        <div className="text-xs font-medium text-slate-400">{day.label}</div>
                        <div
                            className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-200",
                                day.completed
                                    ? "bg-green-100 text-green-600 ring-2 ring-green-50"
                                    : day.isToday
                                        ? "bg-slate-100 text-slate-400 ring-2 ring-slate-50 border border-slate-200 border-dashed"
                                        : "bg-slate-50 text-slate-300"
                            )}
                        >
                            {day.completed ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
