/**
 * Gemini 3 Pro Integration for Admin AI Assistant
 * Located at: http://localhost:3000/admin/ai-assistant
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeminiApiGovernance } from '@/lib/gemini-api-governance'

// Initialize governance client
const governance = new GeminiApiGovernance({
    governanceUrl: process.env.GEMINI_GOVERNANCE_URL!,
    governanceKey: process.env.GEMINI_GOVERNANCE_ANON_KEY!,
})

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface GeminiResponse {
    text: string
    tokensUsed: number
    success: boolean
}

/**
 * Call Gemini 3 Pro with automatic API key management
 */
export async function callGemini3Pro(
    messages: ChatMessage[],
    systemPrompt?: string
): Promise<GeminiResponse> {
    try {
        // Get available API key from governance service
        const { api_key } = await governance.getAvailableKey('gemini_3_pro', 500)

        // Initialize Gemini with the selected key
        const genAI = new GoogleGenerativeAI(api_key)
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp', // Gemini 3 Pro model name
        })

        // Build conversation history
        const conversationHistory = messages.map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }))

        // Start chat with history
        const chat = model.startChat({
            history: conversationHistory.slice(0, -1), // All except last message
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7,
                topP: 0.9,
                topK: 40,
            },
            systemInstruction: systemPrompt,
        })

        // Send last message
        const lastMessage = messages[messages.length - 1]
        const result = await chat.sendMessage(lastMessage.content)
        const response = result.response
        const text = response.text()

        // Get token usage
        const tokensUsed = response.usageMetadata?.totalTokenCount || 0

        // Log usage to governance service
        await governance.logUsage({
            api_key,
            model: 'gemini_3_pro',
            tokens_used: tokensUsed,
            success: true,
        }).catch(console.error) // Don't fail  if logging fails

        return {
            text,
            tokensUsed,
            success: true,
        }
    } catch (error: any) {
        console.error('Gemini 3 Pro error:', error)
        return {
            text: 'Sorry, I encountered an error processing your request.',
            tokensUsed: 0,
            success: false,
        }
    }
}

/**
 * Helper: Call with automatic logging (most convenient)
 */
export async function chatWithGemini(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    systemPrompt?: string
): Promise<string> {
    const messages: ChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: userMessage },
    ]

    const response = await callGemini3Pro(messages, systemPrompt)
    return response.text
}

/**
 * Example usage in admin AI assistant API route:
 * 
 * // app/api/admin/ai-chat/route.ts
 * import { chatWithGemini } from '@/lib/gemini-integration'
 * 
 * export async function POST(req: Request) {
 *   const { message, history } = await req.json()
 *   
 *   const systemPrompt = `You are an AI assistant for CatalystWells Admin Dashboard.
 *   Help administrators manage students, attendance, and wellbeing data.`
 *   
 *   const response = await chatWithGemini(message, history, systemPrompt)
 *   
 *   return Response.json({ response })
 * }
 */
