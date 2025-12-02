import { z } from 'zod'
import { apiClient } from '../utils/api-client.js'

// ============================================
// Admin Tools: Comprehensive Dashboard Control (14 core tools - Phase 1)
// NOTE: API expects camelCase parameters (schoolId, not school_id) for query params
// ============================================

// ============================================================================
// SCHOOL STATISTICS & DASHBOARD TOOLS (3 tools)
// ============================================================================

export const getSchoolStatistics = {
    name: 'get_school_statistics',
    description: 'Get comprehensive school statistics including student/teacher/parent counts, active users, help requests, and wellbeing overview',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: { type: 'string', description: 'School UUID identifier' }
        },
        required: ['school_id']
    },

    async execute(args: { school_id: string }) {
        try {
            const response = await apiClient.get(`/admin/stats`, { school_id: args.school_id })

            return {
                success: true,
                data: {
                    total_students: response.stats?.totalStudents || 0,
                    total_teachers: response.stats?.totalTeachers || 0,
                    total_parents: response.stats?.totalParents || 0,
                    active_today: response.stats?.activeToday || 0,
                    help_requests: response.stats?.helpRequests || 0,
                    wellbeing: {
                        thriving: response.stats?.thriving || 0,
                        needs_support: response.stats?.needsSupport || 0,
                        at_risk: response.stats?.atRisk || 0
                    }
                },
                message: `Retrieved statistics for school ${args.school_id}`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch school statistics'
            }
        }
    }
}

export const getSchoolOverview = {
    name: 'get_school_overview',
    description: 'Get comprehensive school overview combining multiple data sources for complete insights',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: { type: 'string', description: 'School UUID identifier' }
        },
        required: ['school_id']
    },

    async execute(args: { school_id: string }) {
        try {
            const [stats, info] = await Promise.all([
                apiClient.get(`/admin/stats`, { school_id: args.school_id }),
                apiClient.get(`/admin/school-info`, { school_id: args.school_id }).catch(() => ({ school: null }))
            ])

            return {
                success: true,
                data: {
                    school_info: info.school,
                    statistics: stats.stats,
                    summary: `${stats.stats?.totalStudents || 0} students, ${stats.stats?.totalTeachers || 0} teachers, ${stats.stats?.activeToday || 0} active today`
                }
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch school overview'
            }
        }
    }
}

export const getActivityMonitor = {
    name: 'get_activity_monitor',
    description: 'Monitor recent school activity and user engagement in real-time',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: { type: 'string', description: 'School UUID' },
            time_range: { type: 'string', description: 'Time range: 1h, 6h, 24h, 7d', enum: ['1h', '6h', '24h', '7d'] }
        },
        required: ['school_id']
    },

    async execute(args: { school_id: string; time_range?: string }) {
        try {
            const response = await apiClient.get(`/admin/activity-monitor`, {
                school_id: args.school_id,
                range: args.time_range || '24h'
            })

            return {
                success: true,
                data: response.activity || {},
                message: `Activity data for last ${args.time_range || '24h'}`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch activity data'
            }
        }
    }
}

// ============================================================================
// USER MANAGEMENT TOOLS (6 tools)
// ============================================================================

export const searchUsers = {
    name: 'search_users',
    description: 'Search for users by role, name, or email with pagination support',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: { type: 'string', description: 'School UUID' },
            role: { type: 'string', description: 'Filter by role', enum: ['student', 'teacher', 'parent', 'admin', 'all'] },
            search: { type: 'string', description: 'Search query for name or email' },
            limit: { type: 'number', description: 'Results per page (default: 20)' },
            offset: { type: 'number', description: 'Pagination offset (default: 0)' }
        },
        required: ['school_id']
    },

    async execute(args: any) {
        try {
            // API expects camelCase parameter names
            const params: any = {
                schoolId: args.school_id,  // Convert to camelCase
                limit: args.limit || 20,
                offset: args.offset || 0
            }
            if (args.role && args.role !== 'all') params.role = args.role
            if (args.search) params.search = args.search

            const response = await apiClient.get(`/admin/users`, params)

            return {
                success: true,
                data: {
                    users: response.users || [],
                    pagination: response.pagination || {}
                },
                message: `Found ${response.users?.length || 0} users`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to search users'
            }
        }
    }
}

