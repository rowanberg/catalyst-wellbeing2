import { z } from 'zod'

export const systemTools = [
    {
        name: 'confirm',
        description: 'Confirm and execute a pending action that required approval. Use this when the user says "yes", "approve", "confirm", or "send it" after a confirmation request.',
        inputSchema: {
            type: 'object',
            properties: {
                confirmationId: {
                    type: 'string',
                    description: 'The ID of the pending confirmation to execute',
                },
            },
            required: ['confirmationId'],
        },
        execute: async (args: { confirmationId: string }) => {
            // This is a placeholder. The actual execution logic is handled in the server.ts
            // by intercepting the tool name 'confirm'.
            // This definition exists solely to make the tool visible to the AI.
            return {
                content: [
                    {
                        type: 'text',
                        text: `Confirmation ${args.confirmationId} processed.`,
                    },
                ],
            }
        },
    },
    {
        name: 'reject',
        description: 'Reject and cancel a pending action. Use this when the user says "no", "cancel", "reject", or "don\'t send" after a confirmation request.',
        inputSchema: {
            type: 'object',
            properties: {
                confirmationId: {
                    type: 'string',
                    description: 'The ID of the pending confirmation to cancel',
                },
                reason: {
                    type: 'string',
                    description: 'Optional reason for rejection',
                },
            },
            required: ['confirmationId'],
        },
        execute: async (args: { confirmationId: string; reason?: string }) => {
            // Placeholder, handled in server.ts
            return {
                content: [
                    {
                        type: 'text',
                        text: `Confirmation ${args.confirmationId} rejected.`,
                    },
                ],
            }
        },
    },
]
