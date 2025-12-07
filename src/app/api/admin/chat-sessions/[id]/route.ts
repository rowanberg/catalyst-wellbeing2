import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    getChatSessionById,
    getChatMessages,
    deleteChatSession,
    addChatMessages,
    updateChatSession
} from '@/lib/chat-history'

// ============================================
// GET - Get session with all messages (from Pinecone)
// ============================================
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: sessionId } = await params
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

        // Fetch session from Pinecone
        const session = await getChatSessionById(sessionId, profile.school_id)

        if (!session || session.userId !== user.id) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // Fetch messages from Pinecone
        const messages = await getChatMessages(sessionId, profile.school_id)

        // Transform messages for frontend
        const transformedMessages = messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            toolName: msg.toolName
        }))

        return NextResponse.json({
            session: {
                id: session.id,
                title: session.title,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                messages: transformedMessages
            }
        })
    } catch (error) {
        console.error('Chat session GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// ============================================
// DELETE - Delete a session and all messages (from Pinecone)
// ============================================
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: sessionId } = await params
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

        // Delete from Pinecone
        const success = await deleteChatSession(sessionId, profile.school_id)

        if (!success) {
            return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Chat session DELETE error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// ============================================
// POST - Add messages to session (in Pinecone)
// ============================================
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: sessionId } = await params
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

        // Verify session exists and belongs to user
        const session = await getChatSessionById(sessionId, profile.school_id)
        if (!session || session.userId !== user.id) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        const body = await request.json()
        const { messages } = body

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array required' }, { status: 400 })
        }

        // Add messages to Pinecone
        const success = await addChatMessages(sessionId, profile.school_id, messages)

        if (!success) {
            return NextResponse.json({ error: 'Failed to add messages' }, { status: 500 })
        }

        // Update session title if first user message
        const firstUserMsg = messages.find((m: any) => m.role === 'user')
        if (firstUserMsg && session.messageCount === 0) {
            const title = firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
            await updateChatSession(sessionId, profile.school_id, { title })
        }

        return NextResponse.json({
            success: true,
            messageCount: messages.length
        })
    } catch (error) {
        console.error('Chat session POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
