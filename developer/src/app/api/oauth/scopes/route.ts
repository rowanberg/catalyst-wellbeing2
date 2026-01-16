import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client
const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Supabase admin credentials not configured')
    }

    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

// Define all available scopes
const ALL_SCOPES = [
    // OpenID Connect
    { scope_name: 'openid', display_name: 'OpenID', description: 'Authenticate and identify the user', category: 'identity', risk_level: 'low' },

    // Profile scopes
    { scope_name: 'profile.read', display_name: 'Basic Profile', description: 'Read user profile information (name, avatar)', category: 'profile', risk_level: 'low' },
    { scope_name: 'email.read', display_name: 'Email Address', description: 'Read user email address', category: 'profile', risk_level: 'low' },
    { scope_name: 'phone.read', display_name: 'Phone Number', description: 'Read user phone number', category: 'profile', risk_level: 'medium' },

    // Student scopes
    { scope_name: 'student.profile.read', display_name: 'Student Profile', description: 'Read student profile and enrollment info', category: 'student', risk_level: 'medium' },
    { scope_name: 'student.attendance.read', display_name: 'Student Attendance', description: 'Read student attendance records', category: 'student', risk_level: 'medium' },
    { scope_name: 'student.academic.read', display_name: 'Academic Records', description: 'Read grades, marks, and academic performance', category: 'student', risk_level: 'high' },
    { scope_name: 'student.timetable.read', display_name: 'Timetable', description: 'Read student class schedule', category: 'student', risk_level: 'low' },
    { scope_name: 'student.assignments.read', display_name: 'Assignments', description: 'Read assignments and homework', category: 'student', risk_level: 'medium' },

    // Teacher scopes
    { scope_name: 'teacher.profile.read', display_name: 'Teacher Profile', description: 'Read teacher profile information', category: 'teacher', risk_level: 'medium' },
    { scope_name: 'teacher.classes.read', display_name: 'Teacher Classes', description: 'Read classes taught by teacher', category: 'teacher', risk_level: 'medium' },
    { scope_name: 'teacher.timetable.read', display_name: 'Teacher Timetable', description: 'Read teacher schedule', category: 'teacher', risk_level: 'low' },

    // Parent scopes
    { scope_name: 'parent.profile.read', display_name: 'Parent Profile', description: 'Read parent profile and linked children', category: 'parent', risk_level: 'medium' },
    { scope_name: 'parent.children.read', display_name: 'Children Info', description: 'Read information about linked children', category: 'parent', risk_level: 'high' },

    // School scopes
    { scope_name: 'school.structure.read', display_name: 'School Structure', description: 'Read school grades, sections, departments', category: 'school', risk_level: 'low' },
    { scope_name: 'school.calendar.read', display_name: 'School Calendar', description: 'Read academic calendar and events', category: 'school', risk_level: 'low' },
    { scope_name: 'school.announcements.read', display_name: 'Announcements', description: 'Read school announcements', category: 'school', risk_level: 'low' },

    // Wellbeing scopes (sensitive)
    { scope_name: 'wellbeing.mood.read', display_name: 'Mood Data', description: 'Read aggregated mood and wellness data', category: 'wellbeing', risk_level: 'high', requires_consent: true },
    { scope_name: 'wellbeing.behavior.read', display_name: 'Behavior Data', description: 'Read behavior trends and insights', category: 'wellbeing', risk_level: 'high', requires_consent: true },
    { scope_name: 'wellbeing.alerts.read', display_name: 'Wellness Alerts', description: 'Receive wellness concern alerts', category: 'wellbeing', risk_level: 'critical', requires_consent: true },

    // Notification scopes
    { scope_name: 'notifications.send', display_name: 'Send Notifications', description: 'Send notifications to users', category: 'notifications', risk_level: 'medium' },
    { scope_name: 'notifications.student', display_name: 'Student Notifications', description: 'Send notifications to students', category: 'notifications', risk_level: 'medium' },
    { scope_name: 'notifications.parent', display_name: 'Parent Notifications', description: 'Send notifications to parents', category: 'notifications', risk_level: 'high' },

    // AI/Insights scopes
    { scope_name: 'ai.insights.academic', display_name: 'Academic Insights', description: 'Access AI-generated academic insights', category: 'ai', risk_level: 'medium' },
    { scope_name: 'ai.recommendations.read', display_name: 'Learning Recommendations', description: 'Access personalized learning recommendations', category: 'ai', risk_level: 'medium' },
]

// GET /api/oauth/scopes - List all available scopes
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const risk_level = searchParams.get('risk_level')

    try {
        const admin = getSupabaseAdmin()

        // Try to get from database first
        let { data: scopes } = await admin
            .from('scope_definitions')
            .select('*')
            .order('category', { ascending: true })

        // If no scopes in DB, use defaults
        if (!scopes || scopes.length === 0) {
            scopes = ALL_SCOPES
        }

        // Filter by category if specified
        if (category) {
            scopes = scopes.filter((s: any) => s.category === category)
        }

        // Filter by risk level if specified
        if (risk_level) {
            scopes = scopes.filter((s: any) => s.risk_level === risk_level)
        }

        // Group by category for easier consumption
        const grouped = scopes.reduce((acc: any, scope: any) => {
            const cat = scope.category || 'other'
            if (!acc[cat]) acc[cat] = []
            acc[cat].push(scope)
            return acc
        }, {})

        return NextResponse.json({
            scopes,
            categories: Object.keys(grouped),
            grouped,
            total: scopes.length
        })
    } catch (error: any) {
        console.error('Scopes fetch error:', error)

        // Return default scopes even on error
        let scopes = ALL_SCOPES
        if (category) {
            scopes = scopes.filter(s => s.category === category)
        }
        if (risk_level) {
            scopes = scopes.filter(s => s.risk_level === risk_level)
        }

        return NextResponse.json({
            scopes,
            categories: [...new Set(scopes.map(s => s.category))],
            total: scopes.length
        })
    }
}
