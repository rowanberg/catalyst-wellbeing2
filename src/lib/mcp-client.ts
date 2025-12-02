import { spawn, ChildProcess } from 'child_process'
import path from 'path'

interface MCPTool {
    name: string
    description: string
    inputSchema: {
        type: string
        properties: Record<string, any>
        required?: string[]
    }
}

interface MCPToolResult {
    content: Array<{ type: string; text: string }>
    isError?: boolean
    needsConfirmation?: boolean
    confirmationId?: string
}

interface PendingConfirmation {
    id: string
    tool: string
    arguments: any
    timestamp: string
}

class MCPClient {
    private static instance: MCPClient | null = null
    // Trigger reload for server.ts update
    private process: ChildProcess | null = null
    private toolsCache: MCPTool[] | null = null
    private requestQueue: Map<string, { resolve: Function; reject: Function }> = new Map()
    private messageBuffer: string = ''
    private requestIdCounter: number = 0
    private isConnected: boolean = false

    private constructor() { }

    static getInstance(): MCPClient {
        if (!MCPClient.instance) {
            MCPClient.instance = new MCPClient()
        }
        return MCPClient.instance
    }

    async connect(): Promise<void> {
        if (this.isConnected && this.process) {
            return
        }

        const mcpServerPath = path.join(process.cwd(), 'mcp-server', 'src', 'server.ts')

        // Windows compatibility: use shell: true so npx.cmd is found
        this.process = spawn('npx', ['tsx', mcpServerPath], {
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env },
            shell: true
        })

        if (!this.process.stdout || !this.process.stdin) {
            throw new Error('Failed to create MCP process stdio streams')
        }

        this.process.stdout.on('data', (data: Buffer) => {
            this.messageBuffer += data.toString()
            this.processMessages()
        })

        this.process.stderr?.on('data', (data: Buffer) => {
            console.error('MCP Server Error:', data.toString())
        })

        this.process.on('error', (error) => {
            console.error('MCP Process Error:', error)
            this.isConnected = false
        })

        this.process.on('exit', (code) => {
            console.warn('MCP Process Exited:', code)
            this.isConnected = false
            this.process = null
        })

        this.isConnected = true
        console.log('✅ MCP Server connected')
    }

    private processMessages(): void {
        const lines = this.messageBuffer.split('\n')
        this.messageBuffer = lines.pop() || ''

        for (const line of lines) {
            if (!line.trim()) continue

            try {
                const message = JSON.parse(line)

                if (message.id !== undefined && this.requestQueue.has(message.id)) {
                    const { resolve, reject } = this.requestQueue.get(message.id)!
                    this.requestQueue.delete(message.id)

                    if (message.error) {
                        reject(new Error(message.error.message || 'MCP Error'))
                    } else {
                        resolve(message.result)
                    }
                }
            } catch (error) {
                console.error('Failed to parse MCP message:', line, error)
            }
        }
    }

    private async sendRequest(method: string, params?: any): Promise<any> {
        if (!this.isConnected || !this.process?.stdin) {
            await this.connect()
        }

        const id = `req-${this.requestIdCounter++}`
        const request = {
            jsonrpc: '2.0',
            id,
            method,
            params: params || {}
        }

        return new Promise((resolve, reject) => {
            this.requestQueue.set(id, { resolve, reject })

            setTimeout(() => {
                if (this.requestQueue.has(id)) {
                    this.requestQueue.delete(id)
                    reject(new Error('MCP request timeout'))
                }
            }, 30000)

            this.process!.stdin!.write(JSON.stringify(request) + '\n')
        })
    }

    async listTools(): Promise<MCPTool[]> {
        if (this.toolsCache && this.toolsCache.length > 0) {
            return this.toolsCache
        }

        const result = await this.sendRequest('tools/list')
        this.toolsCache = result.tools || []
        console.log(`📋 Loaded ${this.toolsCache?.length || 0} MCP tools`)
        return this.toolsCache || []
    }

    async callTool(name: string, args: any): Promise<MCPToolResult> {
        const result = await this.sendRequest('tools/call', {
            name,
            arguments: args
        })
        return result
    }

    async getPendingConfirmations(): Promise<PendingConfirmation[]> {
        const result = await this.sendRequest('confirmations/list')
        return result.confirmations || []
    }

    async executeConfirmed(confirmationId: string): Promise<MCPToolResult> {
        const result = await this.sendRequest('confirmations/execute', {
            confirmationId
        })
        return result
    }

    async rejectConfirmation(confirmationId: string): Promise<void> {
        await this.sendRequest('confirmations/reject', {
            confirmationId
        })
    }

    toGeminiFunctions(): any[] {
        if (!this.toolsCache || this.toolsCache.length === 0) {
            return []
        }

        return this.toolsCache.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema
        }))
    }

    async disconnect(): Promise<void> {
        if (this.process) {
            this.process.kill()
            this.process = null
            this.isConnected = false
            this.toolsCache = null
            console.log('🔌 MCP Server disconnected')
        }
    }
}

export const mcpClient = MCPClient.getInstance()

if (typeof process !== 'undefined') {
    process.on('SIGINT', async () => {
        await mcpClient.disconnect()
        process.exit(0)
    })

    process.on('SIGTERM', async () => {
        await mcpClient.disconnect()
        process.exit(0)
    })
}