export const createUser = {
    name: 'create_user',
    description: 'Create a new user account (student, teacher, parent, or admin)',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: { type: 'string', description: 'School UUID' },
            email: { type: 'string', description: 'User email address' },
            password: { type: 'string', description: 'User password (min 8 characters)' },
            first_name: { type: 'string', description: 'First name' },
            last_name: { type: 'string', description: 'Last name' },
            role: { type: 'string', description: 'User role', enum: ['student', 'teacher', 'parent', 'admin'] }
        },
        required: ['school_id', 'email', 'password', 'first_name', 'last_name', 'role']
    },

    async execute(args: any) {
        try {
            const response = await apiClient.post('/admin/users', {
                schoolId: args.school_id,
                email: args.email,
                password: args.password,
                firstName: args.first_name,
                lastName: args.last_name,
                role: args.role
            })

            return {
                success: true,
                data: response,
                message: `Created ${args.role} account for ${args.first_name} ${args.last_name}`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to create user'
            }
        }
    }
}

export const updateUser = {
    name: 'update_user',
    description: 'Update user profile information',

    inputSchema: {
        type: 'object',
        properties: {
            user_id: { type: 'string', description: 'User UUID to update' },
            first_name: { type: 'string', description: 'Updated first name' },
            last_name: { type: 'string', description: 'Updated last name' },
            role: { type: 'string', description: 'Updated role', enum: ['student', 'teacher', 'parent', 'admin'] },
            email: { type: 'string', description: 'Updated email' }
        },
        required: ['user_id']
    },

    async execute(args: any) {
        try {
            const updates: any = {}
            if (args.first_name) updates.first_name = args.first_name
            if (args.last_name) updates.last_name = args.last_name
            if (args.role) updates.role = args.role
            if (args.email) updates.email = args.email

            const response = await apiClient.patch(`/admin/users/${args.user_id}`, updates)

            return {
                success: true,
                data: response.user,
                message: `Updated user ${args.user_id}`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to update user'
            }
        }
    }
}

export const deleteUser = {
    name: 'delete_user',
    description: 'Delete a user account permanently (requires confirmation)',

    inputSchema: {
        type: 'object',
        properties: {
            user_id: { type: 'string', description: 'User UUID to delete' },
            confirm: { type: 'boolean', description: 'Confirmation flag (must be true)' }
        },
        required: ['user_id', 'confirm']
    },

    async execute(args: { user_id: string; confirm: boolean }) {
        if (!args.confirm) {
            return {
                success: false,
                error: 'Deletion not confirmed. Set confirm=true to proceed.'
            }
        }

        try {
            await apiClient.delete(`/admin/users/${args.user_id}`)

            return {
                success: true,
                data: { deleted_user_id: args.user_id },
                message: `Successfully deleted user ${args.user_id}`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to delete user'
            }
        }
    }
}

export const bulkCreateUsers = {
    name: 'bulk_create_users',
    description: 'Create multiple users at once for efficient onboarding',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: { type: 'string', description: 'School UUID' },
            users: {
                type: 'array',
                description: 'Array of user objects to create',
                items: {
                    type: 'object',
                    properties: {
                        email: { type: 'string' },
                        password: { type: 'string' },
                        first_name: { type: 'string' },
                        last_name: { type: 'string' },
                        role: { type: 'string', enum: ['student', 'teacher', 'parent', 'admin'] }
                    },
                    required: ['email', 'password', 'first_name', 'last_name', 'role']
                }
            }
        },
        required: ['school_id', 'users']
    },

    async execute(args: { school_id: string; users: any[] }) {
        try {
            const results = await Promise.allSettled(
                args.users.map(user =>
                    apiClient.post('/admin/users', {
                        schoolId: args.school_id,
                        ...user
                    })
                )
            )

            const successful = results.filter(r => r.status === 'fulfilled').length
            const failed = results.filter(r => r.status === 'rejected').length

            return {
                success: true,
                data: {
                    total: args.users.length,
                    successful,
                    failed,
                    details: results.map((r, i) => ({
                        email: args.users[i].email,
                        status: r.status,
                        error: r.status === 'rejected' ? (r as any).reason.message : null
                    }))
                },
                message: `Created ${successful}/${args.users.length} users successfully`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to bulk create users'
            }
        }
    }
}

