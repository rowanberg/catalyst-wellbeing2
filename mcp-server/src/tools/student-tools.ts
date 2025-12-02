import { z } from 'zod'
import { apiClient } from '../utils/api-client.js'
import {
    SearchStudentsInputSchema,
    UpdateStudentInputSchema,
    AddStudentInputSchema,
} from '../utils/schemas.js'
import { createConfirmationResponse } from '../utils/confirmation.js'

// ============================================
// Tool Definitions: Student Management (8 tools)
// ============================================

/**
 * Tool 1: Search Students
 * Search and filter students by various criteria
 */
export const searchStudents = {
    name: 'searchStudents',
    description: 'Search and filter students by name, grade, or class. Supports pagination.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            search: {
                type: 'string',
                description: 'Search term for student name',
            },
            grade: {
                type: 'string',
                description: 'Filter by grade level',
            },
            class_id: {
                type: 'string',
                description: 'Filter by class UUID',
            },
            page: {
                type: 'number',
                description: 'Page number (default: 1)',
            },
            limit: {
                type: 'number',
                description: 'Results per page (default: 20, max: 100)',
            },
        },
        required: ['school_id'],
    },

    async execute(args: z.infer<typeof SearchStudentsInputSchema>) {
        const validated = SearchStudentsInputSchema.parse(args)

        try {
            const { supabaseAdmin } = await import('../utils/supabase.js')

            let query = supabaseAdmin
                .from('profiles')
                .select('id, first_name, last_name, xp, gems, level, created_at, school_id', { count: 'exact' })
                .eq('school_id', validated.school_id)
                .eq('role', 'student')

            // Apply search filter if provided
            if (validated.search) {
                query = query.or(`first_name.ilike.%${validated.search}%,last_name.ilike.%${validated.search}%`)
            }

            // Apply pagination
            const page = validated.page || 1
            const limit = validated.limit || 20
            const from = (page - 1) * limit
            const to = from + limit - 1

            query = query.range(from, to).order('last_name', { ascending: true })

            const { data: students, error, count } = await query

            if (error) {
                throw new Error(error.message)
            }

            // Transform data to match expected format
            const formattedStudents = students?.map((student: any) => ({
                id: student.id,
                name: `${student.first_name} ${student.last_name}`,
                grade: 'N/A', // Grade not in profiles table
                class: 'Unassigned',
                totalXP: student.xp || 0,
                level: student.level || 1,
                gems: student.gems || 0,
                joinedDate: student.created_at,
            })) || []

            return {
                success: true,
                data: {
                    students: formattedStudents,
                    total: count || 0,
                    page: page,
                    limit: limit,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to search students',
            }
        }
    },
}

/**
 * Tool 2: Get Student Info
 * Get detailed information about a specific student
 */
export const getStudentInfo = {
    name: 'getStudentInfo',
    description: 'Get detailed information about a specific student including profile, XP, gems, level, and subjects',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            student_id: {
                type: 'string',
                description: 'Student UUID identifier',
            },
        },
        required: ['school_id', 'student_id'],
    },

    async execute(args: { school_id: string; student_id: string }) {
        try {
            // Search for specific student
            const result = await apiClient.get('/admin/students', {
                school_id: args.school_id,
            })

            const student = result.students?.find((s: any) => s.id === args.student_id)

            if (!student) {
                return {
                    success: false,
                    error: 'Student not found',
                }
            }

            return {
                success: true,
                data: student,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get student info',
            }
        }
    },
}

/**
 * Tool 3: Update Student Info
 * Update student profile information (requires confirmation)
 */
export const updateStudentInfo = {
    name: 'updateStudentInfo',
    description: 'Update student profile information such as name or student number. Requires user confirmation before executing.',

    inputSchema: {
        type: 'object',
        properties: {
            student_id: {
                type: 'string',
                description: 'Student UUID identifier',
            },
            first_name: {
                type: 'string',
                description: 'Updated first name',
            },
            last_name: {
                type: 'string',
                description: 'Updated last name',
            },
            student_number: {
                type: 'string',
                description: 'Updated student number',
            },
        },
        required: ['student_id'],
    },

    async execute(args: z.infer<typeof UpdateStudentInputSchema>) {
        const validated = UpdateStudentInputSchema.parse(args)

        // Generate confirmation request
        const changes: { field: string; oldValue: any; newValue: any }[] = []
        if (validated.first_name) changes.push({ field: 'First Name', oldValue: null, newValue: validated.first_name })
        if (validated.last_name) changes.push({ field: 'Last Name', oldValue: null, newValue: validated.last_name })
        if (validated.student_number) changes.push({ field: 'Student Number', oldValue: null, newValue: validated.student_number })

        const confirmation = createConfirmationResponse(
            {
                action: 'Update Student Information',
                target: `Student ID: ${validated.student_id}`,
                changes,
            },
            { action: 'updateStudent', args: validated }
        )

        return confirmation
    },

    // This will be called after user confirms
    async executeConfirmed(args: z.infer<typeof UpdateStudentInputSchema>) {
        try {
            const result = await apiClient.put(`/admin/users/${args.student_id}`, args)

            return {
                success: true,
                message: `✅ Successfully updated student information`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update student',
            }
        }
    },
}

