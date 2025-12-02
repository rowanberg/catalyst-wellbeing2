import { z } from 'zod'
import { apiClient } from '../utils/api-client.js'
import { SchoolIdSchema, SendEmailInputSchema, SendNotificationInputSchema, BroadcastMessageInputSchema } from '../utils/schemas.js'
import { createConfirmationResponse } from '../utils/confirmation.js'

// ============================================
// Tool Definitions: Communication (4 tools)
// ============================================

/**
 * Tool 1: Send Email
 * Send email to specific recipients (requires confirmation)
 */
export const sendEmail = {
    name: 'sendEmail',
    description: 'Send an email to specific recipients. Requires user confirmation before sending.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            to: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of recipient email addresses',
            },
            subject: {
                type: 'string',
                description: 'Email subject',
            },
            body: {
                type: 'string',
                description: 'Email body content',
            },
            cc: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of CC email addresses (optional)',
            },
        },
        required: ['school_id', 'to', 'subject', 'body'],
    },

    async execute(args: z.infer<typeof SendEmailInputSchema>) {
        const validated = SendEmailInputSchema.parse(args)

        const confirmation = createConfirmationResponse(
            {
                action: 'Send Email',
                target: `${validated.to.length} recipient(s)`,
                changes: [
                    { field: 'Recipients', oldValue: null, newValue: validated.to.join(', ') },
                    { field: 'Subject', oldValue: null, newValue: validated.subject },
                    { field: 'CC', oldValue: null, newValue: validated.cc?.join(', ') || '(none)' },
                ],
                warning: 'Email will be sent immediately upon confirmation.',
            },
            { action: 'sendEmail', args: validated }
        )

        return confirmation
    },

    async executeConfirmed(args: z.infer<typeof SendEmailInputSchema>) {
        try {
            const result = await apiClient.post('/communications/email', args)

            return {
                success: true,
                message: `✅ Successfully sent email to ${args.to.length} recipient(s)`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to send email',
            }
        }
    },
}

/**
 * Tool 2: Send Notification
 * Send push notification to specific users (requires confirmation)
 */
export const sendNotification = {
    name: 'sendNotification',
    description: 'Send push notification to specific users. Requires user confirmation before sending.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            user_ids: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of user UUIDs to notify',
            },
            title: {
                type: 'string',
                description: 'Notification title',
            },
            body: {
                type: 'string',
                description: 'Notification body message',
            },
            data: {
                type: 'object',
                description: 'Additional data payload (optional)',
            },
        },
        required: ['school_id', 'user_ids', 'title', 'body'],
    },

    async execute(args: z.infer<typeof SendNotificationInputSchema>) {
        const validated = SendNotificationInputSchema.parse(args)

        const confirmation = createConfirmationResponse(
            {
                action: 'Send Push Notification',
                target: `${validated.user_ids.length} user(s)`,
                changes: [
                    { field: 'Title', oldValue: null, newValue: validated.title },
                    { field: 'Body', oldValue: null, newValue: validated.body },
                    { field: 'Recipients', oldValue: null, newValue: `${validated.user_ids.length} users` },
                ],
                warning: 'Push notification will be sent immediately upon confirmation.',
            },
            { action: 'sendNotification', args: validated }
        )

        return confirmation
    },

    async executeConfirmed(args: z.infer<typeof SendNotificationInputSchema>) {
        try {
            const result = await apiClient.post('/notifications/send', args)

            return {
                success: true,
                message: `✅ Successfully sent notification to ${args.user_ids.length} user(s)`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to send notification',
            }
        }
    },
}

/**
 * Tool 3: Broadcast to Class
 * Broadcast message to all students in a class (requires confirmation)
 */
