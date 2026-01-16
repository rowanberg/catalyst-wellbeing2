import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin credentials not configured')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function verifyAccessToken(request: NextRequest): { valid: boolean; payload?: any; error?: string } {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, error: 'Missing or invalid authorization header' }
    }
    const token = authHeader.substring(7)
    try {
        const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'dev-secret'
        const payload = jwt.verify(token, secret)
        return { valid: true, payload }
    } catch {
        return { valid: false, error: 'Invalid or expired access token' }
    }
}

function hasScope(payload: any, requiredScope: string): boolean {
    const scopes = payload.scopes || []
    return scopes.includes(requiredScope) || scopes.includes('*')
}

// GET /api/v1/announcements - List announcements
export async function GET(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'announcements.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: announcements.read'
        }, { status: 403 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const schoolId = searchParams.get('school_id')
        const gradeId = searchParams.get('grade_id')
        const classId = searchParams.get('class_id')
        const category = searchParams.get('category')
        const priority = searchParams.get('priority')
        const active = searchParams.get('active') !== 'false' // default true
        const limit = parseInt(searchParams.get('limit') || '50')

        const admin = getSupabaseAdmin()
        const now = new Date()

        let query = admin
            .from('announcements')
            .select(`
                id,
                title,
                content,
                summary,
                category,
                priority,
                target_type,
                attachments,
                publish_at,
                expires_at,
                is_pinned,
                requires_acknowledgment,
                created_at,
                author:teachers(id, full_name, avatar_url),
                school:schools(id, name)
            `)
            .eq('is_published', true)
            .order('is_pinned', { ascending: false })
            .order('publish_at', { ascending: false })
            .limit(limit)

        if (schoolId) {
            query = query.or(`school_id.eq.${schoolId},target_type.eq.all`)
        }
        if (gradeId) {
            query = query.or(`grade_id.eq.${gradeId},target_type.in.(all,school)`)
        }
        if (classId) {
            query = query.or(`class_id.eq.${classId},target_type.in.(all,school,grade)`)
        }
        if (category) {
            query = query.eq('category', category)
        }
        if (priority) {
            query = query.eq('priority', priority)
        }
        if (active) {
            query = query.or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
        }

        const { data: announcements, error } = await query

        if (error) throw error

        // Group by category
        const byCategory: { [key: string]: number } = {}
        announcements?.forEach(a => {
            byCategory[a.category] = (byCategory[a.category] || 0) + 1
        })

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/announcements',
                method: 'GET',
                response_status: 200
            })
        } catch { }

        return NextResponse.json({
            total: announcements?.length || 0,
            by_category: byCategory,
            pinned_count: announcements?.filter(a => a.is_pinned).length || 0,
            announcements: announcements?.map(a => {
                const author = Array.isArray(a.author) ? a.author[0] : a.author
                const school = Array.isArray(a.school) ? a.school[0] : a.school
                const publishDate = new Date(a.publish_at)
                const expiresAt = a.expires_at ? new Date(a.expires_at) : null

                return {
                    id: a.id,
                    title: a.title,
                    content: a.content,
                    summary: a.summary,
                    category: a.category,
                    priority: a.priority,
                    target_type: a.target_type,
                    attachments: a.attachments,
                    is_pinned: a.is_pinned,
                    requires_acknowledgment: a.requires_acknowledgment,
                    published_at: a.publish_at,
                    expires_at: a.expires_at,
                    is_expired: expiresAt ? expiresAt < now : false,
                    days_since_published: Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24)),
                    author: author ? {
                        id: author.id,
                        name: author.full_name,
                        avatar_url: author.avatar_url
                    } : null,
                    school: school ? { id: school.id, name: school.name } : null
                }
            }) || []
        })
    } catch (error: any) {
        console.error('Announcements API error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}

// POST /api/v1/announcements - Create announcement (for third-party apps with permission)
export async function POST(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'announcements.create')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: announcements.create'
        }, { status: 403 })
    }

    try {
        const body = await request.json()
        const {
            school_id, grade_id, class_id,
            title, content, summary, category, priority,
            publish_at, expires_at, is_pinned
        } = body

        if (!school_id || !title || !content) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'school_id, title, and content are required'
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        // Determine target type
        let target_type = 'school'
        if (class_id) target_type = 'class'
        else if (grade_id) target_type = 'grade'

        const { data: announcement, error } = await admin
            .from('announcements')
            .insert({
                school_id,
                grade_id,
                class_id,
                title,
                content,
                summary: summary || content.substring(0, 200),
                category: category || 'general',
                priority: priority || 'normal',
                target_type,
                publish_at: publish_at || new Date().toISOString(),
                expires_at,
                is_pinned: is_pinned || false,
                is_published: true,
                source: 'third_party_api',
                source_app_id: auth.payload.app_id
            })
            .select()
            .single()

        if (error) throw error

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/announcements',
                method: 'POST',
                response_status: 201
            })
        } catch { }

        return NextResponse.json({
            announcement_id: announcement.id,
            status: 'published',
            target_type,
            message: 'Announcement created successfully'
        }, { status: 201 })
    } catch (error: any) {
        console.error('Create announcement API error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}
