import { z } from 'zod'
import { apiClient } from '../utils/api-client.js'
import { SchoolIdSchema } from '../utils/schemas.js'

// ============================================
// Tool Definitions: Incident Management (4 tools)
// ============================================

/**
 * Tool 1: Get Incidents List
 * Retrieves all incidents with optional filtering
 */
export const getIncidentsList = {
    name: 'getIncidentsList',
    description: 'Get list of all incidents (behavioral, academic, positive) with optional filtering by type, severity, and status. Returns student names, teacher names, dates, and descriptions.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            type: {
                type: 'string',
                description: 'Filter by incident type',
                enum: ['all', 'behavioral', 'academic', 'positive'],
            },
            severity: {
                type: 'string',
                description: 'Filter by severity level',
                enum: ['all', 'low', 'medium', 'high'],
            },
            status: {
                type: 'string',
                description: 'Filter by resolution status',
                enum: ['all', 'pending', 'in_progress', 'resolved'],
            },
            limit: {
                type: 'number',
                description: 'Maximum number of incidents to return (default: 50)',
            },
        },
        required: ['school_id'],
    },

    async execute(args: {
        school_id: string
        type?: string
        severity?: string
        status?: string
        limit?: number
    }) {
        try {
            // Fetch incidents from API
            const response = await apiClient.get('/admin/incidents', {
                school_id: args.school_id,
            })

            let incidents = response.incidents || []

            // Apply filters
            if (args.type && args.type !== 'all') {
                incidents = incidents.filter((inc: any) => inc.type === args.type)
            }

            if (args.severity && args.severity !== 'all') {
                incidents = incidents.filter((inc: any) => inc.severity === args.severity)
            }

            if (args.status && args.status !== 'all') {
                incidents = incidents.filter((inc: any) => inc.resolution_status === args.status)
            }

            // Apply limit
            const limit = args.limit || 50
            incidents = incidents.slice(0, limit)

            return {
                success: true,
                data: {
                    incidents: incidents.map((inc: any) => ({
                        id: inc.id,
                        student_name: inc.student_name || 'Unknown',
                        teacher_name: inc.teacher_name || 'Unknown',
                        type: inc.type || 'unknown',
                        severity: inc.severity || 'medium',
                        description: (inc.description && typeof inc.description === 'string')
                            ? inc.description.substring(0, 100).replace(/\s+/g, ' ').trim()
                            : 'No description',
                        status: inc.resolution_status || 'pending',
                        class_name: inc.class_name || 'N/A',
                        created_at: inc.created_at,
                    })),
                    count: incidents.length,
                    totalCount: response.count || incidents.length,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch incidents',
            }
        }
    },
}

/**
 * Tool 2: Get Incident Statistics
 * Retrieves summary statistics for incidents
 */
export const getIncidentStats = {
    name: 'getIncidentStats',
    description: 'Get incident statistics including counts by type (behavioral, academic, positive), severity levels (high, medium, low), and resolution status (pending, in_progress, resolved)',

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
            const response = await apiClient.get('/admin/incidents', {
                school_id: validated.school_id,
            })

            const incidents = response.incidents || []

            // Calculate statistics
            const stats = {
                total: incidents.length,
                byType: {
                    behavioral: incidents.filter((i: any) => i.type === 'behavioral').length,
                    academic: incidents.filter((i: any) => i.type === 'academic').length,
                    positive: incidents.filter((i: any) => i.type === 'positive').length,
                },
                bySeverity: {
                    high: incidents.filter((i: any) => i.severity === 'high').length,
                    medium: incidents.filter((i: any) => i.severity === 'medium').length,
                    low: incidents.filter((i: any) => i.severity === 'low').length,
                },
                byStatus: {
                    pending: incidents.filter((i: any) => i.resolution_status === 'pending').length,
                    in_progress: incidents.filter((i: any) => i.resolution_status === 'in_progress').length,
                    resolved: incidents.filter((i: any) => i.resolution_status === 'resolved').length,
                },
                // Recent trends (last 7 days vs previous 7 days)
                recentTrends: calculateTrends(incidents),
            }

            return {
                success: true,
                data: stats,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch incident statistics',
            }
        }
    },
}

