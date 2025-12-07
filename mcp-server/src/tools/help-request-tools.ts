import { z } from 'zod'
import { SchoolIdSchema } from '../utils/schemas.js'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Initialize Supabase client with service role for direct DB access
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// ============================================
// Tool Definitions: Help Requests (4 tools)
// ============================================

/**
 * Tool 1: Get Help Requests List
 * Retrieves all help requests with optional filtering
 */
export const getHelpRequestsList = {
    name: 'getHelpRequestsList',
    description: 'Get list of student help requests with optional filtering by status (pending, in_progress, resolved) and urgency (high, medium, low). Returns student info, message content, timestamps, and resolution status.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            status: {
                type: 'string',
                description: 'Filter by status',
                enum: ['all', 'pending', 'in_progress', 'resolved'],
            },
            urgency: {
                type: 'string',
                description: 'Filter by urgency level',
                enum: ['all', 'high', 'medium', 'low'],
            },
            limit: {
                type: 'number',
                description: 'Maximum number of requests to return (default: 50)',
            },
        },
        required: ['school_id'],
    },

    async execute(args: {
        school_id: string
        status?: string
        urgency?: string
        limit?: number
    }) {
        try {
            // Build query
            let query = supabase
                .from('help_requests')
                .select(`
                    id,
                    message,
                    urgency,
                    status,
                    created_at,
                    updated_at,
                    student_id,
                    resolved_at,
                    resolver,
                    notes
                `)
                .eq('school_id', args.school_id)
                .order('created_at', { ascending: false })

            // Apply status filter
            if (args.status && args.status !== 'all') {
                query = query.eq('status', args.status)
            }

            // Apply urgency filter
            if (args.urgency && args.urgency !== 'all') {
                query = query.eq('urgency', args.urgency)
            }

            // Apply limit
            const limit = args.limit || 50
            query = query.limit(limit)

            const { data: helpRequests, error } = await query

            if (error) {
                return {
                    success: false,
                    error: error.message || 'Failed to fetch help requests',
                }
            }

            // Get student profiles for the requests
            const studentIds = [...new Set(helpRequests?.map(r => r.student_id).filter(Boolean))]
            let studentMap: Record<string, any> = {}

            if (studentIds.length > 0) {
                const { data: students } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, grade_level, class_name')
                    .in('id', studentIds)

                if (students) {
                    studentMap = Object.fromEntries(students.map(s => [s.id, s]))
                }
            }

            return {
                success: true,
                data: {
                    helpRequests: (helpRequests || []).map((req: any) => {
                        const student = studentMap[req.student_id]
                        const studentName = student
                            ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
                            : 'Unknown Student'
                        return {
                            id: req.id,
                            student_name: studentName || 'Unknown Student',
                            student_class: student?.class_name || 'N/A',
                            student_grade: student?.grade_level || 'N/A',
                            message: (req.message && typeof req.message === 'string')
                                ? req.message.substring(0, 150).replace(/\s+/g, ' ').trim()
                                : 'No message',
                            urgency: req.urgency || 'medium',
                            status: req.status || 'pending',
                            created_at: req.created_at,
                            resolved_at: req.resolved_at,
                            resolver: req.resolver,
                            notes: req.notes ? req.notes.substring(0, 100) : null,
                        }
                    }),
                    count: helpRequests?.length || 0,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch help requests',
            }
        }
    },
}

/**
 * Tool 2: Get Help Request Statistics
 * Retrieves summary statistics for help requests
 */
export const getHelpRequestStats = {
    name: 'getHelpRequestStats',
    description: 'Get help request statistics including counts by status (pending, in_progress, resolved) and urgency levels (high, medium, low), plus response time metrics',

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
            const { data: helpRequests, error } = await supabase
                .from('help_requests')
                .select('id, status, urgency, created_at, resolved_at')
                .eq('school_id', validated.school_id)

            if (error) {
                return {
                    success: false,
                    error: error.message || 'Failed to fetch help request stats',
                }
            }

            const requests = helpRequests || []

            // Calculate statistics
            const stats = {
                total: requests.length,
                byStatus: {
                    pending: requests.filter((r: any) => r.status === 'pending').length,
                    in_progress: requests.filter((r: any) => r.status === 'in_progress').length,
                    resolved: requests.filter((r: any) => r.status === 'resolved').length,
                },
                byUrgency: {
                    high: requests.filter((r: any) => r.urgency === 'high').length,
                    medium: requests.filter((r: any) => r.urgency === 'medium').length,
                    low: requests.filter((r: any) => r.urgency === 'low').length,
                },
                // Recent trends (last 7 days)
                recentTrends: calculateHelpRequestTrends(requests),
            }

            return {
                success: true,
                data: stats,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch help request statistics',
            }
        }
    },
}

/**
 * Tool 3: Get Help Request Details
 * Retrieves full details for a specific help request
 */
