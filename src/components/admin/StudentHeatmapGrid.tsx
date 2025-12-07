'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowUpDown, Search, Download, Users, CalendarDays } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AttendanceDay {
    date: string
    status: 'present' | 'absent' | 'late' | null
}

interface Student {
    id: string
    name: string
    attendance: AttendanceDay[]
    attendanceRate: number
}

interface StudentHeatmapGridProps {
    students: Student[]
    dates: string[]
    className: string
    onClose: () => void
}

// Memoized cell for performance
const AttendanceCell = memo(function AttendanceCell({
    status,
    tooltip
}: {
    status: AttendanceDay['status']
    tooltip: string
}) {
    const getStatusColor = (status: AttendanceDay['status']) => {
        switch (status) {
            case 'present': return 'bg-gradient-to-br from-green-400 to-green-600'
            case 'absent': return 'bg-gradient-to-br from-red-400 to-red-600'
            case 'late': return 'bg-gradient-to-br from-yellow-400 to-yellow-600'
            default: return 'bg-gray-100 dark:bg-gray-800'
        }
    }

    return (
        <div
            className={`
        w-7 h-7 rounded-lg transition-all cursor-pointer
        ${getStatusColor(status)}
        hover:scale-125 hover:shadow-lg hover:z-10
      `}
            title={tooltip}
        />
    )
})

