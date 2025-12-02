import { z } from 'zod'
import { apiClient } from '../utils/api-client.js'
import {
    GetAttendanceInputSchema,
    UpdateAttendanceInputSchema,
    MarkClassAttendanceInputSchema,
    DateSchema,
} from '../utils/schemas.js'
import { createConfirmationResponse } from '../utils/confirmation.js'

// ============================================
// Tool Definitions: Attendance Management (5 tools)
// ============================================

/**
 * Tool 1: Get Today's Attendance
 * Get attendance records for today
 */
export const getTodayAttendance = {
    name: 'getTodayAttendance',
    description: "Get today's attendance records for all students or a specific class",

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            class_id: {
                type: 'string',
                description: 'Filter by class UUID (optional)',
            },
        },
        required: ['school_id'],
    },

    async execute(args: { school_id: string; class_id?: string }) {
        try {
            const params: any = {
                school_id: args.school_id,
                date: new Date().toISOString().split('T')[0],
            }

            if (args.class_id) {
                params.class_id = args.class_id
            }

            const attendance = await apiClient.get('/admin/attendance', params)

            return {
                success: true,
                data: {
                    date: params.date,
                    records: attendance.data?.attendance || [],
                    classes: attendance.data?.classes || [],
                    summary: attendance.data?.summary || {},
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to fetch today's attendance",
            }
        }
    },
}

/**
 * Tool 2: Get Attendance by Date
 * Get attendance records for a specific date
 */
export const getAttendanceByDate = {
    name: 'getAttendanceByDate',
    description: 'Get attendance records for a specific date in YYYY-MM-DD format',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            date: {
                type: 'string',
                description: 'Date in YYYY-MM-DD format',
            },
            class_id: {
                type: 'string',
                description: 'Filter by class UUID (optional)',
            },
            status: {
                type: 'string',
                enum: ['present', 'absent', 'late', 'excused'],
                description: 'Filter by attendance status (optional)',
            },
        },
        required: ['school_id', 'date'],
    },

    async execute(args: z.infer<typeof GetAttendanceInputSchema>) {
        const validated = GetAttendanceInputSchema.parse(args)

        try {
            const attendance = await apiClient.get('/admin/attendance', validated)

            return {
                success: true,
                data: {
                    date: validated.date,
                    records: attendance.data?.attendance || [],
                    classes: attendance.data?.classes || [],
                    summary: attendance.data?.summary || {},
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch attendance',
            }
        }
    },
}

/**
 * Tool 3: Get Class Attendance
 * Get attendance records for a specific class
 */
export const getClassAttendance = {
    name: 'getClassAttendance',
    description: 'Get attendance records for a specific class, optionally filtered by date',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            class_id: {
                type: 'string',
                description: 'Class UUID identifier',
            },
            date: {
                type: 'string',
                description: 'Date in YYYY-MM-DD format (optional, defaults to today)',
            },
        },
        required: ['school_id', 'class_id'],
    },

    async execute(args: { school_id: string; class_id: string; date?: string }) {
        try {
            const params: any = {
                school_id: args.school_id,
                class_id: args.class_id,
                date: args.date || new Date().toISOString().split('T')[0],
            }

            const attendance = await apiClient.get('/admin/attendance', params)

            return {
                success: true,
                data: {
                    classId: args.class_id,
                    date: params.date,
                    records: attendance.data?.attendance || [],
                    summary: attendance.data?.summary || {},
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch class attendance',
            }
        }
    },
}

/**
 * Tool 4: Update Attendance
 * Update an existing attendance record (requires confirmation)
 */
export const updateAttendance = {
    name: 'updateAttendance',
    description: 'Update an existing attendance record status or notes. Requires user confirmation.',

    inputSchema: {
        type: 'object',
        properties: {
            attendance_id: {
                type: 'string',
                description: 'Attendance record UUID identifier',
            },
            status: {
                type: 'string',
                enum: ['present', 'absent', 'late', 'excused'],
                description: 'New attendance status',
            },
            notes: {
                type: 'string',
                description: 'Notes or reason (optional)',
            },
        },
        required: ['attendance_id', 'status'],
    },

    async execute(args: z.infer<typeof UpdateAttendanceInputSchema>) {
        const validated = UpdateAttendanceInputSchema.parse(args)

        const confirmation = createConfirmationResponse(
            {
                action: 'Update Attendance Record',
                target: `Attendance ID: ${validated.attendance_id}`,
                changes: [
                    { field: 'Status', oldValue: null, newValue: validated.status },
                    { field: 'Notes', oldValue: null, newValue: validated.notes || '(none)' },
                ],
            },
            { action: 'updateAttendance', args: validated }
        )

        return confirmation
    },

    async executeConfirmed(args: z.infer<typeof UpdateAttendanceInputSchema>) {
        try {
            const result = await apiClient.put('/attendance', args)

            return {
                success: true,
                message: `✅ Successfully updated attendance record`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update attendance',
            }
        }
    },
}

/**
 * Tool 5: Mark Class Attendance (Bulk)
 * Mark attendance for an entire class at once (requires confirmation)
 */
export const markClassAttendance = {
    name: 'markClassAttendance',
    description: 'Mark attendance for multiple students in a class at once. Requires user confirmation.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            class_id: {
                type: 'string',
                description: 'Class UUID identifier',
            },
            date: {
                type: 'string',
                description: 'Date in YYYY-MM-DD format',
            },
            attendance_records: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        student_id: {
                            type: 'string',
                            description: 'Student UUID',
                        },
                        status: {
                            type: 'string',
                            enum: ['present', 'absent', 'late', 'excused'],
                            description: 'Attendance status',
                        },
                        notes: {
                            type: 'string',
                            description: 'Optional notes',
                        },
                    },
                    required: ['student_id', 'status'],
                },
                description: 'Array of attendance records to create',
            },
        },
        required: ['school_id', 'class_id', 'date', 'attendance_records'],
    },

    async execute(args: z.infer<typeof MarkClassAttendanceInputSchema>) {
        const validated = MarkClassAttendanceInputSchema.parse(args)

        const studentCount = validated.attendance_records.length
        const presentCount = validated.attendance_records.filter(r => r.status === 'present').length
        const absentCount = validated.attendance_records.filter(r => r.status === 'absent').length
        const lateCount = validated.attendance_records.filter(r => r.status === 'late').length

        const confirmation = createConfirmationResponse(
            {
                action: 'Mark Class Attendance (Bulk)',
                target: `Class ID: ${validated.class_id} on ${validated.date}`,
                changes: [
                    { field: 'Total Students', oldValue: null, newValue: studentCount },
                    { field: 'Present', oldValue: null, newValue: presentCount },
                    { field: 'Absent', oldValue: null, newValue: absentCount },
                    { field: 'Late', oldValue: null, newValue: lateCount },
                ],
            },
            { action: 'markClassAttendance', args: validated }
        )

        return confirmation
    },

    async executeConfirmed(args: z.infer<typeof MarkClassAttendanceInputSchema>) {
        try {
            const result = await apiClient.post('/attendance/bulk', args)

            return {
                success: true,
                message: `✅ Successfully marked attendance for ${args.attendance_records.length} students`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to mark class attendance',
            }
        }
    },
}

// Export all attendance tools
export const attendanceTools = [
    getTodayAttendance,
    getAttendanceByDate,
    getClassAttendance,
    updateAttendance,
    markClassAttendance,
]
