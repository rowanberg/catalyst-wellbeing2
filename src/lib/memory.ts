import { getPinecone, PINECONE_INDEX_NAME, isPineconeConfigured } from './pinecone'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeminiApiGovernance } from './gemini-api-governance'

const governanceUrl = process.env.GEMINI_GOVERNANCE_URL
const governanceKey = process.env.GEMINI_GOVERNANCE_ANON_KEY

interface Message {
    role: 'user' | 'assistant' | 'model'
    content: string
}

export async function getEmbeddings(text: string): Promise<number[]> {
    if (!governanceUrl || !governanceKey) {
        throw new Error('Gemini governance not configured')
    }

    const governance = new GeminiApiGovernance({
        governanceUrl,
        governanceKey
    })

    // Get a key specifically for embeddings (using Flash for higher limits)
    const { api_key } = await governance.getAvailableKey('gemini_2_5_flash', 100)

    const genAI = new GoogleGenerativeAI(api_key)
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })

    const result = await model.embedContent(text)
    const embedding = result.embedding.values // 768 dimensions from text-embedding-004

    // Pad to 1024 dimensions to match existing Pinecone index
    // Fill with zeros to reach 1024 dimensions
    const paddedEmbedding = new Array(1024).fill(0)
    for (let i = 0; i < embedding.length && i < 1024; i++) {
        paddedEmbedding[i] = embedding[i]
    }

    return paddedEmbedding // Returns 1024-dimensional vector
}

/**
 * Store conversation in Pinecone with school-specific isolation
 * Uses namespaces to completely separate data between schools
 */
export async function storeConversation(userId: string, schoolId: string, messages: Message[]) {
    if (!isPineconeConfigured()) {
        console.log('📝 Pinecone not configured, skipping memory storage')
        return
    }

    try {
        const pinecone = getPinecone()
        const index = pinecone.Index(PINECONE_INDEX_NAME)

        // Use school-specific namespace for complete data isolation
        const namespace = `school-${schoolId}`

        // Store both user questions and AI responses
        const conversationId = `${userId}-${Date.now()}`
        const vectors: Array<{
            id: string
            values: number[]
            metadata: Record<string, any>
        }> = []

        // Get the last user message and assistant response
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
        const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant' || m.role === 'model')

        // Store user message
        if (lastUserMessage) {
            const userEmbedding = await getEmbeddings(lastUserMessage.content)
            vectors.push({
                id: `${conversationId}-user`,
                values: userEmbedding,
                metadata: {
                    userId,
                    schoolId,
                    conversationId,
                    text: lastUserMessage.content,
                    role: 'user',
                    timestamp: new Date().toISOString()
                }
            })
        }

        // Store assistant response (for context of what AI has said before)
        if (lastAssistantMessage) {
            const assistantEmbedding = await getEmbeddings(lastAssistantMessage.content)
            vectors.push({
                id: `${conversationId}-assistant`,
                values: assistantEmbedding,
                metadata: {
                    userId,
                    schoolId,
                    conversationId,
                    text: lastAssistantMessage.content,
                    role: 'assistant',
                    timestamp: new Date().toISOString()
                }
            })
        }

        if (vectors.length > 0) {
            await index.namespace(namespace).upsert(vectors)
            console.log(`✅ Conversation stored in memory for school ${schoolId} (${vectors.length} vectors)`)
        }
    } catch (error) {
        console.warn('⚠️ Failed to store conversation in memory:', error)
    }
}

/**
 * Retrieve relevant context for a query within a specific school
 * Only returns memories from the same school
 */
export async function getRelevantContext(userId: string, schoolId: string, query: string): Promise<string[]> {
    if (!isPineconeConfigured()) {
        console.log('🧠 Pinecone not configured, skipping memory retrieval')
        return []
    }

    try {
        const pinecone = getPinecone()
        const index = pinecone.Index(PINECONE_INDEX_NAME)

        // Use school-specific namespace
        const namespace = `school-${schoolId}`
        const embedding = await getEmbeddings(query)

        const queryResponse = await index.namespace(namespace).query({
            vector: embedding,
            topK: 5,
            filter: { userId: userId }, // Additional filter for user-specific memories
            includeMetadata: true
        })

        const contexts = queryResponse.matches
            .filter(match => match.score && match.score > 0.7) // Only relevant matches
            .map(match => {
                const role = match.metadata?.role === 'user' ? 'User asked' : 'AI responded'
                return `${role}: ${match.metadata?.text}`
            })
            .filter(Boolean)

        if (contexts.length > 0) {
            console.log(`🧠 Retrieved ${contexts.length} relevant memories for school ${schoolId}`)
        }

        return contexts
    } catch (error) {
        console.warn('⚠️ Failed to retrieve context from memory:', error)
        return []
    }
}

/**
 * Get all relevant memories for a school (admin feature)
 * Useful for understanding what users in a school are asking about
 */
export async function getSchoolMemories(schoolId: string, query: string, topK: number = 10): Promise<string[]> {
    if (!isPineconeConfigured()) {
        return []
    }

    try {
        const pinecone = getPinecone()
        const index = pinecone.Index(PINECONE_INDEX_NAME)

        const namespace = `school-${schoolId}`
        const embedding = await getEmbeddings(query)

        const queryResponse = await index.namespace(namespace).query({
            vector: embedding,
            topK,
            includeMetadata: true
        })

        return queryResponse.matches
            .filter(match => match.score && match.score > 0.6)
            .map(match => match.metadata?.text as string)
            .filter(Boolean)
    } catch (error) {
        console.warn('⚠️ Failed to retrieve school memories:', error)
        return []
    }
}

/**
 * Clear all memories for a specific user in a school
 */
export async function clearUserMemories(userId: string, schoolId: string): Promise<void> {
    if (!isPineconeConfigured()) {
        return
    }

    try {
        const pinecone = getPinecone()
        const index = pinecone.Index(PINECONE_INDEX_NAME)

        const namespace = `school-${schoolId}`

        // Delete all vectors for this user
        await index.namespace(namespace).deleteMany({
            filter: { userId }
        })

        console.log(`🗑️ Cleared memories for user ${userId} in school ${schoolId}`)
    } catch (error) {
        console.warn('⚠️ Failed to clear user memories:', error)
    }
}
