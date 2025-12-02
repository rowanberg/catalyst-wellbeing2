import { z } from 'zod'
import { apiClient } from '../utils/api-client.js'
import { SchoolIdSchema, CreateAdminInputSchema } from '../utils/schemas.js'
import { createConfirmationResponse } from '../utils/confirmation.js'

// ============================================
// Tool Definitions: Security & Admin Management (4 tools)
// ============================================

/**
 * Tool 1: Get Admin List
 * List all administrators in the school
 */
export const getAdminList = {
    name: 'getAdminList',
    description: 'Get list of all administrator accounts in the school',

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
            const admins = await apiClient.get('/admin/users', {
                school_id: validated.school_id,
                role: 'admin',
            })

            return {
                success: true,
                data: {
                    admins: admins.users || [],
                    total: admins.total || 0,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch admin list',
            }
        }
    },
}

/**
 * Tool 2: Create Admin
 * Create a new administrator account (requires confirmation)
 */
export const createAdmin = {
    name: 'createAdmin',
    description: 'Create a new administrator account with full admin privileges. Requires user confirmation due to elevated permissions.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            first_name: {
                type: 'string',
                description: 'Admin first name',
            },
            last_name: {
                type: 'string',
                description: 'Admin last name',
            },
            email: {
                type: 'string',
                description: 'Admin email address',
            },
            password: {
                type: 'string',
                description: 'Admin password (minimum 8 characters)',
            },
        },
        required: ['school_id', 'first_name', 'last_name', 'email', 'password'],
    },

    async execute(args: z.infer<typeof CreateAdminInputSchema>) {
        const validated = CreateAdminInputSchema.parse(args)

        const confirmation = createConfirmationResponse(
            {
                action: 'Create Administrator Account',
                target: `${validated.first_name} ${validated.last_name}`,
                changes: [
                    { field: 'Email', oldValue: null, newValue: validated.email },
                    { field: 'Role', oldValue: null, newValue: 'Administrator' },
                    { field: 'Permissions', oldValue: null, newValue: 'Full admin access' },
                ],
                warning: 'This account will have full administrative privileges including user management, data access, and system configuration.',
            },
            { action: 'createAdmin', args: validated }
        )

        return confirmation
    },

    async executeConfirmed(args: z.infer<typeof CreateAdminInputSchema>) {
        try {
            const result = await apiClient.post('/admin/create-admin-user', {
                schoolId: args.school_id,
                firstName: args.first_name,
                lastName: args.last_name,
                email: args.email,
                password: args.password,
            })

            return {
                success: true,
                message: `✅ Successfully created administrator: ${args.first_name} ${args.last_name}`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to create admin',
            }
        }
    },
}

/**
 * Tool 3: Update Admin
 * Update administrator account information (requires confirmation)
 */
export const updateAdmin = {
    name: 'updateAdmin',
    description: 'Update administrator account information. Requires user confirmation.',

    inputSchema: {
        type: 'object',
        properties: {
            admin_id: {
                type: 'string',
                description: 'Admin UUID identifier',
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
        required: ['admin_id'],
    },

    async execute(args: { admin_id: string; first_name?: string; last_name?: string; email?: string }) {
        const changes: { field: string; oldValue: any; newValue: any }[] = []
        if (args.first_name) changes.push({ field: 'First Name', oldValue: null, newValue: args.first_name })
        if (args.last_name) changes.push({ field: 'Last Name', oldValue: null, newValue: args.last_name })
        if (args.email) changes.push({ field: 'Email', oldValue: null, newValue: args.email })

        const confirmation = createConfirmationResponse(
            {
                action: 'Update Administrator Account',
                target: `Admin ID: ${args.admin_id}`,
                changes,
            },
            { action: 'updateAdmin', args }
        )

        return confirmation
    },

    async executeConfirmed(args: { admin_id: string; first_name?: string; last_name?: string; email?: string }) {
        try {
            const result = await apiClient.put(`/admin/users/${args.admin_id}`, args)

            return {
                success: true,
                message: `✅ Successfully updated administrator account`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update admin',
            }
        }
    },
}

/**
 * Tool 4: Get Audit Logs
 * View system audit logs and activity monitor
 */
export const getAuditLogs = {
    name: 'getAuditLogs',
    description: 'View system audit logs showing admin actions, user activity, and system events',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            start_date: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format (optional)',
            },
            end_date: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format (optional)',
            },
            user_id: {
                type: 'string',
                description: 'Filter by specific user UUID (optional)',
            },
            action_type: {
                type: 'string',
                description: 'Filter by action type (optional)',
            },
        },
        required: ['school_id'],
    },

    async execute(args: { school_id: string; start_date?: string; end_date?: string; user_id?: string; action_type?: string }) {
        try {
            const params: any = {
                school_id: args.school_id,
            }

            if (args.start_date) params.start_date = args.start_date
            if (args.end_date) params.end_date = args.end_date
            if (args.user_id) params.user_id = args.user_id
            if (args.action_type) params.action_type = args.action_type

            const logs = await apiClient.get('/admin/activity-monitor', params)

            return {
                success: true,
                data: {
                    logs: logs.activities || [],
                    total: logs.total || 0,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch audit logs',
            }
        }
    },
}

// Export all security tools
export const securityTools = [
    getAdminList,
    createAdmin,
    updateAdmin,
    getAuditLogs,
]
