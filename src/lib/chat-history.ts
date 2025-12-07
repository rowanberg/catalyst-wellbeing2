/**
 * Pinecone-based Chat History Storage
 * 
 * Uses Pinecone for efficient chat history storage instead of Supabase.
 * Stores session metadata and messages in Pinecone with timestamp-based ordering.
 * 
 * Architecture:
 * - Namespace: 'chat-history-{schoolId}' for school isolation
 * - Session vectors: Store session metadata with dummy embeddings (for listing)
 * - Message vectors: Store individual messages with embeddings (for semantic search)
 */

import { getPinecone, PINECONE_INDEX_NAME, isPineconeConfigured } from './pinecone'
import { getEmbeddings } from './memory'

// ============================================
// TYPES
// ============================================

export interface ChatSession {
    id: string
    userId: string
    schoolId: string
    title: string
    createdAt: string
    updatedAt: string
    messageCount: number
}

export interface ChatMessage {
    id: string
    sessionId: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    toolName?: string
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getChatHistoryNamespace = (schoolId: string) => `chat-history-${schoolId}`

// Generate a simple hash-based vector for session metadata (not for semantic search)
const getSessionVector = (): number[] => {
    // Use a fixed vector for session records (1024 dimensions to match index)
    // This allows us to use Pinecone's metadata filtering without semantic search
    return new Array(1024).fill(0.1)
}

// ============================================
// SESSION OPERATIONS
// ============================================

/**
 * Create a new chat session
 */
export async function createChatSession(
    userId: string,
    schoolId: string,
    title: string
): Promise<string | null> {
    if (!isPineconeConfigured()) {
        console.log('📝 Pinecone not configured, skipping session creation')
        return null
    }

    try {
        const pinecone = getPinecone()
        const index = pinecone.Index(PINECONE_INDEX_NAME)
        const namespace = getChatHistoryNamespace(schoolId)

        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()

        await index.namespace(namespace).upsert([{
            id: sessionId,
            values: getSessionVector(),
            metadata: {
                type: 'session',
                userId,
                schoolId,
                title,
                createdAt: now,
                updatedAt: now,
                messageCount: 0,
                // Store timestamp as number for sorting
                createdAtTs: Date.now(),
                updatedAtTs: Date.now()
            }
        }])

        console.log(`✅ Chat session created: ${sessionId}`)
        return sessionId
    } catch (error) {
        console.error('❌ Failed to create chat session:', error)
        return null
    }
}

/**
 * Get all chat sessions for a user (ordered by most recent)
 */
export async function getChatSessions(
    userId: string,
    schoolId: string,
    limit: number = 50
): Promise<ChatSession[]> {
    if (!isPineconeConfigured()) {
        return []
    }

    try {
        const pinecone = getPinecone()
        const index = pinecone.Index(PINECONE_INDEX_NAME)
        const namespace = getChatHistoryNamespace(schoolId)

        // Query for session records
        const response = await index.namespace(namespace).query({
            vector: getSessionVector(),
            topK: limit,
            filter: {
                type: { $eq: 'session' },
                userId: { $eq: userId }
            },
            includeMetadata: true
        })

        // Transform and sort by updatedAt (descending)
        const sessions = response.matches
            .map(match => ({
                id: match.id,
                userId: match.metadata?.userId as string,
                schoolId: match.metadata?.schoolId as string,
                title: match.metadata?.title as string || 'Untitled',
                createdAt: match.metadata?.createdAt as string,
                updatedAt: match.metadata?.updatedAt as string,
                messageCount: (match.metadata?.messageCount as number) || 0
            }))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

        console.log(`📋 Retrieved ${sessions.length} chat sessions for user ${userId}`)
        return sessions
    } catch (error) {
        console.error('❌ Failed to get chat sessions:', error)
        return []
    }
}

/**
 * Update session title and timestamp
 */
export async function updateChatSession(
    sessionId: string,
    schoolId: string,
    updates: { title?: string; messageCount?: number }
): Promise<boolean> {
    if (!isPineconeConfigured()) {
        return false
    }

    try {
        const pinecone = getPinecone()
        const index = pinecone.Index(PINECONE_INDEX_NAME)
        const namespace = getChatHistoryNamespace(schoolId)

        // Fetch existing session
        const existing = await index.namespace(namespace).fetch([sessionId])
        const sessionData = existing.records?.[sessionId]

        if (!sessionData) {
            console.error('Session not found:', sessionId)
            return false
        }

        // Update metadata
        const now = new Date().toISOString()
        const updatedMetadata = {
            ...sessionData.metadata,
            ...(updates.title && { title: updates.title }),
            ...(updates.messageCount !== undefined && { messageCount: updates.messageCount }),
            updatedAt: now,
            updatedAtTs: Date.now()
        }

        await index.namespace(namespace).upsert([{
            id: sessionId,
            values: getSessionVector(),
            metadata: updatedMetadata
        }])

        return true
    } catch (error) {
        console.error('❌ Failed to update chat session:', error)
        return false
    }
}

/**
 * Delete a chat session and all its messages
 */
export async function deleteChatSession(
    sessionId: string,
    schoolId: string
): Promise<boolean> {
    if (!isPineconeConfigured()) {
        return false
    }

    try {
        const pinecone = getPinecone()
        const index = pinecone.Index(PINECONE_INDEX_NAME)
        const namespace = getChatHistoryNamespace(schoolId)

        // Delete session and all its messages
        await index.namespace(namespace).deleteMany({
            filter: {
                $or: [
                    { id: { $eq: sessionId } },
                    { sessionId: { $eq: sessionId } }
                ]
            }
        })

        // Also try direct delete of session ID
        await index.namespace(namespace).deleteOne(sessionId)

        console.log(`🗑️ Deleted chat session: ${sessionId}`)
        return true
    } catch (error) {
        console.error('❌ Failed to delete chat session:', error)
        return false
    }
}

// ============================================
// MESSAGE OPERATIONS
// ============================================

/**
 * Add messages to a session
 */
export async function addChatMessages(
    sessionId: string,
    schoolId: string,
    messages: Omit<ChatMessage, 'id' | 'sessionId'>[]
): Promise<boolean> {
    if (!isPineconeConfigured() || messages.length === 0) {
        return false
    }

    try {
        const pinecone = getPinecone()
        const index = pinecone.Index(PINECONE_INDEX_NAME)
        const namespace = getChatHistoryNamespace(schoolId)

        const vectors = await Promise.all(messages.map(async (msg, idx) => {
            const embedding = await getEmbeddings(msg.content.substring(0, 1000)) // Limit for embedding
            const messageId = `msg-${sessionId}-${Date.now()}-${idx}`

            return {
                id: messageId,
                values: embedding,
                metadata: {
                    type: 'message',
                    sessionId,
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp,
                    timestampTs: new Date(msg.timestamp).getTime(),
                    toolName: msg.toolName || ''
                }
            }
        }))

        await index.namespace(namespace).upsert(vectors)

        // Update session message count
        const sessions = await getChatSessionById(sessionId, schoolId)
        if (sessions) {
            await updateChatSession(sessionId, schoolId, {
                messageCount: (sessions.messageCount || 0) + messages.length
            })
        }

        console.log(`✅ Added ${messages.length} messages to session ${sessionId}`)
        return true
    } catch (error) {
        console.error('❌ Failed to add chat messages:', error)
        return false
    }
}

/**
 * Get a single session by ID
 */
export async function getChatSessionById(
    sessionId: string,
    schoolId: string
): Promise<ChatSession | null> {
    if (!isPineconeConfigured()) {
        return null
    }

    try {
        const pinecone = getPinecone()
        const index = pinecone.Index(PINECONE_INDEX_NAME)
        const namespace = getChatHistoryNamespace(schoolId)

        const response = await index.namespace(namespace).fetch([sessionId])
        const sessionData = response.records?.[sessionId]

        if (!sessionData) {
            return null
        }

        return {
            id: sessionId,
            userId: sessionData.metadata?.userId as string,
            schoolId: sessionData.metadata?.schoolId as string,
            title: sessionData.metadata?.title as string || 'Untitled',
            createdAt: sessionData.metadata?.createdAt as string,
            updatedAt: sessionData.metadata?.updatedAt as string,
            messageCount: (sessionData.metadata?.messageCount as number) || 0
        }
    } catch (error) {
        console.error('❌ Failed to get chat session:', error)
        return null
    }
}

/**
 * Get all messages for a session (ordered by timestamp)
 */
export async function getChatMessages(
    sessionId: string,
    schoolId: string
): Promise<ChatMessage[]> {
    if (!isPineconeConfigured()) {
        return []
    }

    try {
        const pinecone = getPinecone()
        const index = pinecone.Index(PINECONE_INDEX_NAME)
        const namespace = getChatHistoryNamespace(schoolId)

        // Query for messages in this session
        const response = await index.namespace(namespace).query({
            vector: getSessionVector(),
            topK: 1000, // Get all messages
            filter: {
                type: { $eq: 'message' },
                sessionId: { $eq: sessionId }
            },
            includeMetadata: true
        })

        // Transform and sort by timestamp
        const messages = response.matches
            .map(match => ({
                id: match.id,
                sessionId: match.metadata?.sessionId as string,
                role: match.metadata?.role as 'user' | 'assistant',
                content: match.metadata?.content as string,
                timestamp: match.metadata?.timestamp as string,
                toolName: match.metadata?.toolName as string || undefined
            }))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

        console.log(`📝 Retrieved ${messages.length} messages for session ${sessionId}`)
        return messages
    } catch (error) {
        console.error('❌ Failed to get chat messages:', error)
        return []
    }
}
