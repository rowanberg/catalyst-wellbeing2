import { z } from 'zod'
import { apiClient } from '../utils/api-client.js'
import {
    SearchTeachersInputSchema,
    AddTeacherInputSchema,
    UpdateTeacherInputSchema,
} from '../utils/schemas.js'
import { createConfirmationResponse } from '../utils/confirmation.js'

// ============================================
// Tool Definitions: Teacher Management (5 tools)
// ============================================

/**
 * Tool 1: Search Teachers
 * Search and filter teachers
 */
export const searchTeachers = {
    name: 'searchTeachers',
    description: 'Search and filter teachers by name. Supports pagination.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            search: {
                type: 'string',
                description: 'Search term for teacher name',
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

    async execute(args: z.infer<typeof SearchTeachersInputSchema>) {
        const validated = SearchTeachersInputSchema.parse(args)

        try {
            // API expects camelCase parameter names
            const params: any = {
                schoolId: validated.school_id,  // Convert to camelCase
                role: 'teacher',
                page: validated.page,
                limit: validated.limit,
            }

            if (validated.search) {
                params.search = validated.search
            }

            const teachers = await apiClient.get('/admin/users', params)

            return {
                success: true,
                data: {
                    teachers: teachers.users || [],
                    total: teachers.total || 0,
                    page: validated.page,
                    limit: validated.limit,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to search teachers',
            }
        }
    },
}

/**
 * Tool 2: Get Teacher Profile
 * Get detailed information about a specific teacher
 */
export const getTeacherProfile = {
    name: 'getTeacherProfile',
    description: 'Get detailed profile information about a specific teacher',

    inputSchema: {
        type: 'object',
        properties: {
            teacher_id: {
                type: 'string',
                description: 'Teacher UUID identifier',
            },
        },
        required: ['teacher_id'],
    },

    async execute(args: { teacher_id: string }) {
        try {
            const teacher = await apiClient.get(`/admin/users/${args.teacher_id}`)

            return {
                success: true,
                data: teacher,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get teacher profile',
            }
        }
    },
}

/**
 * Tool 3: Add Teacher
 * Create a new teacher profile (requires confirmation)
 */
export const addTeacher = {
    name: 'addTeacher',
    description: 'Create a new teacher profile with name and email. Requires user confirmation.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            first_name: {
                type: 'string',
                description: 'Teacher first name',
            },
            last_name: {
                type: 'string',
                description: 'Teacher last name',
            },
            email: {
                type: 'string',
                description: 'Teacher email address',
            },
        },
        required: ['school_id', 'first_name', 'last_name', 'email'],
    },

    async execute(args: z.infer<typeof AddTeacherInputSchema>) {
        const validated = AddTeacherInputSchema.parse(args)

        const confirmation = createConfirmationResponse(
            {
                action: 'Create New Teacher',
                target: `${validated.first_name} ${validated.last_name}`,
                changes: [
                    { field: 'Email', oldValue: null, newValue: validated.email },
                    { field: 'Role', oldValue: null, newValue: 'Teacher' },
                ],
            },
            { action: 'addTeacher', args: validated }
        )

        return confirmation
    },

    async executeConfirmed(args: z.infer<typeof AddTeacherInputSchema>) {
        try {
            const result = await apiClient.post('/admin/users', {
                ...args,
                role: 'teacher',
            })

            return {
                success: true,
                message: `✅ Successfully created teacher: ${args.first_name} ${args.last_name}`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to create teacher',
            }
        }
    },
}

/**
 * Tool 4: Update Teacher
 * Update teacher profile information (requires confirmation)
 */
export const updateTeacher = {
    name: 'updateTeacher',
    description: 'Update teacher profile information such as name or email. Requires user confirmation.',

    inputSchema: {
        type: 'object',
        properties: {
            teacher_id: {
                type: 'string',
                description: 'Teacher UUID identifier',
            },
            first_name: {
                type: 'string',
                description: 'Updated first name (optional)',
            },
            last_name: {
                type: 'string',
                description: 'Updated last name (optional)',
            },
            email: {
                type: 'string',
                description: 'Updated email address (optional)',
            },
        },
        required: ['teacher_id'],
    },

    async execute(args: z.infer<typeof UpdateTeacherInputSchema>) {
        const validated = UpdateTeacherInputSchema.parse(args)

        const changes: { field: string; oldValue: any; newValue: any }[] = []
        if (validated.first_name) changes.push({ field: 'First Name', oldValue: null, newValue: validated.first_name })
        if (validated.last_name) changes.push({ field: 'Last Name', oldValue: null, newValue: validated.last_name })
        if (validated.email) changes.push({ field: 'Email', oldValue: null, newValue: validated.email })

        const confirmation = createConfirmationResponse(
            {
                action: 'Update Teacher Profile',
                target: `Teacher ID: ${validated.teacher_id}`,
                changes,
            },
            { action: 'updateTeacher', args: validated }
        )

        return confirmation
    },

    async executeConfirmed(args: z.infer<typeof UpdateTeacherInputSchema>) {
        try {
            const result = await apiClient.put(`/admin/users/${args.teacher_id}`, args)

            return {
                success: true,
                message: `✅ Successfully updated teacher profile`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update teacher',
            }
        }
    },
}

/**
 * Tool 5: Get Teacher Timetable
 * Get timetable/schedule for a specific teacher
 */
export const getTeacherTimetable = {
    name: 'getTeacherTimetable',
    description: 'Get teaching schedule and timetable for a specific teacher',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            teacher_id: {
                type: 'string',
                description: 'Teacher UUID identifier',
            },
        },
        required: ['school_id', 'teacher_id'],
    },

    async execute(args: { school_id: string; teacher_id: string }) {
        try {
            const timetable = await apiClient.get('/admin/timetable/entries', {
                school_id: args.school_id,
                teacher_id: args.teacher_id,
            })

            return {
                success: true,
                data: {
                    teacherId: args.teacher_id,
                    entries: timetable || [],
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch teacher timetable',
            }
        }
    },
}

// Export all teacher tools
export const teacherTools = [
    searchTeachers,
    getTeacherProfile,
    addTeacher,
    updateTeacher,
    getTeacherTimetable,
]