export const broadcastToClass = {
    name: 'broadcastToClass',
    description: 'Broadcast a message to all students in a specific class. Requires user confirmation.',

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            class_id: {
                type: 'string',
                description: 'Class UUID identifier',
            },
            message: {
                type: 'string',
                description: 'Message to broadcast',
            },
            priority: {
                type: 'string',
                enum: ['low', 'normal', 'high'],
                description: 'Message priority (default: normal)',
            },
        },
        required: ['school_id', 'class_id', 'message'],
    },

    async execute(args: z.infer<typeof BroadcastMessageInputSchema>) {
        const validated = BroadcastMessageInputSchema.parse(args)

        const confirmation = createConfirmationResponse(
            {
                action: 'Broadcast Message to Class',
                target: `Class ID: ${validated.class_id}`,
                changes: [
                    { field: 'Message', oldValue: null, newValue: validated.message },
                    { field: 'Priority', oldValue: null, newValue: validated.priority || 'normal' },
                ],
                warning: 'All students in this class will receive this message.',
            },
            { action: 'broadcastToClass', args: validated }
        )

        return confirmation
    },

    async executeConfirmed(args: z.infer<typeof BroadcastMessageInputSchema>) {
        try {
            const result = await apiClient.post('/admin/send-message', {
                schoolId: args.school_id,
                classId: args.class_id,
                message: args.message,
                priority: args.priority,
            })

            return {
                success: true,
                message: `✅ Successfully broadcast message to class`,
                data: result,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to broadcast message',
            }
        }
    },
}

/**
 * Tool 4: Broadcast to School
 * Broadcast announcement to entire school (requires confirmation)
 */
export const broadcastToSchool = {
    name: 'broadcastToSchool',
    description: `Broadcast a school-wide announcement to all students and staff. 

IMPORTANT: When the user asks to send an announcement (e.g., "send announcement on tomorrow holiday"), YOU MUST:
1. Automatically generate a professional title based on their request
2. Automatically create well-formatted, professional content
3. DO NOT ask the user for title or content

Title Examples:
- Holiday → "School Holiday Notice - [Date]"
- Meeting → "Parent-Teacher Meeting - [Date]"  
- Event → "[Event Name] - [Date]"
- Exam → "Examination Schedule"

Content Format:
Dear Students, Parents, and Staff,

[Opening about the announcement]

[Key details with bullet points if applicable]
- Date/Time
- Venue/Location  
- Instructions

[Closing with action items if needed]

Best regards,
[Author Name]
School Administration

Requires user confirmation before sending.`,

    inputSchema: {
        type: 'object',
        properties: {
            school_id: {
                type: 'string',
                description: 'School UUID identifier',
            },
            title: {
                type: 'string',
                description: 'Announcement title',
            },
            content: {
                type: 'string',
                description: 'Announcement content',
            },
            priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'urgent'],
                description: 'Announcement priority (default: medium)',
            },
            author_id: {
                type: 'string',
                description: 'User UUID of the author',
            },
            author_name: {
                type: 'string',
                description: 'Name of the author',
            },
        },
        required: ['school_id', 'title', 'content'],
    },

    async execute(args: { school_id: string; title: string; content: string; priority?: string; author_id?: string; author_name?: string }) {
        const confirmation = createConfirmationResponse(
            {
                action: 'School-Wide Announcement',
                target: 'All Students and Staff',
                changes: [
                    { field: 'Title', oldValue: null, newValue: args.title },
                    { field: 'Content', oldValue: null, newValue: args.content.substring(0, 100) + '...' },
                    { field: 'Priority', oldValue: null, newValue: args.priority || 'medium' },
                    { field: 'Author', oldValue: null, newValue: args.author_name || 'Admin' },
                ],
                warning: 'This announcement will be visible to ALL users in the school.',
            },
            { action: 'broadcastToSchool', args }
        )

        return confirmation
    },

    async executeConfirmed(args: { school_id: string; title: string; content: string; priority?: string; author_id?: string; author_name?: string }) {
        try {
            const { supabaseAdmin } = await import('../utils/supabase.js')

            const announcementData = {
                school_id: args.school_id,
                title: args.title,
                content: args.content,
                priority: args.priority || 'medium', // Changed from 'normal' to 'medium'
                author_id: args.author_id, // Can be null if not provided
                author_name: args.author_name || 'Admin',
                is_active: true,
                created_at: new Date().toISOString(),
                target_audience: 'all'
            }

            const { data, error } = await supabaseAdmin
                .from('school_announcements')
                .insert(announcementData)
                .select()
                .single()

            if (error) {
                throw new Error(error.message)
            }

            return {
                success: true,
                message: `✅ Successfully broadcast school-wide announcement`,
                data: data,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to broadcast announcement',
            }
        }
    },
}

// Export all communication tools
export const communicationTools = [
    sendEmail,
    sendNotification,
    broadcastToClass,
    broadcastToSchool,
]