/**
 * Tool 4: Add Student
 * Create a new student profile (requires confirmation)
 */
export const addStudent = {
    name: 'addStudent',
    description: 'Create a new student profile with name, email, and optional class assignment. Requires user confirmation.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            first_name: {
                type: 'string',
                description: 'Student first name',
            },
            last_name: {
                type: 'string',
                description: 'Student last name',
            },
            email: {
                type: 'string',
                description: 'Student email address',
            },
            student_number: {
                type: 'string',
                description: 'Student number (optional)',
            },
            grade_level_id: {
                type: 'string',
                description: 'Grade level UUID (optional)',
            },
            class_id: {
                type: 'string',
                description: 'Class UUID (optional)',
            },
        },
        required: ['school_id', 'first_name', 'last_name', 'email'],
    },

    async execute(args: z.infer<typeof AddStudentInputSchema>) {
        const validated = AddStudentInputSchema.parse(args)

        const confirmation = createConfirmationResponse(
            {
                action: 'Create New Student',
                target: `${validated.first_name} ${validated.last_name}`,
                changes: [
                    { field: 'Email', oldValue: null, newValue: validated.email },
                    { field: 'Student Number', oldValue: null, newValue: validated.student_number || '(not provided)' },
                ],
            },
            { action: 'addStudent', args: validated }
        )

        return confirmation
    },

    async executeConfirmed(args: z.infer<typeof AddStudentInputSchema>) {
        try {
            const result = await apiClient.post('/admin/users', {
                ...args,
                role: 'student',
            })

            return {
                success: true,
                message: `✅ Successfully created student: ${args.first_name} ${args.last_name}`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to create student',
            }
        }
    },
}

/**
 * Tool 5: Disable Student
 * Deactivate a student account (requires confirmation)
 */
export const disableStudent = {
    name: 'disableStudent',
    description: 'Deactivate a student account. This action requires confirmation as it will disable access.',

    inputSchema: {
        type: 'object',
        properties: {
            student_id: {
                type: 'string',
                description: 'Student UUID identifier to disable',
            },
        },
        required: ['student_id'],
    },

    async execute(args: { student_id: string }) {
        const confirmation = createConfirmationResponse(
            {
                action: 'Disable Student Account',
                target: `Student ID: ${args.student_id}`,
                changes: [
                    { field: 'Account Status', oldValue: 'Active', newValue: 'Disabled' },
                ],
                warning: 'This will prevent the student from logging in and accessing the system.',
            },
            { action: 'disableStudent', args }
        )

        return confirmation
    },

    async executeConfirmed(args: { student_id: string }) {
        try {
            const result = await apiClient.delete(`/admin/users/${args.student_id}`)

            return {
                success: true,
                message: `✅ Successfully disabled student account`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to disable student',
            }
        }
    },
}

/**
 * Tool 6: Get Student Attendance
 * Get attendance history for a specific student
 */
export const getStudentAttendance = {
    name: 'getStudentAttendance',
    description: 'Get attendance history for a specific student, optionally filtered by date range',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            student_id: {
                type: 'string',
                description: 'Student UUID identifier',
            },
            start_date: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format (optional)',
            },
            end_date: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format (optional)',
            },
        },
        required: ['school_id', 'student_id'],
    },

    async execute(args: { school_id: string; student_id: string; start_date?: string; end_date?: string }) {
        try {
            const params: any = {
                school_id: args.school_id,
                student_id: args.student_id,
            }

            const attendance = await apiClient.get('/admin/attendance', params)

            return {
                success: true,
                data: {
                    records: attendance.data?.attendance || [],
                    summary: attendance.data?.summary || {},
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch student attendance',
            }
        }
    },
}

/**
 * Tool 7: Get Student Wellbeing
 * Get wellbeing data and insights for a specific student
 */
export const getStudentWellbeing = {
    name: 'getStudentWellbeing',
    description: 'Get wellbeing insights and mental health data for a specific student',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            student_id: {
                type: 'string',
                description: 'Student UUID identifier',
            },
        },
        required: ['school_id', 'student_id'],
    },

    async execute(args: { school_id: string; student_id: string }) {
        try {
            const wellbeing = await apiClient.get('/admin/wellbeing-insights', {
                school_id: args.school_id,
                student_id: args.student_id,
            })

            return {
                success: true,
                data: wellbeing,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch student wellbeing data',
            }
        }
    },
}

/**
 * Tool 8: Get Student Fees
 * Get fee records and payment history for a student
 */
export const getStudentFees = {
    name: 'getStudentFees',
    description: 'Get fee records and payment history for a specific student',

    inputSchema: {
        type: 'object',
        properties: {
            student_id: {
                type: 'string',
                description: 'Student UUID identifier',
            },
        },
        required: ['student_id'],
    },

    async execute(args: { student_id: string }) {
        try {
            const fees = await apiClient.get(`/fees/student/${args.student_id}`)

            return {
                success: true,
                data: fees,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch student fees',
            }
        }
    },
}

// Export all student tools
export const studentTools = [
    searchStudents,
    getStudentInfo,
    updateStudentInfo,
    addStudent,
    disableStudent,
    getStudentAttendance,
    getStudentWellbeing,
    getStudentFees,
]