/**
 * Tool 3: Get Incident Details
 * Retrieves full details for a specific incident
 */
export const getIncidentDetails = {
    name: 'getIncidentDetails',
    description: 'Get detailed information about a specific incident by ID, including full description, student info, teacher who reported it, and resolution history',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            incident_id: {
                type: 'string',
                description: 'Incident UUID to retrieve',
            },
        },
        required: ['school_id', 'incident_id'],
    },

    async execute(args: { school_id: string; incident_id: string }) {
        try {
            const response = await apiClient.get('/admin/incidents', {
                school_id: args.school_id,
            })

            const incident = (response.incidents || []).find(
                (inc: any) => inc.id === args.incident_id
            )

            if (!incident) {
                return {
                    success: false,
                    error: 'Incident not found',
                }
            }

            return {
                success: true,
                data: {
                    id: incident.id,
                    student_name: incident.student_name,
                    student_id: incident.student_id,
                    student_grade: incident.student_grade,
                    teacher_name: incident.teacher_name,
                    teacher_id: incident.teacher_id,
                    type: incident.type,
                    severity: incident.severity,
                    description: incident.description,
                    status: incident.resolution_status,
                    class_name: incident.class_name,
                    location: incident.location,
                    incident_date: incident.incident_date,
                    created_at: incident.created_at,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch incident details',
            }
        }
    },
}

/**
 * Tool 4: Search Incidents
 * Search incidents by student name, teacher name, description, or class
 */
export const searchIncidents = {
    name: 'searchIncidents',
    description: 'Search incidents by student name, teacher name, description text, or class name. Use this to find specific incidents.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            query: {
                type: 'string',
                description: 'Search query (searches student name, teacher name, description, class)',
            },
            limit: {
                type: 'number',
                description: 'Maximum results to return (default: 20)',
            },
        },
        required: ['school_id', 'query'],
    },

    async execute(args: { school_id: string; query: string; limit?: number }) {
        try {
            const response = await apiClient.get('/admin/incidents', {
                school_id: args.school_id,
            })

            const searchLower = args.query.toLowerCase()
            let incidents = (response.incidents || []).filter((inc: any) =>
                inc.student_name?.toLowerCase().includes(searchLower) ||
                inc.teacher_name?.toLowerCase().includes(searchLower) ||
                inc.description?.toLowerCase().includes(searchLower) ||
                inc.class_name?.toLowerCase().includes(searchLower)
            )

            const limit = args.limit || 20
            incidents = incidents.slice(0, limit)

            return {
                success: true,
                data: {
                    incidents: incidents.map((inc: any) => ({
                        id: inc.id,
                        student_name: inc.student_name,
                        teacher_name: inc.teacher_name,
                        type: inc.type,
                        severity: inc.severity,
                        description: inc.description.substring(0, 100) + (inc.description.length > 100 ? '...' : ''),
                        status: inc.resolution_status,
                        class_name: inc.class_name,
                        created_at: inc.created_at,
                    })),
                    count: incidents.length,
                    query: args.query,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to search incidents',
            }
        }
    },
}

// Helper function to calculate trends
function calculateTrends(incidents: any[]) {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const lastWeek = incidents.filter((inc: any) => {
        const date = new Date(inc.created_at)
        return date >= sevenDaysAgo && date <= now
    })

    const previousWeek = incidents.filter((inc: any) => {
        const date = new Date(inc.created_at)
        return date >= fourteenDaysAgo && date < sevenDaysAgo
    })

    const change = previousWeek.length > 0
        ? Math.round(((lastWeek.length - previousWeek.length) / previousWeek.length) * 100)
        : lastWeek.length > 0 ? 100 : 0

    return {
        lastWeekCount: lastWeek.length,
        previousWeekCount: previousWeek.length,
        changePercent: change,
        trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
    }
}

// Export all incident tools
export const incidentTools = [
    getIncidentsList,
    getIncidentStats,
    getIncidentDetails,
    searchIncidents,
]