export const getHelpRequestDetails = {
    name: 'getHelpRequestDetails',
    description: 'Get detailed information about a specific help request by ID, including full message content, student info, resolution history, and notes',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            request_id: {
                type: 'string',
                description: 'Help request UUID to retrieve',
            },
        },
        required: ['school_id', 'request_id'],
    },

    async execute(args: { school_id: string; request_id: string }) {
        try {
            const { data: helpRequest, error } = await supabase
                .from('help_requests')
                .select('*')
                .eq('id', args.request_id)
                .eq('school_id', args.school_id)
                .single()

            if (error || !helpRequest) {
                return {
                    success: false,
                    error: 'Help request not found',
                }
            }

            // Get student profile
            let studentInfo = null
            if (helpRequest.student_id) {
                const { data: student } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name, grade_level, class_name, email')
                    .eq('id', helpRequest.student_id)
                    .single()

                if (student) {
                    studentInfo = {
                        name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
                        grade: student.grade_level,
                        class: student.class_name,
                        email: student.email,
                    }
                }
            }

            return {
                success: true,
                data: {
                    id: helpRequest.id,
                    message: helpRequest.message,
                    urgency: helpRequest.urgency,
                    status: helpRequest.status,
                    student: studentInfo || { name: 'Unknown Student' },
                    created_at: helpRequest.created_at,
                    updated_at: helpRequest.updated_at,
                    resolved_at: helpRequest.resolved_at,
                    resolver: helpRequest.resolver,
                    notes: helpRequest.notes,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch help request details',
            }
        }
    },
}

/**
 * Tool 4: Search Help Requests
 * Search help requests by student name or message content
 */
export const searchHelpRequests = {
    name: 'searchHelpRequests',
    description: 'Search help requests by student name, message content, or notes. Use this to find specific help requests.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            query: {
                type: 'string',
                description: 'Search query (searches message content and notes)',
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
            // Search in message and notes fields
            const { data: helpRequests, error } = await supabase
                .from('help_requests')
                .select(`
                    id,
                    message,
                    urgency,
                    status,
                    created_at,
                    student_id,
                    notes
                `)
                .eq('school_id', args.school_id)
                .or(`message.ilike.%${args.query}%,notes.ilike.%${args.query}%`)
                .order('created_at', { ascending: false })
                .limit(args.limit || 20)

            if (error) {
                return {
                    success: false,
                    error: error.message || 'Failed to search help requests',
                }
            }

            // Get student profiles
            const studentIds = [...new Set(helpRequests?.map(r => r.student_id).filter(Boolean))]
            let studentMap: Record<string, any> = {}

            if (studentIds.length > 0) {
                const { data: students } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .in('id', studentIds)

                if (students) {
                    studentMap = Object.fromEntries(students.map(s => [s.id, s]))
                }
            }

            // Also search by student name
            const searchLower = args.query.toLowerCase()
            const filteredRequests = (helpRequests || []).filter((req: any) => {
                const student = studentMap[req.student_id]
                const studentName = student
                    ? `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase()
                    : ''
                return req.message?.toLowerCase().includes(searchLower) ||
                    req.notes?.toLowerCase().includes(searchLower) ||
                    studentName.includes(searchLower)
            })

            return {
                success: true,
                data: {
                    helpRequests: filteredRequests.map((req: any) => {
                        const student = studentMap[req.student_id]
                        return {
                            id: req.id,
                            student_name: student
                                ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
                                : 'Unknown Student',
                            message: (req.message && typeof req.message === 'string')
                                ? req.message.substring(0, 100).replace(/\s+/g, ' ').trim()
                                : 'No message',
                            urgency: req.urgency,
                            status: req.status,
                            created_at: req.created_at,
                        }
                    }),
                    count: filteredRequests.length,
                    query: args.query,
                },
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to search help requests',
            }
        }
    },
}

// Helper function to calculate trends
function calculateHelpRequestTrends(requests: any[]) {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const lastWeek = requests.filter((req: any) => {
        const date = new Date(req.created_at)
        return date >= sevenDaysAgo && date <= now
    })

    const previousWeek = requests.filter((req: any) => {
        const date = new Date(req.created_at)
        return date >= fourteenDaysAgo && date < sevenDaysAgo
    })

    const change = previousWeek.length > 0
        ? Math.round(((lastWeek.length - previousWeek.length) / previousWeek.length) * 100)
        : lastWeek.length > 0 ? 100 : 0

    // Calculate average response time for resolved requests
    const resolvedLastWeek = lastWeek.filter((r: any) => r.status === 'resolved' && r.resolved_at)
    let avgResponseTime = 0
    if (resolvedLastWeek.length > 0) {
        const totalTime = resolvedLastWeek.reduce((sum: number, r: any) => {
            const created = new Date(r.created_at).getTime()
            const resolved = new Date(r.resolved_at).getTime()
            return sum + (resolved - created)
        }, 0)
        avgResponseTime = Math.round(totalTime / resolvedLastWeek.length / (1000 * 60 * 60)) // hours
    }

    return {
        lastWeekCount: lastWeek.length,
        previousWeekCount: previousWeek.length,
        changePercent: change,
        trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
        avgResponseTimeHours: avgResponseTime,
    }
}

// Export all help request tools
export const helpRequestTools = [
    getHelpRequestsList,
    getHelpRequestStats,
    getHelpRequestDetails,
    searchHelpRequests,
]