export const exportUsers = {
    name: 'export_users',
    description: 'Export user list with all details for reporting or backup',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: { type: 'string', description: 'School UUID' },
            role: { type: 'string', description: 'Filter by role', enum: ['student', 'teacher', 'parent', 'admin', 'all'] },
            format: { type: 'string', description: 'Export format', enum: ['json', 'csv'] }
        },
        required: ['school_id']
    },

    async execute(args: { school_id: string; role?: string; format?: string }) {
        try {
            const params: any = {
                schoolId: args.school_id,
                limit: 1000
            }
            if (args.role && args.role !== 'all') params.role = args.role

            const response = await apiClient.get(`/admin/users`, params)

            return {
                success: true,
                data: {
                    users: response.users || [],
                    total: response.users?.length || 0,
                    format: args.format || 'json',
                    exported_at: new Date().toISOString()
                },
                message: `Exported ${response.users?.length || 0} users`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to export users'
            }
        }
    }
}

// ============================================================================
// WELLBEING MANAGEMENT TOOLS (5 tools)
// ============================================================================

export const getWellbeingSeverity = {
    name: 'get_wellbeing_severity',
    description: 'Get comprehensive wellbeing severity analytics with risk levels, scores, and intervention recommendations',

    inputSchema: {
        type: 'object',
        properties: {
            period_type: { type: 'string', description: 'Analysis period', enum: ['daily', 'weekly', 'monthly'] },
            risk_level: { type: 'string', description: 'Filter by risk level', enum: ['all', 'minimal', 'low', 'moderate', 'high', 'critical'] },
            sort_by: { type: 'string', description: 'Sort field', enum: ['risk_score', 'overall_wellbeing_score', 'student_name'] },
            sort_order: { type: 'string', description: 'Sort order', enum: ['asc', 'desc'] },
            limit: { type: 'number', description: 'Maximum records to return' }
        }
    },

    async execute(args: any) {
        try {
            const params: any = {
                period_type: args.period_type || 'weekly',
                risk_level: args.risk_level || 'all',
                sort_by: args.sort_by || 'risk_score',
                sort_order: args.sort_order || 'desc',
                limit: args.limit || 50
            }

            const response = await apiClient.get(`/admin/wellbeing-severity`, params)

            if (!response.success) {
                return {
                    success: false,
                    error: 'Failed to fetch wellbeing severity data'
                }
            }

            return {
                success: true,
                data: {
                    analytics: response.analytics || [],
                    summary: response.summary || {},
                    metadata: response.metadata || {},
                    insights: {
                        high_risk_students: response.summary?.high_risk_count || 0,
                        interventions_needed: response.summary?.interventions_needed || 0,
                        improving_trend: response.summary?.improving_trend || 0,
                        declining_trend: response.summary?.declining_trend || 0
                    }
                },
                message: `Retrieved wellbeing data for ${response.analytics?.length || 0} students`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch wellbeing severity'
            }
        }
    }
}

export const getWellbeingAnalytics = {
    name: 'get_wellbeing_analytics',
    description: 'Get detailed wellbeing analytics with historical trends and patterns',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: { type: 'string', description: 'School UUID' },
            time_range: { type: 'string', description: 'Time range', enum: ['week', 'month', 'quarter', 'year'] }
        },
        required: ['school_id']
    },

    async execute(args: { school_id: string; time_range?: string }) {
        try {
            const response = await apiClient.get(`/admin/wellbeing-analytics`, {
                school_id: args.school_id,
                range: args.time_range || 'month'
            })

            return {
                success: true,
                data: response.analytics || {},
                message: 'Wellbeing analytics retrieved successfully'
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch wellbeing analytics'
            }
        }
    }
}

