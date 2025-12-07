'use client'

import { useMemo, memo } from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'

// Tooltip imports removed as we are using native title attribute for performance and simplicity

interface DayData {
    date: string
    attendanceRate: number
    present: number
    absent: number
    late: number
    total: number
}

interface CalendarHeatmapProps {
    data: DayData[]
    onDateClick?: (date: string) => void
    selectedDate?: string
}

// Memoized cell component for performance
const HeatmapCell = memo(function HeatmapCell({
    day,
    index,
    isSelected,
    onClick,
    formatDate,
    getDateString
}: {
    day: DayData | null
    index: number
    isSelected: boolean
    onClick: () => void
    formatDate: (idx: number) => string
    getDateString: (idx: number) => string
}) {
    const getColor = (rate: number | null) => {
        if (rate === null) return 'bg-gray-100 dark:bg-gray-800/50'
        if (rate >= 95) return 'bg-green-500'
        if (rate >= 85) return 'bg-green-400'
        if (rate >= 75) return 'bg-yellow-400'
        if (rate >= 60) return 'bg-orange-400'
        return 'bg-red-500'
    }

    const getTooltip = () => {
        const dateStr = formatDate(index)
        if (!day) return `${dateStr}\nNo data available`
        return `${dateStr}\n${day.attendanceRate}% Attendance\n• Present: ${day.present}\n• Absent: ${day.absent}\n• Late: ${day.late}`
    }

    return (
        <div
            className={`
        relative w-10 h-10 rounded-lg mx-0.5 cursor-pointer transition-transform duration-200 hover:scale-110 hover:z-10
        ${getColor(day?.attendanceRate ?? null)}
        ${isSelected
                    ? 'ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-gray-900 z-10'
                    : ''
                }
        flex items-center justify-center group
      `}
            onClick={onClick}
            title={getTooltip()} // Native tooltip for zero-overhead interaction
        >
            {day && (
                <span className="text-white text-[10px] font-bold drop-shadow-md select-none">
                    {Math.round(day.attendanceRate)}
                </span>
            )}
        </div>
    )
})

export const CalendarHeatmap = memo(function CalendarHeatmap({
    data,
    onDateClick,
    selectedDate
}: CalendarHeatmapProps) {

    // Generate last 35 days (5 weeks) for the heatmap
    const { days, weeks } = useMemo(() => {
        const result: (DayData | null)[] = []
        const today = new Date()

        for (let i = 34; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            const dayData = data.find(d => d.date === dateStr)
            result.push(dayData || null)
        }

        // Group by weeks
        const weekGroups: (DayData | null)[][] = []
        for (let i = 0; i < 5; i++) {
            weekGroups.push(result.slice(i * 7, (i + 1) * 7))
        }

        return { days: result, weeks: weekGroups }
    }, [data])

    const formatDate = (index: number) => {
        const today = new Date()
        const date = new Date(today)
        date.setDate(date.getDate() - (34 - index))
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
    }

    const getDateString = (index: number) => {
        const today = new Date()
        const date = new Date(today)
        date.setDate(date.getDate() - (34 - index))
        return date.toISOString().split('T')[0]
    }

    // Get start date of a week row for labels
    const getWeekLabel = (weekEndIndex: number) => {
        const today = new Date()
        const date = new Date(today)
        // weekEndIndex is the global index of the last day in the week row
        // But we want the start of that week.
        // The last day of the row is index = (weekIndex + 1) * 7 - 1
        // So the passed index is actually flexible.
        // Let's just calculate based on the first day of that week row.
        const firstDayIndex = weekEndIndex // Assuming we pass the index of the first day
        date.setDate(date.getDate() - (34 - firstDayIndex))
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Summary calculations
    const summary = useMemo(() => {
        const validData = data.filter(d => d.attendanceRate > 0)
        return {
            avgRate: validData.length ? Math.round(validData.reduce((a, d) => a + d.attendanceRate, 0) / validData.length) : 0,
            bestDay: validData.length ? Math.max(...validData.map(d => d.attendanceRate)) : 0,
            lowDays: data.filter(d => d.attendanceRate < 75 && d.attendanceRate > 0).length,
            totalDays: validData.length
        }
    }, [data])

    return (
        <div className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-200/60 dark:border-gray-700/60 shadow-lg">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Attendance Overview
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Attendance trends over the last 35 days
                    </p>
                </div>

                {/* Legend - Improved */}
                <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Legend</span>
                    <div className="flex items-center gap-3">
                        {[
                            { color: 'bg-red-500', label: '<60%' },
                            { color: 'bg-orange-400', label: '60-75%' },
                            { color: 'bg-yellow-400', label: '75-85%' },
                            { color: 'bg-green-400', label: '85-95%' },
                            { color: 'bg-green-500', label: '>95%' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <span className={`w-3 h-3 rounded-full ${item.color}`} />
                                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto pb-2">
                <div className="min-w-fit mx-auto md:mx-0">
                    {/* Day Column Headers */}
                    <div className="flex mb-3">
                        <div className="w-20"></div> {/* Spacer for Week Labels */}
                        {weekDays.map((day, idx) => (
                            <div key={idx} className="w-10 mx-0.5 text-center text-xs font-semibold text-gray-400">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Weeks Rows */}
                    {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="flex items-center mb-2">
                            {/* Week Label - Now shows start date */}
                            <div className="w-20 text-xs text-gray-400 font-medium pr-3 text-right">
                                {getWeekLabel(weekIdx * 7)}
                            </div>

                            {/* Days */}
                            {week.map((day, dayIdx) => {
                                const globalIdx = weekIdx * 7 + dayIdx
                                const dateStr = getDateString(globalIdx)
                                const isSelected = selectedDate === dateStr

                                return (
                                    <HeatmapCell
                                        key={dayIdx}
                                        day={day}
                                        index={globalIdx}
                                        isSelected={isSelected}
                                        onClick={() => onDateClick?.(dateStr)}
                                        formatDate={formatDate}
                                        getDateString={getDateString}
                                    />
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary Stats - Simplified */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                {[
                    { label: 'Average Rate', value: `${summary.avgRate}%`, color: 'text-gray-900 dark:text-gray-100' },
                    { label: 'Best Day', value: `${summary.bestDay}%`, color: 'text-green-600' },
                    { label: 'Low Attendance Days', value: summary.lowDays.toString(), color: summary.lowDays > 0 ? 'text-amber-600' : 'text-gray-500' },
                    { label: 'Total Tracked', value: `${summary.totalDays} Days`, color: 'text-blue-600' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{stat.label}</div>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>
        </div>
    )
})

