import { Pinecone } from '@pinecone-database/pinecone'

let pineconeInstance: Pinecone | null = null

export function getPinecone(): Pinecone {
    if (!process.env.PINECONE_API_KEY) {
        throw new Error('PINECONE_API_KEY is not set in environment variables')
    }

    if (!pineconeInstance) {
        pineconeInstance = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        })
    }

    return pineconeInstance
}

export const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'catalyst-memory'

export function isPineconeConfigured(): boolean {
    return !!process.env.PINECONE_API_KEY
}
