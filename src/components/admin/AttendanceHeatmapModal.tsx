'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader, Download, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AttendanceDay {
    date: string
    status: 'present' | 'absent' | 'late' | null
}

interface Student {
    id: string
    name: string
    attendance: AttendanceDay[]
}

interface HeatmapData {
    students: Student[]
    dates: string[]
    summary: {
        totalDays: number
        averageAttendance: number
    }
}

interface AttendanceHeatmapModalProps {
    isOpen: boolean
    onClose: () => void
    className: string
    data: HeatmapData | null
    loading?: boolean
}

export function AttendanceHeatmapModal({
    isOpen,
    onClose,
    className,
    data,
    loading = false
}: AttendanceHeatmapModalProps) {

    const getStatusColor = (status: AttendanceDay['status']) => {
        switch (status) {
            case 'present':
                return 'bg-green-500 hover:bg-green-600'
            case 'absent':
                return 'bg-red-500 hover:bg-red-600'
            case 'late':
                return 'bg-yellow-500 hover:bg-yellow-600'
            default:
                return 'bg-gray-200 hover:bg-gray-300'
        }
    }

    const getStatusLabel = (status: AttendanceDay['status']) => {
        if (!status) return 'No data'
        return status.charAt(0).toUpperCase() + status.slice(1)
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-gray-900">
                                {className} - Attendance Heatmap
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                {data ? (
                                    <>
                                        Showing {data.dates.length} days • {data.students.length} students • {data.summary.averageAttendance}% average attendance
                                    </>
                                ) : (
                                    'Loading attendance data...'
                                )}
                            </DialogDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader className="h-8 w-8 animate-spin text-blue-600" />
                        <span className="ml-3 text-gray-600">Loading heatmap...</span>
                    </div>
                ) : data && data.students.length > 0 ? (
                    <>
                        {/* Legend */}
                        <div className="px-6 py-3 bg-gray-50 border-b">
                            <div className="flex items-center gap-6 flex-wrap">
                                <span className="text-sm font-medium text-gray-700">Legend:</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-green-500"></div>
                                    <span className="text-sm text-gray-600">Present</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-red-500"></div>
                                    <span className="text-sm text-gray-600">Absent</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-yellow-500"></div>
                                    <span className="text-sm text-gray-600">Late</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-gray-200"></div>
                                    <span className="text-sm text-gray-600">No Data</span>
                                </div>
                            </div>
                        </div>

                        {/* Heatmap Grid */}
                        <ScrollArea className="flex-1 p-6">
                            <div className="overflow-x-auto">
                                <div className="inline-block min-w-full">
                                    {/* Date Headers */}
                                    <div className="flex mb-2">
                                        <div className="w-48 flex-shrink-0 pr-4">
                                            <span className="text-sm font-semibold text-gray-700">Student Name</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {data.dates.map((date, idx) => (
                                                <div
                                                    key={date}
                                                    className="w-8 flex-shrink-0 text-center"
                                                    title={new Date(date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                >
                                                    <span className="text-xs text-gray-500 transform -rotate-45 inline-block origin-left">
                                                        {formatDate(date)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Student Rows */}
                                    {data.students.map((student, studentIdx) => (
                                        <div key={student.id} className="flex items-center mb-1 group">
                                            <div className="w-48 flex-shrink-0 pr-4 py-1">
                                                <span className="text-sm font-medium text-gray-900 truncate block">
                                                    {student.name}
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                {student.attendance.map((day, dayIdx) => (
                                                    <div
                                                        key={`${student.id}-${day.date}`}
                                                        className={`w-8 h-8 rounded transition-all cursor-pointer ${getStatusColor(day.status)}`}
                                                        title={`${student.name} - ${formatDate(day.date)}: ${getStatusLabel(day.status)}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">{data.students.length}</span> students over{' '}
                                <span className="font-medium">{data.dates.length}</span> days
                            </div>
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Export Heatmap
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="py-24 text-center">
                        <p className="text-gray-600">No attendance data available for this class.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
