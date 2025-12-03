import { z } from 'zod'
import { apiClient } from '../utils/api-client.js'
import { SchoolIdSchema } from '../utils/schemas.js'

// ============================================
// Tool Definitions: Admin Dashboard (4 tools)
// ============================================

/**
 * Tool 1: Get Admin Dashboard Overview
 * Retrieves dashboard statistics and overview for the admin panel
 */
export const getAdminDashboard = {
    name: 'getAdminDashboard',
    description: 'Get comprehensive dashboard overview with school stats, attendance summary, and wellbeing metrics for the admin panel',

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
            // Get stats
            const stats = await apiClient.get('/admin/stats', { school_id: validated.school_id })

            return {
                success: true,
                data: {
                    dashboard: stats,
                    timestamp: new Date().toISOString(),
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch dashboard data',
            }
        }
    },
}

/**
 * Tool 2: Get School Statistics
 * Retrieves detailed school-wide statistics
 */
export const getSchoolStats = {
    name: 'getSchoolStats',
    description: 'Get detailed school statistics including student count, teacher count, parent count, active users, help requests, and wellbeing distribution',

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
            const { apiClient } = await import('../utils/api-client.js')
            const stats = await apiClient.get('/admin/stats', { school_id: validated.school_id })

            return {
                success: true,
                data: {
                    totalStudents: stats.stats?.totalStudents || 0,
                    totalTeachers: stats.stats?.totalTeachers || 0,
                    totalParents: stats.stats?.totalParents || 0,
                    activeToday: stats.stats?.activeToday || 0,
                    helpRequests: stats.stats?.helpRequests || 0,
                    wellbeing: {
                        thriving: stats.stats?.thriving || 0,
                        needsSupport: stats.stats?.needsSupport || 0,
                        atRisk: stats.stats?.atRisk || 0,
                    },
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch school stats',
            }
        }
    },
}

/**
 * Tool 3: Get Attendance Overview
 * Retrieves today's attendance summary across all classes
 */
export const getAttendanceOverview = {
    name: 'getAttendanceOverview',
    description: 'Get attendance overview for today or a specific date, showing class-wise attendance rates and overall statistics',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            date: {
                type: 'string',
                description: 'Date in YYYY-MM-DD format (defaults to today)',
            },
        },
        required: ['school_id'],
    },

    async execute(args: { school_id: string; date?: string }) {
        try {
            const params: any = { school_id: args.school_id }
            if (args.date) {
                params.date = args.date
            }

            const attendance = await apiClient.get('/admin/attendance', params)

            return {
                success: true,
                data: {
                    summary: attendance.data?.summary || {},
                    classes: attendance.data?.classes || [],
                    date: args.date || new Date().toISOString().split('T')[0],
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch attendance overview',
            }
        }
    },
}

/**
 * Tool 4: Get Wellbeing Overview
 * Retrieves wellbeing metrics and statistics for the school
 */
export const getWellbeingOverview = {
    name: 'getWellbeingOverview',
    description: 'Get wellbeing overview including gratitude entries, kindness acts, courage logs, average sleep and water intake',

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
            const wellbeing = await apiClient.post('/admin/wellbeing-overview', {
                schoolId: validated.school_id,
            })

            return {
                success: true,
                data: {
                    overallWellbeing: wellbeing.overallWellbeing || 0,
                    gratitudeEntries: wellbeing.gratitudeEntries || 0,
                    kindnessActs: wellbeing.kindnessActs || 0,
                    courageEntries: wellbeing.courageEntries || 0,
                    averageStreak: wellbeing.averageStreak || 0,
                    avgSleepHours: wellbeing.avgSleepHours || 0,
                    avgWaterGlasses: wellbeing.avgWaterGlasses || 0,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch wellbeing overview',
            }
        }
    },
}

/**
 * Tool 5: Get Wellbeing Severity Analytics
 * Retrieves detailed wellbeing severity data for analysis
 */
export const getWellbeingSeverity = {
    name: 'getWellbeingSeverity',
    description: 'Get detailed wellbeing severity analytics including risk levels, trends, and intervention recommendations',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            period_type: {
                type: 'string',
                description: 'Analysis period (weekly, monthly, term)',
                enum: ['weekly', 'monthly', 'term'],
            },
            risk_level: {
                type: 'string',
                description: 'Filter by risk level',
                enum: ['all', 'thriving', 'low', 'medium', 'high', 'critical'],
            },
            limit: {
                type: 'number',
                description: 'Maximum number of records to return (default: 50)',
            },
        },
        required: ['school_id'],
    },

    async execute(args: { school_id: string; period_type?: string; risk_level?: string; limit?: number }) {
        try {
            const params: any = {
                school_id: args.school_id,
                period_type: args.period_type || 'weekly',
                risk_level: args.risk_level || 'all',
                limit: args.limit || 50,
            }

            // We use the same endpoint as the frontend
            const analytics = await apiClient.get('/admin/wellbeing-severity', params)

            return {
                success: true,
                data: analytics,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch wellbeing severity data',
            }
        }
    },
}

// Export all dashboard tools
export const dashboardTools = [
    getAdminDashboard,
    getSchoolStats,
    getAttendanceOverview,
    getWellbeingOverview,
    getWellbeingSeverity,
]