export const getWellbeingInsights = {
    name: 'get_wellbeing_insights',
    description: 'Get AI-generated insights and patterns from wellbeing data',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: { type: 'string', description: 'School UUID' }
        },
        required: ['school_id']
    },

    async execute(args: { school_id: string }) {
        try {
            const response = await apiClient.get(`/admin/wellbeing-insights`, { school_id: args.school_id })

            return {
                success: true,
                data: response.insights || {},
                message: 'Wellbeing insights retrieved successfully'
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch wellbeing insights'
            }
        }
    }
}

export const getStudentRiskProfile = {
    name: 'get_student_risk_profile',
    description: 'Get detailed risk profile for a specific student with all wellbeing dimensions',

    inputSchema: {
        type: 'object',
        properties: {
            student_id: { type: 'string', description: 'Student UUID' }
        },
        required: ['student_id']
    },

    async execute(args: { student_id: string }) {
        try {
            const response = await apiClient.get(`/admin/wellbeing-severity`, { limit: 1 })
            const studentData = response.analytics?.find((a: any) => a.student_id === args.student_id)

            if (!studentData) {
                return {
                    success: false,
                    error: 'Student risk profile not found'
                }
            }

            return {
                success: true,
                data: {
                    student: {
                        id: studentData.student_id,
                        name: studentData.student_name,
                        grade: studentData.student_grade,
                        class: studentData.student_class
                    },
                    risk_profile: {
                        risk_level: studentData.risk_level,
                        risk_score: studentData.risk_score,
                        risk_factors: studentData.risk_factors || [],
                        protective_factors: studentData.protective_factors || []
                    },
                    wellbeing_scores: {
                        overall: studentData.overall_wellbeing_score,
                        emotional: studentData.emotional_wellbeing_score,
                        academic: studentData.academic_wellbeing_score,
                        engagement: studentData.engagement_wellbeing_score,
                        social: studentData.social_wellbeing_score,
                        behavioral: studentData.behavioral_wellbeing_score
                    },
                    intervention: {
                        recommended: studentData.intervention_recommended,
                        type: studentData.intervention_type,
                        priority: studentData.intervention_priority,
                        actions: studentData.recommended_actions || []
                    }
                },
                message: `Retrieved risk profile for ${studentData.student_name}`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch student risk profile'
            }
        }
    }
}

export const bulkUpdateInterventions = {
    name: 'bulk_update_interventions',
    description: 'Update intervention status for multiple students at once',

    inputSchema: {
        type: 'object',
        properties: {
            interventions: {
                type: 'array',
                description: 'Array of intervention updates',
                items: {
                    type: 'object',
                    properties: {
                        student_id: { type: 'string' },
                        intervention_type: { type: 'string' },
                        status: { type: 'string', enum: ['planned', 'in_progress', 'completed', 'cancelled'] },
                        notes: { type: 'string' }
                    },
                    required: ['student_id', 'intervention_type', 'status']
                }
            }
        },
        required: ['interventions']
    },

    async execute(args: { interventions: any[] }) {
        try {
            const results = await Promise.allSettled(
                args.interventions.map(intervention =>
                    apiClient.post('/admin/interventions', intervention)
                )
            )

            const successful = results.filter(r => r.status === 'fulfilled').length
            const failed = results.filter(r => r.status === 'rejected').length

            return {
                success: true,
                data: {
                    total: args.interventions.length,
                    successful,
                    failed
                },
                message: `Updated ${successful}/${args.interventions.length} interventions successfully`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to bulk update interventions'
            }
        }
    }
}

// Export all admin tools
export const adminTools = [
    // School Statistics & Dashboard (3 tools)
    getSchoolStatistics,
    getSchoolOverview,
    getActivityMonitor,

    // User Management (6 tools)
    searchUsers,
    createUser,
    updateUser,
    deleteUser,
    bulkCreateUsers,
    exportUsers,

    // Wellbeing Management (5 tools)
    getWellbeingSeverity,
    getWellbeingAnalytics,
    getWellbeingInsights,
    getStudentRiskProfile,
    bulkUpdateInterventions
]

console.error('✅ Loaded 14 core admin tools')
