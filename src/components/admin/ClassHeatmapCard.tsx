'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, TrendingDown, Minus, ChevronRight, Sparkles } from 'lucide-react'

interface ClassData {
    id: string
    className: string
    teacher: string
    grade: string
    totalStudents: number
    presentCount: number
    absentCount: number
    lateCount: number
    attendanceRate: number
    weeklyTrend: number[]
}

interface ClassHeatmapCardProps {
    data: ClassData
    onClick?: () => void
    isSelected?: boolean
    index?: number
}

export const ClassHeatmapCard = memo(function ClassHeatmapCard({
    data,
    onClick,
    isSelected,
    index = 0
}: ClassHeatmapCardProps) {
    const getTrendIcon = () => {
        const recent = data.weeklyTrend.slice(-3)
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length
        const prevAvg = data.weeklyTrend.slice(0, 3).reduce((a, b) => a + b, 0) / 3

        if (avg > prevAvg + 2) return <TrendingUp className="w-4 h-4 text-green-500" />
        if (avg < prevAvg - 2) return <TrendingDown className="w-4 h-4 text-red-500" />
        return <Minus className="w-4 h-4 text-gray-400" />
    }

    const getRateColor = (rate: number) => {
        if (rate >= 95) return 'from-green-500 to-emerald-600 shadow-green-500/25'
        if (rate >= 85) return 'from-blue-500 to-indigo-600 shadow-blue-500/25'
        if (rate >= 75) return 'from-yellow-500 to-amber-600 shadow-yellow-500/25'
        return 'from-red-500 to-rose-600 shadow-red-500/25'
    }

    const getHeatmapColor = (rate: number) => {
        if (rate >= 95) return 'bg-gradient-to-t from-green-500 to-green-400'
        if (rate >= 85) return 'bg-gradient-to-t from-green-400 to-green-300'
        if (rate >= 75) return 'bg-gradient-to-t from-yellow-400 to-yellow-300'
        if (rate >= 60) return 'bg-gradient-to-t from-orange-400 to-orange-300'
        if (rate > 0) return 'bg-gradient-to-t from-red-400 to-red-300'
        return 'bg-gray-200 dark:bg-gray-700'
    }

    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 100 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`
        group relative overflow-hidden bg-white dark:bg-gray-900 
        rounded-3xl p-5 border transition-all duration-300 cursor-pointer
        ${isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-2xl shadow-blue-500/20'
                    : 'border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300 hover:shadow-xl shadow-lg shadow-gray-200/40 dark:shadow-none'
                }
      `}
            onClick={onClick}
        >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 dark:from-blue-900/20 to-transparent rounded-full blur-2xl opacity-60" />

            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 p-1.5 bg-blue-500 rounded-full"
                >
                    <Sparkles className="w-3 h-3 text-white" />
                </motion.div>
            )}

            {/* Header */}
            <div className="relative flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate group-hover:text-blue-600 transition-colors">
                        {data.className}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-blue-600 truncate max-w-[120px]">{data.teacher}</span>
                        {data.grade && <span className="text-gray-400">• Grade {data.grade}</span>}
                    </p>
                </div>

                {/* Rate Badge */}
                <div className={`px-3 py-1.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r ${getRateColor(data.attendanceRate)} shadow-lg`}>
                    {data.attendanceRate}%
                </div>
            </div>

            {/* Mini Heatmap - Last 7 days */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">Last 7 days</span>
                    <div className="flex items-center gap-1.5">
                        {getTrendIcon()}
                        <span className="text-xs text-gray-500">trend</span>
                    </div>
                </div>

                {/* Day labels */}
                <div className="flex gap-1 mb-1">
                    {days.map((day, idx) => (
                        <div key={idx} className="flex-1 text-center text-[10px] text-gray-400 font-medium">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Heatmap bars */}
                <div className="flex gap-1 h-12">
                    {data.weeklyTrend.map((rate, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: index * 0.05 + idx * 0.03, type: 'spring' }}
                            className="flex-1 origin-bottom"
                        >
                            <div
                                className={`w-full rounded-lg ${getHeatmapColor(rate)} transition-all duration-200 group-hover:shadow-md`}
                                style={{ height: `${Math.max(rate * 0.5, 10)}%` }}
                                title={`${days[idx]}: ${rate}%`}
                            >
                                <div className="w-full h-full flex items-end justify-center pb-0.5">
                                    <span className="text-[8px] font-bold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {rate}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                    { value: data.totalStudents, label: 'Total', bg: 'bg-gray-50 dark:bg-gray-800', color: 'text-gray-700 dark:text-gray-300' },
                    { value: data.presentCount, label: 'Present', bg: 'bg-green-50 dark:bg-green-900/20', color: 'text-green-600' },
                    { value: data.absentCount, label: 'Absent', bg: 'bg-red-50 dark:bg-red-900/20', color: 'text-red-600' },
                    { value: data.lateCount, label: 'Late', bg: 'bg-yellow-50 dark:bg-yellow-900/20', color: 'text-yellow-600' },
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        className={`text-center p-2.5 ${stat.bg} rounded-xl transition-all`}
                    >
                        <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Footer */}
            <div className="relative flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{data.totalStudents} students enrolled</span>
                </div>
                <motion.div
                    className="flex items-center gap-1 text-sm text-blue-600 font-semibold"
                    whileHover={{ x: 4 }}
                >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                </motion.div>
            </div>
        </motion.div>
    )
})