// Memoized student row
const StudentRow = memo(function StudentRow({
    student,
    index,
    formatDate,
    getStatusLabel
}: {
    student: Student
    index: number
    formatDate: (date: string) => string
    getStatusLabel: (status: AttendanceDay['status']) => string
}) {
    const getRateColor = (rate: number) => {
        if (rate >= 95) return 'text-green-600 bg-green-100 dark:bg-green-900/30'
        if (rate >= 85) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
        if (rate >= 75) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
        return 'text-red-600 bg-red-100 dark:bg-red-900/30'
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.02, 0.5) }}
            className="flex items-center py-2.5 border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 group transition-colors"
        >
            <div className="w-48 flex-shrink-0 pr-4">
                <span className="font-medium text-gray-900 dark:text-white truncate block group-hover:text-blue-600 transition-colors">
                    {student.name}
                </span>
            </div>
            <div className="w-20 flex-shrink-0 text-center">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getRateColor(student.attendanceRate)}`}>
                    {student.attendanceRate}%
                </span>
            </div>
            <div className="flex gap-1">
                {student.attendance.map((day, dayIdx) => (
                    <AttendanceCell
                        key={`${student.id}-${day.date}`}
                        status={day.status}
                        tooltip={`${student.name}\n${formatDate(day.date)}: ${getStatusLabel(day.status)}`}
                    />
                ))}
            </div>
        </motion.div>
    )
})

export const StudentHeatmapGrid = memo(function StudentHeatmapGrid({
    students,
    dates,
    className,
    onClose
}: StudentHeatmapGridProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState<'name' | 'rate'>('name')
    const [sortAsc, setSortAsc] = useState(true)

    const getStatusLabel = useCallback((status: AttendanceDay['status']) => {
        if (!status) return 'No data'
        return status.charAt(0).toUpperCase() + status.slice(1)
    }, [])

    const formatDate = useCallback((dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }, [])

    const filteredAndSorted = useMemo(() => {
        let result = [...students]

        if (searchTerm) {
            result = result.filter(s =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        result.sort((a, b) => {
            if (sortBy === 'name') {
                return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
            } else {
                return sortAsc ? a.attendanceRate - b.attendanceRate : b.attendanceRate - a.attendanceRate
            }
        })

        return result
    }, [students, searchTerm, sortBy, sortAsc])

    const stats = useMemo(() => {
        const totalPresent = students.reduce((acc, s) =>
            acc + s.attendance.filter(a => a.status === 'present').length, 0
        )
        const totalRecords = students.reduce((acc, s) =>
            acc + s.attendance.filter(a => a.status !== null).length, 0
        )
        return {
            avgRate: totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0,
            perfectAttendance: students.filter(s => s.attendanceRate === 100).length,
            atRisk: students.filter(s => s.attendanceRate < 75).length
        }
    }, [students])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25 }}
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                    <div className="relative flex items-center justify-between">
                        <div className="text-white">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <CalendarDays className="w-6 h-6" />
                                {className}
                            </h2>
                            <p className="text-blue-100 mt-1 flex items-center gap-4">
                                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {students.length} students</span>
                                <span>•</span>
                                <span>{dates.length} days tracked</span>
                                <span>•</span>
                                <span>{stats.avgRate}% avg attendance</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-105"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex gap-4">
                        {[
                            { label: 'Perfect Attendance', value: stats.perfectAttendance, color: 'text-green-600' },
                            { label: 'At Risk (<75%)', value: stats.atRisk, color: stats.atRisk > 0 ? 'text-red-600' : 'text-gray-500' },
                            { label: 'Class Average', value: `${stats.avgRate}%`, color: 'text-blue-600' },
                        ].map((stat, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                                <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                                <span className="text-sm text-gray-500">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Controls */}
                <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 rounded-xl border-gray-200"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (sortBy === 'name') setSortAsc(!sortAsc)
                                    else { setSortBy('name'); setSortAsc(true) }
                                }}
                                className={`rounded-xl ${sortBy === 'name' ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}`}
                            >
                                <ArrowUpDown className="w-4 h-4 mr-1" />
                                Name {sortBy === 'name' && (sortAsc ? '↑' : '↓')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (sortBy === 'rate') setSortAsc(!sortAsc)
                                    else { setSortBy('rate'); setSortAsc(false) }
                                }}
                                className={`rounded-xl ${sortBy === 'rate' ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}`}
                            >
                                <ArrowUpDown className="w-4 h-4 mr-1" />
                                Rate {sortBy === 'rate' && (sortAsc ? '↑' : '↓')}
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl">
                                <Download className="w-4 h-4 mr-1" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-6 mt-3">
                        <span className="text-sm text-gray-500 font-medium">Legend:</span>
                        {[
                            { color: 'bg-green-500', label: 'Present' },
                            { color: 'bg-red-500', label: 'Absent' },
                            { color: 'bg-yellow-500', label: 'Late' },
                            { color: 'bg-gray-200', label: 'No Data' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-md ${item.color}`}></div>
                                <span className="text-sm text-gray-600">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="overflow-auto max-h-[50vh] p-6">
                    <div className="min-w-max">
                        {/* Date Headers */}
                        <div className="flex items-center sticky top-0 bg-white dark:bg-gray-900 z-10 pb-3 mb-2 border-b-2 border-gray-200 dark:border-gray-700">
                            <div className="w-48 flex-shrink-0 pr-4">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Student</span>
                            </div>
                            <div className="w-20 flex-shrink-0 text-center">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Rate</span>
                            </div>
                            <div className="flex gap-1">
                                {dates.map((date) => (
                                    <div
                                        key={date}
                                        className="w-7 flex-shrink-0 text-center"
                                        title={new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    >
                                        <span className="text-[10px] text-gray-500 font-medium">
                                            {new Date(date).getDate()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Student Rows */}
                        {filteredAndSorted.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                No students found matching your search.
                            </div>
                        ) : (
                            filteredAndSorted.map((student, idx) => (
                                <StudentRow
                                    key={student.id}
                                    student={student}
                                    index={idx}
                                    formatDate={formatDate}
                                    getStatusLabel={getStatusLabel}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Showing <span className="font-semibold text-gray-700">{filteredAndSorted.length}</span> of <span className="font-semibold text-gray-700">{students.length}</span> students
                    </span>
                    <Button onClick={onClose} className="rounded-xl bg-gray-900 hover:bg-gray-800">
                        Close
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    )
})
