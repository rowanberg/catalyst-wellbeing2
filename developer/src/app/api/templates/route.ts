import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin credentials not configured')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function getAuthenticatedDeveloper() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_DEV_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        { cookies: { getAll() { return cookieStore.getAll() } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const admin = getSupabaseAdmin()
    const { data: account } = await admin
        .from('developer_accounts')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

    return account
}

// GET /api/templates - List notification templates
export async function GET(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const applicationId = searchParams.get('application_id')
        const category = searchParams.get('category')
        const language = searchParams.get('language') || 'en'

        const admin = getSupabaseAdmin()

        let query = admin
            .from('notification_templates')
            .select('*')
            .eq('developer_id', developer.id)
            .order('created_at', { ascending: false })

        if (applicationId) {
            query = query.eq('application_id', applicationId)
        }
        if (category) {
            query = query.eq('category', category)
        }

        const { data: templates, error } = await query

        if (error) throw error

        // Group by category
        const byCategory: { [key: string]: any[] } = {}
        templates?.forEach(t => {
            if (!byCategory[t.category]) {
                byCategory[t.category] = []
            }
            byCategory[t.category].push({
                id: t.id,
                name: t.name,
                description: t.description,
                title_template: t.title_template,
                body_template: t.body_template,
                variables: t.variables,
                default_type: t.default_type,
                default_priority: t.default_priority,
                language: t.language,
                is_active: t.is_active
            })
        })

        return NextResponse.json({
            total: templates?.length || 0,
            by_category: byCategory,
            templates: templates?.map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                category: t.category,
                title_template: t.title_template,
                body_template: t.body_template,
                variables: t.variables,
                default_type: t.default_type,
                default_priority: t.default_priority,
                language: t.language,
                is_active: t.is_active,
                usage_count: t.usage_count || 0,
                created_at: t.created_at,
                updated_at: t.updated_at
            })) || []
        })
    } catch (error: any) {
        console.error('Templates list error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/templates - Create notification template
export async function POST(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            application_id,
            name,
            description,
            category,
            title_template,
            body_template,
            variables,
            default_type,
            default_priority,
            language
        } = body

        if (!name || !title_template || !body_template) {
            return NextResponse.json({
                error: 'name, title_template, and body_template are required'
            }, { status: 400 })
        }

        // Extract variables from templates
        const extractVariables = (template: string): string[] => {
            const matches = template.match(/\{\{([^}]+)\}\}/g) || []
            return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim()))]
        }

        const detectedVariables = [
            ...extractVariables(title_template),
            ...extractVariables(body_template)
        ]

        const admin = getSupabaseAdmin()

        // Verify application if provided
        if (application_id) {
            const { data: app } = await admin
                .from('developer_applications')
                .select('id')
                .eq('id', application_id)
                .eq('developer_id', developer.id)
                .single()

            if (!app) {
                return NextResponse.json({ error: 'Application not found' }, { status: 404 })
            }
        }

        const { data: template, error } = await admin
            .from('notification_templates')
            .insert({
                developer_id: developer.id,
                application_id,
                name,
                description,
                category: category || 'general',
                title_template,
                body_template,
                variables: variables || detectedVariables,
                default_type: default_type || 'info',
                default_priority: default_priority || 'normal',
                language: language || 'en',
                is_active: true
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({
            template_id: template.id,
            name: template.name,
            detected_variables: detectedVariables,
            message: 'Template created successfully'
        }, { status: 201 })
    } catch (error: any) {
        console.error('Template create error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
