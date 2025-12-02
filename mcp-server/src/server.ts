#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from '@modelcontextprotocol/sdk/types.js'
import dotenv from 'dotenv'

// Import all tool collections
import { dashboardTools } from './tools/dashboard-tools.js'
import { studentTools } from './tools/student-tools.js'
import { attendanceTools } from './tools/attendance-tools.js'
import { classTools } from './tools/class-tools.js'
import { teacherTools } from './tools/teacher-tools.js'
import { communicationTools } from './tools/communication-tools.js'
import { securityTools } from './tools/security-tools.js'
import { systemTools } from './tools/system-tools.js'
import { adminTools } from './tools/admin-tools.js'

// Load environment variables
dotenv.config()

// ============================================
// MCP Server Setup
// ============================================

const server = new Server(
    {
        name: 'catalystwells-admin-mcp',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
)

// Combine all tools into a single registry
const allTools = [
    ...dashboardTools,
    ...studentTools,
    ...attendanceTools,
    ...classTools,
    ...teacherTools,
    ...communicationTools,
    ...securityTools,
    ...systemTools,
    ...adminTools,
]

// Create a map for quick tool lookup
const toolMap = new Map(allTools.map((tool) => [tool.name, tool]) as any)

// Store pending confirmations (in production, use Redis or similar)
const pendingConfirmations = new Map<string, any>()

console.error('🚀 CatalystWells Admin MCP Server')
console.error(`📊 Registered ${allTools.length} tools across 8 categories:`)
console.error(`   • Dashboard: ${dashboardTools.length} tools`)
console.error(`   • Students: ${studentTools.length} tools`)
console.error(`   • Attendance: ${attendanceTools.length} tools`)
console.error(`   • Classes: ${classTools.length} tools`)
console.error(`   • Teachers: ${teacherTools.length} tools`)
console.error(`   • Communication: ${communicationTools.length} tools`)
console.error(`   • Security: ${securityTools.length} tools`)
console.error(`   • Admin: ${adminTools.length} tools`)
console.error('')

// ============================================
// List Tools Handler
// ============================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = allTools.map((tool: any) => ({

        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
    }))

    return { tools }
})

// ============================================
// Call Tool Handler
// ============================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    console.error(`📞 Tool called: ${name}`)
    console.error(`📝 Arguments:`, JSON.stringify(args, null, 2))

    // Handle confirmation responses
    if (name === 'confirm' || name === 'accept') {
        return handleConfirmation(args, true)
    }
    if (name === 'decline' || name === 'cancel') {
        return handleConfirmation(args, false)
    }

    // Get the tool from registry
    const tool = toolMap.get(name)

    if (!tool) {
        console.error(`❌ Tool not found: ${name}`)
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: `Tool '${name}' not found`,
                    }),
                },
            ],
        }
    }

    try {
        // Execute the tool
        const result = await (tool as any).execute(args)

        // Check if this is a confirmation request
        if (result && result.requiresConfirmation) {

            // Store pending action
            const confirmationId = generateConfirmationId()
            pendingConfirmations.set(confirmationId, {
                tool: name,
                args,
                pendingAction: result.pendingAction,
                timestamp: Date.now(),
            })

            console.error(`⏸️  Confirmation required for ${name}`)
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            requiresConfirmation: true,
                            confirmationId,
                            message: result.confirmationMessage,
                            request: result.request // Include the structured request data
                        }),
                    },
                ],
            }
        }

        // Regular tool response
        console.error(`✅ Tool executed successfully: ${name}`)
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result),
                },
            ],
        }
    } catch (error: any) {
        console.error(`❌ Tool execution error: ${name}`, error)
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message || 'Tool execution failed',
                    }),
                },
            ],
        }
    }
})

// ============================================
// Confirmation Handler
// ============================================

async function handleConfirmation(args: any, accepted: boolean) {
    const confirmationId = args.confirmationId

    if (!confirmationId) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'No confirmation ID provided',
                    }),
                },
            ],
        }
    }

    const pending = pendingConfirmations.get(confirmationId)

    if (!pending) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Invalid or expired confirmation ID',
                    }),
                },
            ],
        }
    }

    // Remove from pending
    pendingConfirmations.delete(confirmationId)

    if (!accepted) {
        console.error(`❌ Confirmation declined for ${pending.tool}`)
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        message: `Action cancelled: ${pending.tool}`,
                    }),
                },
            ],
        }
    }

    // Execute the confirmed action
    const tool = toolMap.get(pending.tool)

    if (!tool || !(tool as any).executeConfirmed) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: 'Tool does not support confirmation',
                    }),
                },
            ],
        }
    }

    try {
        console.error(`✅ Confirmation accepted, executing: ${pending.tool}`)
        const result = await (tool as any).executeConfirmed(pending.args)

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result),
                },
            ],
        }
    } catch (error: any) {
        console.error(`❌ Confirmed execution failed: ${pending.tool}`, error)
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message || 'Execution failed',
                    }),
                },
            ],
        }
    }
}

// ============================================
// Utility Functions
// ============================================

function generateConfirmationId(): string {
    return `confirm_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

// Cleanup old confirmations (older than 5 minutes)
setInterval(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    pendingConfirmations.forEach((pending, id) => {
        if (pending.timestamp < fiveMinutesAgo) {
            pendingConfirmations.delete(id)
            console.error(`🧹 Cleaned up expired confirmation: ${id}`)
        }
    })
}, 60 * 1000) // Run every minute

// ============================================
// Start Server
// ============================================

async function main() {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('✅ MCP Server ready and listening on stdio')
    console.error('⚡ Waiting for tool requests...')
}

main().catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
})
