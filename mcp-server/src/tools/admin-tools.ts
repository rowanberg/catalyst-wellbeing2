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
    description: 'Get FULL wellbeing severity analytics with ALL risk levels, scores, intervention recommendations, and student details - exactly as shown on the wellbeing-severity admin page',

    inputSchema: {
        type: 'object',
        properties: {
            period_type: { type: 'string', description: 'Analysis period', enum: ['daily', 'weekly', 'monthly'] },
            risk_level: { type: 'string', description: 'Filter by risk level', enum: ['all', 'minimal', 'low', 'moderate', 'high', 'critical'] },
            sort_by: { type: 'string', description: 'Sort field', enum: ['risk_score', 'overall_wellbeing_score', 'student_name'] },
            sort_order: { type: 'string', description: 'Sort order', enum: ['asc', 'desc'] },
            limit: { type: 'number', description: 'Maximum records to return (default: 100 for full access)' }
        }
    },

    async execute(args: any) {
        try {
            const params: any = {
                period_type: args.period_type || 'weekly',
                risk_level: args.risk_level || 'all',
                sort_by: args.sort_by || 'risk_score',
                sort_order: args.sort_order || 'desc',
                limit: args.limit || 100,
                school_id: args.school_id // Required for service role authentication
            }

            const response = await apiClient.get(`/admin/wellbeing-severity`, params)

            if (!response.success) {
                return {
                    success: false,
                    error: 'Failed to fetch wellbeing severity data'
                }
            }

            // Return COMPLETE data exactly as the page receives it
            return {
                success: true,
                data: {
                    // Full analytics array with ALL student details
                    students: (response.analytics || []).map((student: any) => ({
                        // Student identification
                        id: student.id,
                        student_id: student.student_id,
                        student_name: student.student_name,
                        student_grade: student.student_grade,
                        student_class: student.student_class,
                        student_avatar: student.student_avatar,

                        // Risk assessment
                        risk_level: student.risk_level,
                        risk_score: student.risk_score,
                        risk_trend: student.risk_trend,
                        risk_factors: student.risk_factors || [],
                        risk_factor_count: student.risk_factor_count || student.risk_factors_count || 0,
                        protective_factors: student.protective_factors || [],
                        protective_factor_count: student.protective_factor_count || student.protective_factors_count || 0,

                        // All wellbeing dimension scores
                        overall_wellbeing_score: student.overall_wellbeing_score,
                        emotional_wellbeing_score: student.emotional_wellbeing_score,
                        academic_wellbeing_score: student.academic_wellbeing_score,
                        engagement_wellbeing_score: student.engagement_wellbeing_score,
                        social_wellbeing_score: student.social_wellbeing_score,
                        behavioral_wellbeing_score: student.behavioral_wellbeing_score,

                        // Intervention details
                        intervention_recommended: student.intervention_recommended,
                        intervention_type: student.intervention_type,
                        intervention_priority: student.intervention_priority,
                        recommended_actions: student.recommended_actions || [],

                        // Early warning system
                        early_warning_flags: student.early_warning_flags || [],
                        warning_flag_count: student.warning_flag_count || 0,

                        // Predictions
                        predicted_next_score: student.predicted_next_score,
                        predicted_risk_level: student.predicted_risk_level,
                        confidence_level: student.confidence_level,

                        // Trends
                        overall_score_trend: student.overall_score_trend,
                        score_change_from_previous: student.score_change_from_previous,

                        // Percentiles
                        school_percentile: student.school_percentile,
                        grade_percentile: student.grade_percentile,

                        // Activity metrics
                        mood_score_avg: student.mood_score_avg,
                        gpa: student.gpa,
                        attendance_rate: student.attendance_rate,
                        quest_completion_rate: student.quest_completion_rate,
                        xp_earned: student.xp_earned,
                        incident_count: student.incident_count,
                        help_requests_count: student.help_requests_count,
                        urgent_help_requests_count: student.urgent_help_requests_count,

                        // Data quality
                        data_quality_score: student.data_quality_score,
                        data_completeness_percentage: student.data_completeness_percentage,

                        // Timestamps
                        analysis_date: student.analysis_date,
                        period_type: student.period_type,
                        created_at: student.created_at,
                        updated_at: student.updated_at
                    })),

                    // Complete summary statistics
                    summary: {
                        total_students: response.summary?.total || 0,
                        by_risk_level: response.summary?.by_risk_level || {},
                        by_intervention_priority: response.summary?.by_intervention_priority || {},
                        average_scores: response.summary?.average_scores || {},
                        interventions_needed: response.summary?.interventions_needed || 0,
                        high_risk_count: response.summary?.high_risk_count || 0,
                        improving_trend: response.summary?.improving_trend || 0,
                        declining_trend: response.summary?.declining_trend || 0
                    },

                    // Metadata
                    metadata: {
                        period_type: response.metadata?.period_type || params.period_type,
                        risk_level_filter: response.metadata?.risk_level_filter || params.risk_level,
                        sort_by: response.metadata?.sort_by || params.sort_by,
                        sort_order: response.metadata?.sort_order || params.sort_order,
                        limit: response.metadata?.limit || params.limit,
                        last_updated: response.metadata?.last_updated
                    }
                },
                message: `Retrieved FULL wellbeing data for ${response.analytics?.length || 0} students including all risk factors, scores, and interventions`
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
    description: 'Get detailed risk profile for a specific student with all wellbeing dimensions, risk factors, and intervention recommendations',

    inputSchema: {
        type: 'object',
        properties: {
            student_id: { type: 'string', description: 'Student UUID' },
            student_name: { type: 'string', description: 'Student name to search (alternative to ID)' }
        }
    },

    async execute(args: { student_id?: string; student_name?: string; school_id?: string }) {
        try {
            // Fetch with high limit to find the specific student
            const response = await apiClient.get(`/admin/wellbeing-severity`, {
                limit: 500,
                school_id: args.school_id // Required for service role authentication
            })

            // Find student by ID or name
            let studentData = null
            if (args.student_id) {
                studentData = response.analytics?.find((a: any) => a.student_id === args.student_id)
            } else if (args.student_name) {
                const searchName = args.student_name.toLowerCase()
                studentData = response.analytics?.find((a: any) =>
                    a.student_name?.toLowerCase().includes(searchName)
                )
            }

            if (!studentData) {
                return {
                    success: false,
                    error: args.student_id
                        ? `Student with ID ${args.student_id} not found in wellbeing data`
                        : `Student "${args.student_name}" not found in wellbeing data`
                }
            }

            return {
                success: true,
                data: {
                    student: {
                        id: studentData.student_id,
                        name: studentData.student_name,
                        grade: studentData.student_grade,
                        class: studentData.student_class,
                        avatar: studentData.student_avatar
                    },
                    risk_profile: {
                        risk_level: studentData.risk_level,
                        risk_score: studentData.risk_score,
                        risk_trend: studentData.risk_trend,
                        risk_factors: studentData.risk_factors || [],
                        protective_factors: studentData.protective_factors || [],
                        early_warning_flags: studentData.early_warning_flags || [],
                        predicted_risk_level: studentData.predicted_risk_level
                    },
                    wellbeing_scores: {
                        overall: studentData.overall_wellbeing_score,
                        emotional: studentData.emotional_wellbeing_score,
                        academic: studentData.academic_wellbeing_score,
                        engagement: studentData.engagement_wellbeing_score,
                        social: studentData.social_wellbeing_score,
                        behavioral: studentData.behavioral_wellbeing_score
                    },
                    trends: {
                        overall_score_trend: studentData.overall_score_trend,
                        score_change: studentData.score_change_from_previous,
                        predicted_next_score: studentData.predicted_next_score,
                        confidence_level: studentData.confidence_level
                    },
                    intervention: {
                        recommended: studentData.intervention_recommended,
                        type: studentData.intervention_type,
                        priority: studentData.intervention_priority,
                        actions: studentData.recommended_actions || []
                    },
                    activity_metrics: {
                        attendance_rate: studentData.attendance_rate,
                        gpa: studentData.gpa,
                        mood_score_avg: studentData.mood_score_avg,
                        incident_count: studentData.incident_count,
                        help_requests_count: studentData.help_requests_count,
                        urgent_help_requests: studentData.urgent_help_requests_count
                    },
                    percentiles: {
                        school: studentData.school_percentile,
                        grade: studentData.grade_percentile
                    },
                    analysis_date: studentData.analysis_date
                },
                message: `Retrieved comprehensive risk profile for ${studentData.student_name}`
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
