import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    createChatSession,
    getChatSessions,
    updateChatSession
} from '@/lib/chat-history'

// ============================================
// GET - List all chat sessions for current user (from Pinecone)
// ============================================
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's profile for school_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('school_id')
            .eq('user_id', user.id)
            .single()

        if (!profile?.school_id) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // Fetch sessions from Pinecone
        const sessions = await getChatSessions(user.id, profile.school_id)

        // Transform for frontend compatibility
        const transformedSessions = sessions.map(session => ({
            id: session.id,
            title: session.title,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            messageCount: session.messageCount
        }))

        return NextResponse.json({ sessions: transformedSessions })
    } catch (error) {
        console.error('Chat sessions GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// ============================================
// POST - Create a new chat session (in Pinecone)
// ============================================
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('school_id')
            .eq('user_id', user.id)
            .single()

        if (!profile?.school_id) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const body = await request.json()
        const { title = 'New Chat' } = body

        // Create session in Pinecone
        const sessionId = await createChatSession(user.id, profile.school_id, title)

        if (!sessionId) {
            return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
        }

        return NextResponse.json({
            session: {
                id: sessionId,
                title,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messageCount: 0
            }
        })
    } catch (error) {
        console.error('Chat sessions POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// ============================================
// PATCH - Update session title (in Pinecone)
// ============================================
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('school_id')
            .eq('user_id', user.id)
            .single()

        if (!profile?.school_id) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const body = await request.json()
        const { sessionId, title } = body

        if (!sessionId || !title) {
            return NextResponse.json({ error: 'Session ID and title required' }, { status: 400 })
        }

        const success = await updateChatSession(sessionId, profile.school_id, { title })

        if (!success) {
            return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Chat sessions PATCH error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
