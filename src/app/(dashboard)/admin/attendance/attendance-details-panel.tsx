'use client'

import { motion } from 'framer-motion'
import { X, UserCheck, UserX, Clock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AttendanceRecord {
    id: string
    studentName: string
    studentNumber?: string
    grade?: string
    className?: string
    status: 'present' | 'absent' | 'late' | 'excused'
    timeIn?: string
    reason?: string
}

interface AttendanceDetailsPanelProps {
    date: string
    records: AttendanceRecord[]
    loading?: boolean
    onClose: () => void
}

export function AttendanceDetailsPanel({ date, records, loading, onClose }: AttendanceDetailsPanelProps) {
    const presentCount = records.filter(r => r.status === 'present').length
    const absentCount = records.filter(r => r.status === 'absent').length
    const lateCount = records.filter(r => r.status === 'late').length

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed right-0 top-0 h-screen w-full sm:w-[360px] md:w-[400px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 overflow-y-auto"
        >
            {/* Safe area for mobile notches */}
            <div className="p-4 sm:p-6 pt-safe">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        {formatDate(date)}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 w-8 h-8 sm:w-10 sm:h-10 active:scale-95 transition-transform"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
                    <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-900/10 rounded-lg sm:rounded-xl border border-green-100 dark:border-green-900/20 text-center">
                        <div className="text-lg sm:text-xl font-bold text-green-600">{presentCount}</div>
                        <div className="text-[10px] sm:text-xs text-green-700 font-medium">Present</div>
                    </div>
                    <div className="p-2 sm:p-3 bg-red-50 dark:bg-red-900/10 rounded-lg sm:rounded-xl border border-red-100 dark:border-red-900/20 text-center">
                        <div className="text-lg sm:text-xl font-bold text-red-600">{absentCount}</div>
                        <div className="text-[10px] sm:text-xs text-red-700 font-medium">Absent</div>
                    </div>
                    <div className="p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg sm:rounded-xl border border-yellow-100 dark:border-yellow-900/20 text-center">
                        <div className="text-lg sm:text-xl font-bold text-yellow-600">{lateCount}</div>
                        <div className="text-[10px] sm:text-xs text-yellow-700 font-medium">Late</div>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3 sm:space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="animate-pulse flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                                <div className="flex-1 space-y-1.5 sm:space-y-2">
                                    <div className="h-3 sm:h-4 w-28 sm:w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                                    <div className="h-2.5 sm:h-3 w-16 sm:w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Absent Students */}
                        {absentCount > 0 && (
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Absent</h3>
                                <div className="space-y-2 sm:space-y-3">
                                    {records.filter(r => r.status === 'absent').map(record => (
                                        <div key={record.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800 active:scale-[0.99]">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                                <UserX className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{record.studentName}</div>
                                                <div className="text-[10px] sm:text-xs text-gray-500 truncate">{record.className} • {record.studentNumber}</div>
                                                {record.reason && (
                                                    <div className="mt-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 inline-block">
                                                        {record.reason}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Late Students */}
                        {lateCount > 0 && (
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Late</h3>
                                <div className="space-y-2 sm:space-y-3">
                                    {records.filter(r => r.status === 'late').map(record => (
                                        <div key={record.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800 active:scale-[0.99]">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
                                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{record.studentName}</div>
                                                <div className="text-[10px] sm:text-xs text-gray-500 truncate">{record.className} • {record.timeIn || 'No time logged'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Present Students */}
                        <div>
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Present ({presentCount})</h3>
                            <div className="space-y-1.5 sm:space-y-2">
                                {records.filter(r => r.status === 'present').map(record => (
                                    <div key={record.id} className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                            <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">{record.studentName}</div>
                                            <div className="text-[10px] sm:text-xs text-gray-500 truncate">{record.className}</div>
                                        </div>
                                        {record.timeIn && (
                                            <div className="ml-auto text-[10px] sm:text-xs text-gray-400 font-mono flex-shrink-0">
                                                {record.timeIn}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {records.length === 0 && !loading && (
                    <div className="text-center py-8 sm:py-12 text-gray-500">
                        <p className="text-sm">No attendance records found for this date.</p>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
