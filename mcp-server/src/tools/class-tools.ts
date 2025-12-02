import { z } from 'zod'
import { apiClient } from '../utils/api-client.js'
import {
    CreateClassInputSchema,
    UpdateClassInputSchema,
    DeleteClassInputSchema,
    SchoolIdSchema,
} from '../utils/schemas.js'
import { createConfirmationResponse } from '../utils/confirmation.js'

// ============================================
// Tool Definitions: Class Management (6 tools)
// ============================================

/**
 * Tool 1: Get Class List
 * Get all classes in the school
 */
export const getClassList = {
    name: 'getClassList',
    description: 'Get list of all classes in the school with grade level and teacher information',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
        },
        required: ['school_id'],
    },

    async execute(args: z.infer<typeof SchoolIdSchema>) {
        const validated = SchoolIdSchema.parse(args)

        try {
            const result = await apiClient.post('/admin/classes', {
                schoolId: validated.school_id,
            })

            return {
                success: true,
                data: {
                    classes: result.classes || [],
                    total: result.classes?.length || 0,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch class list',
            }
        }
    },
}

/**
 * Tool 2: Create Class
 * Create a new class (requires confirmation)
 */
export const createClass = {
    name: 'createClass',
    description: 'Create a new class with specified grade level, name, and room number. Requires user confirmation.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            grade_level_id: {
                type: 'string',
                description: 'Grade level UUID identifier',
            },
            class_name: {
                type: 'string',
                description: 'Class name',
            },
            room_number: {
                type: 'string',
                description: 'Room number (optional)',
            },
            max_students: {
                type: 'number',
                description: 'Maximum students capacity (default: 25)',
            },
        },
        required: ['school_id', 'grade_level_id', 'class_name'],
    },

    async execute(args: z.infer<typeof CreateClassInputSchema>) {
        const validated = CreateClassInputSchema.parse(args)

        const confirmation = createConfirmationResponse(
            {
                action: 'Create New Class',
                target: validated.class_name,
                changes: [
                    { field: 'Grade Level ID', oldValue: null, newValue: validated.grade_level_id },
                    { field: 'Room Number', oldValue: null, newValue: validated.room_number || '(not specified)' },
                    { field: 'Max Students', oldValue: null, newValue: validated.max_students || 25 },
                ],
            },
            { action: 'createClass', args: validated }
        )

        return confirmation
    },

    async executeConfirmed(args: z.infer<typeof CreateClassInputSchema>) {
        try {
            const result = await apiClient.put('/admin/classes', {
                schoolId: args.school_id,
                gradeLevelId: args.grade_level_id,
                className: args.class_name,
                roomNumber: args.room_number,
                maxStudents: args.max_students,
            })

            return {
                success: true,
                message: `✅ Successfully created class: ${args.class_name}`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to create class',
            }
        }
    },
}

/**
 * Tool 3: Update Class
 * Update class details (requires confirmation)
 */
export const updateClass = {
    name: 'updateClass',
    description: 'Update class information such as name, room number, or capacity. Requires user confirmation.',

    inputSchema: {
        type: 'object',
        properties: {
            class_id: {
                type: 'string',
                description: 'Class UUID identifier',
            },
            class_name: {
                type: 'string',
                description: 'Updated class name (optional)',
            },
            room_number: {
                type: 'string',
                description: 'Updated room number (optional)',
            },
            max_students: {
                type: 'number',
                description: 'Updated maximum students capacity (optional)',
            },
        },
        required: ['class_id'],
    },

    async execute(args: z.infer<typeof UpdateClassInputSchema>) {
        const validated = UpdateClassInputSchema.parse(args)

        const changes: { field: string; oldValue: any; newValue: any }[] = []
        if (validated.class_name) changes.push({ field: 'Class Name', oldValue: null, newValue: validated.class_name })
        if (validated.room_number) changes.push({ field: 'Room Number', oldValue: null, newValue: validated.room_number })
        if (validated.max_students) changes.push({ field: 'Max Students', oldValue: null, newValue: validated.max_students })

        const confirmation = createConfirmationResponse(
            {
                action: 'Update Class',
                target: `Class ID: ${validated.class_id}`,
                changes,
            },
            { action: 'updateClass', args: validated }
        )

        return confirmation
    },

    async executeConfirmed(args: z.infer<typeof UpdateClassInputSchema>) {
        try {
            const result = await apiClient.patch('/admin/classes', args)

            return {
                success: true,
                message: `✅ Successfully updated class`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update class',
            }
        }
    },
}

/**
 * Tool 4: Delete Class
 * Delete a class (requires confirmation)
 */
export const deleteClass = {
    name: 'deleteClass',
    description: 'Delete a class from the school. Requires user confirmation as this is a destructive action.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            class_id: {
                type: 'string',
                description: 'Class UUID identifier to delete',
            },
        },
        required: ['school_id', 'class_id'],
    },

    async execute(args: z.infer<typeof DeleteClassInputSchema>) {
        const validated = DeleteClassInputSchema.parse(args)

        const confirmation = createConfirmationResponse(
            {
                action: 'Delete Class',
                target: `Class ID: ${validated.class_id}`,
                changes: [
                    { field: 'Action', oldValue: 'Active', newValue: 'Deleted' },
                ],
                warning: 'This will remove the class and may affect student assignments.',
            },
            { action: 'deleteClass', args: validated }
        )

        return confirmation
    },

    async executeConfirmed(args: z.infer<typeof DeleteClassInputSchema>) {
        try {
            const result = await apiClient.delete('/admin/classes', {
                schoolId: args.school_id,
                classId: args.class_id,
            })

            return {
                success: true,
                message: `✅ Successfully deleted class`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to delete class',
            }
        }
    },
}

/**
 * Tool 5: Get Class Details
 * Get detailed information about a specific class
 */
export const getClassDetails = {
    name: 'getClassDetails',
    description: 'Get detailed information about a specific class including student count and teacher assignments',

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
        },
        required: ['school_id', 'class_id'],
    },

    async execute(args: { school_id: string; class_id: string }) {
        try {
            const result = await apiClient.post('/admin/classes', {
                schoolId: args.school_id,
            })

            const classData = result.classes?.find((c: any) => c.id === args.class_id)

            if (!classData) {
                return {
                    success: false,
                    error: 'Class not found',
                }
            }

            return {
                success: true,
                data: classData,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to get class details',
            }
        }
    },
}

/**
 * Tool 6: Get Timetable
 * Get timetable/schedule for a specific class
 */
export const getTimetable = {
    name: 'getTimetable',
    description: 'Get timetable/schedule entries for a specific class',

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
        },
        required: ['school_id', 'class_id'],
    },

    async execute(args: { school_id: string; class_id: string }) {
        try {
            const timetable = await apiClient.get('/admin/timetable/entries', {
                school_id: args.school_id,
                class_id: args.class_id,
            })

            return {
                success: true,
                data: {
                    classId: args.class_id,
                    entries: timetable || [],
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch timetable',
            }
        }
    },
}

// Export all class tools
export const classTools = [
    getClassList,
    createClass,
    updateClass,
    deleteClass,
    getClassDetails,
    getTimetable,
]
