import axios, { AxiosInstance, AxiosError } from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const CATALYST_API_URL = process.env.CATALYST_API_URL || 'http://localhost:3000/api'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export interface ApiClientConfig {
    baseURL?: string
    timeout?: number
    headers?: Record<string, string>
}

class ApiClient {
    private client: AxiosInstance

    constructor(config: ApiClientConfig = {}) {
        this.client = axios.create({
            baseURL: config.baseURL || CATALYST_API_URL,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                ...config.headers,
            },
        })

        // Request interceptor (logging removed to avoid MCP parse errors)
        this.client.interceptors.request.use(
            (config) => {
                // Silent - no console output
                return config
            },
            (error) => {
                return Promise.reject(error)
            }
        )

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => {
                // Silent - no console output
                return response
            },
            (error: AxiosError) => {
                // Only log actual errors to stderr (not parsed by MCP)
                if (error.response) {
                    console.error(
                        `[API Error] ${error.response.status} ${error.config?.url}`,
                        error.response.data
                    )
                }
                return Promise.reject(this.formatError(error))
            }
        )
    }

    private formatError(error: AxiosError): Error {
        if (error.response) {
            const data = error.response.data as any
            return new Error(
                data?.error || data?.message || `API Error: ${error.response.status}`
            )
        } else if (error.request) {
            return new Error('No response from server. Please check if the API is running.')
        } else {
            return new Error(error.message || 'Unknown API error')
        }
    }

    async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
        const response = await this.client.get<T>(url, { params })
        return response.data
    }

    async post<T = any>(url: string, data?: any, params?: Record<string, any>): Promise<T> {
        const response = await this.client.post<T>(url, data, { params })
        return response.data
    }

    async put<T = any>(url: string, data?: any): Promise<T> {
        const response = await this.client.put<T>(url, data)
        return response.data
    }

    async patch<T = any>(url: string, data?: any): Promise<T> {
        const response = await this.client.patch<T>(url, data)
        return response.data
    }

    async delete<T = any>(url: string, params?: Record<string, any>): Promise<T> {
        const response = await this.client.delete<T>(url, { params })
        return response.data
    }
}

export const apiClient = new ApiClient()
